"use client";

import { heroExtraFields } from "../lib/hero-fields";
import ImageUpload from "./ImageUpload";

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-cyan-400";

/**
 * The home page hero's extra fields (highlight line, trust line, visual,
 * bottom strip), shared by the page workspace and the Heroes screen.
 */
export default function HeroExtras({
  values,
  onChange,
}: {
  values: Record<string, string | number | undefined>;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.03] p-5 md:col-span-2">
      <legend className="px-2 text-sm font-bold text-white">Home page extras</legend>
      <div className="grid gap-5 md:grid-cols-2">
        {heroExtraFields.map((field) => {
          const value = String(values[field.name] ?? "");
          const over = field.max ? value.trim().length > field.max : false;
          if (field.type === "image")
            return (
              <div key={field.name} className="md:col-span-2">
                <ImageUpload
                  label={field.label}
                  help={field.help}
                  value={value}
                  onChange={(url) => onChange(field.name, url)}
                  alt={String(values[`${field.name}_alt`] ?? "")}
                  onAltChange={(alt) => onChange(`${field.name}_alt`, alt)}
                />
              </div>
            );
          // A picture's alt text is edited inside its upload field above.
          if (heroExtraFields.some((other) => other.type === "image" && `${other.name}_alt` === field.name)) return null;
          return (
            <label key={field.name} className="text-xs font-semibold text-slate-300">
              {field.label}
              {field.max && (
                <span className={`ml-2 font-normal ${over ? "text-red-300" : "text-slate-600"}`}>
                  {value.trim().length}/{field.max}
                </span>
              )}
              <span className="mt-1 block font-normal text-slate-500">{field.help}</span>
              <input
                value={value}
                placeholder={field.type === "link" ? "#how-we-work, /contact-us or https://…" : undefined}
                onChange={(event) => onChange(field.name, event.target.value)}
                className={`${inputClass} ${over ? "border-red-400/60" : ""}`}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
