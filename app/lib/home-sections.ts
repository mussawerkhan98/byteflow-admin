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
 * "menugroup": one of the Services menu's groups (Header menu), saved as its name.
 */
export type HomeFieldType = "text" | "textarea" | "link" | "image" | "select" | "service" | "tab" | "post" | "category" | "menugroup";

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
  /** The page it is saved on (its slug): "home" when not set. */
  page?: string;
  /** The page_sections section_type it is saved as, when not its key (service pages). */
  sectionType?: string;
  /**
   * The block's starting wording lives on the website (service pages): the
   * form begins from /api/service-defaults?slug=…&section=… there.
   */
  remoteDefaults?: { slug: string; section: string };
  /** Where "View the page" goes, when the screen's blocks are on different pages. */
  preview?: string;
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
      "The About section: heading and paragraph, then a large photograph beside the numbered reasons, each with its text and a link to its service. The photograph is built into the design; reasons have no pictures of their own.",
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
        help: "Numbered in this order, each with its text and link; a link to a service page is labelled with that service's name.",
        // No picture or illustration fields: the current design shows one
        // built-in photograph beside the reasons, none per reason.
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text (one or two lines)", type: "textarea" },
          { name: "link", label: "Link — the related service page", type: "link" },
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
        help: "Only vendors you really work with. Each shows under its tab, in this order. Without a logo picture, the tile shows a small dot before the name.",
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
          { name: "logo", label: "Logo", type: "image", upload: "logo", help: "SVG works best. Leave empty to show a small dot before the name." },
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
          { title: "8", description: "IT, cloud and digital services" },
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
        heading: "{years} years of IT in Dubai.",
        heading_soft: "One mission.",
        intro: "From a small IT support operation to a full-service technology company — here is how Byteflow grew to become one of Dubai's most trusted IT partners.",
      },
      lists: {
        milestones: [
          { year: "{founded}", title: "Byteflow is founded in Dubai", description: "Started as a lean IT support team serving small businesses in Deira and Bur Dubai. First 10 clients onboarded within the first month." },
          { year: "2019", title: "Expanded to cloud and Microsoft 365", description: "Became an official Microsoft partner. Started handling full cloud migrations and Microsoft 365 deployments for UAE businesses of all sizes." },
          { year: "2020", title: "Launched digital marketing and web services", description: "Added website development, SEO, and Google Ads to the service portfolio — giving clients a single vendor for both IT and digital growth." },
          { year: "2022", title: "Crossed 300+ business clients", description: "Expanded coverage to Sharjah and Abu Dhabi with dedicated on-site engineers. Introduced the 2-hour response SLA across all AMC plans." },
          { year: "Today", title: "{clients} businesses and still growing", description: "A full team of certified engineers, designers, marketers and cloud specialists, looking after businesses across the UAE." },
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
        heading: "Fast response, fixed price,",
        heading_soft: "one team for all your IT.",
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
        heading: "IT, cloud and digital services,",
        heading_soft: "under one roof.",
        link_label: "See all services",
        link: "/services",
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
          { title: "Established", description: "{founded}", link: "" },
          { title: "Registered office", description: "Emaar Park 4, Greens, TECOM, Dubai, United Arab Emirates", link: "" },
          { title: "Opening hours", description: "Monday to Saturday, 9:00am to 6:00pm (GST)", link: "" },
          { title: "Areas served", description: "Dubai, Sharjah and Abu Dhabi", link: "" },
        ],
        assurances: [
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

/** The legal pages' fields: the title is also the link in the footer's Legal column. */
const legalFields: HomeField[] = [
  { name: "eyebrow", label: "Small heading", type: "text" },
  { name: "title", label: "Page title", type: "text", group: "Heading", help: "The page's heading, and its link text in the footer's Legal column." },
  { name: "updated", label: "Last updated line", type: "text", group: "Heading", help: "Change the date whenever you change the wording." },
  { name: "intro", label: "Intro paragraph", type: "textarea" },
];

const legalSections: HomeList = {
  name: "sections",
  label: "Sections",
  itemLabel: "Section",
  max: 20,
  help: "Each section is a heading with its text, listed in this order down the page and in its contents list.",
  fields: [
    { name: "title", label: "Heading", type: "text" },
    { name: "description", label: "Text", type: "textarea", help: "Leave a blank line between paragraphs. Start a line with “- ” to make it a bullet point." },
  ],
};

const showOrHide = [
  { value: "yes", label: "Show" },
  { value: "no", label: "Hide" },
];

/**
 * The Services page's blocks (/services), edited on the "Services page
 * sections" screen and saved on the "services" page. The top banner is that
 * page's hero (Heroes), the services are the Services records and their
 * groups are the Services menu's (Header menu).
 */
export const servicesBlocks: HomeBlockDef[] = [
  {
    key: "services_stats",
    page: "services",
    label: "Figures & index",
    shows: "The figures under the top banner's buttons, and the heading of the card beside the banner that lists every service, each a jump down to it.",
    fields: [{ name: "index_label", label: "Heading of the services card", type: "text", group: "Services card" }],
    lists: [
      {
        name: "stats",
        label: "Figures",
        itemLabel: "Figure",
        max: 3,
        help: `The figure is large, its label beneath. ${figuresNote} Type {services} for the number of services on the page.`,
        fields: [
          { name: "title", label: "Figure", type: "text" },
          { name: "description", label: "Label", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: { index_label: "Every service at a glance" },
      lists: {
        stats: [
          { title: "{clients}", description: "Businesses served across the UAE" },
          { title: "{rating}★", description: "Google rating from {reviews} reviews" },
          { title: "{years}+", description: "Years operating in Dubai" },
        ],
      },
    },
  },
  {
    key: "services_finder",
    page: "services",
    label: "Service finder",
    shows: "“Not sure where to start?”: visitors pick the situation they are in and see the services for it.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "result_label", label: "Small heading above the services", type: "text", group: "Labels" },
    ],
    lists: [
      {
        name: "situations",
        label: "Situations",
        itemLabel: "Situation",
        max: 8,
        help: "The first one is picked when the page opens. A situation whose services are all unpublished is left out.",
        fields: [
          { name: "title", label: "Situation", type: "text" },
          { name: "description", label: "What we do about it", type: "textarea" },
          { name: "service1", label: "First service", type: "service" },
          { name: "service2", label: "Second service", type: "service" },
          { name: "service3", label: "Third service", type: "service" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Not sure where to start?",
        heading: "Tell us what’s going on,",
        heading_soft: "we’ll point you to the right service.",
        result_label: "Where we’d start",
      },
      lists: {
        situations: [
          { title: "Opening or moving an office", description: "Cabling, Wi-Fi, CCTV and access control planned together, then looked after from the first day.", service1: "system-integration", service2: "it-amc-services-dubai", service3: "cyber-security" },
          { title: "IT bills that are hard to predict", description: "One fixed monthly fee for remote support, on-site visits and monitoring, with backups included in the plan.", service1: "it-amc-services-dubai", service2: "data-backup-recovery", service3: "" },
          { title: "Worried about ransomware or data loss", description: "Firewall, endpoint and email protection, with tested backups behind them, so one bad click doesn’t stop the business.", service1: "cyber-security", service2: "data-backup-recovery", service3: "" },
          { title: "Moving email and files to the cloud", description: "Microsoft 365 or Azure set up, your data moved across and your team protected once it’s there.", service1: "cloud-services-dubai", service2: "cyber-security", service3: "" },
          { title: "Not enough enquiries online", description: "A fast website or landing page, with SEO and ads that bring the right visitors to it.", service1: "website-development", service2: "digital-marketing", service3: "landing-page-designing" },
          { title: "A brand that looks out of date", description: "A logo, brand identity and website that look as serious as the business behind them.", service1: "graphics-designing", service2: "website-development", service3: "" },
        ],
      },
    },
  },
  {
    key: "services_groups",
    page: "services",
    label: "Services by area",
    shows: "The heading above the groups of services, and beside each group a few words about it and, on wide screens, a photo. The groups and the services in them are set on Header menu → Services menu.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
    ],
    lists: [
      {
        name: "groups",
        label: "Group intros",
        itemLabel: "Intro",
        max: 6,
        help: "One for each Services menu group. Without a photo, a built-in one shows.",
        fields: [
          { name: "title", label: "Group", type: "menugroup" },
          { name: "description", label: "Intro", type: "textarea" },
          { name: "image", label: "Photo", type: "image", upload: "photo" },
          { name: "image_alt", label: "Photo description", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Browse by area",
        heading: "Every service,",
        heading_soft: "grouped by what it looks after.",
      },
      lists: {
        groups: [
          { title: "IT Support & Infrastructure", description: "Day-to-day IT support, the network and hardware behind it, and backups that keep your data safe.", image: "", image_alt: "" },
          { title: "Cloud & Security", description: "Microsoft 365 and Azure set up and run for you, with the firewalls and email protection that keep threats out.", image: "", image_alt: "" },
          { title: "Digital & Creative", description: "Websites, apps, design and marketing that bring in customers, from the team that already runs your IT.", image: "", image_alt: "" },
        ],
      },
    },
  },
  {
    key: "services_compare",
    page: "services",
    label: "One team vs vendors",
    shows: "The table near the end of the page: what working with Byteflow is like beside using separate vendors, row by row.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "us_label", label: "Byteflow column heading", type: "text", group: "Column headings" },
      { name: "them_label", label: "Other column heading", type: "text", group: "Column headings" },
    ],
    lists: [
      {
        name: "rows",
        label: "Rows",
        itemLabel: "Row",
        max: 8,
        fields: [
          { name: "title", label: "Topic", type: "text" },
          { name: "us", label: "With Byteflow", type: "text" },
          { name: "them", label: "With separate vendors", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Why one team",
        heading: "One accountable team,",
        heading_soft: "instead of five vendors.",
        us_label: "With Byteflow",
        them_label: "With separate vendors",
      },
      lists: {
        rows: [
          { title: "Who you call", us: "One phone number and one account manager", them: "A different company for each problem" },
          { title: "What you pay", us: "One fixed monthly invoice, no call-out fees", them: "Separate bills, with extras for urgent visits" },
          { title: "How fast help arrives", us: "2-hour response on every AMC plan", them: "Whatever each contract allows" },
          { title: "When something breaks", us: "We own the fix, whatever the cause", them: "Each vendor points to another" },
          { title: "How it’s planned", us: "IT, cloud, security and web planned together", them: "Set up separately, rarely in step" },
        ],
      },
    },
  },
  {
    key: "services_sections",
    page: "services",
    label: "Sections on this page",
    shows: "Which of the page's sections show. The banner and the services always do.",
    fields: [
      { name: "finder", label: "Service finder", type: "select", options: showOrHide, help: "Edited on the Service finder tab.", group: "Sections" },
      { name: "spotlight", label: "Most popular offer", type: "select", options: showOrHide, help: "The Services menu's “Most popular” card as a wide plan card: edit it on Header menu → Services menu → Featured.", group: "Sections" },
      { name: "compare", label: "One team vs vendors", type: "select", options: showOrHide, help: "Edited on the One team vs vendors tab.", group: "Sections" },
    ],
    lists: [],
    defaults: {
      fields: { finder: "yes", spotlight: "yes", compare: "yes" },
      lists: {},
    },
  },
];

/**
 * The Industries page (/industries), edited on the "Industries page" screen
 * and saved on the "industries" page. The top banner is that page's hero
 * (Heroes). No client names: each industry is what gets in the way there,
 * how we handle it, and the services we use.
 */
export const industriesBlocks: HomeBlockDef[] = [
  {
    key: "industries_list",
    page: "industries",
    label: "Industries",
    shows: "A card for each industry under the top banner, with the list of industries beside them. Each card's address is /industries# and its name in small letters with dashes, e.g. /industries#logistics — use it to link the Industries menu (Header menu) to the card.",
    fields: [
      { name: "nav_label", label: "Heading of the list of industries", type: "text", group: "Labels" },
      { name: "challenges_label", label: "Heading of the problems", type: "text", group: "Labels" },
      { name: "approach_label", label: "Heading of what we do", type: "text", group: "Labels" },
      { name: "services_label", label: "Words before the services", type: "text", group: "Labels" },
    ],
    lists: [
      {
        name: "industries",
        label: "Industries",
        itemLabel: "Industry",
        max: 12,
        help: "No client names. One line per point in the two lists.",
        fields: [
          { name: "title", label: "Industry", type: "text" },
          {
            name: "icon",
            label: "Icon",
            type: "select",
            options: [
              { value: "other", label: "General" },
              { value: "health", label: "Healthcare" },
              { value: "education", label: "Education" },
              { value: "real-estate", label: "Real estate / building" },
              { value: "retail", label: "Retail" },
              { value: "logistics", label: "Logistics" },
              { value: "hospitality", label: "Hospitality" },
              { value: "legal", label: "Legal" },
              { value: "corporate", label: "Corporate / office" },
            ],
          },
          { name: "summary", label: "One-line summary", type: "textarea" },
          { name: "challenges", label: "What gets in the way (one per line)", type: "textarea" },
          { name: "approach", label: "How we handle it (one per line)", type: "textarea" },
          { name: "service1", label: "First service", type: "service" },
          { name: "service2", label: "Second service", type: "service" },
          { name: "service3", label: "Third service", type: "service" },
        ],
      },
    ],
    defaults: {
      fields: {
        nav_label: "Industries",
        challenges_label: "What gets in the way",
        approach_label: "How we handle it",
        services_label: "Services we use",
      },
      lists: {
        industries: [
          { title: "Clinics & Healthcare", icon: "health", summary: "Clinic systems, patient records and front-desk technology that have to work for every appointment.", challenges: "Patient records that must stay private and backed up\nFront desk, booking and billing PCs that cannot go down mid-shift\nMedical devices, staff and patients sharing one network", approach: "Separate, secured networks for clinical, staff and guest devices\nAutomated, tested backups of patient and billing data\nRemote and on-site support under one AMC plan", service1: "it-amc-services-dubai", service2: "cyber-security", service3: "data-backup-recovery" },
          { title: "Schools & Education", icon: "education", summary: "Classrooms, staff rooms and offices on one network that has to hold up all day.", challenges: "Hundreds of student and staff devices on one network\nClassrooms that need reliable Wi-Fi from the first lesson to the last\nControlling what students can reach online", approach: "Campus-wide network and Wi-Fi design\nMicrosoft 365 accounts and devices managed centrally\nFirewall and content filtering rules for student access", service1: "system-integration", service2: "cloud-services-dubai", service3: "cyber-security" },
          { title: "Real Estate", icon: "real-estate", summary: "Agents on site visits, offices and showrooms, all working from the same listings and leads.", challenges: "Agents working from viewings, showrooms and home\nLeads spread across portals, inboxes and phones\nNew offices and showrooms opening on tight timelines", approach: "Cloud email, files and Teams that work from anywhere\nWebsites and landing pages built to bring in enquiries\nOffice and showroom fit-outs: cabling, Wi-Fi and CCTV", service1: "cloud-services-dubai", service2: "website-development", service3: "system-integration" },
          { title: "Retail & Ecommerce", icon: "retail", summary: "Tills, stock and the online store, all needing to stay up while customers are buying.", challenges: "Point-of-sale and stock systems that must stay online\nCard payments and customer details to protect\nAn online store competing for the same searches as everyone else", approach: "Store networks, CCTV and POS connectivity set up and monitored\nFirewall and endpoint protection for tills and the back office\nEcommerce websites, SEO and ads that bring buyers in", service1: "website-development", service2: "digital-marketing", service3: "cyber-security" },
          { title: "Logistics", icon: "logistics", summary: "Warehouses, offices and drivers on different sites, with systems that run around the clock.", challenges: "Warehouses, offices and yards on separate sites\nTracking and dispatch systems that run day and night\nRansomware that can stop shipments overnight", approach: "Site-to-site networking and warehouse Wi-Fi\nMonitoring around the clock, with backups ready to restore\nEndpoint and email protection on every site", service1: "system-integration", service2: "data-backup-recovery", service3: "cyber-security" },
          { title: "Hospitality", icon: "hospitality", summary: "Guest Wi-Fi, cameras and property systems across buildings that never close.", challenges: "Guest Wi-Fi that simply has to work\nCCTV and access control across large buildings\nBooking and property systems that cannot stop", approach: "Separate guest, staff and system networks\nCCTV, access control and Wi-Fi fit-outs\nMonitoring, with on-site support when something fails", service1: "system-integration", service2: "it-amc-services-dubai", service3: "cyber-security" },
          { title: "Law Firms & Professional Services", icon: "legal", summary: "Confidential files, constant email and people working from courts, client offices and home.", challenges: "Confidential client files that must stay private\nEmail as the main target for phishing and payment fraud\nPartners and staff working from outside the office", approach: "Email security and anti-phishing protection\nMicrosoft 365 with controlled sharing and backups\nSecure remote access for the whole team", service1: "cyber-security", service2: "cloud-services-dubai", service3: "data-backup-recovery" },
          { title: "Corporate Offices & SMEs", icon: "corporate", summary: "Growing teams without a full IT department, who need everything to just work.", challenges: "No in-house IT person, or one stretched across everything\nIT costs that change from month to month\nNew starters who need laptops, accounts and access quickly", approach: "One fixed monthly AMC for support and on-site visits\nNew starters set up with devices, email and access\nOne team for IT, cloud, security and the website", service1: "it-amc-services-dubai", service2: "cloud-services-dubai", service3: "website-development" },
        ],
      },
    },
  },
];

/**
 * The Projects page (/projects) and each project's page: their wording,
 * saved on the "projects" page. The projects themselves are the Projects
 * screen; the banner is the page's hero (Heroes).
 */
export const projectsBlocks: HomeBlockDef[] = [
  {
    key: "projects_page",
    page: "projects",
    label: "Projects list",
    shows: "The Projects page under the top banner: the labels of the figures in the banner (the numbers are counted from your published projects, and clients served is under Contact details & logo), the heading above the projects, the service filter and the link on the lead card.",
    preview: "/projects",
    fields: [
      { name: "stat_projects", label: "Label under the number of projects", type: "text", group: "Banner figures", help: "Leave a label blank to hide that figure." },
      { name: "stat_services", label: "Label under the number of services", type: "text", group: "Banner figures" },
      { name: "stat_industries", label: "Label under the number of industries", type: "text", group: "Banner figures" },
      { name: "stat_clients", label: "Label under clients served", type: "text", group: "Banner figures" },
      { name: "eyebrow", label: "Small heading", type: "text", group: "Projects" },
      { name: "heading", label: "Heading — first part", type: "text", group: "Projects", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text", group: "Projects" },
      { name: "all_label", label: "First filter button (all projects)", type: "text", group: "Service filter" },
      { name: "filter_label", label: "Name of the filter, read out by screen readers", type: "text", group: "Service filter" },
      { name: "empty_text", label: "Shown when a service has no projects", type: "text", group: "Service filter" },
      { name: "link_label", label: "Link text on the lead project", type: "text", group: "Service filter" },
    ],
    lists: [],
    defaults: {
      fields: {
        stat_projects: "Case studies",
        stat_services: "Services",
        stat_industries: "Industries",
        stat_clients: "Clients served",
        eyebrow: "Case studies",
        heading: "What each business needed,",
        heading_soft: "and what we delivered.",
        filter_label: "Filter by service",
        all_label: "All work",
        empty_text: "No projects for this service yet.",
        link_label: "View case study",
      },
      lists: {},
    },
  },
  {
    key: "projects_detail",
    page: "projects",
    label: "Project page labels",
    shows: "The labels on every project's own page (/projects/…): the back link and button at the top, the story's heading, the project details, what we delivered, the technology used and the related projects. Each project's own words are on the Projects screen.",
    preview: "/projects",
    fields: [
      { name: "back_label", label: "Back link", type: "text", group: "Top" },
      { name: "primary_label", label: "Button text", type: "text", group: "Top" },
      { name: "primary_link", label: "Button link", type: "link", group: "Top" },
      { name: "story_heading", label: "Heading above the project's content", type: "text", group: "Story" },
      { name: "details_label", label: "Project details heading", type: "text", group: "Side panel" },
      { name: "service_label", label: "Service label", type: "text", group: "Side panel" },
      { name: "industry_label", label: "Industry label", type: "text", group: "Side panel" },
      { name: "year_label", label: "Year label", type: "text", group: "Side panel" },
      { name: "delivered_label", label: "Deliverables heading", type: "text", group: "Side panel" },
      { name: "tags_label", label: "Tags heading", type: "text", group: "Side panel" },
      { name: "more_eyebrow", label: "Small heading", type: "text", group: "Related projects" },
      { name: "more_heading", label: "Heading", type: "text", group: "Related projects" },
      { name: "more_link_label", label: "Link to all projects", type: "text", group: "Related projects" },
    ],
    lists: [],
    defaults: {
      fields: {
        back_label: "All projects",
        primary_label: "Start a similar project",
        primary_link: "/contact-us",
        story_heading: "The project",
        details_label: "Project details",
        service_label: "Service",
        industry_label: "Industry",
        year_label: "Year",
        delivered_label: "What we delivered",
        tags_label: "Technology used",
        more_eyebrow: "More work",
        more_heading: "Related projects",
        more_link_label: "See all projects",
      },
      lists: {},
    },
  },
  {
    key: "projects_cta",
    page: "projects",
    label: "Closing panel",
    shows: "The panel at the end of the Projects page and of every project's page, with ways to reach you beside it. The phone, email and location are your Contact details & logo.",
    preview: "/projects",
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
        eyebrow: "Have a project in mind?",
        heading: "Tell us what you want to achieve.",
        heading_soft: "We will come back with a plan.",
        intro: "Tell us what you are trying to achieve and we will come back to you with a plan, not a sales pitch.",
        link_label: "Start a conversation",
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
 * The blog page (/blog): its wording and featured article, saved on the
 * "blog" page. The articles are Blog posts; the banner is the page's hero
 * (Heroes).
 */
export const blogBlocks: HomeBlockDef[] = [
  {
    key: "blog_page",
    page: "blog",
    label: "Articles",
    shows: "The blog page under the top banner: the labels of the figures in the banner (the numbers and date are counted from your published posts), the featured article, the heading, the topic buttons (one per category your posts use), the search and the article cards.",
    preview: "/blog",
    fields: [
      { name: "stat_articles", label: "Label under the number of articles", type: "text", group: "Banner figures", help: "Leave a label blank to hide that figure." },
      { name: "stat_topics", label: "Label under the number of topics", type: "text", group: "Banner figures" },
      { name: "stat_latest", label: "Label under the newest article's date", type: "text", group: "Banner figures" },
      {
        name: "featured",
        label: "Featured article",
        type: "post",
        group: "Featured article",
        help: "“Latest” always features the newest published post. A picked post that is later unpublished falls back to the latest.",
      },
      { name: "picked_badge", label: "Badge on a picked article", type: "text", group: "Featured article" },
      { name: "latest_badge", label: "Badge on the newest article", type: "text", group: "Featured article" },
      { name: "eyebrow", label: "Small heading", type: "text", group: "Articles" },
      { name: "heading", label: "Heading — first part", type: "text", group: "Articles", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text", group: "Articles" },
      { name: "all_label", label: "First topic button (all articles)", type: "text", group: "Topics & search" },
      { name: "filter_label", label: "Name of the topic buttons, read out by screen readers", type: "text", group: "Topics & search" },
      { name: "search_label", label: "Name of the search box, read out by screen readers", type: "text", group: "Topics & search" },
      { name: "search_placeholder", label: "Text inside the empty search box", type: "text", group: "Topics & search" },
      { name: "article_word", label: "Word after the count, for one", type: "text", group: "Topics & search", help: "As in “1 article”." },
      { name: "articles_word", label: "Word after the count, for more", type: "text", group: "Topics & search", help: "As in “36 articles”." },
      { name: "clear_label", label: "Link that clears the topic and search", type: "text", group: "Topics & search" },
      { name: "empty_text", label: "Shown when nothing matches", type: "text", group: "Topics & search" },
      { name: "more_label", label: "Button that shows more articles", type: "text", group: "Cards" },
      { name: "read_label", label: "Link text on each card", type: "text", group: "Cards" },
      { name: "author_fallback", label: "Author when a post has none", type: "text", group: "Cards" },
    ],
    lists: [],
    defaults: {
      fields: {
        stat_articles: "Articles published",
        stat_topics: "Topics",
        stat_latest: "Latest article",
        featured: "latest",
        picked_badge: "Editor's pick",
        latest_badge: "Latest",
        eyebrow: "All articles",
        heading: "Browse by topic,",
        heading_soft: "or search for what you need.",
        all_label: "All topics",
        filter_label: "Filter by topic",
        search_label: "Search articles",
        search_placeholder: "Search articles…",
        article_word: "article",
        articles_word: "articles",
        clear_label: "Clear filters",
        empty_text: "No articles match your search.",
        more_label: "Show more articles",
        read_label: "Read article",
        author_fallback: "Byteflow team",
      },
      lists: {},
    },
  },
  {
    key: "blog_cta",
    page: "blog",
    label: "Closing panel",
    shows: "The panel at the end of the blog page, with ways to reach you beside it. The phone, email and location are your Contact details & logo.",
    preview: "/blog",
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
        eyebrow: "Have an IT problem you need solved?",
        heading: "Reading about it is one thing.",
        heading_soft: "Getting it fixed is another.",
        intro: "Tell us what is going on and our team will help you sort it out, with no sales pitch.",
        link_label: "Talk to our team",
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
 * The Contact page (/contact-us), saved on that page. Its banner words are
 * the page's hero (Heroes); the phone, email, WhatsApp link, address, hours,
 * socials and map are Contact details & logo.
 */
export const contactBlocks: HomeBlockDef[] = [
  {
    key: "contact_page",
    page: "contact-us",
    label: "Top: ways to reach us & form",
    shows: "Beside the page's heading (its hero): the promises under it, the Call / WhatsApp / Email rows, the socials' label, and the heading and line above the enquiry form. The number, email and WhatsApp link themselves are Contact details & logo.",
    preview: "/contact-us",
    fields: [
      { name: "promises", label: "Promises under the description (one per line)", type: "textarea" },
      { name: "call_label", label: "Call row — label", type: "text", group: "Ways to reach us", help: "Leave a label blank to hide its row." },
      { name: "whatsapp_label", label: "WhatsApp row — label", type: "text", group: "Ways to reach us" },
      { name: "whatsapp_text", label: "WhatsApp row — line", type: "text", group: "Ways to reach us" },
      { name: "email_label", label: "Email row — label", type: "text", group: "Ways to reach us" },
      { name: "socials_label", label: "Label beside the social links", type: "text", group: "Ways to reach us" },
      { name: "address_label", label: "Office label", type: "text", group: "Office details", help: "Shown over the address in the office section." },
      { name: "hours_label", label: "Opening hours label", type: "text", group: "Office details" },
      { name: "form_heading", label: "Heading above the form", type: "text", group: "Form" },
      { name: "form_intro", label: "Line under it", type: "textarea", group: "Form" },
    ],
    lists: [],
    defaults: {
      fields: {
        call_label: "Call us",
        whatsapp_label: "WhatsApp",
        whatsapp_text: "Chat with our team",
        email_label: "Email",
        address_label: "Office",
        hours_label: "Opening hours",
        socials_label: "Follow us",
        form_heading: "Send us a message",
        form_intro: "Tell us about your setup and what you need. Fields marked * are required.",
        promises: "Free consultation\nClear, fixed proposal\nNo obligation",
      },
      lists: {},
    },
  },
  {
    key: "contact_steps",
    page: "contact-us",
    label: "What happens next",
    shows: "The numbered steps under the form: what happens after someone sends a message.",
    preview: "/contact-us",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
    ],
    lists: [
      {
        name: "steps",
        label: "Steps",
        itemLabel: "Step",
        max: 4,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: { eyebrow: "What happens next", heading: "From your message", heading_soft: "to a clear plan." },
      lists: {
        steps: [
          { title: "We read your message", description: "Our team reviews what you sent and the service you picked." },
          { title: "We talk it through", description: "We call or email to understand your setup, team size and what you need." },
          { title: "You get a clear proposal", description: "A fixed, itemised proposal, with no obligation to go ahead." },
        ],
      },
    },
  },
  {
    key: "contact_office",
    page: "contact-us",
    label: "Office & map",
    shows: "The last section: the office heading beside the map, with the address and opening hours (Contact details & logo) and a directions button. The map is set, or switched off, under Contact details & logo.",
    preview: "/contact-us",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
      { name: "heading_soft", label: "Heading — second part", type: "text" },
      { name: "text", label: "Line under the heading (optional)", type: "textarea" },
      { name: "directions_label", label: "Directions button text", type: "text", group: "Directions", help: "Leave blank to hide the button." },
      { name: "directions_link", label: "Directions link (optional)", type: "link", group: "Directions", help: "A Google Maps link to the office. Blank searches Google Maps for the address." },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Our office",
        heading: "Visit us",
        heading_soft: "in Dubai.",
        text: "",
        directions_label: "Get directions",
        directions_link: "",
      },
      lists: {},
    },
  },
];

/** A section's small heading and its heading in two tones. */
const sectionHeading: HomeField[] = [
  { name: "eyebrow", label: "Small heading", type: "text" },
  { name: "heading", label: "Heading — first part", type: "text", help: headingHelp },
  { name: "heading_soft", label: "Heading — second part", type: "text" },
];

/** A package's structured deliverables (a number each) and inclusion groups (a list each), as [field, starting name]. */
const deliverableFields = [
  ["d_keywords", "Keywords"],
  ["d_pages", "Pages"],
  ["d_audits", "Audits"],
  ["d_content", "Content pieces"],
] as const;
const inclusionFields = [
  ["g_technical", "Technical"],
  ["g_onpage", "On-page"],
  ["g_local", "Local SEO"],
  ["g_content", "Content"],
  ["g_links", "Link building"],
] as const;

const priceTypes = [
  { value: "fixed", label: "Fixed price" },
  { value: "from", label: "Starting from" },
  { value: "custom", label: "Custom quote" },
];

/**
 * The packages section's names for its parts, as the website starts them
 * (byteflow, app/lib/home-content.ts planLabels).
 */
const planLabels = {
  from_label: "From",
  custom_label: "Request Pricing",
  ...Object.fromEntries(deliverableFields.map(([name, label]) => [`${name}_label`, label])),
  ...Object.fromEntries(inclusionFields.map(([name, label]) => [`${name}_label`, label])),
  excluded_label: "Not included",
  extras_label: "Additional charges",
};

/** A package's fields beyond its name, price, line, points and badge, as they start. */
const planExtras = {
  price_type: "fixed",
  show: "yes",
  button_label: "",
  button_link: "",
  ...Object.fromEntries(deliverableFields.map(([name]) => [name, ""])),
  ...Object.fromEntries(inclusionFields.map(([name]) => [name, ""])),
  excluded: "",
  extras: "",
};

const titledItems =(label: string, itemLabel: string, max: number, help?: string): HomeList => ({
  name: "",
  label,
  itemLabel,
  max,
  help,
  fields: [
    { name: "title", label: "Title", type: "text" },
    { name: "description", label: "Text", type: "textarea" },
  ],
});

/** The sections the IT AMC page can show, as the website names them (app/lib/amc-page.ts). */
const amcSectionOptions = [
  { value: "highlights", label: "2. Trust & highlights" },
  { value: "intro", label: "3. What is IT AMC?" },
  { value: "services", label: "4. Complete IT AMC services" },
  { value: "preventive", label: "5. Preventive maintenance" },
  { value: "plans", label: "6. Packages & pricing" },
  { value: "costs", label: "7. Cost factors" },
  { value: "breakfix", label: "8. AMC vs break-fix" },
  { value: "industries", label: "9. Industries" },
  { value: "why", label: "10. Why Byteflow" },
  { value: "process", label: "11. Process" },
  { value: "sla", label: "12. SLA & response times" },
  { value: "coverage", label: "13. Dubai & UAE coverage" },
  { value: "scope", label: "14. Included & excluded" },
  { value: "pageblocks", label: "Blocks added under Pages" },
  { value: "related", label: "Related services" },
  { value: "faq", label: "16. FAQs" },
  { value: "reviews", label: "15. Testimonials & case studies" },
  { value: "contact", label: "17. Final CTA & contact form" },
];

/** The icons the page's highlights and service categories can use (website: components/amc/AmcIcon.tsx). */
const amcIconOptions = [
  { value: "check", label: "Tick" },
  { value: "fee", label: "Money / fee" },
  { value: "clock", label: "Clock" },
  { value: "monitor", label: "Screen / monitoring" },
  { value: "person", label: "Person" },
  { value: "shield", label: "Shield" },
  { value: "cloud", label: "Cloud" },
  { value: "server", label: "Server" },
  { value: "laptop", label: "Laptop" },
  { value: "network", label: "Network" },
  { value: "camera", label: "Camera" },
  { value: "tools", label: "Tools" },
];

/** A page's search title and description. */
const seoFields: HomeField[] = [
  { name: "title", label: "Search title", type: "text", help: "The blue link in Google. Include the service and Dubai." },
  { name: "description", label: "Search description", type: "textarea", help: "The two lines under it in Google." },
];

/** A picture and its description, for a list item. */
const pictureFields: HomeField[] = [
  { name: "image", label: "Picture", type: "image", upload: "photo" },
  { name: "image_alt", label: "Picture description", type: "text" },
];

/**
 * The IT AMC page (/it-amc-services-dubai), edited on the "IT AMC page"
 * screen and saved on that page. The top banner is the page's hero (Heroes:
 * words, buttons and picture); the Sections tab sets which sections follow
 * it and in what order. Blocks added for the page under Pages keep showing
 * on either side of the questions.
 */
export const amcBlocks: HomeBlockDef[] = [
  {
    key: "amc_layout",
    page: "it-amc-services-dubai",
    label: "Sections",
    shows: "Which sections show under the top banner, in this order. Hide one to prepare it without showing it, then show it when it is ready. Remove one to drop it; add it back with “Add section”.",
    fields: [],
    lists: [
      {
        name: "sections",
        label: "Sections, in page order",
        itemLabel: "Section",
        max: 18,
        help: "Use ↑ Up and ↓ Down to reorder. Each section's words and pictures are on its own tab; “Blocks added under Pages” are the page's own blocks from Pages → IT AMC Services.",
        fields: [
          { name: "title", label: "Section", type: "select", options: amcSectionOptions },
          { name: "show", label: "On the website", type: "select", options: showOrHide },
        ],
      },
    ],
    defaults: {
      fields: {},
      lists: {
        sections: amcSectionOptions.map((option) => ({ title: option.value, show: "yes" })),
      },
    },
  },
  {
    key: "amc_seo",
    page: "it-amc-services-dubai",
    label: "SEO",
    shows: "What Google shows for this page: its title and description. Keep the title under about 60 characters and the description under about 155.",
    fields: seoFields,
    lists: [],
    defaults: {
      fields: {
        title: "IT AMC Support & Services in Dubai | Byteflow",
        description: "IT AMC support across Dubai, Business Bay, JLT and WTC included. One fixed monthly fee, 2-hour on-site response, 24/7 monitoring and no surprise bills.",
      },
      lists: {},
    },
  },
  {
    key: "amc_figures",
    page: "it-amc-services-dubai",
    label: "Banner figures",
    shows: "The figures under the top banner's buttons.",
    fields: [],
    lists: [
      {
        name: "stats",
        label: "Figures",
        itemLabel: "Figure",
        max: 3,
        help: `Only figures that are true. The figure is large, its label beneath. ${figuresNote}`,
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
          { title: "2 hrs", description: "On-site response across Dubai" },
          { title: "24/7", description: "Remote monitoring" },
          { title: "{years}+", description: "Years looking after UAE businesses" },
        ],
      },
    },
  },
  {
    key: "amc_highlights",
    page: "it-amc-services-dubai",
    label: "Highlights",
    shows: "2. The row of highlights under the banner.",
    fields: [],
    lists: [
      {
        name: "items",
        label: "Highlights",
        itemLabel: "Highlight",
        max: 4,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
          { name: "icon", label: "Icon", type: "select", options: amcIconOptions },
        ],
      },
    ],
    defaults: {
      fields: {},
      lists: {
        items: [
          { title: "One fixed monthly fee", description: "Support, maintenance and monitoring on one invoice, with no per-incident charges.", icon: "fee" },
          { title: "2-hour on-site response", description: "Across Dubai, with Sharjah and Abu Dhabi covered under the same AMC.", icon: "clock" },
          { title: "24/7 monitoring", description: "Every laptop, desktop and server watched for problems around the clock.", icon: "monitor" },
          { title: "A dedicated account engineer", description: "One person who knows your setup, and one number to call.", icon: "person" },
        ],
      },
    },
  },
  {
    key: "amc_intro",
    page: "it-amc-services-dubai",
    label: "What is IT AMC?",
    shows: "3. The explanation beside its picture (or its points, without a picture).",
    fields: [
      ...sectionHeading,
      { name: "text", label: "Text", type: "textarea", help: "Leave a blank line between paragraphs." },
      { name: "points", label: "Points (one per line)", type: "textarea", help: "Shown in place of the picture until one is uploaded." },
      { name: "image", label: "Picture", type: "image", upload: "photo", group: "Picture" },
      { name: "image_alt", label: "Picture description", type: "text", group: "Picture" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "What is IT AMC?",
        heading: "IT support",
        heading_soft: "on a fixed monthly plan.",
        text: "An IT AMC (annual maintenance contract) covers the support, maintenance and monitoring of your office’s IT for one fixed monthly fee, instead of paying a technician each time something breaks.\n\nWith Byteflow, every device, server and network in your office is monitored, patched and supported, remotely and on site, by a team that already knows your setup.",
        points: "Unlimited remote support\nOn-site visits when a fix needs an engineer\nMonitoring, patching and a monthly health report",
        image: "",
        image_alt: "",
      },
      lists: {},
    },
  },
  {
    key: "amc_services",
    page: "it-amc-services-dubai",
    label: "Services",
    shows: "4. The services by category: the categories as tabs, each one's services as cards.",
    fields: [...sectionHeading, { name: "intro", label: "Intro line", type: "textarea" }],
    lists: [
      {
        name: "tabs",
        label: "Categories",
        itemLabel: "Category",
        max: 8,
        help: "Renaming a category keeps its services in it.",
        fields: [
          { name: "title", label: "Category name", type: "text" },
          { name: "description", label: "Line under the name", type: "textarea" },
          { name: "icon", label: "Icon", type: "select", options: amcIconOptions },
          ...pictureFields,
        ],
      },
      {
        name: "services",
        label: "Services",
        itemLabel: "Service",
        max: 60,
        help: "Each service shows under the category picked for it.",
        fields: [
          { name: "title", label: "Service", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "tab", label: "Category", type: "tab" },
          ...pictureFields,
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "Complete IT AMC services",
        heading: "Everything we look after,",
        heading_soft: "grouped by area.",
        intro: "Pick an area to see what the AMC covers there.",
      },
      lists: {
        tabs: [
          { title: "End-User IT Support", description: "Support for your people and the devices they work on.", icon: "laptop", image: "", image_alt: "" },
          { title: "Server & Network Infrastructure", description: "The servers, network and connections your office runs on.", icon: "server", image: "", image_alt: "" },
          { title: "Microsoft 365 & Cloud Support", description: "Email, files and collaboration, managed for you.", icon: "cloud", image: "", image_alt: "" },
          { title: "Cybersecurity & Business Continuity", description: "Protection, backups and recovery.", icon: "shield", image: "", image_alt: "" },
          { title: "Additional IT Services", description: "Installations and projects alongside your AMC, quoted separately.", icon: "tools", image: "", image_alt: "" },
        ],
        services: [
          { title: "Unlimited Remote Support", description: "Raise a ticket or call us and get remote assistance within 30 minutes. No per-incident fees, no limits on the number of requests per month.", tab: "End-User IT Support", image: "", image_alt: "" },
          { title: "On-site Engineer Visits", description: "When remote support is not enough, a certified engineer arrives at your office within 2 hours across Dubai, Sharjah and Abu Dhabi.", tab: "End-User IT Support", image: "", image_alt: "" },
          { title: "Endpoint Monitoring", description: "Every laptop, desktop and workstation is monitored 24/7 for hardware issues, software conflicts, disk health and security threats.", tab: "End-User IT Support", image: "", image_alt: "" },
          { title: "Software Updates and Patching", description: "We handle all OS updates, firmware patches and critical security fixes during off-hours so your team is never disrupted.", tab: "End-User IT Support", image: "", image_alt: "" },
          { title: "IT Asset Inventory", description: "A live register of every device, licence and warranty expiry date in your office so you always know what you own and when it needs replacing.", tab: "End-User IT Support", image: "", image_alt: "" },
          { title: "Server and Network Management", description: "We configure, patch and monitor your Windows or Linux servers, routers, switches and firewalls to keep everything running at peak performance.", tab: "Server & Network Infrastructure", image: "", image_alt: "" },
          { title: "Microsoft 365 User Administration", description: "New starters set up, leavers removed, and mailboxes and access kept in order.", tab: "Microsoft 365 & Cloud Support", image: "", image_alt: "" },
          { title: "Licence Management", description: "Your Microsoft 365 licences assigned, renewed and kept to the number you need.", tab: "Microsoft 365 & Cloud Support", image: "", image_alt: "" },
          { title: "SharePoint and Teams Configuration", description: "Sites, channels and sharing set up for the way your team works.", tab: "Microsoft 365 & Cloud Support", image: "", image_alt: "" },
          { title: "Microsoft 365 Migrations", description: "Email and files moved to Microsoft 365 from your old system.", tab: "Microsoft 365 & Cloud Support", image: "", image_alt: "" },
          { title: "Email Security", description: "Spam and phishing filtered before it reaches your team.", tab: "Cybersecurity & Business Continuity", image: "", image_alt: "" },
          { title: "Antivirus Management", description: "Antivirus kept installed, updated and watched on every device.", tab: "Cybersecurity & Business Continuity", image: "", image_alt: "" },
          { title: "Backup Configuration", description: "Backups set up and checked as part of onboarding.", tab: "Cybersecurity & Business Continuity", image: "", image_alt: "" },
          { title: "Website Management & SEO Monitoring", description: "Your website kept online, secure and visible: domain renewal, hosting and SSL certificates, and monthly SEO health monitoring.", tab: "Additional IT Services", image: "", image_alt: "" },
          { title: "CCTV and Access Control", description: "Cameras and door access supplied, installed and supported.", tab: "Additional IT Services", image: "", image_alt: "" },
          { title: "Structured Cabling", description: "Network cabling for new and existing offices.", tab: "Additional IT Services", image: "", image_alt: "" },
          { title: "VoIP and Desk Phones", description: "Business phone systems set up and supported.", tab: "Additional IT Services", image: "", image_alt: "" },
          { title: "IT Procurement", description: "Laptops, servers and network equipment sourced and installed.", tab: "Additional IT Services", image: "", image_alt: "" },
          { title: "Office Relocation", description: "Your IT moved to a new office, scoped and quoted as a project.", tab: "Additional IT Services", image: "", image_alt: "" },
        ],
      },
    },
  },
  {
    key: "amc_preventive",
    page: "it-amc-services-dubai",
    label: "Preventive maintenance",
    shows: "5. Picture and text rows (or numbered cards, while none has a picture).",
    fields: sectionHeading,
    lists: [
      {
        name: "items",
        label: "Items",
        itemLabel: "Item",
        max: 8,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
          ...pictureFields,
        ],
      },
    ],
    defaults: {
      fields: { eyebrow: "Preventive maintenance", heading: "Problems fixed", heading_soft: "before they stop your work." },
      lists: {
        items: [
          { title: "Monitoring around the clock", description: "Every laptop, desktop and workstation is monitored 24/7 for hardware issues, software conflicts, disk health and security threats.", image: "", image_alt: "" },
          { title: "Patching outside working hours", description: "OS updates, firmware patches and critical security fixes are applied during off-hours, so your team is never disrupted.", image: "", image_alt: "" },
          { title: "Monthly health reports", description: "Every month you receive a report covering uptime, issues resolved, devices monitored and upcoming risks.", image: "", image_alt: "" },
          { title: "Asset and warranty tracking", description: "A live register of every device, licence and warranty expiry date, so replacements are planned, not urgent.", image: "", image_alt: "" },
        ],
      },
    },
  },
  {
    key: "amc_plans",
    page: "it-amc-services-dubai",
    label: "Packages & pricing",
    shows: "6. The plan cards and the comparison table, and the card beside the top banner that sums them up (it shows the first plan's price as “from”). On the website the section has one h2, its heading; each plan's name is an h3.",
    fields: [
      ...sectionHeading,
      { name: "intro", label: "Description under the heading", type: "textarea", help: "Optional: a short paragraph under the section heading." },
      { name: "card_label", label: "Small heading on the banner card", type: "text", group: "Banner card" },
      { name: "compare_label", label: "“Compare plans” link text", type: "text", group: "Banner card" },
      { name: "unit", label: "Words after each price", type: "text", group: "Prices", help: "Not shown after a custom quote." },
      { name: "from_label", label: "Word before a “Starting from” price", type: "text", group: "Prices" },
      { name: "custom_label", label: "Shown instead of a price", type: "text", group: "Prices", help: "For a plan set to “Custom quote”, or with no price typed." },
      { name: "note", label: "VAT note", type: "textarea", group: "Prices" },
      { name: "terms", label: "Terms under the cards", type: "textarea", group: "Prices" },
      { name: "button_label", label: "Button text", type: "text", group: "Button", help: "For every plan without its own button text." },
      { name: "button_link", label: "Button link", type: "link", group: "Button", help: "For every plan without its own button link." },
      ...deliverableFields.map(([name, label]) => ({ name: `${name}_label`, label: `Name for “${label}”`, type: "text" as const, group: "Deliverables" })),
      ...inclusionFields.map(([name, label]) => ({ name: `${name}_label`, label: `Name for “${label}”`, type: "text" as const, group: "Inclusion groups" })),
      { name: "excluded_label", label: "Heading over what's not included", type: "text", group: "Not included & extras" },
      { name: "extras_label", label: "Heading over additional charges", type: "text", group: "Not included & extras" },
      { name: "table_heading", label: "Heading above the table", type: "text", group: "Comparison table" },
    ],
    lists: [
      {
        name: "plans",
        label: "Plans",
        itemLabel: "Plan",
        max: 4,
        help: "Cheapest first: the table's columns follow this order. A plan with a badge is shown raised, with its badge on top. A hidden plan keeps its column in the table rows but shows nowhere on the website, except in a preview.",
        fields: [
          { name: "title", label: "Plan name", type: "text" },
          { name: "show", label: "On the website", type: "select", options: showOrHide },
          { name: "price_type", label: "Price type", type: "select", options: priceTypes, group: "Price" },
          { name: "price", label: "Price", type: "text", group: "Price", help: "e.g. AED 1,500. Left blank, the plan shows the “Shown instead of a price” words." },
          { name: "summary", label: "Line under the price", type: "text", group: "Price" },
          { name: "badge", label: "Badge (optional)", type: "text", group: "Price" },
          { name: "button_label", label: "Button text", type: "text", group: "Button", help: "Blank uses the section's button text." },
          { name: "button_link", label: "Button link", type: "link", group: "Button", help: "Blank uses the section's button link." },
          ...deliverableFields.map(([name, label]) => ({ name, label: `${label} (number)`, type: "text" as const, group: "Deliverables", help: name === "d_keywords" ? "Blank ones are left out. Their names are set above, under Deliverables." : undefined })),
          { name: "points", label: "What it includes (one per line)", type: "textarea", group: "Included" },
          ...inclusionFields.map(([name, label]) => ({ name, label: `${label} (one per line)`, type: "textarea" as const, group: "Included", help: name === "g_technical" ? "Each group shows under its own heading on the card; empty ones are left out. Their names are set above, under Inclusion groups." : undefined })),
          { name: "excluded", label: "Not included (one per line)", type: "textarea", group: "Not included & extras" },
          { name: "extras", label: "Additional charges (one per line)", type: "textarea", group: "Not included & extras" },
        ],
      },
      {
        name: "compare",
        label: "Comparison table rows",
        itemLabel: "Row",
        max: 40,
        help: "For each plan, in the plans' order: “yes” shows a tick, “no” or blank a dash, anything else is shown as written. Rows given the same group, one after another, sit under that group's heading (Technical, On-page …).",
        fields: [
          { name: "title", label: "Feature", type: "text" },
          { name: "group", label: "Group (optional)", type: "text" },
          { name: "plan1", label: "Plan 1", type: "text" },
          { name: "plan2", label: "Plan 2", type: "text" },
          { name: "plan3", label: "Plan 3", type: "text" },
          { name: "plan4", label: "Plan 4", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {
        ...planLabels,
        eyebrow: "Plans and pricing",
        heading: "Published prices,",
        heading_soft: "per user, per month.",
        intro: "",
        card_label: "Plans from",
        unit: "per user / month",
        note: "Prices exclude 5% VAT. A 10-person office on Essential is AED 300/month.",
        terms: "No setup fee. No minimum term beyond the contract year. How often you call does not change the price — unlimited means unlimited.",
        button_label: "Get a free quote",
        button_link: "/contact-us",
        compare_label: "Compare plans",
        table_heading: "Compare the plans",
      },
      lists: {
        plans: [
          { title: "Essential", price: "AED 30", summary: "Remote support and monitoring for every device.", points: "Unlimited remote support\n24/7 endpoint monitoring\nSoftware updates and patching", badge: "", ...planExtras },
          { title: "Standard", price: "AED 60", summary: "Everything in Essential, plus:", points: "On-site engineer visits\nServer and network management\nIT asset inventory", badge: "Includes on-site visits", ...planExtras },
          { title: "Complete", price: "AED 90", summary: "Everything in Standard, plus:", points: "Website management and SEO monitoring\nPriority SLA\nA dedicated account manager", badge: "", ...planExtras },
        ],
        compare: [
          { title: "Unlimited remote support", group: "", plan1: "yes", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "24/7 endpoint monitoring", group: "", plan1: "yes", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "Software updates and patching", group: "", plan1: "yes", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "On-site engineer visits", group: "", plan1: "no", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "Server and network management", group: "", plan1: "no", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "IT asset inventory", group: "", plan1: "no", plan2: "yes", plan3: "yes", plan4: "" },
          { title: "Website management and SEO monitoring", group: "", plan1: "no", plan2: "no", plan3: "yes", plan4: "" },
          { title: "Priority SLA", group: "", plan1: "no", plan2: "no", plan3: "yes", plan4: "" },
          { title: "A dedicated account manager", group: "", plan1: "no", plan2: "no", plan3: "yes", plan4: "" },
        ],
      },
    },
  },
  {
    key: "amc_costs",
    page: "it-amc-services-dubai",
    label: "Cost factors",
    shows: "7. The numbered list of what the price depends on.",
    fields: [...sectionHeading, { name: "intro", label: "Intro line", type: "textarea" }],
    lists: [{ ...titledItems("Factors", "Factor", 10), name: "factors" }],
    defaults: {
      fields: {
        eyebrow: "Cost factors",
        heading: "What sets the price",
        heading_soft: "of an IT AMC in Dubai.",
        intro: "Every quote is fixed and itemised. This is what it depends on.",
      },
      lists: {
        factors: [
          { title: "Number of users", description: "Plans are priced per user, per month, so the number of users sets most of the price." },
          { title: "Number of servers", description: "Servers need more monitoring and maintenance than laptops and desktops." },
          { title: "Coverage hours", description: "The hours you need support for shape the plan." },
          { title: "Number of sites", description: "Each office location is covered, with an engineer assigned per site." },
          { title: "Plan level", description: "Essential, Standard or Complete, depending on what you need included." },
        ],
      },
    },
  },
  {
    key: "amc_breakfix",
    page: "it-amc-services-dubai",
    label: "AMC vs break-fix",
    shows: "8. The two columns comparing an AMC with paying per incident.",
    fields: [
      ...sectionHeading,
      { name: "us_label", label: "AMC column heading", type: "text", group: "Columns" },
      { name: "them_label", label: "Break-fix column heading", type: "text", group: "Columns" },
      { name: "footer", label: "Line under the columns", type: "textarea", group: "Columns" },
    ],
    lists: [
      {
        name: "rows",
        label: "Rows",
        itemLabel: "Row",
        max: 10,
        fields: [
          { name: "title", label: "Topic", type: "text" },
          { name: "us", label: "With an AMC", type: "text" },
          { name: "them", label: "With break-fix", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "AMC or break-fix?",
        heading: "Two ways",
        heading_soft: "to pay for IT support.",
        us_label: "IT AMC",
        them_label: "Break-fix",
        footer: "Break-fix is usually cheaper for very small teams and more expensive for everyone else, because nobody is being paid to prevent problems.",
      },
      lists: {
        rows: [
          { title: "How you pay", us: "One fixed monthly fee covering everything", them: "A charge for each incident" },
          { title: "Prevention", us: "Systems monitored and maintained before problems start", them: "Nobody is paid to prevent problems" },
          { title: "Budgeting", us: "The same invoice every month", them: "Costs change with every call-out" },
          { title: "Best for", us: "Most offices", them: "Very small teams with few issues" },
        ],
      },
    },
  },
  {
    key: "amc_industries",
    page: "it-amc-services-dubai",
    label: "Industries",
    shows: "9. The industry cards, each linking to its card on the Industries page.",
    fields: [
      ...sectionHeading,
      { name: "link_label", label: "Link text", type: "text", group: "Link" },
      { name: "link", label: "Link", type: "link", group: "Link" },
    ],
    lists: [
      {
        name: "industries",
        label: "Industries",
        itemLabel: "Industry",
        max: 12,
        fields: [
          { name: "title", label: "Industry", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
          {
            name: "icon",
            label: "Icon",
            type: "select",
            options: [
              { value: "other", label: "General" },
              { value: "health", label: "Healthcare" },
              { value: "education", label: "Education" },
              { value: "real-estate", label: "Real estate / building" },
              { value: "retail", label: "Retail" },
              { value: "logistics", label: "Logistics" },
              { value: "hospitality", label: "Hospitality" },
              { value: "legal", label: "Legal" },
              { value: "corporate", label: "Corporate / office" },
            ],
          },
          { name: "link", label: "Link", type: "link" },
        ],
      },
    ],
    defaults: {
      fields: { eyebrow: "Industries we support", heading: "IT support for", heading_soft: "the way your sector works.", link_label: "See all industries", link: "/industries" },
      lists: {
        industries: [
          { title: "Clinics & Healthcare", description: "Clinic systems, patient records and front-desk technology that have to work for every appointment.", icon: "health", link: "/industries#clinics-healthcare" },
          { title: "Schools & Education", description: "Classrooms, staff rooms and offices on one network that has to hold up all day.", icon: "education", link: "/industries#schools-education" },
          { title: "Real Estate", description: "Agents on site visits, offices and showrooms, all working from the same listings and leads.", icon: "real-estate", link: "/industries#real-estate" },
          { title: "Retail & Ecommerce", description: "Tills, stock and the online store, all needing to stay up while customers are buying.", icon: "retail", link: "/industries#retail-ecommerce" },
          { title: "Logistics", description: "Warehouses, offices and drivers on different sites, with systems that run around the clock.", icon: "logistics", link: "/industries#logistics" },
          { title: "Hospitality", description: "Guest Wi-Fi, cameras and property systems across buildings that never close.", icon: "hospitality", link: "/industries#hospitality" },
          { title: "Law Firms & Professional Services", description: "Confidential files, constant email and people working from courts, client offices and home.", icon: "legal", link: "/industries#law-firms-professional-services" },
          { title: "Corporate Offices & SMEs", description: "Growing teams without a full IT department, who need everything to just work.", icon: "corporate", link: "/industries#corporate-offices-smes" },
        ],
      },
    },
  },
  {
    key: "amc_benefits",
    page: "it-amc-services-dubai",
    label: "Why Byteflow",
    shows: "10. The columns on why businesses choose Byteflow.",
    fields: sectionHeading,
    lists: [{ ...titledItems("Reasons", "Reason", 8), name: "benefits" }],
    defaults: {
      fields: { eyebrow: "Why Byteflow", heading: "Why businesses choose", heading_soft: "Byteflow for their AMC." },
      lists: {
        benefits: [
          { title: "Predictable monthly cost", description: "One fixed invoice replaces dozens of unpredictable repair bills. Budget with confidence every month of the year." },
          { title: "Faster issue resolution", description: "A dedicated engineer already knows your setup, so problems are solved faster than starting from scratch with a new vendor every time." },
          { title: "Proactive maintenance", description: "We identify failing hardware and software conflicts before they become outages, reducing unplanned downtime." },
          { title: "Single point of contact", description: "One account manager, one phone number. No being passed between departments or waiting on hold with multiple vendors." },
        ],
      },
    },
  },
  {
    key: "amc_process",
    page: "it-amc-services-dubai",
    label: "Process",
    shows: "11. The numbered steps from the first visit onwards.",
    fields: sectionHeading,
    lists: [{ ...titledItems("Steps", "Step", 6, "In order. Numbered automatically."), name: "steps" }],
    defaults: {
      fields: { eyebrow: "Our IT AMC process", heading: "From the first visit", heading_soft: "to the monthly report." },
      lists: {
        steps: [
          { title: "Free IT Audit", description: "We visit your office and document every device, server, licence and network component. No obligation, no cost." },
          { title: "Custom AMC Proposal", description: "You receive a fixed-price proposal within 24 hours, itemised by service level and number of users. No hidden charges." },
          { title: "Onboarding and Baseline", description: "Our engineers install monitoring agents, update all software, configure backups and document your entire IT environment." },
          { title: "Ongoing Management", description: "From day one, your systems are monitored 24/7. Tickets are resolved remotely or on-site within the agreed SLA." },
          { title: "Monthly Reporting", description: "Every month you receive a health report covering uptime, issues resolved, devices monitored and upcoming risks." },
        ],
      },
    },
  },
  {
    key: "amc_sla",
    page: "it-amc-services-dubai",
    label: "SLA & response times",
    shows: "12. A row per priority with its response commitment, then the escalation steps (shown once written).",
    fields: [
      ...sectionHeading,
      { name: "intro", label: "Intro line", type: "textarea" },
      { name: "escalation_heading", label: "Escalation heading", type: "text", group: "Escalation" },
      { name: "escalation", label: "Escalation steps", type: "textarea", group: "Escalation", help: "Blank hides this part." },
    ],
    lists: [
      {
        name: "priorities",
        label: "Priorities",
        itemLabel: "Priority",
        max: 6,
        help: "Most urgent first; numbered P1, P2… automatically.",
        fields: [
          { name: "title", label: "Priority", type: "text" },
          { name: "description", label: "When it applies", type: "text" },
          { name: "response", label: "Response commitment", type: "text" },
        ],
      },
    ],
    defaults: {
      fields: {
        eyebrow: "SLA & response times",
        heading: "How fast we respond,",
        heading_soft: "by priority.",
        intro: "Every ticket is given a priority, and the priority sets how fast we act.",
        escalation_heading: "Escalation",
        escalation: "",
      },
      lists: {
        priorities: [
          { title: "Critical", description: "A server outage or a fault stopping the whole office.", response: "We mobilise immediately" },
          { title: "Remote support", description: "Any ticket that can be fixed remotely.", response: "Within 30 minutes" },
          { title: "On-site visit", description: "When the fix needs an engineer at your office.", response: "Within 2 hours across Dubai" },
        ],
      },
    },
  },
  {
    key: "amc_areas",
    page: "it-amc-services-dubai",
    label: "Coverage",
    shows: "13. The panel with the areas the response time covers.",
    fields: [
      ...sectionHeading,
      { name: "text", label: "Text", type: "textarea" },
      { name: "areas", label: "Areas (one per line)", type: "textarea", group: "Areas" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Dubai & UAE coverage",
        heading: "The same response time,",
        heading_soft: "wherever your office is.",
        text: "The two-hour on-site response applies across Dubai, with no premium zone and no area we charge extra to reach. Sharjah and Abu Dhabi are covered under the same AMC.",
        areas: "Business Bay\nJLT\nWorld Trade Centre\nDIFC\nDowntown\nDeira\nAl Barsha\nTECOM\nSharjah\nAbu Dhabi",
      },
      lists: {},
    },
  },
  {
    key: "amc_excluded",
    page: "it-amc-services-dubai",
    label: "Included & excluded",
    shows: "14. What the AMC covers beside what it does not.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro paragraph", type: "textarea" },
      { name: "included_heading", label: "Heading of the included list", type: "text", group: "List headings" },
      { name: "excluded_heading", label: "Heading of the excluded list", type: "text", group: "List headings" },
      { name: "footer", label: "Line at the foot", type: "textarea" },
    ],
    lists: [
      { name: "included", label: "Included", itemLabel: "Item", max: 20, fields: [{ name: "title", label: "Item", type: "text" }] },
      { ...titledItems("Not included", "Item", 20), name: "items" },
    ],
    defaults: {
      fields: {
        eyebrow: "No surprises",
        heading: "What’s included and what isn’t",
        intro: "Every AMC has exclusions. Most providers do not publish them, which is how businesses end up with invoices they did not expect. Ours are below.",
        included_heading: "Included",
        excluded_heading: "Not included",
        footer: "If something falls outside your contract, we tell you before doing the work, not on the invoice afterwards.",
      },
      lists: {
        included: [
          { title: "Unlimited remote support" },
          { title: "On-site engineer visits (Standard and Complete)" },
          { title: "Monitoring, patching and updates" },
          { title: "Microsoft 365 administration" },
          { title: "Antivirus management" },
          { title: "A monthly health report" },
        ],
        items: [
          { title: "Hardware and its replacement cost", description: "We diagnose, source and install it, and the labour is covered by your contract. The equipment itself is quoted separately." },
          { title: "Third-party software licences", description: "Microsoft 365, Adobe and similar are billed to you directly." },
          { title: "Major projects", description: "Office relocations, full infrastructure rebuilds and large migrations are scoped and quoted separately." },
          { title: "Full website redesigns", description: "Maintenance, updates and uptime monitoring are covered on the Complete plan. A new build is a separate piece of work." },
          { title: "Paid advertising spend", description: "SEO monitoring is included on Complete. Google Ads and social media budget is not." },
          { title: "Specialist third-party applications", description: "Unless agreed at contract stage." },
        ],
      },
    },
  },
  {
    key: "amc_reviews",
    page: "it-amc-services-dubai",
    label: "Testimonials & case studies",
    shows: "15. Your published Customer reviews (featured first), then the case studies added here.",
    fields: [
      ...sectionHeading,
      { name: "count", label: "How many reviews to show", type: "select", options: ["6", "3", "9", "12"].map((n) => ({ value: n, label: n })), group: "Reviews" },
      { name: "cases_heading", label: "Heading above the case studies", type: "text", group: "Case studies" },
    ],
    lists: [
      {
        name: "cases",
        label: "Case studies",
        itemLabel: "Case study",
        max: 6,
        startsEmpty: true,
        help: "Only real, approved projects. Each can link to its page.",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Text", type: "textarea" },
          { name: "link", label: "Link", type: "link" },
          ...pictureFields,
        ],
      },
    ],
    picturesElsewhere: { text: "The reviews themselves are your published Customer reviews.", href: "/admin/testimonials", label: "Open Customer reviews" },
    defaults: {
      fields: { eyebrow: "Clients", heading: "What our clients", heading_soft: "say about us.", count: "6", cases_heading: "Related projects" },
      lists: { cases: [] },
    },
  },
  {
    key: "amc_faq",
    page: "it-amc-services-dubai",
    label: "FAQs",
    shows: "16. The questions near the end of the page, with search and topic tabs. FAQs added for this page on the FAQs screen follow these. The search, topic and help card labels come from Home page sections → FAQ section.",
    fields: [...sectionHeading, { name: "intro", label: "Intro line", type: "textarea" }],
    lists: [
      {
        name: "faqs",
        label: "Questions",
        itemLabel: "Question",
        max: 30,
        fields: [
          { name: "title", label: "Question", type: "text" },
          { name: "description", label: "Answer", type: "textarea" },
        ],
      },
    ],
    defaults: {
      fields: { eyebrow: "FAQ", heading: "Questions we get", heading_soft: "asked all the time.", intro: "Everything you need to know about IT AMC support with Byteflow." },
      lists: {
        faqs: [
          { title: "What exactly does an IT AMC cover?", description: "Our AMC covers unlimited remote and on-site support for all devices, servers, network equipment and software in your office. It includes proactive monitoring, patching, antivirus management and a dedicated account engineer. You pay one fixed monthly fee with no additional call-out or per-incident charges." },
          { title: "How quickly do you respond when something breaks?", description: "Remote support is available within 30 minutes of a ticket being raised. For issues that require a physical presence, our engineers arrive on-site within 2 hours across Dubai, Sharjah and Abu Dhabi. For critical server outages, we treat it as a P1 and mobilise immediately." },
          { title: "Do you support businesses with multiple offices?", description: "Yes. We manage multi-site businesses with offices across Dubai, Sharjah, Abu Dhabi and other UAE emirates. We assign a dedicated engineer per site and provide centralised monitoring from our NOC, so issues in any location are spotted and resolved quickly." },
          { title: "Can we add services to the AMC later?", description: "Absolutely. Many clients start with basic IT support and later add cloud management, cyber security monitoring or Microsoft 365 administration. Your AMC can be expanded at any time without signing a new long-term contract." },
          { title: "Do you cover Business Bay, JLT and World Trade Centre?", description: "Yes, and at the same service level as everywhere else. The two-hour on-site response applies across Dubai, so Business Bay, JLT, World Trade Centre, DIFC, Downtown, Deira, Al Barsha and TECOM are all covered on the same SLA — there is no premium zone and no area we charge extra to reach. Engineers are dispatched from whichever team is closest on the day. Sharjah and Abu Dhabi are covered under the same AMC." },
          { title: "What is the minimum contract length?", description: "We offer monthly rolling plans as well as annual contracts. Annual plans come with better pricing and priority SLA guarantees. Most clients choose annual contracts because the savings are significant, but we never force you into a long-term commitment." },
        ],
      },
    },
  },
  {
    key: "amc_contact",
    page: "it-amc-services-dubai",
    label: "Final CTA & contact form",
    shows: "17. The closing call to action beside the enquiry form. The phone, WhatsApp, email and address come from Contact details & logo.",
    fields: [
      ...sectionHeading,
      { name: "intro", label: "Text", type: "textarea" },
      { name: "call_label", label: "Call button text", type: "text", group: "Buttons" },
      { name: "whatsapp_label", label: "WhatsApp button text", type: "text", group: "Buttons" },
      { name: "promises", label: "Promises (one per line)", type: "textarea", group: "Promises" },
    ],
    lists: [],
    defaults: {
      fields: {
        eyebrow: "Get a quote",
        heading: "Ready to put your IT",
        heading_soft: "on one fixed fee?",
        intro: "Tell us about your office and we’ll send a fixed, itemised AMC proposal within 24 hours.",
        call_label: "Call us",
        whatsapp_label: "WhatsApp us",
        promises: "Free IT audit\nFixed, itemised proposal\nNo obligation",
      },
      lists: {},
    },
  },
  {
    key: "amc_related",
    page: "it-amc-services-dubai",
    label: "Related services",
    shows: "The cards at the end linking to other services.",
    fields: [
      { name: "eyebrow", label: "Small heading", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
    ],
    lists: [
      {
        name: "services",
        label: "Services",
        itemLabel: "Service",
        max: 3,
        fields: [{ name: "title", label: "Service", type: "service" }],
      },
    ],
    defaults: {
      fields: { eyebrow: "Related services", heading: "Often added to an AMC" },
      lists: { services: [{ title: "cyber-security" }, { title: "cloud-services-dubai" }, { title: "data-backup-recovery" }] },
    },
  },
];

/** The service pages the "Service pages" screen edits, by slug (website: app/lib/services-data.ts). */
export const servicePageList = [
  { slug: "cyber-security", name: "Cyber Security" },
  { slug: "system-integration", name: "System Integration" },
  { slug: "data-backup-recovery", name: "Data Backup & Recovery" },
  { slug: "cloud-services-dubai", name: "Cloud Services" },
  { slug: "website-development", name: "Website / Apps / Bots" },
  { slug: "graphics-designing", name: "UI/UX & Graphics Design" },
  { slug: "digital-marketing", name: "Digital Marketing" },
  { slug: "landing-page-designing", name: "Landing Page Designing" },
];

/** The sections a service page can show, as the website names them (app/lib/service-page.ts). */
const serviceSectionOptions = [
  { value: "highlights", label: "Highlights" },
  { value: "intro", label: "Overview" },
  { value: "features", label: "What's included" },
  { value: "plans", label: "Packages & pricing" },
  { value: "benefits", label: "Why it matters" },
  { value: "compare", label: "Comparison" },
  { value: "process", label: "Process" },
  { value: "industries", label: "Industries" },
  { value: "sla", label: "Response times" },
  { value: "coverage", label: "Dubai & UAE coverage" },
  { value: "scope", label: "Included & excluded" },
  { value: "costs", label: "Cost factors" },
  { value: "pageblocks", label: "Blocks added under Pages" },
  { value: "related", label: "Related services" },
  { value: "faq", label: "FAQs" },
  { value: "reviews", label: "Client reviews" },
  { value: "contact", label: "Final CTA & contact form" },
];

/**
 * Each service page section's form, as [key, label, what it shows, the IT AMC
 * section whose fields it uses]. The service pages share the IT AMC page's
 * section designs, so they share its fields too.
 */
const serviceSectionForms: [string, string, string, string | null][] = [
  ["layout", "Sections", "Which sections show under the top banner, in this order. Hide one to prepare it, then show it when ready. Sections with no content yet (packages, comparison, response times, included & excluded, cost factors) start hidden.", null],
  ["seo", "SEO", "What Google shows for this page: its title and description. They start as the page's long-standing ones.", "amc_seo"],
  ["figures", "Banner figures", "The figures under the top banner's buttons. Only figures that are true.", "amc_figures"],
  ["highlights", "Highlights", "A row of highlight cards under the banner. Starts hidden: switch it on under Sections once it has its own words.", "amc_highlights"],
  ["intro", "Overview", "The description of the service, beside its picture or points when they are added.", "amc_intro"],
  ["features", "What's included", "A numbered card for each thing the service includes, each with its own picture. The card beside the banner lists the first six.", null],
  ["plans", "Packages & pricing", "Package cards and a comparison table. One h2 for the section (its heading), each package name an h3. The card beside the banner shows the packages only when picked under Banner card. Use “Preview hidden sections” to check it before showing it.", "amc_plans"],
  ["benefits", "Why it matters", "The columns on what the service changes.", "amc_benefits"],
  ["compare", "Comparison", "Two columns comparing two ways of doing it.", "amc_breakfix"],
  ["process", "Process", "The numbered steps of the work.", "amc_process"],
  ["industries", "Industries", "The industry cards, each linking to its card on the Industries page.", "amc_industries"],
  ["sla", "Response times", "A row per priority with its response commitment.", "amc_sla"],
  ["coverage", "Dubai & UAE coverage", "The areas the service covers on site.", "amc_areas"],
  ["scope", "Included & excluded", "What the service covers beside what it does not.", "amc_excluded"],
  ["costs", "Cost factors", "What the price depends on.", "amc_costs"],
  ["related", "Related services", "The cards linking to other services.", "amc_related"],
  ["faq", "FAQs", "The questions, with search and topic tabs. FAQs added for this page on the FAQs screen follow these.", "amc_faq"],
  ["reviews", "Client reviews", "Your published Customer reviews, then the case studies added here.", "amc_reviews"],
  ["contact", "Final CTA & contact form", "The closing call to action beside the enquiry form.", "amc_contact"],
];

const featureForm = {
  fields: [
    ...sectionHeading,
    { name: "intro", label: "Intro line", type: "textarea" as const },
    { name: "link_label", label: "Link text on the banner card", type: "text" as const, group: "Banner card" },
  ],
  lists: [
    {
      name: "features",
      label: "Items",
      itemLabel: "Item",
      max: 20,
      fields: [
        { name: "title", label: "Title", type: "text" as const },
        { name: "description", label: "Text", type: "textarea" as const },
        ...pictureFields,
      ],
    },
  ],
};

const layoutForm = {
  fields: [],
  lists: [
    {
      name: "sections",
      label: "Sections, in page order",
      itemLabel: "Section",
      max: serviceSectionOptions.length,
      help: "Use ↑ Up and ↓ Down to reorder. “Blocks added under Pages” are the page's own blocks from Pages.",
      fields: [
        { name: "title", label: "Section", type: "select" as const, options: serviceSectionOptions },
        { name: "show", label: "On the website", type: "select" as const, options: showOrHide },
      ],
    },
  ],
};

/** The billing units a service package can pick, as [value, its starting words]; the words are set on the section. */
const billingUnits = [
  ["one_time", "one-time"],
  ["month", "per month"],
  ["user_month", "per user / month"],
  ["device_month", "per device / month"],
  ["site_month", "per site / month"],
  ["project", "per project"],
] as const;

/** Up to 12 packages on a service page: the table needs a column for each. */
const SERVICE_PLAN_MAX = 12;

/** A form's fields with more added straight after the named ones. */
const withAfter = (fields: HomeField[], after: Record<string, HomeField[]>) => fields.flatMap((field) => [field, ...(after[field.name] ?? [])]);

/**
 * A service page's packages use the IT AMC page's form (the IT AMC page's
 * own form stays as it is), plus: up to 12 packages; a billing unit, a
 * two-part price and a third-party costs line per package; the comparison
 * table switched on or off; quote buttons that fill in the enquiry form; and
 * the choice of banner card (the IT AMC page always sums up its plans there,
 * a service page keeps listing what's included unless its packages are
 * picked).
 */
const amcPlansForm = amcBlocks.find((block) => block.key === "amc_plans")!;
const [amcPlanList, amcCompareList] = amcPlansForm.lists;
const servicePlansForm = {
  fields: withAfter(amcPlansForm.fields, {
    intro: [
      {
        name: "layout",
        label: "Packages shown as",
        type: "select",
        options: [
          { value: "auto", label: "Automatic: a price list for more than 4 quote-only packages, else cards" },
          { value: "cards", label: "Cards" },
          { value: "list", label: "Price list (a row per package)" },
        ],
        help: "Quote-only packages have just a name, a price and a third-party note: no points, deliverables, groups, exclusions or extras.",
      },
    ],
    compare_label: [
      {
        name: "banner_card",
        label: "Card beside the top banner",
        type: "select",
        options: [
          { value: "included", label: "What's included (unchanged)" },
          { value: "plans", label: "These packages" },
        ],
        group: "Banner card",
        help: "Showing this section doesn't change the card unless “These packages” is picked here.",
      },
    ],
    terms: [
      ...billingUnits.map(([value, words]): HomeField => ({
        name: `unit_${value}`,
        label: `Words for “${words}”`,
        type: "text",
        group: "Billing units",
        help: value === "one_time" ? "Each package picks its billing unit; these are the words shown after its price." : undefined,
      })),
      { name: "setup_label", label: "Name for the setup fee", type: "text", group: "Two-part price" },
      { name: "management_label", label: "Name for the management fee", type: "text", group: "Two-part price" },
    ],
    button_link: [
      {
        name: "quote_prefill",
        label: "Quote buttons fill in the enquiry form",
        type: "select",
        options: [
          { value: "no", label: "No: plain link" },
          { value: "yes", label: "Yes: with this service and the package" },
        ],
        group: "Button",
        help: "Adds ?service=…&package=… to buttons that link to a page on this website, e.g. /contact-us, where the form starts with them filled in.",
      },
    ],
    table_heading: [
      {
        name: "show_table",
        label: "Comparison table",
        type: "select",
        options: [
          { value: "auto", label: "Automatic: shown with up to 4 packages" },
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ],
        group: "Comparison table",
      },
    ],
  }),
  lists: [
    {
      ...amcPlanList,
      max: SERVICE_PLAN_MAX,
      help: "Cheapest first: the table's columns follow this order. Up to 4 sit side by side; more wrap in rows of three. A plan with a badge is shown raised, with its badge on top. A hidden plan keeps its column in the table rows but shows nowhere on the website (not even in its code), except in a preview.",
      fields: withAfter(amcPlanList.fields, {
        price: [
          {
            name: "unit_type",
            label: "Billing unit",
            type: "select",
            options: [
              { value: "", label: "Page default (Words after each price)" },
              ...billingUnits.map(([value, words]) => ({ value, label: words })),
              { value: "custom", label: "Custom text (below)" },
            ],
            group: "Price",
          },
          { name: "unit_custom", label: "Custom billing unit", type: "text", group: "Price", help: "Used when the billing unit is “Custom text”, e.g. per mailbox / month." },
        ],
        badge: [
          { name: "setup_fee", label: "Setup fee (one-time)", type: "text", group: "Two-part price", help: "Optional, e.g. AED 2,000. With no Price above, the management fee (or else this) is shown as the price." },
          { name: "management_fee", label: "Management fee (monthly)", type: "text", group: "Two-part price" },
        ],
        extras: [
          { name: "third_party", label: "Third-party costs", type: "text", group: "Not included & extras", help: "One line, e.g. Microsoft 365 / Google Workspace / AWS / Azure subscriptions billed separately." },
        ],
      }),
    },
    {
      ...amcCompareList,
      fields: [
        ...amcCompareList.fields.filter((field) => !/^plan\d+$/.test(field.name)),
        ...Array.from({ length: SERVICE_PLAN_MAX }, (_, i): HomeField => ({ name: `plan${i + 1}`, label: `Plan ${i + 1}`, type: "text" })),
      ],
    },
  ],
};

/** A service page's forms on the "Service pages" screen, saved on its own page as svc_<section>. */
export function servicePageBlocks(slug: string): HomeBlockDef[] {
  return serviceSectionForms.map(([section, label, shows, template]) => {
    const form =
      section === "layout" ? layoutForm : section === "features" ? featureForm : section === "plans" ? servicePlansForm : amcBlocks.find((block) => block.key === template)!;
    return {
      key: `${slug}:svc_${section}`,
      sectionType: `svc_${section}`,
      page: slug,
      preview: `/${slug}`,
      label,
      shows,
      fields: form.fields,
      lists: form.lists,
      remoteDefaults: { slug, section },
      defaults: { fields: {}, lists: {} },
      ...(section === "reviews" ? { picturesElsewhere: amcBlocks.find((block) => block.key === "amc_reviews")?.picturesElsewhere } : {}),
    };
  });
}

const allServicePageBlocks = servicePageList.flatMap((page) => servicePageBlocks(page.slug));

/**
 * The Privacy Policy and Terms & Conditions pages, linked from the footer's
 * Legal column. Each is saved on its own page, created on first save.
 */
export const legalBlocks: HomeBlockDef[] = [
  {
    key: "legal_privacy",
    page: "privacy-policy",
    preview: "/privacy-policy",
    label: "Privacy Policy",
    shows: "The Privacy Policy page (/privacy-policy), linked from the footer's Legal column.",
    fields: legalFields,
    lists: [legalSections],
    defaults: {
      fields: {
        eyebrow: "Legal",
        title: "Privacy Policy",
        updated: "Last updated: 11 November 2026",
        intro: "This policy explains what personal information Byteflow collects when you use byteflow.ae or contact us, why we collect it, who we share it with and the choices you have.",
      },
      lists: {
        sections: [
          { title: "Who we are", description: "Byteflow Information Technology Co. L.L.C. (\"Byteflow\", \"we\", \"us\") is an IT services company registered in Dubai, United Arab Emirates. We are responsible for the personal information described in this policy.\n\nByteflow Information Technology Co. L.L.C.\nEmaar Park 4, Greens, TECOM, Dubai, United Arab Emirates\nEmail: info@byteflow.ae\nPhone: +971 54 328 2042" },
          { title: "Information we collect", description: "Information you give us:\n- Your name, company, email address, phone number and message when you fill in a contact or inquiry form, or send us an email or WhatsApp message.\n- Details you share with us about your business, systems and requirements so we can prepare a quote or provide our services.\n\nInformation collected automatically when you visit the website:\n- Technical details such as your browser, device, approximate location (from your IP address) and the pages you view, collected through cookies and similar technologies.\n\nIf you are a client, we may also access information held on your systems while providing IT support. That access is governed by your service agreement with us, not by this policy." },
          { title: "How we use your information", description: "We use your personal information to:\n- Reply to your inquiries and prepare quotes.\n- Provide, manage and invoice the services you have agreed with us.\n- Send you news and offers by email, where you have agreed to receive them. Every email has an unsubscribe link.\n- Understand how the website is used so we can improve it.\n- Protect the website and our forms against spam and misuse.\n- Meet our legal, tax and accounting obligations." },
          { title: "Cookies and analytics", description: "The website uses cookies and similar technologies. We use Google Analytics to understand how visitors use the website, for example which pages are visited and which lead to an inquiry. Our forms are protected by Google reCAPTCHA, which checks that a form is being sent by a person and not an automated program.\n\nThese services are provided by Google, which processes the information under its own privacy policy. You can block or delete cookies in your browser settings; some parts of the website may not work as intended if you do." },
          { title: "Who we share it with", description: "We do not sell your personal information. We share it only with:\n- Service providers who help us run our business, such as website hosting, email and analytics providers, and only for the purposes described in this policy.\n- Authorities, courts or advisers where the law requires it, or to protect our rights.\n\nSome of these providers may store or process information outside the United Arab Emirates. Where that happens, we take reasonable steps to make sure your information stays protected." },
          { title: "How long we keep it", description: "We keep personal information only for as long as we need it for the purposes above, or for as long as the law requires us to keep it, for example for accounting records. When we no longer need it, we delete it or make it anonymous." },
          { title: "How we protect it", description: "We use technical and organisational measures to protect personal information against loss, misuse and unauthorised access, including access controls and encrypted connections. No method of sending or storing information is completely secure, but we work to keep your information safe." },
          { title: "Your rights", description: "Subject to the law that applies, including the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021), you may ask us to:\n- Tell you what personal information we hold about you and give you a copy.\n- Correct information that is wrong or incomplete.\n- Delete your information, or stop or limit how we use it.\n- Stop sending you marketing emails, at any time.\n\nTo make a request, email info@byteflow.ae. We may need to confirm your identity before we act on it." },
          { title: "Children", description: "Our website and services are intended for businesses. They are not directed at children under 18, and we do not knowingly collect personal information from them." },
          { title: "Changes to this policy", description: "We may update this policy from time to time. The date at the top of this page shows when it was last changed." },
          { title: "Contact us", description: "If you have any questions about this policy or how we handle your personal information, please contact us:\n\nByteflow Information Technology Co. L.L.C.\nEmaar Park 4, Greens, TECOM, Dubai, United Arab Emirates\nEmail: info@byteflow.ae\nPhone: +971 54 328 2042" },
        ],
      },
    },
  },
  {
    key: "legal_terms",
    page: "terms-and-conditions",
    preview: "/terms-and-conditions",
    label: "Terms & Conditions",
    shows: "The Terms & Conditions page (/terms-and-conditions), linked from the footer's Legal column.",
    fields: legalFields,
    lists: [legalSections],
    defaults: {
      fields: {
        eyebrow: "Legal",
        title: "Terms & Conditions",
        updated: "Last updated: 11 November 2026",
        intro: "These terms apply to your use of byteflow.ae. By using the website you agree to them. Please read them carefully.",
      },
      lists: {
        sections: [
          { title: "About these terms", description: "The website byteflow.ae is operated by Byteflow Information Technology Co. L.L.C. (\"Byteflow\", \"we\", \"us\"), a company registered in Dubai, United Arab Emirates. These terms cover your use of the website. If you do not agree with them, please do not use the website." },
          { title: "Our services", description: "The information on this website describes our services in general terms. It is not an offer that can be accepted. The services we provide to a client, and the price, are set out in a written quotation or service agreement. If anything in that quotation or agreement differs from this website or these terms, the quotation or agreement applies." },
          { title: "Quotes and prices", description: "Quotes are valid for the period stated on them. Unless a quote says otherwise, prices are in UAE dirhams (AED) and exclude VAT, which is added at the applicable rate." },
          { title: "Using the website", description: "You agree to use the website only for lawful purposes. You must not:\n- Try to gain unauthorised access to the website, its servers or any connected system.\n- Interfere with how the website works, including by introducing viruses or other harmful code.\n- Copy or collect content from the website by automated means without our written permission.\n- Use the contact forms to send spam or misleading information." },
          { title: "Intellectual property", description: "The content of this website, including its text, design, graphics and the Byteflow name and logo, belongs to Byteflow or is used with permission. You may view and print pages for your own reference, but you may not copy, reproduce or use our content for commercial purposes without our written permission. Other names, logos and trademarks shown on the website belong to their owners." },
          { title: "Links to other websites", description: "The website may link to websites run by others. We do not control those websites and are not responsible for their content or how they handle your information." },
          { title: "Accuracy of information", description: "We work to keep the information on the website accurate and up to date, but we do not guarantee that it is complete, current or free of errors. We may change the website or its content at any time without notice." },
          { title: "Limitation of liability", description: "The website is provided \"as is\". To the extent permitted by law, Byteflow is not liable for any indirect or consequential loss, or for any loss of data, profit or business, arising from your use of the website or your reliance on its content. Nothing in these terms limits any liability that cannot be limited under the law of the United Arab Emirates." },
          { title: "Privacy", description: "How we collect and use personal information is explained in our Privacy Policy." },
          { title: "Governing law", description: "These terms are governed by the laws of the Emirate of Dubai and the federal laws of the United Arab Emirates. The courts of Dubai have jurisdiction over any dispute arising from them." },
          { title: "Changes to these terms", description: "We may update these terms from time to time. The date at the top of this page shows when they were last changed. Your continued use of the website means you accept the updated terms." },
          { title: "Contact us", description: "If you have any questions about these terms, please contact us:\n\nByteflow Information Technology Co. L.L.C.\nEmaar Park 4, Greens, TECOM, Dubai, United Arab Emirates\nEmail: info@byteflow.ae\nPhone: +971 54 328 2042" },
        ],
      },
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

/** A home, About, Services, Industries, IT AMC or legal page block by its key. */
export function getHomeBlockDef(key: string | null): HomeBlockDef | undefined {
  return [...homeBlocks, ...aboutBlocks, ...servicesBlocks, ...industriesBlocks, ...projectsBlocks, ...blogBlocks, ...contactBlocks, ...amcBlocks, ...allServicePageBlocks, ...legalBlocks].find((block) => block.key === key);
}

const LIMITS: Record<HomeFieldType, number> = { text: 200, textarea: 2000, link: 500, image: 500, select: 40, service: 100, tab: 200, post: 200, category: 200, menugroup: 200 };

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
