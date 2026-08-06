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

export const resources = {
  pages: {
    table: "pages",
    title: "Pages & SEO",
    singular: "Page",
    orderBy: "name",
    fields: [
      { name: "name", label: "Page name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea" },
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
      { name: "hero_description", label: "Hero description", type: "textarea" },
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
        options: ["draft", "published"],
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
      { name: "page_id", label: "Page ID", type: "number", required: true },
      {
        name: "section_type",
        label: "Section type",
        type: "select",
        options: [
          "hero",
          "about",
          "founder",
          "services",
          "faq",
          "reviews",
          "cta",
          "team",
          "contact",
          "map",
          "custom",
        ],
        required: true,
      },
      { name: "name", label: "Section name", type: "text", required: true },
      {
        name: "content",
        label: "Section fields",
        type: "json",
        required: true,
        help: "Add the content fields used by this section.",
      },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "visible", label: "Visible", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["draft", "published"],
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
      { name: "excerpt", label: "Short description", type: "textarea" },
      { name: "description", label: "Full description", type: "textarea" },
      { name: "icon", label: "Icon", type: "text" },
      { name: "image_url", label: "Image URL", type: "text" },
      { name: "image_alt", label: "Image alt text", type: "text" },
      { name: "cta_label", label: "CTA label", type: "text" },
      { name: "cta_link", label: "CTA link", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      {
        name: "status",
        label: "Publication",
        type: "select",
        options: ["draft", "published"],
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
        options: ["draft", "published"],
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
        options: ["draft", "published"],
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
      { name: "physical_address", label: "Physical address", type: "textarea" },
      { name: "business_hours", label: "Business hours", type: "textarea" },
      { name: "footer_text", label: "Footer text", type: "textarea" },
      { name: "copyright_text", label: "Copyright text", type: "text" },
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
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea" },
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
      { name: "bullet_points", label: "Project deliverables", type: "json" },
      { name: "metrics", label: "Project results", type: "json" },
      { name: "tags", label: "Project tags", type: "json" },
      { name: "sort_order", label: "Display order", type: "number" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "published", label: "Published", type: "boolean" },
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
