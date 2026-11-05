import 'server-only'
import { db } from './db'
import type { Field, Resource } from './cms-config'
import { sanitizeEditorHtml } from './editor-html'
import { checkSiteFigures } from './site-figures'
import { FieldError } from './field-error'

type Data = Record<string, unknown>

/**
 * Columns the blog post editor added. Created on first use, so deploying the
 * admin needs no manual migration; scripts/migrate-cms.mjs adds the same
 * ones. Defaults match how the website behaved before they existed.
 */
const POST_COLUMNS = [
  "ALTER TABLE posts ADD COLUMN image_alt TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE posts ADD COLUMN author_name TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE posts ADD COLUMN show_toc INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE posts ADD COLUMN show_share INTEGER NOT NULL DEFAULT 1',
  'ALTER TABLE posts ADD COLUMN show_related INTEGER NOT NULL DEFAULT 1',
]
/**
 * The header bar's settings. The switches default to on, which is how the
 * website's top bar looks with nothing saved.
 */
const SETTINGS_COLUMNS = [
  "ALTER TABLE site_settings ADD COLUMN header_show_phone INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE site_settings ADD COLUMN header_menu_uppercase INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE site_settings ADD COLUMN header_cta_label TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_cta_link TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_dropdown_note TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_dropdown_cta TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN header_cta_short_label TEXT NOT NULL DEFAULT ''",
  // Site-wide figures (website: app/lib/site-figures.ts). Blank shows its defaults.
  "ALTER TABLE site_settings ADD COLUMN client_count TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN google_rating TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN google_review_count TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN founded_year TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE site_settings ADD COLUMN google_business_url TEXT NOT NULL DEFAULT ''",
]
/** The home page Services tab wording (website: app/lib/service-tabs.ts). */
const SERVICE_COLUMNS = [
  "ALTER TABLE services ADD COLUMN eyebrow TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE services ADD COLUMN tagline TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE services ADD COLUMN highlights TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE services ADD COLUMN image_caption TEXT NOT NULL DEFAULT ''",
]
/** The home page Selected Work card (website: app/lib/project-cards.ts). */
const PROJECT_COLUMNS = [
  "ALTER TABLE projects ADD COLUMN home_featured INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE projects ADD COLUMN home_order INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE projects ADD COLUMN challenge TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE projects ADD COLUMN card_image TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE projects ADD COLUMN card_image_alt TEXT NOT NULL DEFAULT ''",
]
const columnsReady = new Map<string, Promise<void>>()

async function addColumns(statements: string[]) {
  for (const statement of statements) {
    try {
      await db.execute(statement)
    } catch (error) {
      if (!/duplicate column name/i.test(String(error))) throw error
    }
  }
}

/** Runs each table's column additions once per server, retrying after a failure. */
async function ensureColumns(table: string, statements: string[]) {
  let ready = columnsReady.get(table)
  if (!ready) {
    ready = addColumns(statements).catch((error) => {
      columnsReady.delete(table)
      throw error
    })
    columnsReady.set(table, ready)
  }
  await ready
}

