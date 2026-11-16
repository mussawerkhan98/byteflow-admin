import 'server-only'
import { ArticleError } from './claude-content'
import { authenticateAccessToken, publicOrigin, type ClaudeActor } from './claude-store'
import { createRateLimiter } from './rate-limit'

/**
 * The checks every Claude connector request passes before it reaches an
 * article: HTTPS, a valid OAuth access token, and the rate limits. Errors go
 * back as { error } with a sentence Claude can act on.
 */

const requests = createRateLimiter({ limit: 120, windowMs: 60_000 })
const writes = createRateLimiter({ limit: 30, windowMs: 60_000 })

export function clientIp(request: Request) {
  return (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '').trim()
}

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })

/** In production, a request the proxy says arrived over plain HTTP is refused. */
export function httpsProblem(request: Request): Response | null {
  if (process.env.NODE_ENV !== 'production') return null
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
  return proto && proto !== 'https' ? json({ error: 'HTTPS is required. Use https://.' }, 403) : null
}

export const resourceMetadataUrl = () => `${publicOrigin()}/.well-known/oauth-protected-resource/mcp`

export function unauthorized(message = 'Sign-in required: connect Claude to the Byteflow admin again.') {
  return json({ error: message }, 401, {
    'www-authenticate': `Bearer realm="byteflow-admin", error="invalid_token", error_description="${message.replace(/"/g, "'")}", resource_metadata="${resourceMetadataUrl()}"`,
  })
}

export type Guarded = { actor: ClaudeActor } | { response: Response }

export async function guard(request: Request, { write }: { write: boolean }): Promise<Guarded> {
  const insecure = httpsProblem(request)
  if (insecure) return { response: insecure }
  const header = request.headers.get('authorization') ?? ''
  const token = /^Bearer\s+(\S+)$/i.exec(header)?.[1] ?? ''
  const actor = token ? await authenticateAccessToken(token, clientIp(request)) : null
  if (!actor) return { response: unauthorized(token ? 'The access token is invalid or has expired. Reconnect Claude to the Byteflow admin.' : undefined) }
  const limit = requests.hit(actor.clientId)
  if (!limit.ok) {
    return { response: json({ error: `Too many requests. Wait ${limit.retryAfter} seconds and try again.` }, 429, { 'retry-after': String(limit.retryAfter) }) }
  }
  if (write) {
    try { countWrite(actor) } catch (error) { return { response: json({ error: describeError(error).message }, 429) } }
  }
  return { actor }
}

/** Changes have a tighter limit than reads: 30 a minute per connected Claude. */
export function countWrite(actor: ClaudeActor) {
  const limit = writes.hit(actor.clientId)
  if (!limit.ok) throw new ArticleError(`Too many changes in a short time. Wait ${limit.retryAfter} seconds and try again.`, 429)
}

/** The message and status for an error, logging anything unexpected. */
export function describeError(error: unknown): { message: string; status: number } {
  if (error instanceof ArticleError) return { message: error.message, status: error.status }
  console.error('Claude connector error:', error)
  return { message: 'Something went wrong on the Byteflow server. Try again in a moment.', status: 500 }
}

/** Runs one REST handler behind the guard. */
export async function claudeRoute(request: Request, write: boolean, handler: (actor: ClaudeActor) => Promise<unknown>, okStatus = 200) {
  const checked = await guard(request, { write })
  if ('response' in checked) return checked.response
  try {
    return json(await handler(checked.actor), okStatus)
  } catch (error) {
    const { message, status } = describeError(error)
    return json({ error: message }, status)
  }
}

/** A JSON body, or an ArticleError Claude can read. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch { /* fall through */ }
  throw new ArticleError('The request body must be a JSON object.')
}

export const idParam = async (context: { params: Promise<{ id: string }> }) => {
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ArticleError('Article id must be a positive whole number.')
  return id
}
