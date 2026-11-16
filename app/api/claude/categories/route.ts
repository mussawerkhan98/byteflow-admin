import { listCategories } from '../../../lib/claude-articles'
import { claudeRoute } from '../../../lib/claude-http'

export async function GET(request: Request) {
  return claudeRoute(request, false, () => listCategories())
}
