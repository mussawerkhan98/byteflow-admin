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
    .replace(/&amp;/gi, "&")
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

export type CheckStatus = "passed" | "attention" | "optional";

/**
 * "missing": a field the post actually needs is empty or invalid.
 * "recommendation": good practice from the sources below, never a rule.
 * "manual": something only a person can judge.
 */
export type CheckKind = "missing" | "recommendation" | "manual";

export type SeoCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  kind: CheckKind;
  /** One line on what was found and what to do. */
  detail: string;
};

/** Another post, for the duplicate checks. */
export type OtherPost = {
  id?: unknown;
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  meta_title?: unknown;
  meta_description?: unknown;
};

const STOP_WORDS = new Set(
  "a an and are as at be by for from how in is it of on or our the this to what when why with your you vs do does can".split(" "),
);

/** The meaningful words of a phrase: lowercase, no stop words, no "byteflow". */
function keywords(value: string): string[] {
  return plainText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word) && word !== "byteflow");
}

const normalized = (value: unknown) =>
  plainText(String(value ?? "")).toLowerCase().replace(/\s+/g, " ").trim();

/** How often a phrase appears in some text, as whole words. */
function occurrences(haystack: string, phrase: string): number {
  const needle = normalized(phrase);
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return (normalized(haystack).match(new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "g")) ?? []).length;
}

/** The opening of the article: its first paragraph, or else its first 100 words. */
function introduction(content: string): string {
  const first = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(content);
  const paragraph = first ? plainText(first[1]) : "";
  if (paragraph.split(" ").length >= 12) return paragraph;
  return plainText(content).split(" ").slice(0, 100).join(" ");
}

/** Anchor text that tells neither readers nor Google where a link goes. */
const VAGUE_ANCHOR =
  /^(click here|here|read more|more|learn more|this|this page|link|this link|page|website|go|see here|details)$/i;

function links(content: string) {
  return [...content.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: m[1].trim(),
    text: plainText(m[2]),
  }));
}

const isInternal = (href: string) =>
  /^\/(?!\/)/.test(href) || /^https?:\/\/(www\.)?byteflow\.ae(\/|$)/i.test(href);

/**
 * The SEO checklist on the blog post editor.
 *
 * Built from Google Search Central's documentation (title links, snippets,
 * creating helpful content, image and link best practices) and Semrush's
 * on-page SEO checklist. Every check either flags a field the post really
 * needs or makes a recommendation, and says which. None of them is a
 * ranking prediction, and nothing here treats a word count, a number of
 * headings, an exact description length or an FAQ as something Google
 * requires: Google has said it has none of those requirements.
 *
 * `focusKeyword` is typed in the checklist itself and is not saved.
 */
