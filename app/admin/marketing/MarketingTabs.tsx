"use client";

import { useState } from "react";
import AdminPageHeader from "../AdminPageHeader";
import MarketingContacts from "./MarketingContacts";
import Promotions from "./Promotions";

/**
 * The two halves of marketing: who you can email, and what you send them.
 * Kept on one screen with tabs rather than two sidebar entries, since the
 * audience and the promotion that targets it are read together.
 */
export default function MarketingTabs() {
  const [tab, setTab] = useState<"promotions" | "contacts">("promotions");

  return (
    <div className="pb-10">
      <AdminPageHeader sectionKey="marketing" />

      <div className="mt-6 flex gap-2 border-b border-white/[.08]">
        {(
          [
            ["promotions", "Promotions"],
            ["contacts", "Contacts & groups"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === key
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "promotions" ? <Promotions /> : <MarketingContacts hideHeader />}
      </div>
    </div>
  );
}
