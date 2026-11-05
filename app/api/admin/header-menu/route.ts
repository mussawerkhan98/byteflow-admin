import type { InStatement } from "@libsql/client";
import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";
import {
  internalLinks,
  sanitizeCta,
  sanitizeGroups,
  sanitizeNav,
  sanitizeSettings,
  settingsWithDefaults,
  type MegaGroup,
  type MegaMenu,
} from "../../../lib/header-menu-admin";
import { missingPages, revalidateSite } from "../../../lib/site-revalidate";

/** The website's cache tag for the header (byteflow, app/lib/header-data.ts). */
const HEADER_TAG = "header-menu";

const NOT_MIGRATED =
  "The header menu tables are not set up yet. Run scripts/migrate-header-menu.mjs for this database first.";

const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
const missingTable = (error: unknown) => /no such table/i.test(String(error));

async function readGroups() {
  const [groups, items] = await Promise.all([
    db.execute("SELECT id, menu, title, visible FROM header_mega_groups ORDER BY sort_order, id"),
    db.execute(
      "SELECT group_id, service_id, label, href, description, visible FROM header_mega_items ORDER BY sort_order, id",
    ),
  ]);
  const byMenu = (menu: MegaMenu): MegaGroup[] =>
    groups.rows
      .filter((group) => group.menu === menu)
      .map((group) => ({
        title: String(group.title ?? ""),
        visible: Boolean(group.visible),
        items: items.rows
          .filter((item) => Number(item.group_id) === Number(group.id))
          .map((item) => ({
            service_id: item.service_id == null ? null : Number(item.service_id),
            label: String(item.label ?? ""),
            href: String(item.href ?? ""),
            description: String(item.description ?? ""),
            visible: Boolean(item.visible),
          })),
      }));
  return { services: byMenu("services"), industries: byMenu("industries") };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const [nav, settings, site, services, groups] = await Promise.all([
      db.execute("SELECT label, href, kind, visible, new_tab FROM header_nav_items ORDER BY sort_order, id"),
      db.execute("SELECT key, value FROM header_menu_settings"),
      db.execute("SELECT * FROM site_settings LIMIT 1"),
      db.execute("SELECT id, slug, title, excerpt FROM services ORDER BY sort_order, id"),
      readGroups(),
    ]);
    const s = (site.rows[0] ?? {}) as Record<string, unknown>;
    return Response.json({
      nav: nav.rows.map((row) => ({
        label: String(row.label ?? ""),
        href: String(row.href ?? ""),
        kind: String(row.kind ?? "link"),
        visible: Boolean(row.visible),
        new_tab: Boolean(row.new_tab),
      })),
      cta: {
        label: String(s.header_cta_label ?? ""),
        short_label: String(s.header_cta_short_label ?? ""),
        link: String(s.header_cta_link ?? ""),
        // A missing column means it was never switched off.
        show_phone: s.header_show_phone === undefined ? true : Boolean(Number(s.header_show_phone)),
      },
      groups,
      settings: settingsWithDefaults(Object.fromEntries(settings.rows.map((row) => [String(row.key), String(row.value)]))),
      services: services.rows.map((row) => ({
        id: Number(row.id),
        slug: String(row.slug ?? ""),
        title: String(row.title ?? ""),
        excerpt: String(row.excerpt ?? ""),
      })),
    });
  } catch (error) {
    if (missingTable(error)) return Response.json({ error: NOT_MIGRATED, notMigrated: true }, { status: 409 });
    throw error;
  }
}

const upsertSettings = (values: Record<string, string>): InStatement[] =>
  Object.entries(values).map(([key, value]) => ({
    sql: `INSERT INTO header_menu_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, value],
  }));

/** Replaces one menu's groups and links, in order. */
function replaceGroups(menu: MegaMenu, groups: MegaGroup[]): InStatement[] {
  const statements: InStatement[] = [
    {
      sql: "DELETE FROM header_mega_items WHERE group_id IN (SELECT id FROM header_mega_groups WHERE menu = ?)",
      args: [menu],
    },
    { sql: "DELETE FROM header_mega_groups WHERE menu = ?", args: [menu] },
  ];
  groups.forEach((group, g) => {
    const order = g * 10;
    statements.push({
      sql: "INSERT INTO header_mega_groups (menu, title, sort_order, visible) VALUES (?, ?, ?, ?)",
      args: [menu, group.title, order, group.visible ? 1 : 0],
    });
    group.items.forEach((item, i) =>
      statements.push({
        // The group was inserted a statement ago in this same transaction.
        sql: `INSERT INTO header_mega_items (group_id, service_id, label, href, description, sort_order, visible)
              VALUES ((SELECT id FROM header_mega_groups WHERE menu = ? AND sort_order = ?), ?, ?, ?, ?, ?, ?)`,
        args: [menu, order, item.service_id, item.label, item.href, item.description, i * 10, item.visible ? 1 : 0],
      }),
    );
  });
  return statements;
}

type Part = "bar" | "services" | "industries" | "insights";
const PARTS = new Set<Part>(["bar", "services", "industries", "insights"]);

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const part = new URL(request.url).searchParams.get("part") as Part;
  if (!PARTS.has(part)) return Response.json({ error: "Unknown part of the header menu." }, { status: 400 });
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

  const errors: string[] = [];
  const statements: InStatement[] = [];
  const links: string[] = [];

  const settings = sanitizeSettings(part, body.settings);
  if (settings.ok) {
    statements.push(...upsertSettings(settings.value));
    links.push(...Object.entries(settings.value).filter(([key]) => /link$/.test(key)).map(([, value]) => value));
  } else errors.push(...settings.errors);

  if (part === "bar") {
    const nav = sanitizeNav(body.nav);
    const cta = sanitizeCta(body.cta);
    if (!nav.ok) errors.push(...nav.errors);
    if (!cta.ok) errors.push(...cta.errors);
    if (nav.ok && cta.ok) {
      statements.push({ sql: "DELETE FROM header_nav_items", args: [] });
      nav.value.forEach((row, index) =>
        statements.push({
          sql: "INSERT INTO header_nav_items (label, href, kind, sort_order, visible, new_tab) VALUES (?, ?, ?, ?, ?, ?)",
          args: [row.label, row.href, row.kind, index * 10, row.visible ? 1 : 0, row.new_tab ? 1 : 0],
        }),
      );
      statements.push({
        sql: `UPDATE site_settings SET header_cta_label = ?, header_cta_short_label = ?, header_cta_link = ?,
              header_show_phone = ?, updated_at = datetime('now') WHERE id = (SELECT id FROM site_settings ORDER BY id LIMIT 1)`,
        args: [cta.value.label, cta.value.short_label, cta.value.link, cta.value.show_phone ? 1 : 0],
      });
      links.push(...nav.value.map((row) => row.href), cta.value.link);
    }
  }

  if (part === "services" || part === "industries") {
    const groups = sanitizeGroups(part, body.groups);
    if (groups.ok) {
      statements.push(...replaceGroups(part, groups.value));
      links.push(...groups.value.flatMap((group) => group.items.map((item) => item.href)));
    } else errors.push(...groups.errors);
  }

  if (errors.length) return Response.json({ error: "Please fix the highlighted problems.", errors }, { status: 400 });

  try {
    await db.batch(statements, "write");
  } catch (error) {
    if (missingTable(error)) return Response.json({ error: NOT_MIGRATED, notMigrated: true }, { status: 409 });
    throw error;
  }

  const [revalidated, missing] = await Promise.all([revalidateSite(HEADER_TAG), missingPages(internalLinks(links))]);
  return Response.json({ ok: true, revalidated, missing });
}
