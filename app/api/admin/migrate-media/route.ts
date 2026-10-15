import { isAdministrator } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { IMAGE_COLUMNS, rewriteSql } from '../../../lib/media-migration'
import { surveyMedia } from '../../../lib/media-survey'

/**
 * Move content that still holds a `data:` URL onto the media route.
 *
 * GET reports what would change and alters nothing. POST performs the
 * rewrite. It is safe to run more than once — a migrated value no longer
 * matches `data:%` — and it never touches a value it cannot match to a media
 * row, so anything unaccounted for is reported instead of guessed at.
 */

export async function GET() {
  if (!(await isAdministrator())) return Response.json({ error: 'Administrators only' }, { status: 403 })
  return Response.json(await surveyMedia())
}

export async function POST() {
  if (!(await isAdministrator())) return Response.json({ error: 'Administrators only' }, { status: 403 })
  const before = await surveyMedia()
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
  const after = await surveyMedia()
  return Response.json({ before, rewritten, remaining: after, failed })
}
