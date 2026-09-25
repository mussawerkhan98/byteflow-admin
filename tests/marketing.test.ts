/**
 * Tests for the marketing module's pure logic, run with Node's own test
 * runner (`npm test`) so no test framework is added to the project.
 *
 * Everything covered here is deliberately free of database and network
 * access: country normalisation, CSV reading, the import merge rules, and
 * spreadsheet-safe export.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  countryFromPhone,
  normaliseCountry,
  resolveCountry,
  COUNTRIES,
} from "../app/lib/countries";
import {
  buildCsv,
  csvCell,
  detectDelimiter,
  matchHeaders,
  mergeGroups,
  parseCsv,
  parseGroups,
  planImport,
} from "../app/lib/marketing-csv";

test("country list covers the world and has no duplicates", () => {
  assert.ok(COUNTRIES.length > 180, `expected ~200 countries, got ${COUNTRIES.length}`);
  const codes = new Set(COUNTRIES.map((country) => country.code));
  assert.equal(codes.size, COUNTRIES.length, "ISO codes must be unique");
});

test("country aliases normalise to one canonical name", () => {
  const cases: [string, string][] = [
    ["UAE", "United Arab Emirates"],
    ["uae", "United Arab Emirates"],
    ["U.A.E.", "United Arab Emirates"],
    ["Dubai", "United Arab Emirates"],
    ["  dubai  ", "United Arab Emirates"],
    ["KSA", "Saudi Arabia"],
    ["UK", "United Kingdom"],
    ["U.K.", "United Kingdom"],
    ["England", "United Kingdom"],
    ["USA", "United States"],
    ["US", "United States"],
    ["Türkiye", "Turkey"],
    ["turkiye", "Turkey"],
    ["Holland", "Netherlands"],
    ["Czech Republic", "Czechia"],
    ["United Arab Emirates", "United Arab Emirates"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(normaliseCountry(input), expected, `${input} → ${expected}`);
  }
});

test("unrecognised or blank countries stay blank rather than guessing", () => {
  for (const input of ["", "   ", "Atlantis", "ZZ", "n/a"]) {
    assert.equal(normaliseCountry(input), "", `${JSON.stringify(input)} should be blank`);
  }
});

test("country is guessed from the phone calling code", () => {
  assert.equal(countryFromPhone("+971 50 123 4567"), "United Arab Emirates");
  assert.equal(countryFromPhone("00971501234567"), "United Arab Emirates");
  assert.equal(countryFromPhone("+44 7700 900123"), "United Kingdom");
  assert.equal(countryFromPhone("+966512345678"), "Saudi Arabia");
  assert.equal(countryFromPhone(""), "");
});

test("longer calling codes win over the +1 block", () => {
  assert.equal(countryFromPhone("+1268 464 1234"), "Antigua and Barbuda");
  assert.equal(countryFromPhone("+1 415 555 0100"), "United States");
});

test("a typed country beats the phone, and the phone fills a blank", () => {
  assert.equal(resolveCountry("KSA", "+971501234567"), "Saudi Arabia");
  assert.equal(resolveCountry("", "+971501234567"), "United Arab Emirates");
  assert.equal(resolveCountry("", ""), "");
});

test("delimiter detection handles commas, semicolons and tabs", () => {
  assert.equal(detectDelimiter("a,b,c\n1,2,3"), ",");
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
  assert.equal(detectDelimiter("onlyonecolumn"), ",");
});

test("quoted fields, escaped quotes and embedded delimiters survive parsing", () => {
  const csv = 'name,note\n"Smith, John","He said ""hi"""\n';
  const { rows } = parseCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Smith, John");
  assert.equal(rows[0].note, 'He said "hi"');
});

test("a UTF-8 BOM and CRLF endings do not corrupt the first header", () => {
  const { headers, rows } = parseCsv('﻿email,name\r\na@b.com,Aisha\r\n');
  assert.deepEqual(headers, ["email", "name"]);
  assert.equal(rows[0].email, "a@b.com");
});

test("headers are matched loosely", () => {
  const mapping = matchHeaders(["E-Mail", "Full Name", "Mobile", "Nationality", "City", "Tags"]);
  assert.equal(mapping.email, "E-Mail");
  assert.equal(mapping.name, "Full Name");
  assert.equal(mapping.phone, "Mobile");
  assert.equal(mapping.country, "Nationality");
  assert.equal(mapping.region, "City");
  assert.equal(mapping.groups, "Tags");
});

test("groups are trimmed and de-duplicated case-insensitively", () => {
  assert.deepEqual(parseGroups(" VIP , vip,Corporate ,, "), ["VIP", "Corporate"]);
  assert.equal(mergeGroups("VIP, Corporate", "vip, Expo 2026"), "VIP, Corporate, Expo 2026");
  assert.equal(mergeGroups("", "Expo 2026"), "Expo 2026");
});

test("import skips invalid addresses and reports their row numbers", () => {
  const csv = [
    "email,name",
    "good@example.com,Good",
    "not-an-email,Bad",
    ",Blank",
  ].join("\n");
  const { headers, rows } = parseCsv(csv);
  const plan = planImport(rows, headers);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.invalid.length, 2);
  // Header is row 1, so the bad rows are 3 and 4 as the admin sees them.
  assert.deepEqual(plan.invalid.map((entry) => entry.rowNumber), [3, 4]);
});

test("import skips a repeat of the same address within one file", () => {
  const csv = [
    "email,name",
    "same@example.com,First",
    "SAME@example.com,Second",
  ].join("\n");
  const { headers, rows } = parseCsv(csv);
  const plan = planImport(rows, headers);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.duplicatesInFile, 1);
  assert.equal(plan.candidates[0].email, "same@example.com");
});

test("import normalises countries and applies the extra group", () => {
  const csv = [
    "email,name,phone,country,groups",
    "a@example.com,Aisha,+971501234567,Dubai,VIP",
    "b@example.com,Ben,+447700900123,,",
  ].join("\n");
  const { headers, rows } = parseCsv(csv);
  const plan = planImport(rows, headers, "Expo 2026");

  assert.equal(plan.candidates[0].country, "United Arab Emirates");
  assert.equal(plan.candidates[0].groups, "VIP, Expo 2026");
  // No country column value, so it is inferred from the phone number.
  assert.equal(plan.candidates[1].country, "United Kingdom");
  assert.equal(plan.candidates[1].groups, "Expo 2026");
});

test("first and last name columns are joined", () => {
  const csv = "email,first name,last name\na@example.com,Aisha,Rahman";
  const { headers, rows } = parseCsv(csv);
  const plan = planImport(rows, headers);
  assert.equal(plan.candidates[0].name, "Aisha Rahman");
});

test("export defuses spreadsheet formulas but keeps + phone numbers", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell("-2+3"), "'-2+3");
  assert.equal(csvCell("+971 50 123 4567"), "+971 50 123 4567");
  assert.equal(csvCell("+971501234567"), "+971501234567");
  // A + that is not a plain phone number is still neutralised.
  assert.equal(csvCell("+cmd|' /c calc'!A0"), "'+cmd|' /c calc'!A0");
});

test("export quotes cells containing separators or newlines", () => {
  assert.equal(csvCell("Smith, John"), '"Smith, John"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
});

test("export carries a BOM and CRLF endings so Excel opens it correctly", () => {
  const csv = buildCsv(["email", "name"], [["a@b.com", "Aisha"]]);
  assert.ok(csv.startsWith("﻿"), "must start with a UTF-8 BOM");
  assert.ok(csv.includes("\r\n"), "must use CRLF line endings");
  assert.ok(csv.endsWith("\r\n"), "must end with a line break");
});

test("an exported file can be read back in", () => {
  const csv = buildCsv(
    ["email", "name", "phone", "groups"],
    [["a@b.com", "Smith, John", "+971501234567", "VIP, Corporate"]],
  );
  const { rows } = parseCsv(csv);
  assert.equal(rows[0].email, "a@b.com");
  assert.equal(rows[0].name, "Smith, John");
  assert.equal(rows[0].phone, "+971501234567");
  assert.equal(rows[0].groups, "VIP, Corporate");
});
