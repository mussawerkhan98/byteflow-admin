"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, type ReactNode } from "react";
import { siteUrl } from "../../lib/admin-guide";
import {
  automaticReadTime,
  effectiveSeoDescription,
  effectiveSeoTitle,
  fromDateInput,
  postChecklist,
  slugFromTitle,
  toDateInput,
} from "../../lib/post-checklist";
import RichTextEditor from "./RichTextEditor";

type RecordValue = Record<string, unknown>;

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-white outline-none transition focus:border-cyan-400";
const isOn = (value: unknown) => value === true || value === 1 || value === "1";
/**
 * Uploaded images are stored as site paths like "/api/media/51". The website
 * serves those; the admin's own server does not (its proxy sends anything
 * outside /admin back to the dashboard), so previews load from the website.
 */
const previewSrc = (src: string) => (src.startsWith("/") ? siteUrl(src) : src);

function Card({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#0d1921] p-5 shadow-xl sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-bold text-slate-950">
          {step}
        </span>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  counter,
  children,
}: {
  label: string;
  help?: ReactNode;
  counter?: { value: number; min?: number; max: number };
  children: ReactNode;
}) {
  const bad =
    counter &&
    counter.value > 0 &&
    (counter.value > counter.max || (counter.min !== undefined && counter.value < counter.min));
  return (
    <label className="block text-sm font-semibold text-slate-200">
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        {counter && (
          <span className={`text-xs font-normal ${bad ? "text-amber-300" : "text-slate-500"}`}>
            {counter.value} / {counter.min !== undefined ? `${counter.min}–` : ""}
            {counter.max}
          </span>
        )}
      </span>
      {children}
      {help && <span className="mt-1.5 block text-xs font-normal text-slate-500">{help}</span>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-200">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-cyan-400"
      />
    </label>
  );
}

/**
 * The blog post editor.
 *
 * Laid out as numbered steps with a live checklist so the person writing a
 * post can see, before saving, everything the public post page will use:
 * the summary under the title, the cover and its description, the sections
 * that become "On this page", the FAQ block, the author and dates, and what
 * Google and social networks will show.
 */
export default function PostEditor({
  form,
  editing,
  change,
  onSubmit,
  onCancel,
  saving,
  uploading,
  onUpload,
  categories,
  notice,
}: {
  form: RecordValue;
  editing: RecordValue;
  change: (name: string, value: unknown) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  uploading: boolean;
  onUpload: (file?: File) => void;
  categories: string[];
  notice: ReactNode;
}) {
  const isUpdate = Number(editing.id) > 0;
  const wasLive = isUpdate && isOn(editing.published);
  // A new post's address follows its title until someone types one in.
  const [slugEdited, setSlugEdited] = useState(isUpdate);
  const checklist = useMemo(() => postChecklist(form), [form]);
  const { stats } = checklist;
  const slug = String(form.slug ?? "");
  const seoTitle = effectiveSeoTitle(form);
  const seoDescription = effectiveSeoDescription(form);
  const published = isOn(form.published);
  const updatedAt = String(editing.updated_at ?? "").trim();
  const value = (name: string) => String(form[name] ?? "");

  return (
    <form onSubmit={onSubmit} className="mt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
        >
          <span aria-hidden="true">←</span> Back to blog posts
        </button>
        {isUpdate && slug && (
          <a
            href={siteUrl(`/${slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            View live page <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
        {isUpdate ? "Edit blog post" : "New blog post"}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{value("title") || "Untitled post"}</p>
      {notice}

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-6">
          {/* 1 ── Basics */}
          <Card step={1} title="Basics" description="The title, its page address and the summary shown under it.">
            <Field label="Post title *" help="Shown as the page's main heading (H1) and on blog cards.">
              <input
                required
                value={value("title")}
                onChange={(event) => {
                  change("title", event.target.value);
                  if (!slugEdited) change("slug", slugFromTitle(event.target.value));
                }}
                className={inputClass}
              />
            </Field>
            <Field
              label="Page address *"
              help={
                wasLive
                  ? "This post is live. Changing the address breaks links people and Google already have."
                  : "Filled in automatically from the title. Lowercase letters, numbers and hyphens."
              }
            >
              <span className="mt-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-cyan-400">
                <span className="hidden shrink-0 items-center border-r border-slate-700 bg-slate-900 px-3 text-sm font-normal text-slate-500 sm:flex">
                  byteflow.ae/
                </span>
                <input
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    change("slug", event.target.value.toLowerCase());
                  }}
                  className="w-full bg-transparent px-3 py-2.5 text-sm font-normal text-white outline-none"
                />
              </span>
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Category" help="Groups the post on the Blog page; related posts prefer the same category.">
                <input
                  list="post-categories"
                  value={value("category")}
                  onChange={(event) => change("category", event.target.value)}
                  className={inputClass}
                />
                <datalist id="post-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>
            </div>
            <Field
              label="Summary"
              counter={{ value: value("excerpt").length, min: 70, max: 250 }}
              help="Shown under the title and on blog cards. Left empty, the opening of the article is used."
            >
              <textarea
                rows={3}
                value={value("excerpt")}
                onChange={(event) => change("excerpt", event.target.value)}
                className={inputClass}
              />
            </Field>
          </Card>

          {/* 2 ── Cover */}
          <Card step={2} title="Cover image" description="The large picture under the title. Also used when the post is shared.">
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(event) => onUpload(event.target.files?.[0])}
                className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
              />
              {uploading && <span className="mt-2 block text-xs text-cyan-300">Uploading image…</span>}
              <span className="mt-2 block text-xs text-slate-500">
                A wide image (16:9, at least 1200px) works best. Large photos are resized automatically.
              </span>
              {value("image_url") && (
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <img
                    src={previewSrc(value("image_url"))}
                    alt=""
                    className="aspect-video w-64 rounded-lg border border-slate-700 bg-slate-900 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => change("image_url", "")}
                    className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <Field
              label="Describe the image (alt text)"
              counter={{ value: value("image_alt").length, max: 125 }}
              help="What the picture shows, for screen readers and Google Images. Left empty, the post title is used."
            >
              <input
                value={value("image_alt")}
                onChange={(event) => change("image_alt", event.target.value)}
                placeholder="e.g. IT engineer installing a network rack in a Dubai office"
                className={inputClass}
              />
            </Field>
          </Card>

          {/* 3 ── Content */}
          <Card step={3} title="Article" description="The body of the post. Its headings build the page around it.">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Words", value: stats.words, ok: stats.words >= 600 },
                { label: "Sections (H2)", value: stats.sections, ok: stats.sections >= 3 },
                { label: "FAQ questions", value: stats.faqQuestions, ok: stats.faqQuestions >= 3 },
                { label: "Read time", value: automaticReadTime(stats.words).replace(" read", ""), ok: true },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-xl font-bold ${stat.ok ? "text-white" : "text-amber-300"}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            {stats.h1InContent > 0 && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs text-amber-200">
                The content has {stats.h1InContent} H1 heading{stats.h1InContent === 1 ? "" : "s"}. The title is
                already the page’s H1, so the website shows these as H2. Switch them to H2 to keep the editor and
                the page the same.
              </p>
            )}
            <RichTextEditor required value={value("content")} onChange={(next) => change("content", next)} />
            <ul className="grid gap-1.5 text-xs text-slate-500">
              <li>
                <span className="font-semibold text-slate-300">H2</span> = a main section. Each one appears in the
                “On this page” list beside the article.
              </li>
              <li>
                <span className="font-semibold text-slate-300">H3</span> = a point inside a section.
              </li>
              <li>
                <span className="font-semibold text-slate-300">FAQs:</span> add an H2 “Frequently asked questions”
                with each question as an H3 and its answer below. They show as an FAQ block at the end of the page
                and as FAQ results in Google.
              </li>
              <li>
                <span className="font-semibold text-slate-300">Quote</span> = a highlighted tip box.
              </li>
            </ul>
          </Card>

          {/* 4 ── Author & dates */}
          <Card step={4} title="Author & dates" description="Shown under the title as “Written by … · Published … · Updated …”.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Written by" help="Left empty: “Byteflow team”. Use a person’s name if one person wrote it.">
                <input
                  value={value("author_name")}
                  onChange={(event) => change("author_name", event.target.value)}
                  placeholder="Byteflow team"
                  className={inputClass}
                />
              </Field>
              <Field label="Published on" help="Shown on the post and sent to Google as the publish date.">
                <input
                  type="date"
                  value={toDateInput(form.date)}
                  onChange={(event) => change("date", fromDateInput(event.target.value))}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </Field>
              <Field
                label="Read time"
                help={`Left empty, it is worked out from the words: ${automaticReadTime(stats.words)}.`}
              >
                <input
                  value={value("read_time")}
                  onChange={(event) => change("read_time", event.target.value)}
                  placeholder={automaticReadTime(stats.words)}
                  className={inputClass}
                />
              </Field>
              <div className="text-sm font-semibold text-slate-200">
                Last updated
                <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm font-normal text-slate-400">
                  {updatedAt ? `${updatedAt.replace("T", " ").slice(0, 16)} (UTC)` : "Not saved yet"}
                </p>
                <span className="mt-1.5 block text-xs font-normal text-slate-500">
                  Set automatically every time you save.
                </span>
              </div>
            </div>
          </Card>

          {/* 5 ── SEO */}
          <Card step={5} title="Google & sharing" description="What search results and shared links show for this post.">
            <Field
              label="SEO title"
              counter={{ value: seoTitle.length, max: 60 }}
              help={value("meta_title") ? undefined : `Left empty: “${seoTitle || "Post title | Byteflow Blog"}”.`}
            >
              <input
                value={value("meta_title")}
                onChange={(event) => change("meta_title", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="SEO description"
              counter={{ value: seoDescription.length, min: 120, max: 160 }}
              help={value("meta_description") ? undefined : "Left empty, the summary is used."}
            >
              <textarea
                rows={3}
                value={value("meta_description")}
                onChange={(event) => change("meta_description", event.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-white p-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Google preview</p>
                <p className="mt-2 truncate text-xs text-slate-600">byteflow.ae › {slug || "page-address"}</p>
                <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{seoTitle || "Post title"}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-700">{seoDescription || "Description"}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Shared link preview
                </p>
                <div className="m-4 overflow-hidden rounded-lg border border-slate-800">
                  {value("image_url") ? (
                    <img src={previewSrc(value("image_url"))} alt="" className="aspect-[1.91/1] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[1.91/1] items-center justify-center bg-slate-900 text-xs text-slate-500">
                      No cover image: the Byteflow logo is used
                    </div>
                  )}
                  <div className="bg-slate-900 p-3">
                    <p className="text-[11px] uppercase text-slate-500">byteflow.ae</p>
                    <p className="line-clamp-2 text-sm font-semibold text-white">{seoTitle || "Post title"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 6 ── Page options */}
          <Card step={6} title="Page options" description="Turn parts of the post page on or off for this post.">
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                checked={isOn(form.show_toc)}
                onChange={(next) => change("show_toc", next)}
                title="“On this page” contents"
                description="Section links beside the article (a drop-down on phones)."
              />
              <Toggle
                checked={isOn(form.show_share)}
                onChange={(next) => change("show_share", next)}
                title="Share buttons"
                description="WhatsApp, LinkedIn, X, Facebook, email and copy link."
              />
              <Toggle
                checked={isOn(form.show_related)}
                onChange={(next) => change("show_related", next)}
                title="Related articles"
                description="Three other posts at the end, same category first."
              />
              <Toggle
                checked={published}
                onChange={(next) => change("published", next)}
                title="Published"
                description="Off keeps it as a draft: hidden from the website and the sitemap."
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="grid gap-5 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/[.08] bg-[#0d1921] p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold text-white">Post checklist</h3>
              <span className="text-sm font-bold text-cyan-300">{checklist.percent}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 transition-all"
                style={{ width: `${checklist.percent}%` }}
              />
            </div>
            <ul className="mt-4 grid gap-2.5">
              {checklist.items.map((item) => (
                <li key={item.key} className="flex gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      item.done ? "border-emerald-400 bg-emerald-400/15 text-emerald-300" : "border-slate-600"
                    }`}
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span>
                    <span className={item.done ? "text-slate-200" : "text-slate-400"}>{item.label}</span>
                    <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                    {!item.done && <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#0b2a3c] to-[#0a1a2b] p-5 ring-1 ring-cyan-400/15">
            <h3 className="text-base font-bold text-white">Quick tips</h3>
            <ul className="mt-3 grid list-disc gap-2 pl-4 text-sm leading-relaxed text-slate-300">
              <li>Answer the main question in the first paragraph. Visitors and AI search read that first.</li>
              <li>Mention Dubai and the UAE naturally where they fit.</li>
              <li>Link to one or two of our service pages inside the article.</li>
              <li>Questions without answers are left out of the FAQ block automatically.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.08] bg-[#071118]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-sm text-slate-400">
          {checklist.done} of {checklist.items.length} checklist items done
          <span className="mx-2 text-slate-600">·</span>
          <span className={published ? "text-emerald-300" : "text-amber-300"}>
            {published ? "Published" : "Draft"}
          </span>
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            disabled={saving || uploading}
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
