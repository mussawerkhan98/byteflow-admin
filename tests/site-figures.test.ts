import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkSiteFigures } from "../app/lib/site-figures";

const now = new Date("2026-11-05T12:00:00Z");
const check = (data: Record<string, string>) => checkSiteFigures(data, now);

test("blank figures are fine: the website shows its defaults", () => {
  assert.doesNotThrow(() => check({}));
  assert.doesNotThrow(() => check({ client_count: "", google_rating: "", founded_year: "" }));
});

test("the figures accept what the website can count up to", () => {
  assert.doesNotThrow(() =>
    check({ client_count: "574", google_review_count: "50+", google_rating: "4.9", founded_year: "2017", google_business_url: "https://g.page/r/abc" }),
  );
});

test("the figures refuse what would break the count or mislead", () => {
  assert.throws(() => check({ client_count: "about 500" }), /Number of clients/);
  assert.throws(() => check({ google_review_count: "lots" }), /Google reviews/);
  assert.throws(() => check({ google_rating: "5.5" }), /Google rating/);
  assert.throws(() => check({ google_rating: "4.95" }), /Google rating/);
  assert.throws(() => check({ founded_year: "2030" }), /no later than 2026/);
  assert.throws(() => check({ founded_year: "17" }), /four-digit/);
  assert.throws(() => check({ google_business_url: "http://g.page/r/abc" }), /https/);
});
