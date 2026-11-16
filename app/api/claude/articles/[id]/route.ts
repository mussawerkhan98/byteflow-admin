import { getArticle, updateArticle } from '../../../../lib/claude-articles'
import { claudeRoute, idParam, readJson } from '../../../../lib/claude-http'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  return claudeRoute(request, false, async () => getArticle(await idParam(context)))
}

/** Changes only the fields sent: title, content, excerpt, category, tags, featured image, SEO title/description. */
export async function PUT(request: Request, context: Context) {
  return claudeRoute(request, true, async (actor) => updateArticle(actor, await idParam(context), await readJson(request)))
}
