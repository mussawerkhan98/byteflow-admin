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
 * "post": "latest", or one published blog post, saved by its slug.
 * "category": a blog category the published posts use, saved as written.
 */
export type HomeFieldType = "text" | "textarea" | "link" | "image" | "select" | "service" | "tab" | "post" | "category";

export type HomeField = {
  name: string;
  label: string;
  type: HomeFieldType;
  help?: string;
  /** "select" only: the values it can hold, the first being the default. */
  options?: { value: string; label: string }[];
  /** "image" only: "logo" takes SVG or WebP as is; "photo" is converted to WebP before upload. */
  upload?: "logo" | "photo";
  /** The heading this field sits under on the form (see groupedFields). */
  group?: string;
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
  /** The page it is saved on: "home" when not set. */
  page?: "about-us";
  label: string;
  /** Where it sits on the home page, in plain words. */
  shows: string;
  fields: HomeField[];
  lists: HomeList[];
  defaults: { fields: Record<string, string>; lists: Record<string, Record<string, string>[]> };
  /** Pictures this section shows that are edited on another screen. */
  picturesElsewhere?: { text: string; href: string; label: string };
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
      {
        name: "all_label",
        label: "First filter tab",
        type: "text",
        help: "The tab above the smaller service cards that shows them all. The other tabs are the Services menu's groups.",
      },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "What we do",
        heading: "Services built for",
        heading_soft: "real business growth.",
        intro:
          "End-to-end technology and creative services, all under one roof so you never have to chase multiple vendors again.",
        all_label: "All services",
      },
      lists: {},
    },
  },
  {
    key: "home_work",
    label: "Selected work heading",
    shows:
      "The heading above the project cards after Services. The projects are picked on the Projects screen with “Feature on homepage” (with none ticked, the first four published projects show); the first is the large lead card with its results.",
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
      "The bright band after Selected work (light in both themes): three common starting points as cards, each linking to a service with that service's icon, and the numbered process steps under them.",
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
            name: "image",
            label: "Picture",
            type: "image",
            upload: "photo",
            help: "Optional. Replaces the drawing at the top of the card (shown about 5:2, cropped to fill). JPG, PNG, WebP or AVIF up to 5 MB, converted to WebP. Empty shows the built-in drawing.",
          },
          { name: "image_alt", label: "Picture description (alt text)", type: "text" },
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
            name: "image",
            label: "Picture",
            type: "image",
            upload: "photo",
            help: "Optional. Replaces the small illustration in the preview card (about 1200×800). Converted to WebP. Empty shows the illustration chosen above.",
          },
          { name: "image_alt", label: "Picture description (alt text)", type: "text" },
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
      {
        name: "platforms_label",
        label: "Figure 1 — label",
        type: "text",
        help: "Shown under the number of different platforms in the logos below (counted automatically).",
      },
      {
        name: "areas_label",
        label: "Figure 2 — label",
        type: "text",
        help: "Shown under the number of tabs with logos (counted automatically).",
      },
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
        platforms_label: "Platforms we support",
        areas_label: "Areas of your IT",
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
    key: "home_insights",
    label: "Insights",
    shows:
      "The soft green-grey band after Technologies: the latest blog posts, magazine style. One featured article on the left, a short list of the next newest on the right, and topic links below that open the blog on that category. Posts come from Blog posts automatically.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Text", type: "textarea" },
      { name: "link_label", label: "Link text", type: "text" },
      { name: "link", label: "Link", type: "link" },
      {
        name: "featured",
        label: "Featured article",
        type: "post",
        help: "“Latest” always features the newest published post. A picked post that is later unpublished falls back to the latest.",
      },
      {
        name: "list_count",
        label: "Articles in the list on the right",
        type: "select",
        options: ["1", "2", "3", "4", "5"].map((value) => ({ value, label: value })),
      },
      { name: "list_label", label: "List — label above it", type: "text" },
      { name: "read_label", label: "Featured article — link text", type: "text" },
      { name: "topics_label", label: "Topics — label", type: "text" },
      { name: "picked_badge", label: "Featured article — badge when you pick it", type: "text" },
      { name: "latest_badge", label: "Featured article — badge on “Latest”", type: "text" },
    ],
    lists: [
      {
        name: "topics",
        label: "Topics",
        itemLabel: "Topic",
        max: 8,
        help: "The chips under the articles, in this order. Each opens the blog on its category; a topic whose category has no published post is hidden.",
        fields: [
          { name: "title", label: "Chip text", type: "text" },
          { name: "category", label: "Blog category", type: "category" },
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
        eyebrow: "Insights",
        heading: "Better IT decisions",
        heading_soft: "start here.",
        intro: "Practical guides on IT support, security, cloud and the web for businesses in Dubai and the UAE.",
        link_label: "View all articles",
        link: "/blog",
        featured: "latest",
        list_count: "3",
        list_label: "More articles",
        read_label: "Read article",
        topics_label: "Browse by topic",
        picked_badge: "Editor's pick",
        latest_badge: "Latest",
      },
      lists: {
        topics: [
          { title: "IT Support", category: "IT Support", show: "yes" },
          { title: "Cyber Security", category: "Cyber Security", show: "yes" },
          { title: "Cloud", category: "Cloud", show: "yes" },
          { title: "Web", category: "Web Development", show: "yes" },
          { title: "Marketing", category: "Digital Marketing", show: "yes" },
        ],
      },
    },
  },
  {
    key: "home_process",
    label: "How it works",
    shows:
      "The “Our process” timeline: heading, then every step in order on one line (left to right on wide screens, top to bottom on phones), each with its timing, description and check-mark points.",
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
        help: "Shown in this order and numbered 01, 02… Five fit best on one line; more still work.",
        fields: [
          { name: "title", label: "Step title", type: "text" },
          { name: "when", label: "When (e.g. Within 24 hours)", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "points", label: "Check-mark points — one per line", type: "textarea" },
          {
            name: "image",
            label: "Picture",
            type: "image",
            upload: "photo",
            help: "Optional. Shown across the top of the step's card (16:9, cropped to fill). Converted to WebP. Empty shows the card without a picture.",
          },
          { name: "image_alt", label: "Picture description (alt text)", type: "text" },
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
      "The “Not sure which service you need?” panel under How it works. Its phone button uses the header phone from “Contact details & logo”. Hidden unless switched on: the FAQ's “Still have questions?” bar and the Contact section offer the same call / WhatsApp prompt further down.",
    fields: [
      {
        name: "show",
        label: "On the home page",
        type: "select",
        options: [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
      },
      { name: "heading", label: "Heading", type: "text" },
      { name: "description", label: "Text", type: "textarea" },
      { name: "button_label", label: "Button text", type: "text" },
      { name: "button_link", label: "Button link", type: "link" },
    ],
    lists: [],
    defaults: {
      fields: {
        show: "no",
        heading: "Not sure which service you need?",
        description: "Our team will guide you. Tell us what's slowing your business down and we'll point you to the right fit.",
        button_label: "Talk to our team",
        button_link: "/contact-us",
      },
      lists: {},
    },
  },
  {
    key: "home_reviews",
    label: "Client reviews",
    shows:
      "The reviews section: heading and rating on the left, the spotlight review on the right, and the moving wall of reviews below. The reviews themselves come from Customer reviews: tick “Featured” on one to make it the spotlight (otherwise the longest is), and set its Source to Google to show the Google badge.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Text", type: "textarea" },
      { name: "rating_label", label: "Rating — label", type: "text", help: "Under the Google rating (set in Contact details & logo)." },
      { name: "count_label", label: "Rating — review count", type: "text", help: figuresNote },
      {
        name: "google_label",
        label: "Google button text",
        type: "text",
        help: "Links to the Google Business URL in Contact details & logo; hidden while that is empty.",
      },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Client reviews",
        heading: "Trusted by businesses",
        heading_soft: "across the UAE.",
        intro: "Real words from the businesses we look after, from one-person offices to multi-site teams.",
        rating_label: "Google rating",
        count_label: "{reviews} Google reviews",
        google_label: "Read all reviews on Google",
      },
      lists: {},
    },
  },
  {
    key: "home_contact",
    label: "Contact & get started",
    shows:
      "The last section of the home page: heading, call and WhatsApp buttons and the promise line, above the contact details and enquiry form. The phone number, WhatsApp link, email and address come from Contact details & logo.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part (cyan)", type: "text" },
      { name: "intro", label: "Text", type: "textarea" },
      { name: "call_label", label: "Call button text", type: "text" },
      { name: "whatsapp_label", label: "WhatsApp button text", type: "text" },
      { name: "promises", label: "Promises", type: "textarea", help: "One per line; each shows with a check mark." },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Get started today",
        heading: "Ready to upgrade your IT setup?",
        heading_soft: "Let's talk.",
        intro:
          "Let our certified engineers handle everything, from network setup to cloud migration and cybersecurity. Send a message or call: one call is all it takes.",
        call_label: "Call us now",
        whatsapp_label: "WhatsApp us",
        promises: "No contracts required\nFree consultation\nResponse within 2 hours",
      },
      lists: {},
    },
  },
  {
    key: "home_faq",
    label: "FAQ section (all pages)",
    shows:
      "The words around the questions on every page that has FAQs: heading and intro, the “All” filter, and the “Still have questions?” card with call and WhatsApp buttons (numbers from Contact details & logo). The questions themselves are under FAQs.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part (cyan)", type: "text" },
      { name: "intro", label: "Text", type: "textarea" },
      { name: "all_label", label: "Filter — “all” button", type: "text" },
      { name: "help_title", label: "Help card — heading", type: "text" },
      { name: "help_text", label: "Help card — text", type: "textarea" },
      { name: "call_label", label: "Help card — call button", type: "text" },
      { name: "whatsapp_label", label: "Help card — WhatsApp button", type: "text" },
      { name: "search_label", label: "Search box — placeholder", type: "text" },
      { name: "empty_text", label: "Search — when nothing matches", type: "textarea" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "FAQ",
        heading: "Questions we get",
        heading_soft: "asked all the time.",
        intro: "Everything you need to know about working with Byteflow. Can't find what you're looking for? Just call us.",
        all_label: "All questions",
        help_title: "Still have questions?",
        help_text: "Talk to a real engineer: call us or send a WhatsApp message.",
        call_label: "Call us",
        whatsapp_label: "WhatsApp us",
        search_label: "Search questions",
        empty_text: "No questions match your search. Call or message us and we will answer it directly.",
      },
      lists: {},
    },
  },
];

