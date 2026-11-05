import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

if (!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is required')
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const sql = readFileSync(new URL('./cms-schema.sql', import.meta.url), 'utf8')
for (const statement of sql.split(';').map((value) => value.trim()).filter(Boolean)) await db.execute(statement)
const upgrades = [
  "ALTER TABLE pages ADD COLUMN hero_label TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_heading TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_description TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_background_image TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_primary_label TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_primary_link TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_secondary_label TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_secondary_link TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE posts ADD COLUMN image_url TEXT', 'ALTER TABLE posts ADD COLUMN meta_title TEXT',
  'ALTER TABLE posts ADD COLUMN meta_description TEXT', "ALTER TABLE posts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE services ADD COLUMN image_alt TEXT NOT NULL DEFAULT \'\'', 'ALTER TABLE services ADD COLUMN cta_label TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE services ADD COLUMN cta_link TEXT NOT NULL DEFAULT \'\'', 'ALTER TABLE services ADD COLUMN featured INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE services ADD COLUMN status TEXT NOT NULL DEFAULT 'published'", "ALTER TABLE services ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE projects ADD COLUMN featured INTEGER NOT NULL DEFAULT 0', "ALTER TABLE projects ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE posts ADD COLUMN image_alt TEXT NOT NULL DEFAULT ''", "ALTER TABLE posts ADD COLUMN author_name TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE posts ADD COLUMN show_toc INTEGER NOT NULL DEFAULT 1', 'ALTER TABLE posts ADD COLUMN show_share INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE posts ADD COLUMN show_related INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE site_settings ADD COLUMN header_show_phone INTEGER NOT NULL DEFAULT 1', 'ALTER TABLE site_settings ADD COLUMN header_menu_uppercase INTEGER NOT NULL DEFAULT 1',
  "ALTER TABLE site_settings ADD COLUMN header_cta_label TEXT NOT NULL DEFAULT ''", "ALTER TABLE site_settings ADD COLUMN header_cta_link TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_dropdown_note TEXT NOT NULL DEFAULT ''", "ALTER TABLE site_settings ADD COLUMN header_dropdown_cta TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_cta_short_label TEXT NOT NULL DEFAULT ''",
  // Site-wide figures (cms-admin.ts SETTINGS_COLUMNS).
  "ALTER TABLE site_settings ADD COLUMN client_count TEXT NOT NULL DEFAULT ''", "ALTER TABLE site_settings ADD COLUMN google_rating TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN google_review_count TEXT NOT NULL DEFAULT ''", "ALTER TABLE site_settings ADD COLUMN founded_year TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN google_business_url TEXT NOT NULL DEFAULT ''",
  // Home page hero extras (app/lib/hero-fields.ts). Blank shows the website's own wording.
  "ALTER TABLE pages ADD COLUMN hero_highlight TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_trust_line TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_image TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_image_alt TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_strip_text TEXT NOT NULL DEFAULT ''", "ALTER TABLE pages ADD COLUMN hero_strip_link_label TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE pages ADD COLUMN hero_strip_link TEXT NOT NULL DEFAULT ''",
  // Home page Services tabs (cms-admin.ts SERVICE_COLUMNS).
  "ALTER TABLE services ADD COLUMN eyebrow TEXT NOT NULL DEFAULT ''", "ALTER TABLE services ADD COLUMN tagline TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE services ADD COLUMN highlights TEXT NOT NULL DEFAULT ''", "ALTER TABLE services ADD COLUMN image_caption TEXT NOT NULL DEFAULT ''",
]
for (const statement of upgrades) { try { await db.execute(statement) } catch (error) { if (!/duplicate column name/i.test(String(error))) throw error } }
console.log('CMS schema migration completed.')
