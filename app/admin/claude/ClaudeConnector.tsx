"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

type Account = { id: number; displayName: string; email: string; active: boolean; createdAt: string; updatedAt: string };
type Connection = { clientId: string; clientName: string; connectedAt: string; lastUsedAt: string | null };
type Activity = {
  id: number;
  action: string;
  actor: string;
  clientName: string;
  postId: number | null;
  revisionId: number | null;
  summary: string;
  createdAt: string;
  postTitle: string | null;
  postSlug: string | null;
  postPublished: boolean | null;
};
type Revision = { id: number; title: string; published: boolean; reason: string; actor: string; createdAt: string };

const ACTIONS: Record<string, { label: string; tone: string }> = {
  create: { label: "Created draft", tone: "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300" },
  update: { label: "Edited", tone: "border-cyan-400/20 bg-cyan-400/[.07] text-cyan-300" },
  publish: { label: "Published", tone: "border-violet-400/20 bg-violet-400/[.07] text-violet-300" },
  upload_image: { label: "Uploaded image", tone: "border-slate-400/20 bg-slate-400/[.07] text-slate-300" },
  restore: { label: "Undone", tone: "border-amber-400/20 bg-amber-400/[.07] text-amber-300" },
};

const panel = "mt-7 rounded-2xl border border-white/[.08] bg-(--admin-panel) p-6";
const eyebrow = "text-[10px] font-bold uppercase tracking-[.18em] text-cyan-400";
const button = "rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[.05] disabled:opacity-50";
const primary = "rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50";

