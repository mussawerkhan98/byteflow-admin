"use client";

import { useEffect, useState, type ReactNode } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { siteUrl } from "../../lib/admin-guide";
import {
  LIMITS,
  NAV_KINDS,
  SETTING_SECTIONS,
  linkProblem,
  type Cta,
  type MegaGroup,
  type MegaItem,
  type MegaMenu,
  type NavKind,
  type NavRow,
  type SettingField,
} from "../../lib/header-menu-admin";

type Service = { id: number; slug: string; title: string; excerpt: string };
type Data = {
  nav: NavRow[];
  cta: Cta;
  groups: Record<MegaMenu, MegaGroup[]>;
  settings: Record<string, string>;
  services: Service[];
};
type Tab = "bar" | "services" | "industries" | "insights";
type Notice = { type: "ok" | "warn" | "error"; text: string; list?: string[] } | null;

const TABS: { key: Tab; label: string; shows: string }[] = [
  { key: "bar", label: "Bar & links", shows: "The entries in the bar and their order, the button, the phone number and the dark/light switch." },
  { key: "services", label: "Services menu", shows: "The Services mega menu: intro, service groups, featured card and the strip along its bottom." },
  { key: "industries", label: "Industries menu", shows: "The Industries menu. It stays hidden until its entry is switched on under Bar & links and at least one industry has a page link." },
  { key: "insights", label: "Insights menu", shows: "The blog mega menu: intro, topics, the latest articles and its footer strip. Topics and articles come from the blog itself." },
];

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";
const labelClass = "text-xs font-semibold text-slate-300";
const smallButton = "rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 disabled:opacity-30";
const cardClass = "rounded-xl border border-white/[.08] bg-slate-950/40 p-4";

// ── Small inputs ────────────────────────────────────────────────────────────

function Counted({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  const over = value.trim().length > max;
  return <span className={`ml-2 font-normal ${over ? "text-red-300" : "text-slate-600"}`}>{value.trim().length}/{max}</span>;
}

function TextField({
  label,
  value,
  onChange,
  max,
  help,
  multiline,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  help?: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`${labelClass} ${className}`}>
      {label}
      <Counted value={value} max={max} />
      {help && <span className="mt-1 block font-normal text-slate-500">{help}</span>}
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </label>
  );
}

function LinkField({
  label,
  value,
  onChange,
  required = true,
  help,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  help?: string;
  className?: string;
}) {
  const problem = value.trim() || required ? linkProblem(value, { required }) : null;
  return (
    <label className={`${labelClass} ${className}`}>
      {label}
      {help && <span className="mt-1 block font-normal text-slate-500">{help}</span>}
      <input
        value={value}
        placeholder="/contact-us or https://…"
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(problem)}
        className={`${inputClass} ${problem ? "border-red-400/60" : ""}`}
      />
      {problem && <span className="mt-1 block font-normal text-red-300">{problem}</span>}
    </label>
  );
}

function Switch({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (value: boolean) => void; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-xs font-semibold text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan-400" />
      <span>
        {label}
        {help && <span className="mt-1 block font-normal text-slate-500">{help}</span>}
      </span>
    </label>
  );
}

function RowControls({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  onMove: (by: number) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{children}</p>
      <div className="flex gap-2 text-xs">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className={smallButton}>↑ Up</button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className={smallButton}>↓ Down</button>
        <button type="button" onClick={onRemove} className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-red-300">Remove</button>
      </div>
    </div>
  );
}

const moved = <T,>(list: T[], index: number, by: number) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + by, 0, item);
  return next;
};

const addButton = "mt-4 rounded-lg border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-300";

/** A link to a service saves that service's current name and page. */
const withServiceNames = (groups: MegaGroup[], services: Service[]): MegaGroup[] =>
  groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const service = item.service_id ? services.find((s) => s.id === item.service_id) : undefined;
      return service ? { ...item, label: service.title, href: `/${service.slug}` } : item;
    }),
  }));

// ── Settings fields from header-menu-admin ──────────────────────────────────

