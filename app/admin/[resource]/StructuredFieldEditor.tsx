"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

type Props = {
  fieldName: string;
  sectionType?: string;
  value: string;
  onChange: (value: string) => void;
};
const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-200 outline-none focus:border-cyan-400";

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function StructuredFieldEditor({
  fieldName,
  sectionType,
  value,
  onChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  if (fieldName === "content" && sectionType === "founder") {
    const content = parse<Record<string, string>>(value, {});
    const fields = [
      ["eyebrow", "Small heading", "Meet the founder"],
      ["heading", "Main heading", "Started with a laptop and a promise…"],
      ["story", "Story (separate paragraphs with a blank line)", "Founder story"],
      ["image_url", "Owner image URL", "/images/owner/owner.png"],
      ["image_alt", "Image alt text", "Byteflow founder"],
      ["role", "Role", "Founder & CEO"],
      ["company", "Company", "Byteflow Information Technology"],
      ["linkedin_url", "LinkedIn URL", "https://…"],
      ["phone_label", "Phone shown", "+971 54 328 2042"],
      ["phone_url", "Phone link", "tel:+971543282042"],
    ];
    const update = (key: string, nextValue: string) =>
      onChange(JSON.stringify({ ...content, [key]: nextValue }));
    const uploadOwnerImage = async (file?: File) => {
      if (!file) return;
      setUploading(true);
      try {
        const payload = new FormData();
        payload.set("file", file);
        payload.set("altText", content.image_alt || "Byteflow founder");
        const response = await fetch("/api/admin/upload", { method: "POST", body: payload });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed");
        update("image_url", String(data.url));
      } finally {
        setUploading(false);
      }
    };
    return (
      <div className="mt-2 grid gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 sm:grid-cols-2">
        {fields.map(([key, label, placeholder]) => (
          <label key={key} className={key === "story" || key === "heading" ? "sm:col-span-2" : ""}>
            <span className="mb-1 block text-xs text-slate-400">{label}</span>
            {key === "image_url" ? (
              <div className="space-y-2">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void uploadOwnerImage(event.target.files?.[0])} className={inputClass} />
                <input value={content[key] ?? ""} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} className={inputClass} />
                {uploading && <span className="block text-xs text-cyan-300">Uploading owner image…</span>}
              </div>
            ) : key === "story" ? (
              <textarea rows={7} value={content[key] ?? ""} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} className={inputClass} />
            ) : (
              <input value={content[key] ?? ""} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} className={inputClass} />
            )}
          </label>
        ))}
      </div>
    );
  }

  if (fieldName === "metrics") {
    const rows = parse<{ value: string; label: string }[]>(value, []);
    const update = (next: typeof rows) => onChange(JSON.stringify(next));
    return (
      <div className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[.45fr_1fr_auto]">
            <input
              aria-label={`Metric ${index + 1} value`}
              placeholder="Result, e.g. 40%"
              value={row.value ?? ""}
              onChange={(event) =>
                update(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, value: event.target.value }
                      : item,
                  ),
                )
              }
              className={inputClass}
            />
            <input
              aria-label={`Metric ${index + 1} label`}
              placeholder="Description, e.g. less downtime"
              value={row.label ?? ""}
              onChange={(event) =>
                update(
                  rows.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, label: event.target.value }
                      : item,
                  ),
                )
              }
              className={inputClass}
            />
            <button
              type="button"
              title="Remove metric"
              onClick={() =>
                update(rows.filter((_, itemIndex) => itemIndex !== index))
              }
              className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/20 text-red-300"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...rows, { value: "", label: "" }])}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-semibold text-cyan-300"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" /> Add result
        </button>
      </div>
    );
  }

  if (fieldName === "bullet_points" || fieldName === "tags") {
    const rows = parse<string[]>(value, []);
    const update = (next: string[]) => onChange(JSON.stringify(next));
    const singular = fieldName === "tags" ? "tag" : "deliverable";
    return (
      <div className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`${singular} ${index + 1}`}
              placeholder={
                fieldName === "tags"
                  ? "e.g. Microsoft 365"
                  : "Describe what was delivered"
              }
              value={row}
              onChange={(event) =>
                update(
                  rows.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className={inputClass}
            />
            <button
              type="button"
              title={`Remove ${singular}`}
              onClick={() =>
                update(rows.filter((_, itemIndex) => itemIndex !== index))
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-400/20 text-red-300"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update([...rows, ""])}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-semibold text-cyan-300"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" /> Add {singular}
        </button>
      </div>
    );
  }

  const object = parse<Record<string, unknown>>(value, {});
  const rows = Object.entries(object).map(([key, item]) => ({
    key,
    value: typeof item === "string" ? item : String(item ?? ""),
  }));
  const update = (next: typeof rows) =>
    onChange(
      JSON.stringify(
        Object.fromEntries(
          next
            .filter((row) => row.key.trim())
            .map((row) => [row.key.trim(), row.value]),
        ),
      ),
    );
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[.45fr_1fr_auto]">
          <input
            aria-label={`Field ${index + 1} name`}
            placeholder="Field name"
            value={row.key}
            onChange={(event) =>
              update(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, key: event.target.value }
                    : item,
                ),
              )
            }
            className={inputClass}
          />
          <input
            aria-label={`Field ${index + 1} value`}
            placeholder="Field value"
            value={row.value}
            onChange={(event) =>
              update(
                rows.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, value: event.target.value }
                    : item,
                ),
              )
            }
            className={inputClass}
          />
          <button
            type="button"
            title="Remove field"
            onClick={() =>
              update(rows.filter((_, itemIndex) => itemIndex !== index))
            }
            className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/20 text-red-300"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          update([...rows, { key: `field_${rows.length + 1}`, value: "" }])
        }
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 px-3 py-2 text-xs font-semibold text-cyan-300"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" /> Add field
      </button>
    </div>
  );
}
