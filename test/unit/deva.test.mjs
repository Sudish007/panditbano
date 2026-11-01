// FEAT-104: Devanagari helpers — stripSvara, isDevanagariOnly (G3 allow-list), joinDanda, splitPadas, devaNormalise and the
// byte-identical client copy (design §7.2, §10.7, §14.3, §27 item 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripSvara, hasSvara, isDevanagariOnly, joinDanda, splitPadas, devaNormalise, countFallbackSvara, digitsFor } from "../../build/lib/deva.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("stripSvara removes U+0951–0954, U+1CD0–1CFF, U+A8E0–A8FF and keeps the anusvara of ꣳ", () => {
  assert.equal(stripSvara("तत्स॑वि॒तुर्वरे॑ण्यं॒"), "तत्सवितुर्वरेण्यं");
  assert.equal(stripSvara("हिꣳसीः ग॒णानां᳚"), "हिंसीः गणानां");
  assert.equal(stripSvara("अ॓ आ॔"), "अ आ");
  assert.ok(hasSvara("नः॑") && !hasSvara("नः"));
  assert.equal(countFallbackSvara("अ॓ आ॔ इ॓"), 3);
});

test("isDevanagariOnly: the G3 allow-list", () => {
  assert.ok(isDevanagariOnly("ॐ भूर्भुवः॒ स्वः॒ । धियो॒ यो नः॑ प्रचो॒दया॑त् ॥ ३ ॥ सोऽहम् ꣳ ᳚\u200cक\u200d\n").ok);
  const r = isDevanagariOnly("नमः S शिवाय | x");
  assert.ok(!r.ok);
  assert.deepEqual(r.bad.map((b) => b.code), ["U+0053", "U+007C", "U+0078"]);
  assert.ok(!isDevanagariOnly("नमः…").ok, "ellipsis U+2026 is not allowed");
  assert.ok(!isDevanagariOnly("नमः\u00a0शिवाय").ok, "NBSP is not allowed in the source field");
  assert.ok(isDevanagariOnly("{गोत्र} गोत्रः {नाम}", { placeholders: true }).ok);
  assert.ok(!isDevanagariOnly("{गोत्र} गोत्रः").ok, "placeholders only where allowed");
  assert.ok(!isDevanagariOnly("{गोत्र गोत्रः", { placeholders: true }).ok, "unbalanced placeholder");
});

test("joinDanda glues । ॥ and the verse number to the preceding word and never leaves a danda first on a line", () => {
  assert.equal(joinDanda("भूर्भुवः स्वः । धियो यो नः प्रचोदयात् ॥ ३ ॥"), 'भूर्भुवः स्वः\u00a0। धियो यो नः प्रचोदयात्\u00a0<span class="nb vn">॥\u00a0३\u00a0॥</span>');
  assert.equal(joinDanda("bhūrbhuvaḥ svaḥ | dhiyo yo naḥ pracodayāt || 3 ||"), 'bhūrbhuvaḥ svaḥ\u00a0| dhiyo yo naḥ pracodayāt\u00a0<span class="nb vn">||\u00a03\u00a0||</span>');
  const lines = [
    "तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥",
    "word\n। next",
    "pada one |\n|| 12 ||",
    "क ख<br>॥ ग",
    "a । b ॥ c",
  ];
  for (const l of lines) {
    const out = joinDanda(l);
    for (const seg of out.split(/\n|<br\s*\/?>/)) assert.ok(!/^\s*(<span class="nb vn">)?\s*([।॥]|\|{1,2})/.test(seg), `segment starts with a danda: ${JSON.stringify(seg)} from ${JSON.stringify(l)}`);
    assert.ok(!/ [।॥|]/.test(out.replace(/<[^>]+>/g, "")), `plain space before a danda in ${JSON.stringify(out)}`);
  }
});

test("splitPadas breaks at । and ॥ keeping the danda (and the verse marker) with its pada (§27 item 1)", () => {
  assert.deepEqual(splitPadas("भूर्भुवः स्वः । तत्सवितुर्वरेण्यं ॥ ३ ॥"), ["भूर्भुवः स्वः ।", "तत्सवितुर्वरेण्यं ॥ ३ ॥"]);
  assert.deepEqual(splitPadas("ॐ नमः शिवाय"), ["ॐ नमः शिवाय"]);
  assert.deepEqual(splitPadas("क । ख । ग ॥"), ["क ।", "ख ।", "ग ॥"]);
  for (const p of splitPadas("क । ख ॥ १२ ॥")) assert.ok(!/^[।॥]/.test(p));
  assert.equal(digitsFor(3, "hi"), "३");
  assert.equal(digitsFor(12, "bho"), "१२");
  assert.equal(digitsFor(3, "en"), "3");
});

test("devaNormalise applies the §14.3 rules", () => {
  assert.equal(devaNormalise("पण्डित सङ्कल्प मन्त्र सम्बन्ध"), "पंडित संकल्प मंत्र संबंध");
  assert.equal(devaNormalise("ज़रूरी फ़ोन ड़ ख़"), "जरूरी फोन ड ख");
  assert.equal(devaNormalise("हँस"), "हंस");
  assert.equal(devaNormalise("नमः"), "नमः", "visarga kept");
  assert.equal(devaNormalise("श\u200dृणु॒याम॑ ॥ १२ ॥"), "शृणुयाम 12");
  assert.equal(devaNormalise("हिꣳसीः"), "हिंसीः");
  assert.equal(devaNormalise("  Śrāddha   ABC "), "śrāddha abc");
  assert.equal(devaNormalise("अन्न"), "अन्न", "nasal + same nasal is not folded");
});

test("build/lib/deva-norm.mjs and assets/js/deva-norm.mjs are byte-identical", () => {
  const a = readFileSync(join(ROOT, "build", "lib", "deva-norm.mjs"));
  const b = readFileSync(join(ROOT, "assets", "js", "deva-norm.mjs"));
  assert.ok(a.equals(b), "the two copies differ — copy one over the other");
});
