// Transliteration (design.md §11.4; decisions.md §4.2–4.3). Devanagari is the single source of truth: IAST is
// derived with @indic-transliteration/sanscript after stripSvara, easy Roman is derived from IAST by the fixed table.
// toIAST throws (with the record id and the code point) when a character outside the IAST set survives conversion.
import Sanscript from "@indic-transliteration/sanscript";
import { stripSvara } from "./deva.mjs";

const S = Sanscript.default ?? Sanscript;

/**
 * Hindi/Awadhi nukta consonants (not Sanskrit; `lang: "hi" | "awa"` texts) → the usual Roman letters. The nukta
 * letter is reduced to its base consonant and a private-use marker is placed after the following vowel sign /
 * virama; after sanscript the Latin consonant before the marker is rewritten (क़→q ख़→kh ग़→g ज़→z ड़→ṛ ढ़→ṛh फ़→f).
 */
const NUKTA_MARK = {
  "\u0915": ["\uE001", "q"], "\u0916": ["\uE002", "kh"], "\u0917": ["\uE003", "g"], "\u091C": ["\uE004", "z"],
  "\u0921": ["\uE005", "\u1E5B"], "\u0922": ["\uE006", "\u1E5Bh"], "\u092B": ["\uE007", "f"],
};
const PRECOMPOSED = { "\u0958": "\u0915", "\u0959": "\u0916", "\u095A": "\u0917", "\u095B": "\u091C", "\u095C": "\u0921", "\u095D": "\u0922", "\u095E": "\u092B" };
const NUKTA_RE = /([\u0915\u0916\u0917\u091C\u0921\u0922\u092B])\u093C([\u093E-\u094C\u094D]?)/g;
const NUKTA_POST = /(kh|ḍh|ph|[kgjḍ])((?:ai|au|[aāiīuūeoṛṝḷ])?)([\uE001-\uE007])/g;
const MARK_TO_LATIN = Object.fromEntries(Object.values(NUKTA_MARK));

/** Everything sanscript may legitimately emit for Sanskrit/Hindi verse text, plus the punctuation we keep. */
const IAST_OK = /^[a-zA-Z\u0101\u012B\u016B\u1E5B\u1E5D\u1E37\u1E39\u1E43\u1E41\u1E25\u1E45\u00F1\u1E47\u1E6D\u1E0D\u015B\u1E63\u1E3B0-9\s|'\u2019.,;:!?\-\u2013\u2014()\[\]{}"\u201C\u201D\u00A0]*$/u;

/**
 * Devanagari → IAST. Steps: fold ꣳ/ꣴ → ं and strip svara; drop ZWJ/ZWNJ (sanscript mis-reads श+ZWJ+ृ); chandrabindu
 * → anusvara (IAST has no candrabindu sign in ritual text); nukta consonants (hi/awa texts) → Roman; sanscript;
 * post-rules: ओ३म् → oṁ, ळ → ḻ, "|"/"||"/"'" come from sanscript itself (। ॥ ऽ), stray combining marks removed.
 */
export function toIAST(devanagari, id = "?") {
  let s = stripSvara(devanagari).replace(/[\u200C\u200D]/g, "").replace(/\u0901/g, "\u0902");
  s = s.replace(/[\u0958-\u095E]/g, (c) => (PRECOMPOSED[c] ? PRECOMPOSED[c] + "\u093C" : c));
  s = s.replace(NUKTA_RE, (_, base, sign) => base + sign + NUKTA_MARK[base][0]);
  let out = S.t(s, "devanagari", "iast");
  out = out.replace(NUKTA_POST, (_, cons, vowel, mark) => MARK_TO_LATIN[mark] + vowel);
  out = out.replace(/o3m/g, "o\u1E41"); // ओ३म् (pluta)
  out = out.replace(/l\u0324/g, "\u1E3B"); // ळ → ḻ (Vedic)
  out = out.replace(/\u0310/g, "\u1E43"); // a combining candrabindu that slipped through → ṃ
  out = out.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  if (!IAST_OK.test(out)) {
    const bad = [...out].find((c) => !IAST_OK.test(c));
    const cp = bad ? bad.codePointAt(0) : 0;
    throw new Error(`translit: record ${id}: character outside the IAST set after conversion: "${bad}" U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return out;
}

/** decisions.md §4.3 table: ā→aa, ī→ee, ū→oo, ṛ→ri, ṝ→ree, ḷ→li, ḹ→lee, ṃ/ṁ→m, ḥ→h, ṅ/ñ/ṇ→n, ṭ→t, ḍ→d, ś/ṣ→sh, c→ch, ch→chh. */
const EASY = [
  ["\u0101", "aa"], ["\u012B", "ee"], ["\u016B", "oo"],
  ["\u1E5D", "ree"], ["\u1E5B", "ri"], ["\u1E39", "lee"], ["\u1E37", "li"],
  ["\u1E43", "m"], ["\u1E41", "m"], ["\u1E25", "h"],
  ["\u1E45", "n"], ["\u00F1", "n"], ["\u1E47", "n"],
  ["\u1E6D", "t"], ["\u1E0D", "d"], ["\u015B", "sh"], ["\u1E63", "sh"], ["\u1E3B", "l"],
];
export function toEasy(iast) {
  let s = String(iast ?? "");
  s = s.replace(/ch|c/g, (m) => (m === "ch" ? "chh" : "ch"));
  s = s.replace(/Ch|C/g, (m) => (m === "Ch" ? "Chh" : "Ch"));
  for (const [from, to] of EASY) s = s.split(from).join(to).split(from.toUpperCase()).join(to.charAt(0).toUpperCase() + to.slice(1));
  return s;
}

/** Plain, svara-less Devanagari for aria / screen readers (design §7.1 `data-plain`). */
export function ariaPlain(devanagari) {
  return stripSvara(devanagari).replace(/[\u200C\u200D]/g, "").replace(/\s+/g, " ").trim();
}
