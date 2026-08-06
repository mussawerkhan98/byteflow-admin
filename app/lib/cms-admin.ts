import 'server-only'
import { db } from './db'
import type { Field, Resource } from './cms-config'

type Data = Record<string, unknown>

async function ensureResourceTable(resource: Resource) {
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
      return null
    }
    const number = Number(value)
    if (!Number.isFinite(number)) throw new Error(`${field.label} must be a valid number`)
    if ((field.name === 'page_id' || field.name === 'parent_id') && number <= 0) {
      if (field.required) throw new Error(`${field.label} must reference an existing record`)
      return null
    }
    return number
  }
  const text = typeof value === 'string' ? value.trim() : String(value ?? '')
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

function clean(resource: Resource, input: Data) {
  const data = Object.fromEntries(resource.fields.map((field) => [field.name, normalize(field, input[field.name])]))
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
