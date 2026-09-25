import { isAdminAuthenticated } from "../../../../../lib/auth";
import { requirePermission } from "../../../../../lib/permissions";
import { db } from "../../../../../lib/db";
import { buildCsv } from "../../../../../lib/marketing-csv";

export const dynamic = "force-dynamic";

type Row = {
  email: string;
  name: string;
  clicks: number;
  firstClickAt: string | null;
};

async function recipients(campaignId: number): Promise<Row[]> {
  const result = await db.execute({
    sql: `SELECT email, name, clicks, first_click_at
          FROM campaign_recipients WHERE campaign_id = ?
          ORDER BY clicks DESC, lower(name), email`,
    args: [campaignId],
  });
  return result.rows.map((row) => ({
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    clicks: Number(row.clicks ?? 0),
    firstClickAt: row.first_click_at ? String(row.first_click_at) : null,
  }));
}

/** Who clicked what, as JSON for the modal or CSV for a download. */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const id = Number(params.get("id"));
  if (!id) return Response.json({ error: "A valid id is required" }, { status: 400 });

  try {
    const rows = await recipients(id);
    const clicked = rows.filter((row) => row.clicks > 0);
    const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);

    if (params.get("csv") === "1") {
      const csv = buildCsv(
        ["name", "email", "clicks", "first clicked"],
        rows.map((row) => [row.name, row.email, row.clicks, row.firstClickAt ?? ""]),
      );
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="promotion-${id}-results.csv"`,
          "cache-control": "no-store",
        },
      });
    }

    return Response.json({
      sent: rows.length,
      clickedPeople: clicked.length,
      clickRate: rows.length ? Math.round((clicked.length / rows.length) * 1000) / 10 : 0,
      totalClicks,
      recipients: rows,
    });
  } catch {
    return Response.json({ error: "Could not load those results." }, { status: 400 });
  }
}
