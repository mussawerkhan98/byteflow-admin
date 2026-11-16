import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { createDraft, getArticle, listArticles, listCategories, publishArticle, updateArticle, uploadImage } from '../lib/claude-articles'
import { countWrite, describeError, guard } from '../lib/claude-http'
import type { ClaudeActor } from '../lib/claude-store'

/**
 * The remote MCP server Claude connects to (Settings → Connectors → Add
 * custom connector → https://admin.byteflow.ae/mcp). Streamable HTTP,
 * stateless: each request is authenticated with its OAuth access token and
 * answered on its own, so nothing is kept between requests.
 *
 * The tools call the same functions as the /api/claude REST API.
 */

const INSTRUCTIONS = `Tools for the blog on byteflow.ae (Byteflow Information Technology, an IT company in Dubai).
- New articles are always saved as drafts. Publish only when the user explicitly asks you to publish that article.
- Content can be Markdown or HTML. Use H2 for main sections and H3 for points inside them; the title is already the page's H1.
- Every change is logged and saved in revision history, so the site owner can undo it in the admin panel.
- You cannot delete articles or change anything other than blog articles and images.`

const articleFields = {
  title: z.string().describe('Article title, shown as the page H1 (up to 200 characters).'),
  content: z.string().describe('The article body in Markdown or HTML. Use ## for main sections and ### for points inside them; do not repeat the title as an H1. For an FAQ, add a "Frequently asked questions" H2 with each question as an H3.'),
  content_format: z.enum(['markdown', 'html', 'auto']).optional().describe('Format of content. Default "auto" detects it.'),
  excerpt: z.string().optional().describe('Summary shown under the title and on blog cards (about 70–250 characters).'),
  category: z.string().optional().describe('Blog category. Prefer an existing one from list_categories.'),
  tags: z.array(z.string()).optional().describe('Keywords, e.g. ["backup", "Microsoft 365"]. Replaces the existing tags.'),
  author_name: z.string().optional().describe('"Written by" name. Leave out for "Byteflow team".'),
  featured_image_url: z.string().optional().describe('Cover image: a URL returned by upload_image (preferred) or an https:// image URL.'),
  featured_image_alt: z.string().optional().describe('Alt text for the cover image; required whenever there is a cover image.'),
  seo_title: z.string().optional().describe('Title for Google, ideally under 60 characters. Leave out to use the article title.'),
  seo_description: z.string().optional().describe('Description for Google, ideally 120–160 characters.'),
  slug: z.string().optional().describe('Web address after byteflow.ae/, lowercase words joined by hyphens. Made from the title when left out. Cannot change once published.'),
}

const id = z.number().int().positive().describe('The article id from list_articles.')

function buildServer(actor: ClaudeActor) {
  const server = new McpServer({ name: 'byteflow-articles', title: 'Byteflow blog', version: '1.0.0' }, { instructions: INSTRUCTIONS })

  const run = async (write: boolean, work: () => Promise<unknown>) => {
    try {
      if (write) countWrite(actor)
      const result = await work()
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    } catch (error) {
      return { content: [{ type: 'text' as const, text: describeError(error).message }], isError: true }
    }
  }

  server.registerTool('list_articles', {
    title: 'List articles',
    description: 'List blog articles on byteflow.ae, newest first, with their ids, status (draft or published), category, tags and summary. Filter by status, search text (title, summary, slug, tags) or category. 20 per page by default, up to 50.',
    inputSchema: {
      search: z.string().optional().describe('Text to look for in the title, summary, slug or tags.'),
      status: z.enum(['draft', 'published', 'all']).optional().describe('Default "all".'),
      category: z.string().optional().describe('Only articles in this category.'),
      page: z.number().int().positive().optional().describe('Page number, from 1.'),
      per_page: z.number().int().min(1).max(50).optional().describe('Articles per page, up to 50.'),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, (args) => run(false, () => listArticles({ search: args.search, status: args.status, category: args.category, page: args.page, perPage: args.per_page })))

  server.registerTool('get_article', {
    title: 'Get article',
    description: 'Get one article in full: its HTML content, summary, category, tags, cover image, SEO title and description, status and web address, plus anything the admin\'s SEO checklist flags (needs_attention).',
    inputSchema: { id },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, (args) => run(false, () => getArticle(args.id)))

  server.registerTool('create_draft_article', {
    title: 'Create draft article',
    description: 'Create a new blog article as a DRAFT. This never publishes: the article stays hidden from the website until publish_article is called. Returns the new article id.',
    inputSchema: articleFields,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, (args) => run(true, () => createDraft(actor, args)))

  server.registerTool('update_article', {
    title: 'Update article',
    description: 'Change an existing article, draft or published. Send only the fields to change. Editing a published article changes the live page straight away. Every edit is kept in revision history and can be undone in the admin panel.',
    inputSchema: { id, ...articleFields, title: articleFields.title.optional(), content: articleFields.content.optional() },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, ({ id: articleId, ...fields }) => run(true, () => updateArticle(actor, articleId, fields)))

  server.registerTool('publish_article', {
    title: 'Publish article',
    description: 'Publish a draft article so it appears on byteflow.ae. Only call this when the user has explicitly asked, in this conversation, to publish this article. Never publish on your own initiative.',
    inputSchema: { id },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, (args) => run(true, () => publishArticle(actor, args.id)))

  server.registerTool('list_categories', {
    title: 'List categories and tags',
    description: 'List the blog\'s categories and tags, with how many articles use each.',
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, () => run(false, () => listCategories()))

  server.registerTool('upload_image', {
    title: 'Upload image',
    description: 'Upload an image (JPG, PNG, WebP or GIF, up to 5 MB) to the website\'s media library. Returns a url to use as featured_image_url or inside article content. Send image_url (a public https image) or image_base64, and alt_text describing the picture. Images are converted to WebP.',
    inputSchema: {
      alt_text: z.string().describe('What the picture shows, for screen readers and Google.'),
      image_url: z.string().optional().describe('A public https:// address of the image to copy.'),
      image_base64: z.string().optional().describe('The image file as base64 (a data: URL is fine).'),
      filename: z.string().optional().describe('A file name, e.g. "server-room.jpg".'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, (args) => run(true, () => uploadImage(actor, { base64: args.image_base64, filename: args.filename, imageUrl: args.image_url, altText: args.alt_text })))

  return server
}

async function handle(request: Request) {
  const checked = await guard(request, { write: false })
  if ('response' in checked) return checked.response
  const server = buildServer(checked.actor)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    await server.close()
  }
}

export { handle as GET, handle as POST, handle as DELETE }