function SettingInput({ field, value, onChange }: { field: SettingField; value: string; onChange: (value: string) => void }) {
  if (field.type === "switch")
    return <Switch label={field.label} help={field.help} checked={value === "1"} onChange={(on) => onChange(on ? "1" : "0")} />;
  if (field.type === "link")
    return <LinkField label={field.label} help={field.help} value={value} onChange={onChange} required={false} />;
  if (field.type === "number")
    return (
      <label className={labelClass}>
        {field.label}
        {field.help && <span className="mt-1 block font-normal text-slate-500">{field.help}</span>}
        <input type="number" min={1} max={6} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </label>
    );
  return (
    <TextField
      label={field.label}
      help={field.help}
      value={value}
      max={field.max}
      multiline={field.type === "textarea"}
      onChange={onChange}
      className={field.type === "textarea" ? "md:col-span-2" : ""}
    />
  );
}

function SettingsBlock({
  tab,
  settings,
  onChange,
}: {
  tab: Tab;
  settings: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <>
      {SETTING_SECTIONS[tab].map((group) => (
        <fieldset key={group.title} className="md:col-span-2">
          <legend className="text-sm font-bold text-white">{group.title}</legend>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {group.fields.map((field) => (
              <SettingInput key={field.key} field={field} value={settings[field.key] ?? ""} onChange={(value) => onChange(field.key, value)} />
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}

// ── Bar & links ─────────────────────────────────────────────────────────────

function NavEditor({ rows, onChange }: { rows: NavRow[]; onChange: (rows: NavRow[]) => void }) {
  const update = (index: number, patch: Partial<NavRow>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-bold text-white">Entries in the bar</legend>
      <p className="mt-1 text-xs text-slate-500">
        Left to right, in this order. A mega menu opens from its entry; Insights also links to its page (usually /blog).
        The logo already links home, so there is no Home entry.
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((row, index) => {
          const needsLink = row.kind === "link" || row.kind === "insights";
          return (
            <div key={index} className={`${cardClass} ${row.visible ? "" : "opacity-60"}`}>
              <RowControls index={index} count={rows.length} onMove={(by) => onChange(moved(rows, index, by))} onRemove={() => onChange(rows.filter((_, i) => i !== index))}>
                {row.label || `Entry ${index + 1}`} {!row.visible && <span className="ml-2 text-slate-500">· hidden</span>}
              </RowControls>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <TextField label="Label" value={row.label} max={LIMITS.navLabel} onChange={(label) => update(index, { label })} />
                <label className={labelClass}>
                  Type
                  <select value={row.kind} onChange={(e) => update(index, { kind: e.target.value as NavKind })} className={inputClass}>
                    {NAV_KINDS.map((kind) => (
                      <option key={kind.value} value={kind.value}>{kind.label}</option>
                    ))}
                  </select>
                </label>
                {needsLink ? (
                  <LinkField label="Link" value={row.href} onChange={(href) => update(index, { href })} />
                ) : row.kind === "services" ? (
                  <LinkField
                    label="Link"
                    help="Clicking the word opens this page; the arrow beside it opens the menu (edit it on the Services menu tab). Blank opens /services."
                    value={row.href}
                    onChange={(href) => update(index, { href })}
                  />
                ) : (
                  <p className="self-end pb-3 text-xs text-slate-500">Opens its menu — edit it on the Industries menu tab.</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <Switch label="Show on the website" checked={row.visible} onChange={(visible) => update(index, { visible })} />
                {row.kind === "link" && <Switch label="Open in a new tab" checked={row.new_tab} onChange={(new_tab) => update(index, { new_tab })} />}
              </div>
            </div>
          );
        })}
      </div>
      {rows.length < LIMITS.navItems && (
        <button type="button" className={addButton} onClick={() => onChange([...rows, { label: "", href: "", kind: "link", visible: true, new_tab: false }])}>
          + Add entry
        </button>
      )}
    </fieldset>
  );
}

function CtaEditor({ cta, onChange }: { cta: Cta; onChange: (cta: Cta) => void }) {
  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-bold text-white">Button and phone</legend>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <TextField label="Button text" help="Blank shows “Get a Free Quote”." value={cta.label} max={LIMITS.ctaLabel} onChange={(label) => onChange({ ...cta, label })} />
        <TextField label="Button text on phones" help="Blank shows “Free Quote”." value={cta.short_label} max={LIMITS.ctaShortLabel} onChange={(short_label) => onChange({ ...cta, short_label })} />
        <LinkField label="Button link" help="Blank links to /contact-us." value={cta.link} required={false} onChange={(link) => onChange({ ...cta, link })} />
        <div className="self-end pb-3">
          <Switch label="Show the phone number in the bar" help="On wide screens. The number itself is under Contact details & logo." checked={cta.show_phone} onChange={(show_phone) => onChange({ ...cta, show_phone })} />
        </div>
      </div>
    </fieldset>
  );
}

// ── Services and Industries groups ──────────────────────────────────────────

function GroupsEditor({
  menu,
  groups,
  services,
  onChange,
}: {
  menu: MegaMenu;
  groups: MegaGroup[];
  services: Service[];
  onChange: (groups: MegaGroup[]) => void;
}) {
  const isServices = menu === "services";
  const updateGroup = (g: number, patch: Partial<MegaGroup>) => onChange(groups.map((group, i) => (i === g ? { ...group, ...patch } : group)));
  const updateItem = (g: number, i: number, patch: Partial<MegaItem>) =>
    updateGroup(g, { items: groups[g].items.map((item, j) => (j === i ? { ...item, ...patch } : item)) });
  const pick = (g: number, i: number, id: string) => {
    const service = services.find((s) => s.id === Number(id));
    const item = groups[g].items[i];
    if (!service) return updateItem(g, i, { service_id: null });
    updateItem(g, i, {
      service_id: service.id,
      // The service's own name, so the menu, the home page tabs and the
      // service page all say the same thing.
      label: service.title,
      href: `/${service.slug}`,
      description: item.description || service.excerpt.slice(0, LIMITS.itemDescription).replace(/\s+\S*$/, ""),
    });
  };
  const blankItem: MegaItem = { service_id: null, label: "", href: "", description: "", visible: true };
  const linkedService = (item: MegaItem) => (isServices && item.service_id ? services.find((s) => s.id === item.service_id) : undefined);

  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-bold text-white">{isServices ? "Service groups" : "Industry groups"}</legend>
      <p className="mt-1 text-xs text-slate-500">
        {isServices
          ? "Each group is a column. Pick a service to fill in its name and link, or type your own."
          : "With one group the industries show as a simple list; with more, each group is a column. Leave an industry's link blank until its page exists — it is not shown until then."}
      </p>
      <div className="mt-4 space-y-5">
        {groups.map((group, g) => (
          <div key={g} className={`${cardClass} ${group.visible ? "" : "opacity-60"}`}>
            <RowControls index={g} count={groups.length} onMove={(by) => onChange(moved(groups, g, by))} onRemove={() => onChange(groups.filter((_, i) => i !== g))}>
              Group {g + 1} {!group.visible && <span className="ml-2 text-slate-500">· hidden</span>}
            </RowControls>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TextField label="Group name" value={group.title} max={LIMITS.groupTitle} onChange={(title) => updateGroup(g, { title })} />
              <div className="self-end pb-3">
                <Switch label="Show this group" checked={group.visible} onChange={(visible) => updateGroup(g, { visible })} />
              </div>
            </div>

            <div className="mt-4 space-y-3 border-l border-white/[.08] pl-4">
              {group.items.map((item, i) => (
                <div key={i} className={`rounded-lg bg-slate-950/50 p-3 ${item.visible ? "" : "opacity-60"}`}>
                  <RowControls
                    index={i}
                    count={group.items.length}
                    onMove={(by) => updateGroup(g, { items: moved(group.items, i, by) })}
                    onRemove={() => updateGroup(g, { items: group.items.filter((_, j) => j !== i) })}
                  >
                    {item.label || `Link ${i + 1}`}
                  </RowControls>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {isServices && (
                      <label className={`${labelClass} md:col-span-2`}>
                        Service
                        <select value={item.service_id ?? ""} onChange={(e) => pick(g, i, e.target.value)} className={inputClass}>
                          <option value="">Custom link (type it below)</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>{service.title}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {linkedService(item) ? (
                      <p className="text-xs text-slate-400 md:col-span-2">
                        Shows as <span className="font-semibold text-white">{linkedService(item)!.title}</span> and links to{" "}
                        <span className="font-semibold text-white">/{linkedService(item)!.slug}</span>. The name comes from the
                        Services screen, so the menu, the home page tabs and the service page always match.
                      </p>
                    ) : (
                      <>
                        <TextField label="Label" value={item.label} max={LIMITS.itemLabel} onChange={(label) => updateItem(g, i, { label })} />
                        <LinkField label="Link" value={item.href} required={isServices} onChange={(href) => updateItem(g, i, { href })} />
                      </>
                    )}
                    {isServices && (
                      <TextField
                        label="Short description"
                        value={item.description}
                        max={LIMITS.itemDescription}
                        onChange={(description) => updateItem(g, i, { description })}
                        className="md:col-span-2"
                      />
                    )}
                    <Switch label="Show this link" checked={item.visible} onChange={(visible) => updateItem(g, i, { visible })} />
                  </div>
                </div>
              ))}
              {group.items.length < LIMITS.itemsPerGroup && (
                <button type="button" className={addButton} onClick={() => updateGroup(g, { items: [...group.items, blankItem] })}>
                  + Add {isServices ? "service" : "industry"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {groups.length < LIMITS.groups && (
        <button type="button" className={addButton} onClick={() => onChange([...groups, { title: "", visible: true, items: [blankItem] }])}>
          + Add group
        </button>
      )}
    </fieldset>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function HeaderMenuManager() {
  const [tab, setTab] = useState<Tab>("bar");
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    void fetch("/api/admin/header-menu")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) setLoadError(body.error ?? "The header menu could not be loaded.");
        else setData(body as Data);
      })
      .catch(() => setLoadError("The header menu could not be loaded. Check your connection."));
  }, []);

  const set = (patch: Partial<Data>) => setData((current) => (current ? { ...current, ...patch } : current));
  const setSetting = (key: string, value: string) => setData((current) => (current ? { ...current, settings: { ...current.settings, [key]: value } } : current));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    setNotice(null);
    const settings = Object.fromEntries(SETTING_SECTIONS[tab].flatMap((g) => g.fields).map((f) => [f.key, data.settings[f.key] ?? ""]));
    const body =
      tab === "bar"
        ? { nav: data.nav, cta: data.cta, settings }
        : tab === "insights"
          ? { settings }
          : { groups: tab === "services" ? withServiceNames(data.groups.services, data.services) : data.groups[tab], settings };
    try {
      const response = await fetch(`/api/admin/header-menu?part=${tab}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice({ type: "error", text: result.error ?? "Please check the form and try again.", list: result.errors });
        return;
      }
      const live = result.revalidated
        ? "It is live on the website now."
        : "Saved. The website picks it up within 15 minutes (set REVALIDATE_SECRET on both sites to make it instant).";
      setNotice(
        result.missing?.length
          ? { type: "warn", text: `${live} These links lead to pages that do not exist yet (404):`, list: result.missing }
          : { type: "ok", text: live },
      );
    } catch {
      setNotice({ type: "error", text: "We could not save your changes. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="header-menu" />

      {loadError ? (
        <p role="alert" className="mt-7 rounded-lg bg-red-500/10 p-4 text-sm text-red-300">{loadError}</p>
      ) : !data ? (
        <p className="mt-7 text-slate-400">Loading…</p>
      ) : (
        <>
          <div role="tablist" aria-label="Header menu" className="mt-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={t.key === tab}
                onClick={() => {
                  setTab(t.key);
                  setNotice(null);
                }}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${t.key === tab ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-300 hover:border-cyan-400/50"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">{current.shows}</p>

          {notice && (
            <div
              role="status"
              className={`mt-5 rounded-lg p-3 text-sm ${
                notice.type === "ok" ? "bg-emerald-500/10 text-emerald-300" : notice.type === "warn" ? "bg-amber-500/10 text-amber-200" : "bg-red-500/10 text-red-300"
              }`}
            >
              {notice.text}
              {notice.list && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {notice.list.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form key={tab} onSubmit={save} className="mt-7 rounded-2xl border border-white/[.08] bg-(--admin-panel) p-6">
            <div className="grid gap-8 md:grid-cols-2">
              {tab === "bar" && (
                <>
                  <NavEditor rows={data.nav} onChange={(nav) => set({ nav })} />
                  <CtaEditor cta={data.cta} onChange={(cta) => set({ cta })} />
                </>
              )}
              {(tab === "services" || tab === "industries") && (
                <GroupsEditor
                  menu={tab}
                  groups={data.groups[tab]}
                  services={data.services}
                  onChange={(groups) => set({ groups: { ...data.groups, [tab]: groups } })}
                />
              )}
              <SettingsBlock tab={tab} settings={data.settings} onChange={setSetting} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button disabled={saving} className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
                {saving ? "Saving…" : `Save ${current.label.toLowerCase()}`}
              </button>
              <a href={siteUrl("/")} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-cyan-300">
                View the website ↗
              </a>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
