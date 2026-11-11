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
        key: "pages",
        label: "Pages",
        shows:
          "Pick a page (Home, About Us, Blog, IT Support AMC, etc.) and manage everything on it — top banner, SEO details, FAQs, extra content blocks and its call-to-action banner — all together in one place.",
      },
      {
        key: "home-sections",
        label: "Home page sections",
        shows:
          "The wording, links and lists of the home page blocks: the services intro, About Byteflow, the service promise, How it works and the help panel.",
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
        key: "about-sections",
        label: "About page sections",
        shows:
          "The wording and lists of the About Us page: the figures under the top banner, Our story, How we work, What we do, the team heading, the reviews heading, Company information and the closing panel. The top banner itself is the page's hero.",
        preview: "/about-us",
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
      {
        key: "legal-pages",
        label: "Legal pages",
        shows:
          "The Privacy Policy and Terms & Conditions pages, linked from the footer's Legal column: their title, last updated line, intro and sections.",
        preview: "/privacy-policy",
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
    ],
  },
  {
    label: "Whole site",
    sections: [
      {
        key: "header-menu",
        label: "Header menu",
        shows:
          "The bar at the top of every page: its links and their order, the Services, Industries and Insights mega menus, the button, the phone number and the dark/light switch.",
        preview: "/",
      },
      {
        key: "menus",
        label: "Header & footer links",
        shows:
          "The links in the website footer. The header's links are under Header menu once its migration has run; until then, the header entries here are still used.",
        preview: "/",
      },
      {
        key: "settings",
        label: "Contact details & logo",
        shows:
          "Phone, email, address, opening hours, logo and social links used everywhere on the site, the footer's headings, text, copyright line and the line under BYTEFLOW, and the figures the site quotes (clients, Google rating, reviews, year founded) with the Google Business profile link. Change a figure here and it changes on every page; text elsewhere can quote them as {clients}, {rating}, {reviews}, {founded} or {years}. The header's button and phone switch are under Header menu.",
        preview: "/contact-us",
      },
      {
        key: "scripts",
        label: "Tracking codes",
        shows:
          "Analytics and tracking snippets (Google, Meta, chat widgets) added to every page.",
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
        key: "marketing",
        label: "Marketing",
        shows:
          "Your promotion mailing list and the offer emails you send to it. Nothing here appears on the website — it goes to people's inboxes.",
      },
      {
        key: "users",
        label: "Admin logins",
        shows: "Who is allowed to sign in to this admin panel.",
      },
      {
        key: "image-storage",
        label: "Image storage",
        shows:
          "Images uploaded before this panel learned to store them as files sit inside the content itself, which makes every page carry them again on every visit. This moves them onto their own cacheable files. Nothing is deleted and it is safe to run more than once.",
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
