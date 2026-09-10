/**
 * The services the website ships with. These have hand-written pages in the
 * site repo (app/<slug>/page.tsx) and, until they exist as rows here, they
 * can't be edited or reordered from the admin panel — and adding any single
 * service would replace all of them on the homepage grid. Importing them
 * makes the database the single source of truth for the services grid.
 *
 * Slugs must keep matching the site's route folders so "Learn more" keeps
 * opening the existing detailed page.
 */
export type BuiltinService = {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
};

export const builtinServices: BuiltinService[] = [
  {
    slug: "system-integration",
    title: "System Integration",
    excerpt:
      "Connecting your computers, servers, printers, CCTV, cloud storage and Microsoft 365 into one seamless setup. No downtime, no confusion — just a connected, efficient office.",
    description:
      "We connect your computers, servers, printers, IP phones, CCTV, access control, cloud storage and Microsoft 365 into one cohesive infrastructure. From a single-office setup in Business Bay to a multi-site network across the UAE, we design and build it all.",
  },
  {
    slug: "cyber-security",
    title: "Cyber Security",
    excerpt:
      "Firewalls, antivirus, email security and network protection for UAE businesses. Fast response, expert team and affordable packages for small and medium businesses.",
    description:
      "Layered cyber security covering firewalls, endpoint protection, email security and real-time network monitoring. We protect Dubai businesses from ransomware, phishing, data breaches and insider threats with solutions that scale from 5 to 500 users.",
  },
  {
    slug: "it-amc-services-dubai",
    title: "IT AMC / IT Support",
    excerpt:
      "Manage your computers, servers, network and IT infrastructure for a fixed monthly fee. No surprise costs — reliable support across Dubai, Sharjah and Abu Dhabi.",
    description:
      "A fully managed Annual Maintenance Contract that covers every device, server and network in your office. One fixed monthly fee replaces unpredictable repair bills and slow response times across Dubai, Sharjah and Abu Dhabi.",
  },
  {
    slug: "data-backup-recovery",
    title: "Data Backup & Recovery",
    excerpt:
      "Automatic cloud backup with fast recovery when you need it most. We protect your files, emails and systems so a server crash or ransomware attack never shuts you down.",
    description:
      "Automated multi-destination backups running every hour, with fast recovery that restores individual files or entire servers within hours. Purpose-built for UAE businesses that cannot afford extended downtime or data loss.",
  },
  {
    slug: "website-development",
    title: "Website / Apps / Bots",
    excerpt:
      "Professional websites, mobile apps and AI chatbots built with WordPress, custom development and automation tools. From a simple website to a full e-commerce store.",
    description:
      "Professional websites, e-commerce stores, mobile applications and AI-powered chatbots built by our in-house development team. From a sharp corporate site on WordPress to a fully custom web application, we design and build everything with Dubai business goals in mind.",
  },
  {
    slug: "cloud-services-dubai",
    title: "Cloud Services",
    excerpt:
      "Microsoft 365 setup, cloud backup and cloud server solutions for Dubai businesses. We migrate your team, manage licenses and ensure your data is always secure.",
    description:
      "Microsoft 365 setup and migration, Azure cloud servers, cloud backup and hybrid infrastructure management for Dubai businesses. We handle every aspect of your cloud environment so you can focus on running your business, not managing your IT.",
  },
  {
    slug: "graphics-designing",
    title: "UI/UX & Graphics Design",
    excerpt:
      "Logos, social media graphics, brochures and UI/UX designs for Dubai businesses. From a company logo to a full brand identity — fast turnaround, modern design.",
    description:
      "Logo design, brand identity, UI/UX design, social media graphics, company profiles, brochures and presentation design for Dubai businesses. Fast turnaround, unlimited revisions and a creative team that understands the UAE market.",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    excerpt:
      "SEO, Google Ads, Facebook advertising and content marketing across Dubai and UAE. Data-driven campaigns with local search visibility that drive measurable results.",
    description:
      "SEO, Google Ads, social media advertising, content marketing and email campaigns built around UAE search behaviour and buying patterns. Every campaign is tracked to actual leads and revenue, not just impressions and clicks.",
  },
  {
    slug: "landing-page-designing",
    title: "Landing Page Designing",
    excerpt:
      "High-converting landing pages for Google Ads, social media campaigns and product launches. Fast load times, mobile-first design and clear calls to action.",
    description:
      "High-converting landing pages for Google Ads, social media campaigns and product launches. Fast load times, mobile-first design and clear calls to action built around what Dubai audiences actually respond to.",
  },
];
