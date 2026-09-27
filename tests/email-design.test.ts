import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  buildEmail,
  readableOn,
  safeColor,
  type EmailSettings,
} from "../app/lib/email-template";

const settings: EmailSettings = {
  businessName: "Byteflow Information Technology",
  phone: "+971 54 328 2042",
  websiteUrl: "https://www.byteflow.ae",
  logoUrl: "https://www.byteflow.ae/uploads/logo.png",
};

const content = {
  headline: "20% off",
  body: "First paragraph.\n\nSecond paragraph.",
  buttonText: "Get a Free Quote",
  buttonUrl: "https://wa.me/971543282042",
  imageUrl: "",
};

const recipient = {
  name: "Mussawer Khan",
  email: "someone@example.com",
  unsubscribeUrl: "https://www.byteflow.ae/unsubscribe?p=1&k=abc",
};

const render = (overrides: Partial<EmailSettings> = {}) =>
  buildEmail(content, recipient, { ...settings, ...overrides }).html;

test("by default the logo is not used, even when one is set", () => {
  const html = render();
  assert.ok(!html.includes("uploads/logo.png"), "logo image should not appear");
  assert.ok(html.includes("Byteflow Information Technology"));
});

test("the logo appears only when that header is chosen", () => {
  assert.ok(render({ headerStyle: "logo" }).includes("uploads/logo.png"));
});

test("choosing the logo with none uploaded falls back to the name", () => {
  const html = render({ headerStyle: "logo", logoUrl: "" });
  assert.ok(!/<img[^>]+logo/i.test(html));
  assert.ok(html.includes("Byteflow Information Technology"));
});

test("the 'none' header leaves nothing above the greeting", () => {
  const html = render({ headerStyle: "none" });
  const greeting = html.indexOf("Dear Mussawer,");
  assert.ok(greeting > 0);
  assert.ok(
    !html.slice(0, greeting).includes("Byteflow Information Technology"),
    "no masthead before the greeting",
  );
  // The footer still identifies the sender.
  assert.ok(html.slice(greeting).includes("Byteflow Information Technology"));
});

test("only a six-digit hex colour is accepted", () => {
  assert.equal(safeColor("#ff8800"), "#ff8800");
  assert.equal(safeColor("#FFF"), "#2CCDDE");
  assert.equal(safeColor("red"), "#2CCDDE");
  assert.equal(safeColor(""), "#2CCDDE");
  assert.equal(safeColor(undefined), "#2CCDDE");
});

test("a colour cannot smuggle anything into the style attribute", () => {
  const html = render({ accentColor: "#fff;background:url(javascript:alert(1))" });
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("background:#2CCDDE"));
});

test("the chosen colour reaches the button", () => {
  assert.ok(render({ accentColor: "#ff8800" }).includes("background:#ff8800"));
});

test("button text flips to stay readable on the chosen colour", () => {
  assert.equal(readableOn("#ffffff"), "#04141a");
  assert.equal(readableOn("#000000"), "#ffffff");
  assert.equal(readableOn("#0b1f3a"), "#ffffff");
});

test("a custom footer note replaces the default sentence", () => {
  const html = render({ footerNote: "You signed up at our Dubai office." });
  assert.ok(html.includes("You signed up at our Dubai office."));
  assert.ok(!html.includes("asked to hear about offers"));
});

test("a footer note is escaped, not rendered", () => {
  const html = render({ footerNote: '<script>alert(1)</script>' });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("the unsubscribe link survives every header choice", () => {
  for (const headerStyle of ["name", "logo", "none"] as const) {
    const html = render({ headerStyle });
    assert.ok(
      html.includes("https://www.byteflow.ae/unsubscribe?p=1&amp;k=abc"),
      `unsubscribe link missing for ${headerStyle}`,
    );
  }
});
