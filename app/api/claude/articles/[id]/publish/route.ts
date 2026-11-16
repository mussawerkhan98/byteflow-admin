import { publishArticle } from '../../../../../lib/claude-articles'
import { claudeRoute, idParam } from '../../../../../lib/claude-http'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return claudeRoute(request, true, async (actor) => publishArticle(actor, await idParam(context)))
}
