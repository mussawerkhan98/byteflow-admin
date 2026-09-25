"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countAudience, describeAudience, type Audience } from "../../lib/audience";

type Facet = { value: string; count: number };
type Person = { country: string; region: string; groups: string; optOut: boolean };

type Campaign = {
  id: number;
  subject: string;
  headline: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  hasImage: boolean;
  audience: Audience;
  audienceLabel: string;
  status: "draft" | "scheduled" | "sending" | "sent";
  scheduledAt: string | null;
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  sendError: string;
  clickedPeople: number;
  totalClicks: number;
};

const emptyDraft = {
  id: 0,
  subject: "",
  headline: "",
  body: "",
  buttonText: "",
  buttonUrl: "",
  audience: { countries: [], regions: [], groups: [] } as Audience,
  imageBase64: "",
  hasImage: false,
  removeImage: false,
};

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-200 outline-none focus:border-cyan-400";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-400/10 text-slate-300",
  scheduled: "bg-amber-400/10 text-amber-300",
  sending: "bg-blue-400/10 text-blue-300",
  sent: "bg-emerald-400/10 text-emerald-300",
};

/** Tomorrow at 09:00 in the browser's own time zone, for the date picker. */
function defaultSchedule() {
  const when = new Date();
  when.setDate(when.getDate() + 1);
  when.setHours(9, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}

export default function Promotions() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [facets, setFacets] = useState<{ countries: Facet[]; regions: Facet[]; groups: Facet[] } | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [brevoReady, setBrevoReady] = useState(true);
  const [cronReady, setCronReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [draft, setDraft] = useState<typeof emptyDraft | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [results, setResults] = useState<{ campaign: Campaign; data: ResultsData } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollToForm = useRef(false);

  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    const response = await fetch("/api/admin/marketing/campaigns", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setCampaigns(data.campaigns ?? []);
      setFacets(data.facets ?? null);
      setPeople(data.people ?? []);
      setBrevoReady(Boolean(data.brevoReady));
      setCronReady(Boolean(data.cronReady));
    } else {
      setNotice({ type: "error", text: data.error ?? "Could not load promotions." });
    }
    if (!quiet) setLoading(false);
  }

  useEffect(() => {
    // Anything whose scheduled time has passed is sent when the tab opens, so
    // a promotion is not left waiting for the next timer run.
    void fetch("/api/admin/marketing/campaigns/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "run-due" }),
    })
      .catch(() => null)
      .finally(() => void load());
  }, []);

  useEffect(() => {
    if (!draft || !scrollToForm.current) return;
    scrollToForm.current = false;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [draft]);

  const recipientCount = useMemo(
    () => (draft ? countAudience(people, draft.audience) : 0),
    [draft, people],
  );

  function start(campaign?: Campaign) {
    setNotice(null);
    scrollToForm.current = true;
    setDraft(
      campaign
        ? {
            id: campaign.id,
            subject: campaign.subject,
            headline: campaign.headline,
            body: campaign.body,
            buttonText: campaign.buttonText,
            buttonUrl: campaign.buttonUrl,
            audience: campaign.audience,
            imageBase64: "",
            hasImage: campaign.hasImage,
            removeImage: false,
          }
        : { ...emptyDraft, audience: { countries: [], regions: [], groups: [] } },
    );
  }

  function toggleChip(section: keyof Audience, value: string) {
    if (!draft) return;
    const current = draft.audience[section];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    setDraft({ ...draft, audience: { ...draft.audience, [section]: next } });
  }

  async function saveDraft(): Promise<number | null> {
    if (!draft) return null;
    const response = await fetch("/api/admin/marketing/campaigns", {
      method: draft.id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice({ type: "error", text: data.error ?? "Could not save." });
      return null;
    }
    return draft.id || Number(data.id);
  }

  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/marketing/campaigns/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "That did not work." });
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const id = await saveDraft();
    setBusy(false);
    if (id) {
      setNotice({ type: "ok", text: "Draft saved." });
      setDraft(null);
      await load(true);
    }
  }

  async function onSendNow() {
    if (!draft) return;
    if (
      !confirm(
        `Send "${draft.subject}" to ${recipientCount} ${recipientCount === 1 ? "person" : "people"} now?`,
      )
    )
      return;
    setBusy(true);
    const id = await saveDraft();
    setBusy(false);
    if (!id) return;
    const report = await act("send", { id });
    if (report) {
      setNotice({
        type: report.failed ? "error" : "ok",
        text: report.failed
          ? `Sent to ${report.sent}, ${report.failed} failed. ${report.firstError ?? ""}`
          : `Sent to ${report.sent} ${report.sent === 1 ? "person" : "people"}.`,
      });
      setDraft(null);
      await load(true);
    }
  }

  async function onSchedule(when: string) {
    if (!draft) return;
    setBusy(true);
    const id = await saveDraft();
    setBusy(false);
    if (!id) return;
    const result = await act("schedule", { id, when: new Date(when).toISOString() });
    if (result) {
      setNotice({ type: "ok", text: "Scheduled." });
      setDraft(null);
      await load(true);
    }
  }

  async function onTest() {
    if (!draft) return;
    const to = prompt("Send a test to which address?");
    if (!to) return;
    setBusy(true);
    const id = await saveDraft();
    setBusy(false);
    if (!id) return;
    const result = await act("test", { id, to });
    if (result) setNotice({ type: "ok", text: `Test sent to ${result.to}.` });
  }

  async function onPreview() {
    if (!draft) return;
    const id = await saveDraft();
    if (!id) return;
    await load(true);
    const response = await fetch(`/api/admin/marketing/campaigns/preview?id=${id}`);
    if (response.ok) setPreview(await response.text());
    else setNotice({ type: "error", text: "Could not build a preview." });
  }

  async function remove(campaign: Campaign) {
    if (!confirm(`Delete "${campaign.subject}"? This also deletes its click data.`)) return;
    const response = await fetch(`/api/admin/marketing/campaigns?id=${campaign.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setNotice({ type: "ok", text: "Promotion deleted." });
      await load(true);
    }
  }

  async function openResults(campaign: Campaign) {
    const response = await fetch(`/api/admin/marketing/campaigns/results?id=${campaign.id}`);
    const data = await response.json();
    if (response.ok) setResults({ campaign, data });
    else setNotice({ type: "error", text: data.error ?? "Could not load results." });
  }

  async function pickImage(file?: File) {
    if (!draft || !file) return;
    if (file.size > 1_500_000) {
      setNotice({ type: "error", text: "The image must be 1.5 MB or smaller." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setDraft({
        ...draft,
        imageBase64: String(reader.result ?? ""),
        hasImage: true,
        removeImage: false,
      });
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {!brevoReady && (
        <p className="mb-5 rounded-lg border border-amber-400/20 bg-amber-400/[.06] p-3 text-sm text-amber-200">
          Sending is not set up yet. Add <code>BREVO_API_KEY</code> in Vercel
          (Production and Preview) and redeploy. You can still write and save drafts.
        </p>
      )}
      {!cronReady && campaigns.some((campaign) => campaign.status === "scheduled") && (
        <p className="mb-5 rounded-lg border border-amber-400/20 bg-amber-400/[.06] p-3 text-sm text-amber-200">
          Promotions are scheduled but <code>CRON_SECRET</code> is not set, so nothing
          will send on its own. They go out when someone opens this screen.
        </p>
      )}
      {notice && (
        <p
          className={`mb-5 rounded-lg border p-3 text-sm ${
            notice.type === "ok"
              ? "border-cyan-400/10 bg-cyan-400/[.05] text-cyan-200"
              : "border-red-400/20 bg-red-400/[.06] text-red-200"
          }`}
        >
          {notice.text}
        </p>
      )}

      <button
        onClick={() => start()}
        className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950"
      >
        New promotion
      </button>

      {draft && (
        <form
          ref={formRef}
          onSubmit={onSave}
          className="mt-6 rounded-2xl border border-white/[.08] bg-[#0d1921] p-5 sm:p-7"
        >
          <h2 className="border-b border-white/[.06] pb-4 text-lg font-bold text-white">
            {draft.id ? "Edit promotion" : "New promotion"}
          </h2>

          <div className="mt-5 grid gap-5">
            <label className="text-xs font-semibold text-slate-300">
              Subject<span className="text-cyan-400"> *</span>
              <input
                required
                value={draft.subject}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Headline
              <input
                value={draft.headline}
                onChange={(event) => setDraft({ ...draft, headline: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Message (leave a blank line between paragraphs)
              <textarea
                rows={7}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                className={inputClass}
              />
              <span className="mt-1 block font-normal text-slate-500">
                Every email opens with “Dear &lt;first name&gt;,” automatically.
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-300">
                Button text
                <input
                  value={draft.buttonText}
                  placeholder="See the offer"
                  onChange={(event) => setDraft({ ...draft, buttonText: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Button link
                <input
                  value={draft.buttonUrl}
                  placeholder="https://www.byteflow.ae/it-amc-services-dubai"
                  onChange={(event) => setDraft({ ...draft, buttonUrl: event.target.value })}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="text-xs font-semibold text-slate-300">
              Offer image (optional, JPG/PNG/WEBP, up to 1.5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void pickImage(event.target.files?.[0])}
                className="mt-2 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
              />
              {(draft.hasImage || draft.imageBase64) && !draft.removeImage && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, imageBase64: "", hasImage: false, removeImage: true })
                  }
                  className="mt-2 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300"
                >
                  Remove image
                </button>
              )}
            </label>

            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
              <p className="text-xs font-semibold text-slate-300">Who receives it</p>
              <p className="mt-1 text-xs text-slate-500">
                Nothing ticked in a section means everyone. Several ticks in one section
                widen it; ticks across sections narrow it.
              </p>
              {(["countries", "regions", "groups"] as const).map((section) => {
                const list = facets?.[section] ?? [];
                if (!list.length) return null;
                return (
                  <div key={section} className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {section === "countries" ? "Country" : section === "regions" ? "Region / city" : "Groups"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {list.map((entry) => {
                        const on = draft.audience[section].includes(entry.value);
                        return (
                          <button
                            key={entry.value}
                            type="button"
                            onClick={() => toggleChip(section, entry.value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              on
                                ? "bg-cyan-400 text-slate-950"
                                : "border border-slate-700 text-slate-300"
                            }`}
                          >
                            {entry.value} ({entry.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="mt-4 text-sm font-bold text-cyan-300">
                {recipientCount} {recipientCount === 1 ? "person" : "people"} will receive
                this
              </p>
              <p className="mt-1 text-xs text-slate-500">{describeAudience(draft.audience)}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={busy}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onPreview()}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              disabled={busy || !brevoReady}
              onClick={() => void onTest()}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50"
            >
              Send test
            </button>
            <ScheduleButton disabled={busy} onSchedule={(when) => void onSchedule(when)} />
            <button
              type="button"
              disabled={busy || !recipientCount || !brevoReady}
              onClick={() => void onSendNow()}
              className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
            >
              Send now to {recipientCount}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-7 divide-y divide-white/[.06] rounded-2xl border border-white/[.08] bg-[#0d1921]">
        {loading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        {!loading && !campaigns.length && (
          <p className="p-6 text-sm text-slate-500">
            No promotions yet. Create one above.
          </p>
        )}
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-100">{campaign.subject}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[campaign.status]}`}
                >
                  {campaign.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">To: {campaign.audienceLabel}</p>
              {campaign.status === "scheduled" && campaign.scheduledAt && (
                <p className="mt-1 text-xs text-amber-300">
                  Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                </p>
              )}
              {campaign.status === "sent" && (
                <p className="mt-1 text-xs text-slate-400">
                  Sent {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : ""} ·{" "}
                  {campaign.sentCount} delivered
                  {campaign.failedCount ? `, ${campaign.failedCount} failed` : ""} ·{" "}
                  {campaign.clickedPeople} clicked (
                  {campaign.sentCount
                    ? Math.round((campaign.clickedPeople / campaign.sentCount) * 1000) / 10
                    : 0}
                  %) · {campaign.totalClicks} clicks
                </p>
              )}
              {campaign.sendError && (
                <p className="mt-1 text-xs text-red-300">{campaign.sendError}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {campaign.status === "draft" && (
                <button
                  onClick={() => start(campaign)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-cyan-400"
                >
                  Edit
                </button>
              )}
              {campaign.status === "sent" && (
                <button
                  onClick={() => void openResults(campaign)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-cyan-400"
                >
                  Results
                </button>
              )}
              {campaign.status === "scheduled" && (
                <button
                  onClick={async () => {
                    await act("cancel-schedule", { id: campaign.id });
                    await load(true);
                  }}
                  className="rounded border border-slate-700 px-3 py-1.5 text-sm"
                >
                  Cancel schedule
                </button>
              )}
              <button
                onClick={async () => {
                  const response = await fetch("/api/admin/marketing/campaigns", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ action: "copy", id: campaign.id }),
                  });
                  if (response.ok) {
                    setNotice({ type: "ok", text: "Copied as a new draft." });
                    await load(true);
                  }
                }}
                className="rounded border border-slate-700 px-3 py-1.5 text-sm"
              >
                Copy
              </button>
              <button
                onClick={() => void remove(campaign)}
                className="rounded border border-red-500/30 px-3 py-1.5 text-sm text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <Modal onClose={() => setPreview("")} title="Email preview">
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={preview}
            className="h-[70vh] w-full rounded-lg border border-slate-700 bg-white"
          />
        </Modal>
      )}

      {results && (
        <Modal onClose={() => setResults(null)} title={`Results — ${results.campaign.subject}`}>
          <ResultsView campaignId={results.campaign.id} data={results.data} />
        </Modal>
      )}
    </div>
  );
}

function ScheduleButton({
  disabled,
  onSchedule,
}: {
  disabled: boolean;
  onSchedule: (when: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(defaultSchedule());
  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50"
      >
        Schedule
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={when}
        onChange={(event) => setWhen(event.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSchedule(when)}
        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-slate-400"
      >
        Cancel
      </button>
    </span>
  );
}

type ResultsData = {
  sent: number;
  clickedPeople: number;
  clickRate: number;
  totalClicks: number;
  recipients: { email: string; name: string; clicks: number; firstClickAt: string | null }[];
};

function ResultsView({ campaignId, data }: { campaignId: number; data: ResultsData }) {
  const [filter, setFilter] = useState<"all" | "clicked" | "not">("all");
  const [search, setSearch] = useState("");
  const rows = data.recipients.filter((row) => {
    if (filter === "clicked" && !row.clicks) return false;
    if (filter === "not" && row.clicks) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${row.name} ${row.email}`.toLowerCase().includes(term);
  });
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sent" value={data.sent} />
        <Stat label="People clicked" value={data.clickedPeople} />
        <Stat label="Click rate" value={`${data.clickRate}%`} />
        <Stat label="Total clicks" value={data.totalClicks} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Some corporate mail scanners open links automatically, so a few clicks may not be
        a real person.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "clicked", "not"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === value ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-300"
            }`}
          >
            {value === "all" ? "Everyone" : value === "clicked" ? "Clicked" : "Didn’t click"}
          </button>
        ))}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search…"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
        />
        <a
          href={`/api/admin/marketing/campaigns/results?id=${campaignId}&csv=1`}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
        >
          Download CSV
        </a>
      </div>
      <div className="mt-4 max-h-[40vh] divide-y divide-white/[.06] overflow-y-auto rounded-lg border border-white/[.06]">
        {rows.map((row) => (
          <div key={row.email} className="flex items-center justify-between p-3 text-xs">
            <span className="min-w-0 truncate text-slate-300">
              {row.name || row.email}
              <span className="ml-2 text-slate-600">{row.email}</span>
            </span>
            <span className="shrink-0 text-slate-400">
              {row.clicks
                ? `${row.clicks} click${row.clicks === 1 ? "" : "s"}${row.firstClickAt ? ` · ${new Date(row.firstClickAt).toLocaleString()}` : ""}`
                : "—"}
            </span>
          </div>
        ))}
        {!rows.length && <p className="p-4 text-xs text-slate-500">Nobody matches that.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/[.08] bg-slate-950/50 p-3">
      <p className="text-xl font-black text-cyan-300">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/[.08] bg-[#0d1921] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-sm text-slate-400">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
