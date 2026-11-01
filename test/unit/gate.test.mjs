// FEAT-104: content gate G1–G21 (+G22) — the sample passes with 0 FAIL, each content-bad fixture reports its rule, the CLI exits 3
// on FAIL and writes dist/_reports/gate.json in both cases (design §10.7–10.9; design-review NIT 14), lane mode WARN/FAIL semantics.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadContent, poolOf } from "../../build/lib/load.mjs";
import { runGate, routeSet, lanePools } from "../../build/gate.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SAMPLE = join(ROOT, "test", "fixtures", "content-sample");
const BAD = join(ROOT, "test", "fixtures", "content-bad");
/** FLAG-level rules by design (§10.7): the fixture reports the rule but the gate exits 0. */
const FLAG_RULES = new Set(["G11", "G17"]);

test("content-sample passes with 0 FAIL (FLAGs allowed) and the expected FLAGs are the known ones", () => {
  const r = runGate(loadContent(SAMPLE, { label: "sample" }), { phase: 1 });
  assert.equal(r.counts.FAIL, 0, r.findings.filter((f) => f.level === "FAIL").map((f) => `${f.file} ${f.rule} ${f.message}`).join("\n"));
  assert.ok(r.ok);
  assert.ok(r.findings.some((f) => f.rule === "G7" && f.level === "FLAG" && f.file === "texts/rudrashtadhyayi/2.json"), "unpublished chapter 2 is FLAGged");
  assert.ok(r.findings.some((f) => f.rule === "G13" && f.level === "FLAG"), "unmarked glossary terms are FLAGged once per file");
});

test("every content-bad fixture reports its rule (FAIL rules → ok:false; FLAG rules → FLAG present)", () => {
  const dirs = readdirSync(BAD).filter((d) => /^G\d+$/.test(d)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  assert.equal(dirs.length, 21, "one fixture per rule G1–G21");
  for (const d of dirs) {
    const r = runGate(loadContent(join(BAD, d), { label: d }), { phase: 1 });
    const hits = r.findings.filter((f) => f.rule === d);
    assert.ok(hits.length > 0, `${d}: no finding with rule ${d}; got ${r.findings.map((f) => f.rule + ":" + f.message).join(" | ")}`);
    if (FLAG_RULES.has(d)) assert.ok(hits.some((f) => f.level === "FLAG"), `${d} should FLAG`);
    else assert.ok(hits.some((f) => f.level === "FAIL") && !r.ok, `${d} should FAIL`);
  }
});

test("CLI: exit 0 on the sample, exit 3 on a bad fixture, gate.json written both times; parse error → exit 2", () => {
  const dist = mkdtempSync(join(tmpdir(), "pb-gate-"));
  const run = (args, env = {}) => spawnSync(process.execPath, ["build/gate.mjs", ...args], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DIST: dist, ...env } });
  let r = run([], { CONTENT_DIR: SAMPLE });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(join(dist, "_reports", "gate.json")));
  let report = JSON.parse(readFileSync(join(dist, "_reports", "gate.json"), "utf8"));
  assert.equal(report.counts.FAIL, 0);
  assert.ok(!/^FAIL/m.test(r.stdout), "no FAIL lines printed");
  rmSync(join(dist, "_reports"), { recursive: true, force: true });
  r = run(["--dir", join(BAD, "G19")]);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /^FAIL\s+mantras\/foundations\/vs-36-3\.json\s+G19\s+reproduce: false/m, "LEVEL  file  rule  message line");
  report = JSON.parse(readFileSync(join(dist, "_reports", "gate.json"), "utf8"));
  assert.ok(report.counts.FAIL >= 1 && report.findings.some((f) => f.rule === "G19"));
  // parse error: malformed JSON record → exit 2, gate.json still written
  const broken = mkdtempSync(join(tmpdir(), "pb-broken-"));
  writeFileSync(join(broken, "_fixture.json"), JSON.stringify({ base: SAMPLE.split("\\").join("/") }));
  mkdirSync(join(broken, "mantras", "foundations"), { recursive: true });
  writeFileSync(join(broken, "mantras", "foundations", "vs-36-3.json"), '{"id": "vs-36-3", "kind": }');
  rmSync(join(dist, "_reports"), { recursive: true, force: true });
  r = run(["--dir", broken]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /vs-36-3\.json:1:\d+/);
  assert.ok(existsSync(join(dist, "_reports", "gate.json")));
  rmSync(dist, { recursive: true, force: true });
  rmSync(broken, { recursive: true, force: true });
});