/**
 * The About Us page's blocks, edited on the "About page sections" screen.
 * The same shape as the home page's, saved on the "about-us" page instead.
 * The top banner is that page's hero (Heroes), the founder has the "About Us
 * — Founder" screen and the people are Team members.
 */
export const aboutBlocks: HomeBlockDef[] = [
  {
    key: "about_stats",
    page: "about-us",
    label: "Figures",
    shows: "The row of figures under the top banner.",
    fields: [],
    lists: [
      {
        name: "stats",
        label: "Figures",
        itemLabel: "Figure",
        max: 4,
        help: `The figure is large, its label beneath. ${figuresNote}`,
        fields: [
          { name: "title", label: "Figure", type: "text" },
          { name: "description", label: "Label", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {},
      lists: {
        stats: [
          { title: "{clients}", description: "Businesses served across the UAE" },
          { title: "{years}+", description: "Years operating in Dubai" },
          { title: "2 hrs", description: "On-site response guarantee" },
          { title: "24/7", description: "Monitoring and support" },
        ],
      },
    },
  },
  {
    key: "about_story",
    page: "about-us",
    label: "Our story",
    shows: "The timeline after the founder: one card per milestone, the year in its marker.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: `${headingHelp} ${figuresNote}` },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
    ],
    lists: [
      {
        name: "milestones",
        label: "Milestones",
        itemLabel: "Milestone",
        max: 6,
        help: "Oldest first. The latest milestone's marker is in the brand colour.",
        fields: [
          { name: "year", label: "Year", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Our story",
        heading: "{years} years.",
        heading_soft: "One mission.",
        intro: "From a small IT support operation to a full-service technology company — here is how Byteflow grew to become one of Dubai's most trusted IT partners.",
      },
      lists: {
        milestones: [
          { year: "{founded}", title: "Byteflow is founded in Dubai", description: "Started as a lean IT support team serving small businesses in Deira and Bur Dubai. First 10 clients onboarded within the first month." },
          { year: "2019", title: "Expanded to cloud and Microsoft 365", description: "Became an official Microsoft partner. Started handling full cloud migrations and Microsoft 365 deployments for UAE businesses of all sizes." },
          { year: "2020", title: "Launched digital marketing and web services", description: "Added website development, SEO, and Google Ads to the service portfolio — giving clients a single vendor for both IT and digital growth." },
          { year: "2022", title: "Crossed 300+ business clients", description: "Expanded coverage to Sharjah and Abu Dhabi with dedicated on-site engineers. Introduced the 2-hour response SLA across all AMC plans." },
          { year: "2024", title: "{clients} businesses and still growing", description: "Now serving {clients} businesses across the UAE with a full team of certified engineers, designers, marketers and cloud specialists." },
        ],
      },
    },
  },
  {
    key: "about_principles",
    page: "about-us",
    label: "How we work",
    shows: "The numbered cards after Our story, with a button beside the heading.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "link_label", label: "Button text", type: "text", group: "Button" },
      { name: "link", label: "Button link", type: "link", group: "Button" },
    ],
    lists: [
      {
        name: "principles",
        label: "Principles",
        itemLabel: "Principle",
        max: 3,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "How we work",
        heading: "No jargon. No surprises.",
        heading_soft: "Just results.",
        link_label: "Get started",
        link: "/contact-us",
      },
      lists: {
        principles: [
          { title: "We respond in 2 hours — guaranteed", description: 'Every AMC plan includes a 2-hour on-site or remote response SLA. Not next business day. Not "as soon as possible." Two hours.' },
          { title: "Fixed price, zero hidden fees", description: "You get one monthly invoice. No call-out fees, no emergency surcharges, no per-ticket billing. We cover everything in your plan." },
          { title: "One team handles everything", description: "IT support, cloud, security, website, marketing — the same team, the same account manager, one phone number. No handoffs." },
        ],
      },
    },
  },
  {
    key: "about_services",
    page: "about-us",
    label: "What we do",
    shows: "The numbered service cards, each linking to its page.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "link_label", label: "Link text", type: "text", group: "Link" },
      { name: "link", label: "Link", type: "link", group: "Link" },
    ],
    lists: [
      {
        name: "services",
        label: "Services",
        itemLabel: "Service",
        max: 12,
        fields: [
          { name: "title", label: "Name", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "link", label: "Link", type: "link" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "What we do",
        heading: "Everything your business needs,",
        heading_soft: "under one roof.",
        link_label: "See all services",
        link: "/#services",
      },
      lists: {
        services: [
          { title: "IT AMC / IT Support", description: "Fixed monthly support for all your devices, servers and network.", link: "/it-amc-services-dubai" },
          { title: "Cyber Security", description: "Firewalls, antivirus, email protection and network monitoring.", link: "/cyber-security" },
          { title: "Cloud & Microsoft 365", description: "Full cloud setup, migration and ongoing management.", link: "/cloud-services-dubai" },
          { title: "Data Backup & Recovery", description: "Automated backups and fast recovery when disaster strikes.", link: "/data-backup-recovery" },
          { title: "System Integration", description: "Connecting all your devices, offices and cloud systems.", link: "/system-integration" },
          { title: "Website & App Development", description: "Professional websites, mobile apps and AI chatbots.", link: "/website-development" },
          { title: "Digital Marketing", description: "SEO, Google Ads and social media that drives real leads.", link: "/digital-marketing" },
          { title: "UI/UX & Graphic Design", description: "Logos, branding, social media graphics and full brand identity.", link: "/graphics-designing" },
        ],
      },
    },
  },
  {
    key: "about_team",
    page: "about-us",
    label: "Our team",
    shows: "The heading above the team cards. The section shows once a team member is published.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Our team",
        heading: "The people",
        heading_soft: "behind Byteflow.",
        intro: "Experienced specialists working together across IT, cloud, security, design and growth.",
      },
      lists: {},
    },
    picturesElsewhere: { text: "The people and their photos are on the Team members screen.", href: "/admin/team", label: "Open Team members" },
  },
  {
    key: "about_reviews",
    page: "about-us",
    label: "Reviews",
    shows: "The heading and Google rating card beside the wall of reviews. The reviews are your published Customer reviews, featured ones first.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "rating_label", label: "Rating label", type: "text", group: "Rating card", help: figuresNote },
      { name: "count_label", label: "Review count line", type: "text", group: "Rating card" },
      { name: "google_label", label: "Google link text", type: "text", group: "Rating card", help: "Links to the Google profile set in Contact details & logo." },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Client reviews",
        heading: "What our clients",
        heading_soft: "say about working with us.",
        intro: "Straight from the businesses we look after, in their own words.",
        rating_label: "Google rating",
        count_label: "{reviews} Google reviews",
        google_label: "Read all reviews on Google",
      },
      lists: {},
    },
    picturesElsewhere: { text: "The reviews themselves are on the Customer reviews screen.", href: "/admin/testimonials", label: "Open Customer reviews" },
  },
  {
    key: "about_company",
    page: "about-us",
    label: "Company information",
    shows: "The registered business details beside three cards on what stands behind the work, after the reviews.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "details_heading", label: "Details panel heading", type: "text", group: "Registered details" },
    ],
    lists: [
      {
        name: "details",
        label: "Registered details",
        itemLabel: "Detail",
        max: 12,
        help: "Keep these the same as the company details in the “Address” script (Tracking codes): Google compares the two, and a mismatch counts against the site. A link (tel:, mailto: or a web address) makes the detail clickable.",
        fields: [
          { name: "title", label: "Label", type: "text" },
          { name: "description", label: "Detail", type: "text" },
          { name: "link", label: "Link (optional)", type: "link" },
        ],
      },
      {
        name: "assurances",
        label: "Cards beside the details",
        itemLabel: "Card",
        max: 4,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Company information",
        heading: "Who you are",
        heading_soft: "actually dealing with.",
        intro: "Plenty of IT providers in Dubai are a phone number and a logo. These are our registered details, so you can check us before you sign anything — and reach a named company, at a fixed address, if something goes wrong.",
        details_heading: "Registered business details",
      },
      lists: {
        details: [
          { title: "Registered name", description: "Byteflow Information Technology Co. L.L.C.", link: "" },
          { title: "Trading as", description: "Byteflow", link: "" },
          { title: "Established", description: "{founded} — operating in Dubai for {years} years", link: "" },
          { title: "Registered office", description: "Emaar Park 4, Greens, TECOM, Dubai, United Arab Emirates", link: "" },
          { title: "Telephone", description: "+971 54 328 2042", link: "tel:+971543282042" },
          { title: "Email", description: "info@byteflow.ae", link: "mailto:info@byteflow.ae" },
          { title: "Opening hours", description: "Monday to Saturday, 9:00am to 6:00pm (GST)", link: "" },
          { title: "Areas served", description: "Dubai, Sharjah and Abu Dhabi", link: "" },
        ],
        assurances: [
          { title: "{years} years, one city", description: "Byteflow has supported businesses in Dubai since {founded}, from our first ten clients in Deira and Bur Dubai to {clients} across the UAE today." },
          { title: "Our own engineers", description: "Support is delivered by people we employ, remotely and on site. Work is not passed to a subcontractor you never meet and cannot hold to anything." },
          { title: "Accountable in writing", description: "Response times, what is covered and what is charged separately are set out in the contract before it starts, not decided after a problem happens." },
        ],
      },
    },
  },
  {
    key: "about_cta",
    page: "about-us",
    label: "Closing panel",
    shows: "The free consultation panel at the end of the page, with ways to reach you beside it. The phone, email and location are your Contact details & logo.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "link_label", label: "Button text", type: "text", group: "Button" },
      { name: "link", label: "Button link", type: "link", group: "Button" },
      { name: "phone_label", label: "Phone label", type: "text", group: "Contact rows" },
      { name: "email_label", label: "Email label", type: "text", group: "Contact rows" },
      { name: "address_label", label: "Location label", type: "text", group: "Contact rows" },
      { name: "support_label", label: "Support label", type: "text", group: "Contact rows" },
      { name: "support_text", label: "Support line", type: "text", group: "Contact rows" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Free consultation",
        heading: "Tell us about your setup.",
        heading_soft: "We will handle the rest.",
        intro: "No commitment, no sales pitch. Just a straight conversation about what your business needs and how we can help.",
        link_label: "Get in touch",
        link: "/contact-us",
        phone_label: "Phone",
        email_label: "Email",
        address_label: "Location",
        support_label: "Support",
        support_text: "24/7 — always available",
      },
      lists: {},
    },
  },
];

