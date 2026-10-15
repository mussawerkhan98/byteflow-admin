import { mediaAsset } from '../../../lib/media'

/**
 * The same media route the website serves, so an image referenced as
 * /api/media/<id> resolves on the admin domain too — that is what the
 * preview beside an upload field loads.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const asset = await mediaAsset(Number(id))
  if (!asset) return new Response('Not found', { status: 404 })

  return new Response(asset.bytes as BodyInit, {
    headers: {
      'content-type': asset.mime,
      'cache-control': 'public, max-age=31536000, immutable',
      'content-length': String(asset.bytes.byteLength),
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'x-content-type-options': 'nosniff',
    },
  })
}
