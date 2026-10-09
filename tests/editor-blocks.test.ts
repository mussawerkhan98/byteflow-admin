/**
 * Tests for how the editor regroups loose content into real blocks.
 *
 * The cases that matter are the shapes the browser actually produces: a bare
 * first line, `<div>` lines from Enter, `<br>` lines from Shift+Enter, and a
 * mixture of those with headings the writer has already applied.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  groupChildren,
  isAlreadyNormalized,
  isBlockTag,
  isConvertibleTag,
  type ChildKind,
} from "../app/lib/editor-blocks";

test("headings, lists and quotes count as blocks; inline tags do not", () => {
  for (const tag of ["p", "H2", "h3", "blockquote", "ul", "ol", "table"]) {
    assert.equal(isBlockTag(tag), true, tag);
  }
  for (const tag of ["b", "i", "span", "a", "br", "div"]) {
    assert.equal(isBlockTag(tag), false, tag);
  }
});

test("div is singled out for conversion rather than kept", () => {
  assert.equal(isConvertibleTag("div"), true);
  assert.equal(isConvertibleTag("DIV"), true);
  assert.equal(isConvertibleTag("p"), false);
  assert.equal(isBlockTag("div"), false);
});

test("a run of inline nodes becomes one paragraph", () => {
  const kinds: ChildKind[] = ["inline", "inline", "inline"];
  assert.deepEqual(groupChildren(kinds), [{ kind: "wrap", indices: [0, 1, 2] }]);
});

test("a break ends the line and is dropped", () => {
  // "Alpha<br>Beta<br>Gamma" -- the shape Shift+Enter produces
  const kinds: ChildKind[] = ["inline", "break", "inline", "break", "inline"];
  assert.deepEqual(groupChildren(kinds), [
    { kind: "wrap", indices: [0] },
    { kind: "wrap", indices: [2] },
    { kind: "wrap", indices: [4] },
  ]);
});

test("the bare first line plus div lines -- what Enter actually produces", () => {
  // "Alpha one two<div>Beta</div><div>Gamma</div>"
  const kinds: ChildKind[] = ["inline", "convert", "convert"];
  assert.deepEqual(groupChildren(kinds), [
    { kind: "wrap", indices: [0] },
    { kind: "convert", index: 1 },
    { kind: "convert", index: 2 },
  ]);
});

test("an existing block ends the run and is left alone", () => {
  // "text<h2>Heading</h2>more text"
  const kinds: ChildKind[] = ["inline", "block", "inline"];
  assert.deepEqual(groupChildren(kinds), [
    { kind: "wrap", indices: [0] },
    { kind: "keep", index: 1 },
    { kind: "wrap", indices: [2] },
  ]);
});

test("inline nodes around a break group into the line they belong to", () => {
  // "plain <b>bold</b><br>second line"
  const kinds: ChildKind[] = ["inline", "inline", "break", "inline"];
  assert.deepEqual(groupChildren(kinds), [
    { kind: "wrap", indices: [0, 1] },
    { kind: "wrap", indices: [3] },
  ]);
});

test("consecutive and edge breaks never produce an empty paragraph", () => {
  assert.deepEqual(groupChildren(["break", "inline"]), [
    { kind: "wrap", indices: [1] },
  ]);
  assert.deepEqual(groupChildren(["inline", "break"]), [
    { kind: "wrap", indices: [0] },
  ]);
  assert.deepEqual(groupChildren(["inline", "break", "break", "inline"]), [
    { kind: "wrap", indices: [0] },
    { kind: "wrap", indices: [3] },
  ]);
  assert.deepEqual(groupChildren(["break", "break"]), []);
});

test("an empty editor groups to nothing", () => {
  assert.deepEqual(groupChildren([]), []);
});

test("content that is already clean blocks is left untouched", () => {
  assert.equal(isAlreadyNormalized(["block", "block", "block"]), true);
  assert.equal(isAlreadyNormalized(["block", "convert"]), false);
  assert.equal(isAlreadyNormalized(["block", "inline"]), false);
  assert.equal(isAlreadyNormalized(["block", "break"]), false);
  // Nothing to normalize is not the same as normalized; an empty editor
  // should not short-circuit the first paragraph into existence.
  assert.equal(isAlreadyNormalized([]), false);
});
