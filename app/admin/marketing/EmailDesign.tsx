"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * How every promotion email looks. Three settings rather than a full editor:
 * the parts worth changing, with a preview built by the same code that
 * builds the real email, so what is shown here is what recipients get.
 */

type Design = {
  headerStyle: "name" | "logo" | "none";
  accentColor: string;
  footerNote: string;
};

const DEFAULTS: Design = {
  headerStyle: "name",
  accentColor: "#2CCDDE",
  footerNote: "",
};

const HEADER_CHOICES: { value: Design["headerStyle"]; label: string; hint: string }[] = [
  { value: "name", label: "Business name", hint: "Your name as text. Always shows, even when images are blocked." },
  { value: "logo", label: "Logo image", hint: "Your uploaded logo. Many inboxes hide images until the reader allows them." },
  { value: "none", label: "Nothing", hint: "Starts with the offer image, or the greeting. Your details still appear in the footer." },
];

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-normal text-slate-200 outline-none focus:border-cyan-400";

export default function EmailDesign() {
  const [design, setDesign] = useState<Design>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState("");
  const latest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/admin/marketing/design", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok && data.design) setDesign({ ...DEFAULTS, ...data.design });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPreview = useCallback(async (value: Design) => {
    const ticket = ++latest.current;
    const response = await fetch("/api/admin/marketing/design/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value),
    });
    const html = response.ok ? await response.text() : "";
    // A slow earlier request must not overwrite a newer preview.
    if (ticket === latest.current) setPreview(html);
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => void refreshPreview(design), 250);
    return () => window.clearTimeout(timer);
  }, [design, loading, refreshPreview]);

  async function onSave() {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/marketing/design", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(design),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not save the design." });
        return;
      }
      setDesign({ ...DEFAULTS, ...data.design });
      setNotice({ type: "ok", text: "Saved. Every promotion from now on uses this." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        This is the frame around every promotion — the same for all of them. What
        goes inside it (subject, headline, text, offer image and button) belongs
        to each promotion, on the Promotions tab.
      </p>

      {notice && (
        <p
          className={`mt-5 rounded-lg border p-3 text-sm ${
            notice.type === "ok"
              ? "border-cyan-400/10 bg-cyan-400/[.05] text-cyan-200"
              : "border-red-400/20 bg-red-400/[.06] text-red-200"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/[.08] bg-[#0d1921] p-5">
          <h2 className="border-b border-white/[.06] pb-4 text-lg font-bold text-white">
            Settings
          </h2>

          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-slate-300">
              Above the greeting
            </legend>
            <div className="mt-3 space-y-2">
              {HEADER_CHOICES.map((choice) => (
                <label
                  key={choice.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                    design.headerStyle === choice.value
                      ? "border-cyan-400/40 bg-cyan-400/[.06]"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="headerStyle"
                    className="mt-1"
                    checked={design.headerStyle === choice.value}
                    onChange={() => setDesign({ ...design, headerStyle: choice.value })}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-200">
                      {choice.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {choice.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-6 block text-xs font-semibold text-slate-300">
            Button colour
            <span className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={design.accentColor}
                onChange={(event) =>
                  setDesign({ ...design, accentColor: event.target.value })
                }
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-700 bg-slate-950"
              />
              <input
                value={design.accentColor}
                onChange={(event) =>
                  setDesign({ ...design, accentColor: event.target.value })
                }
                placeholder="#2CCDDE"
                className={`${inputClass} mt-0 flex-1 font-mono`}
              />
            </span>
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Six-digit hex, like #2CCDDE. The label switches between dark and light
            on its own so it stays readable.
          </p>

          <label className="mt-6 block text-xs font-semibold text-slate-300">
            Line above the unsubscribe link
            <textarea
              rows={3}
              value={design.footerNote}
              onChange={(event) =>
                setDesign({ ...design, footerNote: event.target.value })
              }
              placeholder="You're receiving this because you asked to hear about offers from Byteflow Information Technology."
              className={inputClass}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Leave it empty to use the sentence above. Say why the person is
            hearing from you — it is what keeps the email out of spam folders.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => void onSave()}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save design"}
            </button>
            <button
              onClick={() => setDesign(DEFAULTS)}
              disabled={saving}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.08] bg-[#0d1921] p-5">
          <h2 className="border-b border-white/[.06] pb-4 text-lg font-bold text-white">
            Preview
          </h2>
          <p className="mt-3 text-xs text-slate-500">
            Sample wording, your design. Built by the same code that builds the
            real email.
          </p>
          <iframe
            title="Email preview"
            srcDoc={preview}
            sandbox=""
            className="mt-4 h-[560px] w-full rounded-lg border border-slate-800 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
