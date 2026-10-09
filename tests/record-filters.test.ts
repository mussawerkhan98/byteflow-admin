/**
 * Tests for the admin list's status and category filters. Run with `npm test`.
 *
 * The cases that matter are the ones a browser would not make obvious: a
 * published flag arriving as 0/1 from SQLite rather than a boolean, and a
 * category that is missing, blank, or padded with spaces.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  NO_CATEGORY_KEY,
  NO_CATEGORY_LABEL,
  categoryOf,
  categoryOptions,
  filterRecords,
  isPublished,
  matchesCategory,
  matchesStatus,
  publishedCount,
} from "../app/lib/record-filters";

const post = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: "A post",
  category: "IT Support",
  published: 1,
  ...over,
});

test("published reads SQLite's 0/1 as well as booleans and strings", () => {
  assert.equal(isPublished(post({ published: 1 })), true);
  assert.equal(isPublished(post({ published: true })), true);
  assert.equal(isPublished(post({ published: "1" })), true);
  assert.equal(isPublished(post({ published: 0 })), false);
  assert.equal(isPublished(post({ published: false })), false);
  assert.equal(isPublished(post({ published: null })), false);
  assert.equal(isPublished(post({})), true);
  assert.equal(isPublished({ id: 2 }), false);
});

test("a category is trimmed, and anything empty counts as none", () => {
  assert.equal(categoryOf(post({ category: "  AMC  " })), "AMC");
  assert.equal(categoryOf(post({ category: "" })), "");
  assert.equal(categoryOf(post({ category: "   " })), "");
  assert.equal(categoryOf(post({ category: null })), "");
  assert.equal(categoryOf({ id: 3 }), "");
});

test("the status filter splits published from draft and 'all' keeps both", () => {
  const published = post({ published: 1 });
  const draft = post({ published: 0 });
  assert.equal(matchesStatus(published, "published"), true);
  assert.equal(matchesStatus(published, "draft"), false);
  assert.equal(matchesStatus(draft, "draft"), true);
  assert.equal(matchesStatus(draft, "published"), false);
  assert.equal(matchesStatus(draft, "all"), true);
  assert.equal(matchesStatus(published, "all"), true);
});

test("the category filter matches on the trimmed value and has a bucket for none", () => {
  assert.equal(matchesCategory(post({ category: " AMC " }), "AMC"), true);
  assert.equal(matchesCategory(post({ category: "AMC" }), "Cloud"), false);
  assert.equal(matchesCategory(post({ category: "" }), NO_CATEGORY_KEY), true);
  assert.equal(matchesCategory(post({ category: "AMC" }), NO_CATEGORY_KEY), false);
  assert.equal(matchesCategory(post({ category: "AMC" }), "all"), true);
});

test("the two filters combine", () => {
  const records = [
    post({ id: 1, category: "AMC", published: 1 }),
    post({ id: 2, category: "AMC", published: 0 }),
    post({ id: 3, category: "Cloud", published: 1 }),
    post({ id: 4, category: "", published: 0 }),
  ];
  const ids = (list: { id: unknown }[]) => list.map((record) => record.id);

  assert.deepEqual(ids(filterRecords(records, { status: "all", category: "all" })), [1, 2, 3, 4]);
  assert.deepEqual(ids(filterRecords(records, { status: "published", category: "all" })), [1, 3]);
  assert.deepEqual(ids(filterRecords(records, { status: "draft", category: "all" })), [2, 4]);
  assert.deepEqual(ids(filterRecords(records, { status: "all", category: "AMC" })), [1, 2]);
  assert.deepEqual(ids(filterRecords(records, { status: "draft", category: "AMC" })), [2]);
  assert.deepEqual(ids(filterRecords(records, { status: "draft", category: NO_CATEGORY_KEY })), [4]);
  assert.deepEqual(ids(filterRecords(records, { status: "published", category: NO_CATEGORY_KEY })), []);
});

test("filtering never mutates the list it was given", () => {
  const records = [post({ id: 1, published: 1 }), post({ id: 2, published: 0 })];
  const copy = [...records];
  filterRecords(records, { status: "draft", category: "all" });
  assert.deepEqual(records, copy);
});

test("category options count each category and push the empty bucket last", () => {
  const records = [
    post({ category: "Cloud" }),
    post({ category: "AMC" }),
    post({ category: "AMC" }),
    post({ category: "" }),
    post({ category: "  AMC  " }),
  ];
  assert.deepEqual(categoryOptions(records), [
    { key: "AMC", label: "AMC", count: 3 },
    { key: "Cloud", label: "Cloud", count: 1 },
    { key: NO_CATEGORY_KEY, label: NO_CATEGORY_LABEL, count: 1 },
  ]);
});

test("category options on an empty list are empty, not a stray bucket", () => {
  assert.deepEqual(categoryOptions([]), []);
});

test("the published count matches what the status filter returns", () => {
  const records = [
    post({ published: 1 }),
    post({ published: 0 }),
    post({ published: "1" }),
  ];
  assert.equal(publishedCount(records), 2);
  assert.equal(
    filterRecords(records, { status: "published", category: "all" }).length,
    publishedCount(records),
  );
  assert.equal(
    filterRecords(records, { status: "draft", category: "all" }).length,
    records.length - publishedCount(records),
  );
});
