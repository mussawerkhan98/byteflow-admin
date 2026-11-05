/**
 * The width and height of an uploaded SVG or WebP, read from the file itself,
 * so the website can give the image its size before it loads (no layout
 * shift). Null when the file doesn't say.
 *
 * No dependencies, so it can be tested directly.
 */

export type ImageSize = { width: number; height: number };

const positive = (size: ImageSize) => (size.width > 0 && size.height > 0 ? size : null);

/** From the root <svg>: its width and height in px, else its viewBox. */
export function svgSize(svg: string): ImageSize | null {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!root) return null;
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(root)?.[1]?.trim() ?? "";
  const px = (value: string) => (/^\d+(\.\d+)?(px)?$/i.test(value) ? Number.parseFloat(value) : NaN);
  const width = px(attr("width"));
  const height = px(attr("height"));
  if (Number.isFinite(width) && Number.isFinite(height)) return positive({ width: Math.round(width), height: Math.round(height) });
  const box = attr("viewBox").split(/[\s,]+/).map(Number);
  if (box.length === 4 && box.every(Number.isFinite)) return positive({ width: Math.round(box[2]), height: Math.round(box[3]) });
  return null;
}

/** From a WebP's header, for each of its three encodings. */
export function webpSize(bytes: Uint8Array): ImageSize | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 30 || ascii(0, 4) !== "RIFF" || ascii(8, 12) !== "WEBP") return null;
  const chunk = ascii(12, 16);
  const b = (i: number) => bytes[i];
  if (chunk === "VP8X")
    return positive({ width: 1 + (b(24) | (b(25) << 8) | (b(26) << 16)), height: 1 + (b(27) | (b(28) << 8) | (b(29) << 16)) });
  if (chunk === "VP8 ")
    return positive({ width: (b(26) | (b(27) << 8)) & 0x3fff, height: (b(28) | (b(29) << 8)) & 0x3fff });
  if (chunk === "VP8L") {
    if (b(20) !== 0x2f) return null;
    return positive({
      width: 1 + (((b(22) & 0x3f) << 8) | b(21)),
      height: 1 + (((b(24) & 0x0f) << 10) | (b(23) << 2) | ((b(22) & 0xc0) >> 6)),
    });
  }
  return null;
}
