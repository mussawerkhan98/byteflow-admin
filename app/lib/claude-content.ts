/**
 * The article rules the Claude connector applies before anything reaches the
 * posts table: which fields Claude may set, what they are called in the API,
 * how Markdown becomes the HTML the website styles, and the limits that keep
 * a post page in shape.
 *
 * No database here, so the tests can run it as it is.
 */
import { marked } from "marked";
import { sanitizeEditorHtml } from "./editor-html";

/** A problem the caller can fix, sent back as-is with an HTTP status. */
export class ArticleError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type ContentFormat = "html" | "markdown" | "auto";

/** API name → posts column. Everything else in a request is ignored. */
export const ARTICLE_FIELDS = {
  title: "title",
  slug: "slug",
  content: "content",
  excerpt: "excerpt",
  category: "category",
  tags: "tags",
  author_name: "author_name",
  featured_image_url: "image_url",
  featured_image_alt: "image_alt",
  seo_title: "meta_title",
  seo_description: "meta_description",
} as const;

export type ArticleField = keyof typeof ARTICLE_FIELDS;
export type ArticleInput = Partial<Record<ArticleField, unknown>> & { content_format?: unknown };

const LIMITS: Partial<Record<ArticleField, number>> = {
  title: 200,
  slug: 120,
  excerpt: 600,
  category: 60,
  author_name: 80,
  featured_image_url: 2000,
  featured_image_alt: 300,
  seo_title: 120,
  seo_description: 320,
};
const MAX_CONTENT = 500_000;
const MAX_TAGS = 20;
const MAX_TAG = 40;

const LABELS: Record<ArticleField, string> = {
  title: "Title",
  slug: "Slug",
  content: "Content",
  excerpt: "Excerpt",
  category: "Category",
  tags: "Tags",
  author_name: "Author name",
  featured_image_url: "Featured image URL",
  featured_image_alt: "Featured image alt text",
  seo_title: "SEO title",
  seo_description: "SEO description",
};

/**
 * HTML when it opens with a tag; Markdown otherwise. Markdown often carries
 * the odd inline tag (an <img>, a <br>), which must not make it count as HTML.
 */
export function detectFormat(content: string): "html" | "markdown" {
  return /^\s*<[a-z!]/i.test(content) ? "html" : "markdown";
}

/** Markdown or HTML in, the website's cleaned HTML vocabulary out (no scripts, handlers or unsafe links). */
export function articleHtml(content: string, format: ContentFormat = "auto"): string {
  const source = String(content ?? "");
  const kind = format === "auto" ? detectFormat(source) : format;
  const html = kind === "markdown" ? (marked.parse(source, { async: false, gfm: true }) as string) : source;
  return sanitizeEditorHtml(html);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Tags arrive as a list or "a, b"; they are stored as "a, b" (the admin's Tags field). */
export function normalizeTags(value: unknown): string {
  const list = Array.isArray(value) ? value.map(String) : String(value ?? "").split(",");
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of list) {
    const tag = raw.replace(/\s+/g, " ").trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    if (tag.length > MAX_TAG) throw new ArticleError(`Tag "${tag.slice(0, 50)}" is too long: keep each tag to ${MAX_TAG} characters.`);
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  if (tags.length > MAX_TAGS) throw new ArticleError(`Too many tags: use at most ${MAX_TAGS}.`);
  return tags.join(", ");
}

export function parseTags(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const imageUrlOk = (url: string) => /^https:\/\/\S+$/i.test(url) || /^\/api\/media\/\d+(\/[\w.-]+)?$/.test(url);

/**
 * The column values one create or update request asks for, checked.
 * On create, title and content are required; on update, only the fields sent
 * change. Featured image and its alt text travel together.
 */
export function articleColumns(
  input: ArticleInput,
  { creating, current }: { creating: boolean; current?: Record<string, unknown> },
): Record<string, string> {
  const columns: Record<string, string> = {};
  const format = input.content_format === "html" || input.content_format === "markdown" ? input.content_format : "auto";
  for (const field of Object.keys(ARTICLE_FIELDS) as ArticleField[]) {
    const raw = input[field];
    if (raw === undefined || raw === null) continue;
    if (field === "tags") {
      columns.tags = normalizeTags(raw);
      continue;
    }
    if (typeof raw !== "string") throw new ArticleError(`${LABELS[field]} must be text.`);
    if (field === "content") {
      if (raw.length > MAX_CONTENT) throw new ArticleError(`Content is too long: keep it under ${MAX_CONTENT.toLocaleString("en")} characters.`);
      columns.content = articleHtml(raw, format);
      if (!columns.content.replace(/<[^>]+>/g, "").trim()) throw new ArticleError("Content is empty after cleaning. Send the article body as Markdown or HTML.");
      continue;
    }
    const value = raw.replace(/\s+/g, " ").trim();
    const limit = LIMITS[field];
    if (limit && value.length > limit) throw new ArticleError(`${LABELS[field]} is too long: keep it to ${limit} characters (it has ${value.length}).`);
    if (field === "title" && !value) throw new ArticleError("Title cannot be empty.");
    if (field === "slug" && value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
      throw new ArticleError("Slug must use lowercase letters, numbers and single hyphens, for example \"it-support-checklist\".");
    if (field === "featured_image_url" && value && !imageUrlOk(value))
      throw new ArticleError("Featured image URL must be an https:// address or a URL returned by upload_image.");
    columns[ARTICLE_FIELDS[field]] = value;
  }
  if (creating) {
    if (!columns.title) throw new ArticleError("Title is required.");
    if (!columns.content) throw new ArticleError("Content is required.");
  }
  const image = columns.image_url ?? String(current?.image_url ?? "");
  const alt = columns.image_alt ?? String(current?.image_alt ?? "");
  if (image.trim() && !alt.trim())
    throw new ArticleError("Featured image alt text is required: describe the picture so screen readers and Google can read it.");
  return columns;
}

/** Which columns actually change, for the activity log. */
export function changedColumns(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((key) => String(before[key] ?? "") !== String(after[key] ?? ""));
}

/** posts column → API name, for messages Claude reads. */
export function apiFieldName(column: string): string {
  const entry = Object.entries(ARTICLE_FIELDS).find(([, value]) => value === column);
  return entry ? entry[0] : column;
}
