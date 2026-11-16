import { clientIp, httpsProblem } from '../../lib/claude-http'
import { consumeAuthorizationCode, getClient, issueTokens, rotateRefreshToken, type OAuthClient } from '../../lib/claude-store'
import { allowedRedirectUri, sha256, verifyPkce } from '../../lib/oauth-core'
import { createRateLimiter } from '../../lib/rate-limit'

/** OAuth token endpoint: authorization_code (with PKCE) and refresh_token grants. */
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 })

const reply = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', pragma: 'no-cache' } })
const oauthError = (error: string, description: string, status = 400) => reply({ error, error_description: description }, status)

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? ''
  if (type.includes('application/json')) {
    const json = await request.json().catch(() => ({}))
    return Object.fromEntries(Object.entries(json ?? {}).map(([key, value]) => [key, String(value)]))
  }
  return Object.fromEntries(new URLSearchParams(await request.text()))
}

/** The client and whether its credentials check out (Basic header or body; none for public clients). */
async function authenticateClient(request: Request, body: Record<string, string>): Promise<OAuthClient | null> {
  let clientId = body.client_id ?? '', clientSecret = body.client_secret ?? ''
  const basic = /^Basic\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')
  if (basic) {
    const [id, secret = ''] = Buffer.from(basic[1], 'base64').toString().split(':')
    clientId = decodeURIComponent(id)
    clientSecret = decodeURIComponent(secret)
  }
  const client = clientId ? await getClient(clientId) : null
  if (!client) return null
  if (client.secretHash && sha256(clientSecret) !== client.secretHash) return null
  return client
}

export async function POST(request: Request) {
  const insecure = httpsProblem(request)
  if (insecure) return insecure
  if (!limiter.hit(clientIp(request)).ok) return oauthError('slow_down', 'Too many requests. Wait a minute.', 429)
  const body = await readBody(request)
  const client = await authenticateClient(request, body)
  if (!client) return oauthError('invalid_client', 'Unknown client or wrong client secret.', 401)

  if (body.grant_type === 'authorization_code') {
    const code = await consumeAuthorizationCode(body.code ?? '')
    if (!code || code.clientId !== client.clientId) return oauthError('invalid_grant', 'The authorization code is invalid, expired or already used.')
    if (body.redirect_uri && body.redirect_uri !== code.redirectUri) return oauthError('invalid_grant', 'redirect_uri does not match the authorization request.')
    if (!allowedRedirectUri(code.redirectUri)) return oauthError('invalid_grant', 'This return address is no longer allowed. Connect again.')
    if (!verifyPkce(body.code_verifier ?? '', code.codeChallenge)) return oauthError('invalid_grant', 'code_verifier does not match the code challenge.')
    const tokens = await issueTokens({ clientId: client.clientId, accountId: code.accountId, scope: code.scope, resource: code.resource })
    return reply({ access_token: tokens.accessToken, token_type: 'Bearer', expires_in: tokens.expiresIn, refresh_token: tokens.refreshToken, scope: tokens.scope })
  }

  if (body.grant_type === 'refresh_token') {
    const tokens = await rotateRefreshToken(body.refresh_token ?? '', client.clientId)
    if (!tokens) return oauthError('invalid_grant', 'The refresh token is invalid, expired or revoked. Connect Claude again.')
    return reply({ access_token: tokens.accessToken, token_type: 'Bearer', expires_in: tokens.expiresIn, refresh_token: tokens.refreshToken, scope: tokens.scope })
  }

  return oauthError('unsupported_grant_type', 'grant_type must be authorization_code or refresh_token.')
}
