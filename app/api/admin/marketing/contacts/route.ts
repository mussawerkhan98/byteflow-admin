import { isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import {
  contactFacets,
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "../../../../lib/marketing";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/valid email|already (exists|uses)/i.test(message)) {
    return Response.json({ error: message }, { status: 400 });
  }
  return Response.json(
    { error: "We could not complete that action. Check the form and try again." },
    { status: 400 },
  );
}

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return requirePermission("marketing.send");
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    const [contacts, facets] = await Promise.all([listContacts(), contactFacets()]);
    return Response.json({ contacts, facets });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const contact = await createContact(body);
    return Response.json({ contact }, { status: 201 });
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
    await updateContact(id, body);
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
    await deleteContact(id);
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
