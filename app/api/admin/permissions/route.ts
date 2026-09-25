import { isAdministrator } from "../../../lib/auth";
import {
  PERMISSIONS,
  permissionsForUser,
  setPermissionsForUser,
} from "../../../lib/permissions";

export const dynamic = "force-dynamic";

/** Only administrators may see or change who can do what. */
async function guard() {
  if (await isAdministrator()) return null;
  return Response.json(
    { error: "Only administrators can manage permissions." },
    { status: 403 },
  );
}

export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("userId"));
  if (!id) {
    return Response.json({ error: "A valid user id is required" }, { status: 400 });
  }
  return Response.json({
    available: PERMISSIONS,
    granted: await permissionsForUser(id),
  });
}

export async function PUT(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = (await request.json()) as { userId?: unknown; permissions?: unknown };
    const id = Number(body.userId);
    if (!id) {
      return Response.json({ error: "A valid user id is required" }, { status: 400 });
    }
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.map((value) => String(value))
      : [];
    await setPermissionsForUser(id, permissions);
    return Response.json({ ok: true, granted: await permissionsForUser(id) });
  } catch {
    return Response.json({ error: "We could not save those permissions." }, { status: 400 });
  }
}
