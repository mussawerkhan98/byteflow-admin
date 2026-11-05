import "server-only";
import { siteUrl } from "./admin-guide";

/**
 * Tells the website to drop a cached piece of data, so a change made here
 * shows on its next page view. The website's /api/revalidate route checks
 * the same REVALIDATE_SECRET.
 *
 * Never throws: a save has already succeeded by the time this runs, and the
 * website refreshes its cache on its own within 15 minutes anyway.
 */
export async function revalidateSite(tag: string): Promise<boolean> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  try {
    const response = await fetch(siteUrl("/api/revalidate"), {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ tag }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * The internal paths that do not exist on the website (404). Checked after a
 * save, as a warning: a page may be published later on purpose.
 */
export async function missingPages(paths: string[]): Promise<string[]> {
  const results = await Promise.all(
    paths.slice(0, 40).map(async (path) => {
      try {
        const response = await fetch(siteUrl(path), {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        return response.status === 404 ? path : null;
      } catch {
        // Unreachable is not the same as missing; say nothing.
        return null;
      }
    }),
  );
  return results.filter((path): path is string => Boolean(path));
}
