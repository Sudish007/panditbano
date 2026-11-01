// Devanagari helpers (design.md §7.2, §10.7 G3, §11.4, §14.3; decisions.md §4.1–4.2, §4.7).
// stripSvara removes the accent marks (after folding ꣳ/ꣴ to anusvara so it survives), isDevanagariOnly implements
// the G3 allow-list, joinDanda keeps । ॥ and the verse number glued to the preceding word, devaNormalise is the
// search normalisation shared byte-for-byte with assets/js/deva-norm.mjs.
import { devaNormalise } from "./deva-norm.mjs";
export { devaNormalise };

/** Svara / cantillation ranges: U+0951–0954, Vedic Extensions U+1CD0–1CFF, Devanagari Extended U+A8E0–A8FF. */
export const SVARA_RE = /[\u0951-\u0954\u1CD0-\u1CFF\uA8E0-\uA8FF]/g;
export const hasSvara = (s) => /[\u0951-\u0954\u1CD0-\u1CFF\uA8E0-\uA8FF]/.test(String(s ?? ""));

/** Remove svara marks; ꣳ (U+A8F3) and ꣴ (U+A8F4) become ं first so the anusvara is kept (decisions.md §4.2). */
export function stripSvara(text) {
  return String(text ?? "").replace(/\uA8F3|\uA8F4/g, "\u0902").replace(SVARA_RE, "");
}

/** Count of the two svara marks Tiro Devanagari Sanskrit lacks (design §10.9 FLAG). */
export function countFallbackSvara(text) {
  const m = String(text ?? "").match(/[\u0953\u0954]/g);
  return m ? m.length : 0;
}

/**
 * G3 allow-list: U+0900–097F (includes danda, avagraha, ॐ, digits, svara U+0951–0954), U+1CD0–1CFF, U+A8E0–A8FF,
 * ZWJ/ZWNJ, space, newline. `{`/`}` are allowed only when `placeholders` is true (panditSays.sa sankalpa blanks).
 * Returns { ok, bad: [{ ch, code, index }] } (first 10 offending characters).
 */
export function isDevanagariOnly(text, { placeholders = false } = {}) {
  const s = String(text ?? "");
  const bad = [];
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i);
    if (cp > 0xffff) i++;
    const ok =
      (cp >= 0x0900 && cp <= 0x097f) ||
      (cp >= 0x1cd0 && cp <= 0x1cff) ||
      (cp >= 0xa8e0 && cp <= 0xa8ff) ||
      cp === 0x200c || cp === 0x200d || cp === 0x20 || cp === 0x0a ||
      (placeholders && (cp === 0x7b || cp === 0x7d));
    if (placeholders) {
      if (cp === 0x7b) depth++;
      if (cp === 0x7d) depth--;
      if (depth < 0) bad.push({ ch: "}", code: "U+007D", index: i, message: "unbalanced placeholder" });
    }
    if (!ok && bad.length < 10) bad.push({ ch: String.fromCodePoint(cp), code: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), index: i });
  }
  if (placeholders && depth !== 0 && bad.length < 10) bad.push({ ch: "{", code: "U+007B", index: s.length, message: "unbalanced placeholder" });
  return { ok: bad.length === 0, bad };
}

const NBSP = "\u00A0";
/**
 * Join danda / double danda and the terminal verse number to the preceding word (design §7.2, decisions §4.7, §27 item 1).
 * Works on plain text or on rendered HTML of one verse. Devanagari: "word ।" → "word&nbsp;।"; the terminal
 * "॥ ३ ॥" (or "॥ 3 ॥") is wrapped in <span class="nb vn">…</span> with NBSPs inside. IAST: "|" and "||" likewise.
 * Never leaves a danda (or a bar) first on a line segment: a leading danda is glued to the preceding segment.
 */
export function joinDanda(text) {
  let s = String(text ?? "");
  // 1. a danda/bar that starts a line or segment → move it to the end of the previous segment
  s = s.replace(/(\S)[ \t]*(?:\n|<br\s*\/?>)[ \t]*([।॥]|\|{1,2})(?=\s|$|<)/g, `$1${NBSP}$2\n`);
  // 2. terminal verse markers "॥ ३ ॥" / "|| 3 ||" (optionally already preceded by a danda)
  s = s.replace(/[ \t\u00A0]*(॥)[ \t\u00A0]*([०-९0-9]+(?:[.-][०-९0-9]+)*)[ \t\u00A0]*(॥)(?=\s*(?:<|$))/g, `${NBSP}<span class="nb vn">$1${NBSP}$2${NBSP}$3</span>`);
  s = s.replace(/[ \t\u00A0]*(\|\|)[ \t\u00A0]*([0-9]+(?:[.-][0-9]+)*)[ \t\u00A0]*(\|\|)(?=\s*(?:<|$))/g, `${NBSP}<span class="nb vn">$1${NBSP}$2${NBSP}$3</span>`);
  // 3. every remaining danda / bar preceded by whitespace → NBSP
  s = s.replace(/[ \t]+([।॥])/g, `${NBSP}$1`);
  s = s.replace(/(\S)[ \t]+(\|{1,2})(?=\s|$|<)/g, `$1${NBSP}$2`);
  return s;
}

/** Split a verse into padas at । and ॥ keeping the danda at the end of its pada (design §27 item 1). */
export function splitPadas(text) {
  const out = [];
  // a terminal "॥ ३ ॥" marker belongs to the pada before it
  const s = String(text ?? "").replace(/॥\s*([०-९0-9]+(?:[.-][०-९0-9]+)*)\s*॥/g, "\uE010$1\uE010");
  const re = /[^।॥]*[।॥]+(?:\s*\uE010[^\uE010]*\uE010)?|[^।॥]+$/g;
  for (const m of s.matchAll(re)) {
    const seg = m[0].replace(/\uE010([^\uE010]*)\uE010/g, "॥ $1 ॥").trim();
    if (seg) out.push(seg);
  }
  return out;
}

/** Devanagari digits for hi/bho verse markers; ASCII for en (design §27 item 1). */
export function digitsFor(n, lang) {
  const s = String(n);
  return lang === "en" ? s : s.replace(/[0-9]/g, (d) => String.fromCharCode(0x0966 + Number(d)));
}
