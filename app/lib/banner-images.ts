/**
 * Which banner pictures each page's design shows on the website, so the
 * page workspace and the Heroes screen offer only those. A page whose banner
 * has no picture doesn't show the fields at all. Pages not listed here (one
 * added later) keep both fields, as before.
 *
 * - background (hero_background_image): behind the whole banner — the IT AMC
 *   and service pages (under a light wash) and Careers.
 * - picture (hero_image + hero_image_alt): clearly beside the text — the home
 *   page, About Us, the IT AMC page and the service pages.
 */
/**
 * The IT AMC page and the service pages (home-sections.ts servicePageList),
 * listed here rather than imported, so the forms in the browser don't load
 * every section definition.
 */
const SERVICE_PAGES = new Set([
  "it-amc-services-dubai",
  "cyber-security",
  "system-integration",
  "data-backup-recovery",
  "cloud-services-dubai",
  "website-development",
  "graphics-designing",
  "digital-marketing",
  "landing-page-designing",
]);

/** Pages whose banners are text only: their picture fields would do nothing. */
const TEXT_ONLY = new Set(["services", "industries", "projects", "blog", "contact-us", "privacy-policy", "terms-and-conditions"]);

export type BannerImages = { background: boolean; picture: boolean };

export function bannerImages(slug: string | undefined): BannerImages {
  if (!slug) return { background: true, picture: true };
  if (SERVICE_PAGES.has(slug)) return { background: true, picture: true };
  if (slug === "home" || slug === "about-us") return { background: false, picture: true };
  if (slug === "careers") return { background: true, picture: false };
  if (TEXT_ONLY.has(slug)) return { background: false, picture: false };
  return { background: true, picture: true };
}

/** What the background picture does on a page, for its help text. */
export function backgroundHelp(slug: string | undefined): string {
  if (slug && SERVICE_PAGES.has(slug))
    return "Shown behind the whole banner under a light wash, so the words stay readable. Decorative: no alt text needed. A wide landscape photo works best (converted to WebP).";
  if (slug === "careers") return "Shown darkened behind the whole banner. Decorative: no alt text needed.";
  return "Shown behind the banner. Usually decorative.";
}
