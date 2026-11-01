// Svara-marks recognition table (design.md §4.7, mock d2/learn.html; FEAT-108): embedded on every Level 1 lesson. One row
// per mark — sign (in the mantra face at 1.5 × body / 1.9 — site.css .marks), name, how it is spoken, an example syllable,
// and a ▶ listen button per row (voice.mjs speaks the row's data-plain; the button stays hidden without speechSynthesis).
// Every example is a Devanagari string with lang="sa"; the row text comes from the UI strings (no content record).
import { html, raw, t, icon } from "../lib.mjs";
import { ariaPlain } from "../../lib/translit.mjs";

/** The five marks of the Madhyandina text as shown on this site (design §27 item 5 legend uses the same glyphs). */
export const MARKS = [
  { id: "udatta", sign: "क", example: "तत्" },
  { id: "anudatta", sign: "क॒", example: "वि॒" },
  { id: "svarita", sign: "क॑", example: "स॑" },
  { id: "dvisvarita", sign: "क᳚", example: "ग॒णानां᳚" },
  { id: "anunasika", sign: "तिँ", example: "ग॒णप॑तिँ" },
];

export function marksTable(lang, { id = "marks" } = {}) {
  const rows = MARKS.map((m, i) => {
    const mid = `${id}-${m.id}`;
    const plain = ariaPlain(m.example);
    return html`<tr>
<td><span class="mantra" lang="sa">${m.sign}</span></td>
<td>${t(lang, `learn.marks_${m.id}`)}</td>
<td>${t(lang, `learn.marks_${m.id}_how`)}</td>
<td><span class="mantra" lang="sa" id="${mid}" data-plain="${plain}">${m.example}</span></td>
<td><button class="btn btn-ghost btn-icon" type="button" data-listen="${mid}" aria-pressed="false" aria-label="${t(lang, "voice.aria_title", { title: plain })}" data-l-play="${t(lang, "voice.listen")}" data-l-stop="${t(lang, "voice.stop")}" hidden>${icon("i-play")}</button></td>
</tr>`;
  });
  return html`<section class="card marks-card" id="${id}" aria-labelledby="h-${id}">
<h2 id="h-${id}">${t(lang, "learn.marks_heading")}</h2>
<div class="table-wrap"><table class="marks">
<thead><tr><th scope="col">${t(lang, "learn.marks_sign")}</th><th scope="col">${t(lang, "learn.marks_name")}</th><th scope="col">${t(lang, "learn.marks_how")}</th><th scope="col">${t(lang, "learn.marks_example")}</th><th scope="col"><span class="sr">${t(lang, "learn.marks_listen")}</span></th></tr></thead>
<tbody>${raw(rows.map(String).join(""))}</tbody>
</table></div>
<p class="meta m0">${t(lang, "learn.marks_note")}</p>
</section>`;
}
