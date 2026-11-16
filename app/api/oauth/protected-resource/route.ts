import { publicOrigin } from '../../../lib/claude-store'
import { ARTICLES_SCOPE } from '../../../lib/oauth-core'

/** RFC 9728 metadata for the /mcp server, served at /.well-known/oauth-protected-resource[/mcp] (see next.config.ts). */
export function GET() {
  const origin = publicOrigin()
  return Response.json({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: [ARTICLES_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Byteflow blog articles',
  }, { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600' } })
}
