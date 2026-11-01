// FEAT-110: #pb-offline-urls on every occasion, occasion-part and pothi page parses to {id, hash, bytes, urls} whose URLs
// are dist files (design-review MEDIUM 5; FEAT-106/109). With no occasions in the corpus (the real content/ before the
// first content item) there is nothing to check and the test passes on zero pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pages, FILES, BUILD, hrefToFile } from "./_dist.mjs";

const TYPES = new Set(["occasion", "occasion-part", "pothi"]);

test("every occasion / part / pothi page embeds a parsable offline manifest {id, hash, bytes, urls ⊆ dist}", () => {
  let n = 0;
  for (const p of pages()) {
    if (!TYPES.has(p.pageType)) {
      assert.ok(!p.html.includes('id="pb-offline-urls"') || p.pageType === "katha", `${p.href}: no offline manifest on a ${p.pageType} page`);
      continue;
    }
    n++;
    const m = /<script type="application\/json" id="pb-offline-urls">([\s\S]*?)<\/script>/.exec(p.html);
    assert.ok(m, `${p.href}: #pb-offline-urls present`);
    const j = JSON.parse(m[1]);
    assert.ok(typeof j.id === "string" && /^[a-z0-9-]+$/.test(j.id), `${p.href}: id`);
    assert.equal(j.hash, BUILD.hash, `${p.href}: hash = build hash`);
    assert.ok(Number.isInteger(j.bytes) && j.bytes > 0, `${p.href}: bytes`);
    assert.ok(Array.isArray(j.urls) && j.urls.length >= 2, `${p.href}: urls`);
    assert.ok(j.urls.includes(p.href), `${p.href}: the page lists itself`);
    const missing = j.urls.filter((u) => { const f = hrefToFile(u); return f === null || !FILES.has(f); });
    assert.deepEqual(missing, [], `${p.href}: every offline URL is a dist file`);
    assert.equal(new Set(j.urls).size, j.urls.length, `${p.href}: no duplicate URLs`);
  }
  assert.equal(n, (BUILD.pagesByType.occasion || 0) + (BUILD.pagesByType["occasion-part"] || 0) + (BUILD.pagesByType.pothi || 0));
  console.log(`offline manifests: ${n} pages`);
});
