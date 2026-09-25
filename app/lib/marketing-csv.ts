/**
 * CSV reading and writing for the marketing contact list.
 *
 * Pure functions with no imports beyond the country helpers, so the import
 * preview can run in the browser and the same code can be tested directly.
 */

import { resolveCountry } from "./countries";

export type ParsedRow = Record<string, string>;
export type ParsedCsv = {
  delimiter: string;
  headers: string[];
  rows: ParsedRow[];
};

/** Guess the delimiter from the header line: comma, semicolon or tab. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [
    [",", 0],
    [";", 0],
    ["\t", 0],
  ];
  let inQuotes = false;
  for (const character of firstLine) {
    if (character === '"') inQuotes = !inQuotes;
    if (inQuotes) continue;
    for (const entry of counts) if (character === entry[0]) entry[1] += 1;
  }
  const best = counts.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

/**
 * A small RFC 4180 reader: handles quoted fields, escaped quotes inside them,
 * delimiters and newlines within quotes, and both line ending styles.
 */
export function parseCsv(text: string, delimiter?: string): ParsedCsv {
  const clean = text.replace(/^﻿/, "");
  const separator = delimiter || detectDelimiter(clean);
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < clean.length; index += 1) {
    const character = clean[index];
    if (inQuotes) {
      if (character === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      inQuotes = true;
    } else if (character === separator) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      table.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    table.push(row);
  }

  const headerRow = table.shift() ?? [];
  const headers = headerRow.map((header) => header.trim());
  const rows = table
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const record: ParsedRow = {};
      headers.forEach((header, position) => {
        record[header] = (cells[position] ?? "").trim();
      });
      return record;
    });

  return { delimiter: separator, headers, rows };
}

/** Header spellings accepted for each contact field. */
const HEADER_MATCHES: Record<string, string[]> = {
  email: ["email", "e-mail", "mail", "email address", "e-mail address"],
  name: ["name", "full name", "fullname", "contact name", "customer name", "first name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  phone: ["phone", "mobile", "whatsapp", "phone number", "mobile number", "contact number", "tel", "telephone"],
  country: ["country", "nationality", "country name"],
  region: ["region", "city", "emirate", "state", "town", "area", "location"],
  groups: ["groups", "group", "tags", "tag", "category", "categories", "segment"],
};

const normaliseHeader = (header: string) =>
  header.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

/** The accepted spellings, normalised the same way the file's headers are, so
 * "E-Mail", "e_mail" and "e mail" all land on the same entry. */
const NORMALISED_MATCHES: Record<string, string[]> = Object.fromEntries(
  Object.entries(HEADER_MATCHES).map(([field, candidates]) => [
    field,
    candidates.map(normaliseHeader),
  ]),
);

/** Map the file's headers onto our fields, loosely. */
export function matchHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const key = normaliseHeader(header);
    for (const [field, candidates] of Object.entries(NORMALISED_MATCHES)) {
      if (mapping[field]) continue;
      if (candidates.includes(key)) {
        mapping[field] = header;
        break;
      }
    }
  }
  return mapping;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (value: unknown) =>
  EMAIL_PATTERN.test(String(value ?? "").trim());

/** Split a groups cell into clean, case-insensitively de-duplicated tags. */
export function parseGroups(value: unknown): string[] {
  const seen = new Map<string, string>();
  for (const part of String(value ?? "").split(/[,;|]/)) {
    const tag = part.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (!seen.has(key)) seen.set(key, tag);
  }
  return [...seen.values()];
}

/** Merge two group lists, keeping the existing spelling of any repeat. */
export function mergeGroups(existing: unknown, incoming: unknown): string {
  const merged = new Map<string, string>();
  for (const tag of parseGroups(existing)) merged.set(tag.toLowerCase(), tag);
  for (const tag of parseGroups(incoming)) {
    const key = tag.toLowerCase();
    if (!merged.has(key)) merged.set(key, tag);
  }
  return [...merged.values()].join(", ");
}

export type ImportCandidate = {
  rowNumber: number;
  email: string;
  name: string;
  phone: string;
  country: string;
  region: string;
  groups: string;
};

export type ImportPlan = {
  candidates: ImportCandidate[];
  invalid: { rowNumber: number; value: string }[];
  duplicatesInFile: number;
};

export const MAX_IMPORT_ROWS = 5000;

/**
 * Turn parsed rows into contacts to save, dropping invalid addresses and
 * repeats within the file itself. Row numbers count the header as row 1, so
 * they line up with what the person sees in Excel.
 */
export function planImport(
  rows: ParsedRow[],
  headers: string[],
  extraGroup = "",
): ImportPlan {
  const mapping = matchHeaders(headers);
  const candidates: ImportCandidate[] = [];
  const invalid: { rowNumber: number; value: string }[] = [];
  const seen = new Set<string>();
  let duplicatesInFile = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const email = String(row[mapping.email] ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      invalid.push({ rowNumber, value: email || "(blank)" });
      return;
    }
    if (seen.has(email)) {
      duplicatesInFile += 1;
      return;
    }
    seen.add(email);

    const first = String(row[mapping.name] ?? "").trim();
    const last = String(row[mapping.lastName] ?? "").trim();
    const phone = String(row[mapping.phone] ?? "").trim();

    candidates.push({
      rowNumber,
      email,
      name: [first, last].filter(Boolean).join(" ").replace(/\s+/g, " "),
      phone,
      country: resolveCountry(row[mapping.country], phone),
      region: String(row[mapping.region] ?? "").trim(),
      groups: mergeGroups(row[mapping.groups], extraGroup),
    });
  });

  return { candidates, invalid, duplicatesInFile };
}

/**
 * Quote a cell for CSV and defuse anything a spreadsheet would treat as a
 * formula. Plain international phone numbers keep their leading +, since
 * "+971…" is a phone number rather than an expression.
 */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  const isPlainPhoneNumber = /^\+[\d\s()-]+$/.test(text);
  if (/^[=+\-@\t\r]/.test(text) && !isPlainPhoneNumber) text = `'${text}`;
  if (/["\n\r,;]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Build a spreadsheet-safe CSV: UTF-8 BOM, CRLF line endings, quoted cells. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export const SAMPLE_CSV = buildCsv(
  ["name", "email", "phone", "country", "region", "groups"],
  [
    ["Aisha Rahman", "aisha@example.com", "+971501234567", "United Arab Emirates", "Dubai", "VIP, Corporate"],
    ["John Smith", "john@example.co.uk", "+447700900123", "United Kingdom", "London", "Expo 2026"],
  ],
);
