import { getAdminSection, siteUrl } from "../lib/admin-guide";

/**
 * Every admin screen leads with the same thing: what it is, where it shows
 * up on the public website, and a link to go look at it.
 */
export default function AdminPageHeader({
  sectionKey,
  title,
}: {
  sectionKey: string;
  title?: string;
}) {
  const section = getAdminSection(sectionKey);
  if (!section) {
    return (
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title ?? sectionKey}
      </h1>
    );
  }
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title ?? section.label}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">On your website: </span>
        {section.shows}
      </p>
      {section.preview && (
        <a
          href={siteUrl(section.preview)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/10"
        >
          View on website
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}
