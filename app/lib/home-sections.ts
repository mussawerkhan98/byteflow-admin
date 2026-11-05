/**
 * The home page blocks edited on the "Home page sections" screen.
 *
 * Each block is saved as one page_sections row on the "home" page, with
 * section_type set to the block's key and its fields as JSON. The website
 * (byteflow, app/lib/home-content.ts) reads the same keys and holds the same
 * defaults, which it shows for anything left blank; keep the two in step
 * when a field is added.
 *
 * Pure data and functions, so the save rules can be tested directly.
 */

/** "service": one of the published services, saved by its slug. */
export type HomeFieldType = "text" | "textarea" | "link" | "image" | "select" | "service";

export type HomeField = {
  name: string;
  label: string;
  type: HomeFieldType;
  help?: string;
  /** "select" only: the values it can hold, the first being the default. */
  options?: { value: string; label: string }[];
  /** "image" only: "logo" takes SVG or WebP as is; "photo" is converted to WebP before upload. */
  upload?: "logo" | "photo";
};

export type HomeList = {
  name: string;
  label: string;
  /** What one item is called, e.g. "Reason" → "Add reason". */
  itemLabel: string;
  max: number;
  help?: string;
  /** No default items: nothing shows on the website until one is added (client logos). */
  startsEmpty?: boolean;
  fields: HomeField[];
};

export type HomeBlockDef = {
  key: string;
  label: string;
  /** Where it sits on the home page, in plain words. */
  shows: string;
  fields: HomeField[];
  lists: HomeList[];
  defaults: { fields: Record<string, string>; lists: Record<string, Record<string, string>[]> };
};

const headingHelp =
  "Shown in two tones: this part in dark, the next field in soft grey.";

/** Text on this screen can quote the site-wide figures (Contact details & logo). */
const figuresNote =
  "Type {clients}, {rating}, {reviews}, {founded} or {years} to quote the site-wide figures from Contact details & logo.";

