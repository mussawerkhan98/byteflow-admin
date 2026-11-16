import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { db } from './db'
import { siteUrl } from './admin-guide'
import { ensurePostColumns } from './cms-admin'
import { ensureClaudeTables, type ClaudeActor } from './claude-store'
import { snapshotPost } from './post-revisions'
import { processUpload } from './image-pipeline'
import { UploadError } from './image-rules'
import { automaticReadTime, contentStats, fromDateInput, seoChecklist } from './post-checklist'
import { ArticleError, apiFieldName, articleColumns, changedColumns, parseTags, slugify, type ArticleInput } from './claude-content'
import { refreshSiteContent } from './site-revalidate'

/**
 * What the Claude connector can do with blog articles — the one place both the
 * REST API (/api/claude/*) and the MCP tools (/mcp) go through.
 *
 * Claude can list, read, create drafts, edit, publish when asked, and upload
 * images. It cannot delete anything or touch any other part of the site.
 * Every change is logged in claude_activity, and every edit first copies the
 * post into post_revisions, so the admin panel can undo it.
 */

type Row = Record<string, unknown>

const status = (row: Row) => (Number(row.published) === 1 ? 'published' : 'draft')
const today = () => fromDateInput(new Date().toISOString().slice(0, 10))

async function ready() {
  await ensureClaudeTables()
  await ensurePostColumns()
}

async function findPost(id: number): Promise<Row> {
  if (!Number.isInteger(id) || id <= 0) throw new ArticleError('Article id must be a positive whole number.')
  const row = (await db.execute({ sql: 'SELECT * FROM posts WHERE id = ? LIMIT 1', args: [id] })).rows[0]
  if (!row) throw new ArticleError(`Article ${id} not found. Use list_articles to see the article ids.`, 404)
  return row as Row
}

function summary(row: Row) {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    status: status(row),
    category: String(row.category ?? ''),
    tags: parseTags(row.tags),
    excerpt: String(row.excerpt ?? ''),
    date: String(row.date ?? ''),
    updated_at: String(row.updated_at || row.created_at || ''),
    url: status(row) === 'published' ? siteUrl(`/${row.slug}`) : null,
  }
}

function full(row: Row) {
  const { checks } = seoChecklist(row)
  return {
    ...summary(row),
    content: String(row.content ?? ''),
    content_format: 'html',
    author_name: String(row.author_name ?? ''),
    read_time: String(row.read_time ?? ''),
    featured_image_url: String(row.image_url ?? ''),
    featured_image_alt: String(row.image_alt ?? ''),
    seo_title: String(row.meta_title ?? ''),
    seo_description: String(row.meta_description ?? ''),
    public_url_when_published: siteUrl(`/${row.slug}`),
    edit_in_admin: '/admin/posts',
    // What the admin's SEO checklist would flag, so Claude can fix it before publishing.
    needs_attention: checks.filter((check) => check.status === 'attention').map((check) => `${check.label}: ${check.detail}`),
  }
}

async function logActivity(actor: ClaudeActor, action: string, postId: number | null, revisionId: number | null, text: string) {
  await db.execute({
    sql: 'INSERT INTO claude_activity (actor, client_name, action, post_id, revision_id, summary, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [actor.email, actor.clientName, action, postId, revisionId, text.slice(0, 500), actor.ip.slice(0, 64)],
  })
}

/** Posts live at the website root, so a slug must not be taken by a post, page or service. */
async function slugOwner(slug: string, exceptPostId?: number): Promise<string | null> {
  const post = await db.execute({ sql: 'SELECT id FROM posts WHERE slug = ? AND id != ? LIMIT 1', args: [slug, exceptPostId ?? 0] })
  if (post.rows[0]) return `article ${Number(post.rows[0].id)}`
  for (const table of ['pages', 'services']) {
    const hit = await db.execute({ sql: `SELECT 1 FROM ${table} WHERE slug = ? LIMIT 1`, args: [slug] }).catch(() => ({ rows: [] }))
    if (hit.rows[0]) return `a ${table === 'pages' ? 'page' : 'service'}`
  }
  return null
}

