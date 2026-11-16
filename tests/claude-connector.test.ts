import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { ArticleError, articleColumns, articleHtml, changedColumns, detectFormat, normalizeTags, parseTags, slugify } from '../app/lib/claude-content'
import { allowedRedirectUri, pkceChallenge, signForm, verifyForm, verifyPkce } from '../app/lib/oauth-core'
import { createRateLimiter } from '../app/lib/rate-limit'

// ── Content ──────────────────────────────────────────────────────────────────

test('Markdown becomes the website HTML; HTML is detected and kept', () => {
  assert.equal(detectFormat('## Heading\n\nText'), 'markdown')
  assert.equal(detectFormat('<p>Text</p>'), 'html')
  assert.equal(detectFormat('## Heading\n\nText with <img src="/a.png" alt="a"> inline'), 'markdown')
  const html = articleHtml('## Why backups\n\nKeep **three** copies.\n\n- one\n- two')
  assert.match(html, /<h2[^>]*>Why backups<\/h2>/)
  assert.match(html, /<strong>three<\/strong>/)
  assert.match(html, /<li>one<\/li>/)
})

test('scripts, event handlers and javascript: links are removed (XSS)', () => {
  const html = articleHtml('<p onclick="alert(1)">Hi <a href="javascript:alert(1)">link</a></p><script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://evil.example"></iframe>', 'html')
  assert.doesNotMatch(html, /script|onclick|onerror|javascript:|iframe/i)
  assert.match(html, /Hi/)
  const fromMarkdown = articleHtml('Hello <script>alert(1)</script> [x](javascript:alert(1))', 'markdown')
  assert.doesNotMatch(fromMarkdown, /script|javascript:/i)
})

test('create needs a title and content; update changes only what is sent', () => {
  assert.throws(() => articleColumns({ content: 'Body' }, { creating: true }), /Title is required/)
  assert.throws(() => articleColumns({ title: 'T' }, { creating: true }), /Content is required/)
  const created = articleColumns({ title: '  IT  checklist ', content: 'Body', seo_title: 'SEO', featured_image_url: '/api/media/12', featured_image_alt: 'Server rack' }, { creating: true })
  assert.equal(created.title, 'IT checklist')
  assert.equal(created.meta_title, 'SEO')
  assert.equal(created.image_url, '/api/media/12')
  assert.deepEqual(Object.keys(articleColumns({ excerpt: 'New summary' }, { creating: false })), ['excerpt'])
})

test('fields Claude may not set are ignored, and bad values are explained', () => {
  const columns = articleColumns({ title: 'T', content: 'B', published: 1, id: 5 } as never, { creating: true })
  assert.equal('published' in columns, false)
  assert.equal('id' in columns, false)
  assert.throws(() => articleColumns({ slug: 'Not A Slug' }, { creating: false }), /lowercase letters/)
  assert.throws(() => articleColumns({ title: 'x'.repeat(201) }, { creating: false }), /200 characters/)
  assert.throws(() => articleColumns({ featured_image_url: 'javascript:alert(1)', featured_image_alt: 'a' }, { creating: false }), /https/)
  assert.throws(() => articleColumns({ content: '<script>x</script>' }, { creating: false }), /empty after cleaning/)
  assert.throws(() => articleColumns({ title: 5 } as never, { creating: false }), ArticleError)
})

test('a featured image needs alt text, counting what the post already has', () => {
  assert.throws(() => articleColumns({ featured_image_url: 'https://example.com/a.jpg' }, { creating: false }), /alt text is required/)
  assert.doesNotThrow(() => articleColumns({ featured_image_url: 'https://example.com/a.jpg' }, { creating: false, current: { image_alt: 'Office' } }))
})

test('tags: deduplicated, trimmed, stored as "a, b"', () => {
  assert.equal(normalizeTags(['Backup', ' backup ', 'Microsoft 365', '']), 'Backup, Microsoft 365')
  assert.equal(normalizeTags('a,b , c'), 'a, b, c')
  assert.deepEqual(parseTags('a, b,,c'), ['a', 'b', 'c'])
  assert.throws(() => normalizeTags(Array.from({ length: 21 }, (_, i) => `t${i}`)), /at most 20/)
})

