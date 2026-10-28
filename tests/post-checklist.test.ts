import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  automaticReadTime,
  contentStats,
  effectiveSeoDescription,
  effectiveSeoTitle,
  fromDateInput,
  seoChecklist,
  type SeoCheck,
  slugFromTitle,
  toDateInput,
} from '../app/lib/post-checklist'

test('content stats count words, sections, stray H1s and FAQ questions', () => {
  const stats = contentStats(
    '<h1>Old title</h1><p>One two three.</p><h2>Why</h2><p>a</p><h2>How</h2>' +
      '<h2>Frequently asked questions</h2><h3>Is it fast?</h3><p>Yes.</p><h3>Is it cheap?</h3><p>Often.</p>',
  )
  assert.equal(stats.h1InContent, 1)
  // The content H1 is shown as an H2, so it is a section too.
  assert.equal(stats.sections, 4)
  assert.equal(stats.faqQuestions, 2)
})

test('FAQ questions written as bold paragraphs are counted', () => {
  const stats = contentStats(
    '<h2>FAQs</h2><p><strong>What is AMC?</strong></p><p>A contract.</p>' +
      '<p><strong>How much?</strong><br>It depends.</p><p><strong>Not a question</strong></p>',
  )
  assert.equal(stats.faqQuestions, 2)
})

test('FAQ counting stops at the next H2', () => {
  const stats = contentStats('<h2>FAQ</h2><h3>One?</h3><p>a</p><h2>Contact</h2><h3>Call us?</h3>')
  assert.equal(stats.faqQuestions, 1)
})

test('SEO title and description fall back the way the website does', () => {
  assert.equal(effectiveSeoTitle({ title: 'IT AMC' }), 'IT AMC | Byteflow Blog')
  assert.equal(effectiveSeoTitle({ title: 'IT AMC', meta_title: 'Custom' }), 'Custom')
  assert.equal(effectiveSeoDescription({ excerpt: 'Summary' }), 'Summary')
  assert.equal(effectiveSeoDescription({ excerpt: 'Summary', meta_description: 'Meta' }), 'Meta')
})

const words2 = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')
const good = {
  id: 7,
  title: 'New office IT setup in Dubai',
  slug: 'new-office-it-setup-dubai',
  excerpt: 'A checklist.',
  meta_title: 'New Office IT Setup in Dubai | Byteflow',
  meta_description: 'x'.repeat(140),
  image_url: '/api/media/1',
  image_alt: 'Engineer at a network rack',
  author_name: 'Sara Khan',
  content:
    '<p>Planning a new office IT setup in Dubai starts before the fit-out, with cabling and internet.</p>' +
    `<h2>Before</h2><p>${words2(200)} See our <a href="/it-amc-services-dubai">IT AMC services</a>.</p>` +
    '<h3>Cabling</h3><p>Detail.</p><h2>FAQs</h2><h3>How long?</h3><p>Six weeks.</p>',
}
const byKey = (checks: SeoCheck[], key: string): SeoCheck => {
  const check = checks.find((c) => c.key === key)
  assert.ok(check, `no check called ${key}`)
  return check
}

test('a well-prepared post passes every automatic check', () => {
  const { checks, counts } = seoChecklist(good, {
    focusKeyword: 'new office IT setup',
    otherPosts: [{ id: 1, title: 'Other', slug: 'other', meta_description: 'Different' }],
  })
  const notPassed = checks.filter((c) => c.status !== 'passed').map((c) => c.key)
  // Only the two checks a program cannot decide stay optional.
  assert.deepEqual(notPassed, ['helpful', 'length'])
  assert.equal(counts.attention, 0)
})

test('the checklist never requires a word count, three H2s, an FAQ or an exact length', () => {
  const short = seoChecklist({ ...good, content: '<p>New office IT setup in Dubai: a short note.</p>' })
  // Length is an indicator only, whatever the count.
  assert.equal(byKey(short.checks, 'length').status, 'optional')
  // A short post with no subheadings is fine.
  assert.equal(byKey(short.checks, 'headings').status, 'passed')
  // No FAQ is optional, never a problem.
  assert.equal(byKey(short.checks, 'faq').status, 'optional')
  // An off-guideline description is a recommendation, not a missing field.
  const desc = byKey(seoChecklist({ ...good, meta_description: 'Too short' }).checks, 'meta-description')
  assert.equal(desc.status, 'attention')
  assert.equal(desc.kind, 'recommendation')
  assert.match(desc.detail, /no fixed length/)
})

test('an unwritten description is a recommendation when the article exists', () => {
  const desc = byKey(seoChecklist({ ...good, meta_description: '', excerpt: '' }).checks, 'meta-description')
  assert.equal(desc.status, 'attention')
  assert.equal(desc.kind, 'recommendation')
  assert.match(desc.detail, /opening lines/)
})

test('missing fields are reported as missing, not as recommendations', () => {
  const { checks } = seoChecklist({})
  for (const key of ['seo-title', 'slug', 'meta-description', 'h1', 'length']) {
    assert.equal(byKey(checks, key).status, 'attention', key)
    assert.equal(byKey(checks, key).kind, 'missing', key)
  }
})

