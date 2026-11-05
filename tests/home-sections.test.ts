import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  checkHomeBlock,
  getHomeBlockDef,
  homeBlockFormValues,
  homeBlocks,
  sanitizeHomeBlock,
} from "../app/lib/home-sections";

const help = getHomeBlockDef("home_help")!;
const promise = getHomeBlockDef("home_promise")!;

test("every block has a default for each of its fields and lists", () => {
  for (const block of homeBlocks) {
    for (const field of block.fields) assert.ok(block.defaults.fields[field.name], `${block.key}.${field.name}`);
    for (const list of block.lists)
      assert.ok(list.startsEmpty ? Array.isArray(block.defaults.lists[list.name]) : block.defaults.lists[list.name]?.length, `${block.key}.${list.name}`);
  }
});

test("unknown blocks are refused", () => {
  assert.equal(getHomeBlockDef("users"), undefined);
  assert.equal(getHomeBlockDef(null), undefined);
});

test("only the block's own fields are saved, trimmed", () => {
  const saved = sanitizeHomeBlock(help, { heading: "  Hi  ", other: "x", button_link: "/contact-us" });
  assert.deepEqual(Object.keys(saved).sort(), ["button_label", "button_link", "description", "heading"]);
  assert.equal(saved.heading, "Hi");
});

test("unsafe links are dropped; site paths, web, tel and mailto links are kept", () => {
  const link = (value: string) => sanitizeHomeBlock(help, { button_link: value }).button_link;
  assert.equal(link("javascript:alert(1)"), "");
  assert.equal(link("//evil.example"), "");
  assert.equal(link("data:text/html,x"), "");
  assert.equal(link("/contact-us"), "/contact-us");
  assert.equal(link("https://wa.me/971"), "https://wa.me/971");
  assert.equal(link("tel:+971543282042"), "tel:+971543282042");
  assert.equal(link("mailto:info@byteflow.ae"), "mailto:info@byteflow.ae");
});

test("list items keep only their fields, need a title, and stop at the maximum", () => {
  const rows = Array.from({ length: 9 }, (_, i) => ({ title: `Row ${i}`, value: "1", junk: "x" }));
  const saved = sanitizeHomeBlock(promise, { rows: [{ title: "", value: "9" }, "nope", ...rows] }).rows as Record<string, string>[];
  assert.equal(saved.length, 6);
  assert.deepEqual(saved[0], { title: "Row 0", value: "1", unit: "", description: "" });
});

test("the form starts from the website's wording, and saved values win", () => {
  assert.equal(homeBlockFormValues(help, null).heading, help.defaults.fields.heading);
  const values = homeBlockFormValues(help, { heading: "Saved", description: "  " });
  assert.equal(values.heading, "Saved");
  assert.equal(values.description, help.defaults.fields.description);
  assert.deepEqual(homeBlockFormValues(promise, { rows: [] }).rows, promise.defaults.lists.rows);
});


test("a choice keeps one of its options; anything else falls back to the first", () => {
  const about = getHomeBlockDef("home_about")!;
  const saved = sanitizeHomeBlock(about, { show_quote: "<script>", show_coverage: "no" });
  assert.equal(saved.show_quote, "yes");
  assert.equal(saved.show_coverage, "no");
});

test("no default types a figure that the site-wide settings provide", () => {
  assert.ok(!/\b(2017|500\+|574)\b/.test(JSON.stringify(homeBlocks.map((b) => b.defaults))));
  assert.equal(getHomeBlockDef("home_about")!.defaults.fields.rating_label, "Google rating · {reviews} reviews");
});

test("an uploaded About photo can't be saved without its own description", () => {
  const about = getHomeBlockDef("home_about")!;
  const save = (body: Record<string, unknown>) => checkHomeBlock(about, sanitizeHomeBlock(about, body));
  // The built-in artwork keeps its own description.
  assert.equal(save({ image_url: about.defaults.fields.image_url, image_alt: about.defaults.fields.image_alt }), null);
  assert.match(save({ image_url: "/api/media/90" }) ?? "", /alt text/);
  assert.match(save({ image_url: "/api/media/90", image_alt: about.defaults.fields.image_alt }) ?? "", /alt text/);
  assert.equal(save({ image_url: "/api/media/90", image_alt: "Byteflow engineers supporting a Dubai office" }), null);
  assert.equal(about.fields.find((field) => field.name === "image_url")?.upload, "photo");
});

test("About features: four at most, each with an icon and show or hide", () => {
  const about = getHomeBlockDef("home_about")!;
  const saved = sanitizeHomeBlock(about, {
    highlights: Array.from({ length: 6 }, (_, i) => ({ title: `Feature ${i}`, icon: i ? "cloud" : "rocket", show: i === 1 ? "no" : "yes" })),
  }).highlights as Record<string, string>[];
  assert.equal(saved.length, 4);
  assert.equal(saved[0].icon, "layers");
  assert.equal(saved[1].show, "no");
});