async function freeSlug(base: string, exceptPostId?: number) {
  const root = base || 'article'
  for (let n = 1; n < 50; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`
    if (!(await slugOwner(candidate, exceptPostId))) return candidate
  }
  throw new ArticleError('Could not find a free slug for this title. Send a slug of your own.')
}

// ── Reading ─────────────────────────────────────────────────────────────────

export async function listArticles(options: { search?: string; status?: string; category?: string; page?: number; perPage?: number }) {
  await ready()
  const where: string[] = [], args: (string | number)[] = []
  if (options.status === 'draft') where.push('published = 0')
  else if (options.status === 'published') where.push('published = 1')
  else if (options.status && options.status !== 'all') throw new ArticleError('Status must be "draft", "published" or "all".')
  if (options.search?.trim()) {
    const term = `%${options.search.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`
    where.push("(title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')")
    args.push(term, term, term, term)
  }
  if (options.category?.trim()) { where.push('lower(category) = lower(?)'); args.push(options.category.trim()) }
  const perPage = Math.min(Math.max(Math.trunc(options.perPage ?? 20), 1), 50)
  const page = Math.max(Math.trunc(options.page ?? 1), 1)
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = Number((await db.execute({ sql: `SELECT COUNT(*) AS n FROM posts ${clause}`, args })).rows[0]?.n ?? 0)
  const rows = await db.execute({
    sql: `SELECT id, title, slug, published, category, tags, excerpt, date, created_at, updated_at FROM posts ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    args: [...args, perPage, (page - 1) * perPage],
  })
  return { articles: rows.rows.map((row) => summary(row as Row)), page, per_page: perPage, total, total_pages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getArticle(id: number) {
  await ready()
  return full(await findPost(id))
}

export async function listCategories() {
  await ready()
  const categories = await db.execute("SELECT category, COUNT(*) AS n, SUM(published) AS live FROM posts WHERE trim(category) != '' GROUP BY category ORDER BY n DESC")
  const tagCounts = new Map<string, { name: string; count: number }>()
  for (const row of (await db.execute("SELECT tags FROM posts WHERE trim(tags) != ''")).rows) {
    for (const tag of parseTags(row.tags)) {
      const entry = tagCounts.get(tag.toLowerCase()) ?? { name: tag, count: 0 }
      entry.count += 1
      tagCounts.set(tag.toLowerCase(), entry)
    }
  }
  return {
    categories: categories.rows.map((row) => ({ name: String(row.category), articles: Number(row.n), published: Number(row.live ?? 0) })),
    tags: [...tagCounts.values()].sort((a, b) => b.count - a.count).map((tag) => ({ name: tag.name, articles: tag.count })),
    note: 'Use an existing category where one fits; a new category name creates a new group on the Blog page once published.',
  }
}

// ── Writing ─────────────────────────────────────────────────────────────────

/** Always a draft: nothing Claude creates is visible on the website until publish_article. */
export async function createDraft(actor: ClaudeActor, input: ArticleInput) {
  await ready()
  const columns = articleColumns(input, { creating: true })
  if (columns.slug) {
    const owner = await slugOwner(columns.slug)
    if (owner) throw new ArticleError(`Slug "${columns.slug}" is already used by ${owner}. Choose another slug.`, 409)
  } else {
    columns.slug = await freeSlug(slugify(columns.title))
  }
  columns.read_time = automaticReadTime(contentStats(columns.content).words)
  const names = Object.keys(columns)
  const result = await db.execute({
    sql: `INSERT INTO posts (${names.join(', ')}, date, published) VALUES (${names.map(() => '?').join(', ')}, '', 0)`,
    args: Object.values(columns),
  })
  const id = Number(result.lastInsertRowid)
  await snapshotPost(id, 'First version, created by Claude', `${actor.email} (Claude)`)
  await logActivity(actor, 'create', id, null, `Created draft "${columns.title}"`)
  return { ...full(await findPost(id)), message: `Draft article ${id} created. It is not on the website until it is published.` }
}

export async function updateArticle(actor: ClaudeActor, id: number, input: ArticleInput) {
  await ready()
  const current = await findPost(id)
  const columns = articleColumns(input, { creating: false, current })
  if (!Object.keys(columns).length)
    throw new ArticleError('Nothing to update. Send at least one of: title, content, excerpt, category, tags, author_name, featured_image_url, featured_image_alt, seo_title, seo_description, slug.')
  if (columns.slug !== undefined && columns.slug !== String(current.slug)) {
    if (status(current) === 'published')
      throw new ArticleError(`Article ${id} is published, so its slug can't change: that would break its web address. Ask an admin to change it in the admin panel.`, 409)
    if (!columns.slug) delete columns.slug
    else {
      const owner = await slugOwner(columns.slug, id)
      if (owner) throw new ArticleError(`Slug "${columns.slug}" is already used by ${owner}. Choose another slug.`, 409)
    }
  }
  // Keep the read time in step with the words, unless someone typed their own.
  if (columns.content) {
    const stored = String(current.read_time ?? '').trim()
    if (!stored || stored === automaticReadTime(contentStats(String(current.content ?? '')).words))
      columns.read_time = automaticReadTime(contentStats(columns.content).words)
  }
  const changed = changedColumns(current, columns)
  if (!changed.length) return { ...full(current), message: `Article ${id} already has those values; nothing changed.` }
  const fields = changed.filter((column) => column !== 'read_time').map(apiFieldName)
  const revisionId = await snapshotPost(id, `Before Claude changed ${fields.join(', ')}`, `${actor.email} (Claude)`)
  await db.execute({
    sql: `UPDATE posts SET ${changed.map((column) => `${column} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    args: [...changed.map((column) => columns[column]), id],
  })
  await logActivity(actor, 'update', id, revisionId, `Changed ${fields.join(', ')} on "${String(columns.title ?? current.title)}"`)
  if (status(current) === 'published') refreshSiteContent()
  return { ...full(await findPost(id)), message: `Article ${id} updated (${fields.join(', ')}).${status(current) === 'published' ? ' The change is live on the website.' : ''}` }
}

export async function publishArticle(actor: ClaudeActor, id: number) {
  await ready()
  const current = await findPost(id)
  if (status(current) === 'published') throw new ArticleError(`Article ${id} is already published at ${siteUrl(`/${current.slug}`)}.`, 409)
  if (!String(current.title ?? '').trim() || !String(current.content ?? '').replace(/<[^>]+>/g, '').trim())
    throw new ArticleError(`Article ${id} needs a title and content before it can be published.`)
  if (String(current.image_url ?? '').trim() && !String(current.image_alt ?? '').trim())
    throw new ArticleError(`Article ${id} has a featured image without alt text. Set featured_image_alt first.`)
  const owner = await slugOwner(String(current.slug), id)
  if (owner) throw new ArticleError(`Article ${id}'s slug "${current.slug}" is now used by ${owner}. Change the slug first.`, 409)
  const revisionId = await snapshotPost(id, 'Before Claude published it', `${actor.email} (Claude)`)
  await db.execute({
    sql: "UPDATE posts SET published = 1, date = CASE WHEN trim(date) = '' THEN ? ELSE date END, updated_at = datetime('now') WHERE id = ?",
    args: [today(), id],
  })
  await logActivity(actor, 'publish', id, revisionId, `Published "${String(current.title)}"`)
  refreshSiteContent()
  const url = siteUrl(`/${current.slug}`)
  return { ...full(await findPost(id)), message: `Article ${id} is now live at ${url}.` }
}

// ── Images ──────────────────────────────────────────────────────────────────

const MAX_IMAGE = 5 * 1024 * 1024

function privateAddress(address: string) {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase()
    if (lower.startsWith('::ffff:')) return privateAddress(lower.slice(7))
    return lower === '::1' || lower === '::' || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower)
  }
  const [a, b] = address.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

/** Downloads a public https image, refusing internal addresses (also after redirects) and anything over 5 MB. */
async function downloadImage(address: string): Promise<{ bytes: Buffer; type: string; name: string }> {
  let url: URL
  try { url = new URL(address) } catch { throw new ArticleError('image_url is not a valid URL.') }
  for (let hop = 0; hop < 4; hop += 1) {
    if (url.protocol !== 'https:') throw new ArticleError('image_url must start with https://.')
    const addresses = await lookup(url.hostname, { all: true }).catch(() => [])
    if (!addresses.length) throw new ArticleError(`Could not find the server ${url.hostname}.`)
    if (addresses.some((entry) => privateAddress(entry.address))) throw new ArticleError('image_url must point to a public website.')
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { accept: 'image/*' } })
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      url = new URL(response.headers.get('location')!, url)
      continue
    }
    if (!response.ok) throw new ArticleError(`Downloading the image failed: ${url.hostname} answered ${response.status}.`)
    const type = (response.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!type.startsWith('image/')) throw new ArticleError(`image_url did not return an image (it returned ${type || 'an unknown type'}).`)
    if (Number(response.headers.get('content-length') ?? 0) > MAX_IMAGE) throw new ArticleError('The image is larger than 5 MB.')
    const reader = response.body?.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_IMAGE) { await reader.cancel(); throw new ArticleError('The image is larger than 5 MB.') }
      chunks.push(value)
    }
    return { bytes: Buffer.concat(chunks), type, name: decodeURIComponent(url.pathname.split('/').pop() || 'image') }
  }
  throw new ArticleError('image_url redirected too many times.')
}

