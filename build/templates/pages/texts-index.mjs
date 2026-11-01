// Texts index (design.md §3.2 texts-index, §4.8; brief §6.1; FEAT-107): the section landing of "मंत्र और पाठ" — a card
// for the ritual-mantra corpus (/mantras/) and one card per long text with "N अध्याय · M श्लोक" computed from the
// PUBLISHED chapters only (an unpublished chapter is neither routed nor counted). Shared helpers for the text / chapter
// pages live here (textHref, chapterHref, textsCrumbs, langLabel, usedInCard) the way mantra.mjs imports from mantras-index.
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { kindChip, mdContext } from "../components/verse.mjs";
import { tp } from "../components/names.mjs";
import { proseOnly } from "../../lib/md.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
/**
 * Plain-text excerpt of a prose field (card body, meta description): `[[term]]` → the term's display form (as stepTitle
 * does), `[text](url)` → its text, Markdown removed, then clipped. The first long text (C1A-04 integrate) showed its
 * intro's raw `[[navagraha]]` / `[[phalashruti]]` marks on the texts index card.
 */
export function excerpt(text, mdCtx = null, n = 160) {
  let s = String(text ?? "");
  if (mdCtx) s = s.replace(/\[\[([a-z0-9-]+)\]\]/g, (m, id) => (mdCtx.term(id) || {}).display || m);
  return clip(proseOnly(s), n);
}

export const textHref = (ctx, lang, text) => ctx.R.href(`${lang}/texts/${text.slug}/`);
/** Chapter route; part k ≥ 2 → …/{n}/p{k}/ (design §7.8). */
export const chapterHref = (ctx, lang, text, n, k = 1) => ctx.R.href(`${lang}/texts/${text.slug}/${n}/${k > 1 ? `p${k}/` : ""}`);

/** Language label of a text (sa default; awa for Tulsidas; hi for modern aartis / vrat kathas — plan §2.5). */
export function langLabel(lang, text) {
  const l = text.lang || "sa";
  return t(lang, `texts.lang_${l === "awa" ? "awa" : l === "hi" ? "hi" : "sa"}`);
}

/** "N अध्याय · M श्लोक" from the published chapters (brief §6.1: the texts index shows computed counts). */
export function textCounts(lang, text) {
  const chapters = Array.isArray(text.chapters) ? text.chapters : [];
  const verses = text.verseCount ?? chapters.reduce((n, c) => n + ((c.verses || []).length), 0);
  return `${t(lang, "counts.chapters", { n: num(chapters.length) })} · ${t(lang, "counts.verses", { n: num(verses) })}`;
}

export function textsCrumbs(ctx, lang, text = null) {
  const R = ctx.R;
  const crumbs = [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/texts/`), label: t(lang, "nav.texts") }];
  if (text) crumbs.push({ href: textHref(ctx, lang, text), label: text.title[lang] });
  return crumbs;
}

/** "कहाँ पढ़ा जाता है": occasion steps whose textRefs recite this text (derived.textUses), optionally only one chapter. */
export function usedInCard(ctx, lang, text, { derived, occasionsById, chapter = null, heading = "h2", cls = "card" } = {}) {
  const uses = (derived.textUses && derived.textUses.get(text.id)) || [];
  const items = uses.filter((u) => occasionsById && occasionsById.get(u.occasionId) && (chapter === null || u.chapters.includes(chapter)));
  if (!items.length) return "";
  const H = heading;
  const R = ctx.R;
  const seen = new Set();
  const rows = [];
  for (const u of items) {
    const key = `${u.occasionId}:${u.step}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const o = occasionsById.get(u.occasionId);
    const href = R.href(`${lang}/occasions/${o.slug}/${u.part ? u.part + "/" : ""}#step-${u.step}`);
    rows.push(html`<li><a href="${href}"><span class="n">${num(rows.length + 1)}</span><span class="t">${o.title[lang]} → ${t(lang, "verse.step", { n: u.step })}</span></a></li>`);
  }
  return html`<div class="${cls} used-in">${raw(`<${H} class="rail-h">`)}${t(lang, "texts.used_in")}${raw(`</${H}>`)}<nav aria-label="${t(lang, "texts.used_in")}"><ul>${rows}</ul></nav></div>`;
}

export function textCard(ctx, text, lang, mdCtx = null) {
  return html`<a class="card card-link text-card" href="${textHref(ctx, lang, text)}">
<span class="chips">${kindChip(text, lang)}<span class="chip chip-lok">${langLabel(lang, text)}</span></span>
<h3 class="m0">${text.title[lang]}</h3>
<p class="m0">${excerpt(text.intro[lang], mdCtx)}</p>
<span class="meta">${textCounts(lang, text)}</span>
</a>`;
}

export function textsIndexBody(ctx, { lang, texts, counts = {}, derived = null }) {
  const R = ctx.R;
  const mdCtx = derived ? mdContext(ctx, lang, derived) : null;
  const list = texts.slice().sort((a, b) => (b.publishedCount > 0) - (a.publishedCount > 0) || String(a.title[lang]).localeCompare(String(b.title[lang]), lang === "en" ? "en" : "hi"));
  return html`<div class="page-head">
<div><h1>${t(lang, "texts.title")}</h1><p class="lede m0">${tp(ctx, lang, "texts.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.mantras", { n: num(counts.mantras || 0) })}</span><span>${t(lang, "counts.chapters", { n: num(counts.chapters || 0) })}</span><span>${t(lang, "counts.verses", { n: num(counts.verses || 0) })}</span></div>
</div>
${counts.mantras ? html`<a class="card card-link mantras-card" href="${R.href(`${lang}/mantras/`)}">${icon("i-om", { cls: "ico", size: 44 })}<div class="t"><h2 class="m0">${t(lang, "mantras.title")}</h2><p class="m0">${t(lang, "texts.mantras_body")}</p></div><span class="count">${t(lang, "counts.mantras", { n: num(counts.mantras) })}</span><span class="more">${t(lang, "home.more")}</span></a>` : ""}
<section id="texts" aria-labelledby="h-texts">
<div class="section-head"><h2 id="h-texts">${t(lang, "texts.heading")}</h2><span class="meta">${t(lang, "counts.pages", { n: num(list.length) })}</span></div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${list.map((x) => textCard(ctx, x, lang, mdCtx))}</div>
</section>`;
}

export function textsIndexPage(ctx, { route, texts, counts, derived = null }) {
  const lang = route.lang;
  const R = ctx.R;
  return layout(ctx, {
    route,
    title: t(lang, "texts.title"),
    description: clip(t(lang, "texts.lede")),
    section: "texts",
    crumbs: [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: textsIndexBody(ctx, { lang, texts, counts, derived }),
  });
}
