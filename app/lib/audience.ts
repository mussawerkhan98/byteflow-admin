/**
 * Who a promotion goes to.
 *
 * Kept free of imports beyond the group parser so the rule can be tested on
 * its own and reused by the browser's live recipient count.
 */

import { parseGroups } from "./marketing-csv";

export type Audience = {
  countries: string[];
  regions: string[];
  groups: string[];
};

export type Targetable = {
  country: string;
  region: string;
  groups: string;
  optOut: boolean;
};

export const emptyAudience = (): Audience => ({
  countries: [],
  regions: [],
  groups: [],
});

/** Read an audience back out of the JSON stored on the campaign. */
export function parseAudience(value: unknown): Audience {
  const list = (input: unknown) =>
    Array.isArray(input)
      ? [...new Set(input.map((entry) => String(entry).trim()).filter(Boolean))]
      : [];
  let source: Record<string, unknown> = {};
  if (typeof value === "string") {
    try {
      source = JSON.parse(value || "{}") as Record<string, unknown>;
    } catch {
      source = {};
    }
  } else if (value && typeof value === "object") {
    source = value as Record<string, unknown>;
  }
  return {
    countries: list(source.countries),
    regions: list(source.regions),
    groups: list(source.groups),
  };
}

const sameText = (left: string, right: string) =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

/**
 * Nothing ticked in a section means everyone; several ticks in one section
 * are an OR; separate sections are an AND. Anyone who unsubscribed is out,
 * whatever the filters say.
 */
export function matchesAudience(person: Targetable, audience: Audience): boolean {
  if (person.optOut) return false;

  if (
    audience.countries.length &&
    !audience.countries.some((country) => sameText(country, person.country))
  ) {
    return false;
  }
  if (
    audience.regions.length &&
    !audience.regions.some((region) => sameText(region, person.region))
  ) {
    return false;
  }
  if (audience.groups.length) {
    const theirs = parseGroups(person.groups);
    const hasOne = audience.groups.some((group) =>
      theirs.some((entry) => sameText(entry, group)),
    );
    if (!hasOne) return false;
  }
  return true;
}

export const countAudience = (people: Targetable[], audience: Audience) =>
  people.filter((person) => matchesAudience(person, audience)).length;

/** A short human description for the promotions list: "To: …". */
export function describeAudience(audience: Audience): string {
  const parts: string[] = [];
  if (audience.countries.length) parts.push(audience.countries.join(" or "));
  if (audience.regions.length) parts.push(audience.regions.join(" or "));
  if (audience.groups.length) parts.push(audience.groups.join(" or "));
  return parts.length ? parts.join(" · ") : "Everyone who receives offers";
}