async function ensureResourceTable(resource: Resource) {
  if (resource.table === 'posts') return ensureColumns('posts', POST_COLUMNS)
  if (resource.table === 'site_settings') return ensureColumns('site_settings', SETTINGS_COLUMNS)
  if (resource.table === 'services') return ensureColumns('services', SERVICE_COLUMNS)
  if (resource.table === 'projects') return ensureColumns('projects', PROJECT_COLUMNS)
  if (resource.table !== 'website_scripts') return
  await db.execute(`CREATE TABLE IF NOT EXISTS website_scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    placement TEXT NOT NULL DEFAULT 'head' CHECK(placement IN ('head','body_end')),
    code TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)
}

function normalize(field: Field, value: unknown) {
  if (field.type === 'boolean') return value === true || value === 1 || value === '1' ? 1 : 0
  if (field.type === 'number') {
    if (value === '' || value === null || value === undefined) {
      if (field.required) throw new Error(`${field.label} is required`)
      // Only the foreign keys are nullable columns. Every other optional
      // number (sort_order, rating) is NOT NULL in the schema, so leaving
      // the input blank has to fall back to that column's default rather
      // than writing null and failing the insert.
      if (field.name === 'page_id' || field.name === 'parent_id') return null
      return field.name === 'rating' ? 5 : 0
    }
    const number = Number(value)
    if (!Number.isFinite(number)) throw new Error(`${field.label} must be a valid number`)
    if ((field.name === 'page_id' || field.name === 'parent_id') && number <= 0) {
      if (field.required) throw new Error(`${field.label} must reference an existing record`)
      return null
    }
    return number
  }
  // Rich text is cleaned here too, so markup that skipped the editor -- an
  // old tab, a script, a direct API call -- still can't be saved broken.
  const text = field.type === 'richtext'
    ? sanitizeEditorHtml(typeof value === 'string' ? value : String(value ?? ''))
    : typeof value === 'string' ? value.trim() : String(value ?? '')
  if (field.type === 'json') {
    JSON.parse(text || '{}')
    return text || '{}'
  }
  if (field.type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error(`${field.label} must be a valid email address`)
  if (field.type === 'url' && text && !/^(https?:\/\/|\/)/i.test(text)) throw new Error(`${field.label} must be an HTTP(S) or site-relative URL`)
  if (field.name === 'slug' && text && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)) throw new Error('Slug must use lowercase letters, numbers, and hyphens')
  if (field.required && !text) throw new Error(`${field.label} is required`)
  if (field.options && text && !field.options.includes(text)) throw new Error(`${field.label} is invalid`)
  if (field.name === 'rating' && (Number(text) < 1 || Number(text) > 5)) throw new Error('Rating must be between 1 and 5')
  return text
}

/** Limits that keep a service's home page tab from breaking its layout. */
const SERVICE_TAB_LIMITS: [string, string, number][] = [
  ['eyebrow', 'Home tab — small heading', 40],
  ['tagline', 'Home tab — subtitle', 80],
  ['image_caption', 'Home tab — image caption', 48],
  ['image_alt', 'Image alt text', 125],
  ['cta_label', 'Home tab — button text', 28],
]

export function checkServiceTab(data: Record<string, unknown>) {
  for (const [name, label, max] of SERVICE_TAB_LIMITS) {
    const value = String(data[name] ?? '')
    if (value.length > max) throw new FieldError(name, `${label} must be ${max} characters or fewer`)
  }
  const bullets = String(data.highlights ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (bullets.length > 5) throw new FieldError('highlights', 'Home tab — bullet points: up to 5, one per line')
  if (bullets.some((line) => line.length > 70)) throw new FieldError('highlights', 'Home tab — bullet points: keep each one to 70 characters')
  if (String(data.image_url ?? '').trim() && !String(data.image_alt ?? '').trim())
    throw new FieldError('image_alt', 'Alt text required: describe the image, so screen readers and Google can read it')
}

/** Limits that keep a project's homepage card in shape, and no picture without alt text. */
export function checkProjectCard(data: Record<string, unknown>) {
  const limits: [string, string, number][] = [
    ['challenge', 'Homepage card — business requirement', 220],
    ['card_image_alt', 'Homepage card — image alt text', 125],
  ]
  for (const [name, label, max] of limits) {
    if (String(data[name] ?? '').length > max) throw new FieldError(name, `${label} must be ${max} characters or fewer`)
  }
  if (String(data.card_image ?? '').trim() && !String(data.card_image_alt ?? '').trim())
    throw new FieldError('card_image_alt', 'Alt text required: describe the image, so screen readers and Google can read it')
}

function clean(resource: Resource, input: Data) {
  // A problem with one field's value is reported against that field.
  const data = Object.fromEntries(
    resource.fields.map((field) => {
      try {
        return [field.name, normalize(field, input[field.name])]
      } catch (error) {
        throw error instanceof FieldError ? error : new FieldError(field.name, error instanceof Error ? error.message : String(error))
      }
    }),
  )
  if (resource.table === 'services') checkServiceTab(data)
  if (resource.table === 'projects') checkProjectCard(data)
  if (resource.table === 'site_settings') checkSiteFigures(data)
  if (resource.table === 'website_scripts') {
    const code = String(data.code ?? '')
    if (code.length > 100_000) throw new Error('Script or HTML snippet must be 100,000 characters or fewer')
    if (/<\/(?:head|body|html)\s*>/i.test(code)) throw new Error('Script snippets cannot close the head, body, or HTML document')
  }
  return data
}

export async function listRecords(resource: Resource) {
  await ensureResourceTable(resource)
  const result = await db.execute(`SELECT * FROM ${resource.table} ORDER BY ${resource.orderBy}`)
  return result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value])))
}

export async function createRecord(resource: Resource, input: Data) {
  await ensureResourceTable(resource)
  if (resource.readOnly) throw new Error('This resource is read-only')
  const data = clean(resource, input)
  const fields = Object.keys(data)
  const result = await db.execute({
    sql: `INSERT INTO ${resource.table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    args: Object.values(data) as (string | number | null)[],
  })
  return { id: Number(result.lastInsertRowid) }
}

export async function updateRecord(resource: Resource, id: number, input: Data) {
  await ensureResourceTable(resource)
  const data = clean(resource, input)
  const fields = Object.keys(data)
  await db.execute({
    sql: `UPDATE ${resource.table} SET ${fields.map((field) => `${field} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    args: [...Object.values(data), id] as (string | number | null)[],
  })
}

export async function deleteRecord(resource: Resource, id: number) {
  await ensureResourceTable(resource)
  await db.execute({ sql: `DELETE FROM ${resource.table} WHERE id = ?`, args: [id] })
}

export async function reorderRecord(resource: Resource, id: number, direction: 'up' | 'down') {
  if (!resource.fields.some((field) => field.name === 'sort_order')) throw new Error('This resource cannot be reordered')
  const current = await db.execute({ sql: `SELECT id, sort_order FROM ${resource.table} WHERE id = ?`, args: [id] })
  const row = current.rows[0]
  if (!row) throw new Error('Record not found')
  const operator = direction === 'up' ? '<' : '>'
  const order = direction === 'up' ? 'DESC' : 'ASC'
  const adjacent = await db.execute({ sql: `SELECT id, sort_order FROM ${resource.table} WHERE sort_order ${operator} ? ORDER BY sort_order ${order} LIMIT 1`, args: [Number(row.sort_order)] })
  const other = adjacent.rows[0]
  if (!other) return
  await db.batch([
    { sql: `UPDATE ${resource.table} SET sort_order = ? WHERE id = ?`, args: [Number(other.sort_order), id] },
    { sql: `UPDATE ${resource.table} SET sort_order = ? WHERE id = ?`, args: [Number(row.sort_order), Number(other.id)] },
  ], 'write')
}
