// FEAT-104: transliteration (design §11.4; decisions §4.2–4.3) — fixture round trip, post-rules, unmapped character throws.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { toIAST, toEasy, ariaPlain } from "../../build/lib/translit.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIX = JSON.parse(readFileSync(join(ROOT, "test", "fixtures", "translit.json"), "utf8"));

test("fixture has 40 lines including the named ones and every line round-trips", () => {
  assert.equal(FIX.lines.length, 40);
  for (const id of ["vs-36-3", "vs-16-1", "pgs-1-8-8", "skanda-reva-233-1", "ganapati-accent-1"]) assert.ok(FIX.lines.some((l) => l.id === id), id);
  for (const l of FIX.lines) {
    const iast = toIAST(l.devanagari, l.id);
    assert.equal(iast, l.iast, `${l.id} IAST`);
    assert.equal(toEasy(iast), l.easy, `${l.id} easy`);
  }
});

test("svara marks are stripped, ꣳ/ँ become ṃ, ZWJ does not break श+ृ, ओ३म् → oṁ, ळ → ḻ", () => {
  assert.equal(toIAST("भूर्भुवः॒ स्वः॒ तत्स॑वि॒तुर्वरे॑ण्यं॒"), "bhūrbhuvaḥ svaḥ tatsaviturvareṇyaṃ");
  assert.equal(toIAST("हिꣳसीः गणपतिँ"), "hiṃsīḥ gaṇapatiṃ");
  assert.equal(toIAST("श\u200dृणुयाम"), "śṛṇuyāma");
  assert.equal(toIAST("ओ३म्"), "oṁ");
  assert.equal(toIAST("ॐ"), "oṃ");
  assert.equal(toIAST("मीळ्हुष्टमाय"), "mīḻhuṣṭamāya");
  assert.equal(toIAST("भगोऽर्यमा । ॥"), "bhago'ryamā | ||");
  assert.equal(toIAST("ग॒णानां᳚ त्वा"), "gaṇānāṃ tvā", "Vedic extension U+1CDA is stripped");
});

test("easy-Roman table of decisions §4.3", () => {
  assert.equal(toEasy("ā ī ū ṛ ṝ ḷ ḹ ṃ ṁ ḥ ṅ ñ ṇ ṭ ḍ ś ṣ"), "aa ee oo ri ree li lee m m h n n n t d sh sh");
  assert.equal(toEasy("ca cha"), "cha chha");
  assert.equal(toEasy("ai au"), "ai au");
  assert.equal(toEasy("pracodayāt | icchāmaḥ"), "prachodayaat | ichchhaamah");
});

test("a character outside the IAST set throws with the record id and code point", () => {
  assert.throws(() => toIAST("ऑफ़िस", "rec-1"), /rec-1.*U\+0911/);
  assert.throws(() => toIAST("नमः ★", "rec-2"), /rec-2.*U\+2605/);
});

test("Hindi nukta letters (hi/awa texts) map to plain Roman letters", () => {
  assert.equal(toIAST("ज़रूरत फ़ोन पढ़ना"), "zarūrata fona paṛhanā");
});

test("ariaPlain is the svara-less single-line Devanagari", () => {
  assert.equal(ariaPlain("धियो॒ यो नः॑\nप्रचो॒दया॑त्"), "धियो यो नः प्रचोदयात्");
});
