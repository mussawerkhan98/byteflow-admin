"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  groupChildren,
  isAlreadyNormalized,
  needsNormalizing,
  isBlockTag,
  isConvertibleTag,
  type ChildKind,
} from "../../lib/editor-blocks";
import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faBold,
  faEraser,
  faItalic,
  faLink,
  faListOl,
  faListUl,
  faQuoteLeft,
  faTable,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";

export default function RichTextEditor({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const editor = useRef<HTMLDivElement>(null);
  // The button a real interaction started on. A genuine click always begins
  // with a mousedown on that button, and a keyboard activation with a keydown
  // on it. A click that arrives with neither came from focus landing on the
  // button by itself, which is not something the writer asked for.
  const armed = useRef<EventTarget | null>(null);
  const [sourceMode, setSourceMode] = useState(false);

  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) {
      editor.current.innerHTML = value;
    }
  }, [value]);

  // Both are document-wide switches rather than per-element ones, and the
  // browser's defaults are the wrong way round for saved content: Enter would
  // make <div> and bold would make a styled <span>. Set them as soon as the
  // editor exists so even plain typing produces paragraphs.
  useEffect(() => {
    setEditingModes();
  }, []);

  /**
   * Commands that act on whole blocks rather than on the selected characters.
   * These are the ones that misbehave when the content has no block structure,
   * so the editor is tidied up before any of them runs.
   */
  const BLOCK_COMMANDS = new Set([
    "formatBlock",
    "insertUnorderedList",
    "insertOrderedList",
  ]);

  function kindOf(node: ChildNode): ChildKind {
    if (node.nodeType === Node.TEXT_NODE) return "inline";
    if (node.nodeType !== Node.ELEMENT_NODE) return "inline";
    const tag = (node as HTMLElement).tagName;
    if (tag === "BR") return "break";
    if (isConvertibleTag(tag)) return "convert";
    if (isBlockTag(tag)) return "block";
    return "inline";
  }

  /** Character offset of a selection boundary, counted from the start. */
  function offsetOf(root: HTMLElement, node: Node, offset: number) {
    const range = document.createRange();
    range.selectNodeContents(root);
    try {
      range.setEnd(node, offset);
    } catch {
      return 0;
    }
    return range.toString().length;
  }

  /** The text node and offset that a character offset lands on. */
  function locate(root: HTMLElement, target: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let seen = 0;
    let last: Text | null = null;
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (seen + node.length >= target) {
        return { node, offset: Math.max(0, target - seen) };
      }
      seen += node.length;
      last = node;
      node = walker.nextNode() as Text | null;
    }
    return last ? { node: last, offset: last.length } : null;
  }

  function restore(root: HTMLElement, start: number, end: number) {
    const from = locate(root, start);
    const to = locate(root, end);
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    if (from) range.setStart(from.node, from.offset);
    else range.selectNodeContents(root);
    if (to) range.setEnd(to.node, to.offset);
    else range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Give the content real blocks.
   *
   * Typing into an empty editor leaves the first line as a bare text node,
   * Enter produces `<div>` and Shift+Enter produces `<br>`. With nothing to
   * wrap, `formatBlock` splices a heading into the middle of what it finds --
   * producing an `<h2>` nested inside a `<p>` -- which is what made applying a
   * format to one line change the look of another. Returns whether anything
   * moved, so the caller only restores the caret when it had to.
   */
  /** How many direct children are blocks still holding a soft line break. */
  function blocksHoldingBreaks(root: HTMLElement) {
    let count = 0;
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const element = child as HTMLElement;
      const tag = element.tagName;
      if (!isBlockTag(tag) && !isConvertibleTag(tag)) continue;
      if (["UL", "OL", "TABLE", "FIGURE", "PRE"].includes(tag)) continue;
      if (element.querySelector(":scope > br")) count += 1;
    }
    return count;
  }

  function normalize(root: HTMLElement) {
    // Ask before touching anything. Replacing the children discards the node
    // the caret is in, and the browser answers by moving focus to the next
    // focusable element — a toolbar button — and scrolling. On a tidy
    // document there is nothing to gain by paying that price.
    if (!needsNormalizing(Array.from(root.childNodes).map(kindOf), blocksHoldingBreaks(root))) {
      return false;
    }
    let changed = false;
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && !(child.textContent ?? "").trim()) {
        child.remove();
        changed = true;
      }
    }
    // A div or paragraph holding other blocks is scaffolding; lift its
    // children out first so it never becomes a paragraph wrapped round a
    // heading or a list.
    if (liftBlocks(root)) changed = true;
    // Split a block that holds soft line breaks into one block per line.
    for (const child of Array.from(root.childNodes)) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const element = child as HTMLElement;
      const tag = element.tagName;
      if (!isBlockTag(tag) && !isConvertibleTag(tag)) continue;
      if (["UL", "OL", "TABLE", "FIGURE", "PRE"].includes(tag)) continue;
      if (!element.querySelector(":scope > br")) continue;
      const name = isConvertibleTag(tag) ? "p" : tag.toLowerCase();
      const children = Array.from(element.childNodes);
      const pieces: Node[] = [];
      for (const segment of groupChildren(children.map(kindOf))) {
        if (segment.kind === "wrap") {
          const block = document.createElement(name);
          for (const index of segment.indices) block.appendChild(children[index]);
          pieces.push(block);
        } else {
          pieces.push(children[segment.index]);
        }
      }
      element.replaceWith(...pieces);
      changed = true;
    }
    const children = Array.from(root.childNodes);
    const kinds = children.map(kindOf);
    // Already clean, so the caret is left exactly where the writer put it --
    // but say so if an earlier step above moved nodes, because the selection
    // is then pointing at nodes that are no longer in the document.
    if (isAlreadyNormalized(kinds)) return changed;
    const blocks: Node[] = [];
    for (const segment of groupChildren(kinds)) {
      if (segment.kind === "wrap") {
        const block = document.createElement("p");
        for (const index of segment.indices) block.appendChild(children[index]);
        blocks.push(block);
      } else if (segment.kind === "convert") {
        const old = children[segment.index] as HTMLElement;
        const block = document.createElement("p");
        while (old.firstChild) block.appendChild(old.firstChild);
        blocks.push(block);
      } else {
        blocks.push(children[segment.index]);
      }
    }
    root.replaceChildren(...blocks);
    return true;
  }

  function setEditingModes() {
    try {
      document.execCommand("styleWithCSS", false, "false");
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // Older engines reject the command names; the editor still works.
    }
  }

  /**
   * A list or heading the browser has left sitting inside a paragraph is
   * invalid HTML and renders unpredictably on the website. Unwrapping keeps
   * the inner nodes themselves, so the caret inside them survives.
   */
  function liftBlocks(root: HTMLElement) {
    let changed = false;
    for (let pass = 0; pass < 3; pass += 1) {
      let lifted = false;
      for (const child of Array.from(root.childNodes)) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const element = child as HTMLElement;
        if (element.tagName !== "P" && !isConvertibleTag(element.tagName)) continue;
        const holdsBlock = Array.from(element.childNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (isBlockTag((node as HTMLElement).tagName) ||
              isConvertibleTag((node as HTMLElement).tagName)),
        );
        if (holdsBlock) {
          element.replaceWith(...Array.from(element.childNodes));
          lifted = true;
          changed = true;
        }
      }
      if (!lifted) break;
    }
    return changed;
  }

  function run(command: string, argument?: string) {
    const root = editor.current;
    if (!root) return;
    // Rebuilding the content and moving the caret both make the browser
    // scroll. The writer was already looking at the right place, so put the
    // page back where they left it rather than wherever the browser lands.
    const scroll = window.scrollY;
    root.focus();
    const selection = window.getSelection();
    // A toolbar click with the caret outside the editor used to format
    // whatever happened to be selected elsewhere on the page.
    if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    // Re-assert them here too: they are document-wide, so anything else on
    // the page that calls execCommand can flip them back.
    setEditingModes();
    if (BLOCK_COMMANDS.has(command)) {
      const live = window.getSelection();
      const start = live?.anchorNode ? offsetOf(root, live.anchorNode, live.anchorOffset) : 0;
      const end = live?.focusNode ? offsetOf(root, live.focusNode, live.focusOffset) : start;
      if (normalize(root)) restore(root, Math.min(start, end), Math.max(start, end));
    }
    document.execCommand(command, false, argument);
    liftBlocks(root);
    onChange(root.innerHTML);
    if (window.scrollY !== scroll) window.scrollTo({ top: scroll });
  }

  /** The block the caret sits in, so a heading button can toggle back off. */
  function currentBlock() {
    const root = editor.current;
    const node = window.getSelection()?.anchorNode;
    if (!root || !node || !root.contains(node)) return "";
    let element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    while (element && element !== root) {
      if (isBlockTag(element.tagName)) return element.tagName.toLowerCase();
      element = element.parentElement;
    }
    return "";
  }

  function setBlock(tag: string) {
    run("formatBlock", currentBlock() === tag ? "p" : tag);
  }

  function addLink() {
    const url = window.prompt("Enter the link URL");
    if (url) run("createLink", url);
  }

  function addTable() {
    const rowAnswer = window.prompt("Number of rows (1–20)", "3");
    if (rowAnswer === null) return;
    const rows = Math.min(20, Math.max(1, Math.floor(Number(rowAnswer) || 3)));
    const columnAnswer = window.prompt("Number of columns (1–10)", "3");
    if (columnAnswer === null) return;
    const columns = Math.min(10, Math.max(1, Math.floor(Number(columnAnswer) || 3)));
    const cells = Array.from({ length: rows }, (_, row) =>
      `<tr>${Array.from({ length: columns }, () =>
        row === 0 ? "<th><br></th>" : "<td><br></td>",
      ).join("")}</tr>`,
    ).join("");
    run("insertHTML", `<div class="table-scroll"><table><tbody>${cells}</tbody></table></div><p><br></p>`);
  }

  const toolClass =
    "grid h-8 min-w-8 place-items-center rounded-md px-2 text-xs font-bold text-slate-300 transition hover:bg-white/[.07] hover:text-cyan-300";

  return (
    // No `overflow-hidden` here on purpose: it would make this box a scroll
    // container, and a sticky child sticks to its nearest scroll container
    // rather than to the window — which would stop the toolbar following the
    // page. The corners are rounded on the first and last children instead.
    <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950 focus-within:border-cyan-400">
      <div
        role="toolbar"
        aria-label="Text formatting"
        onMouseDown={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (!button) return;
          armed.current = button;
          // Keep the caret where it is: without this the editor loses the
          // selection the moment the button takes focus.
          event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const button = (event.target as HTMLElement).closest("button");
          if (button) armed.current = button;
        }}
        onClickCapture={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (!button) return;
          const wanted = armed.current === button;
          armed.current = null;
          if (wanted) return;
          // Chromium will focus a toolbar button and fire a click on it with
          // no pointer interaction at all after the editor loses focus. That
          // used to apply a heading to whatever the writer had just clicked.
          event.preventDefault();
          event.stopPropagation();
        }}
        // Long posts used to scroll the formatting buttons off the top of the
        // screen, so every heading or table meant scrolling back up. The bar
        // now rides along, parking below the mobile header and at the top of
        // the window on desktop, and stops at the end of the editor.
        className="sticky top-16 z-20 flex flex-wrap gap-1 rounded-t-xl border-b border-slate-800 bg-[#101c24] p-2 lg:top-0"
      >
        <button
          type="button"
          title="Heading 2"
          onClick={() => setBlock("h2")}
          className={toolClass}
        >
          H2
        </button>
        <button
          type="button"
          title="Heading 3"
          onClick={() => setBlock("h3")}
          className={toolClass}
        >
          H3
        </button>
        <button
          type="button"
          title="Paragraph"
          onClick={() => setBlock("p")}
          className={toolClass}
        >
          P
        </button>
        <span className="mx-1 w-px bg-slate-700" />
        <button
          type="button"
          title="Bold"
          onClick={() => run("bold")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          type="button"
          title="Italic"
          onClick={() => run("italic")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          type="button"
          title="Underline"
          onClick={() => run("underline")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button
          type="button"
          title="Bullet list"
          onClick={() => run("insertUnorderedList")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button
          type="button"
          title="Numbered list"
          onClick={() => run("insertOrderedList")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>
        <button
          type="button"
          title="Quote"
          onClick={() => setBlock("blockquote")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faQuoteLeft} />
        </button>
        <button
          type="button"
          title="Add link"
          onClick={addLink}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button
          type="button"
          title="Insert table"
          onClick={addTable}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faTable} />
        </button>
        <span className="mx-1 w-px bg-slate-700" />
        <button
          type="button"
          title="Undo"
          onClick={() => run("undo")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faArrowRotateLeft} />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => run("redo")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faArrowRotateRight} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          onClick={() => run("removeFormat")}
          className={toolClass}
        >
          <FontAwesomeIcon icon={faEraser} />
        </button>
        <button
          type="button"
          title={sourceMode ? "Return to visual editor" : "Edit live HTML"}
          aria-pressed={sourceMode}
          onClick={() => setSourceMode((current) => !current)}
          className={`${toolClass} ${sourceMode ? "bg-cyan-400 text-slate-950" : ""}`}
        >
          HTML
        </button>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-required={required}
        data-placeholder="Write the blog post content…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        hidden={sourceMode}
        className="rich-text-editor min-h-80 rounded-b-xl px-5 py-4 text-sm font-normal leading-7 text-slate-200 outline-none"
      />
      {sourceMode && (
        <textarea
          aria-label="Live HTML source"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-80 w-full resize-y rounded-b-xl bg-slate-950 px-5 py-4 font-mono text-sm font-normal leading-6 text-cyan-100 outline-none"
        />
      )}
      <input
        className="sr-only"
        tabIndex={-1}
        required={required}
        value={value.replace(/<[^>]*>/g, "").trim()}
        onChange={() => undefined}
      />
    </div>
  );
}
