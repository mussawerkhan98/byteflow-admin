import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const entries = new Map();
for (const rawLine of readFileSync(
  new URL("../../.env", import.meta.url),
  "utf8",
).split(/\r?\n/)) {
  const separator = rawLine.indexOf("=");
  if (separator < 0) continue;
  const key = rawLine.slice(0, separator).trim().toLowerCase();
  let value = rawLine.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    value = value.slice(1, -1);
  entries.set(key, value);
}

const db = createClient({
  url: entries.get("db url"),
  authToken: entries.get("db token"),
});
const page = await db.execute({
  sql: "SELECT id FROM pages WHERE slug=? LIMIT 1",
  args: ["home"],
});
if (!page.rows[0]) throw new Error("Home page record not found");
const result = await db.execute({
  sql: "UPDATE faqs SET page_id=? WHERE page_id IS NULL",
  args: [Number(page.rows[0].id)],
});
console.log(`Assigned ${result.rowsAffected} existing FAQs to Home.`);
