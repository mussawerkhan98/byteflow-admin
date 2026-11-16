import { uploadImage } from '../../../lib/claude-articles'
import { ArticleError } from '../../../lib/claude-content'
import { claudeRoute, readJson } from '../../../lib/claude-http'

/**
 * Uploads one image (JPG, PNG, WebP or GIF, up to 5 MB) and returns its URL.
 * Either multipart form data (file, alt_text) or JSON with alt_text and one
 * of image_base64 (optionally a data: URL) or image_url (a public https image).
 */
export async function POST(request: Request) {
  return claudeRoute(request, true, async (actor) => {
    if ((request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
      const form = await request.formData().catch(() => null)
      const file = form?.get('file')
      if (!(file instanceof File)) throw new ArticleError('Send the image in a "file" form field.')
      return uploadImage(actor, { bytes: Buffer.from(await file.arrayBuffer()), type: file.type, filename: file.name, altText: String(form?.get('alt_text') ?? '') })
    }
    const body = await readJson(request)
    return uploadImage(actor, {
      base64: body.image_base64 ? String(body.image_base64) : undefined,
      filename: String(body.filename ?? ''),
      imageUrl: body.image_url ? String(body.image_url) : undefined,
      altText: String(body.alt_text ?? ''),
    })
  }, 201)
}
