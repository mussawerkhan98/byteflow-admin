import { isAdminAuthenticated } from "../../../../../lib/auth";
import { requirePermission } from "../../../../../lib/permissions";
import { previewCampaign } from "../../../../../lib/campaigns";

export const dynamic = "force-dynamic";

/**
 * The exact email, as HTML, for the preview window.
 *
 * Returned as text rather than a rendered page so the browser can drop it
 * into a sandboxed iframe — nothing in it executes in the admin's origin.
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "A valid id is required" }, { status: 400 });

  try {
    const html = await previewCampaign(id);
    return new Response(html, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not build a preview." },
      { status: 400 },
    );
  }
}
