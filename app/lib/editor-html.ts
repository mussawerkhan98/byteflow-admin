/**
 * Cleans the HTML that goes into blog posts and project pages.
 *
 * Pasted content arrives full of other sites' markup: paragraphs nested in
 * headings, styled spans that blow body text up on the website, and one <p>
 * holding a whole section split by <br>. This turns any of it into the small
 * vocabulary the website styles: headings, paragraphs, lists, quotes, links,
 * tables and images.
 *
 * It runs on paste, when leaving HTML view, when a post is opened, in the
 * server's save handler and in scripts/clean-rich-html.mjs -- so it has no
 * DOM and no imports: a small parser builds a tree, the tree is rebuilt from
 * the allowed parts, and the result is printed back to HTML. Running it on
 * its own output changes nothing.
 */

type TextNode = { type: "text"; text: string };
type ElementNode = { type: "el"; tag: string; attrs: Record<string, string>; children: HtmlNode[] };
type HtmlNode = TextNode | ElementNode;

// ---------------------------------------------------------------- parsing --

const VOID = new Set(["br", "img", "hr", "input", "meta", "link", "wbr", "col", "area", "base", "source", "track", "embed", "param"]);
/** Dropped with everything inside them. */
const DROP = new Set(["script", "style", "title", "template", "noscript", "textarea", "head", "svg", "math", "iframe", "object", "select", "button", "video", "audio", "canvas"]);
/** Opening one of these closes an open <p>, as browsers do. */
const CLOSES_P = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "blockquote", "figure", "pre", "hr", "section", "article", "header", "footer", "aside", "nav", "dl"]);

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

/** Index of the `>` that ends a tag, skipping any inside quoted values. */
function tagEnd(html: string, from: number) {
  let quote = "";
  for (let i = from; i < html.length; i += 1) {
    const char = html[i];
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === ">") return i;
  }
  return -1;
}

function parse(html: string): ElementNode {
  const root: ElementNode = { type: "el", tag: "#root", attrs: {}, children: [] };
  const stack: ElementNode[] = [root];
  const top = () => stack[stack.length - 1];
  const closeTo = (tag: string) => {
    const index = stack.map((node) => node.tag).lastIndexOf(tag);
    if (index > 0) stack.length = index;
  };
  /**
   * Close an open item (li, tr, td) on reaching the next one -- but only one
   * in the innermost list or table, so a nested list or table stays nested.
   */
  const closeSibling = (tags: string[], scopes: string[]) => {
    const names = stack.map((node) => node.tag);
    const item = Math.max(...tags.map((tag) => names.lastIndexOf(tag)));
    const scope = Math.max(...scopes.map((tag) => names.lastIndexOf(tag)));
    if (item > 0 && item > scope) stack.length = item;
  };
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      top().children.push({ type: "text", text: html.slice(i) });
      break;
    }
    if (lt > i) top().children.push({ type: "text", text: html.slice(i, lt) });
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html[lt + 1] === "!" || html[lt + 1] === "?") {
      const end = html.indexOf(">", lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }
    const closing = html[lt + 1] === "/";
    const nameMatch = /^[a-zA-Z][\w:-]*/.exec(html.slice(lt + (closing ? 2 : 1)));
    if (!nameMatch) {
      // A lone "<" in text.
      top().children.push({ type: "text", text: "&lt;" });
      i = lt + 1;
      continue;
    }
    const tag = nameMatch[0].toLowerCase();
    const end = tagEnd(html, lt);
    if (end === -1) break;
    i = end + 1;
    if (closing) {
      closeTo(tag);
      continue;
    }
    if (DROP.has(tag)) {
      const close = html.toLowerCase().indexOf(`</${tag}`, i);
      i = close === -1 ? html.length : Math.max(i, tagEnd(html, close) + 1);
      continue;
    }
    if (CLOSES_P.has(tag) && top().tag === "p") stack.pop();
    if (tag === "li") closeSibling(["li"], ["ul", "ol"]);
    if (tag === "td" || tag === "th") closeSibling(["td", "th"], ["tr", "table"]);
    if (tag === "tr") closeSibling(["tr"], ["table", "thead", "tbody", "tfoot"]);
    const element: ElementNode = {
      type: "el",
      tag,
      attrs: parseAttributes(html.slice(lt + 1 + nameMatch[0].length, end).replace(/\/\s*$/, "")),
      children: [],
    };
    top().children.push(element);
    if (!VOID.has(tag) && !/\/\s*$/.test(html.slice(lt, end))) stack.push(element);
  }
  return root;
}

