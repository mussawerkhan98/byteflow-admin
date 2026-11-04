/**
 * Tests for the HTML cleaner behind the post editor's paste, HTML view, load
 * and save. The inputs are the shapes pasted content really arrives in.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { countH2, sanitizeEditorHtml, textToEditorHtml } from "../app/lib/editor-html";

const clean = sanitizeEditorHtml;

test("an <h2> wrapped round paragraphs becomes the paragraphs", () => {
  assert.equal(clean("<h2><p>First para.</p><p>Second para.</p></h2>"), "<p>First para.</p><p>Second para.</p>");
  assert.equal(countH2(clean("<h2>Real heading</h2><h2><p>One.</p><p>Two.</p></h2>")), 1);
});

test("styled spans are unwrapped and every style, class and id goes", () => {
  assert.equal(
    clean('<p class="x" id="y" data-a="1"><span style="color: rgb(255,255,255); font-size: 1.5rem; letter-spacing: -0.025em; font-weight: normal;">Body text</span></p>'),
    "<p>Body text</p>",
  );
  assert.equal(clean('<h3 style="font-size:40px"><font color="red">Title</font></h3>'), "<h3>Title</h3>");
});

test("formatting that pasted content carries only as CSS is kept as tags", () => {
  assert.equal(
    clean('<p><span style="font-weight:700">Bold</span> and <span style="font-style:italic">italic</span></p>'),
    "<p><strong>Bold</strong> and <em>italic</em></p>",
  );
  // Google Docs wraps the whole document in a <b> that is not bold.
  assert.equal(
    clean('<b style="font-weight:normal;" id="docs-internal-guid-1"><p>One.</p><p>Two.</p></b>'),
    "<p>One.</p><p>Two.</p>",
  );
});

test("<br>-separated paragraphs are split at double breaks and sentence ends", () => {
  assert.equal(clean("<p>First sentence.<br>Second one.</p>"), "<p>First sentence.</p><p>Second one.</p>");
  assert.equal(clean("<p>Para one<br><br>Para two</p>"), "<p>Para one</p><p>Para two</p>");
  assert.equal(
    clean("<p><span>Line one.<br></span><span>Line two</span></p>"),
    "<p>Line one.</p><p>Line two</p>",
  );
  // An address keeps its line breaks.
  assert.equal(clean("<p>Office 12<br>Al Barsha<br>Dubai</p>"), "<p>Office 12<br>Al Barsha<br>Dubai</p>");
});

test("a heading wrapped round a table gives the table back, outside any heading", () => {
  assert.equal(
    clean("<h2><table><tr><th>Plan</th><th>Price</th></tr><tr><td>Basic</td><td>AED 500</td></tr></table></h2>"),
    "<table><tbody><tr><th>Plan</th><th>Price</th></tr><tr><td>Basic</td><td>AED 500</td></tr></tbody></table>",
  );
});

test("plain-text paste becomes paragraphs", () => {
  assert.equal(textToEditorHtml("First paragraph.\n\nSecond paragraph."), "<p>First paragraph.</p><p>Second paragraph.</p>");
  assert.equal(textToEditorHtml("Line one\nLine two"), "<p>Line one</p><p>Line two</p>");
  assert.equal(textToEditorHtml("  \n "), "");
  assert.equal(textToEditorHtml("a < b & c"), "<p>a &lt; b &amp; c</p>");
});

test("links, lists and tables come through intact", () => {
  const html =
    '<p>See <a href="https://byteflow.ae/it-support" target="_blank" class="btn">our page</a> or <a href="/contact-us" style="color:red">contact us</a>.</p>' +
    "<ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li><strong>Step</strong> one</li></ol>" +
    "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>";
  assert.equal(
    clean(html),
    '<p>See <a href="https://byteflow.ae/it-support" target="_blank" rel="noopener noreferrer">our page</a> or <a href="/contact-us">contact us</a>.</p>' +
      "<ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li><strong>Step</strong> one</li></ol>" +
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>",
  );
});

test("h1 becomes h2; over-long headings become paragraphs; empty blocks go", () => {
  assert.equal(clean("<h1>Title</h1>"), "<h2>Title</h2>");
  const long = "word ".repeat(30).trim();
  assert.equal(clean(`<h2>${long}</h2>`), `<p>${long}</p>`);
  assert.equal(clean("<p></p><p> &nbsp; </p><h2> </h2><span></span><p>Kept</p>"), "<p>Kept</p>");
});

test("no block ever sits inside a paragraph or heading", () => {
  const out = clean("<p>Intro<ul><li>Item</li></ul>after</p><h3>Head<div>inner</div></h3>");
  // Within one paragraph or heading: no block tag before it closes.
  assert.doesNotMatch(out, /<p>(?:(?!<\/p>)[^])*<(ul|ol|table|h\d|div|blockquote|p)\b/);
  assert.doesNotMatch(out, /<h(\d)>(?:(?!<\/h\1>)[^])*<(p|ul|ol|table|div)\b/);
  assert.equal(out, "<p>Intro</p><ul><li>Item</li></ul><p>after</p><p>Head</p><p>inner</p>");
});

test("disallowed tags are unwrapped, scripts and unsafe links removed", () => {
  assert.equal(clean("<section><div>Block one</div><div>Block two</div></section>"), "<p>Block one</p><p>Block two</p>");
  assert.equal(clean('<p>Hi<script>alert(1)</script> <a href="javascript:alert(1)">there</a></p>'), "<p>Hi there</p>");
  assert.equal(clean('<p onclick="x()">Safe</p>'), "<p>Safe</p>");
});

test("images, figures and the editor's table wrapper are handled without losing content", () => {
  assert.equal(
    clean('<figure class="wp-block-image"><img src="/api/media/7" alt="Server room" class="x" style="width:100%" width="800" height="400"><figcaption>Our <em>racks</em></figcaption></figure>'),
    '<figure><img src="/api/media/7" alt="Server room" width="800" height="400"><figcaption>Our <em>racks</em></figcaption></figure>',
  );
  assert.equal(clean('<img src="javascript:x">'), "");
  assert.equal(
    clean('<div class="table-scroll"><table><tbody><tr><td>x</td></tr></tbody></table></div><p><br></p>'),
    "<table><tbody><tr><td>x</td></tr></tbody></table>",
  );
});

test("cleaning clean HTML changes nothing", () => {
  const samples = [
    "<h2><p>A.</p><p>B.</p></h2><p>Office 12<br>Dubai</p>",
    '<p>See <a href="/x" target="_blank">x</a> &amp; more</p><ul><li>One<ul><li>Two</li></ul></li></ul>',
    '<figure><img src="/a.png" alt=""><figcaption>Cap</figcaption></figure><pre>  code\n  here</pre><hr>',
  ];
  for (const sample of samples) {
    const once = clean(sample);
    assert.equal(clean(once), once);
  }
});
