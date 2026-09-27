import "server-only";
import { db } from "./db";
import {
  DEFAULT_ACCENT,
  safeColor,
  type HeaderStyle,
} from "./email-template";

/**
 * How promotion emails look: what sits above the greeting, the button colour
 * and the line above the unsubscribe link.
 *
 * Stored as a single row so there is one answer for every promotion. A
 * missing row or a missing table is not an error — the defaults below are
 * what the emails looked like before this screen existed.
 */

export type EmailDesign = {
  headerStyle: HeaderStyle;
  accentColor: string;
  footerNote: string;
};

export const DEFAULT_DESIGN: EmailDesign = {
  headerStyle: "name",
  accentColor: DEFAULT_ACCENT,
  footerNote: "",
};

const HEADER_STYLES: HeaderStyle[] = ["name", "logo", "none"];

/** Trusting the database no more than the form: both are re-checked here. */
export function normaliseDesign(input: unknown): EmailDesign {
  const raw = (input ?? {}) as Record<string, unknown>;
  const header = String(raw.headerStyle ?? raw.header_style ?? "");
  return {
    headerStyle: HEADER_STYLES.includes(header as HeaderStyle)
      ? (header as HeaderStyle)
      : DEFAULT_DESIGN.headerStyle,
    accentColor: safeColor(raw.accentColor ?? raw.accent_color),
    footerNote: String(raw.footerNote ?? raw.footer_note ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300),
  };
}

export async function getEmailDesign(): Promise<EmailDesign> {
  try {
    const result = await db.execute(
      "SELECT header_style, accent_color, footer_note FROM email_design WHERE id = 1",
    );
    const row = result.rows[0];
    if (!row) return { ...DEFAULT_DESIGN };
    return normaliseDesign(row as unknown as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_DESIGN };
  }
}

export async function saveEmailDesign(input: unknown): Promise<EmailDesign> {
  const design = normaliseDesign(input);
  await db.execute({
    sql: `INSERT INTO email_design (id, header_style, accent_color, footer_note, updated_at)
          VALUES (1, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            header_style = excluded.header_style,
            accent_color = excluded.accent_color,
            footer_note = excluded.footer_note,
            updated_at = datetime('now')`,
    args: [design.headerStyle, design.accentColor, design.footerNote],
  });
  return design;
}
