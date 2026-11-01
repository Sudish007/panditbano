// Mantras index (design.md §3.2, §4.8; FEAT-105): the ritual-mantra corpus grouped by source kind — Vedic by VS adhyaya,
// other Vedic (Grihya Sutra, Rigveda), Puranic, paddhati, folk, named author — every count computed from the records.
import { html, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { kindChip } from "../components/verse.mjs";
import { ariaPlain } from "../../lib/translit.mjs";

const KIND_ORDER = ["vedic-other", "puranic", "paddhati", "folk", "author"];

/** Group key of a mantra record: "vs-<adhyaya>" for Vajasaneyi Samhita ids, else the kind (vedic → "vedic-other"). */
export function groupKey(rec) {
  const m = /^vs-(\d+)-/.exec(rec.id || "");
  if (rec.kind === "vedic" && m) return `vs-${Number(m[1])}`;
  return rec.kind === "vedic" ? "vedic-other" : rec.kind || "paddhati";
}
export function groupLabel(key, lang) {
  const m = /^vs-(\d+)$/.exec(key);
  if (m) return t(lang, "mantras.group_vs", { n: m[1] });
  return t(lang, `mantras.group_${key.replace("-", "_")}`);
}
const mantraNo = (rec) => { const m = /^(?:vs-\d+|pgs-\d+-\d+|rv-\d+-\d+)-(\d+)$/.exec(rec.id || ""); return m ? Number(m[1]) : Infinity; };
const byTitle = (lang) => (a, b) => { const d = mantraNo(a) - mantraNo(b); if (d) return d; return String(a.title?.[lang] || a.id).localeCompare(String(b.title?.[lang] || b.id), lang === "en" ? "en" : "hi"); };

/** Ordered groups [{key, label, items[]}]: VS adhyayas ascending, then other Vedic, Puranic, paddhati, folk, author. */
export function mantraGroups(mantras, lang) {
  const map = new Map();
  for (const m of mantras) {
    const k = groupKey(m);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(m);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const va = /^vs-(\d+)$/.exec(a), vb = /^vs-(\d+)$/.exec(b);
    if (va && vb) return Number(va[1]) - Number(vb[1]);
    if (va) return -1;
    if (vb) return 1;
    return KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b);
  });
  return keys.map((key) => ({ key, label: groupLabel(key, lang), items: map.get(key).sort(byTitle(lang)) }));
}

/** First words of the svara-less text for lists (≤ max chars, cut at a word boundary, with an ellipsis). */
export function incipit(rec, max = 42) {
  const plain = (rec.ariaPlain || ariaPlain(rec.devanagari)).replace(/\s*[।॥]+\s*[०-९0-9]*\s*[।॥]*\s*$/, "");
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 12)).trim() + "…";
}

export function mantraCard(ctx, rec, lang) {
  return html`<a class="card card-link mantra-card" href="${ctx.R.href(`${lang}/mantras/${rec.id}/`)}">
${kindChip(rec, lang)}
<h3 class="m0">${rec.title?.[lang] || rec.id}</h3>
<p class="incipit m0" lang="sa">${incipit(rec)}</p>
${rec.locator ? html`<p class="meta m0">${rec.locator}</p>` : ""}
</a>`;
}

export function mantrasIndexBody(ctx, { lang, mantras }) {
  const groups = mantraGroups(mantras, lang);
  return html`<div class="page-head">
<div><h1>${t(lang, "mantras.title")}</h1><p class="lede m0">${t(lang, "mantras.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.mantras", { n: num(mantras.length) })}</span><span>${t(lang, "counts.groups", { n: num(groups.length) })}</span></div>
</div>
${groups.map((g) => html`<section id="g-${g.key}" aria-labelledby="h-g-${g.key}">
<div class="section-head"><h2 id="h-g-${g.key}">${g.label}</h2><span class="meta">${t(lang, "counts.mantras", { n: num(g.items.length) })}</span></div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${g.items.map((m) => mantraCard(ctx, m, lang))}</div>
</section>`)}`;
}

export function mantrasIndexPage(ctx, { route, mantras }) {
  const lang = route.lang;
  const R = ctx.R;
  return layout(ctx, {
    route,
    title: t(lang, "mantras.title"),
    description: t(lang, "mantras.lede"),
    section: "texts",
    crumbs: [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/texts/`), label: t(lang, "nav.texts") }],
    body: mantrasIndexBody(ctx, { lang, mantras }),
  });
}
