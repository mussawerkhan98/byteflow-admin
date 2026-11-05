/**
 * The figures the website quotes about the business — clients, Google
 * rating, reviews, year founded — set once under Contact details & logo.
 * The website (byteflow, app/lib/site-figures.ts) reads the same
 * site_settings columns and fills the {clients}, {rating}, {reviews},
 * {founded} and {years} placeholders with them.
 *
 * No database access here, so the save rules can be tested directly.
 */

import { FieldError } from "./field-error";

/**
 * The website counts up to each figure, so each has to start with its
 * number. Blank is fine: the website's default shows.
 */
export function checkSiteFigures(data: Record<string, unknown>, now = new Date()) {
  const value = (name: string) => String(data[name] ?? "").trim();
  // Each problem is reported against its own field.
  for (const [name, label] of [
    ["client_count", "Number of clients"],
    ["google_review_count", "Number of Google reviews"],
  ]) {
    if (value(name) && !/^\d+\+?$/.test(value(name)))
      throw new FieldError(name, `${label}: a number, optionally followed by +, e.g. 574 or 500+`);
  }
  const rating = value("google_rating");
  if (rating && !(/^\d(\.\d)?$/.test(rating) && Number(rating) <= 5))
    throw new FieldError("google_rating", "Google rating: a number from 0 to 5 with at most one decimal, e.g. 4.9");
  const year = value("founded_year");
  if (year && !(/^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= now.getFullYear()))
    throw new FieldError("founded_year", `Year founded: a four-digit year, no later than ${now.getFullYear()}`);
  const profile = value("google_business_url");
  if (profile && !/^https:\/\//i.test(profile))
    throw new FieldError("google_business_url", "Google Business profile link must start with https://");
}
