"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

// The choice lives on <html data-admin-theme>, set before paint by the script
// in app/layout.tsx. Reading it as an external store keeps every copy of this
// button (sidebar and phone bar) in step with it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.getAttribute("data-admin-theme") === "light" ? "light" : "dark");

// The server cannot see the choice; the admin is dark unless switched.
const readServerTheme = (): Theme => "dark";

/** Sun/moon switch between the admin's dark and light looks, remembered in this browser. */
export default function AdminThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (next === "light") document.documentElement.setAttribute("data-admin-theme", "light");
    else document.documentElement.removeAttribute("data-admin-theme");
    try {
      localStorage.setItem("admin-theme", next);
    } catch {
      // Storage can be blocked (private windows); the switch still applies to this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[.08] text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300 ${className}`}
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
