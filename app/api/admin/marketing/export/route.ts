import { isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import { listContacts } from "../../../../lib/marketing";
import { SAMPLE_CSV, buildCsv } from "../../../../lib/marketing-csv";

export const dynamic = "force-dynamic";

/**
 * Download the contact list as a spreadsheet-safe CSV, or the blank sample
 * file that shows which columns an import expects (?sample=1).
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  const wantsSample = new URL(request.url).searchParams.get("sample") === "1";
  const stamp = new Date().toISOString().slice(0, 10);

  if (wantsSample) {
    return new Response(SAMPLE_CSV, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="contacts-sample.csv"',
        "cache-control": "no-store",
      },
    });
  }

  const contacts = await listContacts();
  const csv = buildCsv(
    ["name", "email", "phone", "country", "region", "groups", "type", "subscribed"],
    contacts.map((contact) => [
      contact.name,
      contact.email,
      contact.phone,
      contact.country,
      contact.region,
      contact.groups,
      contact.source === "import" ? "imported contact" : "contact",
      contact.optOut ? "no" : "yes",
    ]),
  );

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="byteflow-contacts-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
