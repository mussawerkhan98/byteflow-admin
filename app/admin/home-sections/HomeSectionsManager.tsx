"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { homeBlocks, type HomeField, type HomeList } from "../../lib/home-sections";
import { siteUrl } from "../../lib/admin-guide";

type Item = Record<string, string>;
type FormValues = Record<string, string | Item[]>;
type Notice = { type: "ok" | "error"; text: string } | null;

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";
const labelClass = "text-xs font-semibold text-slate-300";

async function fetchBlock(key: string) {
  const response = await fetch(`/api/admin/home-sections?block=${key}`);
  const data = await response.json();
  return { ok: response.ok, data };
}

/**
 * A photo as WebP, at most 2000px on its longer side, so what the website
 * serves is light whatever was picked. A file that can't be read this way
 * goes up as it is.
 */
async function toWebp(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function FieldInput({
  field,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  field: HomeField;
  value: string;
  onChange: (value: string) => void;
  onUpload?: (file?: File) => void;
  uploading?: boolean;
}) {
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
  if (field.type === "image")
    return (
      <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
        <input
          type="file"
          accept={field.upload === "logo" ? ".svg,.webp,image/svg+xml,image/webp" : field.upload === "photo" ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,image/gif"}
          disabled={uploading}
          onChange={(event) => onUpload?.(event.target.files?.[0])}
          className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
        />
        {uploading && <span className="mt-2 block text-xs text-cyan-300">Uploading…</span>}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/images/… or https://…" className={inputClass} />
        {value && (
          // Site paths (/images/…, /api/media/…) are served by the website, not here.
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL
          <img
            src={value.startsWith("/") ? siteUrl(value) : value}
            alt=""
            className={`mt-3 h-32 w-48 rounded-lg border border-slate-700 ${field.upload === "logo" ? "bg-white object-contain p-3" : "object-cover"}`}
          />
        )}
      </div>
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
  onUpload,
  uploading,
}: {
  list: HomeList;
  items: Item[];
  onChange: (items: Item[]) => void;
  /** Uploads a file for one item and resolves to its link, or null. */
  onUpload: (file: File, field: HomeField, item: Item) => Promise<string | null>;
  uploading: boolean;
}) {
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
              {list.fields.map((field) => (
                <label key={field.name} className={`${labelClass} ${field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}`}>
                  {field.label}
                  <FieldInput
                    field={field}
                    value={item[field.name] ?? ""}
                    onChange={(value) => update(index, field.name, value)}
                    onUpload={(file) => {
                      if (file) void onUpload(file, field, item).then((url) => url && update(index, field.name, url));
                    }}
                    uploading={uploading}
                  />
                </label>
              ))}
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
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const def = homeBlocks.find((block) => block.key === active)!;

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

  /** Uploads one file; resolves to its link, or null after saying what went wrong. */
  async function uploadFile(file: File, field: HomeField, altText = ""): Promise<string | null> {
    setUploading(true);
    setNotice(null);
    try {
      const payload = new FormData();
      payload.set("file", field.upload === "photo" ? await toWebp(file) : file);
      payload.set("altText", altText);
      if (field.upload === "logo") payload.set("kind", "logo");
      const response = await fetch("/api/admin/upload", { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Unable to upload image" });
        return null;
      }
      setNotice({ type: "ok", text: "Image uploaded. Save to publish it." });
      return String(data.url);
    } catch {
      setNotice({ type: "error", text: "The image could not be uploaded. Please try again." });
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function upload(field: HomeField, file?: File) {
    if (!file) return;
    const url = await uploadFile(file, field);
    if (url) change(field.name, url);
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
            {def.fields.map((field) => (
              <label key={field.name} className={`${labelClass} ${field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}`}>
                {field.label}
                {field.help && <span className="mt-1 block font-normal text-slate-500">{field.help}</span>}
                <FieldInput
                  field={field}
                  value={String(form[field.name] ?? "")}
                  onChange={(value) => change(field.name, value)}
                  onUpload={(file) => void upload(field, file)}
                  uploading={uploading}
                />
              </label>
            ))}
            {def.lists.map((list) => (
              <ListEditor
                key={list.name}
                list={list}
                items={Array.isArray(form[list.name]) ? (form[list.name] as Item[]) : []}
                onChange={(items) => change(list.name, items)}
                // A logo's alt text is the client name typed beside it.
                onUpload={(file, field, item) => uploadFile(file, field, item.title ?? "")}
                uploading={uploading}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              disabled={saving || uploading}
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
