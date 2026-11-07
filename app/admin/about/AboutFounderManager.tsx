"use client";

import ImageUpload from "../ImageUpload";

import { useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

export default function AboutFounderManager() {
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    void fetch("/api/admin/about")
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setNotice({ type: "error", text: data.error });
          return;
        }
        setId(data.id ?? null);
        setForm(data.content ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  const change = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Please check the form and try again." });
        return;
      }
      setId(data.id ?? id);
      setNotice({ type: "ok", text: "Founder section saved successfully." });
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="about" />
      {notice && (
        <p
          role="status"
          className={`mt-5 rounded-lg p-3 text-sm ${notice.type === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
        >
          {notice.text}
        </p>
      )}
      {loading ? (
        <p className="mt-7 text-slate-400">Loading…</p>
      ) : (
        <form
          onSubmit={save}
          className="mt-7 rounded-2xl border border-white/[.08] bg-(--admin-panel) p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageUpload
                label="Photo"
                value={form.image_url ?? ""}
                onChange={(url) => change("image_url", url)}
                alt={form.image_alt ?? ""}
                onAltChange={(alt) => change("image_alt", alt)}
              />
            </div>
            <label className="text-xs font-semibold text-slate-300">
              Name (optional)
              <span className="mt-1 block font-normal text-slate-500">Shown with the quote on the home page. Blank shows the role and company only.</span>
              <input
                value={form.name ?? ""}
                onChange={(event) => change("name", event.target.value)}
                placeholder="Founder's full name"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Role
              <input
                value={form.role ?? ""}
                onChange={(event) => change("role", event.target.value)}
                placeholder="Founder & CEO"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Company
              <input
                value={form.company ?? ""}
                onChange={(event) => change("company", event.target.value)}
                placeholder="Byteflow Information Technology"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              LinkedIn URL
              <input
                value={form.linkedin_url ?? ""}
                onChange={(event) => change("linkedin_url", event.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Phone shown
              <input
                value={form.phone_label ?? ""}
                onChange={(event) => change("phone_label", event.target.value)}
                placeholder="+971 54 328 2042"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Phone link
              <input
                value={form.phone_url ?? ""}
                onChange={(event) => change("phone_url", event.target.value)}
                placeholder="tel:+971543282042"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Small heading
              <input
                value={form.eyebrow ?? ""}
                onChange={(event) => change("eyebrow", event.target.value)}
                placeholder="Meet the founder"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Main heading
              <input
                value={form.heading ?? ""}
                onChange={(event) => change("heading", event.target.value)}
                placeholder="Started with a laptop and a promise…"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Story (separate paragraphs with a blank line)
              <textarea
                rows={8}
                value={form.story ?? ""}
                onChange={(event) => change("story", event.target.value)}
                placeholder="Founder story"
                className={inputClass}
              />
            </label>
          </div>
          <button
            disabled={saving}
            className="mt-6 rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save founder section"}
          </button>
        </form>
      )}
    </div>
  );
}
