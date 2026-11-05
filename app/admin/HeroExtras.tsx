"use client";

import { useState } from "react";
import { heroExtraFields } from "../lib/hero-fields";
import { siteUrl } from "../lib/admin-guide";

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";

/**
 * The home page hero's extra fields (highlight line, trust line, visual,
 * bottom strip), shared by the page workspace and the Heroes screen.
 */
export default function HeroExtras({
  values,
  onChange,
}: {
  values: Record<string, string | number | undefined>;
  onChange: (name: string, value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function upload(name: string, file?: File) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("altText", String(values.hero_image_alt ?? ""));
      const response = await fetch("/api/admin/upload", { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) setUploadError(data.error ?? "Unable to upload image");
      else onChange(name, String(data.url));
    } catch {
      setUploadError("The image could not be uploaded. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <fieldset className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.03] p-5 md:col-span-2">
      <legend className="px-2 text-sm font-bold text-white">Home page extras</legend>
      <div className="grid gap-5 md:grid-cols-2">
        {heroExtraFields.map((field) => {
          const value = String(values[field.name] ?? "");
          const over = field.max ? value.trim().length > field.max : false;
          if (field.type === "image")
            return (
              <div key={field.name} className="text-xs font-semibold text-slate-300 md:col-span-2">
                {field.label}
                <span className="mt-1 block font-normal text-slate-500">{field.help}</span>
                <div className="mt-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
                  <input
                    type="file"
                    accept="image/webp,image/avif,image/png,image/jpeg"
                    disabled={uploading}
                    onChange={(event) => void upload(field.name, event.target.files?.[0])}
                    className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                  />
                  {uploading && <span className="mt-2 block text-cyan-300">Uploading…</span>}
                  {uploadError && <span className="mt-2 block text-red-300">{uploadError}</span>}
                  {value && (
                    <div className="mt-4 flex items-end gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded file */}
                      <img
                        src={value.startsWith("/") ? siteUrl(value) : value}
                        alt=""
                        className="h-28 w-40 rounded-lg border border-slate-700 object-cover"
                      />
                      <button type="button" onClick={() => onChange(field.name, "")} className="rounded-lg border border-red-500/30 px-3 py-2 text-red-300">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          return (
            <label key={field.name} className="text-xs font-semibold text-slate-300">
              {field.label}
              {field.max && (
                <span className={`ml-2 font-normal ${over ? "text-red-300" : "text-slate-600"}`}>
                  {value.trim().length}/{field.max}
                </span>
              )}
              <span className="mt-1 block font-normal text-slate-500">{field.help}</span>
              <input
                value={value}
                placeholder={field.type === "link" ? "#how-we-work, /contact-us or https://…" : undefined}
                onChange={(event) => onChange(field.name, event.target.value)}
                className={`${inputClass} ${over ? "border-red-400/60" : ""}`}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
