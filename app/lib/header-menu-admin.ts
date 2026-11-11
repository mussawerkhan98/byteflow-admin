/**
 * The Header Menu screen: what it edits, the limits that keep the website's
 * header from breaking, and the rows the migration seeds.
 *
 * It is stored in four tables (scripts/migrate-header-menu.mjs creates them):
 *
 * - header_nav_items      the entries in the bar, in order
 * - header_mega_groups    the column groups of the Services and Industries menus
 * - header_mega_items     the links inside those groups
 * - header_menu_settings  key/value wording and switches (intro, featured
 *                         card, footer strips, Insights, theme toggle)
 *
 * The button and the phone switch stay in site_settings, where the website
 * already reads them. The website (byteflow, app/lib/header-model.ts) holds
 * the same setting keys and defaults; keep the two in step.
 *
 * No imports, no database: the screen, the API and the migration script all
 * use it, and the rules can be tested directly.
 */

export type NavKind = "link" | "services" | "industries" | "insights";
export const NAV_KINDS: { value: NavKind; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "services", label: "Mega menu — Services" },
  { value: "industries", label: "Mega menu — Industries" },
  { value: "insights", label: "Mega menu — Insights (blog)" },
];

export type MegaMenu = "services" | "industries";

export type NavRow = { label: string; href: string; kind: NavKind; visible: boolean; new_tab: boolean };
export type MegaItem = { service_id: number | null; label: string; href: string; description: string; visible: boolean };
export type MegaGroup = { title: string; visible: boolean; items: MegaItem[] };
export type Cta = { label: string; short_label: string; link: string; show_phone: boolean };

/** Lengths past which the header's layout starts to break. */
export const LIMITS = {
  navLabel: 24,
  ctaLabel: 28,
  ctaShortLabel: 14,
  groupTitle: 34,
  itemLabel: 36,
  itemDescription: 48,
  heading: 70,
  text: 160,
  short: 40,
  url: 300,
  navItems: 8,
  groups: 4,
  itemsPerGroup: 8,
} as const;

// ── Settings ────────────────────────────────────────────────────────────────

