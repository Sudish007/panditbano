// FEAT-110: per page — exactly one <h1>, canonical, hreflang hi/en/x-default (never bho/bh), <html lang> ∈ hi|en|bho,
// two theme-color metas, a manifest link (design §17, §18, §24). The root redirect is the one page without a <main>:
// it carries lang + canonical only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pages, count, attr, LANGS, SITE_ORIGIN, BASE_PATH } from "./_dist.mjs";

const all = pages();

test("every page: <html lang> is hi, en or bho and matches the page language", () => {
  for (const p of all) {
    const tag = /<html[^>]*>/.exec(p.html)[0];
    const lang = attr(tag, "lang");
    assert.ok(LANGS.includes(lang), `${p.href}: lang="${lang}"`);
    if (p.lang) assert.equal(lang, p.lang, `${p.href}: lang matches the route`);
    assert.equal(attr(tag, "data-page"), p.pageType, `${p.href}: data-page`);
  }
});

test("every full page: one <h1>, canonical = its own URL, hreflang hi + en + x-default, two theme-color metas, manifest link", () => {
  let checked = 0;
  for (const p of all) {
    if (p.pageType === "root-redirect") {
      assert.equal(count(p.html, /<link rel="canonical"/g), 1, `${p.href}: canonical`);
      continue;
    }
    const h = p.html;
    assert.equal(count(h, /<h1[\s>]/g), 1, `${p.href}: exactly one <h1>`);
    assert.equal(count(h, /<meta name="theme-color"/g), 2, `${p.href}: two theme-color metas`);
    assert.equal(count(h, /<link rel="manifest" href="/g), 1, `${p.href}: manifest link`);
    assert.ok(h.includes(`<link rel="manifest" href="${BASE_PATH}${attr(/<html[^>]*>/.exec(h)[0], "lang")}/manifest.webmanifest">`), `${p.href}: manifest of its language`);
    if (p.pageType === "not-found") continue; // served for any URL: no canonical, no alternates (design §3.2)
    assert.equal(count(h, /<link rel="canonical"/g), 1, `${p.href}: one canonical`);
    assert.ok(h.includes(`<link rel="canonical" href="${SITE_ORIGIN}${p.href}">`), `${p.href}: canonical is its own absolute URL`);
    const hl = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
    assert.deepEqual(hl.map((m) => m[1]), ["hi", "en", "x-default"], `${p.href}: hreflang set`);
    for (const m of hl) assert.ok(m[2].startsWith(SITE_ORIGIN + BASE_PATH), `${p.href}: hreflang URL absolute`);
    assert.equal(hl[0][2], hl[2][2], `${p.href}: x-default = hi`);
    assert.ok(!/<link rel="alternate" hreflang="(bho|bh)"/.test(h), `${p.href}: no bho/bh hreflang link (the language control's <a hreflang="bho"> is allowed)`);
    checked++;
  }
  assert.ok(checked >= 3 * 3, `pages checked: ${checked}`);
});

test("every full page: description, og:title/og:url, viewport without maximum-scale, skip link + <main id=\"main\"> on shell pages", () => {
  for (const p of all) {
    if (p.pageType === "root-redirect") continue;
    const h = p.html;
    assert.ok(/<meta name="description" content="[^"]+">/.test(h), `${p.href}: description`);
    assert.ok(h.includes('<meta name="viewport" content="width=device-width, initial-scale=1">'), `${p.href}: viewport (WCAG 1.4.4)`);
    if (p.pageType === "not-found") continue;
    assert.ok(h.includes(`<meta property="og:url" content="${SITE_ORIGIN}${p.href}">`), `${p.href}: og:url`);
    if (p.pageType !== "offline") assert.ok(/<meta property="og:image" content="[^"]+">/.test(h), `${p.href}: og:image`);
    if (!["pothi", "offline"].includes(p.pageType)) {
      assert.ok(h.includes('<a class="skip" href="#main">') && h.includes('<main id="main"'), `${p.href}: skip link + main`);
    }
  }
});
