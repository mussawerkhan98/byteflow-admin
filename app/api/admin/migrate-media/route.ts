import { isAdministrator } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { IMAGE_COLUMNS, countSql, rewriteSql } from '../../../lib/media-migration'

/**
 * Move content that still holds a `data:` URL onto the media route.
 *
 * GET reports what would change and alters nothing. POST performs the
 * rewrite. It is safe to run more than once — a migrated value no longer
 * matches `data:%` — and it never touches a value it cannot match to a media
 * row, so anything unaccounted for is reported instead of guessed at.
 */

async function survey() {
  const rows: Array<{ column: string; movable: number; orphaned: number }> = []
  let movable = 0
  let orphaned = 0
  for (const [table, column] of IMAGE_COLUMNS) {
    const sql = countSql(table, column)
    try {
      const m = Number((await db.execute(sql.movable)).rows[0]?.n ?? 0)
      const o = Number((await db.execute(sql.orphaned)).rows[0]?.n ?? 0)
      if (m || o) rows.push({ column: `${table}.${column}`, movable: m, orphaned: o })
      movable += m
      orphaned += o
    } catch {
      // A table this deployment does not have is not an error worth failing
      // the whole survey for.
    }
  }
  return { rows, movable, orphaned }
}

export async function GET() {
  if (!(await isAdministrator())) return Response.json({ error: 'Administrators only' }, { status: 403 })
  return Response.json(await survey())
}

export async function POST() {
  if (!(await isAdministrator())) return Response.json({ error: 'Administrators only' }, { status: 403 })
  const before = await survey()
  let rewritten = 0
  const failed: string[] = []
  for (const [table, column] of IMAGE_COLUMNS) {
    try {
      const result = await db.execute(rewriteSql(table, column))
      rewritten += Number(result.rowsAffected ?? 0)
    } catch (error) {
      failed.push(`${table}.${column}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }
  const after = await survey()
  return Response.json({ before, rewritten, remaining: after, failed })
}
