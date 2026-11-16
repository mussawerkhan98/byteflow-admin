import { httpsProblem } from '../../lib/claude-http'
import { revokeToken } from '../../lib/claude-store'

/** RFC 7009: signs one token out. Always 200, so it can't be used to test whether a token exists. */
export async function POST(request: Request) {
  const insecure = httpsProblem(request)
  if (insecure) return insecure
  const type = request.headers.get('content-type') ?? ''
  const body = type.includes('application/json')
    ? await request.json().catch(() => ({})) as Record<string, unknown>
    : Object.fromEntries(new URLSearchParams(await request.text()))
  if (body.token) await revokeToken(String(body.token))
  return new Response(null, { status: 200, headers: { 'cache-control': 'no-store' } })
}
