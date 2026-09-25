import { isAdminAuthenticated } from "../../../../lib/auth";
import { requirePermission } from "../../../../lib/permissions";
import { applyImport } from "../../../../lib/marketing";
import {
  MAX_IMPORT_ROWS,
  parseCsv,
  planImport,
} from "../../../../lib/marketing-csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Import contacts from a CSV the admin pasted in.
 *
 * The consent tick is mandatory and checked here as well as in the browser:
 * a request that skips the UI must not be able to skip the confirmation that
 * these people agreed to be emailed.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  const denied = await requirePermission("marketing.send");
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      csv?: unknown;
      consent?: unknown;
      extraGroup?: unknown;
    };

    if (body.consent !== true) {
      return Response.json(
        {
          error:
            "Please confirm these people agreed to receive offers from Byteflow before importing.",
        },
        { status: 400 },
      );
    }

    const text = String(body.csv ?? "");
    if (!text.trim()) {
      return Response.json({ error: "The file appears to be empty." }, { status: 400 });
    }

    const { headers, rows } = parseCsv(text);
    if (rows.length > MAX_IMPORT_ROWS) {
      return Response.json(
        {
          error: `That file has ${rows.length.toLocaleString()} rows. Please import at most ${MAX_IMPORT_ROWS.toLocaleString()} at a time.`,
        },
        { status: 400 },
      );
    }

    const plan = planImport(rows, headers, String(body.extraGroup ?? ""));
    if (!plan.candidates.length) {
      return Response.json(
        {
          error:
            "No valid email addresses were found. Check that the file has an email column.",
          invalid: plan.invalid.slice(0, 20),
        },
        { status: 400 },
      );
    }

    const saved = await applyImport(plan.candidates);

    return Response.json({
      added: saved.added,
      updated: saved.updated,
      alreadyUnsubscribed: saved.alreadyUnsubscribed,
      duplicatesInFile: plan.duplicatesInFile,
      invalid: plan.invalid.slice(0, 50),
      invalidCount: plan.invalid.length,
    });
  } catch {
    return Response.json(
      { error: "We could not read that file. Save it as CSV UTF-8 and try again." },
      { status: 400 },
    );
  }
}
