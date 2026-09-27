/**
 * The marketing schema, repeated from `scripts/cms-schema.sql` so that a
 * serverless function can create the tables without reading a file from
 * `scripts/`. `tests/marketing-setup.test.ts` fails if the two drift apart.
 *
 * Kept free of `server-only` and of any database import so the test build can
 * compile it on its own.
 */

export const MARKETING_TABLES = [
  "admin_permissions",
  "marketing_contacts",
  "campaigns",
  "campaign_recipients",
] as const;

export const MARKETING_DDL: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS admin_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(admin_user_id, permission)
)`,
  `CREATE TABLE IF NOT EXISTS marketing_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  groups TEXT NOT NULL DEFAULT '',
  opt_out INTEGER NOT NULL DEFAULT 0,
  unsub_key TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','import')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
  `CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  button_text TEXT NOT NULL DEFAULT '',
  button_url TEXT NOT NULL DEFAULT '',
  image_data BLOB,
  image_mime TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','sending','sent')),
  scheduled_at TEXT,
  sent_at TEXT,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  send_error TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
  `CREATE TABLE IF NOT EXISTS campaign_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  contact_id INTEGER,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  clicks INTEGER NOT NULL DEFAULT 0,
  first_click_at TEXT,
  last_click_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
  `CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON marketing_contacts(email)`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_status_scheduled ON campaigns(status, scheduled_at)`,
];

/**
 * Nothing here may destroy data, so the statements are checked rather than
 * trusted. A stray DROP or ALTER in this list would be a serious bug, and
 * this guard means it could never reach the database even if one were added.
 */
const SAFE_STATEMENT = /^CREATE (TABLE|INDEX) IF NOT EXISTS /i;

export function unsafeStatements(statements: readonly string[] = MARKETING_DDL) {
  return statements.filter((statement) => !SAFE_STATEMENT.test(statement.trim()));
}
