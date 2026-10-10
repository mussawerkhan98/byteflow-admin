/**
 * Turn an uploaded SVG into a data: URL the website can serve.
 *
 * Icon files in the wild almost never begin at `<svg`. Illustrator, Inkscape
 * and most icon sets put an XML declaration first, usually a generator
 * comment, and often a DOCTYPE. The previous check required the file to start
 * at `<svg` and end at `</svg>` with nothing either side, so every one of
 * those was refused — and the message blamed scripts, which told the person
 * nothing about what was actually wrong with their file.
 *
 * The prologue is stripped before the real checks run. What stays rejected is
 * what can actually do harm once the file is served back to a browser, and
 * each rejection says which thing was found.
 */

export class SvgIconError extends Error {}

/** Pieces that may legally sit before the root element, in any order. */
const PROLOGUE = [
  /^\s*<\?xml[\s\S]*?\?>/i,
  /^\s*<!--[\s\S]*?-->/,
  /^\s*<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?[^>]*>/i,
]

/** Strip the prologue and any trailing comments, leaving the drawing itself. */
export function normalizeSvg(input: string): string {
  let svg = input.replace(/^﻿/, "");
  for (let peeled = true; peeled; ) {
    peeled = false;
    for (const pattern of PROLOGUE) {
      const next = svg.replace(pattern, "");
      if (next !== svg) {
        svg = next;
        peeled = true;
      }
    }
  }
  svg = svg.trim();
  for (let peeled = true; peeled; ) {
    peeled = false;
    const next = svg.replace(/<!--[\s\S]*?-->\s*$/, "").trimEnd();
    if (next !== svg) {
      svg = next;
      peeled = true;
    }
  }
  return svg;
}

/**
 * Checks ordered so the message names the thing that was found. Everything
 * here is a way for a served SVG to run code or reach off the page; a
 * `<style>` block is not, so unlike before it is allowed through — that is
 * what Illustrator emits for class-based colours, and refusing it turned away
 * ordinary icons.
 */
const HAZARDS: Array<[RegExp, string]> = [
  [/<\s*script\b/i, "contains a script"],
  [/<\s*foreignObject\b/i, "embeds HTML in a foreignObject"],
  [/<\s*(?:iframe|object|embed)\b/i, "embeds another document"],
  [/<\s*link\b/i, "links to an external stylesheet"],
  [/\bon[a-z]+\s*=/i, "carries an event handler such as onload"],
  [
    /(?:href|xlink:href)\s*=\s*["']?\s*(?:javascript:|data:text\/html)/i,
    "links to javascript: or embedded HTML",
  ],
  [/@import/i, "imports an external stylesheet"],
  [
    /url\(\s*["']?\s*(?:https?:|\/\/|data:text\/html)/i,
    "loads something from another site",
  ],
];

export function svgIconDataUrl(source: string): string {
  // Entities live inside the DOCTYPE, which normalizeSvg strips as prologue,
  // so this has to look at the file as uploaded. Checking it after stripping
  // would wave an XXE payload straight through.
  if (/<!ENTITY/i.test(source)) {
    throw new SvgIconError(
      "This SVG defines XML entities, so it cannot be used as an icon. Re-export it as a plain shape, or open it in a text editor and remove that part.",
    );
  }
  const svg = normalizeSvg(source);
  if (!/^<svg\b/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) {
    throw new SvgIconError(
      "That file does not look like an SVG icon. Opened in a text editor it should hold a single <svg> … </svg> drawing.",
    );
  }
  for (const [pattern, what] of HAZARDS) {
    if (pattern.test(svg)) {
      throw new SvgIconError(
        `This SVG ${what}, so it cannot be used as an icon. Re-export it as a plain shape, or open it in a text editor and remove that part.`,
      );
    }
  }
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
