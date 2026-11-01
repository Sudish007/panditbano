// Katha landing (design.md §3.2 katha, §4.6, §12, §13.2; decisions.md §2.3; FEAT-107): page head (title, lede, deity, the
// Puranic source + locator, computed adhyaya / verse counts), the attribution caveat (.caveat from katha.json#caveat),
// the adhyaya nav (.katha-nav 40-px chips, last chip → #vidhi), then .layout.has-both: left rail = adhyaya list + the
// vidhi's step tracker; content = #adhyayas (cards with the summaries from the Markdown front matter) · #vidhi (the vidhi
// occasion rendered ONCE with the FEAT-106 components: when + roles, layer legend, step cards, parts) · #sources; right
// rail = the vidhi's samagri checklist, reading settings (when the steps carry verses), svara legend (§27 item 5), the
// Sanskrit-text link. The build replaces <!--pb-offline-urls:<vidhi id>--> with the occasion's offline manifest (MEDIUM 5).
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { sourcesSection, sourceLink, svaraLegend, mdContext, inlineProse } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { samagriCard } from "../components/samagri.mjs";
import { whenCard } from "../components/when.mjs";
import { stepsOf } from "../components/step.mjs";
import { occasionEnv, occHref, pothiHref, trackerFold, rolesCard, layerLegend, stepsList, offlinePlaceholder } from "./occasion.mjs";
import { kathaHref, kathasCrumbs, adhyayasOf, verseRefCount, clip } from "./kathas-index.mjs";
import { textHref, chapterHref } from "./texts-index.mjs";

/** Front-matter {title, summary} of an adhyaya's Markdown in the page language (katha.md[n][lang].meta). */
export const adhyayaMeta = (katha, n, lang) => (katha.md && katha.md[n] && katha.md[n][lang] && katha.md[n][lang].meta) || {};

