/**
 * The rules every image upload in the admin follows, in one place: which
 * file types each kind of field takes, how the real type is read from the
 * file itself, the size limit, alt text, and the file name it is saved
 * under. The upload route (app/api/admin/upload) enforces them on the server;
 * the upload field (app/admin/ImageUpload.tsx) checks the same ones first so
 * a mistake shows next to the field before anything is sent.
 *
 * No dependencies, so it can be tested directly.
 */

/**
 * image   a photo or picture: converted to WebP
 * logo    a client or brand logo: SVG (cleaned) or a picture converted to WebP
 * icon    a service icon: SVG only
 * og      a social share picture: WebP, plus a 1200×630 JPG for the platforms
 *         that don't show WebP previews (the JPG is what the field keeps)
 * favicon the site icon: ICO, PNG or SVG, kept as it is
 */
export type UploadKind = "image" | "logo" | "icon" | "og" | "favicon";

export type ImageType = "jpeg" | "png" | "webp" | "avif" | "gif" | "svg" | "ico";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const RASTER: ImageType[] = ["jpeg", "png", "webp", "avif"];

export const ALLOWED: Record<UploadKind, ImageType[]> = {
  image: RASTER,
  og: RASTER,
  logo: [...RASTER, "svg"],
  icon: ["svg"],
  favicon: ["ico", "png", "svg"],
};

const EXTENSIONS: Record<ImageType, string[]> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  webp: [".webp"],
  avif: [".avif"],
  gif: [".gif"],
  svg: [".svg"],
  ico: [".ico"],
};

const MIME: Record<ImageType, string[]> = {
  jpeg: ["image/jpeg", "image/jpg", "image/pjpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  gif: ["image/gif"],
  // Browsers don't agree on an SVG's type; some send none at all.
  svg: ["image/svg+xml", "text/xml", "application/xml", "text/plain"],
  ico: ["image/x-icon", "image/vnd.microsoft.icon", "image/ico"],
};

/** The value for a file input's accept attribute. */
export function acceptFor(kind: UploadKind) {
  return ALLOWED[kind].flatMap((type) => [...EXTENSIONS[type], MIME[type][0]]).join(",");
}

/** "WebP, AVIF, JPG or PNG", for messages. */
export function allowedNames(kind: UploadKind) {
  const names = ALLOWED[kind].map((type) => ({ jpeg: "JPG", png: "PNG", webp: "WebP", avif: "AVIF", gif: "GIF", svg: "SVG", ico: "ICO" })[type]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : names[0];
}

/** Whether a kind needs alt text (unless the picture is marked decorative). */
export const needsAlt = (kind: UploadKind) => kind === "image" || kind === "logo" || kind === "og";

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

/** The file's real type, from its first bytes (its signature), or null. */
export function sniffImage(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(bytes, 8, 12))) return "avif";
  if (bytes.length >= 6 && /^GIF8[79]a$/.test(ascii(bytes, 0, 6))) return "gif";
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return "ico";
  // Text: an SVG may open with a BOM, an XML declaration, comments or a doctype.
  const head = new TextDecoder().decode(bytes.slice(0, 2048)).replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[\s\S]*?\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "svg";
  return null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415 = 400,
  ) {
    super(message);
  }
}

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * What the server checks before touching the file, in the order the person
 * can fix them. Returns the file's real type.
 */
export function checkUpload(input: {
  kind: UploadKind;
  bytes: Uint8Array;
  declaredType: string;
  fileName: string;
  alt: string;
  decorative: boolean;
}): ImageType {
  const { kind, bytes } = input;
  if (!bytes.length) throw new UploadError("The file is empty.");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new UploadError(`Larger than 5 MB (this file is ${formatBytes(bytes.length)}).`, 413);
  const type = sniffImage(bytes);
  if (!type || !ALLOWED[kind].includes(type))
    throw new UploadError(`Unsupported file type${type ? ` (${type.toUpperCase()})` : ""}: use ${allowedNames(kind)}.`, 415);
  // A name or type that says one thing while the bytes say another is
  // refused rather than guessed at (an SVG's type is too unreliable to judge).
  const declared = input.declaredType.toLowerCase();
  if (type !== "svg" && declared && declared !== "application/octet-stream" && !MIME[type].includes(declared))
    throw new UploadError(`The file's contents (${type.toUpperCase()}) don't match its type (${declared}).`, 415);
  const ext = /\.[a-z0-9]+$/i.exec(input.fileName)?.[0]?.toLowerCase();
  if (ext && !EXTENSIONS[type].includes(ext))
    throw new UploadError(`The file's contents (${type.toUpperCase()}) don't match its name (${ext}).`, 415);
  if (needsAlt(kind) && !input.decorative && !input.alt.trim())
    throw new UploadError("Alt text required: describe the image, or mark it as decorative.");
  return type;
}

/** An SEO-friendly file name: from the alt text, else the original name. */
export function seoFileName(alt: string, original: string, extension: string) {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "");
  return `${slug(alt) || slug(original.replace(/\.[a-z0-9]+$/i, "")) || "image"}.${extension}`;
}
