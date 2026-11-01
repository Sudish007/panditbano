// Devanagari search normalisation (design.md §14.3). Shared verbatim between the build (build/lib/deva-norm.mjs)
// and the client (assets/js/deva-norm.mjs); test/unit/deva.test.mjs asserts the two copies are byte-identical.
// Rules: NFC; strip svara and Vedic marks; nukta-insensitive; chandrabindu → anusvara; visarga kept; anusvara and
// pancham-varna conjunct folded (ङ्क→ंक, ञ्च→ंच, ण्ट→ंट, न्त→ंत, म्प→ंप and the aspirated partners); ZWJ/ZWNJ removed;
// danda removed; Devanagari digits → ASCII; Latin lower-cased; whitespace collapsed.
const NUKTA = { "\u0958": "\u0915", "\u0959": "\u0916", "\u095A": "\u0917", "\u095B": "\u091C", "\u095C": "\u0921", "\u095D": "\u0922", "\u095E": "\u092B", "\u095F": "\u092F" };
const PANCHAM = [
  ["\u0919\u094D([\u0915-\u0918])", "\u0902$1"], // ङ् + क ख ग घ
  ["\u091E\u094D([\u091A-\u091D])", "\u0902$1"], // ञ् + च छ ज झ
  ["\u0923\u094D([\u091F-\u0922])", "\u0902$1"], // ण् + ट ठ ड ढ
  ["\u0928\u094D([\u0924-\u0927])", "\u0902$1"], // न् + त थ द ध
  ["\u092E\u094D([\u092A-\u092D])", "\u0902$1"], // म् + प फ ब भ
].map(([re, to]) => [new RegExp(re, "g"), to]);
export function devaNormalise(input) {
  let s = String(input ?? "").normalize("NFC");
  s = s.replace(/\uA8F3|\uA8F4/g, "\u0902"); // Yajurvedic ꣳ ꣴ → anusvara before the marks are stripped
  s = s.replace(/[\u0951-\u0954\u1CD0-\u1CFF\uA8E0-\uA8FF]/g, "");
  s = s.replace(/[\u0958-\u095F]/g, (c) => NUKTA[c]).replace(/\u093C/g, "");
  s = s.replace(/\u0901/g, "\u0902");
  for (const [re, to] of PANCHAM) s = s.replace(re, to);
  s = s.replace(/[\u200C\u200D]/g, "");
  s = s.replace(/[\u0964\u0965]/g, " ");
  s = s.replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966));
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
export default devaNormalise;