/** Reading time in minutes from the retelling's word count (≈ 180 words / min, floor 1). */
export function readingMinutes(body) {
  const words = String(body ?? "").replace(/\{\{[^}]*\}\}/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

/** .katha-nav: one 40-px chip per adhyaya (+ "विधि" → #vidhi on the landing, → landing#vidhi elsewhere). */
export function kathaNav(ctx, lang, katha, { current = null, vidhiHref = "#vidhi" } = {}) {
  return html`<nav class="katha-nav" aria-label="${t(lang, "katha.adhyayas")}">${adhyayasOf(katha).map((a) => html`<a href="${kathaHref(ctx, lang, katha, a.n)}"${a.n === current ? raw(' aria-current="page"') : ""}>${t(lang, "katha.adhyaya_n", { n: num(a.n) })}</a>`)}<a href="${vidhiHref}">${t(lang, "katha.vidhi")}</a></nav>`;
}

/** Left-rail adhyaya list (rail-fold) with the current adhyaya marked. */
export function adhyayaFold(ctx, lang, katha, { current = null, id = "adhyayas-rail" } = {}) {
  const list = adhyayasOf(katha);
  return html`<details class="rail-fold card" id="${id}"><summary><h2 class="rail-h">${t(lang, "katha.adhyayas")} · ${num(list.length)}</h2></summary>
<nav aria-label="${t(lang, "katha.adhyayas")}"><ol>${list.map((a) => html`<li><a href="${kathaHref(ctx, lang, katha, a.n)}"${a.n === current ? raw(' aria-current="page"') : ""}><span class="n">${num(a.n)}</span><span class="t">${a.title[lang]}</span></a></li>`)}<li><a href="${current === null ? "#vidhi" : `${kathaHref(ctx, lang, katha)}#vidhi`}"><span class="n">✓</span><span class="t">${t(lang, "katha.vidhi")}</span></a></li></ol></nav>
</details>`;
}

/** Katha-level sources: the Puranic source, the Sanskrit text's source, then whatever the caller adds. */
export function kathaSourceRecords(katha, text) {
  const recs = [];
  if (katha.puranicSource && katha.puranicSource.ref) recs.push({ source: { ref: katha.puranicSource.ref } });
  if (text) recs.push(text);
  return recs;
}

function adhyayaCards(ctx, lang, katha) {
  return html`<ol class="grid grid-md-2 grid-lg-3" aria-label="${t(lang, "katha.adhyayas")}">${adhyayasOf(katha).map((a) => {
    const meta = adhyayaMeta(katha, a.n, lang);
    const verses = verseRefCount(katha, a);
    const body = katha.md && katha.md[a.n] && katha.md[a.n][lang] ? katha.md[a.n][lang].body : "";
    return html`<li><a class="card card-link adhyaya-card" href="${kathaHref(ctx, lang, katha, a.n)}">
<span class="chip">${t(lang, "katha.adhyaya_n", { n: num(a.n) })}</span>
<h3 class="m0">${a.title[lang]}</h3>
${meta.summary ? html`<p class="m0">${meta.summary}</p>` : ""}
<span class="meta">${verses ? `${t(lang, "counts.verses", { n: num(verses) })} · ` : ""}${t(lang, "katha.reading_time", { n: num(readingMinutes(body)) })}</span>
<span class="more">${t(lang, "katha.read")}</span>
</a></li>`;
  })}</ol>`;
}

/** The vidhi occasion embedded once: links to the full page / pothi, when + roles, layer legend, the steps (by part when the occasion has parts). */
function vidhiSection(env) {
  const { ctx, lang, occ, mdCtx } = env;
  const parts = occ.parts || [];
  const steps = parts.length ? [] : stepsOf(occ);
  return html`<section id="vidhi" aria-labelledby="h-vidhi" data-vidhi="${occ.id}">
<div class="section-head"><h2 id="h-vidhi">${t(lang, "katha.vidhi_heading", { title: occ.title[lang] })}</h2><a href="${occHref(ctx, lang, occ)}">${t(lang, "katha.vidhi_link")}</a></div>
<div class="prose"><p>${inlineProse(occ.overview[lang], mdCtx)}</p></div>
<div class="pair">
${whenCard(ctx, lang, occ, { mdCtx })}
${rolesCard(env)}
</div>
${layerLegend(lang)}
${parts.length ? parts.map((p, i) => html`<section class="vidhi-part" id="part-${p.slug}" aria-labelledby="h-part-${p.slug}"><h3 id="h-part-${p.slug}">${t(lang, "occasion.part_of", { i: num(i + 1), n: num(parts.length) })} · ${p.title[lang]}</h3>${stepsList(env, stepsOf(occ, p))}</section>`) : stepsList(env, steps)}
<div class="actions"><a class="btn btn-primary" href="${pothiHref(ctx, lang, occ)}">${icon("i-book")}${t(lang, "pothi.label")}</a><a class="btn" href="${occHref(ctx, lang, occ)}">${t(lang, "katha.vidhi_link")}</a></div>
</section>`;
}

export function kathaBody(ctx, { lang, katha, data, derived, occasionsById }) {
  const R = ctx.R;
  const occ = occasionsById.get(katha.vidhiOccasionId);
  if (!occ) throw new Error(`katha ${katha.id}: vidhiOccasionId "${katha.vidhiOccasionId}" is not in the corpus`);
  const env = occasionEnv(ctx, lang, { occ, data, derived, occasionsById });
  const text = katha.textId ? env.textsById.get(katha.textId) : null;
  const steps = stepsOf(occ);
  const recs = env.mantraRecs(steps);
  const src = katha.puranicSource && data.sources ? data.sources.get(katha.puranicSource.ref) : null;
  const adhyayas = adhyayasOf(katha);
  const verses = verseRefCount(katha);
  return html`<div class="page-head">
<div><h1>${katha.title[lang]}</h1><p class="lede m0">${katha.lede[lang]}</p>
<p class="meta">${katha.deity ? html`<span>${t(lang, "katha.deity")}: <span lang="sa">${katha.deity}</span></span>` : ""}${src || (katha.puranicSource && katha.puranicSource.locator) ? html`<span>${t(lang, "katha.source_label")}: ${src ? sourceLink(src, lang) : ""}${katha.puranicSource.locator ? html`${src ? " · " : ""}<span lang="sa">${katha.puranicSource.locator}</span>` : ""}</span>` : ""}<span>${t(lang, "kathas.adhyayas", { n: num(adhyayas.length) })}</span>${verses ? html`<span>${t(lang, "counts.verses", { n: num(verses) })}</span>` : ""}</p></div>
<div class="actions">${adhyayas.length ? html`<a class="btn btn-primary" href="${kathaHref(ctx, lang, katha, adhyayas[0].n)}">${t(lang, "katha.adhyaya_n", { n: num(adhyayas[0].n) })} →</a>` : ""}<a class="btn" href="${pothiHref(ctx, lang, occ)}">${icon("i-book")}${t(lang, "pothi.label")}</a><button class="btn" type="button" data-save-offline="${occ.id}" data-l-saved="${t(lang, "pothi.saved")}" hidden>${icon("i-download")}${t(lang, "pothi.save")}</button></div>
</div>
${kathaNav(ctx, lang, katha)}
<div class="layout has-both">
<aside class="rail rail-left">
${adhyayaFold(ctx, lang, katha)}
${trackerFold(env, { onPage: new Set(occ.parts.length ? stepsOf(occ).map((s) => s.n) : steps.map((s) => s.n)) })}
</aside>
<div class="stack">
${katha.caveat && katha.caveat[lang] ? html`<p class="caveat" id="caveat">${inlineProse(katha.caveat[lang], env.mdCtx)}</p>` : ""}
<section id="adhyayas" aria-labelledby="h-adhyayas">
<div class="section-head"><h2 id="h-adhyayas">${t(lang, "katha.adhyayas")}</h2><span class="meta">${t(lang, "katha.own_words")}</span></div>
${adhyayaCards(ctx, lang, katha)}
</section>
${vidhiSection(env)}
${sourcesSection([...kathaSourceRecords(katha, text), ...(occ.sources || []).map((ref) => ({ source: { ref } })), { variants: occ.variants || [] }, ...recs], lang, { sources: data.sources })}
</div>
<aside class="rail rail-right">
${samagriCard(ctx, lang, occ)}
${recs.length ? readingSettings(ctx, lang) : ""}
${recs.some((r) => r.svara === true) ? svaraLegend(lang) : ""}
${text ? html`<div class="card"><h2 class="rail-h">${t(lang, "katha.text_link")}</h2><nav aria-label="${t(lang, "katha.text_link")}"><ul><li><a href="${textHref(ctx, lang, text)}"><span class="n">ॐ</span><span class="t">${text.title[lang]}</span></a></li>${(text.chapters || []).map((c) => html`<li><a href="${chapterHref(ctx, lang, text, c.n)}"><span class="n">${num(c.n)}</span><span class="t">${c.title[lang]}</span></a></li>`)}</ul></nav></div>` : ""}
</aside>
</div>`;
}

export function kathaPage(ctx, { route, katha, data, derived, occasionsById }) {
  const lang = route.lang;
  const occ = occasionsById.get(katha.vidhiOccasionId);
  return layout(ctx, {
    route,
    title: katha.title[lang],
    description: clip(katha.lede[lang]),
    section: "kathas",
    ogType: "article",
    crumbs: kathasCrumbs(ctx, lang),
    body: kathaBody(ctx, { lang, katha, data, derived, occasionsById }),
    bodyEnd: occ ? offlinePlaceholder(occ) : "",
  });
}
