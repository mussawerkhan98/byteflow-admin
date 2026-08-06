import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBars,
  faBriefcase,
  faCircleQuestion,
  faEnvelope,
  faFileLines,
  faInbox,
  faPenNib,
  faPlus,
  faSliders,
  faStar,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../lib/db";
import { isAdminAuthenticated } from "../lib/auth";

const metrics = [
  {
    label: "Pages",
    table: "pages",
    href: "pages",
    icon: faFileLines,
    color: "cyan",
    description: "Published routes and SEO",
  },
  {
    label: "Services",
    table: "services",
    href: "services",
    icon: faBriefcase,
    color: "blue",
    description: "Service catalogue",
  },
  {
    label: "FAQs",
    table: "faqs",
    href: "faqs",
    icon: faCircleQuestion,
    color: "violet",
    description: "Reusable answers",
  },
  {
    label: "Reviews",
    table: "testimonials",
    href: "testimonials",
    icon: faStar,
    color: "amber",
    description: "Customer proof",
  },
  {
    label: "Team",
    table: "team_members",
    href: "team",
    icon: faUsers,
    color: "emerald",
    description: "People and profiles",
  },
  {
    label: "Enquiries",
    table: "contact_submissions",
    href: "submissions",
    icon: faEnvelope,
    color: "rose",
    description: "Contact submissions",
  },
] as const;
const tones = {
  cyan: "from-cyan-400/20 text-cyan-300",
  blue: "from-blue-500/20 text-blue-300",
  violet: "from-violet-500/20 text-violet-300",
  amber: "from-amber-400/20 text-amber-300",
  emerald: "from-emerald-400/20 text-emerald-300",
  rose: "from-rose-400/20 text-rose-300",
};
const quickLinks = [
  { label: "Update contact details", href: "settings", icon: faSliders },
  { label: "Review navigation", href: "menus", icon: faBars },
  { label: "Publish a blog post", href: "posts", icon: faPenNib },
  { label: "Add a service", href: "services", icon: faPlus },
];

export default async function Dashboard() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const counts = await Promise.all(
    metrics.map(async ({ table }) => {
      try {
        const result = await db.execute(`SELECT COUNT(*) count FROM ${table}`);
        return Number(result.rows[0]?.count ?? 0);
      } catch {
        return 0;
      }
    }),
  );
  const recent = await db
    .execute(
      "SELECT id,name,email,submitted_at,is_read FROM contact_submissions ORDER BY submitted_at DESC LIMIT 5",
    )
    .catch(() => ({ rows: [] }));
  return (
    <>
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Good to see you.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Manage Byteflow content, customer enquiries, and website settings
            from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pages"
            className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/30 hover:bg-cyan-400/[.06]"
          >
            Manage pages
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,.15)]"
          >
            Add blog post
          </Link>
        </div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((item, index) => (
          <Link
            href={`/admin/${item.href}`}
            key={item.href}
            className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-[#0d1921] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[.13] hover:shadow-2xl"
          >
            <div
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tones[item.color]} via-current to-transparent opacity-60`}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {counts[index].toLocaleString()}
                </p>
              </div>
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tones[item.color]} to-transparent`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[.05] pt-4">
              <p className="text-xs text-slate-600">{item.description}</p>
              <span className="text-slate-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300">
                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-white/[.07] bg-[#0d1921]">
          <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent enquiries</h2>
              <p className="mt-1 text-xs text-slate-600">
                Latest contact form activity
              </p>
            </div>
            <Link
              href="/admin/submissions"
              className="text-xs font-semibold text-cyan-300"
            >
              View all
              <FontAwesomeIcon icon={faArrowRight} className="ml-1 h-3 w-3" />
            </Link>
          </div>
          {recent.rows.length ? (
            <div className="divide-y divide-white/[.05]">
              {recent.rows.map((row) => (
                <Link
                  href="/admin/submissions"
                  key={String(row.id)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[.02]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-400/[.08] text-xs font-bold text-cyan-300">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-200">
                      {String(row.name)}
                    </p>
                    <p className="truncate text-xs text-slate-600">
                      {String(row.email)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-600">
                      {String(row.submitted_at)}
                    </p>
                    {!Boolean(row.is_read) && (
                      <span className="mt-1 inline-block rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                        New
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[.03] text-slate-600">
                  <FontAwesomeIcon icon={faInbox} className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-300">
                  No enquiries yet
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  New submissions will appear here.
                </p>
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#0d1921] to-[#0a151c] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-400">
            Quick start
          </p>
          <h2 className="mt-3 text-xl font-bold text-white">
            Keep your site fresh
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Review key content and keep public information accurate.
          </p>
          <div className="mt-6 space-y-2">
            {quickLinks.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={`/admin/${href}`}
                className="flex items-center gap-3 rounded-xl border border-white/[.05] bg-white/[.02] px-3 py-3 text-xs font-medium text-slate-400 hover:border-cyan-400/20 hover:text-white"
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-400/[.07] text-[10px] font-bold text-cyan-400">
                  <FontAwesomeIcon icon={icon} className="h-3 w-3" />
                </span>
                {label}
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="ml-auto h-3 w-3 text-slate-700"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
