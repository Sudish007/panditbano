// FEAT-110: the build report's budgets (design §23; brief §7) — no violation; the per-page maximum, data JSON, fonts, the
// service-worker precache and the OG stage all under their caps. Locally the build only warns; this test makes `npm test`
// red, and CI=true makes the build itself exit 4 (build/build.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILD } from "./_dist.mjs";

const b = BUILD.budgets;

test("build.json records every budget and no violation", () => {
  assert.ok(b && Array.isArray(b.violations), "budgets block present");
  assert.deepEqual(b.violations, [], "budget violations");
  assert.ok(b.page.max.bytes <= b.page.cap, `largest page ${b.page.max.file} ${b.page.max.bytes} B ≤ ${b.page.cap}`);
  assert.equal(b.page.over, 0);
  assert.ok(b.dataJson.max.bytes <= b.dataJson.cap, `largest data JSON ${b.dataJson.max.file}`);
  assert.ok(b.fonts.bytes <= b.fonts.cap, `fonts ${b.fonts.bytes} B`);
  assert.ok(b.precache && b.precache.bytes <= b.precache.cap, `precache ${b.precache && b.precache.bytes} B`);
  assert.ok(b.og && b.og.bytes <= b.og.bytesCap && b.og.seconds <= b.og.secondsCap, "og under its caps");
  assert.notEqual(BUILD.og.fontMatched, false, "OG renderer used the bundled TTFs (MEDIUM 2)");
  console.log(`budgets: largest page ${b.page.max.file} ${(b.page.max.bytes / 1024).toFixed(1)} KB of ${b.page.cap / 1024} KB; CSS ${(b.page.css / 1024).toFixed(1)} KB; app.mjs ${(b.page.appJs / 1024).toFixed(1)} KB; fonts ${(b.fonts.bytes / 1024).toFixed(0)} KB; precache ${b.precache.count} URLs ${(b.precache.bytes / 1024).toFixed(0)} KB; module warnings ${b.modules.over.length}`);
});

test("the gate passed and every page type has a sample for tools/audit.py --pages all-types", () => {
  assert.equal(BUILD.gate.ok, true);
  assert.ok(BUILD.pages > 0 && Object.keys(BUILD.samplePages).length > 0);
  for (const type of Object.keys(BUILD.pagesByType)) assert.ok(BUILD.samplePages[type], `sample page for ${type}`);
});