// ------------------------------------------------------------- rebuilding --

const HEADINGS = new Set(["h2", "h3", "h4"]);
const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "figure", "figcaption", "pre", "hr", "div", "section", "article", "main", "header", "footer", "aside", "nav", "center", "address", "dl", "dt", "dd", "details", "summary", "form", "fieldset", "body", "html", "caption"]);
const FORMATTING = new Set(["strong", "b", "em", "i", "u", "a", "code"]);
/** A heading this long is a paragraph that was formatted by mistake. */
const MAX_HEADING_CHARS = 120;

const text = (value: string): TextNode => ({ type: "text", text: value });
const el = (tag: string, children: HtmlNode[] = [], attrs: Record<string, string> = {}): ElementNode => ({ type: "el", tag, attrs, children });
const isEl = (node: HtmlNode | undefined, tag?: string): node is ElementNode => node?.type === "el" && (!tag || node.tag === tag);

/** h1 is the post title, so it becomes h2; h5 and h6 become h4. */
function canonicalTag(tag: string) {
  if (tag === "h1") return "h2";
  if (tag === "h5" || tag === "h6") return "h4";
  if (tag === "strike" || tag === "s" || tag === "del") return "span";
  return tag;
}

function styleOf(node: ElementNode) {
  return (node.attrs.style ?? "").toLowerCase();
}

/**
 * Formatting that pasted content expresses only as CSS -- Google Docs marks
 * bold as a styled span, and wraps whole documents in a <b> that is not bold.
 */
function styledFormatting(node: ElementNode): string[] {
  const style = styleOf(node);
  const wrappers: string[] = [];
  if (/font-weight\s*:\s*(bold|[6-9]00)/.test(style)) wrappers.push("strong");
  if (/font-style\s*:\s*italic/.test(style)) wrappers.push("em");
  if (/text-decoration[^;]*underline/.test(style)) wrappers.push("u");
  return wrappers;
}

const notBold = (node: ElementNode) =>
  (node.tag === "b" || node.tag === "strong") && /font-weight\s*:\s*(normal|[1-4]00)/.test(styleOf(node));

function containsBlock(node: ElementNode): boolean {
  return node.children.some((child) => isEl(child) && (BLOCKS.has(canonicalTag(child.tag)) || containsBlock(child)));
}

function textOf(nodes: HtmlNode[]): string {
  return nodes.map((node) => (node.type === "text" ? node.text : textOf(node.children))).join("");
}

const hasImage = (nodes: HtmlNode[]): boolean =>
  nodes.some((node) => node.type === "el" && (node.tag === "img" || hasImage(node.children)));

