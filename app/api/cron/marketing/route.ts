import { timingSafeEqual } from "node:crypto";
import { db } from "../../../lib/db";
import { runDueCampaigns } from "../../../lib/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Compared in constant time so the secret cannot be guessed a byte at a time. */
function secretMatches(supplied: string): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (!left.length || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function handle(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      {
        error:
          "Scheduling is not set up. Add CRON_SECRET in Vercel (Production and Preview) and redeploy.",
      },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const query = new URL(request.url).searchParams.get("key") ?? "";
  if (!secretMatches(bearer) && !secretMatches(query)) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  const result = await runDueCampaigns();

  // Recorded so the Marketing screen can show when scheduling last ran.
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS cron_runs (
      name TEXT PRIMARY KEY,
      last_run_at TEXT NOT NULL
    )`);
    await db.execute({
      sql: `INSERT INTO cron_runs (name, last_run_at) VALUES ('marketing', ?)
            ON CONFLICT(name) DO UPDATE SET last_run_at = excluded.last_run_at`,
      args: [new Date().toISOString()],
    });
  } catch {
    // Recording the run is a convenience; never fail the send over it.
  }

  return Response.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
