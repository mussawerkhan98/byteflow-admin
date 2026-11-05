import { isAdminAuthenticated } from '../../../lib/auth'
import { processUpload } from '../../../lib/image-pipeline'
import { UploadError, type UploadKind } from '../../../lib/image-rules'

/**
 * The one upload route for every image field in the admin (the shared
 * ImageUpload field, the post editor's inline images, …). A route rather than
 * a Server Action, so the 1 MB Server Action body limit doesn't apply; files
 * up to 5 MB are accepted (see app/lib/image-rules.ts).
 *
 * Form fields: file, kind (image | logo | icon | og | favicon; image when
 * left out), altText, decorative ("1").
 */
const KINDS = new Set<UploadKind>(['image', 'logo', 'icon', 'og', 'favicon'])

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Your session has ended. Sign in again, then upload.' }, { status: 401 })
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'The upload did not arrive in one piece. Try again; files must be under 5 MB.' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload.' }, { status: 400 })
  const requested = String(form.get('kind') ?? '') as UploadKind
  const kind: UploadKind = KINDS.has(requested) ? requested : 'image'
  try {
    const result = await processUpload({
      kind,
      file,
      alt: String(form.get('altText') ?? ''),
      decorative: form.get('decorative') === '1',
    })
    return Response.json({ ...result, altText: result.alt }, { status: 201 })
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: error.status })
    console.error('Image upload failed:', error)
    return Response.json({ error: 'The image could not be saved. Please try again.' }, { status: 500 })
  }
}