export const homeBlocks: HomeBlockDef[] = [
  {
    key: "home_services_intro",
    label: "Services intro",
    shows: "The heading and intro above the service cards.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "What we do",
        heading: "Services built for",
        heading_soft: "real business growth.",
        intro:
          "End-to-end technology and creative services, all under one roof so you never have to chase multiple vendors again.",
      },
      lists: {},
    },
  },
  {
    key: "home_work",
    label: "Selected work heading",
    shows:
      "The heading above the project cards after Services. The projects are picked on the Projects screen with “Feature on homepage”.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "link_label", label: "Link text", type: "text" },
      { name: "link", label: "Link", type: "link" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Selected work",
        heading: "Real businesses.",
        heading_soft: "Real results.",
        intro: "A look at recent projects for UAE businesses, from IT support and security to cloud and the web.",
        link_label: "Explore our work",
        link: "/projects",
      },
      lists: {},
    },
  },
  {
    key: "home_needs",
    label: "Where does your IT need help?",
    shows:
      "The warm off-white band after Selected work: three common starting points, each linking to a service, and the process line under them.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "link_label", label: "Link on the right — text", type: "text" },
      { name: "link", label: "Link on the right — where it goes", type: "link" },
      {
        name: "steps",
        label: "Bottom line — steps",
        type: "textarea",
        help: "One step per line; they show in capitals with arrows between them.",
      },
      { name: "steps_link_label", label: "Bottom line — link text", type: "text" },
      { name: "steps_link", label: "Bottom line — link", type: "link" },
    ],
    lists: [
      {
        name: "scenarios",
        label: "Scenarios",
        itemLabel: "Scenario",
        max: 3,
        help: "The columns, in this order. Each links to its service under the service's own name from the Services screen.",
        fields: [
          { name: "label", label: "Small label", type: "text", help: "Shown in capitals after the number, e.g. “A new office”." },
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
          { name: "service", label: "Linked service", type: "service" },
          {
            name: "show",
            label: "On the website",
            type: "select",
            options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
          },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Your business comes first",
        heading: "Where does your IT need help?",
        link_label: "Book a free IT assessment",
        link: "/contact-us",
        steps: "Free consultation\nProposal\nSetup\nOngoing support",
        steps_link_label: "How we work",
        steps_link: "/#how-we-work",
      },
      lists: {
        scenarios: [
          { label: "A new office", title: "Moving or opening an office.", description: "Cabling, Wi-Fi, CCTV and access control planned and installed together, so your team works from day one.", service: "system-integration", show: "yes" },
          { label: "A safer business", title: "Worried about ransomware or data loss.", description: "Firewall, endpoint and email protection with tested backups, so one bad click does not stop the business.", service: "cyber-security", show: "yes" },
          { label: "More customers", title: "Need a better website or more leads.", description: "A fast, mobile-first website, landing pages and chatbots built to turn visitors into enquiries.", service: "website-development", show: "yes" },
        ],
      },
    },
  },
  {
    key: "home_about",
    label: "About Byteflow",
    shows:
      "The About block: headline, intro, the founder's quote and two buttons on the left; a bento of four tiles on the right (photo, years in business, Google rating, coverage); and four feature rows underneath. The years, rating and review count come from Contact details & logo; the quote, name, role and photo come from About Us — Founder.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Headline — first line", type: "text", help: "Keep each line short (about 25 characters) so it stays on one line." },
      { name: "heading_soft", label: "Headline — second line (grey)", type: "text", help: figuresNote },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      {
        name: "show_quote",
        label: "Founder quote",
        type: "select",
        help: "The quote, name, role and photo are edited under About Us — Founder (its heading is the quote). It is hidden when that heading is empty.",
        options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
      },
      { name: "primary_label", label: "Main button text", type: "text" },
      { name: "primary_link", label: "Main button link", type: "link" },
      { name: "secondary_label", label: "Text link", type: "text" },
      { name: "secondary_link", label: "Text link — where it goes", type: "link" },
      {
        name: "image_url",
        label: "Photo tile — team or office photo",
        type: "image",
        upload: "photo",
        help: "The tall tile, cropped to fill (portrait works best, about 1200×1500). Converted to WebP. Until one is uploaded, the built-in dark artwork shows.",
      },
      {
        name: "image_alt",
        label: "Photo description (alt text)",
        type: "text",
        help: "Required for an uploaded photo: say what it shows, e.g. “Byteflow engineers supporting a Dubai office”.",
      },
      { name: "image_caption", label: "Photo tile — caption", type: "text", help: "Shown over the bottom of an uploaded photo." },
      { name: "image_badge", label: "Photo tile — caption on the built-in artwork", type: "text", help: `Shown until a photo is uploaded. ${figuresNote}` },
      {
        name: "show_years_badge",
        label: "Years tile",
        type: "select",
        options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
      },
      { name: "years_label", label: "Years tile — text", type: "text", help: "The number above it counts from the year founded in Contact details & logo, so it updates itself every January." },
      {
        name: "show_rating_badge",
        label: "Google rating tile",
        type: "select",
        options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
      },
      { name: "rating_label", label: "Rating tile — text", type: "text", help: `Under the rating from Contact details & logo. ${figuresNote} The reviewer initials are from Customer reviews.` },
      { name: "reviews_label", label: "Rating tile — link text", type: "text", help: "Links to the Google Business profile set in Contact details & logo; hidden until one is set." },
      {
        name: "show_coverage",
        label: "Coverage tile",
        type: "select",
        options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
      },
      { name: "coverage_title", label: "Coverage tile — heading", type: "text" },
      { name: "coverage_locations", label: "Coverage tile — places", type: "text", help: "Separated by commas, e.g. Dubai, Sharjah, Abu Dhabi. Each becomes a chip." },
      { name: "coverage_note", label: "Coverage tile — note", type: "text" },
    ],
    lists: [
      {
        name: "highlights",
        label: "Features (the numbered rows under the bento)",
        itemLabel: "Feature",
        max: 4,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text (one or two lines)", type: "textarea" },
          { name: "link", label: "Page the row links to", type: "link" },
          {
            name: "icon",
            label: "Icon",
            type: "select",
            options: [
              { value: "layers", label: "Layers (everything in one place)" },
              { value: "receipt", label: "Banknote (pricing)" },
              { value: "clock", label: "Clock (response time)" },
              { value: "cloud", label: "Cloud" },
              { value: "shield", label: "Shield (security)" },
              { value: "chat", label: "Speech bubbles (support)" },
            ],
          },
          {
            name: "show",
            label: "Show on the website",
            type: "select",
            options: [
              { value: "yes", label: "Show" },
              { value: "no", label: "Hide" },
            ],
          },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "About Byteflow",
        heading: "Your trusted IT partner,",
        heading_soft: "serving Dubai since {founded}.",
        intro:
          "We make enterprise-grade IT accessible to every business in the UAE, so you can focus entirely on growth.",
        show_quote: "yes",
        primary_label: "Get in touch",
        primary_link: "/contact-us",
        secondary_label: "More about Byteflow",
        secondary_link: "/about-us",
        image_url: "/images/hero/hero.webp",
        image_alt: "Illustration of connected servers and network links",
        image_caption: "Our engineers on site in Dubai",
        image_badge: "Based in Dubai since {founded}",
        show_years_badge: "yes",
        years_label: "Years keeping UAE businesses running",
        show_rating_badge: "yes",
        rating_label: "Google rating · {reviews} reviews",
        reviews_label: "Read reviews",
        show_coverage: "yes",
        coverage_title: "On-site across the UAE",
        coverage_locations: "Dubai, Sharjah, Abu Dhabi",
        coverage_note: "2-hr on-site response",
      },
      lists: {
        highlights: [
          { title: "Full IT under one roof", description: "Infrastructure, cloud, security, design and marketing, all managed by one expert team with full accountability.", link: "/#services", icon: "layers", show: "yes" },
          { title: "Zero hidden costs", description: "Fixed monthly or annual packages so you always know what you pay. No surprises, no extra invoices.", link: "/it-amc-services-dubai", icon: "receipt", show: "yes" },
          { title: "Rapid on-site response", description: "Certified engineers on-site or remote within 2 hours across Dubai, Sharjah and Abu Dhabi.", link: "/it-amc-services-dubai", icon: "clock", show: "yes" },
          { title: "Microsoft & cloud ready", description: "Official Microsoft 365 setup, cloud migrations and ongoing management for UAE businesses of every size.", link: "/cloud-services-dubai", icon: "cloud", show: "yes" },
        ],
      },
    },
  },
  {
    key: "home_promise",
    label: "Service promise",
    shows:
      "The “Why businesses choose us” panel: heading, the turning seal, the commitment rows and the link bar at the bottom.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      { name: "seal_text", label: "Seal wording", type: "text", help: "Runs once round the turning seal. End it with “ ·” so the start and end don’t touch." },
      { name: "footer_text", label: "Bottom bar — text", type: "text" },
      { name: "footer_strong", label: "Bottom bar — bold text", type: "text" },
      { name: "link_label", label: "Bottom bar — link text", type: "text" },
      { name: "link_href", label: "Bottom bar — link", type: "link" },
    ],
    lists: [
      {
        name: "rows",
        label: "Commitments",
        itemLabel: "Commitment",
        max: 6,
        help: "Icons follow the row order: lightning, badge, money, team.",
        fields: [
          { name: "title", label: "Commitment", type: "text" },
          { name: "value", label: "Figure (e.g. 2)", type: "text" },
          { name: "unit", label: "Unit (e.g. hrs)", type: "text" },
          { name: "description", label: "What it means for you", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Why businesses choose us",
        heading: "What you can count on,",
        heading_soft: "every time.",
        intro: "Four standards behind every job we take on, whether it's one laptop or a whole office.",
        seal_text: "Service promise · Byteflow · Since {founded} ·",
        footer_text: "Want all four on one fixed monthly fee?",
        footer_strong: "That's what an IT AMC plan is for.",
        link_label: "See IT AMC plans",
        link_href: "/it-amc-services-dubai",
      },
      lists: {
        rows: [
          { title: "Fast response", value: "2", unit: "hrs", description: "On-site or remote support within 2 hours. We never leave you waiting when your business is down." },
          { title: "Expert team", value: "100%", unit: "certified engineers", description: "Certified IT professionals with deep expertise across infrastructure, cloud, security and design." },
          { title: "Fixed pricing", value: "0", unit: "surprise bills", description: "Transparent monthly or annual packages with no surprise bills. Budget with complete confidence." },
          { title: "One team, all IT", value: "1", unit: "vendor to call", description: "From IT support to web development and digital marketing — one vendor, zero hassle, full accountability." },
        ],
      },
    },
  },
  {
    key: "home_process",
    label: "How it works",
    shows:
      "The “Our process” explorer: heading, and the steps visitors click through (each with its timing, description and check-mark points).",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
    ],
    lists: [
      {
        name: "steps",
        label: "Steps",
        itemLabel: "Step",
        max: 8,
        help: "Icons follow the step order: chat, document, screen, check, shield.",
        fields: [
          { name: "title", label: "Step title", type: "text" },
          { name: "when", label: "When (e.g. Within 24 hours)", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "points", label: "Check-mark points — one per line", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Our process",
        heading: "From first call",
        heading_soft: "to full delivery.",
        intro: "A simple, transparent process so you always know exactly where things stand.",
      },
      lists: {
        steps: [
          { title: "Free consultation", when: "Your first call", description: "Reach out by phone, WhatsApp or the contact form. We listen to your setup, team size and pain points — no jargon, no sales pressure.", points: "Phone, WhatsApp or form\nYour setup and team size\nNo sales pressure" },
          { title: "Custom proposal", when: "Within 24 hours", description: "Within 24 hours you receive a clear, itemised proposal — scope, timeline and fixed pricing. No hidden costs, no vague estimates.", points: "Itemised scope\nClear timeline\nFixed pricing" },
          { title: "Onboarding & setup", when: "On-site or remote", description: "Our certified engineers arrive on-site or connect remotely. We configure your network, servers, cloud or software with zero disruption to your workday.", points: "Network & servers\nCloud & software\nNo disruption to your day" },
          { title: "Testing & handover", when: "Before sign-off", description: "Everything is tested end-to-end before we hand over. We walk your team through what was done, answer every question and make sure you are 100% comfortable.", points: "End-to-end testing\nTeam walkthrough\nEvery question answered" },
          { title: "Ongoing support", when: "24/7, for as long as you need", description: "We monitor your systems 24/7 and fix issues before they affect your business. One call or message and our engineers are on it — on-site within 2 hours.", points: "24/7 monitoring\nIssues fixed early\nOn-site within 2 hours" },
        ],
      },
    },
  },
  {
    key: "home_help",
    label: "Help panel",
    shows:
      "The “Not sure which service you need?” panel under How it works. Its phone button uses the header phone from “Contact details & logo”.",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "description", label: "Text", type: "textarea" },
      { name: "button_label", label: "Button text", type: "text" },
      { name: "button_link", label: "Button link", type: "link" },
    ],
    lists: [],
    defaults: {
      fields: {
        heading: "Not sure which service you need?",
        description: "Our team will guide you. Tell us what's slowing your business down and we'll point you to the right fit.",
        button_label: "Talk to our team",
        button_link: "/contact-us",
      },
      lists: {},
    },
  },
];

