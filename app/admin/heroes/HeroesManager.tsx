"use client";

import ImageUpload from "../ImageUpload";

import { useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import HeroExtras from "../HeroExtras";
import { heroExtraNames } from "../../lib/hero-fields";

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
        [...heroFields, ...heroExtraNames].map((field) => [field, String(page?.[field] ?? "")]),
      ),
    );
    setNotice("");
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
      <AdminPageHeader sectionKey="heroes" title="Page top banners" />
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
            <div className="md:col-span-2">
              <ImageUpload
                label="Background image"
                value={form.hero_background_image ?? ""}
                onChange={(url) => change("hero_background_image", url)}
                allowDecorative
                help="Shown darkened behind the whole banner, so it is usually decorative. For a clear picture beside the text on the home page, use “Picture on the right” in Home page extras below."
              />
            </div>
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
            {pages.find((item) => item.id === Number(selectedId))?.slug === "home" && (
              <HeroExtras values={form} onChange={change} />
            )}
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
