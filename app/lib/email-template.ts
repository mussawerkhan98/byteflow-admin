/**
 * Builds the HTML and plain-text bodies of a promotion email.
 *
 * No imports, so it can be tested directly. Every piece of text that an
 * admin typed is escaped before it reaches the HTML, and Brevo's templating
 * delimiters are stripped: an admin who types `{{ params.x }}` into a
 * subject line should see those characters in the email, not have Brevo try
 * to interpret them.
 */

export type EmailSettings = {
  businessName: string;
  phone: string;
  websiteUrl: string;
  logoUrl: string;
};

export type EmailContent = {
  headline: string;
  body: string;
  buttonText: string;
  /** Where the button points once click tracking has rewritten it. */
  buttonUrl: string;
  imageUrl: string;
};

export type EmailRecipient = {
  name: string;
  email: string;
  unsubscribeUrl: string;
};

/** Brevo would otherwise try to interpret these as template syntax. */
export const stripTemplating = (value: string) =>
  String(value ?? "")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/\{%[\s\S]*?%\}/g, "")
    // A lone opening delimiter can still start an expression.
    .replace(/\{\{|\}\}|\{%|%\}/g, "");

export function escapeHtml(value: unknown): string {
  return stripTemplating(String(value ?? ""))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) and mailto survive; anything else becomes the site itself. */
export function safeUrl(value: unknown, fallback = ""): string {
  const raw = stripTemplating(String(value ?? "")).trim();
  if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw)) {
    return raw.replace(/"/g, "%22").replace(/</g, "%3C").replace(/>/g, "%3E");
  }
  return fallback;
}

/**
 * The same URL, ready for an HTML attribute. `&` has to become `&amp;` there,
 * which is exactly what must NOT happen in the plain-text part — so this is a
 * separate step rather than something safeUrl does to every URL.
 */
export const attrUrl = (value: unknown, fallback = "") =>
  safeUrl(value, fallback).replace(/&/g, "&amp;");

/** The name to greet someone by — their first name, or a neutral fallback. */
export function firstName(name: unknown): string {
  const cleaned = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "there";
  return cleaned.split(" ")[0];
}

export const paragraphsOf = (body: unknown) =>
  String(body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export function buildEmail(
  content: EmailContent,
  recipient: EmailRecipient,
  settings: EmailSettings,
): { html: string; text: string } {
  const greeting = escapeHtml(`Dear ${firstName(recipient.name)},`);
  const paragraphs = paragraphsOf(content.body);
  const buttonUrl = safeUrl(content.buttonUrl);
  const buttonHref = attrUrl(content.buttonUrl);
  const imageUrl = safeUrl(content.imageUrl);
  const imageSrc = attrUrl(content.imageUrl);
  const websiteUrl = safeUrl(settings.websiteUrl);
  const websiteHref = attrUrl(settings.websiteUrl);
  const logoUrl = safeUrl(settings.logoUrl);
  const logoSrc = attrUrl(settings.logoUrl);
  const unsubscribeUrl = safeUrl(recipient.unsubscribeUrl);
  const unsubscribeHref = attrUrl(recipient.unsubscribeUrl);
  const showButton = Boolean(content.buttonText && buttonUrl);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(content.headline || settings.businessName)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
${
  logoUrl
    ? `<tr><td align="left" style="padding:24px 32px 8px 32px;">
<img src="${logoSrc}" alt="${escapeHtml(settings.businessName)}" width="132" style="display:block;border:0;max-width:132px;height:auto;">
</td></tr>`
    : `<tr><td align="left" style="padding:24px 32px 8px 32px;font-size:18px;font-weight:bold;color:#0f172a;">${escapeHtml(settings.businessName)}</td></tr>`
}
${
  imageUrl
    ? `<tr><td style="padding:16px 0 0 0;">
${buttonHref ? `<a href="${buttonHref}" style="display:block;">` : ""}
<img src="${imageSrc}" alt="${escapeHtml(content.headline || "Offer")}" width="600" style="display:block;border:0;width:100%;max-width:600px;height:auto;">
${buttonUrl ? `</a>` : ""}
</td></tr>`
    : ""
}
<tr><td style="padding:24px 32px 0 32px;font-size:15px;color:#334155;">${greeting}</td></tr>
${
  content.headline
    ? `<tr><td style="padding:14px 32px 0 32px;font-size:24px;line-height:1.3;font-weight:bold;color:#0f172a;">${escapeHtml(content.headline)}</td></tr>`
    : ""
}
${paragraphs
  .map(
    (paragraph) =>
      `<tr><td style="padding:14px 32px 0 32px;font-size:15px;line-height:1.65;color:#475569;">${escapeHtml(paragraph)}</td></tr>`,
  )
  .join("\n")}
${
  showButton
    ? `<tr><td align="left" style="padding:26px 32px 0 32px;">
<a href="${buttonHref}" style="display:inline-block;background:#2CCDDE;color:#04141a;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:999px;">${escapeHtml(content.buttonText)}</a>
</td></tr>`
    : ""
}
<tr><td style="padding:32px 32px 0 32px;"><hr style="border:0;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
<tr><td style="padding:18px 32px 28px 32px;font-size:12px;line-height:1.7;color:#94a3b8;">
<strong style="color:#64748b;">${escapeHtml(settings.businessName)}</strong><br>
${settings.phone ? `${escapeHtml(settings.phone)}<br>` : ""}
${websiteUrl ? `<a href="${websiteHref}" style="color:#64748b;">${escapeHtml(settings.websiteUrl)}</a><br>` : ""}
<br>
You&#39;re receiving this because you asked to hear about offers from ${escapeHtml(settings.businessName)}.<br>
<a href="${unsubscribeHref}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `Dear ${firstName(recipient.name)},`,
    "",
    content.headline ? stripTemplating(content.headline) : "",
    content.headline ? "" : "",
    ...paragraphs.map((paragraph) => stripTemplating(paragraph)),
    showButton ? "" : "",
    showButton ? `${stripTemplating(content.buttonText)}: ${buttonUrl}` : "",
    "",
    "—",
    stripTemplating(settings.businessName),
    settings.phone ? stripTemplating(settings.phone) : "",
    settings.websiteUrl ? stripTemplating(settings.websiteUrl) : "",
    "",
    `You're receiving this because you asked to hear about offers from ${stripTemplating(settings.businessName)}.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""))
    .join("\n")
    .trim();

  return { html, text };
}
