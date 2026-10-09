/**
 * Pure helpers behind the admin list's status and category filters.
 *
 * They live outside the component so the logic that decides which records a
 * filter hides can be tested without rendering React, and so the list and
 * the row badge always agree on what counts as published.
 */

export type FilterRecord = Record<string, unknown>;

export type StatusFilter = "all" | "published" | "draft";

/** Label used for records whose category is empty. */
export const NO_CATEGORY_LABEL = "Uncategorised";

/** The key that stands for "no category" in the select, kept distinct from "all". */
export const NO_CATEGORY_KEY = "__none__";

/**
 * SQLite has no boolean type, so `published` arrives as 0 or 1 — and as the
 * string "1" once a form has round-tripped it. Matches the admin's existing
 * reading of a boolean column.
 */
export function isPublished(record: FilterRecord): boolean {
  const value = record.published;
  return value === true || value === 1 || value === "1";
}

/** Trimmed category, or "" when the record has none. */
export function categoryOf(record: FilterRecord): string {
  const value = record.category;
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** The select key a record's category falls under. */
export function categoryKeyOf(record: FilterRecord): string {
  return categoryOf(record) || NO_CATEGORY_KEY;
}

export function matchesStatus(record: FilterRecord, filter: StatusFilter) {
  if (filter === "all") return true;
  return isPublished(record) === (filter === "published");
}

export function matchesCategory(record: FilterRecord, filter: string) {
  if (filter === "all") return true;
  return categoryKeyOf(record) === filter;
}

export function filterRecords<T extends FilterRecord>(
  records: readonly T[],
  filters: { status: StatusFilter; category: string },
): T[] {
  return records.filter(
    (record) =>
      matchesStatus(record, filters.status) &&
      matchesCategory(record, filters.category),
  );
}

export function publishedCount(records: readonly FilterRecord[]): number {
  return records.reduce((total, record) => total + (isPublished(record) ? 1 : 0), 0);
}

/**
 * Every category present in the list, with how many records carry it.
 * Sorted alphabetically, with the uncategorised bucket last so it does not
 * sit above real categories.
 */
export function categoryOptions(
  records: readonly FilterRecord[],
): { key: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = categoryKeyOf(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      count,
      label: key === NO_CATEGORY_KEY ? NO_CATEGORY_LABEL : key,
    }))
    .sort((a, b) => {
      if (a.key === NO_CATEGORY_KEY) return 1;
      if (b.key === NO_CATEGORY_KEY) return -1;
      return a.label.localeCompare(b.label);
    });
}
