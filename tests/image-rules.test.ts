import { strict as assert } from "node:assert";
import { test } from "node:test";
import { acceptFor, checkUpload, MAX_UPLOAD_BYTES, seoFileName, sniffImage, UploadError } from "../app/lib/image-rules";

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(values.flatMap((value) => (typeof value === "string" ? [...value].map((c) => c.charCodeAt(0)) : [value])));
const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const png = bytes(0x89, "PNG\r\n\x1a\n", 0, 0, 0, 13);
const webp = bytes("RIFF", 0, 0, 0, 0, "WEBPVP8 ");
const avif = bytes(0, 0, 0, 0x1c, "ftypavif", 0, 0, 0, 0);
const gif = bytes("GIF89a", 1, 0);
const ico = bytes(0, 0, 1, 0, 1, 0);
const svg = new TextEncoder().encode('﻿<?xml version="1.0"?>\n<!-- Generator -->\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x">\n<svg xmlns="http://www.w3.org/2000/svg"/>');

test("the real type is read from the file's signature, not its name", () => {
  assert.equal(sniffImage(jpeg), "jpeg");
  assert.equal(sniffImage(png), "png");
  assert.equal(sniffImage(webp), "webp");
  assert.equal(sniffImage(avif), "avif");
  assert.equal(sniffImage(gif), "gif");
  assert.equal(sniffImage(ico), "ico");
  assert.equal(sniffImage(svg), "svg");
  assert.equal(sniffImage(new TextEncoder().encode("<html><body>hi</body></html>")), null);
});

const upload = (overrides: Partial<Parameters<typeof checkUpload>[0]>) =>
  checkUpload({ kind: "image", bytes: webp, declaredType: "image/webp", fileName: "photo.webp", alt: "A server rack", decorative: false, ...overrides });

test("WebP, AVIF, JPG and PNG pictures are accepted, with alt text", () => {
  assert.equal(upload({}), "webp");
  assert.equal(upload({ bytes: avif, declaredType: "image/avif", fileName: "a.avif" }), "avif");
  assert.equal(upload({ bytes: jpeg, declaredType: "image/jpeg", fileName: "a.JPEG" }), "jpeg");
  assert.equal(upload({ bytes: png, declaredType: "", fileName: "a.png" }), "png");
});

test("each refusal says why", () => {
  const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
  big.set(webp);
  assert.throws(() => upload({ bytes: big }), (e: unknown) => e instanceof UploadError && e.status === 413 && /Larger than 5 MB/.test(e.message));
  assert.throws(() => upload({ bytes: gif, declaredType: "image/gif", fileName: "a.gif" }), /Unsupported file type \(GIF\)/);
  assert.throws(() => upload({ bytes: svg, declaredType: "image/svg+xml", fileName: "a.svg" }), /Unsupported file type \(SVG\)/);
  assert.throws(() => upload({ bytes: png, declaredType: "image/jpeg", fileName: "a.jpg" }), /don't match its type/);
  assert.throws(() => upload({ bytes: png, declaredType: "", fileName: "a.jpg" }), /don't match its name/);
  assert.throws(() => upload({ alt: "  " }), /Alt text required/);
});

test("decorative pictures, icons and favicons need no alt text; SVG only where it belongs", () => {
  assert.equal(upload({ alt: "", decorative: true }), "webp");
  assert.equal(checkUpload({ kind: "icon", bytes: svg, declaredType: "", fileName: "icon.svg", alt: "", decorative: false }), "svg");
  assert.equal(checkUpload({ kind: "logo", bytes: svg, declaredType: "text/xml", fileName: "logo.svg", alt: "Acme", decorative: false }), "svg");
  assert.equal(checkUpload({ kind: "favicon", bytes: ico, declaredType: "image/x-icon", fileName: "favicon.ico", alt: "", decorative: false }), "ico");
  assert.throws(() => checkUpload({ kind: "icon", bytes: png, declaredType: "image/png", fileName: "i.png", alt: "", decorative: false }), /use SVG/);
  assert.throws(() => checkUpload({ kind: "favicon", bytes: webp, declaredType: "image/webp", fileName: "f.webp", alt: "", decorative: false }), /use ICO, PNG or SVG/);
});

test("file names come from the alt text, made safe for a URL", () => {
  assert.equal(seoFileName("Engineer checking a firewall — Dubai Office!", "IMG_2041.JPG", "webp"), "engineer-checking-a-firewall-dubai-office.webp");
  assert.equal(seoFileName("", "Team Photo 2024.final.png", "webp"), "team-photo-2024-final.webp");
  assert.equal(seoFileName("", "...", "jpg"), "image.jpg");
  assert.ok(seoFileName("x".repeat(200), "", "webp").length <= 65);
});

test("each kind's file picker offers only what it takes", () => {
  assert.equal(acceptFor("icon"), ".svg,image/svg+xml");
  assert.match(acceptFor("image"), /\.webp/);
  assert.match(acceptFor("image"), /\.avif/);
  assert.doesNotMatch(acceptFor("image"), /svg|gif/);
  assert.match(acceptFor("favicon"), /\.ico/);
});
