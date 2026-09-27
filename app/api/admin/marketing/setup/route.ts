import { isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import { createMarketingTables, missingTables } from "../../../../lib/marketing-setup";

export const dynamic = "force-dynamic";

/**
 * One-time setup for the marketing tables, so the panel does not depend on
 * someone having a terminal and the Turso credentials to hand.
 *
 * Behind the admin session and the same permission as sending, and limited
 * to `CREATE TABLE/INDEX IF NOT EXISTS` — see `lib/marketing-setup.ts`.
 */
async function guard() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return requirePermission("marketing.send");
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const missing = await missingTables();
  return Response.json({ ready: missing.length === 0, missing });
}

export async function POST() {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { created, stillMissing } = await createMarketingTables();
    if (stillMissing.length) {
      return Response.json(
        {
          error: `Could not create: ${stillMissing.join(", ")}. Check that the database credentials in Vercel allow writing.`,
        },
        { status: 500 },
      );
    }
    return Response.json({ ready: true, created });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Setup did not complete.",
      },
      { status: 500 },
    );
  }
}
