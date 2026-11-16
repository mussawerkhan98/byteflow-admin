import { clientIp, httpsProblem } from '../../lib/claude-http'
import { registerClient } from '../../lib/claude-store'
import { allowedRedirectUri } from '../../lib/oauth-core'
import { createRateLimiter } from '../../lib/rate-limit'

/**
 * RFC 7591 dynamic client registration: Claude or Composio registers itself
 * here the first time the connector is added. Only their callbacks (and
 * loopback addresses for Claude Desktop / Claude Code) are accepted as
 * redirect URIs; see allowedRedirectUri.
 */
const limiter = createRateLimiter({ limit: 20, windowMs: 60 * 60_000 })
const METHODS = new Set(['none', 'client_secret_post', 'client_secret_basic'])

const fail = (description: string, status = 400) =>
  Response.json({ error: 'invalid_client_metadata', error_description: description }, { status, headers: { 'cache-control': 'no-store' } })

export async function POST(request: Request) {
  const insecure = httpsProblem(request)
  if (insecure) return insecure
  if (!limiter.hit(clientIp(request)).ok) return fail('Too many registrations. Try again later.', 429)
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return fail('The body must be JSON.') }
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : []
  if (!redirectUris.length || redirectUris.length > 10) return Response.json({ error: 'invalid_redirect_uri', error_description: 'Send one to ten redirect_uris.' }, { status: 400 })
  const refused = redirectUris.find((uri) => !allowedRedirectUri(uri))
  if (refused) {
    // Logged, so a new callback address from Claude or Composio shows up in the server log.
    console.warn('OAuth registration refused redirect URI:', refused)
    return Response.json({ error: 'invalid_redirect_uri', error_description: `This server only works with Claude and Composio; ${refused} is not allowed.` }, { status: 400 })
  }
  const method = String(body.token_endpoint_auth_method ?? 'client_secret_basic')
  if (!METHODS.has(method)) return fail(`token_endpoint_auth_method must be one of: ${[...METHODS].join(', ')}.`)
  const clientName = String(body.client_name ?? 'Claude').slice(0, 100)
  const { clientId, clientSecret } = await registerClient({ clientName, redirectUris, confidential: method !== 'none' })
  return Response.json({
    client_id: clientId,
    ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: method,
  }, { status: 201, headers: { 'cache-control': 'no-store' } })
}