/** Database times are UTC without a zone; show them in the viewer's time. */
const when = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function ClaudeConnector() {
  const [account, setAccount] = useState<Account | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [mcpUrl, setMcpUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ postId: number; title: string; revisions: Revision[] } | null>(null);

  // State is set only in the promise callbacks, never while the effect runs.
  const load = useCallback(
    () =>
      fetch("/api/admin/claude", { cache: "no-store" })
        .then(async (response) => ({ ok: response.ok, data: await response.json() }))
        .then(({ ok, data }) => {
          if (!ok) return setNotice(data.error ?? "Could not load the Claude connector.");
          setAccount(data.account);
          setConnections(data.connections ?? []);
          setActivity(data.activity ?? []);
          setMcpUrl(data.mcpUrl ?? "");
          setEmail((current) => current || data.account?.email || "");
        })
        .catch(() => setNotice("Could not load the Claude connector. Check your connection and refresh."))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/claude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error ?? "That did not work. Please try again.");
        return null;
      }
      setNotice(done);
      await load();
      return data;
    } catch {
      setNotice("That did not work. Check your connection and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function resetAccount() {
    if (account && !window.confirm("Give the Claude account a new password? Claude will be signed out and must connect again.")) return;
    const data = await act({ action: "reset-account", email }, account ? "New password set. Claude has been signed out." : "Claude account created.");
    if (data?.password) setPassword(data.password);
  }

  async function undo(entry: Activity) {
    if (!entry.revisionId) return;
    const what = entry.action === "publish" ? "This takes the article off the website again." : "The article goes back to how it was just before this change.";
    if (!window.confirm(`Undo “${entry.summary}”?\n\n${what}`)) return;
    await act({ action: "restore", revisionId: entry.revisionId }, "Done. The article is back to how it was before that change.");
    if (history?.postId === entry.postId) await showHistory(entry.postId!, history.title);
  }

  async function showHistory(postId: number, title: string) {
    const response = await fetch(`/api/admin/claude?revisions=${postId}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setHistory({ postId, title, revisions: data.revisions ?? [] });
    else setNotice(data.error ?? "Could not load the history.");
  }

  async function restore(revision: Revision) {
    if (!window.confirm(`Put “${revision.title}” back to how it was on ${when(revision.createdAt)}?\n\nThe current version is kept in the history too.`)) return;
    await act({ action: "restore", revisionId: revision.id }, "Done. The article has been restored.");
    if (history) await showHistory(history.postId, history.title);
  }

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="claude" />

      {notice && (
        <p role="status" className="mt-5 rounded-lg border border-cyan-400/10 bg-cyan-400/[.05] p-3 text-sm text-cyan-200">
          {notice}
        </p>
      )}

      <section className={panel}>
        <p className={eyebrow}>Step 1</p>
        <h2 className="mt-1 text-lg font-bold text-white">The Claude account</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Claude signs in with this account, not with your own login. It can only work on blog articles and images: no
          deleting, no other pages, settings or admin logins. It cannot sign in to this admin panel.
        </p>
        {loading ? (
          <p className="mt-5 text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 text-xs font-semibold text-slate-300">
              Account email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="claude@byteflow.ae"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
              />
            </label>
            <button type="button" disabled={busy || !email} onClick={resetAccount} className={primary}>
              {account ? "Set a new password" : "Create Claude account"}
            </button>
            {account && (
              <button
                type="button"
                disabled={busy}
                onClick={() => act({ action: "set-active", active: !account.active }, account.active ? "Claude account turned off. Claude has been signed out." : "Claude account turned on.")}
                className={button}
              >
                {account.active ? "Turn off" : "Turn on"}
              </button>
            )}
          </div>
        )}
        {account && (
          <p className="mt-3 text-xs text-slate-500">
            {account.active ? "Active" : "Turned off"} · created {when(account.createdAt)} · last changed {when(account.updatedAt)}
          </p>
        )}
        {password && (
          <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[.06] p-4">
            <p className="text-sm font-bold text-amber-200">Password — copy it now, it is shown only once</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-white select-all">{password}</code>
              <button type="button" onClick={() => void navigator.clipboard.writeText(password)} className={button}>
                Copy
              </button>
              <button type="button" onClick={() => setPassword("")} className={button}>
                I have saved it
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={panel}>
        <p className={eyebrow}>Step 2</p>
        <h2 className="mt-1 text-lg font-bold text-white">Add it in Claude</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          <li>In claude.ai, open Settings → Connectors → Add custom connector.</li>
          <li>Name it “Byteflow blog” and paste this URL:</li>
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-200 select-all">{mcpUrl || "…"}</code>
          <button type="button" disabled={!mcpUrl} onClick={() => void navigator.clipboard.writeText(mcpUrl)} className={button}>
            Copy
          </button>
        </div>
        <ol start={3} className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
          <li>Click Connect, sign in with the Claude account above and click Allow access.</li>
        </ol>
      </section>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={eyebrow}>Connected</p>
            <h2 className="mt-1 text-lg font-bold text-white">Claude apps signed in</h2>
          </div>
          {connections.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm("Sign every Claude app out? They will need to connect again.") && act({ action: "disconnect-all" }, "All Claude apps signed out.")}
              className={button}
            >
              Sign all out
            </button>
          )}
        </div>
        {connections.length ? (
          <ul className="mt-4 divide-y divide-white/[.06] text-sm">
            {connections.map((connection) => (
              <li key={connection.clientId} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="font-semibold text-slate-200">{connection.clientName}</span>
                <span className="text-xs text-slate-500">
                  connected {when(connection.connectedAt)} · last used {when(connection.lastUsedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">None yet.</p>
        )}
      </section>

      <section className={panel}>
        <p className={eyebrow}>Activity</p>
        <h2 className="mt-1 text-lg font-bold text-white">What Claude changed</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Every change, newest first. <strong className="text-slate-200">Undo</strong> puts the article back to how it was
          just before that change (undoing a publish takes it off the website). <strong className="text-slate-200">History</strong>{" "}
          lists every saved version of the article, including edits made here in the admin panel.
        </p>
        {activity.length ? (
          <ul className="mt-5 divide-y divide-white/[.06]">
            {activity.map((entry) => {
              const action = ACTIONS[entry.action] ?? { label: entry.action, tone: ACTIONS.upload_image.tone };
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${action.tone}`}>{action.label}</span>
                  <div className="min-w-56 flex-1">
                    <p className="text-sm text-slate-200">{entry.summary}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {when(entry.createdAt)} · {entry.actor}
                      {entry.postId !== null && ` · article ${entry.postId}`}
                      {entry.postId !== null && entry.postTitle === null && " (deleted)"}
                      {entry.postPublished === true && " · live"}
                      {entry.postPublished === false && " · draft"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {entry.revisionId !== null && (
                      <button type="button" disabled={busy} onClick={() => undo(entry)} className={button}>
                        Undo
                      </button>
                    )}
                    {entry.action === "create" && entry.postTitle !== null && (
                      <a href="/admin/posts" className={button}>
                        Delete in Blog Posts
                      </a>
                    )}
                    {entry.postId !== null && (
                      <button type="button" onClick={() => showHistory(entry.postId!, entry.postTitle ?? `Article ${entry.postId}`)} className={button}>
                        History
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{loading ? "Loading…" : "Nothing yet."}</p>
        )}
      </section>

      {history && (
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={eyebrow}>History</p>
              <h2 className="mt-1 text-lg font-bold text-white">{history.title}</h2>
            </div>
            <button type="button" onClick={() => setHistory(null)} className={button}>
              Close
            </button>
          </div>
          {history.revisions.length ? (
            <ul className="mt-4 divide-y divide-white/[.06]">
              {history.revisions.map((revision) => (
                <li key={revision.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="min-w-56 flex-1">
                    <p className="text-sm text-slate-200">
                      {revision.title} <span className="text-xs text-slate-500">({revision.published ? "live" : "draft"})</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Saved {when(revision.createdAt)} · {revision.reason} · {revision.actor}
                    </p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => restore(revision)} className={button}>
                    Restore this version
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No saved versions yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
