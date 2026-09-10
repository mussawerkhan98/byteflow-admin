import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";

const FOUNDER_FIELDS = [
  "eyebrow",
  "heading",
  "story",
  "image_url",
  "image_alt",
  "role",
  "company",
  "linkedin_url",
  "phone_label",
  "phone_url",
] as const;

const MISSING_PAGE_ERROR =
  "The About Us page was not found. Create a page with slug \"about-us\" under Pages & SEO first.";

async function findFounderSection() {
  const page = await db.execute(
    "SELECT id FROM pages WHERE slug = 'about-us' LIMIT 1",
  );
  const pageId = page.rows[0]?.id;
  if (!pageId) return { pageId: null as number | null, section: null };
  const section = await db.execute({
    sql: "SELECT id, content FROM page_sections WHERE page_id = ? AND section_type = 'founder' ORDER BY sort_order LIMIT 1",
    args: [pageId],
  });
  return { pageId: Number(pageId), section: section.rows[0] ?? null };
}

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId, section } = await findFounderSection();
  if (!pageId)
    return Response.json({ error: MISSING_PAGE_ERROR }, { status: 404 });
  const content = section?.content
    ? (JSON.parse(String(section.content)) as Record<string, unknown>)
    : {};
  return Response.json({
    id: section ? Number(section.id) : null,
    content: Object.fromEntries(
      FOUNDER_FIELDS.map((field) => [field, String(content[field] ?? "")]),
    ),
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const content = Object.fromEntries(
    FOUNDER_FIELDS.map((field) => [field, String(body[field] ?? "").trim()]),
  );
  const { pageId, section } = await findFounderSection();
  if (!pageId)
    return Response.json({ error: MISSING_PAGE_ERROR }, { status: 404 });
  if (section) {
    await db.execute({
      sql: "UPDATE page_sections SET content = ?, visible = 1, status = 'published', updated_at = datetime('now') WHERE id = ?",
      args: [JSON.stringify(content), Number(section.id)],
    });
    return Response.json({ id: Number(section.id) });
  }
  const result = await db.execute({
    sql: "INSERT INTO page_sections (page_id, section_type, name, content, sort_order, visible, status) VALUES (?, 'founder', 'Founder', ?, 0, 1, 'published')",
    args: [pageId, JSON.stringify(content)],
  });
  return Response.json({ id: Number(result.lastInsertRowid) });
}
