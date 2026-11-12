import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../../lib/auth";
import { servicePageBlocks, servicePageList } from "../../lib/home-sections";
import HomeSectionsManager from "../home-sections/HomeSectionsManager";

/**
 * The service pages' sections (Cyber Security, Cloud and the rest): pick a
 * service along the top, then edit its page tab by tab, as on the IT AMC
 * page screen. ?service=<slug> chooses the service.
 */
export default async function ServicePagesPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { service } = await searchParams;
  const current = servicePageList.find((page) => page.slug === service) ?? servicePageList[0];

  return (
    <div>
      <nav aria-label="Service" className="mb-6 flex flex-wrap gap-2">
        {servicePageList.map((page) => {
          const on = page.slug === current.slug;
          return (
            <Link
              key={page.slug}
              href={`/admin/service-pages?service=${page.slug}`}
              aria-current={on ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                on ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {page.name}
            </Link>
          );
        })}
      </nav>
      {/* Keyed by the service, so switching starts the form afresh. */}
      <HomeSectionsManager
        key={current.slug}
        blocks={servicePageBlocks(current.slug)}
        sectionKey="service-pages"
        pageName={`${current.name} page`}
        preview={`/${current.slug}`}
      />
    </div>
  );
}
