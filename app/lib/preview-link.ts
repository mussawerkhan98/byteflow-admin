import { createHmac } from "node:crypto";
import { siteUrl } from "./admin-guide";

/**
 * "Preview hidden sections": a link to the website's /api/preview that turns
 * preview mode on for one page, signed with the REVALIDATE_SECRET both apps
 * share and good for an hour. The website (byteflow, app/lib/preview.ts)
 * checks it the same way. Only paths on the website can be previewed.
 */
export const PREVIEW_LINK_SECONDS = 60 * 60;

export const previewPath = (value: string | null) => (value && /^\/(?![/\\])[\w\-/]*$/.test(value) ? value : null);

export function previewSignature(secret: string, path: string, expires: number): string {
  return createHmac("sha256", secret).update(`preview:${path}:${expires}`).digest("hex");
}

/** The signed link, or null without a secret long enough to sign with. */
export function previewLink(path: string, secret = process.env.REVALIDATE_SECRET ?? "", now = Date.now()): string | null {
  if (secret.length < 16 || !previewPath(path)) return null;
  // A minute short of the website's limit, so a clock a little ahead there still accepts it.
  const expires = Math.floor(now / 1000) + PREVIEW_LINK_SECONDS - 60;
  const query = new URLSearchParams({ path, expires: String(expires), signature: previewSignature(secret, path, expires) });
  return `${siteUrl("/api/preview")}?${query}`;
}
