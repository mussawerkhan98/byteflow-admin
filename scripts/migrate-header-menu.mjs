/**
 * Header Menu tables: creates them and seeds them with the header as it is
 * today, so the website looks the same right after it runs.
 *
 * Additive only. Tables and indexes are created IF NOT EXISTS, nothing is
 * dropped or renamed, and the seed is written only while the tables are
 * empty, so running it twice changes nothing.
 *
 *   node --env-file=<env file> scripts/migrate-header-menu.mjs --expect-host=<database host> [--dry-run]
 *
 * --expect-host must match the host in TURSO_DATABASE_URL, so the script
 * cannot be pointed at the wrong database by a stray environment file.
 * --dry-run prints what would be seeded and writes nothing.
 */
import { createClient } from '@libsql/client'
import { buildSeed } from '../app/lib/header-menu-admin.ts'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

const url = process.env.TURSO_DATABASE_URL
if (!url) throw new Error('TURSO_DATABASE_URL is required')
const host = new URL(url.replace(/^libsql:/, 'https:')).host
if (!args['expect-host']) throw new Error(`Pass --expect-host=${host} to confirm this is the database you mean.`)
if (args['expect-host'] !== host) throw new Error(`Refusing to run: TURSO_DATABASE_URL points at ${host}, not ${args['expect-host']}.`)
const dryRun = args['dry-run'] === 'true'

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })

const ddl = [
  `CREATE TABLE IF NOT EXISTS header_nav_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    href TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'link' CHECK(kind IN ('link','services','industries','insights')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    new_tab INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS header_mega_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu TEXT NOT NULL CHECK(menu IN ('services','industries')),
    title TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS header_mega_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES header_mega_groups(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    href TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS header_menu_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE INDEX IF NOT EXISTS header_mega_groups_menu ON header_mega_groups(menu, sort_order)',
  'CREATE INDEX IF NOT EXISTS header_mega_items_group ON header_mega_items(group_id, sort_order)',
]

// The button and phone switch the Header Menu screen saves to site_settings.
// migrate-cms.mjs adds them too; a database that has not run it gets them here.
const settingsColumns = [
  'ALTER TABLE site_settings ADD COLUMN header_show_phone INTEGER NOT NULL DEFAULT 1',
  "ALTER TABLE site_settings ADD COLUMN header_cta_label TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_cta_short_label TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_cta_link TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_dropdown_note TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_dropdown_cta TEXT NOT NULL DEFAULT ''",
]

const count = async (table) => {
  try {
    return Number((await db.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n)
  } catch (error) {
    if (/no such table/i.test(String(error))) return 0
    throw error
  }
}

async function readCurrentHeader() {
  const optional = async (sql) => {
    try {
      return (await db.execute(sql)).rows
    } catch (error) {
      if (/no such (table|column)/i.test(String(error))) return []
      throw error
    }
  }
  const [menuItems, settings, block, services] = await Promise.all([
    optional("SELECT label, href, visible, new_tab FROM menu_items WHERE area = 'header' AND parent_id IS NULL ORDER BY sort_order, id"),
    optional('SELECT * FROM site_settings LIMIT 1'),
    optional(`SELECT s.content FROM page_sections s JOIN pages p ON p.id = s.page_id
              WHERE p.slug = 'home' AND s.section_type = 'header_menu' ORDER BY s.sort_order LIMIT 1`),
    optional("SELECT id, slug, title FROM services WHERE status = 'published'"),
  ])
  let savedBlock = null
  try {
    savedBlock = block[0]?.content ? JSON.parse(String(block[0].content)) : null
  } catch {
    savedBlock = null
  }
  return buildSeed({
    menuItems: menuItems.map((row) => ({
      label: String(row.label ?? ''),
      href: String(row.href ?? ''),
      visible: Boolean(row.visible),
      new_tab: Boolean(row.new_tab),
    })),
    siteSettings: settings[0] ?? null,
    savedBlock,
    services: services.map((row) => ({ id: Number(row.id), slug: String(row.slug), title: String(row.title ?? '') })),
  })
}

function seedStatements(seed) {
  const statements = []
  seed.nav.forEach((row, index) =>
    statements.push({
      sql: 'INSERT INTO header_nav_items (label, href, kind, sort_order, visible, new_tab) VALUES (?, ?, ?, ?, ?, ?)',
      args: [row.label, row.href, row.kind, index * 10, row.visible ? 1 : 0, row.new_tab ? 1 : 0],
    }),
  )
  seed.groups.forEach((group, g) => {
    const order = g * 10
    statements.push({
      sql: 'INSERT INTO header_mega_groups (menu, title, sort_order, visible) VALUES (?, ?, ?, 1)',
      args: [group.menu, group.title, order],
    })
    group.items.forEach((item, i) =>
      statements.push({
        // The group was inserted a statement ago in the same transaction.
        sql: `INSERT INTO header_mega_items (group_id, service_id, label, href, description, sort_order, visible)
              VALUES ((SELECT id FROM header_mega_groups WHERE menu = ? AND sort_order = ?), ?, ?, ?, ?, ?, ?)`,
        args: [group.menu, order, item.service_id, item.label, item.href, item.description, i * 10, item.visible ? 1 : 0],
      }),
    )
  })
  for (const [key, value] of Object.entries(seed.settings))
    statements.push({ sql: 'INSERT OR IGNORE INTO header_menu_settings (key, value) VALUES (?, ?)', args: [key, value] })
  return statements
}

console.log(`Database: ${host}${dryRun ? ' (dry run — nothing is written)' : ''}`)
const seed = await readCurrentHeader()

async function migrate() {
  for (const statement of ddl) await db.execute(statement)
  for (const statement of settingsColumns) {
    try {
      await db.execute(statement)
    } catch (error) {
      if (!/duplicate column name/i.test(String(error))) throw error
    }
  }
  console.log('Tables, indexes and site_settings columns are in place.')

  const existing = await Promise.all(['header_nav_items', 'header_mega_groups', 'header_menu_settings'].map(count))
  if (existing.some((n) => n > 0)) {
    console.log(`Already seeded (${existing.join(' / ')} rows) — left as it is.`)
  } else {
    await db.batch(seedStatements(seed), 'write')
    console.log(
      `Seeded ${seed.nav.length} bar entries, ${seed.groups.length} groups, ` +
        `${seed.groups.reduce((n, g) => n + g.items.length, 0)} links and ${Object.keys(seed.settings).length} settings.`,
    )
  }
  console.log('Header menu migration completed.')
}

// No process.exit(): on Windows it can abort while the database connection
// is still closing. The script ends on its own once the client is closed.
if (dryRun) console.log(JSON.stringify(seed, null, 2))
else await migrate()
db.close()
