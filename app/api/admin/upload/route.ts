import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { isAdminAuthenticated } from '../../../lib/auth'
import { db } from '../../../lib/db'

const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/gif', '.gif']])
const maxBytes = 5 * 1024 * 1024

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  const altText = String(form.get('altText') ?? '').trim()
  if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload' }, { status: 400 })
  const extension = allowed.get(file.type)
  if (!extension || !['.jpg','.jpeg','.png','.webp','.gif'].includes(extname(file.name).toLowerCase())) return Response.json({ error: 'Use JPG, PNG, WebP, or GIF images' }, { status: 415 })
  if (file.size <= 0 || file.size > maxBytes) return Response.json({ error: 'Images must be between 1 byte and 5 MB' }, { status: 413 })
  const filename = `${randomUUID()}${extension}`
  const directory = join(process.cwd(), 'public', 'uploads')
  const bytes = Buffer.from(await file.arrayBuffer())
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, filename), bytes, { flag: 'wx' })
  try {
    const websiteDirectory = join(process.cwd(), '..', 'byteflow user', 'public', 'uploads')
    await mkdir(websiteDirectory, { recursive: true })
    await writeFile(join(websiteDirectory, filename), bytes, { flag: 'wx' })
  } catch {
    // Separate production deployments should use the documented shared media adapter.
  }
  const url = `/uploads/${filename}`
  await db.execute({ sql: 'INSERT INTO media (filename, url, mime_type, size_bytes, alt_text) VALUES (?, ?, ?, ?, ?)', args: [file.name, url, file.type, file.size, altText] })
  return Response.json({ url, altText }, { status: 201 })
}
