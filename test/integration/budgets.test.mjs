// FEAT-110 / FIX-1a: the build report's budgets (design §23; brief §7 as amended by the orchestrator on 2026-11-02 —
// docs/design.md "Deviations and notes") — no violation. Per page: (a) CSS + JS ≤ 150 KB uncompressed, (b) HTML + CSS + JS
// ≤ 150 KB gzip level 6 (pothi routes included), (c) uncompressed HTML is a note, never fatal; plus data JSON, fonts, the
// service-worker precache and the OG stage under their caps. Locally the build only warns; this test makes `npm test` red,
// and CI=true makes the build itself exit 4 (build/build.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILD } from "./_dist.mjs";

const b = BUILD.budgets;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

test("build.json records every budget and no violation", () => {
  assert.ok(b && Array.isArray(b.violations), "budgets block present");
  assert.deepEqual(b.violations, [], "budget violations");
  assert.equal(b.page.gzipLevel, 6);
  assert.ok(b.page.code.max.bytes <= b.page.code.cap, `rule a: CSS+JS of ${b.page.code.max.file} ${kb(b.page.code.max.bytes)} ≤ ${kb(b.page.code.cap)}`);
  assert.equal(b.page.code.over, 0);
  assert.ok(b.page.gzip.max.bytes <= b.page.gzip.cap, `rule b: gzip of ${b.page.gzip.max.file} ${kb(b.page.gzip.max.bytes)} ≤ ${kb(b.page.gzip.cap)}`);
  assert.equal(b.page.gzip.over, 0);
  assert.equal(b.page.html.fatal, false, "rule c: uncompressed HTML is a note");
  assert.ok(Array.isArray(b.page.heaviest) && b.page.heaviest.length >= 1 && b.page.heaviest.length <= 10);
  for (const row of b.page.heaviest) assert.ok(row.file && row.html > 0 && row.gzip > 0 && row.uncompressed === row.html + row.code, `heaviest row ${row.file}`);
  assert.ok(b.dataJson.max.bytes <= b.dataJson.cap, `largest data JSON ${b.dataJson.max.file}`);
  assert.ok(b.fonts.bytes <= b.fonts.cap, `fonts ${b.fonts.bytes} B`);
  assert.ok(b.precache && b.precache.bytes <= b.precache.cap, `precache ${b.precache && b.precache.bytes} B`);
  assert.ok(b.og && b.og.bytes <= b.og.bytesCap && b.og.seconds <= b.og.secondsCap, "og under its caps");
  assert.notEqual(BUILD.og.fontMatched, false, "OG renderer used the bundled TTFs (MEDIUM 2)");
  console.log(`budgets: gzip max ${b.page.gzip.max.file} ${kb(b.page.gzip.max.bytes)} of ${kb(b.page.gzip.cap)}; CSS+JS max ${kb(b.page.code.max.bytes)} of ${kb(b.page.code.cap)}; HTML max ${b.page.html.max.file} ${kb(b.page.html.max.bytes)} (${b.page.html.over} pages > ${kb(b.page.html.note)}, note only); CSS ${kb(b.page.css)} (${kb(b.page.cssGz)} gz); app.mjs ${kb(b.page.appJs)}; fonts ${(b.fonts.bytes / 1024).toFixed(0)} KB; precache ${b.precache.count} URLs ${(b.precache.bytes / 1024).toFixed(0)} KB; module warnings ${b.modules.over.length}`);
  console.log("heaviest pages (uncompressed HTML+CSS+JS | gzip):\n" + b.page.heaviest.map((r) => `  ${r.file}  ${kb(r.uncompressed)} | ${kb(r.gzip)}`).join("\n"));
});

test("the gate passed and every page type has a sample for tools/audit.py --pages all-types", () => {
  assert.equal(BUILD.gate.ok, true);
  assert.ok(BUILD.pages > 0 && Object.keys(BUILD.samplePages).length > 0);
  for (const type of Object.keys(BUILD.pagesByType)) assert.ok(BUILD.samplePages[type], `sample page for ${type}`);
});
