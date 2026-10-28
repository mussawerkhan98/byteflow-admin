import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  automaticReadTime,
  contentStats,
  effectiveSeoDescription,
  effectiveSeoTitle,
  fromDateInput,
  postChecklist,
  slugFromTitle,
  toDateInput,
} from '../app/lib/post-checklist'

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')

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

test('a complete post ticks every item', () => {
  const content =
    `<h2>One</h2><p>${words(300)}</p><h2>Two</h2><p>${words(300)}</p>` +
    '<h2>Frequently asked questions</h2><h3>A?</h3><p>a</p><h3>B?</h3><p>b</p><h3>C?</h3><p>c</p>'
  const result = postChecklist({
    title: 'New office IT setup',
    slug: 'new-office-it-setup',
    excerpt: 'A stage-by-stage checklist for cabling, internet, Wi-Fi and security for a new Dubai office.',
    image_url: '/api/media/1',
    image_alt: 'Engineer at a network rack',
    content,
    meta_title: 'New Office IT Setup in Dubai | Byteflow',
    meta_description: 'x'.repeat(140),
  })
  assert.deepEqual(result.items.filter((item) => !item.done).map((item) => item.key), [])
  assert.equal(result.percent, 100)
})

test('an empty post ticks only "no extra H1"', () => {
  const result = postChecklist({})
  assert.deepEqual(result.items.filter((item) => item.done).map((item) => item.key), ['h1'])
  assert.equal(result.done, 1)
})

test('alt text only counts when there is a cover image', () => {
  const item = (form: Record<string, unknown>) => postChecklist(form).items.find((i) => i.key === 'alt')!
  assert.equal(item({ image_alt: 'A rack' }).done, false)
  assert.equal(item({ image_alt: 'A rack', image_url: '/x.png' }).done, true)
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
