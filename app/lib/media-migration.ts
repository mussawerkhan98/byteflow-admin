/**
 * Moving content that already holds a `data:` URL onto the media route.
 *
 * Uploads used to write the whole image into the content row. Those rows are
 * still out there, and every page that shows one carries the image inside its
 * HTML. This rewrites each of them to the short path the media route serves.
 *
 * Nothing is destroyed. The bytes stay in media.url exactly as they are, and
 * the rewrite only ever replaces a value that is byte-identical to a media
 * row's url, so a row whose image is not in the media table is left alone and
 * reported rather than guessed at. Running it twice changes nothing the
 * second time: a path no longer matches `data:%`.
 */

/** Every column that can hold an uploaded image URL. */
export const IMAGE_COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ["pages", "og_image"],
  ["pages", "hero_background_image"],
  ["services", "icon"],
  ["services", "image_url"],
  ["testimonials", "image_url"],
  ["ctas", "background_image"],
  ["team_members", "image_url"],
  ["site_settings", "logo_url"],
  ["site_settings", "favicon_url"],
  ["posts", "image_url"],
  ["projects", "image_url"],
];

const ident = (name: string) => {
  // These come from the list above, never from a request, but a table name
  // cannot be a bound parameter so it is checked rather than trusted.
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error(`Unsafe identifier: ${name}`);
  return name;
};

/** How many rows in this column can be moved, and how many cannot. */
export function countSql(table: string, column: string) {
  const t = ident(table);
  const c = ident(column);
  return {
    movable: `SELECT COUNT(*) AS n FROM ${t} WHERE ${c} LIKE 'data:%' AND EXISTS (SELECT 1 FROM media WHERE media.url = ${t}.${c})`,
    orphaned: `SELECT COUNT(*) AS n FROM ${t} WHERE ${c} LIKE 'data:%' AND NOT EXISTS (SELECT 1 FROM media WHERE media.url = ${t}.${c})`,
  };
}

/**
 * Rewrite one column in place.
 *
 * Only rows whose value matches a media row exactly are touched, so a value
 * this cannot account for is never altered.
 */
export function rewriteSql(table: string, column: string) {
  const t = ident(table);
  const c = ident(column);
  return `UPDATE ${t} SET ${c} = '/api/media/' || (SELECT id FROM media WHERE media.url = ${t}.${c}) WHERE ${c} LIKE 'data:%' AND EXISTS (SELECT 1 FROM media WHERE media.url = ${t}.${c})`;
}
