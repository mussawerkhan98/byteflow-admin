export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "email"
  | "url"
  | "json";
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
};
export type Resource = {
  table: string;
  title: string;
  singular: string;
  orderBy: string;
  fields: Field[];
  readOnly?: boolean;
  singleton?: boolean;
};

/**
 * The site-wide figures (Contact details & logo) can be quoted in text, so a
 * number typed once stays the same on every page. The website fills these in
 * (byteflow, app/lib/site-figures.ts).
 */
export const figuresHelp =
  "To quote the site-wide figures, type {clients}, {rating}, {reviews}, {founded} or {years} (years in business); they are set under Contact details & logo.";

export const resources = {
  pages: {
    table: "pages",
    title: "Pages & SEO",
    singular: "Page",
    orderBy: "name",
    fields: [
      { name: "name", label: "Page name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "meta_title", label: "Meta title", type: "text", help: figuresHelp },
      { name: "meta_description", label: "Meta description", type: "textarea", help: figuresHelp },
      { name: "canonical_url", label: "Canonical URL", type: "url" },
      { name: "og_title", label: "Open Graph title", type: "text" },
      {
        name: "og_description",
        label: "Open Graph description",
        type: "textarea",
      },
      { name: "og_image", label: "Open Graph image", type: "text" },
      { name: "hero_label", label: "Hero eyebrow / label", type: "text" },
      { name: "hero_heading", label: "Hero heading", type: "text" },
      { name: "hero_description", label: "Hero description", type: "textarea", help: figuresHelp },
      {
        name: "hero_background_image",
        label: "Hero background image",
        type: "text",
      },
      {
        name: "hero_primary_label",
        label: "Primary button label",
        type: "text",
      },
      { name: "hero_primary_link", label: "Primary button link", type: "text" },
      {
        name: "hero_secondary_label",
        label: "Secondary button label",
        type: "text",
      },
      {
        name: "hero_secondary_link",
        label: "Secondary button link",
        type: "text",
      },
      { name: "indexable", label: "Allow indexing", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["published", "draft"],
      },
    ],
  },
  menus: {
    table: "menu_items",
    title: "Menus",
    singular: "Menu item",
    orderBy: "area, sort_order",
    fields: [
      {
        name: "area",
        label: "Area",
        type: "select",
        required: true,
        options: ["header", "footer"],
      },
      { name: "label", label: "Label", type: "text", required: true },
      {
        name: "href",
        label: "Internal or external link",
        type: "text",
        required: true,
      },
      { name: "parent_id", label: "Parent item ID", type: "number" },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "new_tab", label: "Open in new tab", type: "boolean" },
      {
        name: "visible",
        label: "Visible",
        type: "boolean",
        help: "Visible menu items appear in the website navigation.",
      },
    ],
  },
  sections: {
    table: "page_sections",
    title: "Page Sections",
    singular: "Section",
    orderBy: "page_id, sort_order",
    fields: [
      { name: "page_id", label: "Page", type: "number", required: true },
      {
        name: "section_type",
        label: "Section type",
        type: "select",
        options: [
          "custom",
          "hero",
          "founder",
          "home_services_intro",
          "home_work",
          "home_needs",
          "home_about",
          "home_promise",
          "home_process",
          "home_help",
        ],
        required: true,
        help: "“custom” is a content block that appears near the bottom of the page you choose. “hero” and “founder” feed the top banner and the About Us founder block. The “home_…” types are edited on the Home page sections screen. Services, FAQs, Reviews, Calls to action and Team each have their own screen in the sidebar.",
      },
      {
        name: "name",
        label: "Section name",
        type: "text",
        required: true,
        help: "Only used to identify this block in the list below — visitors never see it.",
      },
      {
        name: "content",
        label: "Section content",
        type: "json",
        required: true,
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "visible", label: "Visible", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["published", "draft"],
      },
    ],
  },
  services: {
    table: "services",
    title: "Services",
    singular: "Service",
    orderBy: "sort_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "excerpt",
        label: "Short description",
        type: "textarea",
        help: "Also the paragraph on this service's tab in the home page Services section. Keep it to two or three sentences.",
      },
      { name: "description", label: "Full description", type: "textarea" },
      {
        name: "eyebrow",
        label: "Home tab — small heading",
        type: "text",
        help: "The letter-spaced line above the service name on its home page tab, e.g. “Keep your business running”. Up to 40 characters. Blank uses the website's own.",
      },
      {
        name: "tagline",
        label: "Home tab — subtitle",
        type: "text",
        help: "One line in cyan under the service name. Up to 80 characters. Blank uses the service page's tagline.",
      },
      {
        name: "highlights",
        label: "Home tab — bullet points",
        type: "textarea",
        help: "One per line, up to 5, each up to 70 characters. Blank uses the first four features from the service page.",
      },
      {
        name: "icon",
        label: "Icon",
        type: "text",
        help: "An SVG file up to 256 KB, shown on the service card. Exports from Figma, Illustrator and Inkscape all work as they come.",
      },
      {
        name: "image_url",
        label: "Image",
        type: "text",
        help: "The large picture on this service's home page tab (shown 4:3, cropped to fill). Upload a photo about 1200×900; it is converted to WebP. Blank shows the service icon on navy.",
      },
      {
        name: "image_alt",
        label: "Image alt text",
        type: "text",
        help: "Describe what the photo shows, for screen readers and Google. Up to 125 characters.",
      },
      {
        name: "image_caption",
        label: "Home tab — image caption",
        type: "text",
        help: "The small dark label on the picture, e.g. “Monitored 24/7. Fixed in hours.” Up to 48 characters. Blank uses the service page's headline figure.",
      },
      {
        name: "cta_label",
        label: "Home tab — button text",
        type: "text",
        help: "Blank shows “Discuss this service”. Up to 28 characters.",
      },
      {
        name: "cta_link",
        label: "Home tab — button link",
        type: "url",
        help: "A page on this site (/contact-us) or a full https:// address. Blank links to /contact-us.",
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "featured", label: "Featured", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["published", "draft"],
        help: "Only published services appear on the website.",
      },
    ],
  },
  faqs: {
    table: "faqs",
    title: "FAQs",
    singular: "FAQ",
    orderBy: "sort_order",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", required: true },
      { name: "category", label: "Category", type: "text" },
      {
        name: "page_id",
        label: "Display on page",
        type: "number",
        required: true,
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "active", label: "Active", type: "boolean" },
    ],
  },
  testimonials: {
    table: "testimonials",
    title: "Reviews",
    singular: "Review",
    orderBy: "sort_order",
    fields: [
      {
        name: "customer_name",
        label: "Customer name",
        type: "text",
        required: true,
      },
      { name: "customer_role", label: "Role or company", type: "text" },
      {
        name: "review_text",
        label: "Review",
        type: "textarea",
        required: true,
      },
      { name: "rating", label: "Rating (1–5)", type: "number" },
      { name: "source", label: "Source/platform", type: "text" },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "featured", label: "Featured", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["published", "draft"],
      },
    ],
  },
  ctas: {
    table: "ctas",
    title: "Calls to Action",
    singular: "CTA",
    orderBy: "sort_order",
    fields: [
      { name: "name", label: "Internal name", type: "text", required: true },
      { name: "heading", label: "Heading", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "background_image", label: "Background image", type: "text" },
      { name: "button_label", label: "Button label", type: "text" },
      { name: "button_link", label: "Button link", type: "text" },
      { name: "phone_number", label: "Phone number", type: "text" },
      { name: "whatsapp_link", label: "WhatsApp link", type: "url" },
      {
        name: "page_id",
        label: "Display on page",
        type: "number",
        required: true,
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "visible", label: "Visible", type: "boolean" },
    ],
  },
  team: {
    table: "team_members",
    title: "Team",
    singular: "Team member",
    orderBy: "sort_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "job_title", label: "Job title", type: "text", required: true },
      { name: "biography", label: "Biography", type: "textarea" },
      { name: "image_url", label: "Profile image", type: "text" },
      { name: "image_alt", label: "Image alt text", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
      { name: "x_url", label: "X URL", type: "url" },
      { name: "github_url", label: "GitHub URL", type: "url" },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "featured", label: "Featured", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["published", "draft"],
      },
    ],
  },
  settings: {
    table: "site_settings",
    title: "Site Settings",
    singular: "Settings",
    orderBy: "id",
    singleton: true,
    fields: [
      {
        name: "business_name",
        label: "Business name",
        type: "text",
        required: true,
      },
      { name: "logo_url", label: "Logo", type: "text" },
      { name: "favicon_url", label: "Favicon", type: "text" },
      { name: "header_phone", label: "Header phone", type: "text" },
      { name: "whatsapp_number", label: "WhatsApp number", type: "text" },
      { name: "whatsapp_link", label: "WhatsApp link", type: "url" },
      { name: "primary_email", label: "Primary email", type: "email" },
      {
        name: "physical_address",
        label: "Physical address",
        type: "textarea",
        help: "Shown in the footer and on the About page. Give the full address, the same as in the “Address” script and on Google: Google compares them.",
      },
      { name: "business_hours", label: "Business hours", type: "textarea", help: "Shown in the footer under the address." },
      {
        name: "footer_text",
        label: "Footer text",
        type: "textarea",
        help: "What Byteflow does, in a sentence. The bottom of the footer already says how many businesses you serve and since when, so there is no need to repeat it here.",
      },
      { name: "copyright_text", label: "Copyright text", type: "text" },
      // Site-wide figures: one value each, quoted everywhere on the website
      // (hero, About, testimonials, footer, meta descriptions).
      {
        name: "client_count",
        label: "Figures — number of clients",
        type: "text",
        help: "Shown exactly as typed, e.g. 574 or 500+. Used in the About section, footer and descriptions. Blank shows 574.",
      },
      {
        name: "google_rating",
        label: "Figures — Google rating",
        type: "text",
        help: "Out of 5, e.g. 4.9. Blank shows 4.9.",
      },
      {
        name: "google_review_count",
        label: "Figures — number of Google reviews",
        type: "text",
        help: "e.g. 52 or 50+. Shown as “Google rating · … reviews” in the About section and beside the testimonials. Blank shows 50+.",
      },
      {
        name: "founded_year",
        label: "Figures — year founded",
        type: "text",
        help: "e.g. 2017. Years in business are counted from it automatically. Blank shows 2017.",
      },
      {
        name: "google_business_url",
        label: "Google Business profile link",
        type: "url",
        help: "The “Read reviews” link in the About section goes here. Use the share link of your Google Business profile (https://…). Blank leaves the rating unlinked.",
      },
      { name: "facebook_url", label: "Facebook URL", type: "url" },
      { name: "instagram_url", label: "Instagram URL", type: "url" },
      { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
      { name: "x_url", label: "X / Twitter URL", type: "url" },
      { name: "youtube_url", label: "YouTube URL", type: "url" },
      { name: "tiktok_url", label: "TikTok URL", type: "url" },
      { name: "github_url", label: "GitHub URL", type: "url" },
      { name: "google_maps_url", label: "Google Maps URL", type: "url" },
      {
        name: "map_embed_url",
        label: "Map embed URL",
        type: "url",
        help: "Only HTTPS Google Maps embed URLs are displayed publicly.",
      },
      { name: "map_latitude", label: "Latitude", type: "text" },
      { name: "map_longitude", label: "Longitude", type: "text" },
      { name: "map_enabled", label: "Map enabled", type: "boolean" },
    ],
  },
  scripts: {
    table: "website_scripts",
    title: "Website Scripts",
    singular: "Script",
    orderBy: "placement, sort_order, name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "placement",
        label: "Placement",
        type: "select",
        required: true,
        options: ["head", "body_end"],
        help: "Use head for verification/meta tags and body_end for most analytics or chat scripts.",
      },
      {
        name: "code",
        label: "Script or HTML snippet",
        type: "textarea",
        required: true,
        help: "Paste the complete code supplied by Google, Meta, analytics, chat, or another trusted provider.",
      },
      { name: "sort_order", label: "Load order", type: "number" },
      { name: "enabled", label: "Enabled", type: "boolean" },
    ],
  },
  posts: {
    table: "posts",
    title: "Blog Posts",
    singular: "Post",
    orderBy: "created_at DESC",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "category", label: "Category", type: "text" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "content", label: "Content", type: "richtext", required: true },
      { name: "date", label: "Publication date", type: "text" },
      { name: "read_time", label: "Read time", type: "text" },
      { name: "image_url", label: "Featured image", type: "text" },
      { name: "image_alt", label: "Cover image description", type: "text" },
      { name: "author_name", label: "Written by", type: "text" },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea" },
      { name: "show_toc", label: "Show “On this page” contents", type: "boolean" },
      { name: "show_share", label: "Show share buttons", type: "boolean" },
      { name: "show_related", label: "Show related articles", type: "boolean" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  projects: {
    table: "projects",
    title: "Projects",
    singular: "Project",
    orderBy: "sort_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      {
        name: "description",
        label: "Project content",
        type: "richtext",
        required: true,
      },
      { name: "category", label: "Category", type: "text" },
      { name: "industry", label: "Industry", type: "text" },
      { name: "year", label: "Year", type: "text" },
      { name: "image_url", label: "Featured image", type: "text" },
      {
        name: "bullet_points",
        label: "Project deliverables",
        type: "json",
        help: "The first three are the ticked “Byteflow scope” list on the homepage card.",
      },
      { name: "metrics", label: "Project results", type: "json" },
      {
        name: "tags",
        label: "Project tags",
        type: "json",
        help: "The first four show as tags on the homepage card.",
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "featured", label: "Featured", type: "boolean", help: "The large lead card on the Projects page." },
      { name: "published", label: "Published", type: "boolean" },
      {
        name: "home_featured",
        label: "Feature on homepage",
        type: "boolean",
        help: "Shows this project in Selected Work on the homepage. Up to four are shown, lowest homepage order first; the first is the large lead card. The card uses this project's title, deliverables, results and tags. With no project ticked, the first four published projects show.",
      },
      {
        name: "home_order",
        label: "Homepage order",
        type: "number",
        help: "1 shows first (top left). Only used when “Feature on homepage” is on.",
      },
      {
        name: "challenge",
        label: "Homepage card — business requirement",
        type: "textarea",
        help: "What the client needed, in one or two sentences, up to 220 characters. Blank uses the start of the project content.",
      },
      {
        name: "card_image",
        label: "Homepage card — image",
        type: "text",
        help: "A screenshot or photo for the dark panel at the top of the card (shown 16:9, cropped to fill). Upload about 1600×900; it is converted to WebP. Blank shows the project number on navy.",
      },
      {
        name: "card_image_alt",
        label: "Homepage card — image alt text",
        type: "text",
        help: "Describe what the picture shows. Up to 125 characters.",
      },
    ],
  },
  forms: {
    table: "contact_form_settings",
    title: "Contact Forms",
    singular: "Form",
    orderBy: "name",
    fields: [
      { name: "name", label: "Form name", type: "text", required: true },
      {
        name: "recipient_email",
        label: "Recipient email",
        type: "email",
        required: true,
      },
      {
        name: "reply_to_mode",
        label: "Reply-to",
        type: "select",
        options: ["submitter", "site"],
      },
      { name: "email_subject", label: "Email subject", type: "text" },
      { name: "success_message", label: "Success message", type: "textarea" },
      { name: "error_message", label: "Error message", type: "textarea" },
      { name: "page_id", label: "Page ID", type: "number" },
      { name: "enabled", label: "Enabled", type: "boolean" },
    ],
  },
  submissions: {
    table: "contact_submissions",
    title: "Submissions",
    singular: "Submission",
    orderBy: "submitted_at DESC",
    readOnly: true,
    fields: [
      { name: "submitted_at", label: "Submitted", type: "text" },
      { name: "name", label: "Name", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "message", label: "Message", type: "textarea" },
      { name: "source_page", label: "Source page", type: "text" },
      { name: "is_read", label: "Read", type: "boolean" },
    ],
  },
  media: {
    table: "media",
    title: "Media",
    singular: "Media item",
    orderBy: "created_at DESC",
    readOnly: true,
    fields: [
      { name: "filename", label: "Filename", type: "text" },
      { name: "url", label: "URL", type: "text" },
      { name: "alt_text", label: "Alt text", type: "text" },
    ],
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof resources;
export function getResource(key: string): Resource | null {
  if (key === "forms" || key === "media") return null;
  return key in resources ? resources[key as ResourceKey] : null;
}
