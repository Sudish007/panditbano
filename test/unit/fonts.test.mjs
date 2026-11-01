// FEAT-101: fonts, sprite and motif invariants (design.md §6.3, §5.2, §22, §23).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FONTS = join(ROOT, "fonts");
const ASSETS = join(ROOT, "assets");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const woff2 = walk(FONTS).filter((p) => p.endsWith(".woff2"));

const BUDGETS = [
  [/^TiroDevanagariSanskrit-/, 230 * 1024],
  [/^NotoSansDevanagari-/, 70 * 1024],
  [/^NotoSans-/, 40 * 1024],
];
const TOTAL_BUDGET = 450 * 1024;

test("five woff2 faces exist", () => {
  const names = woff2.map((p) => basename(p)).sort();
  assert.deepEqual(names, [
    "NotoSans-Regular.woff2",
    "NotoSans-SemiBold.woff2",
    "NotoSansDevanagari-Regular.woff2",
    "NotoSansDevanagari-SemiBold.woff2",
    "TiroDevanagariSanskrit-Regular.woff2",
  ]);
});

test("every woff2 has a sibling OFL.txt", () => {
  for (const p of woff2) {
    const ofl = join(dirname(p), "OFL.txt");
    assert.ok(existsSync(ofl), `missing ${ofl}`);
    const text = readFileSync(ofl, "utf8");
    assert.match(text, /SIL OPEN FONT LICENSE Version 1\.1/, `${ofl} is not the OFL 1.1 text`);
  }
});

test("two unsubset TTF statics exist for the OG renderer", () => {
  for (const rel of ["noto-sans-devanagari/src/NotoSansDevanagari-SemiBold.ttf", "noto-sans/src/NotoSans-SemiBold.ttf"]) {
    const p = join(FONTS, rel);
    assert.ok(existsSync(p), `missing ${rel}`);
    assert.ok(statSync(p).size > 100 * 1024, `${rel} looks subset (too small)`);
  }
});

test("woff2 sizes are within budget", () => {
  let total = 0;
  for (const p of woff2) {
    const size = statSync(p).size;
    total += size;
    const rule = BUDGETS.find(([re]) => re.test(basename(p)));
    assert.ok(rule, `no budget rule for ${basename(p)}`);
    assert.ok(size <= rule[1], `${basename(p)} is ${size} B > ${rule[1]} B`);
  }
  assert.ok(total <= TOTAL_BUDGET, `total woff2 ${total} B > ${TOTAL_BUDGET} B`);
});

const sprite = readFileSync(join(ASSETS, "sprite.svg"), "utf8");
const spriteIds = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
const motifs = readFileSync(join(ASSETS, "MOTIFS.md"), "utf8");
const motifIds = [...motifs.matchAll(/^\| `([im]-[a-z0-9-]+)` \|/gm)].map((m) => m[1]);

test("sprite has the mock symbols plus i-ext, i-auto, m-jaali and unique ids", () => {
  for (const id of ["i-search", "i-sun", "i-moon", "i-om", "m-kalash", "m-diya", "m-jaali", "i-ext", "i-auto"]) {
    assert.ok(spriteIds.includes(id), `sprite lacks #${id}`);
  }
  assert.equal(new Set(spriteIds).size, spriteIds.length, "duplicate symbol ids");
  assert.ok(spriteIds.length >= 29, `expected >= 29 symbols, got ${spriteIds.length}`);
});

test("MOTIFS.md lists every sprite symbol and vice versa", () => {
  const a = [...spriteIds].sort();
  const b = [...new Set(motifIds)].sort();
  assert.deepEqual(a, b);
});

test("no symbol id names a deity", () => {
  const banned = ["deity", "ganesh", "shiva", "devi", "murti"];
  for (const id of spriteIds) {
    for (const w of banned) assert.ok(!id.toLowerCase().includes(w), `#${id} contains "${w}"`);
  }
});

test("sprite is decorative and single-colour", () => {
  assert.match(sprite, /aria-hidden="true"/);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(sprite.replace(/<!--[\s\S]*?-->/g, "")), "sprite contains a colour literal");
});

test("icon assets exist", () => {
  for (const rel of ["icon.svg", "og-template.svg", "icons/favicon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "dev/fonts.html"]) {
    assert.ok(existsSync(join(ASSETS, rel)), `missing assets/${rel}`);
  }
  const og = readFileSync(join(ASSETS, "og-template.svg"), "utf8");
  assert.match(og, /width="1200" height="630"/);
  assert.ok(!/<text\b/.test(og), "og-template.svg must carry no text (sharp composites it)");
});
