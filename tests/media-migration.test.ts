import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_COLUMNS, countSql, rewriteSql } from "../app/lib/media-migration";

test("covers the columns that hold an uploaded image", () => {
  const pairs = IMAGE_COLUMNS.map(([t, c]) => `${t}.${c}`);
  for (const expected of [
    "pages.hero_background_image",
    "pages.og_image",
    "services.icon",
    "services.image_url",
    "posts.image_url",
    "projects.image_url",
    "testimonials.image_url",
    "team_members.image_url",
    "ctas.background_image",
    "site_settings.logo_url",
    "site_settings.favicon_url",
  ]) {
    assert.ok(pairs.includes(expected), `${expected} is missing`);
  }
});

test("leaves alt text and mime columns alone", () => {
  // Those hold descriptions and types, not URLs; rewriting them would be a
  // silent content loss.
  for (const [, column] of IMAGE_COLUMNS) {
    assert.doesNotMatch(column, /_alt$|_mime$/);
  }
});

test("only rewrites values that match a media row exactly", () => {
  const sql = rewriteSql("services", "icon");
  assert.match(sql, /WHERE icon LIKE 'data:%'/);
  assert.match(sql, /EXISTS \(SELECT 1 FROM media WHERE media\.url = services\.icon\)/);
});

test("rewrites to the media route path", () => {
  assert.match(rewriteSql("posts", "image_url"), /'\/api\/media\/' \|\| \(SELECT id FROM media/);
});

test("running it again is a no-op, because a path is not a data url", () => {
  // The guard is LIKE 'data:%', and a migrated value starts with /api/media.
  assert.ok(!"/api/media/7".startsWith("data:"));
  assert.match(rewriteSql("services", "icon"), /LIKE 'data:%'/);
});

test("counts what cannot be moved separately from what can", () => {
  const { movable, orphaned } = countSql("projects", "image_url");
  assert.match(movable, /AND EXISTS \(/);
  assert.match(orphaned, /AND NOT EXISTS \(/);
});

test("refuses an identifier that is not a plain name", () => {
  for (const bad of ["services; DROP TABLE media", "services icon", "", "1services", "ser-vices"]) {
    assert.throws(() => rewriteSql(bad, "icon"), /Unsafe identifier/);
    assert.throws(() => rewriteSql("services", bad), /Unsafe identifier/);
  }
});
