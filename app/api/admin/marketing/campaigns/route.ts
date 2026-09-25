import { getCurrentAdminUser, isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import {
  copyCampaign,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  updateCampaign,
} from "../../../../lib/campaigns";
import { contactFacets, listContacts } from "../../../../lib/marketing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return requirePermission("marketing.send");
}

const failure = (error: unknown) =>
  Response.json(
    {
      error:
        error instanceof Error && error.message
          ? error.message
          : "We could not complete that action.",
    },
    { status: (error as { status?: number })?.status ?? 400 },
  );

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    const [campaigns, facets, contacts] = await Promise.all([
      listCampaigns(),
      contactFacets(),
      listContacts(),
    ]);
    // The browser needs the bare targeting fields to show a live recipient
    // count as chips are ticked, without a round trip for every click.
    return Response.json({
      campaigns,
      facets,
      people: contacts.map((contact) => ({
        country: contact.country,
        region: contact.region,
        groups: contact.groups,
        optOut: contact.optOut,
      })),
      brevoReady: Boolean(process.env.BREVO_API_KEY),
      cronReady: Boolean(process.env.CRON_SECRET),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const who = (await getCurrentAdminUser())?.email ?? "";
    if (body.action === "copy") {
      const id = await copyCampaign(Number(body.id), who);
      return Response.json({ id }, { status: 201 });
    }
    const id = await createCampaign(body, who);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) throw new Error("A valid id is required");
    await updateCampaign(id, body);
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) throw new Error("A valid id is required");
    await deleteCampaign(id);
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
