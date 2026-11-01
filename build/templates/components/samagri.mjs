// Samagri checklist card (design.md §4.3, §12 checklist, §15 print; FEAT-106). Right rail of the occasion and katha pages:
// a <details class="rail-fold"> (folded on phones, opened by app.mjs at ≥ 1024) with real 24-px checkboxes in 44-px rows, a
// quantity column, the "आवश्यक" marker, the item note, the optional purchase-search link (rel="external noopener nofollow",
// hosts allow-listed by the validator), the storage note, and Print + Clear buttons — Clear carries no motif (R4 §8.2).
// checklist.mjs persists the ticks under pb-check:<occasionId> and asks confirm() with data-l-confirm before clearing.
import { html, t, icon, extLink, num } from "../lib.mjs";

export function samagriCard(ctx, lang, occ, { id = "samagri" } = {}) {
  const items = occ.samagri || [];
  return html`<details class="rail-fold card samagri" id="${id}" data-checklist="${occ.id}" data-l-confirm="${t(lang, "samagri.clear_confirm")}">
<summary><h2 class="rail-h">${t(lang, "samagri.title")} · ${t(lang, "samagri.count", { n: num(items.length) })}</h2></summary>
<ul class="check">${items.map((s) => html`<li><input type="checkbox" id="sg-${occ.id}-${s.id}" data-item="${s.id}"><div class="item"><label for="sg-${occ.id}-${s.id}"><span class="name">${s.item[lang]}${s.must ? html` <span class="chip chip-haldi">${t(lang, "samagri.must")}</span>` : ""}</span><span class="qty"><span class="sr">${t(lang, "samagri.qty")}: </span>${s.qty}</span></label>${s.note && s.note[lang] ? html`<p class="small note">${s.note[lang]}</p>` : ""}${s.searchUrl ? html`<p class="small">${extLink(lang, s.searchUrl, t(lang, "samagri.search"), { rel: "external noopener nofollow" })}</p>` : ""}</div></li>`)}</ul>
<p class="small storage-note">${t(lang, "storage.note")}</p>
<div class="toolbar"><button class="btn" type="button" data-print-samagri>${icon("i-print")}${t(lang, "samagri.print")}</button><button class="btn" type="button" data-clear-checks>${t(lang, "samagri.clear")}</button></div>
</details>`;
}