export async function uploadImage(actor: ClaudeActor, input: { bytes?: Buffer; base64?: string; type?: string; filename?: string; imageUrl?: string; altText?: string }) {
  await ready()
  const alt = String(input.altText ?? '').trim()
  if (!alt) throw new ArticleError('alt_text is required: describe what the picture shows.')
  let { bytes, type, filename } = input
  if (input.base64) {
    // Plain base64, or a data: URL that also says the type.
    const dataUrl = /^data:(image\/[\w.+-]+);base64,([\s\S]*)$/.exec(input.base64)
    bytes = Buffer.from(dataUrl ? dataUrl[2] : input.base64, 'base64')
    type = dataUrl?.[1] ?? type
  } else if (input.imageUrl) {
    const downloaded = await downloadImage(input.imageUrl)
    bytes = downloaded.bytes; type = downloaded.type; filename ||= downloaded.name
  }
  if (!bytes?.length) throw new ArticleError('Send the image as image_base64 or image_url.')
  if (bytes.length > MAX_IMAGE) throw new ArticleError('The image is larger than 5 MB.')
  const name = (filename || 'image').replace(/[^\w.-]+/g, '-').slice(0, 100) || 'image'
  try {
    const result = await processUpload({ kind: 'image', file: new File([new Uint8Array(bytes)], name, { type: type || 'application/octet-stream' }), alt, decorative: false })
    await logActivity(actor, 'upload_image', null, null, `Uploaded image ${name} (${result.url})`)
    return {
      url: result.url,
      preview_url: siteUrl(result.url),
      alt_text: result.alt,
      width: result.width,
      height: result.height,
      message: `Image uploaded. Use "${result.url}" as featured_image_url, or in the content as <img src="${siteUrl(result.url)}" alt="…">.`,
    }
  } catch (error) {
    if (error instanceof UploadError) throw new ArticleError(error.message, error.status)
    throw error
  }
}