test("lane mode: unresolved cross-lane references are WARN, duplicates against a pool are FAIL, registries fall back", () => {
  const lane = mkdtempSync(join(tmpdir(), "pb-lane-"));
  mkdirSync(join(lane, "mantras", "shanti"), { recursive: true });
  mkdirSync(join(lane, "occasions", "shanti"), { recursive: true });
  const m = JSON.parse(readFileSync(join(SAMPLE, "mantras", "foundations", "vs-36-3.json"), "utf8"));
  // a new mantra of this lane
  writeFileSync(join(lane, "mantras", "shanti", "vs-16-41.json"), JSON.stringify({ ...m, id: "vs-16-41", locator: "VS 16.41", devanagari: "नमः शम्भवाय च मयोभवाय च ॥", svara: false, pada: [{ sa: "नमः", gloss: { hi: "नमन", en: "homage", bho: "परनाम" } }], tags: ["rudra"] }));
  const occ = JSON.parse(readFileSync(join(SAMPLE, "occasions", "marriage", "vivah.json"), "utf8"));
  occ.id = "rudrabhishek"; occ.code = "S01"; occ.group = "shanti"; occ.parts = []; occ.variants = [];
  occ.steps = [{ n: 1, layer: "vedic", action: occ.steps[2].action, mantraIds: ["vs-16-41", "vs-36-3"], panditSays: occ.steps[2].panditSays }];
  occ.textIds = ["rudrashtadhyayi"];
  occ.sources = ["ws-syv-16"];
  writeFileSync(join(lane, "occasions", "shanti", "rudrabhishek.json"), JSON.stringify(occ));
  const sampleData = loadContent(SAMPLE, { label: "sample" });
  const registries = loadContent(join(ROOT, "content"), { label: "content" });
  // pools: the sample corpus stands in for content/ and other lanes
  let r = runGate(loadContent(lane, { label: "lane-C" }), { phase: 1, lane: true, pools: [poolOf(sampleData)], registries });
  assert.equal(r.counts.FAIL, 0, r.findings.filter((f) => f.level === "FAIL").map((f) => `${f.rule} ${f.message}`).join("\n"));
  assert.equal(r.counts.WARN, 0, "vs-36-3 and rudrashtadhyayi exist in the pool → no WARN");
  // reference to an id that is in no pool → WARN, not FAIL
  occ.steps[0].mantraIds.push("vs-99-1");
  writeFileSync(join(lane, "occasions", "shanti", "rudrabhishek.json"), JSON.stringify(occ));
  r = runGate(loadContent(lane, { label: "lane-C" }), { phase: 1, lane: true, pools: [poolOf(sampleData)], registries });
  assert.equal(r.counts.FAIL, 0);
  assert.ok(r.findings.some((f) => f.level === "WARN" && f.rule === "G5" && /vs-99-1/.test(f.message)), JSON.stringify(r.findings));
  // without lane mode the same reference is a FAIL
  r = runGate(loadContent(lane, { label: "lane-C" }), { phase: 1, registries });
  assert.ok(r.findings.some((f) => f.level === "FAIL" && f.rule === "G5" && /vs-99-1/.test(f.message)));
  // duplicate id against a pool → FAIL G18
  writeFileSync(join(lane, "mantras", "shanti", "vs-36-3.json"), JSON.stringify(m));
  r = runGate(loadContent(lane, { label: "lane-C" }), { phase: 1, lane: true, pools: [poolOf(sampleData)], registries });
  assert.ok(r.findings.some((f) => f.level === "FAIL" && f.rule === "G18" && /vs-36-3.*also exists in sample/.test(f.message)), JSON.stringify(r.findings.filter((f) => f.rule === "G18")));
  rmSync(lane, { recursive: true, force: true });
});

test("lanePools() reads content/ as a pool and routeSet() lists only published chapter pages", () => {
  const { pools, registries } = lanePools(join(ROOT, "test", "fixtures", "content-sample"), { stagingRoot: join(ROOT, "no-such-staging") });
  assert.ok(registries && registries.termbank, "registries come from content/");
  assert.equal(pools.length, 1);
  const paths = routeSet(loadContent(SAMPLE));
  assert.ok(paths.has("occasions/vivah/") && paths.has("occasions/vivah/purvang/") && paths.has("texts/rudrashtadhyayi/1/") && paths.has("reference/sankalpa/") && paths.has("glossary/kalash/") && paths.has("learn/l0-01-purohit-kaun/") && paths.has("kathas/satyanarayan-vrat-katha/1/"));
  assert.ok(!paths.has("texts/rudrashtadhyayi/2/"), "unpublished chapter has no page");
});