export const SETTING_DEFAULTS = {
  "header.theme_toggle": "1",

  "services.intro_eyebrow": "Our services",
  "services.intro_heading": "Everything IT, under one roof.",
  "services.intro_text": "Support, cloud, security and creative work from one accountable team.",
  "services.intro_link_label": "View all services",
  "services.intro_link": "/services",
  "services.featured_show": "1",
  "services.featured_eyebrow": "Most popular",
  "services.featured_title": "IT AMC plans",
  "services.featured_text": "",
  "services.featured_stat1_value": "2 hrs",
  "services.featured_stat1_label": "On-site response",
  "services.featured_stat2_value": "24/7",
  "services.featured_stat2_label": "Monitoring",
  "services.featured_button_label": "See plans",
  "services.featured_button_link": "/it-amc-services-dubai",
  "services.preview_show": "1",
  "services.preview_button_label": "View service",
  "services.footer_text": "Not sure which one fits?",
  "services.footer_link_label": "Ask an engineer",
  "services.footer_link": "/contact-us",
  "services.whatsapp_show": "1",
  "services.whatsapp_label": "WhatsApp us",

  "industries.heading": "Industries we serve",
  "industries.intro_heading": "IT that fits the way your sector works.",
  "industries.intro_text": "Clinics, schools, shops, warehouses and offices each run on different systems. See what usually gets in the way in yours, and how we handle it.",
  "industries.view_all_label": "View all industries",
  "industries.view_all_link": "/industries",
  "industries.preview_show": "1",
  "industries.preview_button_label": "See how we help",

  "insights.eyebrow": "Insights",
  "insights.heading": "Practical IT advice for UAE businesses.",
  "insights.text": "Straight answers on IT costs, security and support, from the engineers who do the work.",
  "insights.view_all_label": "View all articles",
  "insights.view_all_link": "/blog",
  "insights.categories": "auto",
  "insights.latest_count": "3",
  "insights.preview_show": "1",
  "insights.preview_button_label": "Read article",
  "insights.footer_text": "New articles every week",
  "insights.footer_link_label": "Read the blog",
  "insights.footer_link": "/blog",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type FieldType = "text" | "textarea" | "link" | "switch" | "number";
export type SettingField = { key: SettingKey; label: string; type: FieldType; max?: number; help?: string };

const text = (key: SettingKey, label: string, max: number = LIMITS.short, help?: string): SettingField => ({
  key, label, type: "text", max, help,
});
const link = (key: SettingKey, label: string, help?: string): SettingField => ({
  key, label, type: "link", max: LIMITS.url, help,
});
const toggle = (key: SettingKey, label: string, help?: string): SettingField => ({ key, label, type: "switch", help });

/** The settings each tab edits, in the order the form shows them. */
export const SETTING_SECTIONS: Record<"bar" | "services" | "industries" | "insights", { title: string; fields: SettingField[] }[]> = {
  bar: [
    { title: "Bar options", fields: [toggle("header.theme_toggle", "Show the dark / light mode switch", "In the bar on desktop and in the phone menu.")] },
  ],
  services: [
    {
      title: "Intro (left column)",
      fields: [
        text("services.intro_eyebrow", "Small heading"),
        text("services.intro_heading", "Heading", LIMITS.heading),
        { key: "services.intro_text", label: "Text", type: "textarea", max: LIMITS.text },
        text("services.intro_link_label", "Link text"),
        link("services.intro_link", "Link", "/#services jumps to the services on the home page."),
      ],
    },
    {
      title: "Featured card (right column)",
      fields: [
        toggle("services.featured_show", "Show the featured card"),
        text("services.featured_eyebrow", "Small heading"),
        text("services.featured_title", "Title", LIMITS.short),
        { key: "services.featured_text", label: "Text (optional)", type: "textarea", max: 110 },
        text("services.featured_stat1_value", "Stat 1 — value", 10),
        text("services.featured_stat1_label", "Stat 1 — label", 24),
        text("services.featured_stat2_value", "Stat 2 — value", 10),
        text("services.featured_stat2_label", "Stat 2 — label", 24),
        text("services.featured_button_label", "Button text", 20),
        link("services.featured_button_link", "Button link"),
      ],
    },
    {
      title: "Service preview (right column)",
      fields: [
        toggle(
          "services.preview_show",
          "Preview a service when it is pointed at",
          "Pointing at a service in the menu shows it in the right column, in place of the featured card: its picture, its subtitle and a button to its page. The picture and subtitle come from Services (Image, and Home tab — subtitle); a service without a picture shows its icon. The featured card comes back when the menu closes.",
        ),
        text("services.preview_button_label", "Button text", 20),
      ],
    },
    {
      title: "Footer strip",
      fields: [
        text("services.footer_text", "Left text", 60),
        text("services.footer_link_label", "Link text", 30, "Leave blank for no link."),
        link("services.footer_link", "Link"),
        toggle("services.whatsapp_show", "Show the WhatsApp link", "Opens the WhatsApp number from Contact details & logo."),
        text("services.whatsapp_label", "WhatsApp link text", 24),
      ],
    },
  ],
  industries: [
    {
      title: "Intro (left column)",
      fields: [
        text("industries.heading", "Small heading", LIMITS.short),
        text("industries.intro_heading", "Heading", LIMITS.heading),
        { key: "industries.intro_text", label: "Text", type: "textarea", max: LIMITS.text },
        text("industries.view_all_label", "“View all” link text", 30, "Also where clicking “Industries” in the menu bar goes. Leave blank for neither."),
        link("industries.view_all_link", "“View all” link", "/industries is the Industries page."),
      ],
    },
    {
      title: "Industry preview (right column)",
      fields: [
        toggle(
          "industries.preview_show",
          "Preview an industry when it is pointed at",
          "Shows the industry pointed at (the first one until then): its icon, summary and first three points from the Industries page screen, and a button to its card. An industry left without a link here opens the card of the same name on the Industries page.",
        ),
        text("industries.preview_button_label", "Button text", 20),
      ],
    },
  ],
  insights: [
    {
      title: "Intro (left column)",
      fields: [
        text("insights.eyebrow", "Small heading"),
        text("insights.heading", "Heading", LIMITS.heading),
        { key: "insights.text", label: "Short line", type: "textarea", max: LIMITS.text },
        text("insights.view_all_label", "“View all” link text", 30),
        link("insights.view_all_link", "“View all” link"),
      ],
    },
    {
      title: "Topics and latest articles",
      fields: [
        {
          key: "insights.categories",
          label: "Topics to show",
          type: "textarea",
          max: 400,
          help: "“auto” lists the six categories with the most posts. Or type category names, one per line, in the order you want them. Only categories with published posts are shown.",
        },
        { key: "insights.latest_count", label: "Number of latest articles", type: "number", help: "1 to 6. The newest published posts." },
      ],
    },
    {
      title: "Article preview (right column)",
      fields: [
        toggle(
          "insights.preview_show",
          "Show a large preview of the article pointed at",
          "A column on the right with the article's picture, title and date: the newest article at first, then whichever article is pointed at. Pointing at a topic shows that topic's newest article. Wide screens only. The picture is the post's own image (Blog posts).",
        ),
        text("insights.preview_button_label", "Button text", 20),
      ],
    },
    {
      title: "Footer strip",
      fields: [
        text("insights.footer_text", "Left text", 60),
        text("insights.footer_link_label", "Link text", 30),
        link("insights.footer_link", "Link"),
      ],
    },
  ],
};

export const settingFields = (section: keyof typeof SETTING_SECTIONS) =>
  SETTING_SECTIONS[section].flatMap((group) => group.fields);

/** Saved values over the defaults, as strings for the form. */
export function settingsWithDefaults(saved: Record<string, unknown> | null | undefined): Record<SettingKey, string> {
  return Object.fromEntries(
    Object.entries(SETTING_DEFAULTS).map(([key, fallback]) => {
      const value = saved?.[key];
      return [key, typeof value === "string" ? value : fallback];
    }),
  ) as Record<SettingKey, string>;
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * A link must be a path on this site ("/contact-us", "/#services") or a full
 * https:// address. Returns the problem, or null when it is fine.
 */
export function linkProblem(value: string, { required = true } = {}): string | null {
  const href = value.trim();
  if (!href) return required ? "Add a link." : null;
  if (href.length > LIMITS.url) return `Keep the link under ${LIMITS.url} characters.`;
  if (/\s/.test(href)) return "A link cannot contain spaces.";
  if (/^\/(?!\/)/.test(href)) return null;
  if (/^https:\/\/[^/\s]+\.[^/\s]+/i.test(href)) return null;
  return "Use a path on this site starting with / (like /contact-us) or a full https:// address.";
}

export const lengthProblem = (value: string, max: number) =>
  value.trim().length > max ? `Keep it under ${max} characters (now ${value.trim().length}).` : null;

/** Internal paths a save points at, for the "does this page exist?" check. */
export function internalLinks(hrefs: string[]): string[] {
  const paths = hrefs
    .map((href) => href.trim())
    .filter((href) => /^\/(?!\/)/.test(href))
    .map((href) => href.split(/[?#]/)[0] || "/");
  return [...new Set(paths)];
}

type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const bool = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

export function sanitizeSettings(section: keyof typeof SETTING_SECTIONS, body: unknown): Result<Record<string, string>> {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const value: Record<string, string> = {};
  for (const field of settingFields(section)) {
    const raw = input[field.key];
    if (field.type === "switch") {
      value[field.key] = bool(raw) ? "1" : "0";
      continue;
    }
    const v = str(raw);
    if (field.type === "number") {
      const n = Number.parseInt(v || SETTING_DEFAULTS[field.key], 10);
      if (!Number.isFinite(n) || n < 1 || n > 6) errors.push(`${field.label}: use a number from 1 to 6.`);
      value[field.key] = String(n);
      continue;
    }
    if (field.max && v.length > field.max) errors.push(`${field.label}: ${lengthProblem(v, field.max)}`);
    if (field.type === "link" && v) {
      const problem = linkProblem(v);
      if (problem) errors.push(`${field.label}: ${problem}`);
    }
    value[field.key] = v;
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function sanitizeNav(body: unknown): Result<NavRow[]> {
  const rows = Array.isArray(body) ? body : [];
  const errors: string[] = [];
  if (rows.length > LIMITS.navItems) errors.push(`Keep the bar to ${LIMITS.navItems} entries or fewer.`);
  const kinds = new Set(NAV_KINDS.map((kind) => kind.value));
  const value: NavRow[] = rows.slice(0, LIMITS.navItems).map((raw, index) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const name = `Entry ${index + 1}`;
    const label = str(row.label);
    const kind = (kinds.has(row.kind as NavKind) ? row.kind : "link") as NavKind;
    const href = str(row.href);
    if (!label) errors.push(`${name}: add a label.`);
    const tooLong = lengthProblem(label, LIMITS.navLabel);
    if (tooLong) errors.push(`${name} (“${label}”): ${tooLong}`);
    // Mega menus open from a button; Insights and Services also link to their
    // pages (Services to /services when left blank).
    const problem = linkProblem(href, { required: kind === "link" || kind === "insights" });
    if (problem) errors.push(`${name} (“${label}”): ${problem}`);
    return { label, href, kind, visible: bool(row.visible), new_tab: bool(row.new_tab) };
  });
  for (const kind of ["services", "industries", "insights"] as const) {
    if (value.filter((row) => row.kind === kind).length > 1)
      errors.push(`Only one entry can open the ${kind} menu.`);
  }
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function sanitizeCta(body: unknown): Result<Cta> {
  const row = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const value = { label: str(row.label), short_label: str(row.short_label), link: str(row.link), show_phone: bool(row.show_phone) };
  const errors = [
    lengthProblem(value.label, LIMITS.ctaLabel) && `Button text: ${lengthProblem(value.label, LIMITS.ctaLabel)}`,
    lengthProblem(value.short_label, LIMITS.ctaShortLabel) &&
      `Button text on phones: ${lengthProblem(value.short_label, LIMITS.ctaShortLabel)}`,
    value.link && linkProblem(value.link) && `Button link: ${linkProblem(value.link)}`,
  ].filter((error): error is string => Boolean(error));
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/**
 * The groups of the Services or Industries menu. An Industries link may be
 * left blank: the website then opens the card of the same name on its
 * Industries page, or leaves the industry out when there is none.
 */
export function sanitizeGroups(menu: MegaMenu, body: unknown): Result<MegaGroup[]> {
  const groups = Array.isArray(body) ? body : [];
  const errors: string[] = [];
  if (groups.length > LIMITS.groups) errors.push(`Keep it to ${LIMITS.groups} groups or fewer.`);
  const value = groups.slice(0, LIMITS.groups).map((raw, g) => {
    const group = (raw ?? {}) as Record<string, unknown>;
    const title = str(group.title);
    const gname = `Group ${g + 1}${title ? ` (“${title}”)` : ""}`;
    if (!title && menu === "services") errors.push(`${gname}: add a name.`);
    const tooLong = lengthProblem(title, LIMITS.groupTitle);
    if (tooLong) errors.push(`${gname}: ${tooLong}`);
    const items = Array.isArray(group.items) ? group.items : [];
    if (items.length > LIMITS.itemsPerGroup) errors.push(`${gname}: keep it to ${LIMITS.itemsPerGroup} links or fewer.`);
    return {
      title,
      visible: bool(group.visible),
      items: items.slice(0, LIMITS.itemsPerGroup).map((rawItem, i) => {
        const item = (rawItem ?? {}) as Record<string, unknown>;
        const label = str(item.label);
        const href = str(item.href);
        const description = str(item.description);
        const name = `${gname}, link ${i + 1}${label ? ` (“${label}”)` : ""}`;
        if (!label) errors.push(`${name}: add a label.`);
        const labelLong = lengthProblem(label, LIMITS.itemLabel);
        if (labelLong) errors.push(`${name}: ${labelLong}`);
        const descLong = lengthProblem(description, LIMITS.itemDescription);
        if (descLong) errors.push(`${name} description: ${descLong}`);
        const problem = linkProblem(href, { required: menu === "services" });
        if (problem) errors.push(`${name}: ${problem}`);
        const id = Number(item.service_id);
        return {
          service_id: Number.isInteger(id) && id > 0 ? id : null,
          label,
          href,
          description,
          visible: bool(item.visible),
        };
      }),
    };
  });
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

// ── Seed ────────────────────────────────────────────────────────────────────

/** The Services menu as the website shows it before anything is saved. */
export const DEFAULT_SERVICE_GROUPS: { title: string; items: { label: string; href: string; description: string }[] }[] = [
  {
    title: "IT Support & Infrastructure",
    items: [
      { label: "IT AMC / IT Support", href: "/it-amc-services-dubai", description: "Fixed monthly support plans" },
      { label: "System Integration", href: "/system-integration", description: "Every device, one system" },
      { label: "Data Backup & Recovery", href: "/data-backup-recovery", description: "Survive ransomware & failure" },
    ],
  },
  {
    title: "Cloud & Security",
    items: [
      { label: "Cloud / Microsoft 365", href: "/cloud-services-dubai", description: "Migration & management" },
      { label: "Cyber Security", href: "/cyber-security", description: "Firewalls, endpoint, email" },
    ],
  },
  {
    title: "Digital & Creative",
    items: [
      { label: "Website / Apps / Bots", href: "/website-development", description: "Built for the UAE market" },
      { label: "Landing Page Design", href: "/landing-page-designing", description: "Pages built to convert" },
      { label: "UI/UX & Graphics", href: "/graphics-designing", description: "Brand & interface design" },
      { label: "Digital Marketing", href: "/digital-marketing", description: "Measurable monthly leads" },
    ],
  },
];

export const DEFAULT_INDUSTRIES = [
  "Clinics & Healthcare",
  "Schools & Education",
  "Real Estate",
  "Retail & Ecommerce",
  "Logistics",
  "Hospitality",
  "Corporate Offices & SMEs",
];

const SERVICES_LABEL = /^(our\s+)?services$/i;
const INDUSTRIES_LABEL = /^industries$/i;
const BLOG = /^\/blog\/?$/;

export type SeedInput = {
  /** Top-level "Header & footer links" entries in the header, in order. */
  menuItems: { label: string; href: string; visible: boolean; new_tab: boolean }[];
  /** site_settings, for the button link and the Services strip wording. */
  siteSettings: Record<string, unknown> | null;
  /** A saved header_menu home block, if the older screen was used. */
  savedBlock: Record<string, unknown> | null;
  /** Published services; a menu link to one takes its title. */
  services: { id: number; slug: string; title?: string }[];
};

export type Seed = {
  nav: NavRow[];
  groups: { menu: MegaMenu; title: string; items: MegaItem[] }[];
  settings: Record<string, string>;
};

/**
 * The header as it is today, as Header Menu rows, so the site looks the same
 * the moment the migration runs. The bar's links come from "Header & footer
 * links" (the logo already goes home and the button to its own page, so those
 * two are left out); a /blog link becomes the Insights menu; Industries is
 * added after Services, switched off.
 */
export function buildSeed(input: SeedInput): Seed {
  const s = input.siteSettings ?? {};
  const ctaLink = str(s.header_cta_link) || "/contact-us";
  const block = input.savedBlock ?? {};
  const serviceFor = (href: string) =>
    input.services.find((service) => `/${service.slug}` === href.split(/[?#]/)[0]);
  const serviceId = (href: string) => serviceFor(href)?.id ?? null;
  // One name per service: a link to a service page uses that service's title.
  const serviceLabel = (href: string, label: string) => serviceFor(href)?.title || label;

  const nav: NavRow[] = [];
  for (const item of input.menuItems) {
    const label = item.label.trim();
    const href = item.href.trim();
    if (!label || href === "/" || href === ctaLink) continue;
    if (SERVICES_LABEL.test(label)) nav.push({ label, href: "", kind: "services", visible: item.visible, new_tab: false });
    else if (INDUSTRIES_LABEL.test(label)) nav.push({ label, href: "", kind: "industries", visible: false, new_tab: false });
    else if (BLOG.test(href)) nav.push({ label, href, kind: "insights", visible: item.visible, new_tab: false });
    else if (href && href !== "#") nav.push({ label, href, kind: "link", visible: item.visible, new_tab: item.new_tab });
  }
  if (!nav.length)
    nav.push(
      { label: "Services", href: "", kind: "services", visible: true, new_tab: false },
      { label: "Projects", href: "/projects", kind: "link", visible: true, new_tab: false },
      { label: "About", href: "/about-us", kind: "link", visible: true, new_tab: false },
      { label: "Insights", href: "/blog", kind: "insights", visible: true, new_tab: false },
    );
  if (!nav.some((row) => row.kind === "industries")) {
    const after = nav.findIndex((row) => row.kind === "services");
    nav.splice(after + 1, 0, { label: "Industries", href: "", kind: "industries", visible: false, new_tab: false });
  }

  // A saved header_menu block wins over the built-in Services menu.
  const savedServices = Array.isArray(block.services) ? (block.services as Record<string, unknown>[]) : [];
  const serviceGroups: Seed["groups"] = [];
  if (savedServices.length) {
    for (const item of savedServices) {
      const title = str(item.group) || "Services";
      let group = serviceGroups.find((g) => g.title.toLowerCase() === title.toLowerCase());
      if (!group) serviceGroups.push((group = { menu: "services", title, items: [] }));
      const href = str(item.link);
      group.items.push({ service_id: serviceId(href), label: serviceLabel(href, str(item.title)), href, description: str(item.description), visible: true });
    }
  } else {
    for (const group of DEFAULT_SERVICE_GROUPS)
      serviceGroups.push({
        menu: "services",
        title: group.title,
        items: group.items.map((item) => ({ ...item, label: serviceLabel(item.href, item.label), service_id: serviceId(item.href), visible: true })),
      });
  }

  const savedIndustries = Array.isArray(block.industries) ? (block.industries as Record<string, unknown>[]) : [];
  const industries: MegaItem[] = (savedIndustries.length
    ? savedIndustries.map((item) => ({ label: str(item.title), href: str(item.link) }))
    : DEFAULT_INDUSTRIES.map((label) => ({ label, href: "" }))
  )
    // An anchor on the home page leads nowhere; blank means "no page yet".
    .map((item) => ({ ...item, href: /^\/?#/.test(item.href) ? "" : item.href, service_id: null, description: "", visible: true }));

  const stats = Array.isArray(block.stats) ? (block.stats as Record<string, unknown>[]) : [];
  const fromBlock = (key: string) => str(block[key]);
  const settings: Record<string, string> = { ...SETTING_DEFAULTS };
  const overrides: [SettingKey, string][] = [
    ["services.intro_eyebrow", fromBlock("eyebrow")],
    ["services.intro_heading", fromBlock("heading")],
    ["services.intro_text", fromBlock("description")],
    ["services.intro_link_label", fromBlock("link_label")],
    ["services.intro_link", fromBlock("link")],
    ["services.featured_eyebrow", fromBlock("featured_eyebrow")],
    ["services.featured_title", fromBlock("featured_title")],
    ["services.featured_button_label", fromBlock("featured_label")],
    ["services.featured_button_link", fromBlock("featured_link")],
    ["services.featured_stat1_value", str(stats[0]?.title)],
    ["services.featured_stat1_label", str(stats[0]?.description)],
    ["services.featured_stat2_value", str(stats[1]?.title)],
    ["services.featured_stat2_label", str(stats[1]?.description)],
    ["services.whatsapp_label", fromBlock("whatsapp_label")],
    ["services.footer_text", str(s.header_dropdown_note)],
    ["services.footer_link_label", str(s.header_dropdown_cta)],
    ["services.footer_link", str(s.header_cta_link)],
    ["industries.heading", fromBlock("industries_heading")],
  ];
  for (const [key, value] of overrides) if (value) settings[key] = value;

  return {
    nav,
    groups: [...serviceGroups, { menu: "industries", title: "Industries", items: industries }],
    settings,
  };
}
