import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { listContacts, type MarketingContact } from "./marketing";
import {
  describeAudience,
  matchesAudience,
  parseAudience,
  type Audience,
} from "./audience";
import { buildEmail, type EmailSettings } from "./email-template";
import { brevoConfigured, sendBatch, type Message } from "./brevo";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export type Campaign = {
  id: number;
  subject: string;
  headline: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  hasImage: boolean;
  imageMime: string;
  audience: Audience;
  audienceLabel: string;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  sendError: string;
  createdBy: string;
  createdAt: string;
  clickedPeople: number;
  totalClicks: number;
};

const toStatus = (value: unknown): CampaignStatus =>
  value === "scheduled" || value === "sending" || value === "sent"
    ? value
    : "draft";

const toCampaign = (row: Record<string, unknown>): Campaign => {
  const audience = parseAudience(row.audience);
  return {
    id: Number(row.id),
    subject: String(row.subject ?? ""),
    headline: String(row.headline ?? ""),
    body: String(row.body ?? ""),
    buttonText: String(row.button_text ?? ""),
    buttonUrl: String(row.button_url ?? ""),
    hasImage: Boolean(row.has_image),
    imageMime: String(row.image_mime ?? ""),
    audience,
    audienceLabel: describeAudience(audience),
    status: toStatus(row.status),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    sentAt: row.sent_at ? String(row.sent_at) : null,
    sentCount: Number(row.sent_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    sendError: String(row.send_error ?? ""),
    createdBy: String(row.created_by ?? ""),
    createdAt: String(row.created_at ?? ""),
    clickedPeople: Number(row.clicked_people ?? 0),
    totalClicks: Number(row.total_clicks ?? 0),
  };
};

/** The list, with click figures rolled up per campaign. */
export async function listCampaigns(): Promise<Campaign[]> {
  try {
    const result = await db.execute(`
      SELECT c.id, c.subject, c.headline, c.body, c.button_text, c.button_url,
             c.image_data IS NOT NULL AS has_image, c.image_mime, c.audience,
             c.status, c.scheduled_at, c.sent_at, c.sent_count, c.failed_count,
             c.send_error, c.created_by, c.created_at,
             (SELECT COUNT(*) FROM campaign_recipients r
               WHERE r.campaign_id = c.id AND r.clicks > 0) AS clicked_people,
             (SELECT COALESCE(SUM(r.clicks), 0) FROM campaign_recipients r
               WHERE r.campaign_id = c.id) AS total_clicks
      FROM campaigns c
      ORDER BY c.created_at DESC, c.id DESC`);
    return result.rows.map((row) => toCampaign(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getCampaign(id: number): Promise<Campaign | null> {
  const result = await db.execute({
    sql: `SELECT *, image_data IS NOT NULL AS has_image FROM campaigns WHERE id = ? LIMIT 1`,
    args: [id],
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? toCampaign(row) : null;
}

export type CampaignInput = {
  subject?: unknown;
  headline?: unknown;
  body?: unknown;
  buttonText?: unknown;
  buttonUrl?: unknown;
  audience?: unknown;
  imageBase64?: unknown;
  imageMime?: unknown;
  removeImage?: unknown;
};

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 1_500_000;

/** Checks the real bytes, not the name or the declared type. */
export function sniffImageMime(bytes: Uint8Array): string {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return "";
}

function decodeImage(input: CampaignInput): { data: Buffer; mime: string } | null {
  const raw = String(input.imageBase64 ?? "");
  if (!raw) return null;
  const base64 = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
  const data = Buffer.from(base64, "base64");
  if (!data.length) throw new Error("That image could not be read.");
  if (data.length > MAX_IMAGE_BYTES) {
    throw new Error("The offer image must be 1.5 MB or smaller.");
  }
  const mime = sniffImageMime(new Uint8Array(data.subarray(0, 16)));
  if (!ALLOWED_IMAGE.includes(mime)) {
    throw new Error("The offer image must be a JPG, PNG or WEBP file.");
  }
  return { data, mime };
}

export async function createCampaign(
  input: CampaignInput,
  createdBy: string,
): Promise<number> {
  const subject = String(input.subject ?? "").trim();
  if (!subject) throw new Error("A subject is required");
  const image = decodeImage(input);
  const result = await db.execute({
    sql: `INSERT INTO campaigns
            (subject, headline, body, button_text, button_url, image_data,
             image_mime, audience, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    args: [
      subject,
      String(input.headline ?? "").trim(),
      String(input.body ?? ""),
      String(input.buttonText ?? "").trim(),
      String(input.buttonUrl ?? "").trim(),
      image ? image.data : null,
      image ? image.mime : "",
      JSON.stringify(parseAudience(input.audience)),
      createdBy,
    ],
  });
  return Number(result.lastInsertRowid ?? 0);
}

export async function updateCampaign(id: number, input: CampaignInput): Promise<void> {
  const existing = await getCampaign(id);
  if (!existing) throw new Error("That promotion no longer exists");
  if (existing.status !== "draft") {
    throw new Error("Only drafts can be edited. Cancel the schedule first.");
  }
  const subject = String(input.subject ?? "").trim();
  if (!subject) throw new Error("A subject is required");
  const image = decodeImage(input);

  await db.execute({
    sql: `UPDATE campaigns
          SET subject = ?, headline = ?, body = ?, button_text = ?, button_url = ?,
              audience = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      subject,
      String(input.headline ?? "").trim(),
      String(input.body ?? ""),
      String(input.buttonText ?? "").trim(),
      String(input.buttonUrl ?? "").trim(),
      JSON.stringify(parseAudience(input.audience)),
      id,
    ],
  });

  if (image) {
    await db.execute({
      sql: "UPDATE campaigns SET image_data = ?, image_mime = ? WHERE id = ?",
      args: [image.data, image.mime, id],
    });
  } else if (input.removeImage) {
    await db.execute({
      sql: "UPDATE campaigns SET image_data = NULL, image_mime = '' WHERE id = ?",
      args: [id],
    });
  }
}

export async function deleteCampaign(id: number): Promise<void> {
  await db.execute({
    sql: "DELETE FROM campaign_recipients WHERE campaign_id = ?",
    args: [id],
  });
  await db.execute({ sql: "DELETE FROM campaigns WHERE id = ?", args: [id] });
}

/** Duplicates a promotion as a fresh draft, image and audience included. */
export async function copyCampaign(id: number, createdBy: string): Promise<number> {
  const result = await db.execute({
    sql: `INSERT INTO campaigns
            (subject, headline, body, button_text, button_url, image_data,
             image_mime, audience, status, created_by)
          SELECT subject || ' (copy)', headline, body, button_text, button_url,
                 image_data, image_mime, audience, 'draft', ?
          FROM campaigns WHERE id = ?`,
    args: [createdBy, id],
  });
  return Number(result.lastInsertRowid ?? 0);
}

export async function scheduleCampaign(id: number, whenIso: string): Promise<void> {
  const when = new Date(whenIso);
  if (Number.isNaN(when.getTime())) throw new Error("That date and time is not valid");
  const now = Date.now();
  if (when.getTime() < now + 60_000) {
    throw new Error("Choose a time at least a minute from now");
  }
  if (when.getTime() > now + 365 * 24 * 60 * 60 * 1000) {
    throw new Error("Choose a time within the next year");
  }
  const changed = await db.execute({
    sql: `UPDATE campaigns SET status = 'scheduled', scheduled_at = ?, send_error = '',
                               updated_at = datetime('now')
          WHERE id = ? AND status = 'draft'`,
    args: [when.toISOString(), id],
  });
  if (!changed.rowsAffected) {
    throw new Error("Only a draft can be scheduled");
  }
}

export async function cancelSchedule(id: number): Promise<void> {
  const changed = await db.execute({
    sql: `UPDATE campaigns SET status = 'draft', scheduled_at = NULL,
                               updated_at = datetime('now')
          WHERE id = ? AND status = 'scheduled'`,
    args: [id],
  });
  if (!changed.rowsAffected) throw new Error("That promotion is not scheduled");
}

async function emailSettings(): Promise<EmailSettings & { sender: { name: string; email: string } }> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byteflow.ae").replace(/\/+$/, "");
  let businessName = "Byteflow Information Technology";
  let phone = "";
  let email = "";
  let logoUrl = "";
  try {
    const result = await db.execute("SELECT * FROM site_settings WHERE id = 1");
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (row) {
      businessName = String(row.business_name || businessName);
      phone = String(row.header_phone || "");
      email = String(row.primary_email || "");
      const logo = String(row.logo_url || "");
      logoUrl = logo.startsWith("http") ? logo : logo ? `${siteUrl}${logo}` : "";
    }
  } catch {
    // Defaults are fine; a missing settings row must not stop a send.
  }
  const senderEmail = process.env.BREVO_SENDER_EMAIL || email;
  if (!senderEmail) {
    throw new Error(
      "No sender address. Set a primary email in Contact details, or BREVO_SENDER_EMAIL in Vercel.",
    );
  }
  return {
    businessName,
    phone,
    websiteUrl: siteUrl,
    logoUrl,
    sender: { name: businessName, email: senderEmail },
  };
}

const newToken = () => randomBytes(18).toString("base64url");

export async function audienceFor(campaign: Campaign): Promise<MarketingContact[]> {
  const contacts = await listContacts();
  return contacts.filter((contact) =>
    matchesAudience(
      {
        country: contact.country,
        region: contact.region,
        groups: contact.groups,
        optOut: contact.optOut,
      },
      campaign.audience,
    ),
  );
}

/** The public links that go inside an email. */
function links(siteUrl: string) {
  return {
    tracked: (token: string) => `${siteUrl}/api/r/${token}`,
    unsubscribe: (id: number, key: string) =>
      `${siteUrl}/unsubscribe?p=${id}&k=${encodeURIComponent(key)}`,
    oneClick: (id: number, key: string) =>
      `${siteUrl}/api/unsubscribe/one-click?p=${id}&k=${encodeURIComponent(key)}`,
    image: (id: number) => `${siteUrl}/api/campaign-image/${id}`,
  };
}

async function unsubKeyFor(contact: MarketingContact): Promise<string> {
  const result = await db.execute({
    sql: "SELECT unsub_key FROM marketing_contacts WHERE id = ? LIMIT 1",
    args: [contact.id],
  });
  const existing = String(result.rows[0]?.unsub_key ?? "");
  if (existing) return existing;
  const key = randomBytes(24).toString("base64url");
  await db.execute({
    sql: "UPDATE marketing_contacts SET unsub_key = ? WHERE id = ?",
    args: [key, contact.id],
  });
  return key;
}

export type SendReport = {
  sent: number;
  failed: number;
  firstError: string;
  recipients: number;
};

/**
 * Sends a promotion.
 *
 * `from` is the status the campaign must currently be in. Moving it to
 * 'sending' is a conditional update, so two people pressing Send at the same
 * moment — or a scheduled run racing the timer — cannot both proceed: the
 * second one changes no rows and is told so.
 */
export async function sendCampaign(
  id: number,
  from: "draft" | "scheduled",
): Promise<SendReport> {
  if (!brevoConfigured()) {
    throw new Error(
      "BREVO_API_KEY is not set. Add it in Vercel (Production and Preview) and redeploy.",
    );
  }

  const claimed = await db.execute({
    sql: `UPDATE campaigns SET status = 'sending', updated_at = datetime('now')
          WHERE id = ? AND status = ?`,
    args: [id, from],
  });
  if (!claimed.rowsAffected) {
    const current = await getCampaign(id);
    throw Object.assign(
      new Error(
        current?.status === "sending"
          ? "That promotion is already being sent."
          : "That promotion is not ready to send.",
      ),
      { status: 409 },
    );
  }

  try {
    const campaign = await getCampaign(id);
    if (!campaign) throw new Error("That promotion no longer exists");
    const settings = await emailSettings();
    const url = links(settings.websiteUrl);
    const recipients = await audienceFor(campaign);

    if (!recipients.length) {
      await db.execute({
        sql: `UPDATE campaigns SET status = 'draft',
                send_error = 'Nobody matches that audience right now.',
                updated_at = datetime('now') WHERE id = ?`,
        args: [id],
      });
      throw new Error("Nobody matches that audience right now.");
    }

    // One row per person, created before sending so every email carries its
    // own token and clicks can be attributed.
    const messages: Message[] = [];
    for (const contact of recipients) {
      const token = newToken();
      await db.execute({
        sql: `INSERT INTO campaign_recipients (campaign_id, token, contact_id, email, name)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, token, contact.id, contact.email, contact.name],
      });
      const key = await unsubKeyFor(contact);
      const { html, text } = buildEmail(
        {
          headline: campaign.headline,
          body: campaign.body,
          buttonText: campaign.buttonText,
          buttonUrl: campaign.buttonUrl ? url.tracked(token) : "",
          imageUrl: campaign.hasImage ? url.image(campaign.id) : "",
        },
        {
          name: contact.name,
          email: contact.email,
          unsubscribeUrl: url.unsubscribe(contact.id, key),
        },
        settings,
      );
      messages.push({
        to: { email: contact.email, name: contact.name || undefined },
        subject: campaign.subject,
        html,
        text,
        listUnsubscribe: `<${url.oneClick(contact.id, key)}>, <mailto:${settings.sender.email}?subject=unsubscribe>`,
        tag: "promotion",
      });
    }

    const outcome = await sendBatch(messages, settings.sender);

    // Nobody who never received it should count as a possible click.
    for (const email of outcome.failedEmails) {
      await db.execute({
        sql: "DELETE FROM campaign_recipients WHERE campaign_id = ? AND email = ?",
        args: [id, email],
      });
    }

    await db.execute({
      sql: `UPDATE campaigns
            SET status = 'sent', sent_at = datetime('now'), sent_count = ?,
                failed_count = ?, send_error = ?, scheduled_at = NULL,
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [outcome.sent, outcome.failed, outcome.firstError.slice(0, 500), id],
    });

    return {
      sent: outcome.sent,
      failed: outcome.failed,
      firstError: outcome.firstError,
      recipients: recipients.length,
    };
  } catch (error) {
    // A failed send goes back to draft with the reason kept, so it can be
    // looked at and retried rather than being stuck in 'sending'.
    const reason = error instanceof Error ? error.message : "The send failed.";
    await db.execute({
      sql: `UPDATE campaigns SET status = ?, send_error = ?, updated_at = datetime('now')
            WHERE id = ? AND status = 'sending'`,
      args: [from === "scheduled" ? "draft" : "draft", reason.slice(0, 500), id],
    });
    throw error;
  }
}

/** The exact email an admin would receive, for the preview window. */
export async function previewCampaign(id: number): Promise<string> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error("That promotion no longer exists");
  const settings = await emailSettings();
  const url = links(settings.websiteUrl);
  const { html } = buildEmail(
    {
      headline: campaign.headline,
      body: campaign.body,
      buttonText: campaign.buttonText,
      buttonUrl: campaign.buttonUrl,
      imageUrl: campaign.hasImage ? url.image(campaign.id) : "",
    },
    {
      name: "Sample Customer",
      email: "preview@example.com",
      unsubscribeUrl: `${settings.websiteUrl}/unsubscribe`,
    },
    settings,
  );
  return html;
}

/** A single test message to one address. Never click-tracked. */
export async function sendTest(id: number, to: string): Promise<void> {
  if (!brevoConfigured()) {
    throw new Error(
      "BREVO_API_KEY is not set. Add it in Vercel (Production and Preview) and redeploy.",
    );
  }
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error("That promotion no longer exists");
  const settings = await emailSettings();
  const url = links(settings.websiteUrl);
  const { html, text } = buildEmail(
    {
      headline: campaign.headline,
      body: campaign.body,
      buttonText: campaign.buttonText,
      buttonUrl: campaign.buttonUrl,
      imageUrl: campaign.hasImage ? url.image(campaign.id) : "",
    },
    {
      name: "there",
      email: to,
      unsubscribeUrl: `${settings.websiteUrl}/unsubscribe`,
    },
    settings,
  );
  const outcome = await sendBatch(
    [
      {
        to: { email: to },
        subject: `[Test] ${campaign.subject}`,
        html,
        text,
        tag: "promotion-test",
      },
    ],
    settings.sender,
  );
  if (!outcome.sent) {
    throw new Error(outcome.firstError || "The test email could not be sent.");
  }
}

/** Sends whatever is due. Used by the cron endpoint and on opening the tab. */
export async function runDueCampaigns(): Promise<{ ran: number; errors: string[] }> {
  const errors: string[] = [];
  let ran = 0;
  try {
    const due = await db.execute({
      sql: `SELECT id FROM campaigns
            WHERE status = 'scheduled' AND scheduled_at IS NOT NULL
              AND scheduled_at <= ?
            ORDER BY scheduled_at LIMIT 10`,
      args: [new Date().toISOString()],
    });
    for (const row of due.rows) {
      try {
        await sendCampaign(Number(row.id), "scheduled");
        ran += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Send failed");
      }
    }
  } catch {
    // No campaigns table yet, or the database is unreachable.
  }
  return { ran, errors };
}