// ── For the admin panel ─────────────────────────────────────────────────────

export async function listActivity(limit = 100) {
  await ensureClaudeTables()
  const result = await db.execute({
    sql: `SELECT a.*, p.title AS post_title, p.slug AS post_slug, p.published AS post_published FROM claude_activity a
          LEFT JOIN posts p ON p.id = a.post_id ORDER BY a.id DESC LIMIT ?`,
    args: [limit],
  })
  return result.rows.map((row) => ({
    id: Number(row.id), action: String(row.action), actor: String(row.actor), clientName: String(row.client_name),
    postId: row.post_id === null ? null : Number(row.post_id), revisionId: row.revision_id === null ? null : Number(row.revision_id),
    summary: String(row.summary), ip: String(row.ip), createdAt: String(row.created_at),
    postTitle: row.post_title === null ? null : String(row.post_title), postSlug: row.post_slug === null ? null : String(row.post_slug),
    postPublished: row.post_published === null ? null : Number(row.post_published) === 1,
  }))
}

/** Logs an undo made in the admin panel; its own revision lets the undo be undone. */
export async function logAdminRestore(adminName: string, restored: { postId: number; title: string; savedRevisionId: number | null }, revisionId: number) {
  await ensureClaudeTables()
  await db.execute({
    sql: 'INSERT INTO claude_activity (actor, client_name, action, post_id, revision_id, summary) VALUES (?, ?, ?, ?, ?, ?)',
    args: [adminName, 'Admin panel', 'restore', restored.postId, restored.savedRevisionId, `Put "${restored.title}" back to revision ${revisionId}`],
  })
  refreshSiteContent()
}
