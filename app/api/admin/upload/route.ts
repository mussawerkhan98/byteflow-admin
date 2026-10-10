import { extname } from 'node:path'
import { isAdminAuthenticated } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { svgIconDataUrl, SvgIconError } from '../../../lib/svg-icon'

const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/gif', '.gif']])
const maxBytes = 5 * 1024 * 1024
const maxSvgBytes = 256 * 1024
// Browsers do not agree on the type they report for a .svg file: Chrome sends
// image/svg+xml, some send an XML type, and a file dragged from certain places
// arrives with no type at all. The extension plus the content check below are
// what actually decide, so a blank or XML type is not grounds for refusal.
const svgTypes = new Set(['image/svg+xml', 'text/xml', 'application/xml', 'text/plain', ''])

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  const kind = String(form.get('kind') ?? '')
  const altText = String(form.get('altText') ?? '').trim()
  if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload' }, { status: 400 })
  if (kind === 'icon') {
    if (!svgTypes.has(file.type) || extname(file.name).toLowerCase() !== '.svg') return Response.json({ error: 'Service icons must be SVG files' }, { status: 415 })
    if (file.size <= 0 || file.size > maxSvgBytes) return Response.json({ error: 'SVG icons must be between 1 byte and 256 KB' }, { status: 413 })
    try {
      const url = svgIconDataUrl(await file.text())
      await db.execute({ sql: 'INSERT INTO media (filename, url, mime_type, size_bytes, alt_text) VALUES (?, ?, ?, ?, ?)', args: [file.name, url, file.type, file.size, altText] })
      return Response.json({ url, altText }, { status: 201 })
    } catch (error) {
      if (error instanceof SvgIconError) return Response.json({ error: error.message }, { status: 415 })
      return Response.json({ error: 'The icon could not be read. Make sure it is a text SVG file, not a bitmap renamed to .svg.' }, { status: 415 })
    }
  }
  const extension = allowed.get(file.type)
  if (!extension || !['.jpg','.jpeg','.png','.webp','.gif'].includes(extname(file.name).toLowerCase())) return Response.json({ error: 'Use JPG, PNG, WebP, or GIF images' }, { status: 415 })
  if (file.size <= 0 || file.size > maxBytes) return Response.json({ error: 'Images must be between 1 byte and 5 MB' }, { status: 413 })
  const bytes = Buffer.from(await file.arrayBuffer())
  // The admin and public website are separate deployments, and a serverless
  // filesystem is both ephemeral and private to the deployment that wrote it.
  // Store the image itself in the shared CMS database so the returned URL works
  // immediately in both applications and survives subsequent deployments.
  const url = `data:${file.type};base64,${bytes.toString('base64')}`
  await db.execute({ sql: 'INSERT INTO media (filename, url, mime_type, size_bytes, alt_text) VALUES (?, ?, ?, ?, ?)', args: [file.name, url, file.type, file.size, altText] })
  return Response.json({ url, altText }, { status: 201 })
}
