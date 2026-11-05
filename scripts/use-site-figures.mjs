/**
 * Replaces the business figures typed into saved content ("500+ businesses",
 * "since 2017", "Eight years") with the placeholders the website fills from
 * Contact details & logo ({clients}, {founded}, {years}, {rating},
 * {reviews}), so changing a figure there changes it everywhere.
 *
 * Looks at the text the website shows from the database: page titles,
 * descriptions and banners, the footer text, page sections, FAQs and the
 * tracking/JSON-LD snippets. Only these exact phrasings are touched; anything
 * else is left as written. Running it twice changes nothing.
 *
 * Deploy the website first: until it fills the placeholders in, they would
 * show as typed.
 *
 *   node --env-file=<env file> scripts/use-site-figures.mjs --expect-host=<database host> [--dry-run]
 */
import { createClient } from '@libsql/client'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)
const url = process.env.TURSO_DATABASE_URL
if (!url) throw new Error('TURSO_DATABASE_URL is required')
const host = new URL(url.replace(/^libsql:/, 'https:')).host
if (!args['expect-host']) throw new Error(`Pass --expect-host=${host} to confirm this is the database you mean.`)
if (args['expect-host'] !== host) throw new Error(`Refusing to run: TURSO_DATABASE_URL points at ${host}, not ${args['expect-host']}.`)
const dryRun = args['dry-run'] === 'true'

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
console.log(`Database: ${host}${dryRun ? ' (dry run — nothing is written)' : ''}`)

/** Phrase → placeholder. Reviews first, so "500+ reviews" isn't read as clients. */
const RULES = [
  [/\b(?:50|500)\+ (Google )?reviews\b/g, '{reviews} $1reviews'],
  [/\b4\.9(★| stars?\b| out of 5\b|\/5\b)/g, '{rating}$1'],
  [/\b500\+ (businesses|UAE businesses|clients)\b/g, '{clients} $1'],
  [/\b(?:over|more than|around) 500 (businesses|clients)\b/g, '{clients} $1'],
  [/\b([Ss]ince|[Ii]n|[Ff]ounded in) 2017\b/g, '$1 {founded}'],
  [/("foundingDate"\s*:\s*)"2017"/g, '$1"{founded}"'],
  [/\b([Ee])ight years\b/g, '{years} years'],
]

const apply = (text) => RULES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)

const TARGETS = [
  ['pages', ['meta_title', 'meta_description', 'og_title', 'og_description', 'hero_label', 'hero_heading', 'hero_description', 'hero_trust_line']],
  ['site_settings', ['footer_text', 'copyright_text']],
  ['page_sections', ['content']],
  ['faqs', ['question', 'answer']],
  ['website_scripts', ['code']],
]

let changed = 0
for (const [table, wanted] of TARGETS) {
  const rows = (await db.execute(`SELECT * FROM ${table}`)).rows
  if (!rows.length) continue
  // hero_trust_line only exists once the hero migration has run.
  const columns = wanted.filter((column) => column in rows[0])
  for (const row of rows) {
    const updates = {}
    for (const column of columns) {
      const before = typeof row[column] === 'string' ? row[column] : ''
      if (!before || before.startsWith('data:')) continue
      const after = apply(before)
      if (after !== before) updates[column] = after
    }
    const names = Object.keys(updates)
    if (!names.length) continue
    for (const name of names) {
      const sample = (text) => text.replace(/\s+/g, ' ').match(/.{0,40}\{(clients|rating|reviews|founded|years)\}.{0,30}/)?.[0] ?? ''
      console.log(`  ${table}#${row.id}.${name}: …${sample(updates[name])}…`)
    }
    changed++
    if (!dryRun)
      await db.execute({
        sql: `UPDATE ${table} SET ${names.map((name) => `${name} = ?`).join(', ')} WHERE id = ?`,
        args: [...names.map((name) => updates[name]), row.id],
      })
  }
}
console.log(`${changed} row${changed === 1 ? '' : 's'} ${dryRun ? 'would be updated' : 'updated'}.`)