export function seoChecklist(
  form: PostForm,
  options: { otherPosts?: OtherPost[]; focusKeyword?: string } = {},
): { checks: SeoCheck[]; counts: Record<CheckStatus, number>; stats: ContentStats } {
  const content = String(form.content ?? "");
  const stats = contentStats(content);
  const title = text(form.title);
  const slug = text(form.slug);
  const metaTitle = text(form.meta_title);
  const seoTitle = effectiveSeoTitle(form);
  const metaDescription = text(form.meta_description);
  const seoDescription = effectiveSeoDescription(form);
  const image = text(form.image_url);
  const others = (options.otherPosts ?? []).filter(
    (post) => !(form.id !== undefined && form.id !== "" && String(post.id) === String(form.id)),
  );
  const keyword = text(options.focusKeyword);
  const checks: SeoCheck[] = [];
  const add = (check: SeoCheck) => checks.push(check);

  // 1. SEO title
  if (!title && !metaTitle) {
    add({ key: "seo-title", label: "SEO title", status: "attention", kind: "missing", detail: "No title yet. Add a post title or an SEO title." });
  } else if (seoTitle.length > 60) {
    add({
      key: "seo-title", label: "SEO title", status: "attention", kind: "recommendation",
      detail: `${seoTitle.length} characters. Google shortens long titles to fit the screen; about 60 or fewer usually shows in full.${metaTitle ? "" : " This is the automatic title; set an SEO title to shorten it."}`,
    });
  } else {
    add({
      key: "seo-title", label: "SEO title", status: "passed", kind: "recommendation",
      detail: `${seoTitle.length} characters${metaTitle ? "" : " (automatic, from the post title)"}. Make sure it describes this post specifically.`,
    });
  }

  // 2. URL slug
  const slugWords = slug.split("-").filter(Boolean);
  const titleWords = new Set(keywords(title));
  if (!slug) {
    add({ key: "slug", label: "Page address (URL slug)", status: "attention", kind: "missing", detail: "The page address is empty." });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    add({ key: "slug", label: "Page address (URL slug)", status: "attention", kind: "missing", detail: "Use lowercase letters, numbers and single hyphens only. The post can't be saved like this." });
  } else if (slug.length > 75 || slugWords.length > 10) {
    add({ key: "slug", label: "Page address (URL slug)", status: "attention", kind: "recommendation", detail: `${slugWords.length} words. A shorter address is easier to read and share.` });
  } else if (titleWords.size && !slugWords.some((word) => titleWords.has(word))) {
    add({ key: "slug", label: "Page address (URL slug)", status: "attention", kind: "recommendation", detail: "The address shares no words with the title. Use words from the topic." });
  } else {
    add({ key: "slug", label: "Page address (URL slug)", status: "passed", kind: "recommendation", detail: "Readable and related to the title." });
  }

  // 3. Meta description
  if (!seoDescription && !content.trim()) {
    add({ key: "meta-description", label: "Meta description", status: "attention", kind: "missing", detail: "No SEO description, summary or article yet." });
  } else if (!seoDescription) {
    add({
      key: "meta-description", label: "Meta description", status: "attention", kind: "recommendation",
      detail: "None written, so the website uses the article's opening lines. Write one that sums up the whole post.",
    });
  } else if (seoDescription.length < 120 || seoDescription.length > 160) {
    add({
      key: "meta-description", label: "Meta description", status: "attention", kind: "recommendation",
      detail: `${seoDescription.length} characters${metaDescription ? "" : " (using the summary)"}. 120–160 is a common guideline so it shows in full; Google sets no fixed length.`,
    });
  } else {
    add({
      key: "meta-description", label: "Meta description", status: "passed", kind: "recommendation",
      detail: `${seoDescription.length} characters${metaDescription ? "" : " (using the summary)"}. Check it accurately sums up this post.`,
    });
  }

  // 4. Main heading (H1)
  if (!title) {
    add({ key: "h1", label: "Main heading (H1)", status: "attention", kind: "missing", detail: "The post title is the page's H1, and it is empty." });
  } else if (stats.h1InContent > 0) {
    add({ key: "h1", label: "Main heading (H1)", status: "attention", kind: "recommendation", detail: `The article has ${stats.h1InContent} extra H1. The title is already the H1; change these to H2.` });
  } else if (metaTitle && !keywords(metaTitle).some((word) => titleWords.has(word))) {
    add({ key: "h1", label: "Main heading (H1)", status: "attention", kind: "recommendation", detail: "The SEO title and the post title share no words. Keep both about the same topic." });
  } else {
    add({ key: "h1", label: "Main heading (H1)", status: "passed", kind: "recommendation", detail: "One H1: the post title." });
  }

  // 5. Primary keyword
  if (!keyword) {
    add({ key: "keyword", label: "Primary keyword", status: "optional", kind: "recommendation", detail: "Type the main search phrase above to check where it appears." });
  } else {
    const inTitle = occurrences(`${title} ${seoTitle}`, keyword) > 0;
    const inIntro = occurrences(introduction(content), keyword) > 0;
    const repeats = occurrences(content, keyword);
    const keywordWords = normalized(keyword).split(" ").length;
    const density = stats.words ? (repeats * keywordWords) / stats.words : 0;
    const titleRepeats = Math.max(occurrences(title, keyword), occurrences(seoTitle, keyword));
    if (titleRepeats > 1 || (repeats > 3 && density > 0.03)) {
      add({ key: "keyword", label: "Primary keyword", status: "attention", kind: "recommendation", detail: `Used ${repeats} times in the article${titleRepeats > 1 ? " and repeated in the title" : ""}. That can read as keyword stuffing; write naturally.` });
    } else if (!inTitle || !inIntro) {
      add({ key: "keyword", label: "Primary keyword", status: "attention", kind: "recommendation", detail: `Not found in the ${[!inTitle && "title", !inIntro && "first paragraph"].filter(Boolean).join(" or ")}. Use it there if it reads naturally.` });
    } else {
      add({ key: "keyword", label: "Primary keyword", status: "passed", kind: "recommendation", detail: "In the title and the first paragraph, without repetition." });
    }
  }

  // 6. Headings
  const headingLevels = [...content.matchAll(/<h([2-4])\b/gi)].map((m) => Number(m[1]));
  const skipped = headingLevels.some((level, i) => level - (i ? headingLevels[i - 1] : 2) > 1);
  const h3BeforeH2 = headingLevels.length > 0 && headingLevels[0] > 2;
  if (!content.trim()) {
    add({ key: "headings", label: "Headings (H2/H3)", status: "optional", kind: "recommendation", detail: "Add the article first." });
  } else if (skipped || h3BeforeH2) {
    add({ key: "headings", label: "Headings (H2/H3)", status: "attention", kind: "recommendation", detail: "A heading level is skipped (for example an H3 with no H2 above it). Keep H2 for sections and H3 inside them." });
  } else if (stats.sections === 0 && stats.words > 300) {
    add({ key: "headings", label: "Headings (H2/H3)", status: "attention", kind: "recommendation", detail: "No subheadings. H2s for the main sections make a longer article easier to scan." });
  } else {
    add({ key: "headings", label: "Headings (H2/H3)", status: "passed", kind: "recommendation", detail: `${stats.sections} section heading${stats.sections === 1 ? "" : "s"} in order. Use as many as the topic needs.` });
  }

  // 7. Helpful content
  add({
    key: "helpful", label: "Helpful, original content", status: "optional", kind: "manual",
    detail: "Your judgement: does it answer what the reader searched for, with accurate, first-hand information they can't get elsewhere?",
  });

  // 8. Content length
  add({
    key: "length", label: "Content length", status: content.trim() ? "optional" : "attention", kind: content.trim() ? "manual" : "missing",
    detail: content.trim()
      ? `${stats.words} words, ${automaticReadTime(stats.words)}. For reference only: Google has no preferred word count.`
      : "The article is empty.",
  });

  // 9. Images
  const inlineImages = [...content.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const inlineNoAlt = inlineImages.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;
  const embedded = /^data:/i.test(image) || inlineImages.some((tag) => /src\s*=\s*["']data:/i.test(tag));
  if (embedded) {
    add({ key: "images", label: "Images and alt text", status: "attention", kind: "recommendation", detail: "An image is pasted into the page as data, which makes it slow. Upload it with the image button instead." });
  } else if (image && !text(form.image_alt)) {
    add({ key: "images", label: "Images and alt text", status: "attention", kind: "recommendation", detail: "Describe the cover image. Without it, the post title is used as the alt text." });
  } else if (inlineNoAlt) {
    add({ key: "images", label: "Images and alt text", status: "attention", kind: "recommendation", detail: `${inlineNoAlt} image${inlineNoAlt === 1 ? "" : "s"} in the article ha${inlineNoAlt === 1 ? "s" : "ve"} no alt text.` });
  } else if (!image && !inlineImages.length) {
    add({ key: "images", label: "Images and alt text", status: "optional", kind: "recommendation", detail: "No cover image. One relevant image helps readers and is used when the post is shared." });
  } else {
    const uploadedHere = !image || /^\/api\/media\/|\.public\.blob\.vercel-storage\.com\//i.test(image);
    add({
      key: "images", label: "Images and alt text", status: "passed", kind: "recommendation",
      detail: `Described.${image && uploadedHere ? " The cover was uploaded here, so it was resized and compressed." : " Make sure large images are compressed before adding them."}`,
    });
  }

  // 10. Internal links
  const allLinks = links(content);
  const internal = allLinks.filter((link) => isInternal(link.href));
  const vague = allLinks.filter((link) => !link.text || VAGUE_ANCHOR.test(link.text) || /^https?:\/\//i.test(link.text));
  if (!internal.length) {
    add({ key: "links", label: "Internal links", status: "attention", kind: "recommendation", detail: "No links to other Byteflow pages. Link a related service or article where it helps the reader." });
  } else if (vague.length) {
    add({ key: "links", label: "Internal links", status: "attention", kind: "recommendation", detail: `${vague.length} link${vague.length === 1 ? " uses" : "s use"} vague text such as “click here”. Describe where the link goes.` });
  } else {
    add({ key: "links", label: "Internal links", status: "passed", kind: "recommendation", detail: `${internal.length} internal link${internal.length === 1 ? "" : "s"} with descriptive text.` });
  }

  // 11. FAQ
  const hasFaqHeading = /<h[2-4]\b[^>]*>[^<]*\b(faqs?|frequently\s+asked|common\s+questions)\b/i.test(content);
  if (stats.faqQuestions > 0) {
    add({ key: "faq", label: "FAQ section", status: "passed", kind: "recommendation", detail: `${stats.faqQuestions} question${stats.faqQuestions === 1 ? "" : "s"} with answers.` });
  } else if (hasFaqHeading) {
    add({ key: "faq", label: "FAQ section", status: "attention", kind: "recommendation", detail: "There's an FAQ heading but no questions under it. Write each question as an H3 ending in “?” with its answer below." });
  } else {
    add({ key: "faq", label: "FAQ section", status: "optional", kind: "recommendation", detail: "Not needed for SEO. Add one only if readers have common follow-up questions." });
  }

  // 12. Author
  if (text(form.author_name)) {
    add({ key: "author", label: "Author", status: "passed", kind: "recommendation", detail: `Shown as “Written by ${text(form.author_name)}”.` });
  } else {
    add({ key: "author", label: "Author", status: "optional", kind: "recommendation", detail: "Shown as “Byteflow team”. Name the person if one expert wrote it; never invent an author." });
  }

  // 13. Unique among posts
  const duplicates: string[] = [];
  if (seoTitle && others.some((post) => normalized(effectiveSeoTitle(post as PostForm)) === normalized(seoTitle))) duplicates.push("SEO title");
  if (seoDescription && others.some((post) => normalized(effectiveSeoDescription(post as PostForm)) === normalized(seoDescription))) duplicates.push("description");
  if (slug && others.some((post) => text(post.slug) === slug)) duplicates.push("page address");
  if (duplicates.length) {
    add({
      key: "unique", label: "Unique among your posts", status: "attention",
      kind: duplicates.includes("page address") ? "missing" : "recommendation",
      detail: `Another post already uses the same ${duplicates.join(", ")}.${duplicates.includes("page address") ? " The post can't be saved with a duplicate address." : " Each post should describe itself."}`,
    });
  } else if (!others.length) {
    add({ key: "unique", label: "Unique among your posts", status: "optional", kind: "recommendation", detail: "Other posts haven't loaded, so duplicates can't be checked." });
  } else {
    add({ key: "unique", label: "Unique among your posts", status: "passed", kind: "recommendation", detail: `Title, description and address differ from your other ${others.length} posts.` });
  }

  const counts: Record<CheckStatus, number> = { passed: 0, attention: 0, optional: 0 };
  for (const check of checks) counts[check.status] += 1;
  return { checks, counts, stats };
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
