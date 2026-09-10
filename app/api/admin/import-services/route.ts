import { isAdminAuthenticated } from "../../../lib/auth";
import { builtinServices } from "../../../lib/builtin-services";
import { db } from "../../../lib/db";

/** Which of the website's built-in services are missing from the database. */
async function missingSlugs() {
  const existing = await db.execute("SELECT slug FROM services");
  const have = new Set(existing.rows.map((row) => String(row.slug)));
  return builtinServices.filter((service) => !have.has(service.slug));
}

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const missing = await missingSlugs();
  return Response.json({
    missing: missing.length,
    total: builtinServices.length,
  });
}

export async function POST() {
  if (!(await isAdminAuthenticated()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const missing = await missingSlugs();
  if (!missing.length) return Response.json({ imported: 0 });

  const highest = await db.execute(
    "SELECT COALESCE(MAX(sort_order), -1) AS top FROM services",
  );
  let order = Number(highest.rows[0]?.top ?? -1);

  await db.batch(
    missing.map((service) => {
      order += 1;
      return {
        sql: "INSERT INTO services (title, slug, excerpt, description, sort_order, status, published) VALUES (?, ?, ?, ?, ?, 'published', 1)",
        args: [
          service.title,
          service.slug,
          service.excerpt,
          service.description,
          order,
        ],
      };
    }),
    "write",
  );

  return Response.json({ imported: missing.length });
}
