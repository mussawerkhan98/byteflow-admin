"use client";
import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
type Item = {
  id: number;
  area: "header" | "footer";
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  new_tab: number;
  visible: number;
};
const blank = {
  label: "",
  href: "",
  area: "header",
  parent_id: "",
  new_tab: false,
  visible: true,
};

export default function MenuBuilder() {
  const [items, setItems] = useState<Item[]>([]),
    [area, setArea] = useState<"header" | "footer">("header"),
    [editing, setEditing] = useState<number | null>(null),
    [form, setForm] = useState<Record<string, unknown>>(blank),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [dirtyAreas, setDirtyAreas] = useState<Set<"header" | "footer">>(new Set());
  async function load() {
    const response = await fetch("/api/admin/menus"),
      data = await response.json();
    if (response.ok) setItems(data.records);
    else setNotice(data.error);
  }
  useEffect(() => {
    void load();
  }, []);
  const shown = useMemo(
    () =>
      items
        .filter((item) => item.area === area)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, area],
  );
  const ordered = useMemo(() => {
    const result: { item: Item; depth: number }[] = [];
    const walk = (parent: number | null, depth: number) =>
      shown
        .filter((item) => item.parent_id === parent)
        .forEach((item) => {
          result.push({ item, depth });
          walk(item.id, depth + 1);
        });
    walk(null, 0);
    return result;
  }, [shown]);
  function stage(next: Item[], message: string) {
    const normalized = next.map((item, index) => ({
      ...item,
      sort_order: index * 10,
    }));
    setItems((current) => [
      ...current.filter((item) => item.area !== area),
      ...normalized,
    ]);
    setDirtyAreas((current) => new Set(current).add(area));
    setNotice(`${message} Click Save menu to publish the change.`);
  }
  async function persist() {
    setSaving(true);
    const next = shown.map((item, index) => ({
      ...item,
      sort_order: index * 10,
    }));
    const response = await fetch("/api/admin/menus/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: next.map((item, index) => ({
            id: item.id,
            parent_id: item.parent_id,
            sort_order: index * 10,
            area: item.area,
          })),
        }),
      }),
      data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(data.error);
      await load();
      setDirtyAreas((current) => {
        const updated = new Set(current);
        updated.delete(area);
        return updated;
      });
      return;
    }
    setItems((current) =>
      current.map(
        (item) => next.find((updated) => updated.id === item.id) ?? item,
      ),
    );
    setDirtyAreas((current) => {
      const updated = new Set(current);
      updated.delete(area);
      return updated;
    });
    setNotice("Menu order saved.");
  }
  function makeParent(item: Item) {
    if (item.parent_id === null) return;
    const next = shown.map((current) =>
      current.id === item.id ? { ...current, parent_id: null } : current,
    );
    stage(next, `${item.label} is now a top-level parent item.`);
  }
  function move(item: Item, direction: "up" | "down") {
    const siblings = shown
        .filter((current) => current.parent_id === item.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order),
      index = siblings.findIndex((current) => current.id === item.id),
      otherIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || otherIndex < 0 || otherIndex >= siblings.length) return;
    const other = siblings[otherIndex],
      firstIndex = shown.findIndex((current) => current.id === item.id),
      secondIndex = shown.findIndex((current) => current.id === other.id),
      next = [...shown];
    [next[firstIndex], next[secondIndex]] = [
      next[secondIndex],
      next[firstIndex],
    ];
    stage(next, `${item.label} moved ${direction}.`);
  }
  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    if (dirtyAreas.has(area)) {
      setNotice("Save the menu order before adding or editing menu items.");
      return;
    }
    const payload = {
      ...form,
      sort_order: editing
        ? (shown.find((item) => item.id === editing)?.sort_order ??
          shown.length * 10)
        : shown.length * 10,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      id: editing,
    };
    const response = await fetch("/api/admin/menus", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      data = await response.json();
    if (!response.ok) {
      setNotice(data.error);
      return;
    }
    setEditing(null);
    setForm({ ...blank, area });
    setNotice(editing ? "Menu item updated." : "Menu item added.");
    await load();
  }
  function edit(item: Item) {
    setEditing(item.id);
    setForm({
      label: item.label,
      href: item.href,
      area: item.area,
      parent_id: item.parent_id ?? "",
      new_tab: Boolean(item.new_tab),
      visible: Boolean(item.visible),
    });
    scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(item: Item) {
    if (dirtyAreas.has(area)) {
      setNotice("Save the menu order before deleting a menu item.");
      return;
    }
    if (
      !confirm(
        `Delete “${item.label}”? Child items will move to the top level.`,
      )
    )
      return;
    const response = await fetch(`/api/admin/menus?id=${item.id}`, {
        method: "DELETE",
      }),
      data = await response.json();
    if (!response.ok) setNotice(data.error);
    else {
      setNotice("Menu item deleted.");
      await load();
    }
  }
  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="menus" />
      {notice && (
        <p className="mt-5 rounded-lg border border-cyan-400/10 bg-cyan-400/[.05] p-3 text-sm text-cyan-200">
          {notice}
        </p>
      )}
      <div className="mt-7 grid gap-7 xl:grid-cols-[360px_1fr]">
        <form
          onSubmit={saveItem}
          className="h-fit rounded-2xl border border-white/[.08] bg-[#0d1921] p-5"
        >
          <h2 className="font-bold text-white">
            {editing ? "Edit menu item" : "Add menu item"}
          </h2>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-slate-300">
              Label
              <input
                required
                value={String(form.label)}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Link
              <input
                required
                value={String(form.href)}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/about-us or https://…"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Menu
              <select
                value={String(form.area)}
                onChange={(e) => {
                  const next = e.target.value as "header" | "footer";
                  setForm({ ...form, area: next, parent_id: "" });
                  setArea(next);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
              >
                <option value="header">Header navigation</option>
                <option value="footer">Footer navigation</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Parent menu
              <select
                value={String(form.parent_id ?? "")}
                onChange={(e) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
              >
                <option value="">Top-level menu (no parent)</option>
                {items
                  .filter(
                    (item) =>
                      item.area === form.area &&
                      item.parent_id === null &&
                      item.id !== editing,
                  )
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      Submenu of {item.label}
                    </option>
                  ))}
              </select>
              <span className="mt-1.5 block text-[10px] font-normal text-slate-500">
                Choose a parent to add this item inside its dropdown.
              </span>
            </label>
            <label className="flex items-center gap-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.new_tab)}
                onChange={(e) =>
                  setForm({ ...form, new_tab: e.target.checked })
                }
                className="accent-cyan-400"
              />
              Open in new tab
            </label>
            <label className="flex items-center gap-3 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.visible)}
                onChange={(e) =>
                  setForm({ ...form, visible: e.target.checked })
                }
                className="accent-cyan-400"
              />
              Visible
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <button className="rounded-lg bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950">
              {editing ? "Save changes" : "Add to menu"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ ...blank, area });
                }}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-slate-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <section className="rounded-2xl border border-white/[.08] bg-[#0d1921] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-white">Menu structure</h2>
              <p className="mt-1 text-xs text-slate-600">
                Use up and down to reorder items. Edit an item to change its
                parent dropdown.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-white/[.08] bg-slate-950 p-1">
                {(["header", "footer"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setArea(value)}
                    className={`rounded-md px-4 py-2 text-xs font-semibold ${area === value ? "bg-cyan-300 text-slate-950" : "text-slate-500"}`}
                  >
                    {value === "header" ? "Header" : "Footer"}
                    {dirtyAreas.has(value) ? " •" : ""}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!dirtyAreas.has(area) || saving}
                onClick={() => void persist()}
                className="rounded-lg bg-gradient-to-r from-cyan-300 to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
              >
                {saving ? "Saving…" : "Save menu"}
              </button>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {ordered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-600">
                This menu is empty.
              </p>
            ) : (
              ordered.map(({ item, depth }) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[.08] bg-slate-950/70 p-3 transition"
                  style={{ marginLeft: Math.min(depth, 3) * 28 }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-200">
                        {item.label}
                      </p>
                      {depth > 0 && (
                        <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                          Submenu
                        </span>
                      )}
                      {!item.visible && (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-600">
                      {item.href}
                    </p>
                  </div>
                  {depth > 0 && (
                    <button
                      type="button"
                      onClick={() => makeParent(item)}
                      className="rounded-lg border border-cyan-400/20 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      Make parent
                    </button>
                  )}
                  <div className="flex items-center gap-1 rounded-lg border border-white/[.08] bg-slate-950/60 p-1">
                    <button
                      type="button"
                      title="Move up"
                      aria-label={`Move ${item.label} up`}
                      disabled={
                        shown
                          .filter(
                            (current) => current.parent_id === item.parent_id,
                          )
                          .sort((a, b) => a.sort_order - b.sort_order)[0]
                          ?.id === item.id
                      }
                      onClick={() => move(item, "up")}
                      className="grid size-7 place-items-center rounded-md text-sm text-slate-300 transition hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      aria-label={`Move ${item.label} down`}
                      disabled={
                        shown
                          .filter(
                            (current) => current.parent_id === item.parent_id,
                          )
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .at(-1)?.id === item.id
                      }
                      onClick={() => move(item, "down")}
                      className="grid size-7 place-items-center rounded-md text-sm text-slate-300 transition hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => edit(item)}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded-lg border border-red-400/20 px-2.5 py-1.5 text-[10px] text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
          {saving && (
            <p className="mt-4 text-xs text-cyan-300">Saving menu order…</p>
          )}
          {dirtyAreas.has(area) && !saving && (
            <p className="mt-4 text-xs font-semibold text-amber-300">
              You have unsaved menu changes.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
