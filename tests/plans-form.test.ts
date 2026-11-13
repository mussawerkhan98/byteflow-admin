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
