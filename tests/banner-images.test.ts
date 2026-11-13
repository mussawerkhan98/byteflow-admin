import { strict as assert } from "node:assert";
import { test } from "node:test";
import { bannerImages } from "../app/lib/banner-images";
import { servicePageList } from "../app/lib/home-sections";

test("each page's banner offers only the pictures its design shows", () => {
  assert.deepEqual(bannerImages("home"), { background: false, picture: true });
  assert.deepEqual(bannerImages("about-us"), { background: false, picture: true });
  assert.deepEqual(bannerImages("it-amc-services-dubai"), { background: true, picture: true });
  assert.deepEqual(bannerImages("careers"), { background: true, picture: false });
  for (const slug of ["services", "industries", "projects", "blog", "contact-us", "privacy-policy", "terms-and-conditions"])
    assert.deepEqual(bannerImages(slug), { background: false, picture: false }, slug);
  // A page added later keeps both, as before.
  assert.deepEqual(bannerImages("new-landing"), { background: true, picture: true });
});

test("every service page is listed (the list is kept by hand, out of the browser bundle)", () => {
  for (const page of servicePageList) assert.deepEqual(bannerImages(page.slug), { background: true, picture: true }, page.slug);
});
