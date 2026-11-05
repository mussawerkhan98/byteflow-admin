import "server-only";
import sharp from "sharp";
import { svgSize } from "./image-size";
import { checkUpload, formatBytes, seoFileName, UploadError, type UploadKind } from "./image-rules";
import { storeMedia } from "./media-store";
import { svgIconDataUrl, SvgIconError } from "./svg-icon";

/**
 * Every image uploaded in the admin goes through here (app/api/admin/upload).
 *
 * Pictures (JPG, PNG, AVIF, WebP) are re-encoded as WebP at quality 80,
 * no larger than 2400px on either side. Re-encoding also drops the camera's
 * metadata (EXIF, including any GPS position) and turns the picture the right
 * way up first. SVGs are cleaned of anything that could run. Favicons keep
 * their own format. A share picture also gets a 1200×630 JPG copy, which is
 * what its field stores, since not every platform shows WebP previews.
 *
 * The website then serves each size it needs from the WebP through Next's
 * image optimizer (srcset), so only the one file is stored.
 */

export const MAX_SIDE = 2400;
export const WEBP_QUALITY = 80;
const SOCIAL = { width: 1200, height: 630 };

export type UploadResult = {
  url: string;
  alt: string;
  decorative: boolean;
  width: number | null;
  height: number | null;
  format: string;
  bytesBefore: number;
  bytesAfter: number;
  /** For a share picture: the WebP alongside the JPG the field keeps. */
  webpUrl?: string;
  summary: string;
};

const dataUrl = (mime: string, bytes: Buffer) => `data:${mime};base64,${bytes.toString("base64")}`;

export async function processUpload(input: {
  kind: UploadKind;
  file: File;
  alt: string;
  decorative: boolean;
}): Promise<UploadResult> {
  const { kind, file } = input;
  const decorative = input.decorative && kind !== "logo";
  const alt = decorative ? "" : input.alt.trim().slice(0, 300);
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = checkUpload({ kind, bytes, declaredType: file.type, fileName: file.name, alt, decorative });
  const before = bytes.length;
  const done = (result: Omit<UploadResult, "alt" | "decorative" | "bytesBefore" | "summary">): UploadResult => ({
    ...result,
    alt,
    decorative,
    bytesBefore: before,
    summary:
      result.format === "webp" || result.format === "jpeg"
        ? `${formatBytes(before)} ${type.toUpperCase()} → ${formatBytes(result.bytesAfter)} ${result.format === "webp" ? "WebP" : "JPG"}${result.width ? ` · ${result.width}×${result.height}` : ""}`
        : `${formatBytes(result.bytesAfter)} ${result.format.toUpperCase()}, kept as uploaded`,
  });

  if (type === "svg") {
    try {
      const source = bytes.toString("utf8");
      const size = svgSize(source);
      const filename = seoFileName(alt, file.name, "svg");
      const stored = await storeMedia({ filename, dataUrl: svgIconDataUrl(source), mimeType: "image/svg+xml", sizeBytes: before, altText: alt, size, decorative });
      return done({ url: `${stored}/${filename}`, width: size?.width ?? null, height: size?.height ?? null, format: "svg", bytesAfter: before });
    } catch (error) {
      if (error instanceof SvgIconError) throw new UploadError(error.message, 415);
      throw new UploadError("The SVG could not be read. Make sure it is a real SVG file, not a picture renamed to .svg.", 415);
    }
  }

  if (kind === "favicon") {
    // Browsers and search engines expect a favicon in its own format.
    const mime = type === "ico" ? "image/x-icon" : "image/png";
    const filename = seoFileName(alt || "favicon", file.name, type === "ico" ? "ico" : "png");
    const meta = type === "png" ? await sharp(bytes).metadata().catch(() => null) : null;
    const size = meta?.width && meta.height ? { width: meta.width, height: meta.height } : null;
    const stored = await storeMedia({ filename, dataUrl: dataUrl(mime, bytes), mimeType: mime, sizeBytes: before, altText: alt, size });
    return done({ url: `${stored}/${filename}`, width: size?.width ?? null, height: size?.height ?? null, format: type, bytesAfter: before });
  }

  let webp: { data: Buffer; info: sharp.OutputInfo };
  try {
    // rotate() with no angle applies the camera's orientation; the output
    // carries no metadata unless asked to, so EXIF and GPS are dropped.
    webp = await sharp(bytes, { failOn: "error" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new UploadError("The image could not be read. It may be damaged; try exporting it again.", 415);
  }
  const size = { width: webp.info.width, height: webp.info.height };
  const filename = seoFileName(alt, file.name, "webp");
  const webpUrl = `${await storeMedia({ filename, dataUrl: dataUrl("image/webp", webp.data), mimeType: "image/webp", sizeBytes: webp.data.length, altText: alt, size, decorative })}/${filename}`;

  if (kind === "og") {
    const jpg = await sharp(bytes)
      .rotate()
      .resize({ ...SOCIAL, fit: "cover", position: "attention" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const jpgName = seoFileName(alt, file.name, "jpg");
    const stored = await storeMedia({ filename: jpgName, dataUrl: dataUrl("image/jpeg", jpg), mimeType: "image/jpeg", sizeBytes: jpg.length, altText: alt, size: SOCIAL, decorative, role: "social" });
    return done({ url: `${stored}/${jpgName}`, webpUrl, ...SOCIAL, format: "jpeg", bytesAfter: jpg.length });
  }

  return done({ url: webpUrl, ...size, format: "webp", bytesAfter: webp.data.length });
}
