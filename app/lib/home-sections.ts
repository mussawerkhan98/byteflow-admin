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

/**
 * "service": one of the published services, saved by its slug.
 * "tab": one of the titles in the same block's "tabs" list, saved as that title.
 */
export type HomeFieldType = "text" | "textarea" | "link" | "image" | "select" | "service" | "tab";

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
      "The dark navy About section: heading and paragraph, then the numbered reasons on the right. The light card on the left shows the reason under the pointer, with a small picture and a link to its service; on phones each reason opens like an accordion.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text", help: figuresNote },
      { name: "heading", label: "Heading — first part (white)", type: "text" },
      { name: "heading_soft", label: "Heading — second part (grey)", type: "text", help: figuresNote },
      { name: "intro", label: "Paragraph", type: "textarea" },
    ],
    lists: [
      {
        name: "highlights",
        label: "Reasons",
        itemLabel: "Reason",
        max: 4,
        help: "Numbered in this order. Each one's text and link show in the preview card; a link to a service page is labelled with that service's name.",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text (one or two lines)", type: "textarea" },
          { name: "link", label: "Link — the related service page", type: "link" },
          {
            name: "icon",
            label: "Picture in the preview card",
            type: "select",
            options: [
              { value: "layers", label: "One team: network, cloud, security, web" },
              { value: "receipt", label: "Fixed monthly plan" },
              { value: "clock", label: "Response timeline (on site within 2 hours)" },
              { value: "cloud", label: "Microsoft 365 set up" },
              { value: "shield", label: "Protection: firewall, endpoint, email" },
              { value: "chat", label: "Support chat" },
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
        eyebrow: "About Byteflow · Since {founded}",
        heading: "Your trusted IT partner,",
        heading_soft: "serving Dubai since {founded}.",
        intro:
          "We make enterprise-grade IT accessible to every business in the UAE, so you can focus entirely on growth.",
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
    key: "home_tech",
    label: "Technologies",
    shows:
      "The dark navy band after the Service promise: heading and text on the left, and on the right one tab per area (Microsoft, Security …) with the vendors' logos. A tab with no logo to show is hidden.",
    fields: [
      { name: "eyebrow", label: "Small tag", type: "text" },
      { name: "heading", label: "Heading — first part (white)", type: "text" },
      { name: "heading_soft", label: "Heading — second part (cyan)", type: "text" },
      { name: "intro", label: "Text", type: "textarea" },
      { name: "link_label", label: "Link text", type: "text" },
      { name: "link", label: "Link", type: "link" },
      { name: "note", label: "Small note under the logos", type: "text" },
    ],
    lists: [
      {
        name: "tabs",
        label: "Tabs",
        itemLabel: "Tab",
        max: 8,
        help: "In this order. Renaming a tab moves its logos with it.",
        fields: [
          { name: "title", label: "Tab name", type: "text" },
          { name: "description", label: "Line above the logos", type: "text" },
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
      {
        name: "logos",
        label: "Logos",
        itemLabel: "Logo",
        max: 80,
        help: "Only vendors you really work with. Each shows under its tab, in this order. Without a logo picture, the tile shows the name's initials.",
        fields: [
          { name: "title", label: "Vendor name", type: "text" },
          { name: "tab", label: "Tab", type: "tab" },
          {
            name: "show",
            label: "On the website",
            type: "select",
            options: [
              { value: "yes", label: "Show" },
              { value: "no", label: "Hide" },
            ],
          },
          { name: "logo", label: "Logo", type: "image", upload: "logo", help: "SVG works best. Leave empty to show the name's initials." },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Technologies",
        heading: "The tools behind",
        heading_soft: "reliable IT.",
        intro: "Proven platforms we install, configure and support, chosen to fit your business rather than our habits.",
        link_label: "Discuss your project",
        link: "/contact-us",
        note: "Technology choices depend on your setup and budget.",
      },
      lists: {
        tabs: [
          { title: "Microsoft", description: "Email, files, meetings and cloud for your whole team.", show: "yes" },
          { title: "Security", description: "Firewalls, CCTV and access control that protect people and data.", show: "yes" },
          { title: "Networking", description: "Switching, routing and Wi-Fi for offices of every size.", show: "yes" },
          { title: "Backup", description: "Copies of your data you can restore when something goes wrong.", show: "yes" },
          { title: "Cloud", description: "Cloud platforms we migrate to and manage.", show: "yes" },
          { title: "Web", description: "Websites, apps and tools built for the UAE market.", show: "yes" },
        ],
        logos: [
          { title: "Microsoft 365", tab: "Microsoft", logo: "", show: "yes" },
          { title: "Microsoft Azure", tab: "Microsoft", logo: "", show: "yes" },
          { title: "Microsoft Teams", tab: "Microsoft", logo: "", show: "yes" },
          { title: "SharePoint", tab: "Microsoft", logo: "", show: "yes" },
          { title: "Exchange Online", tab: "Microsoft", logo: "", show: "yes" },
          { title: "Fortinet", tab: "Security", logo: "", show: "yes" },
          { title: "Hikvision", tab: "Security", logo: "", show: "yes" },
          { title: "ZKTeco", tab: "Security", logo: "", show: "yes" },
          { title: "Cisco", tab: "Networking", logo: "", show: "yes" },
          { title: "Ubiquiti", tab: "Networking", logo: "", show: "yes" },
          { title: "HPE Aruba", tab: "Networking", logo: "", show: "yes" },
          { title: "Fortinet", tab: "Networking", logo: "", show: "yes" },
          { title: "Microsoft Azure", tab: "Cloud", logo: "", show: "yes" },
          { title: "Microsoft 365", tab: "Cloud", logo: "", show: "yes" },
          { title: "Google Workspace", tab: "Cloud", logo: "", show: "yes" },
          { title: "React", tab: "Web", logo: "", show: "yes" },
          { title: "Node.js", tab: "Web", logo: "", show: "yes" },
          { title: "Laravel", tab: "Web", logo: "", show: "yes" },
          { title: "Python", tab: "Web", logo: "", show: "yes" },
          { title: "Flutter", tab: "Web", logo: "", show: "yes" },
          { title: "WordPress", tab: "Web", logo: "", show: "yes" },
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

const LIMITS: Record<HomeFieldType, number> = { text: 200, textarea: 2000, link: 500, image: 500, select: 40, service: 100, tab: 200 };

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
