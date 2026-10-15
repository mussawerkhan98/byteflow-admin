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
export async function storeMedia(options: {
  filename: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  altText: string
}): Promise<string> {
  const { filename, dataUrl, mimeType, sizeBytes, altText } = options
  // media.url is UNIQUE, so re-uploading a byte-identical file would other-
  // wise fail the insert. Point at the row that is already there instead.
  const existing = await db.execute({
    sql: 'SELECT id FROM media WHERE url = ? LIMIT 1',
    args: [dataUrl],
  })
  const found = existing.rows[0]
  if (found) return `/api/media/${Number(found.id)}`

  const inserted = await db.execute({
    sql: 'INSERT INTO media (filename, url, mime_type, size_bytes, alt_text) VALUES (?, ?, ?, ?, ?)',
    args: [filename, dataUrl, mimeType, sizeBytes, altText],
  })
  return `/api/media/${Number(inserted.lastInsertRowid)}`
}
