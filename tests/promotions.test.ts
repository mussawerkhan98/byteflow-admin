/**
 * Tests for the promotion side's pure logic: who an audience selects, and
 * what the email body ends up containing. Run with `npm test`.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  countAudience,
  describeAudience,
  matchesAudience,
  parseAudience,
  type Targetable,
} from "../app/lib/audience";
import {
  buildEmail,
  escapeHtml,
  firstName,
  paragraphsOf,
  safeUrl,
  stripTemplating,
} from "../app/lib/email-template";

const person = (over: Partial<Targetable> = {}): Targetable => ({
  country: "United Arab Emirates",
  region: "Dubai",
  groups: "VIP, Corporate",
  optOut: false,
  ...over,
});

const audience = (over = {}) => parseAudience({ countries: [], regions: [], groups: [], ...over });

test("an empty audience means everyone who still receives offers", () => {
  assert.equal(matchesAudience(person(), audience()), true);
  assert.equal(matchesAudience(person({ country: "", region: "", groups: "" }), audience()), true);
});

test("someone who unsubscribed is never selected, whatever the filters say", () => {
  assert.equal(matchesAudience(person({ optOut: true }), audience()), false);
  assert.equal(
    matchesAudience(person({ optOut: true }), audience({ countries: ["United Arab Emirates"] })),
    false,
  );
});

test("several ticks in one section widen the audience (OR)", () => {
  const target = audience({ countries: ["United Arab Emirates", "Saudi Arabia"] });
  assert.equal(matchesAudience(person({ country: "United Arab Emirates" }), target), true);
  assert.equal(matchesAudience(person({ country: "Saudi Arabia" }), target), true);
  assert.equal(matchesAudience(person({ country: "United Kingdom" }), target), false);
});

test("ticks across sections narrow the audience (AND)", () => {
  const target = audience({ countries: ["United Arab Emirates"], groups: ["VIP"] });
  assert.equal(matchesAudience(person(), target), true);
  // Right country, wrong group.
  assert.equal(matchesAudience(person({ groups: "Corporate" }), target), false);
  // Right group, wrong country.
  assert.equal(matchesAudience(person({ country: "Oman" }), target), false);
});

test("group matching ignores case and spacing", () => {
  const target = audience({ groups: ["vip"] });
  assert.equal(matchesAudience(person({ groups: " VIP , Corporate" }), target), true);
  assert.equal(matchesAudience(person({ groups: "vip" }), target), true);
  assert.equal(matchesAudience(person({ groups: "VIPs" }), target), false);
});

test("audience counts add up across a mixed list", () => {
  const people = [
    person({ country: "United Arab Emirates", groups: "VIP" }),
    person({ country: "United Arab Emirates", groups: "Corporate" }),
    person({ country: "Saudi Arabia", groups: "VIP" }),
    person({ country: "United Arab Emirates", groups: "VIP", optOut: true }),
  ];
  assert.equal(countAudience(people, audience()), 3);
  assert.equal(countAudience(people, audience({ countries: ["United Arab Emirates"] })), 2);
  assert.equal(countAudience(people, audience({ groups: ["VIP"] })), 2);
  assert.equal(
    countAudience(people, audience({ countries: ["United Arab Emirates"], groups: ["VIP"] })),
    1,
  );
});

test("a malformed audience falls back to everyone rather than throwing", () => {
  assert.deepEqual(parseAudience("not json"), { countries: [], regions: [], groups: [] });
  assert.deepEqual(parseAudience(null), { countries: [], regions: [], groups: [] });
  assert.equal(matchesAudience(person(), parseAudience("{oops")), true);
});

test("the audience is described in words for the promotions list", () => {
  assert.equal(describeAudience(audience()), "Everyone who receives offers");
  assert.match(describeAudience(audience({ groups: ["VIP", "Corporate"] })), /VIP or Corporate/);
});

test("admin text is escaped so it cannot inject markup", () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  assert.equal(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry");
});

test("Brevo templating delimiters are stripped from admin text", () => {
  assert.equal(stripTemplating("Hello {{ params.name }} there"), "Hello  there");
  assert.equal(stripTemplating("{% if x %}secret{% endif %}"), "secret");
  assert.equal(stripTemplating("a {{ b"), "a  b");
});

test("only http(s) and mailto links survive", () => {
  assert.equal(safeUrl("https://byteflow.ae"), "https://byteflow.ae");
  assert.equal(safeUrl("mailto:info@byteflow.ae"), "mailto:info@byteflow.ae");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,<script>"), "");
  assert.equal(safeUrl("", "https://fallback.example"), "https://fallback.example");
});

test("the greeting uses a first name and falls back politely", () => {
  assert.equal(firstName("Aisha Rahman"), "Aisha");
  assert.equal(firstName("  Ben  "), "Ben");
  assert.equal(firstName(""), "there");
  assert.equal(firstName(null), "there");
});

test("a blank line starts a new paragraph", () => {
  assert.deepEqual(paragraphsOf("one\n\ntwo\n\n\nthree"), ["one", "two", "three"]);
  assert.deepEqual(paragraphsOf("single line"), ["single line"]);
  assert.deepEqual(paragraphsOf(""), []);
});

const settings = {
  businessName: "Byteflow Information Technology",
  phone: "+971 54 328 2042",
  websiteUrl: "https://www.byteflow.ae",
  logoUrl: "https://www.byteflow.ae/images/logo.png",
};

test("a built email greets by name, carries the unsubscribe link, and has a text part", () => {
  const { html, text } = buildEmail(
    {
      headline: "Spring offer",
      body: "First paragraph.\n\nSecond paragraph.",
      buttonText: "See the offer",
      buttonUrl: "https://www.byteflow.ae/api/r/abc123",
      imageUrl: "",
    },
    {
      name: "Aisha Rahman",
      email: "aisha@example.com",
      unsubscribeUrl: "https://www.byteflow.ae/unsubscribe?p=1&k=key",
    },
    settings,
  );

  assert.ok(html.includes("Dear Aisha,"), "greets by first name");
  assert.ok(html.includes("Spring offer"));
  assert.ok(html.includes("First paragraph."));
  assert.ok(html.includes("Second paragraph."));
  assert.ok(html.includes("https://www.byteflow.ae/api/r/abc123"), "button uses the tracked link");
  assert.ok(html.includes("unsubscribe?p=1&amp;k=key"), "unsubscribe link is present");
  assert.ok(html.includes("width=\"600\"") || html.includes("width:600px"), "600px layout");

  assert.ok(text.includes("Dear Aisha,"));
  assert.ok(text.includes("Unsubscribe: https://www.byteflow.ae/unsubscribe?p=1&k=key"));
  assert.ok(!text.includes("<"), "the text part carries no markup");
});

test("a dangerous button link is dropped rather than rendered", () => {
  const { html } = buildEmail(
    {
      headline: "Hi",
      body: "Body",
      buttonText: "Click",
      buttonUrl: "javascript:alert(1)",
      imageUrl: "",
    },
    { name: "Sam", email: "s@example.com", unsubscribeUrl: "https://www.byteflow.ae/unsubscribe" },
    settings,
  );
  assert.ok(!html.includes("javascript:"), "no javascript: URL reaches the email");
});

test("markup typed into the headline is escaped, not rendered", () => {
  const { html } = buildEmail(
    {
      headline: '<img src=x onerror="alert(1)">',
      body: "Body",
      buttonText: "",
      buttonUrl: "",
      imageUrl: "",
    },
    { name: "Sam", email: "s@example.com", unsubscribeUrl: "https://www.byteflow.ae/unsubscribe" },
    settings,
  );
  assert.ok(!/<img[^>]*onerror/i.test(html), "no live img tag with a handler");
  assert.ok(html.includes("&lt;img"), "it appears as escaped text instead");
});

test("with no button, no button markup is produced", () => {
  const { html, text } = buildEmail(
    { headline: "Hi", body: "Body", buttonText: "", buttonUrl: "", imageUrl: "" },
    { name: "Sam", email: "s@example.com", unsubscribeUrl: "https://www.byteflow.ae/unsubscribe" },
    settings,
  );
  assert.ok(!html.includes("border-radius:999px"), "no button is rendered");
  assert.ok(!/\n[^\n]*: https:\/\/www\.byteflow\.ae\/api\/r\//.test(text));
});
