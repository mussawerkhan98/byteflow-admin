import 'server-only'
import { randomBytes } from 'node:crypto'
import { db } from './db'
import { hashAdminPassword, verifyPassword } from './auth'
import { ACCESS_TOKEN_SECONDS, ARTICLES_SCOPE, CODE_SECONDS, REFRESH_TOKEN_SECONDS, randomToken, sha256 } from './oauth-core'

/**
 * Storage for the Claude connector: the one Claude account, the OAuth clients
 * Claude registers, authorization codes and tokens (stored only as hashes),
 * post revisions and the activity log.
 *
 * The Claude account lives in its own table, not admin_users, so it can never
 * sign in to this admin panel: it only ever approves the connector, and the
 * connector only ever reaches articles.
 */

/** The address Claude sees for this server: the OAuth issuer and the /mcp resource. */
export function publicOrigin() {
  return (process.env.ADMIN_PUBLIC_URL || 'https://admin.byteflow.ae').replace(/\/$/, '')
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS claude_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_clients (
    client_id TEXT PRIMARY KEY,
    client_secret_hash TEXT,
    client_name TEXT NOT NULL DEFAULT '',
    redirect_uris TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_codes (
    code_hash TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    redirect_uri TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    scope TEXT NOT NULL,
    resource TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_tokens (
    token_hash TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK(kind IN ('access','refresh')),
    client_id TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    scope TEXT NOT NULL,
    resource TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS post_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    snapshot TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    actor TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS claude_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,
    post_id INTEGER,
    revision_id INTEGER,
    summary TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_post_revisions_post ON post_revisions(post_id, id DESC)',
  'CREATE INDEX IF NOT EXISTS idx_claude_activity_date ON claude_activity(id DESC)',
  'CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client ON oauth_tokens(client_id, kind)',
]

let ready: Promise<void> | null = null
export function ensureClaudeTables() {
  ready ??= (async () => { for (const statement of DDL) await db.execute(statement) })().catch((error) => {
    ready = null
    throw error
  })
  return ready
}

// ── The Claude account ──────────────────────────────────────────────────────

export type ClaudeAccount = { id: number; displayName: string; email: string; active: boolean; createdAt: string; updatedAt: string }

const toAccount = (row: Record<string, unknown>): ClaudeAccount => ({
  id: Number(row.id), displayName: String(row.display_name), email: String(row.email), active: Number(row.active) === 1,
  createdAt: String(row.created_at), updatedAt: String(row.updated_at),
})

export async function getClaudeAccount(): Promise<ClaudeAccount | null> {
  await ensureClaudeTables()
  const result = await db.execute('SELECT * FROM claude_accounts ORDER BY id LIMIT 1')
  return result.rows[0] ? toAccount(result.rows[0]) : null
}

/** A long random password from an alphabet without look-alike characters. */
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  return Array.from(randomBytes(24), (byte) => alphabet[byte % alphabet.length]).join('').replace(/(.{6})(?!$)/g, '$1-')
}

/**
 * Creates the Claude account, or gives the existing one a new password (and
 * signs every connected Claude out). The password is returned once and never
 * stored in readable form.
 */
export async function resetClaudeAccount(email: string): Promise<{ account: ClaudeAccount; password: string }> {
  await ensureClaudeTables()
  const address = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address for the Claude account')
  const password = generatePassword()
  const existing = await getClaudeAccount()
  if (existing) {
    await db.execute({
      sql: "UPDATE claude_accounts SET email = ?, password_hash = ?, active = 1, updated_at = datetime('now') WHERE id = ?",
      args: [address, hashAdminPassword(password), existing.id],
    })
    await revokeAllTokens()
  } else {
    await db.execute({
      sql: 'INSERT INTO claude_accounts (display_name, email, password_hash) VALUES (?, ?, ?)',
      args: ['Claude', address, hashAdminPassword(password)],
    })
  }
  return { account: (await getClaudeAccount())!, password }
}

export async function setClaudeAccountActive(active: boolean) {
  await ensureClaudeTables()
  await db.execute({ sql: "UPDATE claude_accounts SET active = ?, updated_at = datetime('now')", args: [active ? 1 : 0] })
  if (!active) await revokeAllTokens()
}

export async function authenticateClaudeAccount(email: string, password: string): Promise<ClaudeAccount | null> {
  await ensureClaudeTables()
  const result = await db.execute({ sql: 'SELECT * FROM claude_accounts WHERE lower(email) = ? AND active = 1 LIMIT 1', args: [email.trim().toLowerCase()] })
  const row = result.rows[0]
  return row && verifyPassword(password, String(row.password_hash)) ? toAccount(row) : null
}

// ── OAuth clients ───────────────────────────────────────────────────────────

export type OAuthClient = { clientId: string; clientName: string; redirectUris: string[]; secretHash: string | null }

export async function registerClient(input: { clientName: string; redirectUris: string[]; confidential: boolean }) {
  await ensureClaudeTables()
  const clientId = `claude-${randomToken(18)}`
  const clientSecret = input.confidential ? randomToken(32) : null
  await db.execute({
    sql: 'INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris) VALUES (?, ?, ?, ?)',
    args: [clientId, clientSecret ? sha256(clientSecret) : null, input.clientName.slice(0, 100), JSON.stringify(input.redirectUris)],
  })
  return { clientId, clientSecret }
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  await ensureClaudeTables()
  const result = await db.execute({ sql: 'SELECT * FROM oauth_clients WHERE client_id = ? LIMIT 1', args: [clientId] })
  const row = result.rows[0]
  if (!row) return null
  let redirectUris: string[] = []
  try { redirectUris = JSON.parse(String(row.redirect_uris)) } catch { /* none */ }
  return { clientId: String(row.client_id), clientName: String(row.client_name || 'Claude'), redirectUris, secretHash: row.client_secret_hash ? String(row.client_secret_hash) : null }
}

// ── Codes and tokens ────────────────────────────────────────────────────────

export async function createAuthorizationCode(input: { clientId: string; accountId: number; redirectUri: string; codeChallenge: string; resource: string }) {
  await ensureClaudeTables()
  const code = randomToken(32)
  await db.execute({
    sql: 'INSERT INTO oauth_codes (code_hash, client_id, account_id, redirect_uri, code_challenge, scope, resource, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [sha256(code), input.clientId, input.accountId, input.redirectUri, input.codeChallenge, ARTICLES_SCOPE, input.resource, Date.now() + CODE_SECONDS * 1000],
  })
  return code
}

/** A code works once: the first exchange marks it used, a second one gets nothing. */
export async function consumeAuthorizationCode(code: string) {
  await ensureClaudeTables()
  const hash = sha256(code)
  const claimed = await db.execute({ sql: 'UPDATE oauth_codes SET used = 1 WHERE code_hash = ? AND used = 0 AND expires_at > ?', args: [hash, Date.now()] })
  if (claimed.rowsAffected !== 1) return null
  const row = (await db.execute({ sql: 'SELECT * FROM oauth_codes WHERE code_hash = ?', args: [hash] })).rows[0]
  return row ? {
    clientId: String(row.client_id), accountId: Number(row.account_id), redirectUri: String(row.redirect_uri),
    codeChallenge: String(row.code_challenge), scope: String(row.scope), resource: String(row.resource),
  } : null
}

export async function issueTokens(input: { clientId: string; accountId: number; scope: string; resource: string }) {
  await ensureClaudeTables()
  const accessToken = randomToken(32), refreshToken = randomToken(32), now = Date.now()
  await db.batch([
    { sql: 'INSERT INTO oauth_tokens (token_hash, kind, client_id, account_id, scope, resource, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [sha256(accessToken), 'access', input.clientId, input.accountId, input.scope, input.resource, now + ACCESS_TOKEN_SECONDS * 1000] },
    { sql: 'INSERT INTO oauth_tokens (token_hash, kind, client_id, account_id, scope, resource, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [sha256(refreshToken), 'refresh', input.clientId, input.accountId, input.scope, input.resource, now + REFRESH_TOKEN_SECONDS * 1000] },
  ], 'write')
  // Expired rows are no use to anyone; clear them as new ones arrive.
  await db.execute({ sql: 'DELETE FROM oauth_tokens WHERE expires_at < ?', args: [now - 86_400_000] })
  await db.execute({ sql: 'DELETE FROM oauth_codes WHERE expires_at < ?', args: [now - 86_400_000] })
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_SECONDS, scope: input.scope }
}

/** Refresh tokens rotate: using one revokes it and issues a fresh pair. */
export async function rotateRefreshToken(refreshToken: string, clientId: string) {
  await ensureClaudeTables()
  const hash = sha256(refreshToken)
  const claimed = await db.execute({
    sql: "UPDATE oauth_tokens SET revoked = 1 WHERE token_hash = ? AND kind = 'refresh' AND client_id = ? AND revoked = 0 AND expires_at > ?",
    args: [hash, clientId, Date.now()],
  })
  if (claimed.rowsAffected !== 1) return null
  const row = (await db.execute({ sql: 'SELECT account_id, scope, resource FROM oauth_tokens WHERE token_hash = ?', args: [hash] })).rows[0]
  const account = await db.execute({ sql: 'SELECT 1 FROM claude_accounts WHERE id = ? AND active = 1', args: [Number(row?.account_id)] })
  if (!row || !account.rows[0]) return null
  return issueTokens({ clientId, accountId: Number(row.account_id), scope: String(row.scope), resource: String(row.resource) })
}

export async function revokeToken(token: string) {
  await ensureClaudeTables()
  await db.execute({ sql: 'UPDATE oauth_tokens SET revoked = 1 WHERE token_hash = ?', args: [sha256(token)] })
}

export async function revokeAllTokens() {
  await ensureClaudeTables()
  await db.execute('UPDATE oauth_tokens SET revoked = 1 WHERE revoked = 0')
}

export type ClaudeActor = { accountId: number; email: string; clientId: string; clientName: string; ip: string }

/** The account and client behind a bearer token, or null when it is unknown, expired or revoked. */
export async function authenticateAccessToken(token: string, ip = ''): Promise<ClaudeActor | null> {
  if (!token) return null
  await ensureClaudeTables()
  const hash = sha256(token)
  const result = await db.execute({
    sql: `SELECT t.client_id, a.id AS account_id, a.email, c.client_name FROM oauth_tokens t
          JOIN claude_accounts a ON a.id = t.account_id AND a.active = 1
          LEFT JOIN oauth_clients c ON c.client_id = t.client_id
          WHERE t.token_hash = ? AND t.kind = 'access' AND t.revoked = 0 AND t.expires_at > ? LIMIT 1`,
    args: [hash, Date.now()],
  })
  const row = result.rows[0]
  if (!row) return null
  await db.execute({ sql: "UPDATE oauth_tokens SET last_used_at = datetime('now') WHERE token_hash = ?", args: [hash] }).catch(() => {})
  return { accountId: Number(row.account_id), email: String(row.email), clientId: String(row.client_id), clientName: String(row.client_name || 'Claude'), ip }
}

/** Connected Claude apps: each client with a live refresh token. */
export async function listConnections() {
  await ensureClaudeTables()
  const result = await db.execute({
    sql: `SELECT c.client_id, c.client_name, MIN(t.created_at) AS connected_at,
            (SELECT MAX(last_used_at) FROM oauth_tokens x WHERE x.client_id = c.client_id) AS last_used_at
          FROM oauth_clients c JOIN oauth_tokens t ON t.client_id = c.client_id
          WHERE t.kind = 'refresh' AND t.revoked = 0 AND t.expires_at > ?
          GROUP BY c.client_id ORDER BY connected_at DESC`,
    args: [Date.now()],
  })
  return result.rows.map((row) => ({ clientId: String(row.client_id), clientName: String(row.client_name || 'Claude'), connectedAt: String(row.connected_at), lastUsedAt: row.last_used_at ? String(row.last_used_at) : null }))
}
