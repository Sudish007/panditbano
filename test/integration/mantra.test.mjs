// FEAT-110: every <p class="mantra"> in dist/ carries a lang attribute and a data-plain copy; when the text carries svara
// marks the accented .deva is aria-hidden and a svara-less .sr twin follows (design §7.1/§7.3 as amended by design-review
// MEDIUM 4 — see docs/design.md "FEAT-105 · the mantra paragraph carries no aria-label"); without svara there is no .sr.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pages, attr } from "./_dist.mjs";

const SVARA = /[\u0951-\u0954\u1CD0-\u1CFF\uA8E0-\uA8F1]/;
const MANTRA_OPEN = /<p class="mantra(?:\s[^"]*)?"[^>]*>/g;

test("every p.mantra has lang and data-plain; .sr iff the Devanagari carries svara marks", () => {
  let n = 0, svara = 0;
  const bad = [];
  for (const p of pages()) {
    for (const m of p.html.matchAll(MANTRA_OPEN)) {
      n++;
      const open = m[0];
      const end = p.html.indexOf("</p>", m.index);
      const body = p.html.slice(m.index + open.length, end);
      const lang = attr(open, "lang");
      if (!lang) bad.push(`${p.href}: ${open.slice(0, 80)} — no lang`);
      if (attr(open, "data-plain") === null) bad.push(`${p.href}: ${open.slice(0, 80)} — no data-plain`);
      const deva = /<span class="deva"([^>]*)>/.exec(body);
      if (!deva) { bad.push(`${p.href}: ${open.slice(0, 80)} — no .deva`); continue; }
      const hasSr = body.includes('<span class="sr"');
      const accented = SVARA.test(body);
      if (accented) {
        svara++;
        if (!/aria-hidden="true"/.test(deva[1])) bad.push(`${p.href}: ${attr(open, "id")} — svara text without aria-hidden .deva`);
        if (!hasSr) bad.push(`${p.href}: ${attr(open, "id")} — svara text without .sr twin`);
        else if (SVARA.test(body.slice(body.indexOf('<span class="sr"')))) bad.push(`${p.href}: ${attr(open, "id")} — .sr still carries svara marks`);
      } else {
        if (hasSr) bad.push(`${p.href}: ${attr(open, "id")} — .sr without svara`);
        if (/aria-hidden="true"/.test(deva[1])) bad.push(`${p.href}: ${attr(open, "id")} — plain text hidden from the accessibility tree`);
      }
    }
  }
  assert.deepEqual(bad.slice(0, 20), [], `${bad.length} mantra block(s) malformed`);
  console.log(`mantra blocks: ${n} (${svara} with svara)`);
});

test("every IAST line is lang=\"sa-Latn\" (WCAG 3.1.2; design §18)", () => {
  for (const p of pages()) {
    for (const m of p.html.matchAll(/<p class="iast"[^>]*>/g)) assert.equal(attr(m[0], "lang"), "sa-Latn", `${p.href}: ${m[0]}`);
  }
});
