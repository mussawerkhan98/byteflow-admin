/**
 * Sets up the home page Selected Work section from the projects already
 * published, so it shows real work from the first deploy:
 *
 * - If no project is featured on the homepage yet, the first four published
 *   projects (in their existing order) are, in that order.
 * - A blank business requirement ("challenge") is filled with the first
 *   sentence or two of the project's own description, so editors see real
 *   text in the admin.
 *
 * Needs the columns from scripts/migrate-cms.mjs. Additive and safe to re-run.
 *
 *   node --env-file=<env file> scripts/seed-home-projects.mjs --expect-host=<database host> [--dry-run]
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

// Same rules as the website's project-cards.ts, so the seed matches what the
// card would show with the field left blank.
const plainText = (html) =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
function firstSentences(text, max = 2, maxChars = 220) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]
  let out = ''
  for (const sentence of sentences.slice(0, max)) {
    const next = (out + sentence).trim()
    if (out && next.length > maxChars) break
    out = next + ' '
  }
  out = out.trim()
  return out.length > maxChars ? `${out.slice(0, maxChars).replace(/\s+\S*$/, '')}…` : out
}

async function run() {
  console.log(`Database: ${host}${dryRun ? ' (dry run — nothing is written)' : ''}`)
  const columns = new Set((await db.execute('PRAGMA table_info(projects)')).rows.map((row) => String(row.name)))
  const missing = ['home_featured', 'home_order', 'challenge'].filter((name) => !columns.has(name))
  if (missing.length) throw new Error(`Missing columns ${missing.join(', ')}: run scripts/migrate-cms.mjs first.`)

  const projects = (
    await db.execute('SELECT id, slug, title, description, challenge, home_featured FROM projects WHERE published = 1 ORDER BY sort_order, id')
  ).rows
  const statements = []

  if (!projects.some((project) => Number(project.home_featured) === 1)) {
    projects.slice(0, 4).forEach((project, index) => {
      console.log(`feature #${index + 1}: ${project.slug} — ${project.title}`)
      statements.push({ sql: 'UPDATE projects SET home_featured = 1, home_order = ? WHERE id = ?', args: [index + 1, project.id] })
    })
  } else {
    console.log('Homepage projects already chosen — left as they are.')
  }

  for (const project of projects) {
    if (String(project.challenge ?? '').trim()) continue
    const challenge = firstSentences(plainText(project.description))
    if (!challenge) continue
    console.log(`challenge: ${project.slug} — ${challenge}`)
    statements.push({ sql: 'UPDATE projects SET challenge = ? WHERE id = ?', args: [challenge, project.id] })
  }

  if (!statements.length) console.log('Nothing to fill.')
  else if (!dryRun) {
    await db.batch(statements, 'write')
    console.log(`Done: ${statements.length} updates.`)
  }
}

// No process.exit(): on Windows it can abort while the client is closing.
await run()
db.close()
