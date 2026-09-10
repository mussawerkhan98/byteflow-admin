"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

type PageHero = Record<string, string | number> & {
  id: number;
  name: string;
  slug: string;
};
const heroFields = [
  "hero_label",
  "hero_heading",
  "hero_description",
  "hero_background_image",
  "hero_primary_label",
  "hero_primary_link",
  "hero_secondary_label",
  "hero_secondary_link",
] as const;

export default function HeroesManager() {
  const [pages, setPages] = useState<PageHero[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/heroes")
      .then((response) => response.json())
      .then((data) => setPages(data.pages ?? []));
  }, []);

  function choose(id: string) {
    setSelectedId(id);
    const page = pages.find((item) => item.id === Number(id));
    setForm(
      Object.fromEntries(
        heroFields.map((field) => [field, String(page?.[field] ?? "")]),
      ),
    );
    setNotice("");
  }

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    const payload = new FormData();
    payload.set("file", file);
    payload.set("altText", String(form.hero_heading || "Page hero background"));
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: payload,
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) return setNotice(data.error);
    setForm((current) => ({ ...current, hero_background_image: data.url }));
    setNotice("Image uploaded. Save the hero to publish it.");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/heroes", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: Number(selectedId), ...form }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setNotice(data.error);
    setPages((current) =>
      current.map((page) =>
        page.id === Number(selectedId) ? { ...page, ...form } : page,
      ),
    );
    setNotice("Page hero saved successfully.");
  }

  const change = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="heroes" />
      {notice && (
        <p className="mt-5 rounded-lg border border-cyan-400/10 bg-cyan-400/[.05] p-3 text-sm text-cyan-200">
          {notice}
        </p>
      )}
      <section className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6">
        <label className="text-xs font-semibold text-slate-300">
          Display hero on page
          <select
            value={selectedId}
            onChange={(event) => choose(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name} ({page.slug === "home" ? "/" : `/${page.slug}`})
              </option>
            ))}
          </select>
        </label>
      </section>
      {selectedId && (
        <form
          onSubmit={save}
          className="mt-6 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-300">
              Eyebrow / label
              <input
                value={form.hero_label ?? ""}
                onChange={(event) => change("hero_label", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Heading
              <input
                required
                value={form.hero_heading ?? ""}
                onChange={(event) => change("hero_heading", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Description
              <textarea
                rows={4}
                value={form.hero_description ?? ""}
                onChange={(event) =>
                  change("hero_description", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 md:col-span-2">
              Background image
              <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(event) => void upload(event.target.files?.[0])}
                  className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                />
                {uploading && (
                  <span className="mt-2 block text-xs text-cyan-300">
                    Uploading…
                  </span>
                )}
                {form.hero_background_image && (
                  <div className="mt-4">
                    <img
                      src={form.hero_background_image}
                      alt="Hero preview"
                      className="h-44 w-full rounded-xl border border-slate-700 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => change("hero_background_image", "")}
                      className="mt-3 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Primary button label
              <input
                value={form.hero_primary_label ?? ""}
                onChange={(event) =>
                  change("hero_primary_label", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Primary button link
              <input
                value={form.hero_primary_link ?? ""}
                onChange={(event) =>
                  change("hero_primary_link", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Secondary button label
              <input
                value={form.hero_secondary_label ?? ""}
                onChange={(event) =>
                  change("hero_secondary_label", event.target.value)
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Secondary button link
              <input
                value={form.hero_secondary_link ?? ""}
                onChange={(event) =>
                  change("hero_secondary_link", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>
          <button
            disabled={saving}
            className="mt-6 rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save page hero"}
          </button>
        </form>
      )}
    </div>
  );
}
