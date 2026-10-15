"use client";

import { useCallback, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

type SurveyRow = { column: string; movable: number; orphaned: number };
type Survey = { rows: SurveyRow[]; movable: number; orphaned: number };
type RunResult = {
  before: Survey;
  rewritten: number;
  remaining: Survey;
  failed: string[];
};

const card =
  "rounded-2xl border border-white/[.07] bg-[#0d1921] p-6";

export default function ImageStorageManager({ initial }: { initial: Survey | null }) {
  const [survey, setSurvey] = useState<Survey | null>(initial);
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/migrate-media", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
      setResult(body as RunResult);
      setSurvey((body as RunResult).remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The move did not finish.");
    } finally {
      setBusy(false);
    }
  }, []);

  const movable = survey?.movable ?? 0;
  const orphaned = survey?.orphaned ?? 0;

  return (
    <>
      <AdminPageHeader sectionKey="image-storage" />

      {error && (
        <p className="mt-8 rounded-xl border border-rose-400/30 bg-rose-500/[.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <section className={`mt-8 ${card}`}>
        <h2 className="text-sm font-bold text-white">What is stored inside your content right now</h2>
        <p className="mt-1 text-xs text-slate-500">
          This only reads. Nothing changes until you press the button below.
        </p>

        {survey === null ? (
          <p className="mt-6 text-sm text-rose-200">
            Could not read the current state. Reload the page to try again.
          </p>
        ) : survey.rows.length === 0 ? (
          <p className="mt-6 text-sm text-emerald-300">
            Nothing to move. Every image is already stored as its own file.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/[.06]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Where</th>
                  <th className="px-4 py-3 font-semibold">Can be moved</th>
                  <th className="px-4 py-3 font-semibold">Cannot be matched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {survey.rows.map((row) => (
                  <tr key={row.column}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.column}</td>
                    <td className="px-4 py-3 font-semibold text-cyan-300">{row.movable}</td>
                    <td className={`px-4 py-3 font-semibold ${row.orphaned ? "text-amber-300" : "text-slate-600"}`}>
                      {row.orphaned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orphaned > 0 && (
          <p className="mt-4 text-xs leading-relaxed text-amber-200/80">
            {orphaned} image{orphaned === 1 ? "" : "s"} could not be matched to a stored file and
            will be left exactly as {orphaned === 1 ? "it is" : "they are"}. Nothing is guessed at.
          </p>
        )}

        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || movable === 0}
          className="mt-6 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,.15)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy
            ? "Moving…"
            : movable === 0
              ? "Nothing to move"
              : `Move ${movable} image${movable === 1 ? "" : "s"} to files`}
        </button>
      </section>

      {result && (
        <section className={`mt-6 ${card}`}>
          <h2 className="text-sm font-bold text-white">Done</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Moved <span className="font-bold text-cyan-300">{result.rewritten}</span> image
            {result.rewritten === 1 ? "" : "s"} out of your content and onto their own files.
            {result.remaining.movable === 0
              ? " Nothing is left inside the content."
              : ` ${result.remaining.movable} still inside the content.`}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            The images themselves were not touched — only the reference to them changed, so your
            pages look exactly the same but no longer carry the pictures inside them.
          </p>
          {result.failed.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs text-rose-300">
              {result.failed.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