/**
 * The headings a block's fields sit under on the form, by field name. A
 * field not listed sits under "Heading" when it is one of the usual heading
 * fields, otherwise under "More".
 */
const FIELD_GROUPS: Record<string, Record<string, string>> = {
  home_work: { link_label: "Button", link: "Button" },
  home_needs: {
    link_label: "Button on the right",
    link: "Button on the right",
    steps: "Bottom line",
    steps_link_label: "Bottom line",
    steps_link: "Bottom line",
  },
  home_promise: {
    seal_text: "Seal",
    footer_text: "Footer line",
    footer_strong: "Footer line",
    link_label: "Footer line",
    link_href: "Footer line",
  },
  home_tech: { link_label: "Button", link: "Button", note: "Labels", platforms_label: "Labels", areas_label: "Labels" },
  home_insights: {
    link_label: "Button",
    link: "Button",
    featured: "Articles",
    list_count: "Articles",
    list_label: "Labels",
    read_label: "Labels",
    topics_label: "Labels",
    picked_badge: "Labels",
    latest_badge: "Labels",
  },
  home_reviews: { rating_label: "Rating labels", count_label: "Rating labels", google_label: "Rating labels" },
  home_contact: { call_label: "Buttons", whatsapp_label: "Buttons", promises: "Promises" },
  home_faq: {
    all_label: "Search and topics",
    search_label: "Search and topics",
    empty_text: "Search and topics",
    help_title: "Help bar",
    help_text: "Help bar",
    call_label: "Help bar",
    whatsapp_label: "Help bar",
  },
  home_help: { show: "Visibility", heading: "Panel", description: "Panel", button_label: "Button", button_link: "Button" },
};
const HEADING_FIELDS = new Set(["eyebrow", "heading", "heading_soft", "intro"]);

