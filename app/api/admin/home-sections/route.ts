import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { refreshSiteContent } from "../../../lib/site-revalidate";
import {
  checkHomeBlock,
  getHomeBlockDef,
  homeBlockFormValues,
  sanitizeHomeBlock,
  type HomeBlockDef,
} from "../../../lib/home-sections";

// Home page blocks are saved on the "home" page, the About page's on "about-us".
const pageOf = (def: HomeBlockDef) => def.page ?? "home";
const pageName = (def: HomeBlockDef) => (def.page === "about-us" ? "About Us" : "Home");
const missingPage = (def: HomeBlockDef) =>
  Response.json(
    { error: `The ${pageName(def)} page was not found. Create a page with slug "${pageOf(def)}" under Pages first.` },
    { status: 404 },
  );

async function findBlock(def: HomeBlockDef) {
  const page = await db.execute({ sql: "SELECT id FROM pages WHERE slug = ? LIMIT 1", args: [pageOf(def)] });
  const pageId = page.rows[0]?.id;
  if (!pageId) return { pageId: null as number | null, section: null };
  const section = await db.execute({
    sql: "SELECT id, content FROM page_sections WHERE page_id = ? AND section_type = ? ORDER BY sort_order LIMIT 1",
    args: [pageId, def.key],
  });
  return { pageId: Number(pageId), section: section.rows[0] ?? null };
}

function blockFrom(request: Request) {
  return getHomeBlockDef(new URL(request.url).searchParams.get("block"));
}

const unknownBlock = () => Response.json({ error: "Unknown page section." }, { status: 400 });

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const def = blockFrom(request);
  if (!def) return unknownBlock();
  const { pageId, section } = await findBlock(def);
  if (!pageId) return missingPage(def);
  let saved: Record<string, unknown> | null = null;
  try {
    saved = section?.content ? (JSON.parse(String(section.content)) as Record<string, unknown>) : null;
  } catch {
    saved = null;
  }
  return Response.json({ saved: Boolean(section), content: homeBlockFormValues(def, saved) });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  refreshSiteContent();
  const def = blockFrom(request);
  if (!def) return unknownBlock();
  const content = sanitizeHomeBlock(def, (await request.json()) as Record<string, unknown>);
  const problem = checkHomeBlock(def, content);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  const { pageId, section } = await findBlock(def);
  if (!pageId) return missingPage(def);
  if (section) {
    await db.execute({
      sql: "UPDATE page_sections SET content = ?, visible = 1, status = 'published', updated_at = datetime('now') WHERE id = ?",
      args: [JSON.stringify(content), Number(section.id)],
    });
    return Response.json({ id: Number(section.id) });
  }
  const result = await db.execute({
    sql: "INSERT INTO page_sections (page_id, section_type, name, content, sort_order, visible, status) VALUES (?, ?, ?, ?, 0, 1, 'published')",
    args: [pageId, def.key, `${pageName(def)} — ${def.label}`, JSON.stringify(content)],
  });
  return Response.json({ id: Number(result.lastInsertRowid) });
}

/** Back to the website's own wording: the saved row is removed. */
export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  refreshSiteContent();
  const def = blockFrom(request);
  if (!def) return unknownBlock();
  const { pageId } = await findBlock(def);
  if (!pageId) return missingPage(def);
  await db.execute({
    sql: "DELETE FROM page_sections WHERE page_id = ? AND section_type = ?",
    args: [pageId, def.key],
  });
  return Response.json({ ok: true });
}
