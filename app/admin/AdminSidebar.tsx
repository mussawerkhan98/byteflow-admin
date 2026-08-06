"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import LogoutButton from "./LogoutButton";

const groups = [
  { label: "Workspace", links: [["Overview", ""]] },
  {
    label: "Content",
    links: [
      ["Pages & SEO", "pages"],
      ["Page heroes", "heroes"],
      ["Page sections", "sections"],
      ["Services", "services"],
      ["Blog posts", "posts"],
      ["Projects", "projects"],
    ],
  },
  {
    label: "Engagement",
    links: [
      ["Menus", "menus"],
      ["FAQs", "faqs"],
      ["Reviews", "testimonials"],
      ["Calls to action", "ctas"],
      ["Team", "team"],
    ],
  },
  {
    label: "Operations",
    links: [
      ["Submissions", "submissions"],
      ["Admin users", "users"],
      ["Site settings", "settings"],
    ],
  },
] as const;

export default function AdminSidebar({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname(),
    [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[.07] bg-[#071016]/95 px-4 text-white backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-3">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt="Byteflow"
              width={90}
              height={28}
              className="h-7 w-auto object-contain"
            />
          )}
          <span className="text-sm font-extrabold tracking-[-.01em]">
            Byteflow Admin
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold"
        >
          Menu
        </button>
      </header>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-white/[.07] bg-[#071016] text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="Byteflow"
                width={88}
                height={30}
                className="max-h-8 w-auto max-w-[88px] object-contain"
              />
            )}
            <span>
              <span className="block text-sm font-extrabold tracking-[-.015em]">
                Admin
              </span>
              <span className="block text-[10px] font-semibold tracking-wide text-slate-500">
                Website management
              </span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-slate-500 lg:hidden"
          >
            Close
          </button>
        </div>
        <div className="mx-5 h-px bg-white/[.07]" />
        <nav className="admin-sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <section key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-600">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map(([label, key]) => {
                  const href = `/admin${key ? `/${key}` : ""}`,
                    active = key ? pathname === href : pathname === "/admin";
                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`relative flex items-center rounded-lg px-3 py-2.5 text-[13px] font-semibold tracking-[-.005em] transition ${active ? "bg-cyan-400/10 text-cyan-300" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}
                    >
                      {active && (
                        <span className="absolute -left-3 h-5 w-0.5 rounded-r bg-cyan-300" />
                      )}
                      {label}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-white/[.07] p-4">
          <div className="mb-3 rounded-lg bg-white/[.03] px-3 py-3">
            <p className="text-xs font-bold text-slate-200">Test Admin</p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-600">
              Content administrator
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
