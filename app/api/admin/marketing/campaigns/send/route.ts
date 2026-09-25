import { getCurrentAdminUser, isAdminAuthenticated } from "../../../../../lib/auth";
import { requirePermission } from "../../../../../lib/permissions";
import {
  cancelSchedule,
  runDueCampaigns,
  scheduleCampaign,
  sendCampaign,
  sendTest,
} from "../../../../../lib/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Everything that makes a promotion move: send now, send a test, schedule,
 * cancel a schedule, and the "catch up on anything due" call the Marketing
 * screen makes when it opens.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const id = Number(body.id ?? 0);

    if (action === "run-due") {
      return Response.json(await runDueCampaigns());
    }

    if (!id) throw new Error("A valid id is required");

    if (action === "test") {
      const to =
        String(body.to ?? "").trim() || (await getCurrentAdminUser())?.email || "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
        throw new Error("Enter a valid email address to send the test to");
      }
      await sendTest(id, to);
      return Response.json({ ok: true, to });
    }

    if (action === "schedule") {
      await scheduleCampaign(id, String(body.when ?? ""));
      return Response.json({ ok: true });
    }

    if (action === "cancel-schedule") {
      await cancelSchedule(id);
      return Response.json({ ok: true });
    }

    if (action === "send") {
      const report = await sendCampaign(id, "draft");
      return Response.json(report);
    }

    throw new Error("Unknown action");
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 400;
    return Response.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "We could not complete that action.",
      },
      { status },
    );
  }
}
