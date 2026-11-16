import 'server-only'
import { db } from './db'
import { ensureClaudeTables } from './claude-store'

/**
 * Revision history for blog posts. Before anything changes a post — Claude,
 * the admin panel, or a restore — the whole row is copied here, so any
 * change can be put back. Restoring copies the current row first too, so a
 * restore can itself be undone.
 */

const KEEP_OUT = new Set(['id', 'created_at', 'updated_at'])
const columnName = (key: string) => /^[a-z_][a-z0-9_]*$/.test(key)

export async function snapshotPost(postId: number, reason: string, actor: string): Promise<number | null> {
  await ensureClaudeTables()
  const row = (await db.execute({ sql: 'SELECT * FROM posts WHERE id = ? LIMIT 1', args: [postId] })).rows[0]
  if (!row) return null
  const snapshot = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]))
  const result = await db.execute({
    sql: 'INSERT INTO post_revisions (post_id, snapshot, reason, actor) VALUES (?, ?, ?, ?)',
    args: [postId, JSON.stringify(snapshot), reason.slice(0, 300), actor.slice(0, 120)],
  })
  return Number(result.lastInsertRowid)
}

export type PostRevision = { id: number; postId: number; title: string; published: boolean; reason: string; actor: string; createdAt: string }

export async function listRevisions(postId: number, limit = 50): Promise<PostRevision[]> {
  await ensureClaudeTables()
  const result = await db.execute({ sql: 'SELECT * FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT ?', args: [postId, limit] })
  return result.rows.map((row) => {
    let snapshot: Record<string, unknown> = {}
    try { snapshot = JSON.parse(String(row.snapshot)) } catch { /* unreadable */ }
    return {
      id: Number(row.id), postId: Number(row.post_id), title: String(snapshot.title ?? ''), published: Number(snapshot.published) === 1,
      reason: String(row.reason), actor: String(row.actor), createdAt: String(row.created_at),
    }
  })
}

/**
 * Puts a post back exactly as one revision recorded it — content, SEO,
 * image and published state. A deleted post comes back under its old id.
 */
export async function restoreRevision(revisionId: number, actor: string): Promise<{ postId: number; title: string; savedRevisionId: number | null }> {
  await ensureClaudeTables()
  const revision = (await db.execute({ sql: 'SELECT * FROM post_revisions WHERE id = ? LIMIT 1', args: [revisionId] })).rows[0]
  if (!revision) throw new Error(`Revision ${revisionId} not found`)
  const postId = Number(revision.post_id)
  const snapshot = JSON.parse(String(revision.snapshot)) as Record<string, unknown>
  const current = (await db.execute({ sql: 'SELECT * FROM posts WHERE id = ? LIMIT 1', args: [postId] })).rows[0]
  const savedRevisionId = current ? await snapshotPost(postId, `Before restoring revision ${revisionId}`, actor) : null
  // Only columns the table still has; the names come from the table itself.
  const columns = Object.keys(snapshot).filter((key) => !KEEP_OUT.has(key) && columnName(key) && (!current || key in current))
  const values = columns.map((key) => snapshot[key] as string | number | null)
  if (current) {
    await db.execute({
      sql: `UPDATE posts SET ${columns.map((key) => `${key} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
      args: [...values, postId],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO posts (id, ${columns.join(', ')}) VALUES (?, ${columns.map(() => '?').join(', ')})`,
      args: [postId, ...values],
    })
  }
  return { postId, title: String(snapshot.title ?? ''), savedRevisionId }
}
