import { siteUrl } from "../../../lib/admin-guide";
import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { refreshSiteContent } from "../../../lib/site-revalidate";
import {
  checkHomeBlock,
  getHomeBlockDef,
  homeBlockFormValues,
  sanitizeHomeBlock,
  servicePageList,
  type HomeBlockDef,
} from "../../../lib/home-sections";

// Home page blocks are saved on the "home" page, the About page's on
// "about-us", the Services, Industries and IT AMC pages' on their own
// ("services", "industries", "it-amc-services-dubai"), and each legal
// page's on its own page; each service page's on its own (svc_* sections).
const pageOf = (def: HomeBlockDef) => def.page ?? "home";
const sectionTypeOf = (def: HomeBlockDef) => def.sectionType ?? def.key;
const pageName = (def: HomeBlockDef) =>
  def.page === "about-us"
    ? "About Us"
    : def.page === "services"
      ? "Services"
      : def.page === "industries"
        ? "Industries"
        : def.page === "it-amc-services-dubai"
          ? "IT AMC Services"
          : def.remoteDefaults
            ? servicePageList.find((page) => page.slug === def.page)?.name ?? def.label
            : def.page
            ? def.label
            : "Home";
// These pages' rows are created on first save if missing, rather than
// asking for them to be made under Pages first.
const createsPage = (def: HomeBlockDef) =>
  def.page === "services" ||
  def.page === "industries" ||
  def.page === "it-amc-services-dubai" ||
  def.page === "privacy-policy" ||
  def.page === "terms-and-conditions" ||
  Boolean(def.remoteDefaults);
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
    args: [pageId, sectionTypeOf(def)],
  });
  return { pageId: Number(pageId), section: section.rows[0] ?? null };
}

function blockFrom(request: Request) {
  return getHomeBlockDef(new URL(request.url).searchParams.get("block"));
}

const unknownBlock = () => Response.json({ error: "Unknown page section." }, { status: 400 });

/**
 * The block with its starting wording: a service page's comes from the
 * website (its own published content), so the two never drift apart. If the
 * website cannot be reached the form starts empty, and the website still
 * shows its own wording until something is saved.
 */
async function withDefaults(def: HomeBlockDef): Promise<HomeBlockDef> {
  if (!def.remoteDefaults) return def;
  try {
    const { slug, section } = def.remoteDefaults;
    const response = await fetch(siteUrl(`/api/service-defaults?slug=${encodeURIComponent(slug)}&section=${encodeURIComponent(section)}`), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return def;
    const defaults = (await response.json()) as Partial<HomeBlockDef["defaults"]>;
    return { ...def, defaults: { fields: defaults.fields ?? {}, lists: defaults.lists ?? {} } };
  } catch {
    return def;
  }
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const found = blockFrom(request);
  if (!found) return unknownBlock();
  const def = await withDefaults(found);
  const { pageId, section } = await findBlock(def);
  if (!pageId && createsPage(def)) return Response.json({ saved: false, content: homeBlockFormValues(def, null) });
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
  let { pageId, section } = await findBlock(def);
  if (!pageId && createsPage(def)) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO pages (name, slug, status, indexable) VALUES (?, ?, 'published', 1)",
      args: [pageName(def), pageOf(def)],
    });
    ({ pageId, section } = await findBlock(def));
  }
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
    args: [pageId, sectionTypeOf(def), `${pageName(def)} — ${def.label}`, JSON.stringify(content)],
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
  // Nothing saved yet, so it already shows the original wording.
  if (!pageId && createsPage(def)) return Response.json({ ok: true });
  if (!pageId) return missingPage(def);
  await db.execute({
    sql: "DELETE FROM page_sections WHERE page_id = ? AND section_type = ?",
    args: [pageId, sectionTypeOf(def)],
  });
  return Response.json({ ok: true });
}
