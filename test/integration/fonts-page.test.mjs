// FEAT-110: the Devanagari rendering test page _dev/fonts.html is in dist/ (brief §5.1 fonts.md proof; design §24) and
// robots.txt keeps it and _reports/ out of the index; the woff2 files and their OFL.txt ship beside each other (design §6.3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DIST, FILES, BASE_PATH, SITE_ORIGIN } from "./_dist.mjs";

test("_dev/fonts.html exists, renders both Devanagari faces and is disallowed in robots.txt", () => {
  assert.ok(FILES.has("_dev/fonts.html"));
  const html = readFileSync(join(DIST, "_dev", "fonts.html"), "utf8");
  assert.ok(html.includes("TiroDevanagariSanskrit-Regular.woff2") && html.includes("NotoSansDevanagari-Regular.woff2"), "both Devanagari faces referenced");
  assert.ok(/[\u0951\u0952]/.test(html), "svara marks U+0951/U+0952 in the test text");
  const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Disallow: ${BASE_PATH}_dev/`), "robots disallows _dev/");
  assert.ok(robots.includes(`Disallow: ${BASE_PATH}_reports/`), "robots disallows _reports/");
  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}${BASE_PATH}sitemap.xml`), "robots names the sitemap");
});

test("every shipped font family has its woff2 files and OFL.txt", () => {
  const families = new Set([...FILES].filter((f) => f.startsWith("fonts/") && f.endsWith(".woff2")).map((f) => f.split("/")[1]));
  assert.ok(families.size >= 3, `font families: ${[...families].join(", ")}`);
  for (const fam of families) assert.ok(FILES.has(`fonts/${fam}/OFL.txt`), `${fam}: OFL.txt`);
  for (const f of ["fonts/tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2", "fonts/noto-sans-devanagari/NotoSansDevanagari-Regular.woff2"]) assert.ok(FILES.has(f), f);
});
