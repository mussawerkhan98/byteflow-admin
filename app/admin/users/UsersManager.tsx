"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

type User = {
  id: number;
  display_name: string;
  email: string;
  role: "administrator" | "editor";
  active: number;
  created_at: string;
  updated_at?: string;
};

const empty = {
  display_name: "",
  email: "",
  password: "",
  role: "editor",
  active: true,
};

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setUsers(data.users ?? []);
      else setNotice(data.error ?? "Unable to load users. Please refresh and try again.");
    } catch {
      setNotice("Unable to load users. Check your connection and try again.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, id: editing }),
      });
      const data = await response.json();
      if (!response.ok) return setNotice(data.error ?? "Please check the user details and try again.");
      setNotice(editing ? "User updated successfully." : "User created successfully.");
      setEditing(null);
      setForm(empty);
      await load(true);
    } catch {
      setNotice("Unable to save the user. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function edit(user: User) {
    setEditing(user.id);
    setForm({
      display_name: user.display_name,
      email: user.email,
      password: "",
      role: user.role,
      active: Boolean(user.active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(user: User) {
    if (
      !window.confirm(
        `Delete ${user.display_name}? They will immediately lose admin access.`,
      )
    )
      return;
    const response = await fetch(`/api/admin/users?id=${user.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) setNotice(data.error);
    else {
      setNotice("User deleted successfully.");
      await load(true);
    }
  }

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <AdminPageHeader sectionKey="users" />
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
          database users
        </span>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-cyan-400/10 bg-cyan-400/[.05] p-3 text-sm text-cyan-200"
        >
          {notice}
        </p>
      )}

      <form
        onSubmit={save}
        className="mt-7 rounded-2xl border border-white/[.08] bg-[#0d1921] p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-400">
              {editing ? "Edit account" : "New account"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {editing ? "Update admin user" : "Add admin user"}
            </h2>
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400"
            >
              Cancel editing
            </button>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-300">
            Display name
            <input
              required
              value={String(form.display_name)}
              onChange={(event) =>
                setForm({ ...form, display_name: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Email address
            <input
              required
              type="email"
              value={String(form.email)}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            {editing ? "New password (leave blank to keep it)" : "Password"}
            <input
              required={!editing}
              minLength={8}
              type="password"
              value={String(form.password)}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400"
            />
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Role
            <select
              value={String(form.role)}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
            >
              <option value="editor">Editor — manage website content</option>
              <option value="administrator">
                Administrator — full access and users
              </option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(form.active)}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
              className="h-4 w-4 accent-cyan-400"
            />
            Account active
          </label>
        </div>
        <button
          disabled={saving}
          className="mt-6 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
        >
          {saving ? "Saving…" : editing ? "Save user" : "Create user"}
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/[.08] bg-[#0d1921]">
        <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">User accounts</h2>
            <p className="mt-1 text-xs text-slate-600">
              Automatically refreshed every 15 seconds
            </p>
          </div>
          <span className="rounded-full bg-white/[.04] px-3 py-1 text-xs text-slate-400">
            {users.length} users
          </span>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading users…
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No database users yet. Create the first account above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-950/50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.06]">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-white/[.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/[.08] text-cyan-300">
                          <FontAwesomeIcon
                            icon={faUserShield}
                            className="h-4 w-4"
                          />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {user.display_name}
                          </p>
                          <p className="text-xs text-slate-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${user.role === "administrator" ? "bg-violet-400/10 text-violet-300" : "bg-blue-400/10 text-blue-300"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.active ? "text-emerald-300" : "text-slate-500"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${user.active ? "bg-emerald-400" : "bg-slate-600"}`}
                        />
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => edit(user)}
                          title="Edit user"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-300"
                        >
                          <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => void remove(user)}
                          title="Delete user"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-400/10"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
