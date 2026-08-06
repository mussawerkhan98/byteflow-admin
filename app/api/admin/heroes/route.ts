import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result =
    await db.execute(`SELECT id,name,slug,hero_label,hero_heading,hero_description,hero_background_image,
    hero_primary_label,hero_primary_link,hero_secondary_label,hero_secondary_link FROM pages ORDER BY name`);
  return Response.json({ pages: result.rows });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const id = Number(body.id);
  if (!id)
    return Response.json({ error: "Choose a valid page." }, { status: 400 });
  const fields = [
    "hero_label",
    "hero_heading",
    "hero_description",
    "hero_background_image",
    "hero_primary_label",
    "hero_primary_link",
    "hero_secondary_label",
    "hero_secondary_link",
  ] as const;
  await db.execute({
    sql: `UPDATE pages SET ${fields.map((field) => `${field}=?`).join(",")},updated_at=datetime('now') WHERE id=?`,
    args: [...fields.map((field) => String(body[field] ?? "").trim()), id],
  });
  return Response.json({ ok: true });
}
