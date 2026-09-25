import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { resolveCountry } from "./countries";
import {
  isValidEmail,
  mergeGroups,
  parseGroups,
  type ImportCandidate,
} from "./marketing-csv";

export type MarketingContact = {
  id: number;
  email: string;
  name: string;
  phone: string;
  country: string;
  region: string;
  groups: string;
  optOut: boolean;
  source: "manual" | "import";
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = {
  email?: unknown;
  name?: unknown;
  phone?: unknown;
  country?: unknown;
  region?: unknown;
  groups?: unknown;
  optOut?: unknown;
};

const toContact = (row: Record<string, unknown>): MarketingContact => ({
  id: Number(row.id),
  email: String(row.email ?? ""),
  name: String(row.name ?? ""),
  phone: String(row.phone ?? ""),
  country: String(row.country ?? ""),
  region: String(row.region ?? ""),
  groups: String(row.groups ?? ""),
  optOut: Number(row.opt_out) === 1,
  source: row.source === "import" ? "import" : "manual",
  createdAt: String(row.created_at ?? ""),
  updatedAt: String(row.updated_at ?? ""),
});

export const newUnsubKey = () => randomBytes(24).toString("base64url");

export const normaliseEmail = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export async function listContacts(): Promise<MarketingContact[]> {
  try {
    const result = await db.execute(
      "SELECT * FROM marketing_contacts ORDER BY lower(name), email",
    );
    return result.rows.map((row) => toContact(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Every distinct country, region and group currently in the list, with counts. */
export async function contactFacets() {
  const contacts = await listContacts();
  const tally = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  };
  return {
    countries: tally(contacts.map((contact) => contact.country)),
    regions: tally(contacts.map((contact) => contact.region)),
    groups: tally(contacts.flatMap((contact) => parseGroups(contact.groups))),
    total: contacts.length,
    subscribed: contacts.filter((contact) => !contact.optOut).length,
    unsubscribed: contacts.filter((contact) => contact.optOut).length,
  };
}

export async function createContact(input: ContactInput): Promise<MarketingContact> {
  const email = normaliseEmail(input.email);
  if (!isValidEmail(email)) throw new Error("A valid email address is required");
  const phone = String(input.phone ?? "").trim();
  const existing = await db.execute({
    sql: "SELECT id FROM marketing_contacts WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (existing.rows.length) {
    throw new Error("A contact with that email address already exists");
  }
  await db.execute({
    sql: `INSERT INTO marketing_contacts
            (email, name, phone, country, region, groups, opt_out, unsub_key, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual')`,
    args: [
      email,
      String(input.name ?? "").trim(),
      phone,
      resolveCountry(input.country, phone),
      String(input.region ?? "").trim(),
      parseGroups(input.groups).join(", "),
      input.optOut ? 1 : 0,
      newUnsubKey(),
    ],
  });
  const created = await db.execute({
    sql: "SELECT * FROM marketing_contacts WHERE email = ? LIMIT 1",
    args: [email],
  });
  return toContact(created.rows[0] as Record<string, unknown>);
}

export async function updateContact(id: number, input: ContactInput): Promise<void> {
  const email = normaliseEmail(input.email);
  if (!isValidEmail(email)) throw new Error("A valid email address is required");
  const phone = String(input.phone ?? "").trim();
  const clash = await db.execute({
    sql: "SELECT id FROM marketing_contacts WHERE email = ? AND id <> ? LIMIT 1",
    args: [email, id],
  });
  if (clash.rows.length) {
    throw new Error("Another contact already uses that email address");
  }
  await db.execute({
    sql: `UPDATE marketing_contacts
          SET email = ?, name = ?, phone = ?, country = ?, region = ?, groups = ?,
              opt_out = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      email,
      String(input.name ?? "").trim(),
      phone,
      resolveCountry(input.country, phone),
      String(input.region ?? "").trim(),
      parseGroups(input.groups).join(", "),
      input.optOut ? 1 : 0,
      id,
    ],
  });
  // Opting out is per email address: if the same person exists more than once
  // under that address, every record follows.
  if (input.optOut) await optOutByEmail(email);
}

export async function deleteContact(id: number): Promise<void> {
  await db.execute({
    sql: "DELETE FROM marketing_contacts WHERE id = ?",
    args: [id],
  });
}

/** Unsubscribing applies to the address, not to one row. */
export async function optOutByEmail(email: string): Promise<void> {
  await db.execute({
    sql: `UPDATE marketing_contacts SET opt_out = 1, updated_at = datetime('now')
          WHERE email = ?`,
    args: [normaliseEmail(email)],
  });
}

export async function resubscribeByEmail(email: string): Promise<void> {
  await db.execute({
    sql: `UPDATE marketing_contacts SET opt_out = 0, updated_at = datetime('now')
          WHERE email = ?`,
    args: [normaliseEmail(email)],
  });
}

export type ImportSummary = {
  added: number;
  updated: number;
  duplicatesInFile: number;
  invalid: { rowNumber: number; value: string }[];
  alreadyUnsubscribed: number;
};

/**
 * Save a planned import.
 *
 * Merge rules: an address already on the list keeps everything it has, gains
 * any new groups, and has blank fields filled in from the file. Someone who
 * unsubscribed is never brought back by an import — that is the whole point
 * of the flag, and a re-upload of an old list must not undo it.
 */
export async function applyImport(
  candidates: ImportCandidate[],
): Promise<Pick<ImportSummary, "added" | "updated" | "alreadyUnsubscribed">> {
  let added = 0;
  let updated = 0;
  let alreadyUnsubscribed = 0;

  for (const candidate of candidates) {
    const existing = await db.execute({
      sql: "SELECT * FROM marketing_contacts WHERE email = ? LIMIT 1",
      args: [candidate.email],
    });
    const current = existing.rows[0] as Record<string, unknown> | undefined;

    if (!current) {
      await db.execute({
        sql: `INSERT INTO marketing_contacts
                (email, name, phone, country, region, groups, opt_out, unsub_key, source)
              VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'import')`,
        args: [
          candidate.email,
          candidate.name,
          candidate.phone,
          candidate.country,
          candidate.region,
          candidate.groups,
          newUnsubKey(),
        ],
      });
      added += 1;
      continue;
    }

    if (Number(current.opt_out) === 1) alreadyUnsubscribed += 1;

    await db.execute({
      sql: `UPDATE marketing_contacts
            SET name = ?, phone = ?, country = ?, region = ?, groups = ?,
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        String(current.name ?? "") || candidate.name,
        String(current.phone ?? "") || candidate.phone,
        String(current.country ?? "") || candidate.country,
        String(current.region ?? "") || candidate.region,
        mergeGroups(current.groups, candidate.groups),
        Number(current.id),
      ],
    });
    updated += 1;
  }

  return { added, updated, alreadyUnsubscribed };
}
