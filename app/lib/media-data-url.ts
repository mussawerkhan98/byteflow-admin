/**
 * Unpacking the `data:` URLs that uploaded images are stored as.
 *
 * Kept apart from the database so it can be tested on its own: everything in
 * here is pure, and app/lib/media.ts adds the row lookup around it.
 */

export type MediaAsset = { bytes: Uint8Array; mime: string };

/** What a browser is allowed to be handed back from the media route. */
export const SERVABLE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * Pull the bytes out of a `data:` URL.
 *
 * Deliberately strict: anything that is not a base64 data URL of a type we
 * serve comes back null rather than being guessed at. A migrated row holds a
 * path like "/api/media/7", and that must fail here rather than decode to
 * empty bytes a browser would draw as a broken image.
 */
export function decodeDataUrl(url: string): MediaAsset | null {
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(
    (url ?? "").trim(),
  );
  if (!match) return null;
  const mime = match[1].toLowerCase();
  if (!SERVABLE.has(mime)) return null;
  try {
    return { bytes: new Uint8Array(Buffer.from(match[2], "base64")), mime };
  } catch {
    return null;
  }
}
