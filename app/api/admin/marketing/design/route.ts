import { isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import { getEmailDesign, saveEmailDesign } from "../../../../lib/email-design";

export const dynamic = "force-dynamic";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return requirePermission("marketing.send");
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  return Response.json({ design: await getEmailDesign() });
}

export async function PUT(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const design = await saveEmailDesign(await request.json());
    return Response.json({ design });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/no such table/i.test(message)) {
      return Response.json(
        {
          error:
            "Marketing is not set up in the database yet. Use “Set up marketing tables” on the Promotions tab first.",
        },
        { status: 400 },
      );
    }
    return Response.json({ error: "Could not save the design." }, { status: 400 });
  }
}
