import { publicOrigin } from '../../../lib/claude-store'
import { ARTICLES_SCOPE } from '../../../lib/oauth-core'

/** RFC 8414 metadata, served at /.well-known/oauth-authorization-server (see next.config.ts). */
export function GET() {
  const origin = publicOrigin()
  return Response.json({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    revocation_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: [ARTICLES_SCOPE],
    service_documentation: `${origin}/admin/claude`,
  }, { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600' } })
}
