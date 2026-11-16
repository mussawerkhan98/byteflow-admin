import { createDraft, listArticles } from '../../../lib/claude-articles'
import { claudeRoute, readJson } from '../../../lib/claude-http'

/** GET ?search=&status=draft|published|all&category=&page=&per_page= */
export async function GET(request: Request) {
  return claudeRoute(request, false, async () => {
    const query = new URL(request.url).searchParams
    return listArticles({
      search: query.get('search') ?? undefined,
      status: query.get('status') ?? undefined,
      category: query.get('category') ?? undefined,
      page: Number(query.get('page') ?? 1) || 1,
      perPage: Number(query.get('per_page') ?? 20) || 20,
    })
  })
}

/** Creates a draft. Whatever the body says, the article is not published. */
export async function POST(request: Request) {
  return claudeRoute(request, true, async (actor) => createDraft(actor, await readJson(request)), 201)
}