test('slugs and changed columns', () => {
  assert.equal(slugify('IT Support & Backups: A 2026 Guide!'), 'it-support-and-backups-a-2026-guide')
  assert.equal(slugify('Café réseau'), 'cafe-reseau')
  assert.deepEqual(changedColumns({ title: 'A', excerpt: 'x' }, { title: 'A', excerpt: 'y' }), ['excerpt'])
})

// ── OAuth ────────────────────────────────────────────────────────────────────

test('PKCE S256: the matching verifier passes, anything else fails', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const challenge = pkceChallenge(verifier)
  assert.equal(challenge, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM') // RFC 7636 appendix B
  assert.equal(verifyPkce(verifier, challenge), true)
  assert.equal(verifyPkce(`${verifier}x`, challenge), false)
  assert.equal(verifyPkce('short', pkceChallenge('short')), false)
  assert.equal(verifyPkce(verifier, ''), false)
})

test('only Claude callbacks and loopback addresses may receive codes', () => {
  assert.equal(allowedRedirectUri('https://claude.ai/api/mcp/auth_callback'), true)
  assert.equal(allowedRedirectUri('https://claude.com/api/mcp/auth_callback'), true)
  assert.equal(allowedRedirectUri('http://localhost:6274/oauth/callback'), true)
  assert.equal(allowedRedirectUri('http://127.0.0.1:33418/callback'), true)
  assert.equal(allowedRedirectUri('https://backend.composio.dev/api/v3/toolkits/auth/callback'), true)
  assert.equal(allowedRedirectUri('https://backend.composio.dev/api/v3.1/toolkits/auth/callback'), true)
  assert.equal(allowedRedirectUri('https://backend.composio.dev/api/v3/toolkits/callback'), true)
  assert.equal(allowedRedirectUri('https://backend.composio.dev/somewhere-else'), true)
  assert.equal(allowedRedirectUri('https://composio.dev/callback'), true)
  assert.equal(allowedRedirectUri('https://connect.composio.dev/link/callback?x=1'), true)
  assert.equal(allowedRedirectUri('http://backend.composio.dev/api/v3/toolkits/auth/callback'), false)
  assert.equal(allowedRedirectUri('https://composio.dev.evil.com/callback'), false)
  assert.equal(allowedRedirectUri('https://evilcomposio.dev/callback'), false)
  assert.equal(allowedRedirectUri('https://composio.dev:8443/callback'), false)
  assert.equal(allowedRedirectUri('https://evil.example/callback'), false)
  assert.equal(allowedRedirectUri('https://claude.ai.evil.example/cb'), false)
  assert.equal(allowedRedirectUri('https://claude.ai/somewhere-else'), false)
  assert.equal(allowedRedirectUri('http://claude.ai/api/mcp/auth_callback'), false)
  assert.equal(allowedRedirectUri('https://claude.ai:8443/api/mcp/auth_callback'), false)
  assert.equal(allowedRedirectUri('https://user@claude.ai/api/mcp/auth_callback'), false)
  assert.equal(allowedRedirectUri('javascript:alert(1)'), false)
})

test('the sign-in form signature covers every parameter and expires', () => {
  const params = { client_id: 'c1', redirect_uri: 'https://claude.ai/api/mcp/auth_callback', state: 's', code_challenge: 'x' }
  const now = Date.now()
  const signature = signForm('a'.repeat(32), params, Math.floor(now / 1000) + 60)
  assert.equal(verifyForm('a'.repeat(32), params, signature, now), true)
  assert.equal(verifyForm('a'.repeat(32), { ...params, redirect_uri: 'http://localhost/x' }, signature, now), false)
  assert.equal(verifyForm('b'.repeat(32), params, signature, now), false)
  assert.equal(verifyForm('a'.repeat(32), params, signature, now + 120_000), false)
})

test('rate limiter: allows the limit, then refuses until the window ends', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
  assert.equal(limiter.hit('k', 0).ok, true)
  assert.equal(limiter.hit('k', 10).ok, true)
  const third = limiter.hit('k', 20)
  assert.equal(third.ok, false)
  assert.equal(third.retryAfter, 1)
  assert.equal(limiter.hit('other', 20).ok, true)
  assert.equal(limiter.hit('k', 1000).ok, true)
})
