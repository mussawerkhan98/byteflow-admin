import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
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
  const saved = sanitizeHomeBlock(about, {
    highlights: [
      { title: "A", icon: "<script>", show: "no" },
      { title: "B", icon: "shield", show: "maybe" },
    ],
  }).highlights as Record<string, string>[];
  assert.deepEqual(saved.map((item) => [item.icon, item.show]), [["layers", "no"], ["shield", "yes"]]);
});

test("no default types a figure that the site-wide settings provide", () => {
  assert.ok(!/(2017|500+|574)/.test(JSON.stringify(homeBlocks.map((b) => b.defaults))));
  assert.equal(getHomeBlockDef("home_about")!.defaults.fields.eyebrow, "About Byteflow · Since {founded}");
});

test("About: heading, paragraph and up to four reasons, nothing from the old bento", () => {
  const about = getHomeBlockDef("home_about")!;
  assert.deepEqual(about.fields.map((field) => field.name), ["eyebrow", "heading", "heading_soft", "intro"]);
  const saved = sanitizeHomeBlock(about, {
    image_url: "/api/media/90",
    highlights: Array.from({ length: 6 }, (_, i) => ({ title: `Reason ${i}`, link: "/cyber-security" })),
  });
  assert.equal(saved.image_url, undefined);
  assert.equal((saved.highlights as unknown[]).length, 4);
});

test("a scenario's linked service is saved as a service slug, or nothing", () => {
  const needs = getHomeBlockDef("home_needs")!;
  const scenario = (service: string) =>
    (sanitizeHomeBlock(needs, { scenarios: [{ title: "Moving office.", service, show: "maybe" }] }).scenarios as Record<string, string>[])[0];
  assert.equal(scenario("cyber-security").service, "cyber-security");
  assert.equal(scenario("javascript:alert(1)").service, "");
  assert.equal(scenario("/cyber-security").service, "");
  // An unknown show/hide value falls back to Show.
  assert.equal(scenario("cyber-security").show, "yes");
});

test("the three default scenarios match the website's", () => {
  const needs = getHomeBlockDef("home_needs")!;
  assert.deepEqual(
    needs.defaults.lists.scenarios.map((s) => [s.label, s.service, s.show]),
    [
      ["A new office", "system-integration", "yes"],
      ["A safer business", "cyber-security", "yes"],
      ["More customers", "website-development", "yes"],
    ],
  );
});

test("Technologies: logos keep their tab and logo, unsafe logo links are dropped", () => {
  const tech = getHomeBlockDef("home_tech")!;
  const saved = sanitizeHomeBlock(tech, {
    tabs: [{ title: " Backup ", description: "Restores", show: "yes" }],
    logos: [
      { title: "Veeam", tab: " Backup ", logo: "/api/media/7/veeam.svg", show: "yes" },
      { title: "Bad", tab: "Backup", logo: "javascript:alert(1)", show: "no" },
      { title: "", tab: "Backup", logo: "" },
    ],
  });
  assert.deepEqual(saved.tabs, [{ title: "Backup", description: "Restores", show: "yes" }]);
  assert.deepEqual(saved.logos, [
    { title: "Veeam", tab: "Backup", show: "yes", logo: "/api/media/7/veeam.svg" },
    { title: "Bad", tab: "Backup", show: "no", logo: "" },
  ]);
});

test("Technologies: every default logo names one of the default tabs", () => {
  const tech = getHomeBlockDef("home_tech")!;
  const tabs = new Set(tech.defaults.lists.tabs.map((tab) => tab.title));
  for (const logo of tech.defaults.lists.logos) assert.ok(tabs.has(logo.tab), logo.title);
});

test("Insights: the featured article is a post slug or “latest”", () => {
  const insights = getHomeBlockDef("home_insights")!;
  const featured = (value: string) => sanitizeHomeBlock(insights, { featured: value }).featured;
  assert.equal(featured("crm-data-migration-checklist"), "crm-data-migration-checklist");
  assert.equal(featured("latest"), "latest");
  assert.equal(featured("javascript:alert(1)"), "latest");
  assert.equal(featured(""), "latest");
  // The list length is one of its choices.
  assert.equal(sanitizeHomeBlock(insights, { list_count: "4" }).list_count, "4");
  assert.equal(sanitizeHomeBlock(insights, { list_count: "40" }).list_count, "1");
});

test("Insights: topics keep their category as written", () => {
  const insights = getHomeBlockDef("home_insights")!;
  const saved = sanitizeHomeBlock(insights, { topics: [{ title: "Web", category: " Web Development ", show: "yes" }, { title: "", category: "Cloud" }] });
  assert.deepEqual(saved.topics, [{ title: "Web", category: "Web Development", show: "yes" }]);
});
