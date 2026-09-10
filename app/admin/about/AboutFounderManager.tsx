"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

export default function AboutFounderManager() {
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("altText", form.image_alt || "Byteflow founder");
      const response = await fetch("/api/admin/upload", { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Unable to upload image" });
        return;
      }
      change("image_url", String(data.url));
      setNotice({ type: "ok", text: "Photo uploaded. Save to publish it." });
    } catch {
      setNotice({ type: "error", text: "The photo could not be uploaded. Please try again." });
    } finally {
      setUploading(false);
    }
  }

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
          className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Photo
              <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(event) => void upload(event.target.files?.[0])}
                  className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                />
                {uploading && (
                  <span className="mt-2 block text-xs text-cyan-300">Uploading…</span>
                )}
                {form.image_url && (
                  <div className="mt-4 flex items-end gap-4">
                    <img
                      src={form.image_url}
                      alt="Founder preview"
                      className="h-40 w-32 rounded-xl border border-slate-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => change("image_url", "")}
                      className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Photo alt text
              <input
                value={form.image_alt ?? ""}
                onChange={(event) => change("image_alt", event.target.value)}
                placeholder="Byteflow founder"
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
