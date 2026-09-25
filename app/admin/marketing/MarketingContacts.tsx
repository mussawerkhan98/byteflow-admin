"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { COUNTRY_NAMES } from "../../lib/countries";
import {
  MAX_IMPORT_ROWS,
  parseCsv,
  planImport,
  parseGroups,
} from "../../lib/marketing-csv";

type Contact = {
  id: number;
  email: string;
  name: string;
  phone: string;
  country: string;
  region: string;
  groups: string;
  optOut: boolean;
  source: "manual" | "import";
};

type Facet = { value: string; count: number };
type Facets = {
  countries: Facet[];
  regions: Facet[];
  groups: Facet[];
  total: number;
  subscribed: number;
  unsubscribed: number;
};

const blank = {
  id: 0,
  email: "",
  name: "",
  phone: "",
  country: "",
  region: "",
  groups: "",
  optOut: false,
};

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-200 outline-none focus:border-cyan-400";

export default function MarketingContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "subscribed" | "unsubscribed">("all");
  const [editing, setEditing] = useState<typeof blank | null>(null);
  const [showImport, setShowImport] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollToForm = useRef(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/marketing/contacts", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setContacts(data.contacts ?? []);
      setFacets(data.facets ?? null);
    } else {
      setNotice({ type: "error", text: data.error ?? "Could not load contacts." });
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!editing || !scrollToForm.current) return;
    scrollToForm.current = false;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editing]);

  function start(contact?: Contact) {
    setEditing(contact ? { ...contact } : { ...blank });
    setNotice(null);
    scrollToForm.current = true;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/marketing/contacts", {
        method: editing.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not save that contact." });
        return;
      }
      setNotice({ type: "ok", text: "Contact saved." });
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(contact: Contact) {
    if (!confirm(`Delete ${contact.email}? This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/marketing/contacts?id=${contact.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice({ type: "error", text: data.error ?? "Could not delete that contact." });
      return;
    }
    setNotice({ type: "ok", text: "Contact deleted." });
    await load();
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (statusFilter === "subscribed" && contact.optOut) return false;
      if (statusFilter === "unsubscribed" && !contact.optOut) return false;
      if (groupFilter !== "all") {
        const groups = parseGroups(contact.groups).map((group) => group.toLowerCase());
        if (!groups.includes(groupFilter.toLowerCase())) return false;
      }
      if (!term) return true;
      return [contact.name, contact.email, contact.phone, contact.country, contact.region, contact.groups]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [contacts, search, groupFilter, statusFilter]);

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="marketing" />

      {notice && (
        <p
          className={`mt-5 rounded-lg border p-3 text-sm ${
            notice.type === "ok"
              ? "border-cyan-400/10 bg-cyan-400/[.05] text-cyan-200"
              : "border-red-400/20 bg-red-400/[.06] text-red-200"
          }`}
        >
          {notice.text}
        </p>
      )}

      {facets && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Receives offers" value={facets.subscribed} />
          <Stat label="Unsubscribed" value={facets.unsubscribed} />
          <Stat label="Total contacts" value={facets.total} />
          <p className="text-xs text-slate-500 sm:col-span-3">
            Brevo&apos;s free plan sends up to 300 emails a day.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => start()}
          className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950"
        >
          Add contact
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200"
        >
          Import CSV
        </button>
        {/* A file download, not a page: next/link would fetch it as a route. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/marketing/export"
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200"
        >
          Export CSV
        </a>
      </div>

      {editing && (
        <form
          ref={formRef}
          onSubmit={save}
          className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-5 shadow-2xl sm:p-7"
        >
          <h2 className="border-b border-white/[.06] pb-4 text-lg font-bold text-white">
            {editing.id ? "Edit contact" : "New contact"}
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Email" required>
              <input
                type="email"
                required
                value={editing.email}
                onChange={(event) => setEditing({ ...editing, email: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Name">
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                value={editing.phone}
                placeholder="+971 50 123 4567"
                onChange={(event) => setEditing({ ...editing, phone: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Country">
              <input
                list="country-list"
                value={editing.country}
                placeholder="Start typing…"
                onChange={(event) => setEditing({ ...editing, country: event.target.value })}
                className={inputClass}
              />
              <datalist id="country-list">
                {COUNTRY_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Region / city">
              <input
                value={editing.region}
                onChange={(event) => setEditing({ ...editing, region: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Groups (comma separated)">
              <input
                value={editing.groups}
                placeholder="VIP, Corporate"
                onChange={(event) => setEditing({ ...editing, groups: event.target.value })}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm text-slate-300 md:col-span-2">
              <input
                type="checkbox"
                checked={!editing.optOut}
                onChange={(event) => setEditing({ ...editing, optOut: !event.target.checked })}
                className="h-4 w-4"
              />
              Receives offers
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save contact"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, country…"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
          />
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
          >
            <option value="all">All groups</option>
            {(facets?.groups ?? []).map((group) => (
              <option key={group.value} value={group.value}>
                {group.value} ({group.count})
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "subscribed" | "unsubscribed")
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200"
          >
            <option value="all">Everyone</option>
            <option value="subscribed">Receives offers</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {loading ? "Loading…" : `${visible.length} of ${contacts.length} shown`}
        </p>

        <div className="mt-4 divide-y divide-white/[.06] rounded-xl border border-white/[.06]">
          {!loading && !visible.length && (
            <p className="p-6 text-sm text-slate-500">
              {contacts.length
                ? "No contacts match those filters."
                : "No contacts yet. Add one, or import a CSV."}
            </p>
          )}
          {visible.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">
                  {contact.name || contact.email}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {contact.email}
                  {contact.phone ? ` · ${contact.phone}` : ""}
                  {contact.country ? ` · ${contact.country}` : ""}
                  {contact.region ? `, ${contact.region}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contact.optOut && (
                    <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] font-bold text-red-300">
                      unsubscribed
                    </span>
                  )}
                  {parseGroups(contact.groups).map((group) => (
                    <span
                      key={group}
                      className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => start(contact)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-cyan-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => void remove(contact)}
                  className="rounded border border-red-500/30 px-3 py-1.5 text-sm text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onDone={(text) => {
            setShowImport(false);
            setNotice({ type: "ok", text });
            void load();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#0d1921] p-4">
      <p className="text-2xl font-black text-cyan-300">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-semibold text-slate-300">
      {label}
      {required && <span className="text-cyan-400"> *</span>}
      {children}
    </label>
  );
}

function ImportDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extraGroup, setExtraGroup] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    const { headers, rows } = parseCsv(text);
    const plan = planImport(rows, headers, extraGroup);
    return { headers, rows, plan };
  }, [text, extraGroup]);

  async function choose(file?: File) {
    if (!file) return;
    setError("");
    if (/\.xlsx?$/i.test(file.name) && !/\.csv$/i.test(file.name)) {
      setError(
        'That looks like an Excel file. Open it in Excel and use "Save As → CSV UTF-8", then upload that.',
      );
      return;
    }
    setFileName(file.name);
    setText(await file.text());
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/marketing/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv: text, consent, extraGroup }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      const parts = [`${data.added} added`, `${data.updated} updated`];
      if (data.duplicatesInFile) parts.push(`${data.duplicatesInFile} duplicate rows skipped`);
      if (data.invalidCount) parts.push(`${data.invalidCount} invalid skipped`);
      if (data.alreadyUnsubscribed)
        parts.push(`${data.alreadyUnsubscribed} stayed unsubscribed`);
      onDone(`Import complete — ${parts.join(", ")}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="mt-10 w-full max-w-2xl rounded-2xl border border-white/[.08] bg-[#0d1921] p-6">
        <h2 className="text-lg font-bold text-white">Import contacts from CSV</h2>
        <p className="mt-2 text-xs text-slate-400">
          Columns are matched loosely — email, name, phone, country, region/city and
          groups are all recognised under common spellings. Up to{" "}
          {MAX_IMPORT_ROWS.toLocaleString()} rows at a time.{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/marketing/export?sample=1" className="text-cyan-300 underline">
            Download a sample file
          </a>
          .
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void choose(event.target.files?.[0])}
          className="mt-4 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
        />

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[.06] p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {preview && (
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">{fileName}</p>
            <p className="mt-1">
              {preview.rows.length} rows · {preview.plan.candidates.length} valid emails ·{" "}
              {preview.plan.invalid.length} invalid · {preview.plan.duplicatesInFile} duplicates
            </p>
            <p className="mt-1 text-slate-500">Columns: {preview.headers.join(", ")}</p>
            <div className="mt-3 space-y-1">
              {preview.plan.candidates.slice(0, 5).map((candidate) => (
                <p key={candidate.email} className="truncate text-slate-400">
                  {candidate.name || "—"} · {candidate.email}
                  {candidate.country ? ` · ${candidate.country}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 block text-xs font-semibold text-slate-300">
          Also add everyone to group (optional)
          <input
            value={extraGroup}
            onChange={(event) => setExtraGroup(event.target.value)}
            placeholder="Expo 2026"
            className={inputClass}
          />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/[.06] p-3 text-xs text-amber-100">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          These people agreed to receive offers from Byteflow Information Technology.
        </label>

        <div className="mt-5 flex gap-3">
          <button
            disabled={!consent || !preview?.plan.candidates.length || busy}
            onClick={() => void submit()}
            className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
          >
            {busy ? "Importing…" : `Import ${preview?.plan.candidates.length ?? 0} contacts`}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
