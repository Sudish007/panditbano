// FEAT-105: attribution lines rendered as HTML (design.md §7.7; decisions.md §7.2 patterns W/S/G/V/B/T) — one line per
// source project in each language, the source title and the licence as links (rel="external", licence rel="license").
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { attributionLine, attributionPattern } from "../../build/lib/derive.mjs";
import { attributionHtml, attributionLines, sourcesSection, sourceLine, sourceTitle } from "../../build/templates/components/verse.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));

const ENTRIES = {
  W: { id: "ws-x", project: "wikisource", title: "शुक्लयजुर्वेदः/अध्यायः ३६", url: "https://sa.wikisource.org/wiki/x", retrieved: "2026-10-31", kind: "copy", titles: ["शुक्लयजुर्वेद अध्याय 36", "Vajasaneyi Samhita 36"], wikisourceLang: "sa" },
  S: { id: "sd-x", project: "sanskritdocuments", title: "shuklayajurvedIyasandhyA", url: "https://sanskritdocuments.org/doc_veda/x.html", retrieved: "2026-10-31", kind: "verify", encoders: "encoded by volunteers", titles: ["Shukla Yajurvediya Sandhya"] },
  G: { id: "gr-x", project: "gretil", title: "Vajasaneyi-Samhita (Madhyandina)", url: "https://gretil.sub.uni-goettingen.de/x.htm", retrieved: "2026-10-31", kind: "verify", encoders: "TITUS", titles: ["GRETIL Vajasaneyi Samhita"] },
  V: { id: "vhp-x", project: "vhp", title: "Vedic Heritage Portal — Shukla Yajurveda", url: "https://vedicheritage.gov.in/x", retrieved: "2026-10-31", kind: "link", titles: ["Vedic Heritage Portal"] },
  B: { id: "pub-x", project: "publisher", title: "Vivah Paddhati", url: "https://gitapress.org/x", retrieved: "2026-10-31", kind: "sequence", publisher: "Gita Press", year: "2019", titles: ["Vivah Paddhati"] },
  T: { id: "ia-x", project: "archive", title: "Shukla Yajurveda Samhita", url: "https://archive.org/details/x", retrieved: "2026-10-31", kind: "scan", publisher: "Nirnaya Sagar", year: "1912", item: "ShuklaYajurvedaSamhita", titles: ["Shukla Yajurveda Samhita (1912)"] },
};
const OPTS = { W: { retrieved: "2026-10-31", modified: false }, S: { retrieved: "2026-10-31", checked: true }, G: {}, V: {}, B: {}, T: { retrieved: "2026-10-31", checked: true } };
const LANGS = ["hi", "en", "bho"];

test("one attribution line per source project in each language, pattern letter as decisions §7.2", () => {
  for (const [p, entry] of Object.entries(ENTRIES)) {
    assert.equal(attributionPattern(entry), p);
    for (const lang of LANGS) {
      const line = attributionLine(entry, OPTS[p], lang);
      assert.equal(line.pattern, p);
      const html = attributionHtml(line, lang, entry).toString();
      assert.ok(!html.includes("\n"), `${p}/${lang}: one line`);
      assert.ok(html.length > 20 && html.includes(entry.url), `${p}/${lang}: carries the URL`);
      // exactly one link to the source URL, carrying rel="external" and the marker
      const links = [...html.matchAll(/<a href="([^"]+)" rel="([^"]+)">/g)];
      assert.equal(links.filter((m) => m[1] === entry.url).length, 1, `${p}/${lang}: one link to the source: ${html}`);
      assert.ok(links.every((m) => /\bexternal\b/.test(m[2]) && /\bnoopener\b/.test(m[2])), `${p}/${lang}: rel external noopener`);
      assert.equal((html.match(/<use href="#i-ext"\/>/g) || []).length, links.length, `${p}/${lang}: a marker per link`);
      // the named source is the link text (every named source is a link — brief §5.1): the registry title, or for the
      // Vedic Heritage Portal line (which names the portal instead of the page title) the portal phrase
      const linkText = p === "V" ? { hi: "वैदिक हेरिटेज पोर्टल, IGNCA", en: "Vedic Heritage Portal, IGNCA", bho: "वैदिक हेरिटेज पोर्टल, IGNCA" }[lang] : entry.title;
      assert.ok(new RegExp(`<a href="${entry.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>${linkText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<svg`).test(html), `${p}/${lang}: source name is the link text: ${html}`);
      assert.ok(!html.includes(`(${entry.url}`), `${p}/${lang}: the parenthesised URL is dropped once linked`);
      // licence URLs become rel="license" links (W, G)
      if (p === "W" || p === "G") assert.ok(/rel="external license noopener">CC BY(-NC)?-SA 4\.0<svg/.test(html), `${p}/${lang}: licence link`);
      // no bare "(https://" survives
      assert.ok(!/\(https?:\/\//.test(html.replace(/href="[^"]*"/g, "")), `${p}/${lang}: bare URL left in text: ${html}`);
      assert.ok(!/[<>]/.test(line.text) || !html.includes(line.text), "text is escaped");
    }
  }
});

test("escaping: a hostile title or URL never reaches the HTML unescaped", () => {
  const entry = { ...ENTRIES.W, title: '<img src=x onerror="1">', url: 'https://example.org/?a=1&b="x"' };
  const html = attributionHtml(attributionLine(entry, OPTS.W, "en"), "en", entry).toString();
  assert.ok(!html.includes("<img") && html.includes("&lt;img"));
  assert.ok(html.includes('href="https://example.org/?a=1&amp;b=&quot;x&quot;"'));
});

test("sourceLine / sourcesSection / attributionLines over a record: source, checkedAgainst and variant sources once each", () => {
  const sources = new Map(Object.values(ENTRIES).map((e) => [e.id, e]));
  const rec = { id: "r", locator: "VS 36.3", source: { ref: "ws-x", retrieved: "2026-10-31", modified: false }, checkedAgainst: [{ ref: "sd-x", retrieved: "2026-10-31" }, { ref: "gr-x", retrieved: "2026-10-31" }], variants: [{ reading: "क", source: "sd-x" }, { reading: "ख", source: "ia-x" }] };
  const lines = attributionLines(rec, "en", sources);
  assert.deepEqual(lines.map((l) => l.ref), ["ws-x", "sd-x", "gr-x", "ia-x"]);
  assert.deepEqual(lines.map((l) => l.line.pattern), ["W", "S", "G", "T"]);
  for (const lang of LANGS) {
    const sec = sourcesSection([rec], lang, { sources }).toString();
    assert.equal((sec.match(/<li data-source=/g) || []).length, 4);
    assert.ok(sec.includes('<section id="sources" aria-labelledby="h-sources">'));
    const src = sourceLine(rec, lang, { sources }).toString();
    assert.ok(src.startsWith('<p class="src">') && src.includes("VS 36.3") && src.includes(`>${sourceTitle(ENTRIES.W, lang)}<svg`));
  }
  assert.equal(sourceTitle(ENTRIES.W, "en"), "Vajasaneyi Samhita 36");
  assert.equal(sourceTitle(ENTRIES.W, "hi"), "शुक्लयजुर्वेद अध्याय 36");
  assert.equal(sourceTitle({ title: "only" }, "bho"), "only");
  // a missing registry entry degrades to the "O" line, never throws
  const o = attributionLines({ id: "q", source: { ref: "nope", retrieved: "2026-10-31" } }, "hi", sources);
  assert.equal(o[0].line.pattern, "O");
});
