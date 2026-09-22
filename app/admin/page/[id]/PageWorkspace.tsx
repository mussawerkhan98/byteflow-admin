"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import ResourceManager from "../../[resource]/ResourceManager";
import { resources } from "../../../lib/cms-config";
import { siteUrl } from "../../../lib/admin-guide";

type PageRecord = Record<string, unknown> & {
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

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";
const cardClass =
  "mt-6 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6";

/**
 * A page's content used to be split across five separate screens (top
 * banner, SEO settings, FAQs, extra blocks, call-to-action) each mixing
 * every page's records together. This workspace is the "one page, one
 * place" view: everything that belongs to a single page, in one screen.
 */
export default function PageWorkspace({ pageId }: { pageId: number }) {
  const [pageRecord, setPageRecord] = useState<PageRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [basicsForm, setBasicsForm] = useState<Record<string, string>>({});
  const [heroForm, setHeroForm] = useState<Record<string, string>>({});
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [notice, setNotice] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const basicsFields = resources.pages.fields.filter(
    (field) => !heroFields.includes(field.name as (typeof heroFields)[number]),
  );

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/pages");
    const data = await response.json();
    const record = (data.records ?? []).find(
      (row: PageRecord) => Number(row.id) === pageId,
    );
    if (!record) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPageRecord(record);
    setBasicsForm(
      Object.fromEntries(
        basicsFields.map((field) => [field.name, String(record[field.name] ?? "")]),
      ),
    );
    setHeroForm(
      Object.fromEntries(
        heroFields.map((field) => [field, String(record[field] ?? "")]),
      ),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [pageId]);

  async function saveBasics(event: React.FormEvent) {
    event.preventDefault();
    if (!pageRecord) return;
    setSavingBasics(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        // The generic update writes every field this resource defines, so
        // merge onto the full current record (which already has the hero_*
        // columns) rather than sending only what this form shows — otherwise
        // saving here would blank out the page's banner.
        body: JSON.stringify({ ...pageRecord, ...basicsForm, id: pageId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Please check the form and try again." });
        return;
      }
      setPageRecord((current) => (current ? { ...current, ...basicsForm } : current));
      setNotice({ type: "ok", text: "Page details saved successfully." });
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSavingBasics(false);
    }
  }

  async function saveHero(event: React.FormEvent) {
    event.preventDefault();
    setSavingHero(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/heroes", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: pageId, ...heroForm }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Please check the form and try again." });
        return;
      }
      setPageRecord((current) => (current ? { ...current, ...heroForm } : current));
      setNotice({ type: "ok", text: "Top banner saved successfully." });
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSavingHero(false);
    }
  }

  async function uploadImage(
    kind: "hero_background_image" | "og_image",
    file?: File,
  ) {
    if (!file) return;
    const setUploading = kind === "hero_background_image" ? setUploadingHero : setUploadingOg;
    setUploading(true);
    setNotice(null);
    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set(
        "altText",
        String(heroForm.hero_heading || basicsForm.meta_title || pageRecord?.name || "Page image"),
      );
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Unable to upload file" });
        return;
      }
      if (kind === "hero_background_image") {
        setHeroForm((current) => ({ ...current, hero_background_image: data.url }));
      } else {
        setBasicsForm((current) => ({ ...current, og_image: data.url }));
      }
      setNotice({ type: "ok", text: "Image uploaded. Save to publish it." });
    } catch {
      setNotice({ type: "error", text: "The image could not be uploaded. Please try again." });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-center text-slate-400">Loading…</p>;
  }
  if (notFound || !pageRecord) {
    return (
      <div className="pb-10">
        <p className="text-lg font-semibold text-white">Page not found.</p>
        <p className="mt-2 text-sm text-slate-500">
          It may have been removed. Head back to the pages list to pick another one.
        </p>
        <Link
          href="/admin/pages"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-2 text-xs font-bold text-cyan-300"
        >
          ← All pages
        </Link>
      </div>
    );
  }

  const slug = String(pageRecord.slug ?? "");

  return (
    <div className="pb-10">
      <Link
        href="/admin/pages"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-300"
      >
        ← All pages
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {String(pageRecord.name)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            /{slug === "home" ? "" : slug}
            {pageRecord.status ? ` · ${String(pageRecord.status)}` : ""}
          </p>
        </div>
        <a
          href={siteUrl(slug === "home" ? "/" : `/${slug}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/10"
        >
          View on website
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      {notice && (
        <p
          role="status"
          className={`mt-5 rounded-lg p-3 text-sm ${notice.type === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
        >
          {notice.text}
        </p>
      )}

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-white">Top banner</h2>
        <p className="mt-1 text-xs text-slate-500">
          The big banner at the top of this page — headline, text, buttons and
          background image.
        </p>
        <form onSubmit={saveHero} className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-300">
            Eyebrow / label
            <input
              value={heroForm.hero_label ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_label: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Heading
            <input
              value={heroForm.hero_heading ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_heading: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300 md:col-span-2">
            Description
            <textarea
              rows={4}
              value={heroForm.hero_description ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_description: event.target.value }))
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
                disabled={uploadingHero}
                onChange={(event) =>
                  void uploadImage("hero_background_image", event.target.files?.[0])
                }
                className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
              />
              {uploadingHero && (
                <span className="mt-2 block text-xs text-cyan-300">Uploading…</span>
              )}
              {heroForm.hero_background_image && (
                <div className="mt-4 flex items-end gap-4">
                  <img
                    src={heroForm.hero_background_image}
                    alt="Hero preview"
                    className="h-28 w-40 rounded-lg border border-slate-700 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setHeroForm((current) => ({ ...current, hero_background_image: "" }))
                    }
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Primary button label
            <input
              value={heroForm.hero_primary_label ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_primary_label: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Primary button link
            <input
              value={heroForm.hero_primary_link ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_primary_link: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Secondary button label
            <input
              value={heroForm.hero_secondary_label ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_secondary_label: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Secondary button link
            <input
              value={heroForm.hero_secondary_link ?? ""}
              onChange={(event) =>
                setHeroForm((current) => ({ ...current, hero_secondary_link: event.target.value }))
              }
              className={inputClass}
            />
          </label>
          <div className="md:col-span-2">
            <button
              disabled={savingHero}
              className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {savingHero ? "Saving…" : "Save top banner"}
            </button>
          </div>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-white">Page details &amp; SEO</h2>
        <p className="mt-1 text-xs text-slate-500">
          The page name and URL, and the Google search title/description used
          when this page is shared or indexed.
        </p>
        <form onSubmit={saveBasics} className="mt-6 grid gap-5 md:grid-cols-2">
          {basicsFields.map((field) => (
            <label
              key={field.name}
              className={`${field.type === "textarea" ? "md:col-span-2" : ""} text-xs font-semibold text-slate-300`}
            >
              {field.label}
              {field.name === "og_image" ? (
                <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingOg}
                    onChange={(event) => void uploadImage("og_image", event.target.files?.[0])}
                    className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                  />
                  {uploadingOg && (
                    <span className="mt-2 block text-xs text-cyan-300">Uploading…</span>
                  )}
                  {basicsForm.og_image && (
                    <img
                      src={basicsForm.og_image}
                      alt="Open Graph preview"
                      className="mt-4 h-24 w-40 rounded-lg border border-slate-700 object-cover"
                    />
                  )}
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={basicsForm[field.name] ?? ""}
                  onChange={(event) =>
                    setBasicsForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={inputClass}
                />
              ) : field.type === "boolean" ? (
                <span className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={basicsForm[field.name] === "1" || basicsForm[field.name] === "true"}
                    onChange={(event) =>
                      setBasicsForm((current) => ({
                        ...current,
                        [field.name]: event.target.checked ? "1" : "0",
                      }))
                    }
                    className="h-4 w-4 accent-cyan-400"
                  />{" "}
                  Allow indexing
                </span>
              ) : field.type === "select" ? (
                <select
                  value={basicsForm[field.name] ?? ""}
                  onChange={(event) =>
                    setBasicsForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={inputClass}
                >
                  {field.options?.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === "url" ? "url" : "text"}
                  value={basicsForm[field.name] ?? ""}
                  onChange={(event) =>
                    setBasicsForm((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={inputClass}
                />
              )}
            </label>
          ))}
          <div className="md:col-span-2">
            <button
              disabled={savingBasics}
              className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {savingBasics ? "Saving…" : "Save page details"}
            </button>
          </div>
        </form>
      </section>

      <section className={cardClass}>
        <ResourceManager
          resourceKey="faqs"
          config={resources.faqs}
          lockedPageId={pageId}
          hideHeader
        />
      </section>

      <section className={cardClass}>
        <ResourceManager
          resourceKey="sections"
          config={resources.sections}
          lockedPageId={pageId}
          hideHeader
        />
      </section>

      <section className={cardClass}>
        <ResourceManager
          resourceKey="ctas"
          config={resources.ctas}
          lockedPageId={pageId}
          hideHeader
        />
      </section>
    </div>
  );
}
