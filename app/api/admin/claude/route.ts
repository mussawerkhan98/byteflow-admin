import { getCurrentAdminUser, isAdministrator } from '../../../lib/auth'
import { listActivity, logAdminRestore } from '../../../lib/claude-articles'
import { getClaudeAccount, listConnections, publicOrigin, resetClaudeAccount, revokeAllTokens, setClaudeAccountActive } from '../../../lib/claude-store'
import { listRevisions, restoreRevision } from '../../../lib/post-revisions'

/**
 * The Claude connector screen: the Claude account, connected Claude apps,
 * everything Claude has changed, and undo. Administrators only.
 */
const denied = () => Response.json({ error: 'Administrator access required' }, { status: 403 })
const noStore = { headers: { 'cache-control': 'no-store' } }

export async function GET(request: Request) {
  if (!(await isAdministrator())) return denied()
  const postId = Number(new URL(request.url).searchParams.get('revisions'))
  if (postId) return Response.json({ revisions: await listRevisions(postId) }, noStore)
  const [account, connections, activity] = await Promise.all([getClaudeAccount(), listConnections(), listActivity(150)])
  return Response.json({ account, connections, activity, mcpUrl: `${publicOrigin()}/mcp` }, noStore)
}

export async function POST(request: Request) {
  if (!(await isAdministrator())) return denied()
  try {
    const body = await request.json() as Record<string, unknown>
    if (body.action === 'reset-account') {
      const { account, password } = await resetClaudeAccount(String(body.email ?? ''))
      return Response.json({ account, password }, noStore)
    }
    if (body.action === 'set-active') {
      await setClaudeAccountActive(body.active === true)
      return Response.json({ ok: true })
    }
    if (body.action === 'disconnect-all') {
      await revokeAllTokens()
      return Response.json({ ok: true })
    }
    if (body.action === 'restore') {
      const revisionId = Number(body.revisionId)
      if (!revisionId) throw new Error('Choose a revision to restore')
      const user = await getCurrentAdminUser()
      const actor = user ? `${user.displayName} (admin panel)` : 'Admin panel'
      const restored = await restoreRevision(revisionId, actor)
      await logAdminRestore(actor, restored, revisionId)
      return Response.json({ ok: true, postId: restored.postId, title: restored.title })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    console.error('Claude connector admin action failed:', message || error)
    if (/not found|valid email|Choose a revision/i.test(message)) return Response.json({ error: message }, { status: 400 })
    return Response.json({ error: 'That did not work. Please try again.' }, { status: 500 })
  }
}
