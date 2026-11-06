"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { homeBlocks, type HomeField, type HomeList } from "../../lib/home-sections";
import ImageUpload from "../ImageUpload";
import { siteUrl } from "../../lib/admin-guide";

type Item = Record<string, string>;
type FormValues = Record<string, string | Item[]>;
type Notice = { type: "ok" | "error"; text: string } | null;
/** The published services a "service" field can link to. */
type ServiceOption = { slug: string; title: string };
/** The published blog posts a "post" or "category" field picks from, newest first. */
type PostOption = { slug: string; title: string; category: string };

/** Each category the posts use, once, as first written. */
const postCategories = (posts: PostOption[]) => {
  const seen = new Map<string, string>();
  for (const post of posts) {
    const key = post.category.trim().replace(/\s+/g, " ").toLowerCase();
    if (key && !seen.has(key)) seen.set(key, post.category.trim().replace(/\s+/g, " "));
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
};
const sameText = (a: string, b: string) => a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";
const labelClass = "text-xs font-semibold text-slate-300";

async function fetchBlock(key: string) {
  const response = await fetch(`/api/admin/home-sections?block=${key}`);
  const data = await response.json();
  return { ok: response.ok, data };
}

function FieldInput({
  field,
  value,
  onChange,
  services,
  tabs,
  posts,
}: {
  field: HomeField;
  value: string;
  onChange: (value: string) => void;
  services: ServiceOption[];
  tabs: string[];
  posts: PostOption[];
}) {
  if (field.type === "post")
    return (
      <select value={value || "latest"} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="latest">Latest: always the newest published post</option>
        {/* A post unpublished since: kept, but the website features the latest. */}
        {value && value !== "latest" && !posts.some((post) => post.slug === value) && (
          <option value={value}>{value} (not published: the latest shows)</option>
        )}
        {posts.map((post) => (
          <option key={post.slug} value={post.slug}>
            {post.title}
          </option>
        ))}
      </select>
    );
  if (field.type === "category") {
    const categories = postCategories(posts);
    return (
      <select value={categories.find((category) => sameText(category, value)) ?? value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Choose a category</option>
        {value && !categories.some((category) => sameText(category, value)) && <option value={value}>{value} (no published posts: hidden)</option>}
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "tab")
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Choose a tab</option>
        {/* A tab removed since: kept, but the logo shows nowhere until it gets a tab. */}
        {value && !tabs.includes(value) && <option value={value}>{value} (no such tab: not shown)</option>}
        {tabs.map((tab) => (
          <option key={tab} value={tab}>
            {tab}
          </option>
        ))}
      </select>
    );
  if (field.type === "service")
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">No link</option>
        {/* A service unpublished since: kept, but the website shows no link. */}
        {value && !services.some((service) => service.slug === value) && <option value={value}>{value} (not published: no link)</option>}
        {services.map((service) => (
          <option key={service.slug} value={service.slug}>
            {service.title}
          </option>
        ))}
      </select>
    );
  if (field.type === "select")
    return (
      <select value={value || field.options?.[0]?.value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  if (field.type === "textarea")
    return (
      <textarea rows={field.name === "points" ? 4 : 3} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    );
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.type === "link" ? "/contact-us or https://…" : undefined}
      className={inputClass}
    />
  );
}

function ListEditor({
  list,
  items,
  onChange,
  services,
  tabs,
  posts,
}: {
  list: HomeList;
  items: Item[];
  onChange: (items: Item[]) => void;
  services: ServiceOption[];
  tabs: string[];
  posts: PostOption[];
}) {
  const titleField = list.fields.find((field) => field.name === "title");
  const hasImage = list.fields.some((field) => field.type === "image");
  const update = (index: number, name: string, value: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [name]: value } : item)));
  const move = (index: number, by: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };
  // A choice starts on its first option (e.g. "Show"), everything else empty.
  const blank = Object.fromEntries(list.fields.map((field) => [field.name, field.options?.[0]?.value ?? ""]));

  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-bold text-white">{list.label}</legend>
      {list.help && <p className="mt-1 text-xs text-slate-500">{list.help}</p>}
      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-white/[.08] bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {list.itemLabel} {index + 1}
              </p>
              <div className="flex gap-2 text-xs">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 disabled:opacity-30">
                  ↑ Up
                </button>
                <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 disabled:opacity-30">
                  ↓ Down
                </button>
                <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-red-300">
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {list.fields.map((field) =>
                field.type === "image" ? (
                  <div key={field.name} className="md:col-span-2">
                    <ImageUpload
                      label={field.label}
                      kind={field.upload === "logo" ? "logo" : "image"}
                      value={item[field.name] ?? ""}
                      onChange={(url) => update(index, field.name, url)}
                      alt={item.title ?? ""}
                      onAltChange={(alt) => update(index, "title", alt)}
                      altLabel={titleField?.label}
                      help={field.help}
                    />
                  </div>
                ) : hasImage && field.name === "title" ? null : (
                  <label key={field.name} className={`${labelClass} ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                    {field.label}
                    {field.help && <span className="mt-1 block font-normal text-slate-500">{field.help}</span>}
                    <FieldInput field={field} value={item[field.name] ?? ""} onChange={(value) => update(index, field.name, value)} services={services} tabs={tabs} posts={posts} />
                  </label>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      {items.length < list.max && (
        <button
          type="button"
          onClick={() => onChange([...items, blank])}
          className="mt-4 rounded-lg border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-300"
        >
          + Add {list.itemLabel.toLowerCase()}
        </button>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Up to {list.max}. A {list.itemLabel.toLowerCase()} with no title is left out;{" "}
        {list.startsEmpty ? "with none, this part of the website is hidden." : "if none are left, the website shows its own list."}
      </p>
    </fieldset>
  );
}

export default function HomeSectionsManager() {
  const [active, setActive] = useState(homeBlocks[0].key);
  const [form, setForm] = useState<FormValues>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const clearedTab = useRef<{ index: number; name: string } | null>(null);
  const def = homeBlocks.find((block) => block.key === active)!;
  const needsServices = def.lists.some((list) => list.fields.some((field) => field.type === "service"));
  const [posts, setPosts] = useState<PostOption[]>([]);
  const postsLoaded = useRef(false);
  const needsPosts = [...def.fields, ...def.lists.flatMap((list) => list.fields)].some((field) => field.type === "post" || field.type === "category");

  // Loaded once, the first time a section with a service picker is opened.
  useEffect(() => {
    if (!needsServices || services.length) return;
    void fetch("/api/admin/services")
      .then((response) => response.json())
      .then((data: { records?: Record<string, unknown>[] }) =>
        setServices(
          (data.records ?? [])
            .filter((row) => row.status === "published")
            .map((row) => ({ slug: String(row.slug), title: String(row.title) })),
        ),
      )
      .catch(() => setNotice({ type: "error", text: "The services list could not be loaded. Check your connection." }));
  }, [needsServices, services.length]);

  // Loaded once, the first time a section that picks a post or category is opened.
  useEffect(() => {
    if (!needsPosts || postsLoaded.current) return;
    postsLoaded.current = true;
    void fetch("/api/admin/posts")
      .then((response) => response.json())
      .then((data: { records?: Record<string, unknown>[] }) =>
        setPosts(
          (data.records ?? [])
            .filter((row) => Number(row.published) === 1 || row.published === true)
            .map((row) => ({ slug: String(row.slug), title: String(row.title), category: String(row.category ?? "") })),
        ),
      )
      .catch(() => {
        postsLoaded.current = false;
        setNotice({ type: "error", text: "The blog posts could not be loaded. Check your connection." });
      });
  }, [needsPosts]);

  const apply = useCallback(
    ({ ok, data }: { ok: boolean; data: { error?: string; saved?: boolean; content?: FormValues } }) => {
      if (!ok) {
        setNotice({ type: "error", text: data.error ?? "This section could not be loaded." });
        return;
      }
      setSaved(Boolean(data.saved));
      setForm(data.content ?? {});
    },
    [],
  );

  // First tab on arrival. Switching tabs loads from the click handler below.
  useEffect(() => {
    void fetchBlock(homeBlocks[0].key)
      .then(apply)
      .catch(() => setNotice({ type: "error", text: "This section could not be loaded. Check your connection." }))
      .finally(() => setLoading(false));
  }, [apply]);

  function open(key: string) {
    if (key === active) return;
    setActive(key);
    setLoading(true);
    setNotice(null);
    void fetchBlock(key)
      .then(apply)
      .catch(() => setNotice({ type: "error", text: "This section could not be loaded. Check your connection." }))
      .finally(() => setLoading(false));
  }

  const change = (name: string, value: string | Item[]) => setForm((current) => ({ ...current, [name]: value }));

  // The tab names a "tab" field can pick from (Technologies → Logos).
  const tabItems = Array.isArray(form.tabs) ? form.tabs : [];
  const tabNames = [...new Set(tabItems.map((tab) => tab.title?.trim()).filter(Boolean))];

  /**
   * Tabs edited; a renamed tab takes its logos with it. A name cleared before
   * the new one is typed is remembered, so the logos follow once it is.
   */
  function changeTabs(items: Item[]) {
    const before = tabItems;
    // Only a rename in place: same tab count, one row with a new title.
    const changed = before.length === items.length ? items.flatMap((item, i) => (before[i].title !== item.title ? [i] : [])) : [];
    let move: [string, string] | null = null;
    if (changed.length === 1) {
      const i = changed[0];
      const from = before[i].title?.trim() || (clearedTab.current?.index === i ? clearedTab.current.name : "");
      const to = items[i].title?.trim() ?? "";
      if (!to) clearedTab.current = from ? { index: i, name: from } : null;
      else {
        clearedTab.current = null;
        if (from && from !== to) move = [from, to];
      }
    } else clearedTab.current = null;
    setForm((current) => {
      const next: FormValues = { ...current, tabs: items };
      if (move && Array.isArray(current.logos)) {
        const [from, to] = move;
        next.logos = current.logos.map((logo) => (logo.tab?.trim() === from ? { ...logo, tab: to } : logo));
      }
      return next;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/home-sections?block=${active}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Please check the form and try again." });
        return;
      }
      setSaved(true);
      setNotice({ type: "ok", text: `${def.label} saved. It is live on the website now.` });
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!window.confirm(`Put “${def.label}” back to the website's original wording? Your saved changes for this section will be removed.`)) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/home-sections?block=${active}`, { method: "DELETE" });
      if (!response.ok) {
        setNotice({ type: "error", text: "Could not reset this section. Please try again." });
        return;
      }
      apply(await fetchBlock(active));
      setNotice({ type: "ok", text: `${def.label} is back to the website's original wording.` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="home-sections" />

      <div role="tablist" aria-label="Home page sections" className="mt-6 flex flex-wrap gap-2">
        {homeBlocks.map((block) => (
          <button
            key={block.key}
            type="button"
            role="tab"
            aria-selected={block.key === active}
            onClick={() => open(block.key)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${block.key === active ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-300 hover:border-cyan-400/50"}`}
          >
            {block.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-400">{def.shows}</p>
      <p className="mt-1 text-xs text-slate-500">
        {saved
          ? "You have saved changes for this section."
          : "Nothing saved yet — the form shows the website's current wording."}{" "}
        Blank fields fall back to the website&apos;s wording.
      </p>

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
        <form key={active} onSubmit={save} className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {def.fields.map((field) => {
              const hasAlt = def.fields.some((other) => other.name === "image_alt");
              if (field.type === "image")
                return (
                  <div key={field.name} className="md:col-span-2">
                    <ImageUpload
                      label={field.label}
                      kind={field.upload === "logo" ? "logo" : "image"}
                      value={String(form[field.name] ?? "")}
                      onChange={(url) => change(field.name, url)}
                      {...(hasAlt ? { alt: String(form.image_alt ?? ""), onAltChange: (alt: string) => change("image_alt", alt) } : {})}
                      help={field.help}
                    />
                  </div>
                );
              if (field.name === "image_alt" && hasAlt && def.fields.some((other) => other.type === "image")) return null;
              return (
                <label key={field.name} className={`${labelClass} ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                  {field.label}
                  {field.help && <span className="mt-1 block font-normal text-slate-500">{field.help}</span>}
                  <FieldInput field={field} value={String(form[field.name] ?? "")} onChange={(value) => change(field.name, value)} services={services} tabs={tabNames} posts={posts} />
                </label>
              );
            })}
            {def.lists.map((list) => (
              <ListEditor
                key={list.name}
                list={list}
                items={Array.isArray(form[list.name]) ? (form[list.name] as Item[]) : []}
                onChange={(items) => (list.name === "tabs" ? changeTabs(items) : change(list.name, items))}
                services={services}
                tabs={tabNames}
                posts={posts}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving…" : `Save ${def.label.toLowerCase()}`}
            </button>
            {saved && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void reset()}
                className="rounded-lg border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-300 disabled:opacity-50"
              >
                Reset to original wording
              </button>
            )}
            <a href={siteUrl("/")} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-cyan-300">
              View the home page ↗
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
