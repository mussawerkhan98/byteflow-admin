/**
 * One-off: run the editor's HTML cleaner over every saved rich-text field.
 *
 *   node scripts/clean-rich-html.mjs           dry run: report only
 *   node scripts/clean-rich-html.mjs --write   save the cleaned HTML
 *
 * Needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, and Node 22.18+ (it loads
 * the cleaner straight from app/lib/editor-html.ts). Node may print a
 * MODULE_TYPELESS_PACKAGE_JSON warning about that file; it is harmless.
 *
 * Covers the fields the website renders as HTML: blog post content and
 * project descriptions. Services and pages hold plain text, so there is no
 * markup there to clean.
 *
 * A record whose cleaned version has fewer words is never written -- it is
 * listed for a person to look at instead. updated_at is left alone so the
 * posts' "last modified" dates, which Google reads, don't all jump to today.
 */
import { createClient } from '@libsql/client'

if (!process.features?.typescript) {
  throw new Error('This script needs Node 22.18 or newer (it loads a .ts file). Check with: node -v')
}
if (!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is required')

const { sanitizeEditorHtml, countH2 } = await import('../app/lib/editor-html.ts')
const write = process.argv.includes('--write')
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

const TARGETS = [
  { table: 'posts', column: 'content', label: 'slug' },
  { table: 'projects', column: 'description', label: 'slug' },
]

const words = (html) =>
  String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length

let changed = 0
let written = 0
const held = []

console.log(write ? 'Cleaning and SAVING rich-text HTML…\n' : 'Dry run — nothing will be saved. Add --write to save.\n')
for (const { table, column, label } of TARGETS) {
  let rows
  try {
    rows = (await db.execute(`SELECT id, ${label} AS label, ${column} AS html FROM ${table}`)).rows
  } catch (error) {
    console.log(`${table}: skipped (${error.message})`)
    continue
  }
  console.log(`== ${table}.${column} (${rows.length} records)`)
  for (const row of rows) {
    const before = String(row.html ?? '')
    const after = sanitizeEditorHtml(before)
    if (after === before) continue
    changed += 1
    const lost = words(before) - words(after)
    const line = `  #${row.id} ${row.label}: H2 ${countH2(before)} -> ${countH2(after)}, words ${words(before)} -> ${words(after)}`
    if (lost > 0) {
      held.push(`${table} #${row.id} ${row.label} (would lose ${lost} words)`)
      console.log(`${line}  HELD: not written`)
      continue
    }
    console.log(line)
    if (write) {
      await db.execute({ sql: `UPDATE ${table} SET ${column} = ? WHERE id = ?`, args: [after, row.id] })
      written += 1
    }
  }
}

console.log(`\n${changed} record(s) would change${write ? `, ${written} saved` : ''}.`)
if (held.length) console.log(`Held back for a manual look:\n  ${held.join('\n  ')}`)
