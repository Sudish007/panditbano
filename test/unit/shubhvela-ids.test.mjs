// FEAT-104: content/shubhvela-ids.json (design §16.1; design-review MEDIUM 1) — 14 engine muhurat ids, 102 festival slugs,
// 12 vrat slugs, a copy date and the Shubhvela git hash; vratSlug() replicates web/src/data/vrats.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vratSlug, parseVratFamilies } from "../../tools/shubhvela-ids.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ids = JSON.parse(readFileSync(join(ROOT, "content", "shubhvela-ids.json"), "utf8"));

test("file has 14 muhurat ids, 102 festival slugs, 12 vrat slugs, a copied date and a git hash", () => {
  assert.equal(ids.muhurat.length, 14);
  assert.equal(ids.festivals.length, 102);
  assert.equal(ids.vrats.length, 12);
  assert.match(ids.copied, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(ids.from, /^[0-9a-f]{7,40}$/);
  for (const list of [ids.muhurat, ids.festivals, ids.vrats]) {
    assert.equal(new Set(list).size, list.length, "unique");
    for (const id of list) assert.match(id, /^[a-z0-9][a-z0-9-]*$/, id);
  }
});

test("the ids are the engine's bare ids (marriage, not muhurat-marriage) and the known slugs", () => {
  assert.ok(ids.muhurat.includes("marriage") && ids.muhurat.includes("griha-pravesh") && ids.muhurat.includes("mundan") && ids.muhurat.includes("naamkaran") && ids.muhurat.includes("vrat-start"));
  assert.ok(!ids.muhurat.some((x) => x.startsWith("muhurat-")));
  for (const s of ["diwali", "chaitra-navratri", "pitru-paksha", "tulsi-vivah", "chhath-puja", "makar-sankranti"]) assert.ok(ids.festivals.includes(s), s);
  assert.deepEqual(ids.vrats, ["ekadashi", "pradosh", "sankashti", "vinayaka-chaturthi", "masik-shivaratri", "purnima", "amavasya", "karwa-chauth", "chhath", "teej", "navratri", "satyanarayan"]);
});

test("vratSlug() camelCase → kebab-case; parseVratFamilies() reads the TS const", () => {
  assert.equal(vratSlug("vinayakaChaturthi"), "vinayaka-chaturthi");
  assert.equal(vratSlug("masikShivaratri"), "masik-shivaratri");
  assert.equal(vratSlug("ekadashi"), "ekadashi");
  assert.deepEqual(parseVratFamilies("export const VRAT_FAMILIES = [\n  'a',\n  'bC',\n] as const;"), ["a", "bC"]);
  assert.throws(() => parseVratFamilies("nothing"), /VRAT_FAMILIES/);
});
