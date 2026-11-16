import { clientIp, httpsProblem } from '../../lib/claude-http'
import { authenticateClaudeAccount, createAuthorizationCode, getClient, publicOrigin, type OAuthClient } from '../../lib/claude-store'
import { signForm, verifyForm } from '../../lib/oauth-core'
import { createRateLimiter } from '../../lib/rate-limit'

/**
 * The page Claude opens when the connector is added: sign in with the Claude
 * account and approve access. On approval the browser goes back to Claude
 * with a one-time code (PKCE S256 required), which /oauth/token exchanges.
 */

const attempts = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 })
const FORM_SECONDS = 15 * 60
const PARAMS = ['client_id', 'redirect_uri', 'state', 'code_challenge', 'code_challenge_method', 'scope', 'resource'] as const

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
  return value
}

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
  'referrer-policy': 'no-referrer',
}

function page(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Connect Claude · Byteflow admin</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:#f4f7fb;color:#0f172a;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:100%;max-width:420px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
h1{font-size:21px;margin:0 0 6px}p{margin:0 0 14px;color:#475569}ul{margin:0 0 18px;padding-left:20px;color:#334155}li{margin:4px 0}
label{display:block;font-size:13px;font-weight:600;margin:12px 0 6px}input{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}
input:focus{outline:2px solid #0891b2;border-color:#0891b2}.row{display:flex;gap:10px;margin-top:20px}
button{flex:1;padding:11px 14px;border-radius:10px;font:inherit;font-weight:700;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#0f172a}
button.allow{background:#0e7490;border-color:#0e7490;color:#fff}.error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:10px 12px;border-radius:10px}
.small{font-size:12px;color:#64748b;margin-top:16px}</style></head><body><main>${body}</main></body></html>`, { status, headers: HEADERS })
}

const problem = (message: string, status = 400) => page(`<h1>Can't connect Claude</h1><p class="error">${escape(message)}</p><p class="small">Start again from Claude: Settings → Connectors.</p>`, status)

function backToClient(redirectUri: string, values: Record<string, string>) {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value)
  return new Response(null, { status: 303, headers: { location: url.toString(), 'cache-control': 'no-store' } })
}

type Checked = { client: OAuthClient; params: Record<string, string> } | { response: Response }

/** The request's parameters, checked. Problems before the redirect address is trusted are shown here, not sent back. */
async function check(source: URLSearchParams | FormData): Promise<Checked> {
  const params = Object.fromEntries(PARAMS.map((key) => [key, String(source.get(key) ?? '')])) as Record<string, string>
  const client = params.client_id ? await getClient(params.client_id) : null
  if (!client) return { response: problem('This connection request is not from a registered Claude app.') }
  if (!params.redirect_uri && client.redirectUris.length === 1) params.redirect_uri = client.redirectUris[0]
  if (!client.redirectUris.includes(params.redirect_uri)) return { response: problem('The return address in this request does not match the Claude app that registered.') }
  const responseType = source.get('response_type')
  if (responseType !== null && responseType !== 'code') return { response: backToClient(params.redirect_uri, { error: 'unsupported_response_type', state: params.state }) }
  if (!params.code_challenge || params.code_challenge_method !== 'S256')
    return { response: backToClient(params.redirect_uri, { error: 'invalid_request', error_description: 'PKCE with S256 is required.', state: params.state }) }
  return { client, params }
}

function form(client: OAuthClient, params: Record<string, string>, error = '', email = '') {
  const signature = signForm(secret(), params, Math.floor(Date.now() / 1000) + FORM_SECONDS)
  const hidden = PARAMS.map((key) => `<input type="hidden" name="${key}" value="${escape(params[key])}">`).join('')
  return page(`<h1>Connect ${escape(client.clientName)} to Byteflow</h1>
<p>Sign in with the <strong>Claude account</strong> (not your own admin login) to let Claude:</p>
<ul><li>read all blog articles</li><li>create drafts and edit articles</li><li>publish an article when you ask it to</li><li>upload images for articles</li></ul>
<p>It cannot delete anything or change any other part of the website. Every change is logged and can be undone under <strong>Claude connector</strong> in the admin panel.</p>
${error ? `<p class="error" role="alert">${escape(error)}</p>` : ''}
<form method="post" action="/oauth/authorize">${hidden}<input type="hidden" name="signature" value="${escape(signature)}">
<label for="email">Claude account email</label><input id="email" name="email" type="email" autocomplete="username" required value="${escape(email)}">
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required>
<div class="row"><button type="submit" name="decision" value="deny" formnovalidate>Cancel</button><button class="allow" type="submit" name="decision" value="allow">Allow access</button></div>
</form><p class="small">${escape(new URL(publicOrigin()).host)}</p>`)
}

export async function GET(request: Request) {
  const insecure = httpsProblem(request)
  if (insecure) return insecure
  const checked = await check(new URL(request.url).searchParams)
  if ('response' in checked) return checked.response
  return form(checked.client, checked.params)
}

export async function POST(request: Request) {
  const insecure = httpsProblem(request)
  if (insecure) return insecure
  const data = await request.formData().catch(() => null)
  if (!data) return problem('The form did not arrive. Try again from Claude.')
  const checked = await check(data)
  if ('response' in checked) return checked.response
  const { client, params } = checked
  if (!verifyForm(secret(), params, String(data.get('signature') ?? ''))) return problem('This sign-in page has expired. Start again from Claude.')
  if (data.get('decision') !== 'allow') return backToClient(params.redirect_uri, { error: 'access_denied', state: params.state })
  if (!attempts.hit(clientIp(request)).ok) return form(client, params, 'Too many sign-in attempts. Wait 15 minutes and try again.')
  const email = String(data.get('email') ?? '')
  const account = await authenticateClaudeAccount(email, String(data.get('password') ?? ''))
  if (!account) return form(client, params, 'That email and password do not match the Claude account.', email)
  const code = await createAuthorizationCode({
    clientId: client.clientId, accountId: account.id, redirectUri: params.redirect_uri, codeChallenge: params.code_challenge, resource: params.resource,
  })
  return backToClient(params.redirect_uri, { code, state: params.state, iss: publicOrigin() })
}
