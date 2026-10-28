/**
 * What the blog post editor's checklist knows about a post.
 *
 * The public post page builds its table of contents from the H2 headings,
 * its FAQ block (and Google's FAQ markup) from a "Frequently asked
 * questions" section, and its share previews from the cover image, title and
 * description. This reads the same things from the form so the editor can
 * say, before saving, what the page will look like and what is missing.
 *
 * Pure string work with no imports, so it runs in the browser as the editor
 * types and in the tests.
 */

export type PostForm = Record<string, unknown>;

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  /** Shown under an unfinished item: what to do about it. */
  hint: string;
};

export type ContentStats = {
  words: number;
  /** Main sections: these become the "On this page" list. */
  sections: number;
  /** H1s inside the content (the title is already the page's H1). */
  h1InContent: number;
  /** Questions found under a "Frequently asked questions" heading. */
  faqQuestions: number;
};

const text = (value: unknown) => String(value ?? "").trim();

/** The readable words of some HTML. */
export function plainText(html: string): string {
  return String(html ?? "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|div|br|li|h[1-6]|tr|td|th|blockquote)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;|&#x?[0-9a-f]+;/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
}

const FAQ_HEADING =
  /<(h[2-4])\b[^>]*>((?:(?!<\/\1>)[\s\S])*?\b(?:faqs?|frequently\s+asked|common\s+questions)\b[\s\S]*?)<\/\1>/i;

export function contentStats(html: string): ContentStats {
  const content = String(html ?? "");
  const words = plainText(content).split(" ").filter(Boolean).length;
  const h1InContent = (content.match(/<h1\b/gi) ?? []).length;
  // A content H1 is shown as an H2 on the website, so it counts as a section.
  const sections =
    (content.match(/<h2\b/gi) ?? []).length + h1InContent;

  let faqQuestions = 0;
  const heading = FAQ_HEADING.exec(content);
  if (heading) {
    const after = content.slice(heading.index + heading[0].length);
    const next = after.search(/<h2\b/i);
    const region = next >= 0 ? after.slice(0, next) : after;
    const asHeadings = [...region.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)]
      .map((m) => plainText(m[1]))
      .filter((q) => q.endsWith("?")).length;
    const asBold = [
      ...region.matchAll(/<p\b[^>]*>\s*<(strong|b)>([\s\S]*?)<\/\1>/gi),
    ]
      .map((m) => plainText(m[2]))
      .filter((q) => q.endsWith("?")).length;
    faqQuestions = Math.max(asHeadings, asBold);
  }
  return { words, sections, h1InContent, faqQuestions };
}

/** "7 min read" the way the website works it out when Read time is empty. */
export function automaticReadTime(words: number): string {
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/**
 * The title Google shows: the SEO title when set, otherwise the one the
 * website builds from the post title.
 */
export function effectiveSeoTitle(form: PostForm): string {
  return text(form.meta_title) || (text(form.title) ? `${text(form.title)} | Byteflow Blog` : "");
}

/** The description Google shows: the SEO description, otherwise the excerpt. */
export function effectiveSeoDescription(form: PostForm): string {
  return text(form.meta_description) || text(form.excerpt);
}

export function postChecklist(form: PostForm): {
  items: ChecklistItem[];
  done: number;
  percent: number;
  stats: ContentStats;
} {
  const stats = contentStats(String(form.content ?? ""));
  const excerpt = text(form.excerpt);
  const seoTitle = effectiveSeoTitle(form);
  const seoDescription = effectiveSeoDescription(form);
  const image = text(form.image_url);

  const items: ChecklistItem[] = [
    {
      key: "basics",
      label: "Title and page address",
      done: Boolean(text(form.title) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(form.slug))),
      hint: "Add a title; the page address fills in from it.",
    },
    {
      key: "excerpt",
      label: "Summary under the title",
      done: excerpt.length >= 70 && excerpt.length <= 250,
      hint: "Write 1–2 sentences (70–250 characters). It shows under the title and on blog cards.",
    },
    {
      key: "cover",
      label: "Cover image added",
      done: Boolean(image),
      hint: "Upload a wide image. It is also the picture when the post is shared.",
    },
    {
      key: "alt",
      label: "Cover image described",
      done: Boolean(image && text(form.image_alt)),
      hint: "Describe the cover in a few words for screen readers and Google Images.",
    },
    {
      key: "length",
      label: "At least 600 words",
      done: stats.words >= 600,
      hint: `${stats.words} words so far. Longer guides answer more questions.`,
    },
    {
      key: "sections",
      label: "At least 3 sections (H2)",
      done: stats.sections >= 3,
      hint: `${stats.sections} so far. Each H2 becomes a link in “On this page”.`,
    },
    {
      key: "h1",
      label: "No extra H1 in the content",
      done: stats.h1InContent === 0,
      hint: "The title is the H1. Use H2 for sections (the website converts any H1 to H2 anyway).",
    },
    {
      key: "faq",
      label: "FAQ with answers",
      done: stats.faqQuestions >= 3,
      hint: "Add an H2 “Frequently asked questions”, then each question as H3 with its answer below. 3 or more.",
    },
    {
      key: "seo-title",
      label: "SEO title (max 60 characters)",
      done: Boolean(seoTitle) && seoTitle.length <= 60,
      hint: `${seoTitle.length} characters. Google cuts longer titles.`,
    },
    {
      key: "seo-description",
      label: "SEO description (120–160)",
      done: seoDescription.length >= 120 && seoDescription.length <= 160,
      hint: `${seoDescription.length} characters.`,
    },
  ];
  const done = items.filter((item) => item.done).length;
  return {
    items,
    done,
    percent: Math.round((done / items.length) * 100),
    stats,
  };
}

/** "new-office-it-setup-dubai" from "New Office IT Setup in Dubai?" */
export function slugFromTitle(title: string): string {
  return text(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 4, 2026" (how posts store their date) -> "2026-10-04" for a date input. */
export function toDateInput(value: unknown): string {
  const raw = text(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const named = /^([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/i.exec(raw);
  if (!named) return "";
  const month = MONTHS.findIndex((m) => m.toLowerCase() === named[1].toLowerCase());
  if (month < 0) return "";
  return `${named[3]}-${String(month + 1).padStart(2, "0")}-${named[2].padStart(2, "0")}`;
}

/** "2026-10-04" from a date input -> "Oct 4, 2026". */
export function fromDateInput(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}
