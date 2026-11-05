/**
 * Home page hero fields that the other pages' banners do not have. They are
 * columns on `pages` (added by scripts/migrate-cms.mjs) next to the hero_*
 * ones, and only the home page shows them. Blank means the website's own
 * wording (byteflow, app/components/Hero.tsx), so nothing changes on the
 * site until one is filled in.
 */
export type HeroExtraField = {
  name: string;
  label: string;
  type: "text" | "link" | "image";
  max?: number;
  help: string;
};

export const heroExtraFields: HeroExtraField[] = [
  {
    name: "hero_highlight",
    label: "Highlight line",
    type: "text",
    max: 60,
    help: "An optional second line under the heading, in light cyan. Part of the same H1. Blank: the heading shows alone.",
  },
  {
    name: "hero_trust_line",
    label: "Trust line",
    type: "text",
    max: 90,
    help: "Small line with a location pin under the buttons. Blank shows “Dubai-based IT partner since 2017 · 4.9★ Google rating”.",
  },
  {
    name: "hero_image",
    label: "Visual (optional)",
    type: "image",
    help: "A light illustration behind the response-times card. Upload a WebP, about 1200×1000 and under 150 KB. Blank shows a soft glow instead.",
  },
  {
    name: "hero_image_alt",
    label: "Visual — alt text",
    type: "text",
    max: 125,
    help: "Describe the image for screen readers and Google. Needed if you upload a visual.",
  },
  {
    name: "hero_strip_text",
    label: "Bottom strip — left text",
    type: "text",
    max: 60,
    help: "Small letter-spaced line along the bottom of the hero. Blank shows “SUPPORT / SECURE / CLOUD / BUILD”.",
  },
  {
    name: "hero_strip_link_label",
    label: "Bottom strip — link text",
    type: "text",
    max: 30,
    help: "Blank shows “See how we work”.",
  },
  {
    name: "hero_strip_link",
    label: "Bottom strip — link",
    type: "link",
    max: 300,
    help: "Blank jumps to the How it works section (#how-we-work).",
  },
];

export const heroExtraNames = heroExtraFields.map((field) => field.name);

/** The ALTER TABLE statements, for migrate-cms.mjs. */
export const heroExtraColumns = heroExtraNames.map(
  (name) => `ALTER TABLE pages ADD COLUMN ${name} TEXT NOT NULL DEFAULT ''`,
);
