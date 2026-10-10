import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSvg, svgIconDataUrl, SvgIconError } from "../app/lib/svg-icon";

const DRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';

const decode = (url: string) =>
  Buffer.from(url.replace(/^data:image\/svg\+xml;base64,/, ""), "base64").toString("utf8");

// Every one of these is what a real export tool actually writes, and every
// one of them was refused before.
const ACCEPTED: Record<string, string> = {
  "plain drawing": DRAWING,
  "figma export with trailing newline": `${DRAWING}\n`,
  "xml declaration": `<?xml version="1.0" encoding="UTF-8"?>\n${DRAWING}`,
  "illustrator generator comment": `<!-- Generator: Adobe Illustrator 27.0.0 -->\n${DRAWING}`,
  "declaration, comment and doctype together":
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    "<!-- Generator: Adobe Illustrator 27.0.0, SVG Export Plug-In -->\n" +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    DRAWING,
  "byte order mark": `﻿${DRAWING}`,
  "trailing comment": `${DRAWING}\n<!-- end -->`,
  "style block with classes":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>.a{fill:#2CCDDE}</style><path class="a" d="M4 4h16v16H4z"/></svg>',
  "local url() reference":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g"/></defs><path fill="url(#g)" d="M4 4h16v16H4z"/></svg>',
};

for (const [name, svg] of Object.entries(ACCEPTED)) {
  test(`accepts an icon with ${name}`, () => {
    const url = svgIconDataUrl(svg);
    assert.match(url, /^data:image\/svg\+xml;base64,/);
    const out = decode(url);
    assert.match(out, /^<svg\b/i, "the stored icon starts at the root element");
    assert.match(out, /<\/svg>$/i, "the stored icon ends at the root element");
    assert.doesNotMatch(out, /<\?xml/i, "the declaration is not carried into the data URL");
    assert.doesNotMatch(out, /<!DOCTYPE/i, "the doctype is not carried into the data URL");
  });
}

// These can run code or reach off the page once the file is served back.
const REFUSED: Record<string, string> = {
  "an inline script": '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  "an onload handler": '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path d="M4 4h1v1H4z"/></svg>',
  "an onclick handler": '<svg xmlns="http://www.w3.org/2000/svg"><path onclick="alert(1)" d="M4 4h1v1H4z"/></svg>',
  "embedded HTML": '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body/></foreignObject></svg>',
  "an iframe": '<svg xmlns="http://www.w3.org/2000/svg"><iframe src="https://evil.test"/></svg>',
  "an external stylesheet link": '<svg xmlns="http://www.w3.org/2000/svg"><link rel="stylesheet" href="https://evil.test/a.css"/></svg>',
  "a javascript: link": '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path d="M4 4h1v1H4z"/></a></svg>',
  "an entity declaration": '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>\n<svg xmlns="http://www.w3.org/2000/svg">&x;</svg>',
  "a css import": '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://evil.test/a.css);</style></svg>',
  "a remote url() in css": '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{background:url(https://evil.test/x.png)}</style><path class="a" d="M4 4h1v1H4z"/></svg>',
  "nothing resembling an svg": "just some text",
  "an html document": "<html><body>hello</body></html>",
  "an empty file": "",
};

for (const [name, svg] of Object.entries(REFUSED)) {
  test(`refuses a file with ${name}`, () => {
    assert.throws(() => svgIconDataUrl(svg), SvgIconError);
  });
}

test("the refusal explains which thing was found", () => {
  assert.throws(
    () => svgIconDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    /contains a script/,
  );
  assert.throws(() => svgIconDataUrl("just some text"), /does not look like an SVG icon/);
});

test("an entity hidden behind a stripped doctype is still caught", () => {
  // The doctype is removed as prologue, so the entity check has to run
  // against the original text as well, not only what survives stripping.
  assert.throws(
    () => svgIconDataUrl('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&xxe;</svg>'),
    SvgIconError,
  );
});

test("normalizeSvg leaves an already clean drawing untouched", () => {
  assert.equal(normalizeSvg(DRAWING), DRAWING);
});
