import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const entries = new Map();
for (const rawLine of readFileSync(new URL("../../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const separator = rawLine.indexOf("=");
  if (separator < 0) continue;
  const key = rawLine.slice(0, separator).trim().toLowerCase();
  let value = rawLine.slice(separator + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  entries.set(key, value);
}

const db = createClient({ url: entries.get("db url"), authToken: entries.get("db token") });
const parentResult = await db.execute({ sql: "SELECT id FROM menu_items WHERE area='header' AND lower(label)='services' LIMIT 1", args: [] });
const cloudResult = await db.execute({ sql: "SELECT id FROM menu_items WHERE area='header' AND lower(label)='cloud services' LIMIT 1", args: [] });
if (!parentResult.rows[0]) throw new Error("Services menu item not found");
if (!cloudResult.rows[0]) throw new Error("Cloud Services menu item not found");
const parentId = Number(parentResult.rows[0].id);
const cloudId = Number(cloudResult.rows[0].id);
const orderResult = await db.execute({ sql: "SELECT COALESCE(MAX(sort_order),-10)+10 AS next_order FROM menu_items WHERE area='header' AND parent_id=? AND id<>?", args: [parentId, cloudId] });
await db.execute({ sql: "UPDATE menu_items SET parent_id=?,sort_order=?,updated_at=datetime('now') WHERE id=?", args: [parentId, Number(orderResult.rows[0].next_order), cloudId] });
console.log("Cloud Services is now the last submenu under Services.");
