/**
 * Block-structure helpers for the rich text editor.
 *
 * The editor is a `contentEditable` driven by `document.execCommand`. Left to
 * itself the browser writes content that has no block structure at all: the
 * first line of a fresh post is a bare text node, Enter produces `<div>`, and
 * Shift+Enter produces `<br>`. `execCommand("formatBlock")` then has nothing
 * sane to wrap, so it splices a heading into the middle of whatever it finds —
 * which is how an `<h2>` ends up inside a `<p>`, and how applying a format to
 * one line visibly changes another.
 *
 * These helpers decide how a parent's children should be regrouped into real
 * blocks. They are pure so the grouping rules can be tested without a DOM.
 */

/** Element names that are already a block and must be left as they are. */
export const BLOCK_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "UL", "OL", "PRE", "HR",
  "TABLE", "FIGURE",
]);

/**
 * `<div>` is a block, but it is the browser's default and not what we want in
 * saved content, so it is converted to a paragraph rather than preserved.
 */
export const CONVERT_TO_PARAGRAPH = new Set(["DIV"]);

export function isBlockTag(tag: string): boolean {
  return BLOCK_TAGS.has(tag.toUpperCase());
}

export function isConvertibleTag(tag: string): boolean {
  return CONVERT_TO_PARAGRAPH.has(tag.toUpperCase());
}

/** What a child looks like to the grouping rules. */
export type ChildKind = "inline" | "break" | "block" | "convert";

export type Segment =
  | { kind: "keep"; index: number }
  | { kind: "convert"; index: number }
  | { kind: "wrap"; indices: number[] };

/**
 * Group a parent's children into the blocks they should become.
 *
 * Runs of inline content are wrapped together into one paragraph; a `<br>`
 * ends the current run and is dropped, so each visual line becomes its own
 * block; an existing block is kept as it is and also ends the run. Runs that
 * would be empty (a leading `<br>`, or two in a row) produce nothing rather
 * than an empty paragraph.
 */
export function groupChildren(kinds: readonly ChildKind[]): Segment[] {
  const out: Segment[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length > 0) out.push({ kind: "wrap", indices: run });
    run = [];
  };
  kinds.forEach((kind, index) => {
    if (kind === "inline") {
      run.push(index);
      return;
    }
    flush();
    if (kind === "block") out.push({ kind: "keep", index });
    else if (kind === "convert") out.push({ kind: "convert", index });
    // "break" contributes nothing of its own; it only ended the run.
  });
  flush();
  return out;
}

/**
 * True when the children already form clean blocks, so the editor can skip
 * rewriting the DOM — and skip disturbing the caret — entirely.
 */
export function isAlreadyNormalized(kinds: readonly ChildKind[]): boolean {
  return kinds.length > 0 && kinds.every((kind) => kind === "block");
}

/**
 * Whether rewriting the content would change anything at all.
 *
 * Rewriting is costly in a way that has nothing to do with speed: replacing
 * the children throws away the node the caret sits in, and the browser reacts
 * by moving focus elsewhere and scrolling the page. So the editor asks this
 * first and leaves an already-tidy document completely alone.
 *
 * `blocksHoldingBreaks` counts direct children that are blocks still holding
 * a soft line break of their own, since those need splitting even when the
 * top level already looks clean.
 */
export function needsNormalizing(
  kinds: readonly ChildKind[],
  blocksHoldingBreaks: number,
): boolean {
  if (blocksHoldingBreaks > 0) return true;
  return kinds.length > 0 && !isAlreadyNormalized(kinds);
}
