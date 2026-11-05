"use client";

import { useId, useState } from "react";
import { siteUrl } from "../lib/admin-guide";
import { acceptFor, allowedNames, formatBytes, MAX_UPLOAD_BYTES, needsAlt, type UploadKind } from "../lib/image-rules";

/**
 * The one image field used everywhere in the admin. It checks the file and
 * the alt text first, so a problem shows here, next to the field, before
 * anything is sent; then it uploads through /api/admin/upload, which converts
 * the picture (see app/lib/image-pipeline.ts) and answers with its link.
 *
 * The rest of the form is never touched by a failed upload.
 *
 * Alt text: when the record has its own alt field, pass `alt` and
 * `onAltChange` and this field edits it; otherwise the alt text typed here is
 * stored with the image itself. `allowDecorative` offers a "decorative" box
 * for pictures that carry no meaning (backgrounds).
 */
export type UploadedImage = { url: string; alt: string; decorative: boolean; width: number | null; height: number | null };

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400";

/** Uploads one file and returns what the server made of it, or throws its message. */
export async function uploadImage(file: File, options: { kind?: UploadKind; alt: string; decorative?: boolean }) {
  const kind = options.kind ?? "image";
  const message = precheck(file, kind, options.alt, Boolean(options.decorative));
  if (message) throw new Error(message);
  const payload = new FormData();
  payload.set("file", file);
  payload.set("kind", kind);
  payload.set("altText", options.alt);
  if (options.decorative) payload.set("decorative", "1");
  let response: Response;
  try {
    response = await fetch("/api/admin/upload", { method: "POST", body: payload });
  } catch {
    throw new Error("The upload could not reach the server. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `Upload failed (${response.status}).`);
  return data as UploadedImage & { summary: string; bytesBefore: number; bytesAfter: number; format: string };
}

/** The checks the server makes, run here first so the answer is instant. */
function precheck(file: File, kind: UploadKind, alt: string, decorative: boolean) {
  if (file.size > MAX_UPLOAD_BYTES) return `Larger than 5 MB (this file is ${formatBytes(file.size)}).`;
  const name = file.name.toLowerCase();
  const accepted = acceptFor(kind).split(",").filter((entry) => entry.startsWith("."));
  if (!accepted.some((extension) => name.endsWith(extension))) return `Unsupported file type: use ${allowedNames(kind)}.`;
  if (needsAlt(kind) && !decorative && !alt.trim()) return "Alt text required: describe the image, or mark it as decorative.";
  return null;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  kind = "image",
  alt: boundAlt,
  onAltChange,
  allowDecorative = false,
  help,
  altMax,
  altLabel = "Alt text",
  error: outsideError,
}: {
  label: string;
  value: string;
  onChange: (url: string, image?: UploadedImage) => void;
  kind?: UploadKind;
  alt?: string;
  onAltChange?: (alt: string) => void;
  allowDecorative?: boolean;
  help?: string;
  /** Shows a character count against this length (search engines cut long alt text). */
  altMax?: number;
  /** What the alt box is called, e.g. "Client name (alt text)" for a logo. */
  altLabel?: string;
  /** A save error for this field, shown with the upload's own. */
  error?: string;
}) {
  const id = useId();
  const [ownAlt, setOwnAlt] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const alt = onAltChange ? (boundAlt ?? "") : ownAlt;
  const setAlt = onAltChange ?? setOwnAlt;
  const askAlt = needsAlt(kind);
  const shownError = error || outsideError || "";

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setSummary("");
    setBusy(true);
    try {
      const result = await uploadImage(file, { kind, alt, decorative });
      onChange(result.url, result);
      setSummary(result.summary);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  const preview = value ? (value.startsWith("/") ? siteUrl(value) : value) : "";
  const contain = kind === "logo" || kind === "icon" || kind === "favicon";

  return (
    <div className="text-xs font-semibold text-slate-300" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`}>{label}</span>
      {help && <span className="mt-1 block font-normal text-slate-500">{help}</span>}
      <div className={`mt-2 rounded-xl border border-dashed p-4 ${shownError ? "border-red-400/60 bg-red-500/[.04]" : "border-slate-700 bg-slate-950/70"}`}>
        {askAlt && (
          <label className="block font-normal text-slate-400">
            {altLabel} <span className="text-cyan-400">*</span>
            <span className="ml-1 text-slate-500">describes the image for screen readers and Google</span>
            {altMax && !decorative && (
              <span className={`float-right tabular-nums ${alt.length > altMax ? "text-amber-300" : "text-slate-500"}`}>
                {alt.length} / {altMax}
              </span>
            )}
            <input
              value={decorative ? "" : alt}
              disabled={decorative}
              onChange={(event) => setAlt(event.target.value)}
              placeholder={decorative ? "Decorative: no alt text" : "e.g. Engineer checking a server rack in a Dubai office"}
              aria-invalid={Boolean(shownError && /alt text/i.test(shownError))}
              className={`${inputClass} disabled:opacity-50`}
            />
          </label>
        )}
        {askAlt && allowDecorative && (
          <label className="mt-2 flex items-center gap-2 font-normal text-slate-400">
            <input type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)} />
            Decorative (adds nothing a reader would miss, like a background)
          </label>
        )}
        <input
          type="file"
          accept={acceptFor(kind)}
          disabled={busy}
          aria-describedby={`${id}-status`}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="mt-3 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
        />
        <span className="mt-1 block font-normal text-slate-500">
          {allowedNames(kind)}, up to 5 MB.{" "}
          {kind === "image" || kind === "logo" || kind === "og" ? "Pictures are converted to WebP and resized to 2400px at most." : ""}
          {kind === "og" ? " A 1200×630 JPG copy is made for social previews." : ""}
          {kind === "favicon" ? " Kept in its own format, as browsers expect." : ""}
        </span>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Or paste a link: /images/… or https://…" className={inputClass} />
        <p id={`${id}-status`} aria-live="polite" className="mt-2 font-normal">
          {busy && <span className="text-cyan-300">Uploading and converting…</span>}
          {!busy && summary && <span className="text-emerald-300">Uploaded: {summary}. Save to apply it.</span>}
        </p>
        {shownError && (
          <p role="alert" className="mt-1 font-semibold text-red-300">
            {shownError}
          </p>
        )}
        {preview && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL */}
            <img src={preview} alt="" className={`h-32 w-48 rounded-lg border border-slate-700 ${contain ? "bg-white object-contain p-3" : "object-cover"}`} />
            <button type="button" onClick={() => onChange("")} className="rounded-lg border border-red-500/30 px-3 py-2 font-normal text-red-300">
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
