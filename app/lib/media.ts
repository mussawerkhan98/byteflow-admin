/**
 * Media stored in the CMS database, served as files rather than pasted into
 * the page.
 *
 * Uploads were being written into content rows as `data:` URLs, so the bytes
 * of every image travelled inside the HTML of every request that showed them.
 * The home page reached 2 MB, 87% of it base64, and because a `data:` URL is
 * part of the document it can never be cached on its own — each visit paid
 * for all of it again. That is what filled the origin transfer allowance on
 * a few thousand visits.
 *
 * The bytes still live in `media.url`; nothing moved. What changed is that a
 * content row now holds a short link to the media route instead of the image
 * itself, so the HTML carries roughly thirty characters where it used to
 * carry hundreds of kilobytes, and the image is cached from then on.
 */

import 'server-only';
import { db } from "./db";
import { decodeDataUrl, SERVABLE, type MediaAsset } from "./media-data-url";

export type { MediaAsset };

/**
 * A media row's bytes, whatever form the row happens to hold.
 *
 * Rows written before the media route existed keep the whole image in `url`
 * as a data URL; that is still the storage, and this is what unpacks it.
 */
export async function mediaAsset(id: number): Promise<MediaAsset | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    const found = await db.execute({
      sql: "SELECT url, mime_type FROM media WHERE id = ? LIMIT 1",
      args: [id],
    });
    const row = found.rows[0];
    if (!row) return null;
    const decoded = decodeDataUrl(String(row.url ?? ""));
    if (!decoded) return null;
    // The row's own mime_type wins when it is one we serve, since that is
    // what the upload recorded; the data URL's is the fallback.
    const declared = String(row.mime_type ?? "").toLowerCase();
    return SERVABLE.has(declared) ? { ...decoded, mime: declared } : decoded;
  } catch {
    return null;
  }
}