export const homeBlockKeys = homeBlocks.map((block) => block.key);

export function getHomeBlockDef(key: string | null): HomeBlockDef | undefined {
  return homeBlocks.find((block) => block.key === key);
}

const LIMITS: Record<HomeFieldType, number> = { text: 200, textarea: 2000, link: 500, image: 500, select: 40, service: 100 };

/**
 * Links may be site paths, web addresses, phone, email or WhatsApp links;
 * anything else (javascript:, data: …) is dropped rather than published.
 */
function safeUrl(value: string, type: "link" | "image"): string {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (type === "link" && (/^(tel|mailto):/i.test(value) || value.startsWith("#"))) return value;
  return "";
}

function clean(field: HomeField, raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim().slice(0, LIMITS[field.type]) : "";
  // Only one of its options; anything else is the first (its default).
  if (field.type === "select") return field.options?.some((option) => option.value === value) ? value : field.options?.[0]?.value ?? "";
  // A service slug, or nothing: the website looks the service up when it shows the link.
  if (field.type === "service") return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "";
  return field.type === "link" || field.type === "image" ? safeUrl(value, field.type) : value;
}

/**
 * The content to save for a block: only its own fields, trimmed and capped,
 * lists cut to their maximum and stripped of items with no title.
 */
/**
 * What a block can't be saved with, beyond what sanitizeHomeBlock already
 * cleans up; null when it is fine. An uploaded About photo needs its own
 * description: the built-in artwork's alt text doesn't describe it.
 */
