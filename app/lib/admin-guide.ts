/**
 * One place that answers "what does this screen actually change on the
 * website?" — used by the sidebar, every section header and the overview,
 * so the admin panel explains itself instead of using CMS jargon.
 */
export type AdminSection = {
  /** Route under /admin */
  key: string;
  /** Plain-language name shown in the sidebar */
  label: string;
  /** Where this shows up on the public website */
  shows: string;
  /** Public page to preview, if there is an obvious one */
  preview?: string;
};

export type AdminGroup = { label: string; sections: AdminSection[] };

export const adminGroups: AdminGroup[] = [
  {
    label: "Start here",
    sections: [
      {
        key: "",
        label: "Overview",
        shows: "A map of everything you can change and where it appears.",
      },
    ],
  },
  {
    label: "Page content",
    sections: [
      {
        key: "heroes",
        label: "Page top banners",
        shows:
          "The big banner at the top of each page — headline, text, buttons and background image.",
        preview: "/",
      },
      {
        key: "services",
        label: "Services",
        shows:
          "The “Services Built for Real Business Growth” cards on the homepage, and each service's own page.",
        preview: "/",
      },
      {
        key: "about",
        label: "About Us — Founder",
        shows: "The founder / CEO block on the About Us page.",
        preview: "/about-us",
      },
      {
        key: "team",
        label: "Team members",
        shows: "The team photo cards further down the About Us page.",
        preview: "/about-us",
      },
      {
        key: "projects",
        label: "Projects",
        shows: "The work portfolio shown on the Projects page.",
        preview: "/projects",
      },
      {
        key: "posts",
        label: "Blog posts",
        shows:
          "Articles on the Blog page, plus the “From Our IT Experts” row on the homepage.",
        preview: "/blog",
      },
    ],
  },
  {
    label: "Add to any page",
    sections: [
      {
        key: "testimonials",
        label: "Customer reviews",
        shows:
          "The review slider on the homepage and the review cards on About Us.",
        preview: "/",
      },
      {
        key: "faqs",
        label: "FAQs",
        shows:
          "The question-and-answer accordion near the bottom of whichever page you assign each question to.",
        preview: "/",
      },
      {
        key: "ctas",
        label: "Call-to-action banners",
        shows:
          "The “get in touch” banner near the bottom of whichever page you assign it to.",
        preview: "/",
      },
    ],
  },
  {
    label: "Whole site",
    sections: [
      {
        key: "menus",
        label: "Header & footer links",
        shows: "The navigation links in the website header and footer.",
        preview: "/",
      },
      {
        key: "settings",
        label: "Contact details & logo",
        shows:
          "Phone, email, address, opening hours, logo and social links used everywhere on the site.",
        preview: "/contact-us",
      },
      {
        key: "pages",
        label: "SEO & page settings",
        shows:
          "The Google search title and description for each page, and whether search engines may index it.",
      },
      {
        key: "scripts",
        label: "Tracking codes",
        shows:
          "Analytics and tracking snippets (Google, Meta, chat widgets) added to every page.",
      },
      {
        key: "sections",
        label: "Advanced blocks",
        shows:
          "Raw content blocks. Only the homepage banner and the About Us founder block use these — everything else has its own screen above.",
      },
    ],
  },
  {
    label: "Inbox & access",
    sections: [
      {
        key: "submissions",
        label: "Contact form messages",
        shows: "Messages people send you through the website contact forms.",
      },
      {
        key: "users",
        label: "Admin logins",
        shows: "Who is allowed to sign in to this admin panel.",
      },
    ],
  },
];

const sectionIndex = new Map(
  adminGroups.flatMap((group) =>
    group.sections.map((section) => [section.key, section] as const),
  ),
);

export function getAdminSection(key: string): AdminSection | undefined {
  return sectionIndex.get(key);
}

/** Public website origin, used for the "View on website" links. */
export function siteUrl(path = "/") {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.byteflow.ae"
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
