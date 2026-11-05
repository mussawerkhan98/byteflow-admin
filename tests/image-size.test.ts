import { strict as assert } from "node:assert";
import { test } from "node:test";
import { svgSize, webpSize } from "../app/lib/image-size";

// The first 30 bytes of real 321×97 WebP files, one per encoding.
const header = (list: string) => new Uint8Array(list.split(",").map(Number));
const lossyAlpha = header("82,73,70,70,172,0,0,0,87,69,66,80,86,80,56,88,10,0,0,0,16,0,0,0,64,1,0,96,0,0");
const lossless = header("82,73,70,70,36,0,0,0,87,69,66,80,86,80,56,76,23,0,0,0,47,64,1,24,16,7,80,138,42,212");
const lossy = header("82,73,70,70,134,0,0,0,87,69,66,80,86,80,56,32,122,0,0,0,16,11,0,157,1,42,65,1,97,0");

test("a WebP's size is read from its header, whichever encoding", () => {
  for (const bytes of [lossyAlpha, lossless, lossy]) assert.deepEqual(webpSize(bytes), { width: 321, height: 97 });
});

test("anything that isn't a WebP has no size", () => {
  assert.equal(webpSize(new Uint8Array(40)), null);
  assert.equal(webpSize(lossy.slice(0, 20)), null);
});

test("an SVG's size comes from width and height, else its viewBox", () => {
  assert.deepEqual(svgSize('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="240px" height="60"><g/></svg>'), { width: 240, height: 60 });
  assert.deepEqual(svgSize('<svg viewBox="0 0 512 128"><path/></svg>'), { width: 512, height: 128 });
  assert.deepEqual(svgSize('<svg width="100%" height="100%" viewBox="0,0,300,100"/>'), { width: 300, height: 100 });
  assert.equal(svgSize('<svg width="10em"/>'), null);
  assert.equal(svgSize("not an svg"), null);
});
