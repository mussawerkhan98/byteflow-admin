"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";

type PageRow = {
  id: number;
  name: string;
  slug: string;
  status?: string;
};
type ScopedRecord = { page_id?: number | string | null };

async function fetchRecords(resource: string): Promise<ScopedRecord[]> {
  try {
    const response = await fetch(`/api/admin/${resource}`);
    const data = await response.json();
    return response.ok ? (data.records ?? []) : [];
  } catch {
    return [];
  }
}

/**
 * The old "SEO & page settings" screen was just one of five places you had
 * to visit to fully edit a single page (the others being the Page top
 * banners, FAQs, Extra page blocks and Call-to-action screens, each showing
 * every page's records mixed together). This hub is the front door instead:
 * pick a page here and its own workspace has everything for it in one place.
 */
export default function PagesHub() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<{
    faqs: Map<number, number>;
    sections: Map<number, number>;
    ctas: Map<number, number>;
  }>({ faqs: new Map(), sections: new Map(), ctas: new Map() });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [pagesData, faqs, sections, ctas] = await Promise.all([
        fetch("/api/admin/pages")
          .then((response) => response.json())
          .then((data) => (data.records ?? []) as PageRow[]),
        fetchRecords("faqs"),
        fetchRecords("sections"),
        fetchRecords("ctas"),
      ]);
      const countBy = (records: ScopedRecord[]) => {
        const map = new Map<number, number>();
        for (const record of records) {
          const id = Number(record.page_id);
          if (!id) continue;
          map.set(id, (map.get(id) ?? 0) + 1);
        }
        return map;
      };
      setCounts({
        faqs: countBy(faqs),
        sections: countBy(sections),
        ctas: countBy(ctas),
      });
      setPages(pagesData);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? pages.filter(
          (page) =>
            page.name.toLowerCase().includes(query) ||
            page.slug.toLowerCase().includes(query),
        )
      : pages;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [pages, search]);

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="pages" />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search pages by name or URL…"
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400 sm:max-w-xs"
        />
        <p className="text-xs text-slate-500">
          {filtered.length} of {pages.length} page{pages.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No pages match that search.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((page) => {
              const faqCount = counts.faqs.get(page.id) ?? 0;
              const sectionCount = counts.sections.get(page.id) ?? 0;
              const ctaCount = counts.ctas.get(page.id) ?? 0;
              const parts = [
                faqCount ? `${faqCount} FAQ${faqCount === 1 ? "" : "s"}` : "",
                sectionCount
                  ? `${sectionCount} block${sectionCount === 1 ? "" : "s"}`
                  : "",
                ctaCount ? `${ctaCount} CTA${ctaCount === 1 ? "" : "s"}` : "",
              ].filter(Boolean);
              return (
                <Link
                  key={page.id}
                  href={`/admin/page/${page.id}`}
                  className="flex flex-col gap-3 p-4 transition hover:bg-white/[.03] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{page.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      /{page.slug === "home" ? "" : page.slug}
                      {page.status ? ` · ${page.status}` : ""}
                      {parts.length ? ` · ${parts.join(" · ")}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-1.5 text-xs font-semibold text-cyan-300">
                    Open page →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
