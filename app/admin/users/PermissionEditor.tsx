"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

type Permission = { key: string; label: string; help: string };

/**
 * The permissions one editor holds.
 *
 * Administrators are deliberately not shown a list of ticks: the role already
 * means "can do everything here", and rendering an all-ticked, all-disabled
 * form would only invite someone to try unticking it.
 */
export default function PermissionEditor({
  userId,
  role,
  displayName,
}: {
  userId: number;
  role: "administrator" | "editor";
  displayName: string;
}) {
  const [available, setAvailable] = useState<Permission[]>([]);
  const [granted, setGranted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (role === "administrator") {
      setLoading(false);
      return;
    }
    let active = true;
    void fetch(`/api/admin/permissions?userId=${userId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setAvailable(data.available ?? []);
        setGranted(data.granted ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, role]);

  if (role === "administrator") {
    return (
      <p className="text-xs text-slate-500">
        Administrators can do everything, so there is nothing to tick.
      </p>
    );
  }

  if (loading) return <p className="text-xs text-slate-600">Loading…</p>;

  async function toggle(key: string, on: boolean) {
    const next = on ? [...granted, key] : granted.filter((entry) => entry !== key);
    setGranted(next);
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, permissions: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        // Put the tick back where it was, so the screen never claims a
        // permission was granted when the server refused.
        setGranted(granted);
        setNotice(data.error ?? "Could not save that change.");
        return;
      }
      setGranted(data.granted ?? next);
      setNotice("Saved.");
    } catch {
      setGranted(granted);
      setNotice("Could not save that change. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {available.map((permission) => (
        <label
          key={permission.key}
          className="flex items-start gap-2.5 text-xs text-slate-300"
        >
          <input
            type="checkbox"
            disabled={saving}
            checked={granted.includes(permission.key)}
            onChange={(event) => void toggle(permission.key, event.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-semibold text-slate-200">{permission.label}</span>
            <span className="mt-0.5 block text-slate-500">{permission.help}</span>
          </span>
        </label>
      ))}
      {!available.length && (
        <p className="text-xs text-slate-600">No permissions are defined yet.</p>
      )}
      {notice && (
        <p
          className={`text-[11px] ${notice === "Saved." ? "text-emerald-300" : "text-red-300"}`}
        >
          {notice === "Saved." ? `Saved for ${displayName}.` : notice}
        </p>
      )}
    </div>
  );
}
