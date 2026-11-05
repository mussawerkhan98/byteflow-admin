import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  LIMITS,
  SETTING_DEFAULTS,
  buildSeed,
  internalLinks,
  linkProblem,
  sanitizeCta,
  sanitizeGroups,
  sanitizeNav,
  sanitizeSettings,
  settingsWithDefaults,
} from "../app/lib/header-menu-admin";

test("links must be a path on this site or a full https address", () => {
  assert.equal(linkProblem("/contact-us"), null);
  assert.equal(linkProblem("/#services"), null);
  assert.equal(linkProblem("https://wa.me/971543282042"), null);
  assert.ok(linkProblem("http://example.com"));
  assert.ok(linkProblem("//evil.example"));
  assert.ok(linkProblem("javascript:alert(1)"));
  assert.ok(linkProblem("contact-us"));
  assert.ok(linkProblem("/contact us"));
  assert.ok(linkProblem(""));
  assert.equal(linkProblem("", { required: false }), null);
});

test("only internal paths are checked for 404, without anchors or queries, once each", () => {
  assert.deepEqual(internalLinks(["/blog", "/#services", "https://wa.me/1", "/blog?x=1", ""]), ["/blog", "/"]);
});

test("bar entries: labels required and short, one entry per mega menu, link entries need a link", () => {
  const ok = sanitizeNav([
    { label: "Services", kind: "services", href: "", visible: true },
    { label: "Insights", kind: "insights", href: "/blog", visible: 1 },
  ]);
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.value[1].visible, true);

  const bad = sanitizeNav([
    { label: "", kind: "link", href: "/x" },
    { label: "A label that is far too long for the bar", kind: "link", href: "/x" },
    { label: "No link", kind: "link", href: "" },
    { label: "Services", kind: "services" },
    { label: "Services again", kind: "services" },
  ]);
  assert.ok(!bad.ok);
  assert.equal(bad.ok ? 0 : bad.errors.length, 4);
});

test("an unknown entry type is saved as a plain link", () => {
  const result = sanitizeNav([{ label: "Odd", kind: "weird", href: "/odd" }]);
  assert.ok(result.ok && result.value[0].kind === "link");
});

test("services need a link on every item; industries may wait for their page", () => {
  const group = { title: "G", visible: true, items: [{ label: "Item", href: "", visible: true }] };
  assert.ok(!sanitizeGroups("services", [group]).ok);
  assert.ok(sanitizeGroups("industries", [group]).ok);
});

test("descriptions and group sizes are capped so the menu keeps its shape", () => {
  const long = "x".repeat(LIMITS.itemDescription + 1);
  const result = sanitizeGroups("services", [
    { title: "G", visible: true, items: [{ label: "Item", href: "/a", description: long, visible: true }] },
  ]);
  assert.ok(!result.ok);
  const many = Array.from({ length: LIMITS.groups + 1 }, () => ({ title: "G", visible: true, items: [] }));
  assert.ok(!sanitizeGroups("services", many).ok);
});

test("a picked service keeps its id; anything else is stored as a custom link", () => {
  const result = sanitizeGroups("services", [
    { title: "G", visible: true, items: [
      { service_id: "3", label: "IT AMC", href: "/it-amc-services-dubai", visible: true },
      { service_id: "nope", label: "Custom", href: "https://example.com", visible: true },
    ] },
  ]);
  assert.ok(result.ok);
  assert.deepEqual(result.ok && result.value[0].items.map((item) => item.service_id), [3, null]);
});

test("settings: switches become 1/0, the article count is 1 to 6, bad links are refused", () => {
  const ok = sanitizeSettings("insights", { "insights.latest_count": "4", "insights.view_all_link": "/blog" });
  assert.ok(ok.ok && ok.value["insights.latest_count"] === "4");
  assert.ok(!sanitizeSettings("insights", { "insights.latest_count": "9" }).ok);
  assert.ok(!sanitizeSettings("insights", { "insights.footer_link": "ftp://x" }).ok);
  const bar = sanitizeSettings("bar", { "header.theme_toggle": false });
  assert.ok(bar.ok && bar.value["header.theme_toggle"] === "0");
});

test("the button's phone wording is kept short", () => {
  assert.ok(sanitizeCta({ label: "Get a Free Quote", short_label: "Free Quote", link: "/contact-us" }).ok);
  assert.ok(!sanitizeCta({ short_label: "A much longer phone label" }).ok);
});

test("blank settings in the form show the defaults; saved ones are kept", () => {
  const values = settingsWithDefaults({ "insights.heading": "Saved" });
  assert.equal(values["insights.heading"], "Saved");
  assert.equal(values["insights.eyebrow"], SETTING_DEFAULTS["insights.eyebrow"]);
});

test("the seed reproduces today's header: Home and the button's page dropped, Blog becomes Insights, Industries hidden", () => {
  const seed = buildSeed({
    menuItems: [
      { label: "Home", href: "/", visible: true, new_tab: false },
      { label: "About Us", href: "/about-us", visible: true, new_tab: false },
      { label: "Services", href: "#", visible: true, new_tab: false },
      { label: "Blog", href: "/blog", visible: true, new_tab: false },
      { label: "Contact Us", href: "/contact-us", visible: true, new_tab: false },
    ],
    siteSettings: { header_cta_link: "" },
    savedBlock: null,
    services: [{ id: 28, slug: "landing-page-designing" }],
  });
  assert.deepEqual(
    seed.nav.map((row) => `${row.label}:${row.kind}:${row.visible ? "on" : "off"}`),
    ["About Us:link:on", "Services:services:on", "Industries:industries:off", "Blog:insights:on"],
  );
  const landing = seed.groups.flatMap((g) => g.items).find((item) => item.href === "/landing-page-designing");
  assert.equal(landing?.service_id, 28);
  const industries = seed.groups.find((g) => g.menu === "industries");
  assert.ok(industries && industries.items.length === 7 && industries.items.every((item) => item.href === ""));
});

test("the seed uses a saved header_menu block and the header bar wording when they exist", () => {
  const seed = buildSeed({
    menuItems: [],
    siteSettings: { header_dropdown_note: "Unsure?", header_cta_link: "/quote" },
    savedBlock: {
      heading: "Saved heading",
      services: [{ group: "Only", title: "Cloud", description: "", link: "/cloud-services-dubai" }],
      industries: [{ title: "Logistics", link: "/#industries" }],
    },
    services: [],
  });
  assert.equal(seed.settings["services.intro_heading"], "Saved heading");
  assert.equal(seed.settings["services.footer_text"], "Unsure?");
  assert.equal(seed.settings["services.footer_link"], "/quote");
  assert.deepEqual(seed.groups.map((g) => g.title), ["Only", "Industries"]);
  // A home-page anchor is not a page: the industry waits for one.
  assert.equal(seed.groups[1].items[0].href, "");
  // No header links saved: the built-in bar.
  assert.deepEqual(seed.nav.map((row) => row.label), ["Services", "Industries", "Projects", "About", "Insights"]);
});
