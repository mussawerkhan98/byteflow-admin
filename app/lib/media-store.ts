import 'server-only'
import { db } from './db'

/**
 * Where an uploaded image goes, and what the CMS stores to point at it.
 *
 * The bytes are kept in the media table, as they always were: the admin and
 * the website are separate deployments and a serverless filesystem is both
 * ephemeral and private to whichever deployment wrote it, so the shared
 * database is the one place both can read.
 *
 * What changed is what a content row holds. It used to hold the `data:` URL
 * itself, which meant the bytes of every image travelled inside the HTML of
 * every page that showed them — the website's home page reached 2 MB, 87% of
 * it base64, and a `data:` URL is part of the document so it can never be
 * cached on its own. A content row now holds a short path to the media route,
 * which both applications serve, and the image is cached after first request.
 */
/**
 * The media columns added after the table was created. Added on first use
 * (scripts/migrate-cms.mjs adds the same ones), so an older database takes
 * uploads straight away.
 */
const MEDIA_COLUMNS = [
  'ALTER TABLE media ADD COLUMN width INTEGER',
  'ALTER TABLE media ADD COLUMN height INTEGER',
  "ALTER TABLE media ADD COLUMN title TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE media ADD COLUMN decorative INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE media ADD COLUMN role TEXT NOT NULL DEFAULT 'served'",
  'ALTER TABLE media ADD COLUMN original_id INTEGER',
]
let columnsReady: Promise<void> | null = null

function ensureMediaColumns() {
  columnsReady ??= (async () => {
    for (const statement of MEDIA_COLUMNS) {
      try {
        await db.execute(statement)
      } catch (error) {
        if (!/duplicate column name/i.test(String(error))) throw error
      }
    }
  })().catch((error) => {
    columnsReady = null
    throw error
  })
  return columnsReady
}

export async function storeMedia(options: {
  filename: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  altText: string
  /** Recorded when known, so the website can size the image before it loads. */
  size?: { width: number; height: number } | null
  /** No alt text on purpose: the picture adds nothing a reader would miss. */
  decorative?: boolean
  /** 'served' (shown on the site) or 'social' (the JPG copy of a share picture). */
  role?: 'served' | 'social'
}): Promise<string> {
  const { filename, dataUrl, mimeType, sizeBytes, altText, size, decorative = false, role = 'served' } = options
  await ensureMediaColumns()
  // media.url is UNIQUE, so re-uploading a byte-identical file would other-
  // wise fail the insert. Point at the row that is already there instead.
  const existing = await db.execute({
    sql: 'SELECT id FROM media WHERE url = ? LIMIT 1',
    args: [dataUrl],
  })
  const found = existing.rows[0]
  if (found) return `/api/media/${Number(found.id)}`

  const inserted = await db.execute({
    sql: 'INSERT INTO media (filename, url, mime_type, size_bytes, alt_text, width, height, decorative, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [filename, dataUrl, mimeType, sizeBytes, altText, size?.width ?? null, size?.height ?? null, decorative ? 1 : 0, role],
  })
  return `/api/media/${Number(inserted.lastInsertRowid)}`
}