test('the SEO title falls back to the post title and flags long ones', () => {
  const auto = byKey(seoChecklist({ ...good, meta_title: '' }).checks, 'seo-title')
  assert.equal(auto.status, 'passed')
  assert.match(auto.detail, /automatic/)
  const long = byKey(seoChecklist({ ...good, meta_title: 'x'.repeat(70) }).checks, 'seo-title')
  assert.equal(long.status, 'attention')
  assert.equal(long.kind, 'recommendation')
})

test('slugs must be valid and should relate to the title', () => {
  assert.equal(byKey(seoChecklist({ ...good, slug: 'Bad Slug' }).checks, 'slug').kind, 'missing')
  assert.equal(byKey(seoChecklist({ ...good, slug: 'post-123' }).checks, 'slug').status, 'attention')
})

test('an extra H1 in the article needs attention', () => {
  const h1 = byKey(seoChecklist({ ...good, content: '<h1>Another</h1>' + good.content }).checks, 'h1')
  assert.equal(h1.status, 'attention')
})

test('the keyword check is optional until a keyword is typed, then checks title, intro and stuffing', () => {
  assert.equal(byKey(seoChecklist(good).checks, 'keyword').status, 'optional')
  const absent = byKey(seoChecklist(good, { focusKeyword: 'cloud backup' }).checks, 'keyword')
  assert.equal(absent.status, 'attention')
  assert.match(absent.detail, /title or first paragraph/)
  const stuffed = seoChecklist(
    { ...good, content: '<p>cloud backup</p>' + '<p>cloud backup cloud backup</p>'.repeat(5), title: 'Cloud backup' },
    { focusKeyword: 'cloud backup' },
  )
  assert.match(byKey(stuffed.checks, 'keyword').detail, /stuffing/)
})

test('headings that skip a level need attention; a long article without any does too', () => {
  assert.equal(byKey(seoChecklist({ ...good, content: '<p>x</p><h3>Sub</h3>' }).checks, 'headings').status, 'attention')
  assert.equal(byKey(seoChecklist({ ...good, content: `<p>${words2(400)}</p>` }).checks, 'headings').status, 'attention')
})

test('images: missing alt and pasted data images need attention; no image is optional', () => {
  assert.equal(byKey(seoChecklist({ ...good, image_alt: '' }).checks, 'images').status, 'attention')
  assert.equal(byKey(seoChecklist({ ...good, image_url: 'data:image/png;base64,AAAA' }).checks, 'images').status, 'attention')
  assert.equal(byKey(seoChecklist({ ...good, image_url: '', image_alt: '' }).checks, 'images').status, 'optional')
})

test('internal links are needed, with descriptive anchor text', () => {
  const none = seoChecklist({ ...good, content: '<p>No links. <a href="https://example.com">Example docs</a></p>' })
  assert.equal(byKey(none.checks, 'links').status, 'attention')
  const vague = seoChecklist({ ...good, content: good.content + '<p><a href="/contact-us">click here</a></p>' })
  assert.match(byKey(vague.checks, 'links').detail, /vague/)
  const absolute = seoChecklist({ ...good, content: '<p><a href="https://www.byteflow.ae/cloud-services-dubai">cloud services</a></p>' })
  assert.equal(byKey(absolute.checks, 'links').status, 'passed')
})

test('an FAQ heading with no questions needs attention', () => {
  const faq = byKey(seoChecklist({ ...good, content: '<h2>FAQs</h2><p>Call us.</p>' }).checks, 'faq')
  assert.equal(faq.status, 'attention')
})

test('no author name is optional, because the Byteflow team byline shows', () => {
  assert.equal(byKey(seoChecklist({ ...good, author_name: '' }).checks, 'author').status, 'optional')
})

test('duplicates are found across other posts, ignoring the post itself', () => {
  const self = seoChecklist(good, { otherPosts: [{ ...good }] })
  assert.equal(byKey(self.checks, 'unique').status, 'optional')
  const dup = seoChecklist(good, {
    otherPosts: [{ id: 9, title: 'X', slug: 'new-office-it-setup-dubai', meta_title: good.meta_title.toUpperCase(), meta_description: good.meta_description }],
  })
  const unique = byKey(dup.checks, 'unique')
  assert.equal(unique.status, 'attention')
  assert.equal(unique.kind, 'missing')
  assert.match(unique.detail, /SEO title, description, page address/)
  const descOnly = seoChecklist({ ...good, meta_description: '' }, { otherPosts: [{ id: 2, title: 'Y', slug: 'y', excerpt: 'A checklist.' }] })
  assert.equal(byKey(descOnly.checks, 'unique').kind, 'recommendation')
})

test('slugs, read time and dates', () => {
  assert.equal(slugFromTitle('New Office IT Setup in Dubai: Before & After?'), 'new-office-it-setup-in-dubai-before-and-after')
  assert.equal(automaticReadTime(0), '1 min read')
  assert.equal(automaticReadTime(1935), '9 min read')
  assert.equal(toDateInput('Oct 4, 2026'), '2026-10-04')
  assert.equal(toDateInput('2025-05-16 18:22:24'), '2025-05-16')
  assert.equal(toDateInput('soon'), '')
  assert.equal(fromDateInput('2026-10-04'), 'Oct 4, 2026')
  assert.equal(fromDateInput(''), '')
})