const isEmpty = (nodes: HtmlNode[]) => !textOf(nodes).replace(/&nbsp;|&#160;/g, "").trim() && !hasImage(nodes);

function cleanText(value: string) {
  return value.replace(/&nbsp;|&#160;| /g, " ").replace(/[ \t\r\n\f]+/g, " ");
}

function safeUrl(value: string, kind: "href" | "src") {
  const url = (value ?? "").trim();
  if (!url || /^\/\//.test(url)) return "";
  if (/^(https?:|\/|#)/i.test(url)) return url;
  if (kind === "href" && /^(mailto|tel):/i.test(url)) return url;
  if (kind === "src" && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(url)) return url;
  return "";
}

function image(node: ElementNode): HtmlNode[] {
  const src = safeUrl(node.attrs.src ?? "", "src");
  if (!src) return [];
  const attrs: Record<string, string> = { src, alt: node.attrs.alt ?? "" };
  for (const size of ["width", "height"]) {
    if (/^\d{1,5}$/.test(node.attrs[size] ?? "")) attrs[size] = node.attrs[size];
  }
  return [el("img", [], attrs)];
}

/** Merge neighbouring text, then trim the ends and any <br> sitting at them. */
function tidyInline(nodes: HtmlNode[], trim = true): HtmlNode[] {
  const merged: HtmlNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") last.text = cleanText(last.text + node.text);
    else if (node.type === "text") merged.push(text(cleanText(node.text)));
    else merged.push(node);
  }
  let result = merged.filter((node) => node.type !== "text" || node.text !== "");
  if (!trim) return result;
  while (result.length && (isEl(result[0], "br") || (result[0].type === "text" && !result[0].text.trim()))) result = result.slice(1);
  while (result.length && (isEl(result[result.length - 1], "br") || (result[result.length - 1].type === "text" && !(result[result.length - 1] as TextNode).text.trim()))) result = result.slice(0, -1);
  const first = result[0];
  if (first?.type === "text") result[0] = text(first.text.replace(/^ +/, ""));
  const last = result[result.length - 1];
  if (last?.type === "text") result[result.length - 1] = text(last.text.replace(/ +$/, ""));
  return result;
}

/**
 * Content for a place that can only hold inline content: a paragraph,
 * heading, list item or table cell. Blocks found inside are flattened, with
 * a <br> where one block ended and the next began.
 */
function inlineOf(nodes: HtmlNode[]): HtmlNode[] {
  const out: HtmlNode[] = [];
  const boundary = () => {
    if (out.length && !isEl(out[out.length - 1], "br")) out.push(el("br"));
  };
  for (const node of nodes) {
    if (node.type === "text") {
      out.push(node);
      continue;
    }
    const tag = canonicalTag(node.tag);
    if (tag === "br") out.push(el("br"));
    else if (tag === "img") out.push(...image(node));
    else if (tag === "hr") boundary();
    else if (tag === "ul" || tag === "ol") {
      for (const item of node.children) {
        if (!isEl(item)) continue;
        boundary();
        out.push(...inlineOf(item.children));
      }
      boundary();
    } else if (BLOCKS.has(tag)) {
      boundary();
      out.push(...inlineOf(node.children));
      boundary();
    } else if (FORMATTING.has(tag) && !notBold(node)) {
      const inner = tidyInline(inlineOf(node.children), false);
      if (isEmpty(inner) && !inner.some((child) => isEl(child, "br"))) continue;
      if (tag === "a") {
        const href = safeUrl(node.attrs.href ?? "", "href");
        if (!href) {
          out.push(...inner);
          continue;
        }
        const attrs: Record<string, string> = { href };
        if (node.attrs.target === "_blank") Object.assign(attrs, { target: "_blank", rel: "noopener noreferrer" });
        out.push(el("a", inner, attrs));
      } else out.push(el(tag, inner));
    } else {
      // span, font and the like: keep the words, and any formatting their
      // style was carrying.
      let inner = inlineOf(node.children);
      for (const wrapper of styledFormatting(node)) inner = isEmpty(inner) ? inner : [el(wrapper, inner)];
      out.push(...inner);
    }
  }
  return out;
}

/**
 * Paragraphs from inline content, split where a <br> marks a new paragraph:
 * a double <br>, or one that follows the end of a sentence. Other <br>s --
 * an address, a line of a poem -- stay.
 */
function paragraphs(nodes: HtmlNode[]): ElementNode[] {
  const inline = tidyInline(nodes);
  const lines: HtmlNode[][] = [[]];
  const breaks: number[] = [];
  inline.forEach((node) => {
    if (isEl(node, "br")) {
      breaks.push(lines.length - 1);
      lines.push([]);
    } else lines[lines.length - 1].push(node);
  });
  const out: ElementNode[] = [];
  let current: HtmlNode[] = [];
  lines.forEach((line, index) => {
    current.push(...line);
    if (index === lines.length - 1) return;
    const next = lines[index + 1];
    const doubleBreak = isEmpty(line) || isEmpty(next);
    const endsSentence = /[.!?:;]["'”’)\]]*\s*$/.test(textOf(line));
    if (doubleBreak || endsSentence) {
      if (!isEmpty(current)) out.push(el("p", tidyInline(current)));
      current = [];
    } else current.push(el("br"));
  });
  if (!isEmpty(current)) out.push(el("p", tidyInline(current)));
  return out;
}

function heading(node: ElementNode, tag: string): HtmlNode[] {
  // A heading wrapped round paragraphs, lists or tables is a formatting
  // accident: what it holds is the content, not a title.
  if (containsBlock(node)) return blocksOf(node.children);
  const inline = tidyInline(inlineOf(node.children));
  if (isEmpty(inline)) return [];
  if (textOf(inline).trim().length > MAX_HEADING_CHARS) return paragraphs(inline);
  return [el(tag, inline)];
}

/** A list item holds inline content and nested lists, nothing else. */
function listItem(node: HtmlNode): ElementNode | null {
  const source = isEl(node, "li") ? node.children : [node];
  const children: HtmlNode[] = [];
  let run: HtmlNode[] = [];
  const flush = () => {
    if (run.length) {
      if (children.length && !isEl(children[children.length - 1], "br") && !isEl(children[children.length - 1], "ul") && !isEl(children[children.length - 1], "ol")) children.push(el("br"));
      children.push(...tidyInline(inlineOf(run)));
    }
    run = [];
  };
  for (const child of source) {
    if (isEl(child) && (child.tag === "ul" || child.tag === "ol")) {
      flush();
      const nested = list(child);
      if (nested) children.push(nested);
    } else if (isEl(child) && BLOCKS.has(canonicalTag(child.tag))) {
      flush();
      run = [child];
      flush();
    } else run.push(child);
  }
  flush();
  const tidy = children.filter((child, index) => !(isEl(child, "br") && (index === 0 || index === children.length - 1)));
  return isEmpty(tidy) && !tidy.some((child) => isEl(child, "ul") || isEl(child, "ol")) ? null : el("li", tidy);
}

function list(node: ElementNode): ElementNode | null {
  const items: ElementNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && !child.text.trim()) continue;
    if (isEl(child) && (child.tag === "ul" || child.tag === "ol")) {
      // A list placed straight inside a list belongs to the item before it.
      const nested = list(child);
      if (!nested) continue;
      if (items.length) items[items.length - 1].children.push(nested);
      else items.push(el("li", [nested]));
      continue;
    }
    const item = listItem(child);
    if (item) items.push(item);
  }
  return items.length ? el(node.tag, items) : null;
}

function cell(node: ElementNode): ElementNode {
  const attrs: Record<string, string> = {};
  for (const span of ["colspan", "rowspan"]) {
    if (/^\d{1,2}$/.test(node.attrs[span] ?? "")) attrs[span] = node.attrs[span];
  }
  return el(node.tag, tidyInline(inlineOf(node.children)), attrs);
}

function row(node: ElementNode): ElementNode | null {
  const cells = node.children.filter((child): child is ElementNode => isEl(child, "td") || isEl(child, "th")).map(cell);
  return cells.length ? el("tr", cells) : null;
}

function table(node: ElementNode): ElementNode | null {
  const head: ElementNode[] = [];
  const body: ElementNode[] = [];
  const collect = (nodes: HtmlNode[], into: ElementNode[]) => {
    for (const child of nodes) {
      if (!isEl(child)) continue;
      if (child.tag === "tr") {
        const built = row(child);
        if (built) into.push(built);
      } else if (child.tag === "thead") collect(child.children, head);
      else if (child.tag === "tbody" || child.tag === "tfoot") collect(child.children, body);
    }
  };
  collect(node.children, body);
  if (!head.length && !body.length) return null;
  const parts: ElementNode[] = [];
  if (head.length) parts.push(el("thead", head));
  if (body.length) parts.push(el("tbody", body));
  return el("table", parts);
}

function figure(node: ElementNode): HtmlNode[] {
  const images: HtmlNode[] = [];
  let caption: HtmlNode[] = [];
  const walk = (nodes: HtmlNode[]) => {
    for (const child of nodes) {
      if (!isEl(child)) continue;
      if (child.tag === "img") images.push(...image(child));
      else if (child.tag === "figcaption") caption = tidyInline(inlineOf(child.children));
      else walk(child.children);
    }
  };
  walk(node.children);
  if (!images.length) return blocksOf(node.children);
  return [el("figure", isEmpty(caption) ? images : [...images, el("figcaption", caption)])];
}

/** Content for a place that holds blocks: the post itself, or a quote. */
function blocksOf(nodes: HtmlNode[]): HtmlNode[] {
  const out: HtmlNode[] = [];
  let run: HtmlNode[] = [];
  const flush = () => {
    out.push(...paragraphs(inlineOf(run)));
    run = [];
  };
  for (const node of nodes) {
    if (node.type === "text") {
      run.push(node);
      continue;
    }
    const tag = canonicalTag(node.tag);
    if (HEADINGS.has(tag)) {
      flush();
      out.push(...heading(node, tag));
    } else if (tag === "p") {
      flush();
      out.push(...(containsBlock(node) ? blocksOf(node.children) : paragraphs(inlineOf(node.children))));
    } else if (tag === "ul" || tag === "ol") {
      flush();
      const built = list(node);
      if (built) out.push(built);
    } else if (tag === "li") {
      // An item with no list around it reads as its own paragraph.
      flush();
      out.push(...blocksOf(node.children));
    } else if (tag === "blockquote") {
      flush();
      const inner = containsBlock(node) ? blocksOf(node.children) : tidyInline(inlineOf(node.children));
      if (!isEmpty(inner)) out.push(el("blockquote", inner));
    } else if (tag === "table") {
      flush();
      const built = table(node);
      if (built) out.push(built);
    } else if (tag === "figure") {
      flush();
      out.push(...figure(node));
    } else if (tag === "pre") {
      flush();
      const code = textOf(node.children).replace(/^\n/, "");
      if (code.trim()) out.push(el("pre", [text(code)]));
    } else if (tag === "hr") {
      flush();
      out.push(el("hr"));
    } else if (BLOCKS.has(tag) || ((FORMATTING.has(tag) || tag === "span" || tag === "font") && containsBlock(node))) {
      // div, section and friends -- or a <b>/<span> wrapped round whole
      // paragraphs, as Google Docs does -- are scaffolding: keep what is in them.
      flush();
      out.push(...blocksOf(node.children));
    } else run.push(node);
  }
  flush();
  return out;
}

// ---------------------------------------------------------------- printing --

const escapeAttribute = (value: string) => value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function print(nodes: HtmlNode[], pre = false): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return pre ? node.text : node.text.replace(/</g, "&lt;");
      const attrs = Object.entries(node.attrs)
        .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
        .join("");
      if (VOID.has(node.tag)) return `<${node.tag}${attrs}>`;
      return `<${node.tag}${attrs}>${print(node.children, node.tag === "pre")}</${node.tag}>`;
    })
    .join("");
}

/**
 * The cleaned HTML. Allowed: h2, h3, h4, p, ul, ol, li, blockquote, strong, b,
 * em, i, u, code, a (href, and target/rel for new-tab links), table, thead,
 * tbody, tr, th, td, br -- plus img (src, alt, size), figure, figcaption, hr
 * and pre, which posts imported from the old site already use.
 */
export function sanitizeEditorHtml(html: string): string {
  return print(blocksOf(parse(String(html ?? "")).children));
}

const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text, as pasted from a text editor: a paragraph per blank-line block, or per line. */
export function textToEditorHtml(value: string): string {
  const normalized = String(value ?? "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  const pieces = /\n\s*\n/.test(normalized) ? normalized.split(/\n\s*\n/) : normalized.split("\n");
  return sanitizeEditorHtml(
    pieces
      .map((piece) => piece.trim())
      .filter(Boolean)
      .map((piece) => `<p>${escapeText(piece).replace(/\n/g, "<br>")}</p>`)
      .join(""),
  );
}

/** How many h2 headings the HTML has; used by the migration's report. */
export function countH2(html: string): number {
  return (String(html ?? "").match(/<h2[\s>]/gi) ?? []).length;
}
