// Mantra page (design.md §4.4 — the Gayatri mock; §7; §27 items 1, 4, 5; FEAT-105). Three-rail layout: left rail = the
// mantra's corpus group list; content = verse block + source line beside the word-split card (.verse-row at ≥ 1920),
// meaning/explanation, vinyog, variants, #sources; right rail = reading settings, svara legend (when the text carries
// svara marks) and the group neighbours. No pagination bar anywhere (§27 item 4).
import { html, raw, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { verseBlock, padaCard, meaningSection, vinyogCard, variantsSection, sourceLine, sourcesSection, svaraLegend, kindChip, mdContext } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { mantraGroups, groupKey, incipit } from "./mantras-index.mjs";

const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

function groupRail(ctx, lang, rec, group) {
  const R = ctx.R;
  return html`<aside class="rail rail-left">
<details class="rail-fold card"><summary><h2 class="rail-h">${group.label} · ${t(lang, "counts.mantras", { n: num(group.items.length) })}</h2></summary>
<nav aria-label="${t(lang, "mantras.in_group")}"><ol>${group.items.map((m, i) => html`<li><a href="${R.href(`${lang}/mantras/${m.id}/`)}"${m.id === rec.id ? raw(' aria-current="page"') : ""}><span class="n">${i + 1}</span>${m.title?.[lang] ? html`<span class="t">${m.title[lang]}</span>` : html`<span class="t inc" lang="sa">${incipit(m, 32)}</span>`}</a></li>`)}</ol></nav>
</details>
</aside>`;
}

function neighbours(ctx, lang, rec, group) {
  const i = group.items.findIndex((m) => m.id === rec.id);
  const prev = i > 0 ? group.items[i - 1] : null;
  const next = i >= 0 && i < group.items.length - 1 ? group.items[i + 1] : null;
  if (!prev && !next) return "";
  const R = ctx.R;
  const link = (m, label) => html`<li><a href="${R.href(`${lang}/mantras/${m.id}/`)}"${raw(label === "prev" ? ' rel="prev"' : ' rel="next"')}><span class="n">${label === "prev" ? "←" : "→"}</span><span class="t">${m.title?.[lang] || m.id}</span></a></li>`;
  return html`<div class="card"><h2 class="rail-h">${t(lang, "mantras.neighbours")}</h2><nav aria-label="${t(lang, "mantras.neighbours")}"><ul>${prev ? link(prev, "prev") : ""}${next ? link(next, "next") : ""}<li><a href="${R.href(`${lang}/mantras/#g-${groupKey(rec)}`)}"><span class="n">≡</span><span class="t">${t(lang, "mantras.all")}</span></a></li></ul></nav></div>`;
}

export function mantraBody(ctx, { lang, rec, mantras, derived, occasionsById, sources }) {
  const groups = mantraGroups(mantras, lang);
  const group = groups.find((g) => g.key === groupKey(rec)) || { key: groupKey(rec), label: "", items: [rec] };
  const mdCtx = mdContext(ctx, lang, derived);
  return html`<div class="page-head">
<div><h1>${rec.title?.[lang] || rec.id}</h1>
<p class="meta">${kindChip(rec, lang)}${rec.locator ? html`<span>${rec.locator}</span>` : ""}${rec.svara === true ? "" : html`<span>${t(lang, "svara.off")}</span>`}</p></div>
</div>
<div class="layout has-both">
${groupRail(ctx, lang, rec, group)}
<div class="stack">
<div class="verse-row">
<div>${verseBlock(rec, lang)}${sourceLine(rec, lang, { sources })}</div>
${padaCard(rec, lang)}
</div>
${meaningSection(rec, lang, mdCtx)}
${vinyogCard(rec, lang, { ctx, occasionsById, mdCtx })}
${variantsSection(rec, lang, { sources, mdCtx })}
${sourcesSection([rec], lang, { sources })}
</div>
<aside class="rail rail-right">
${readingSettings(ctx, lang)}
${rec.svara === true ? svaraLegend(lang) : ""}
${neighbours(ctx, lang, rec, group)}
</aside>
</div>`;
}

export function mantraPage(ctx, { route, rec, mantras, derived, occasionsById, sources }) {
  const lang = route.lang;
  const R = ctx.R;
  return layout(ctx, {
    route,
    title: rec.title?.[lang] || rec.id,
    description: clip(rec.meaning?.[lang] || t(lang, "mantras.lede")),
    section: "texts",
    ogType: "article",
    crumbs: [
      { href: R.href(`${lang}/`), label: t(lang, "nav.home") },
      { href: R.href(`${lang}/texts/`), label: t(lang, "nav.texts") },
      { href: R.href(`${lang}/mantras/`), label: t(lang, "mantras.title") },
    ],
    body: mantraBody(ctx, { lang, rec, mantras, derived, occasionsById, sources }),
  });
}