/** A block's fields under their headings, in the order the headings first appear. */
export function groupedFields(def: HomeBlockDef): { label: string; fields: HomeField[] }[] {
  const groups: { label: string; fields: HomeField[] }[] = [];
  for (const field of def.fields) {
    const label = field.group ?? FIELD_GROUPS[def.key]?.[field.name] ?? (HEADING_FIELDS.has(field.name) ? "Heading" : "More");
    let group = groups.find((g) => g.label === label);
    if (!group) groups.push((group = { label, fields: [] }));
    group.fields.push(field);
  }
  return groups;
}

/** Sections whose pictures are uploaded on another screen, and where. */
const PICTURES_ELSEWHERE: Record<string, HomeBlockDef["picturesElsewhere"]> = {
  home_services_intro: { text: "Each service's picture and icon are uploaded on the Services screen.", href: "/admin/services", label: "Open Services" },
  home_work: { text: "Each project's card picture is uploaded on the Projects screen (Homepage card — image).", href: "/admin/projects", label: "Open Projects" },
  home_insights: { text: "Article pictures are each blog post's featured image.", href: "/admin/posts", label: "Open Blog posts" },
  home_reviews: { text: "Reviewer photos are uploaded with each review.", href: "/admin/testimonials", label: "Open Customer reviews" },
};
for (const block of homeBlocks) block.picturesElsewhere ??= PICTURES_ELSEWHERE[block.key];

