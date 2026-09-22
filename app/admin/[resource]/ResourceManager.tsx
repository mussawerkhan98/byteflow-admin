"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import type { Resource } from "../../lib/cms-config";
import { getAdminSection } from "../../lib/admin-guide";
import AdminPageHeader from "../AdminPageHeader";
import RichTextEditor from "./RichTextEditor";
import StructuredFieldEditor from "./StructuredFieldEditor";

type RecordValue = Record<string, unknown>;
type PageOption = { id: number; name: string; slug: string };
const booleanValue = (value: unknown) =>
  value === true || value === 1 || value === "1";
const isImageField = (name: string) =>
  !/(^|_)(alt|caption)(_|$)/.test(name) &&
  /(^|_)(image|logo|favicon)(_|$)/.test(name);
const isUploadField = (name: string) => isImageField(name) || name === "icon";
/** Section types the website actually reads. Anything else renders nowhere. */
const LIVE_SECTION_TYPES = ["custom", "hero", "founder"];

async function optimizeImage(file: File) {
  if (file.type === "image/gif" || file.size < 500 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
  });
}

/** One row in a resource list — factored out so it can be rendered either
 * flat or grouped under a per-page heading without duplicating the JSX. */
function ResourceRow({
  record,
  config,
  resourceKey,
  pageOptions,
  hasOrder,
  reorder,
  start,
  remove,
  setViewing,
}: {
  record: RecordValue;
  config: Resource;
  resourceKey: string;
  pageOptions: PageOption[];
  hasOrder: boolean;
  reorder: (record: RecordValue, direction: "up" | "down") => void;
  start: (record?: RecordValue) => void;
  remove: (record: RecordValue) => void;
  setViewing: (record: RecordValue | null) => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {String(
            record.title ??
              record.name ??
              record.label ??
              record.question ??
              record.customer_name ??
              record.filename ??
              record.email ??
              `#${record.id}`,
          )}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          ID {String(record.id)}
          {record.slug ? ` · /${record.slug}` : ""}
          {record.page_id
            ? ` · ${pageOptions.find((page) => page.id === Number(record.page_id))?.name ?? `page ${record.page_id}`}`
            : ""}
          {record.section_type ? ` · ${record.section_type}` : ""}
          {record.status ? ` · ${record.status}` : ""}
          {!booleanValue(record.visible) &&
          config.fields.some((field) => field.name === "visible")
            ? " · hidden"
            : ""}
        </p>
        {resourceKey === "sections" &&
          !LIVE_SECTION_TYPES.includes(String(record.section_type)) && (
            <p className="mt-1 text-xs font-semibold text-amber-300">
              This block type isn&apos;t shown anywhere on the website — edit
              it and set Section type to “custom” to make it appear.
            </p>
          )}
      </div>
      <div className="flex flex-wrap gap-2">
        {hasOrder && (
          <>
            <button
              aria-label="Move up"
              onClick={() => reorder(record, "up")}
              className="rounded border border-slate-700 px-2.5 py-1.5 text-sm"
            >
              ↑
            </button>
            <button
              aria-label="Move down"
              onClick={() => reorder(record, "down")}
              className="rounded border border-slate-700 px-2.5 py-1.5 text-sm"
            >
              ↓
            </button>
          </>
        )}
        {!config.readOnly && (
          <button
            onClick={() => start(record)}
            className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-cyan-400"
          >
            Edit
          </button>
        )}
        {resourceKey === "submissions" && (
          <button
            onClick={() => setViewing(record)}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-1.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
          >
            View inquiry
          </button>
        )}
        {(!config.readOnly || resourceKey === "submissions") &&
          !config.singleton && (
            <button
              onClick={() => remove(record)}
              className="rounded border border-red-500/30 px-3 py-1.5 text-sm text-red-300"
            >
              Delete
            </button>
          )}
      </div>
    </div>
  );
}

