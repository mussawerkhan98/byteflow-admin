import { readFileSync } from "node:fs";
import ts from "typescript";
import { createClient } from "@libsql/client";

const source = readFileSync(
  new URL("../../byteflow user/app/lib/projects-data.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const module = { exports: {} };
new Function("exports", "module", javascript)(module.exports, module);
const { projects } = module.exports;

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
let inserted = 0;
for (const [index, project] of projects.entries()) {
  const result = await db.execute({
    sql: `INSERT INTO projects (slug,title,description,category,industry,year,image_url,bullet_points,metrics,tags,sort_order,featured,published)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1) ON CONFLICT(slug) DO NOTHING`,
    args: [
      project.slug,
      project.title,
      `<p>${project.story}</p>`,
      project.category,
      project.industry,
      project.year,
      project.image,
      JSON.stringify(project.deliverables),
      JSON.stringify(project.metrics),
      JSON.stringify(project.tags),
      index * 10,
      project.featured ? 1 : 0,
    ],
  });
  inserted += result.rowsAffected;
}
console.log(
  `Imported ${inserted} current projects; ${projects.length - inserted} already existed.`,
);