export const homeBlockKeys = homeBlocks.map((block) => block.key);

/** A home or About page block by its key. */
export function getHomeBlockDef(key: string | null): HomeBlockDef | undefined {
  return [...homeBlocks, ...aboutBlocks].find((block) => block.key === key);
}

const LIMITS: Record<HomeFieldType, number> = { text: 200, textarea: 2000, link: 500, image: 500, select: 40, service: 100, tab: 200, post: 200, category: 200 };

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
  // A post slug, or "latest" (also for anything that isn't a slug).
  if (field.type === "post") return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : "latest";
  return field.type === "link" || field.type === "image" ? safeUrl(value, field.type) : value;
}

/**
 * The content to save for a block: only its own fields, trimmed and capped,
 * lists cut to their maximum and stripped of items with no title.
 */
/**
 * What a block can't be saved with, beyond what sanitizeHomeBlock already
 * cleans up; null when it is fine. A list item's uploaded picture needs its
 * own description (`<picture>_alt`).
 */
export function checkHomeBlock(def: HomeBlockDef, content: Record<string, unknown>): string | null {
  for (const list of def.lists) {
    const items = Array.isArray(content[list.name]) ? (content[list.name] as Record<string, string>[]) : [];
    for (const field of list.fields.filter((f) => f.type === "image")) {
      const altName = `${field.name}_alt`;
      if (!list.fields.some((f) => f.name === altName)) continue;
      const index = items.findIndex((item) => item[field.name] && !String(item[altName] ?? "").trim());
      if (index >= 0)
        return `${list.itemLabel} ${index + 1}: describe the picture (alt text), so screen readers and Google can read it.`;
    }
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