export default function ResourceManager({
  resourceKey,
  config,
  lockedPageId,
  hideHeader,
}: {
  resourceKey: string;
  config: Resource;
  /** When set, this manager is embedded inside a single page's workspace:
   * every record is scoped to that page, the "page" field is hidden (new
   * records are pinned to it automatically) and the page filter/grouping UI
   * is skipped since there's only ever one page to show. */
  lockedPageId?: number;
  /** Hide the big section title + "on your website" blurb — used when this
   * manager is embedded under its own heading inside another screen. */
  hideHeader?: boolean;
}) {
  const initial = useMemo(
    () =>
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          field.name === "page_id" && lockedPageId
            ? lockedPageId
            : field.type === "boolean"
              ? true
              : field.type === "number"
                ? ""
                : field.type === "json"
                  ? ["bullet_points", "metrics", "tags"].includes(field.name)
                    ? "[]"
                    : "{}"
                  : (field.options?.[0] ?? ""),
        ]),
      ),
    [config, lockedPageId],
  );
  const [records, setRecords] = useState<RecordValue[]>([]),
    [editing, setEditing] = useState<RecordValue | null>(null);
  const [form, setForm] = useState<RecordValue>(initial),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [viewing, setViewing] = useState<RecordValue | null>(null);
  const [pageOptions, setPageOptions] = useState<PageOption[]>([]);
  const [missingBuiltins, setMissingBuiltins] = useState(0);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [pageFilter, setPageFilter] = useState("all");
  const hasOrder = config.fields.some((field) => field.name === "sort_order");
  // Resources like FAQs, Extra page blocks and CTAs are assigned one at a
  // time to a page, but the list otherwise gave no sense of which page each
  // record belonged to — everything from every page was interleaved in one
  // flat list. When this resource has a page_id field, group the list by
  // page (with a "<page name>" heading per group) and offer a filter to
  // narrow the list down to a single page.
  const hasPageField = config.fields.some((field) => field.name === "page_id");
  const pageName = (id: unknown) => {
    const key = String(id ?? "");
    if (!key) return "Not assigned to a page";
    return (
      pageOptions.find((page) => page.id === Number(key))?.name ??
      `Page ${key}`
    );
  };
  const pageGroupKey = (record: RecordValue) => String(record.page_id ?? "");
  const pageFilterOptions = useMemo(() => {
    if (!hasPageField) return [];
    const counts = new Map<string, number>();
    for (const record of records) {
      const key = pageGroupKey(record);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count, label: pageName(key) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [records, hasPageField, pageOptions]);
  const visibleRecords = lockedPageId
    ? records.filter(
        (record) => pageGroupKey(record) === String(lockedPageId),
      )
    : hasPageField && pageFilter !== "all"
      ? records.filter((record) => pageGroupKey(record) === pageFilter)
      : records;
  const groupedRecords = useMemo(() => {
    if (lockedPageId || !hasPageField || pageFilter !== "all") return null;
    const groups = new Map<string, RecordValue[]>();
    for (const record of records) {
      const key = pageGroupKey(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }
    return Array.from(groups.entries())
      .map(([key, groupRecords]) => ({
        key,
        label: pageName(key),
        records: groupRecords,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [records, hasPageField, pageFilter, pageOptions, lockedPageId]);
  const section = getAdminSection(resourceKey);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/admin/${resourceKey}`);
    const data = await response.json();
    if (response.ok) setRecords(data.records);
    else setNotice({ type: "error", text: data.error });
    setLoading(false);
  }
  useEffect(() => {
    void load();
    setPageFilter("all");
  }, [resourceKey]);
  useEffect(() => {
    if (!config.fields.some((field) => field.name === "page_id")) return;
    void fetch("/api/admin/pages")
      .then((response) => response.json())
      .then((data) => setPageOptions(data.records ?? []));
  }, [config.fields]);
  useEffect(() => {
    if (config.singleton && records[0] && !editing) {
      setEditing(records[0]);
      setForm(records[0]);
    }
  }, [config.singleton, records, editing]);
  useEffect(() => {
    if (resourceKey !== "services") return;
    void fetch("/api/admin/import-services")
      .then((response) => response.json())
      .then((data) => setMissingBuiltins(Number(data.missing ?? 0)))
      .catch(() => setMissingBuiltins(0));
  }, [resourceKey, records]);

  async function importBuiltinServices() {
    setImporting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/import-services", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Import failed" });
        return;
      }
      setNotice({
        type: "ok",
        text: `Imported ${data.imported} service${data.imported === 1 ? "" : "s"} from the website. You can now edit, reorder and remove them here.`,
      });
      await load();
    } catch {
      setNotice({ type: "error", text: "Import failed. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  function change(name: string, value: unknown) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  function start(record?: RecordValue) {
    const value = record ?? initial;
    setEditing(record ?? {});
    setForm(value);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancel() {
    setEditing(null);
    setForm(initial);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const missing = config.fields.find(
      (field) => field.required && !String(form[field.name] ?? "").trim(),
    );
    if (missing) {
      setNotice({ type: "error", text: `${missing.label} is required.` });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const isUpdate = Number(editing?.id) > 0;
      const response = await fetch(`/api/admin/${resourceKey}`, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Please check the form and try again." });
        return;
      }
      setNotice({ type: "ok", text: `${config.singular} saved successfully.` });
      if (!config.singleton) cancel();
      await load();
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }
  async function remove(record: RecordValue) {
    if (
      !confirm(
        `Delete this ${config.singular.toLowerCase()}? This cannot be undone.`,
      )
    )
      return;
    const response = await fetch(`/api/admin/${resourceKey}?id=${record.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok)
      setNotice({ type: "error", text: data.error ?? "Unable to delete" });
    else {
      setNotice({ type: "ok", text: `${config.singular} deleted.` });
      await load();
    }
  }
  async function reorder(record: RecordValue, direction: "up" | "down") {
    await fetch(`/api/admin/${resourceKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reorder", id: record.id, direction }),
    });
    await load();
  }
  async function uploadFieldImage(fieldName: string, file?: File) {
    if (!file) return;
    setUploadingField(fieldName);
    setNotice(null);
    try {
      const uploadFile = fieldName === "icon" ? file : await optimizeImage(file);
      const payload = new FormData();
      payload.set("file", uploadFile);
      if (fieldName === "icon") payload.set("kind", "icon");
      payload.set(
        "altText",
        String(
          form.image_alt ??
            form.alt_text ??
            form.title ??
            form.name ??
            config.singular,
        ),
      );
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice({
          type: "error",
          text: data.error ?? "Unable to upload file",
        });
        return;
      }
      change(fieldName, data.url);
      setNotice({
        type: "ok",
        text: `${fieldName === "icon" ? "SVG icon" : "Image"} uploaded. Save changes to apply it to this record.`,
      });
    } catch {
      setNotice({ type: "error", text: "The image could not be prepared or uploaded. Please try again." });
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          {hideHeader ? (
            <h2 className="text-lg font-bold text-white">{config.title}</h2>
          ) : (
            <>
              <AdminPageHeader
                sectionKey={resourceKey}
                title={section?.label ?? config.title}
              />
              {!section && (
                <p className="mt-2 text-sm text-slate-500">
                  Create, edit, publish, order, and remove{" "}
                  {config.title.toLowerCase()}.
                </p>
              )}
            </>
          )}
        </div>
        {!config.readOnly && !config.singleton && !editing && (
          <button
            onClick={() => start()}
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,.15)] transition hover:-translate-y-0.5"
          >
            Add {config.singular}
          </button>
        )}
      </div>
      {notice && (
        <p
          role="status"
          className={`mt-5 rounded-lg p-3 text-sm ${notice.type === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}
        >
          {notice.text}
        </p>
      )}
      {resourceKey === "services" && missingBuiltins > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-200">
              {missingBuiltins} service{missingBuiltins === 1 ? "" : "s"} on your
              website {missingBuiltins === 1 ? "is" : "are"} not managed here yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              Your homepage shows these services from built-in code, so they
              can&apos;t be edited or reordered — and adding your own service
              hides them. Import them once to manage every service from this
              page.
            </p>
          </div>
          <button
            onClick={() => void importBuiltinServices()}
            disabled={importing}
            className="shrink-0 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import website services"}
          </button>
        </div>
      )}
      {editing && !config.readOnly && (
        <form
          onSubmit={save}
          className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-center justify-between border-b border-white/[.06] pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-400">
                Editor
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                {Number(editing.id)
                  ? `Edit ${config.singular}`
                  : `New ${config.singular}`}
              </h2>
            </div>
            <span className="rounded-full bg-white/[.04] px-3 py-1 text-[10px] text-slate-500">
              {config.fields.filter(
                (field) => !(field.name === "page_id" && lockedPageId),
              ).length}{" "}
              fields
            </span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {config.fields.map((field) => {
              if (field.name === "page_id" && lockedPageId) return null;
              return (
              <label
                key={field.name}
                className={`${field.type === "textarea" || field.type === "richtext" || field.type === "json" ? "md:col-span-2" : ""} text-xs font-semibold text-slate-300`}
              >
                {field.label}
                {field.required && <span className="text-cyan-400"> *</span>}
                {isUploadField(field.name) ? (
                  <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                    <input
                      type="file"
                      accept={
                        field.name === "icon"
                          ? "image/svg+xml,.svg"
                          : "image/jpeg,image/png,image/webp,image/gif"
                      }
                      disabled={uploadingField === field.name}
                      onChange={(event) =>
                        void uploadFieldImage(
                          field.name,
                          event.target.files?.[0],
                        )
                      }
                      className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                    />
                    {uploadingField === field.name && (
                      <span className="mt-2 block text-xs text-cyan-300">
                        Uploading {field.name === "icon" ? "SVG icon" : "image"}…
                      </span>
                    )}
                    {String(form[field.name] ?? "") && (
                      <div className="mt-4 flex items-end gap-4">
                        <img
                          className="h-28 w-40 rounded-lg border border-slate-700 bg-slate-900 object-contain"
                          src={String(form[field.name])}
                          alt="Selected image preview"
                        />
                        <button
                          type="button"
                          onClick={() => change(field.name, "")}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : field.type === "richtext" ? (
                  <RichTextEditor
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    onChange={(value) => change(field.name, value)}
                  />
                ) : field.type === "json" ? (
                  <StructuredFieldEditor
                    fieldName={field.name}
                    sectionType={String(form.section_type ?? "")}
                    value={String(form[field.name] ?? "")}
                    onChange={(value) => change(field.name, value)}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={5}
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => change(field.name, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-normal outline-none focus:border-cyan-400"
                  />
                ) : field.name === "page_id" ? (
                  <select
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => change(field.name, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  >
                    <option value="">Choose a page</option>
                    {pageOptions.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name} (
                        {page.slug === "home" ? "/" : `/${page.slug}`})
                      </option>
                    ))}
                  </select>
                ) : field.type === "select" ? (
                  <select
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => change(field.name, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  >
                    <>
                      {/* A record saved before the options changed would
                          otherwise display the first option while silently
                          keeping its real value. */}
                      {(() => {
                        const current = String(form[field.name] ?? "");
                        return current && !field.options?.includes(current) ? (
                          <option value={current}>
                            {current} (not used by the website)
                          </option>
                        ) : null;
                      })()}
                      {field.options?.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </>
                  </select>
                ) : field.type === "boolean" ? (
                  <span className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={booleanValue(form[field.name])}
                      onChange={(event) =>
                        change(field.name, event.target.checked)
                      }
                      className="h-4 w-4 accent-cyan-400"
                    />{" "}
                    Enabled
                  </span>
                ) : (
                  <input
                    required={field.required}
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "email"
                          ? "email"
                          : field.type === "url"
                            ? "url"
                            : "text"
                    }
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => change(field.name, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
                  />
                )}
                {field.help && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {field.help}
                  </span>
                )}
              </label>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              disabled={saving}
              className="rounded-lg bg-cyan-400 px-5 py-2.5 font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {!config.singleton && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-slate-700 px-5 py-2.5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      <div className="mt-7 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : (lockedPageId ? visibleRecords.length === 0 : records.length === 0) ? (
          <div className="p-10 text-center">
            <p className="font-medium">
              No {config.title.toLowerCase()}
              {lockedPageId ? " for this page" : ""} yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create the first record to populate this section.
            </p>
          </div>
        ) : (
          <>
            {hasPageField && !lockedPageId && (
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-950/40 px-4 py-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Filter by page
                </label>
                <select
                  value={pageFilter}
                  onChange={(event) => setPageFilter(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm outline-none focus:border-cyan-400"
                >
                  <option value="all">All pages ({records.length})</option>
                  {pageFilterOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {groupedRecords ? (
              <div className="divide-y divide-slate-800">
                {groupedRecords.map((group) => (
                  <div key={group.key || "unassigned"}>
                    <p className="bg-slate-950/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
                      {group.label}
                    </p>
                    <div className="divide-y divide-slate-800">
                      {group.records.map((record) => (
                        <ResourceRow
                          key={String(record.id)}
                          record={record}
                          config={config}
                          resourceKey={resourceKey}
                          pageOptions={pageOptions}
                          hasOrder={hasOrder}
                          reorder={reorder}
                          start={start}
                          remove={remove}
                          setViewing={setViewing}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {visibleRecords.map((record) => (
                  <ResourceRow
                    key={String(record.id)}
                    record={record}
                    config={config}
                    resourceKey={resourceKey}
                    pageOptions={pageOptions}
                    hasOrder={hasOrder}
                    reorder={reorder}
                    start={start}
                    remove={remove}
                    setViewing={setViewing}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {viewing && resourceKey === "submissions" && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewing(null);
          }}
        >
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1921] shadow-2xl">
            <header className="sticky top-0 flex items-center justify-between border-b border-white/[.07] bg-[#0d1921]/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-400">
                  Inquiry details
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {String(viewing.name ?? "Website inquiry")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </header>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              {config.fields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {field.label}
                  </p>
                  {field.name === "email" ? (
                    <a
                      href={`mailto:${String(viewing[field.name] ?? "")}`}
                      className="mt-1 block break-words text-sm text-cyan-300"
                    >
                      {String(viewing[field.name] ?? "—")}
                    </a>
                  ) : field.name === "phone" ? (
                    <a
                      href={`tel:${String(viewing[field.name] ?? "")}`}
                      className="mt-1 block text-sm text-cyan-300"
                    >
                      {String(viewing[field.name] ?? "—")}
                    </a>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                      {field.type === "boolean"
                        ? Boolean(viewing[field.name])
                          ? "Yes"
                          : "No"
                        : String(viewing[field.name] ?? "—")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
