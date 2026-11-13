import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { getHomeBlockDef, sanitizeHomeBlock, servicePageBlocks } from "../app/lib/home-sections";
import { previewLink, previewPath } from "../app/lib/preview-link";

const amcPlans = getHomeBlockDef("amc_plans")!;

test("a package saves its price type, visibility, button, deliverables, groups and extras", () => {
  const saved = sanitizeHomeBlock(amcPlans, {
    plans: [
      { title: "Growth", price_type: "from", price: "AED 3,500", show: "no", button_label: "Book a call", button_link: "javascript:alert(1)", d_keywords: "25", g_technical: "Site audit\nSpeed fixes", excluded: "Ad spend", extras: "Extra pages: AED 300 each" },
      { title: "Old plan saved before the new fields", price: "AED 30" },
    ],
  }) as { plans: Record<string, string>[] };
  const [growth, old] = saved.plans;
  assert.equal(growth.price_type, "from");
  assert.equal(growth.show, "no");
  assert.equal(growth.button_label, "Book a call");
  assert.equal(growth.button_link, "", "unsafe links are dropped");
  assert.equal(growth.d_keywords, "25");
  assert.equal(growth.g_technical, "Site audit\nSpeed fixes");
  assert.equal(growth.extras, "Extra pages: AED 300 each");
  // Unknown or missing choices fall to the first option: shown, at a fixed price.
  assert.equal(old.show, "yes");
  assert.equal(old.price_type, "fixed");
});

test("the section saves a description, the custom-quote words and grouped table rows", () => {
  const saved = sanitizeHomeBlock(amcPlans, {
    intro: "Monthly SEO packages for UAE businesses.",
    custom_label: "Request Pricing",
    compare: [{ title: "Technical audit", group: "Technical", plan1: "yes" }],
  }) as Record<string, unknown>;
  assert.equal(saved.intro, "Monthly SEO packages for UAE businesses.");
  assert.equal(saved.custom_label, "Request Pricing");
  assert.equal((saved.compare as Record<string, string>[])[0].group, "Technical");
});

test("only service pages choose their banner card; it starts on what's included", () => {
  const plans = servicePageBlocks("digital-marketing").find((block) => block.sectionType === "svc_plans")!;
  const card = plans.fields.find((field) => field.name === "banner_card")!;
  assert.equal(card.options?.[0]?.value, "included");
  assert.equal((sanitizeHomeBlock(plans, {}) as Record<string, string>).banner_card, "included");
  assert.ok(!amcPlans.fields.some((field) => field.name === "banner_card"));
});

test("a preview link is signed for its path and expires within the hour", () => {
  const secret = "a-long-shared-secret-value";
  const now = 1_800_000_000_000;
  const link = new URL(previewLink("/digital-marketing", secret, now)!);
  assert.equal(link.pathname, "/api/preview");
  const path = link.searchParams.get("path")!;
  const expires = Number(link.searchParams.get("expires"));
  assert.equal(path, "/digital-marketing");
  assert.ok(expires > now / 1000 && expires <= now / 1000 + 3600);
  // The website checks the same signature (byteflow, app/lib/preview.ts).
  assert.equal(link.searchParams.get("signature"), createHmac("sha256", secret).update(`preview:${path}:${expires}`).digest("hex"));
  assert.equal(previewLink("/digital-marketing", "short", now), null);
  assert.equal(previewPath("//evil.example"), null);
});

const servicePlans = servicePageBlocks("cloud-services-dubai").find((block) => block.sectionType === "svc_plans")!;

test("service pages take 12 packages, each with a billing unit, a two-part price and third-party costs", () => {
  const [plans, compare] = servicePlans.lists;
  assert.equal(plans.max, 12);
  const saved = sanitizeHomeBlock(servicePlans, {
    plans: Array.from({ length: 13 }, (_, i) => ({ title: `Plan ${i + 1}`, unit_type: i === 0 ? "user_month" : "made-up", unit_custom: "per mailbox / month", setup_fee: "AED 2,000", management_fee: "AED 450", third_party: "Microsoft 365 subscriptions billed separately" })),
    compare: [{ title: "Backup", plan12: "yes" }],
  }) as { plans: Record<string, string>[]; compare: Record<string, string>[] };
  assert.equal(saved.plans.length, 12);
  assert.equal(saved.plans[0].unit_type, "user_month");
  assert.equal(saved.plans[1].unit_type, "", "an unknown unit falls back to the page default");
  assert.equal(saved.plans[0].setup_fee, "AED 2,000");
  assert.equal(saved.plans[0].management_fee, "AED 450");
  assert.equal(saved.plans[0].third_party, "Microsoft 365 subscriptions billed separately");
  assert.equal(saved.compare[0].plan12, "yes");
  assert.ok(compare.fields.some((field) => field.name === "plan12"));
});

test("service pages switch the table and the quote form filling; the IT AMC form is unchanged", () => {
  const saved = sanitizeHomeBlock(servicePlans, { show_table: "no", quote_prefill: "yes", unit_device_month: "per device / month" }) as Record<string, string>;
  assert.equal(saved.show_table, "no");
  assert.equal(saved.quote_prefill, "yes");
  assert.equal(saved.unit_device_month, "per device / month");
  const amcNames = [...amcPlans.fields, ...amcPlans.lists.flatMap((list) => list.fields)].map((field) => field.name);
  for (const name of ["show_table", "quote_prefill", "unit_month", "unit_type", "setup_fee", "third_party", "plan5"]) assert.ok(!amcNames.includes(name), name);
  assert.equal(amcPlans.lists[0].max, 4);
});

test("service pages choose cards or a price list; the IT AMC form has no such choice", () => {
  assert.equal((sanitizeHomeBlock(servicePlans, { layout: "list" }) as Record<string, string>).layout, "list");
  assert.equal((sanitizeHomeBlock(servicePlans, { layout: "grid" }) as Record<string, string>).layout, "auto");
  assert.ok(!amcPlans.fields.some((field) => field.name === "layout"));
});
