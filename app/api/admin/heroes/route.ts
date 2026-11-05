import { isAdminAuthenticated } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { heroExtraFields, heroExtraNames } from "../../../lib/hero-fields";

const baseFields = [
  "hero_label",
  "hero_heading",
  "hero_description",
  "hero_background_image",
  "hero_primary_label",
  "hero_primary_link",
  "hero_secondary_label",
  "hero_secondary_link",
] as const;

// The home page extras are columns added by migrate-cms.mjs. Until it has run
// they do not exist, and the banner is read and saved without them.
const missingColumn = (error: unknown) => /no such column/i.test(String(error));

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const select = (fields: readonly string[]) =>
    db.execute(`SELECT id,name,slug,${fields.join(",")} FROM pages ORDER BY name`);
  try {
    return Response.json({ pages: (await select([...baseFields, ...heroExtraNames])).rows });
  } catch (error) {
    if (!missingColumn(error)) throw error;
    return Response.json({ pages: (await select(baseFields)).rows });
  }
}

/** Anchors on the page (#how-we-work), site paths, or full https addresses. */
const safeLink = (value: string) => !value || /^(#[\w-]+|\/(?!\/)\S*|https:\/\/\S+)$/i.test(value);

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const id = Number(body.id);
  if (!id)
    return Response.json({ error: "Choose a valid page." }, { status: 400 });

  const value = (field: string) => String(body[field] ?? "").trim();
  const errors = heroExtraFields.flatMap((field) => {
    const v = value(field.name);
    if (field.max && v.length > field.max) return [`${field.label}: keep it under ${field.max} characters.`];
    if (field.type === "link" && !safeLink(v))
      return [`${field.label}: use #section, a path starting with / or a full https:// address.`];
    return [];
  });
  if (value("hero_image") && !value("hero_image_alt"))
    errors.push("Visual — alt text: describe the image, so it is not invisible to screen readers and Google.");
  if (errors.length) return Response.json({ error: errors.join(" ") }, { status: 400 });

  const update = (fields: readonly string[]) =>
    db.execute({
      sql: `UPDATE pages SET ${fields.map((field) => `${field}=?`).join(",")},updated_at=datetime('now') WHERE id=?`,
      args: [...fields.map(value), id],
    });
  try {
    await update([...baseFields, ...heroExtraNames]);
  } catch (error) {
    if (!missingColumn(error)) throw error;
    await update(baseFields);
  }
  return Response.json({ ok: true });
}