export function checkHomeBlock(def: HomeBlockDef, content: Record<string, unknown>): string | null {
  if (def.key === "home_about") {
    const image = String(content.image_url ?? "");
    const alt = String(content.image_alt ?? "").trim();
    if (image && image !== def.defaults.fields.image_url && (!alt || alt === def.defaults.fields.image_alt))
      return "Photo description (alt text): describe the uploaded photo, e.g. “Byteflow engineers supporting a Dubai office”.";
  }
  return null;
}

export function sanitizeHomeBlock(def: HomeBlockDef, body: Record<string, unknown>) {
  const content: Record<string, unknown> = {};
  for (const field of def.fields) content[field.name] = clean(field, body?.[field.name]);
  for (const list of def.lists) {
    const items = Array.isArray(body?.[list.name]) ? (body[list.name] as unknown[]) : [];
    content[list.name] = items
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => Object.fromEntries(list.fields.map((field) => [field.name, clean(field, item[field.name])])))
      .filter((item) => item.title)
      .slice(0, list.max);
  }
  return content;
}

/**
 * What the form starts from: saved values where there are any, the website's
 * current wording everywhere else — so editing begins from what visitors see.
 */
export function homeBlockFormValues(def: HomeBlockDef, saved: Record<string, unknown> | null) {
  const fields = Object.fromEntries(
    def.fields.map((field) => {
      const value = typeof saved?.[field.name] === "string" ? String(saved[field.name]).trim() : "";
      return [field.name, value || def.defaults.fields[field.name] || ""];
    }),
  );
  const lists = Object.fromEntries(
    def.lists.map((list) => {
      const raw = saved?.[list.name];
      const items = Array.isArray(raw)
        ? raw
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => Object.fromEntries(list.fields.map((field) => [field.name, typeof item[field.name] === "string" ? String(item[field.name]) : ""])))
            .filter((item) => item.title)
        : [];
      return [list.name, items.length ? items : def.defaults.lists[list.name] ?? []];
    }),
  );
  return { ...fields, ...lists } as Record<string, string | Record<string, string>[]>;
}
