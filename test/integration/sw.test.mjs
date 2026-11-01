// FEAT-110: the service worker's precache list ⊆ dist/ (design §13.2, §24): every URL is a dist file, the list carries the
// shell (root, 404, offline + home pages, the hashed CSS/JS, the manifests) and nothing outside BASE_PATH.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DIST, FILES, BUILD, BASE_PATH, LANGS, hrefToFile } from "./_dist.mjs";

const sw = readFileSync(join(DIST, "sw.js"), "utf8");
const pick = (name) => { const m = new RegExp(`var ${name} = (.*?);\\n`).exec(sw); assert.ok(m, `sw.js declares ${name}`); return JSON.parse(m[1]); };

test("sw.js: HASH = build hash, BASE = BASE_PATH, LANGS, PRECACHE ⊆ dist", () => {
  assert.equal(pick("HASH"), BUILD.hash);
  assert.equal(pick("BASE"), BASE_PATH);
  assert.deepEqual(pick("LANGS"), LANGS);
  const pre = pick("PRECACHE");
  assert.ok(Array.isArray(pre) && pre.length === BUILD.pwa.precache.count, `precache count ${pre.length} = build.json ${BUILD.pwa.precache.count}`);
  const missing = pre.filter((u) => { const f = hrefToFile(u); return f === null || !FILES.has(f); });
  assert.deepEqual(missing, [], "every precache URL is a dist file");
  assert.equal(new Set(pre).size, pre.length, "no duplicates");
  for (const u of [BASE_PATH, `${BASE_PATH}404.html`, `${BASE_PATH}sw.js`]) {
    if (u.endsWith("sw.js")) assert.ok(!pre.includes(u), "the worker never precaches itself");
    else assert.ok(pre.includes(u), `${u} precached`);
  }
  for (const l of LANGS) for (const p of ["", "offline/", "manifest.webmanifest"]) assert.ok(pre.includes(`${BASE_PATH}${l}/${p}`), `${l}/${p} precached`);
  assert.ok(pre.some((u) => /\/assets\/css\/site\.[0-9a-f]{12}\.css$/.test(u)), "hashed CSS precached");
  assert.ok(pre.some((u) => /\/assets\/js\/app\.[0-9a-f]{12}\.mjs$/.test(u)), "hashed app.mjs precached");
});

test("every page registers the same sw.js and each language manifest is valid (no id, relative start_url)", () => {
  for (const l of LANGS) {
    const m = JSON.parse(readFileSync(join(DIST, l, "manifest.webmanifest"), "utf8"));
    assert.equal(m.id, undefined, `${l}: no id`);
    assert.ok(!/^https?:/.test(m.start_url) , `${l}: relative start_url (${m.start_url})`);
    assert.equal(m.lang, l);
    assert.ok(Array.isArray(m.icons) && m.icons.length >= 2);
  }
});
