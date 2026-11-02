// Occasion page (design.md §4.3 — the Vivah mock; §9.1 .sections; §12; §13.2 #pb-offline-urls; §16.1; §27; FEAT-106).
// .layout.has-both: left rail = step tracker (<details class="rail-fold"> → parts → steps, 28-px discs, aria-current set by
// tracker.mjs); content = #intro · #when · #roles · #vidhi · #variants · #faq · #sources in that order under the .sections
// chip scroller; right rail = samagri checklist, reading settings (when verses are on the page), svara legend (§27 item 5).
// Multi-part occasions: the base route is the overview + parts list; each part route renders its steps with rel prev/next
// and the same rails. The build replaces the <!--pb-offline-urls:<id>--> placeholder with the offline manifest (MEDIUM 5).
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { verseBlock, padaSpans, splitBars, sourcesSection, sourceLink, svaraLegend, mdContext, inlineProse } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { tp } from "../components/names.mjs";
import { samagriCard } from "../components/samagri.mjs";
import { whenCard } from "../components/when.mjs";
import { stepCard, stepTitle, stepsOf, layerChip } from "../components/step.mjs";
import { splitPadas } from "../../lib/deva.mjs";
import { toIAST, ariaPlain } from "../../lib/translit.mjs";

export const LAYERS = ["vedic", "paddhati", "lok"];
const SENSITIVE_KEY = { pregnancy: "health" };
/** PGS I.8.11–13 as quoted in the design mocks (Sanskrit Wikisource पारस्करगृह्यसूत्रम्, fetched 2026-10-31) — used only
 *  when the corpus has no `pgs-1-8-11-13` record yet (the vivaha content item adds it). */
export const PGS_SUTRA_ID = "pgs-1-8-11-13";
export const PGS_SUTRA_FALLBACK = {
  devanagari: "ग्रामवचनं च कुर्युः ॥ विवाहश्मशानयोर्ग्रामं प्रविशतादिति वचनात् ॥ तस्मात्तयोर्ग्रामः प्रमाणमिति श्रुतेः ॥",
  url: "https://sa.wikisource.org/wiki/पारस्करगृह्यसूत्रम्",
  sourceRef: "ws-pgs",
};

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

/** Region label from the UI table (region.<id>) else the authored string. */
export function regionLabel(lang, region) {
  try { return t(lang, `region.${region}`); } catch { return String(region ?? ""); }
}

/** Per-page context shared by the base route, the part routes and the pothi. */
export function occasionEnv(ctx, lang, { occ, data, derived, occasionsById }) {
  const textsById = new Map((data.texts || []).map((x) => [x.id, x]));
  const kathasById = new Map((data.kathas || []).map((k) => [k.id, k]));
  const mantraById = derived.mantraById || new Map((data.mantras || []).map((m) => [m.id, m]));
  const mdCtx = mdContext(ctx, lang, derived);
  const mantraRecs = (steps) => { const seen = new Set(); const out = []; for (const s of steps) for (const id of s.mantraIds || []) { const r = mantraById.get(id); if (r && !seen.has(id)) { seen.add(id); out.push(r); } } return out; };
  return { textsById, kathasById, mantraById, mdCtx, mantraRecs, sources: data.sources, occasionsById, derived, occ, lang, ctx };
}

export const occHref = (ctx, lang, occ, part = null) => ctx.R.href(`${lang}/occasions/${occ.slug}/${part ? part.slug + "/" : ""}`);
export const pothiHref = (ctx, lang, occ) => ctx.R.href(`${lang}/occasions/${occ.slug}/pothi/`);

function layerSummary(lang, steps) {
  const n = {};
  for (const s of steps) n[s.layer] = (n[s.layer] || 0) + 1;
  return LAYERS.filter((l) => n[l]).map((l) => html`<span>${t(lang, `layer.${l}`)} ${num(n[l])}</span>`);
}

/** Step tracker rail: parts → steps; links are in-page (#step-n) for steps rendered on this page, else to the part route. */
export function trackerRail(env, opts) {
  return html`<aside class="rail rail-left">
${trackerFold(env, opts)}
</aside>`;
}

/** The tracker <details> alone (the katha landing puts it under its adhyaya list — FEAT-107). */
export function trackerFold(env, { part = null, onPage }) {
  const { ctx, lang, occ } = env;
  const steps = stepsOf(occ);
  const link = (s) => {
    const here = onPage.has(s.n);
    const p = occ.parts.find((x) => x.id === s.part);
    const href = here ? `#step-${s.n}` : `${occHref(ctx, lang, occ, p)}#step-${s.n}`;
    return html`<li><a href="${href}" data-step="${s.n}"><span class="n">${num(s.n)}</span><span class="t">${stepTitle(s, lang, env.mdCtx)}</span></a></li>`;
  };
  const body = occ.parts.length
    ? html`<ol class="parts">${occ.parts.map((p, i) => {
        const own = stepsOf(occ, p);
        return html`<li class="part"><a class="part-t" href="${occHref(ctx, lang, occ, p)}"${part && part.id === p.id ? raw(' aria-current="page"') : ""}><span class="n">${num(i + 1)}</span><span class="t">${p.title[lang]}<span class="meta"> · ${t(lang, "occasion.steps", { n: num(own.length) })}</span></span></a><ol>${own.map(link)}</ol></li>`;
      })}</ol>`
    : html`<ol>${steps.map(link)}</ol>`;
  return html`<details class="rail-fold card" id="tracker"><summary><h2 class="rail-h">${t(lang, "occasion.tracker")} · ${num(steps.length)}</h2></summary>
<nav aria-label="${t(lang, "occasion.tracker")}" data-tracker>${body}</nav>
</details>`;
}

/** The .sections chip scroller; on a part page the overview sections link back to the base route. */
export function sectionsNav(env, { part = null, present }) {
  const { ctx, lang, occ } = env;
  const base = part ? occHref(ctx, lang, occ) : "";
  const local = new Set(["samagri", "vidhi", "sources"]);
  const chips = ["intro", "when", "roles", "samagri", "vidhi", "variants", "faq", "sources"].filter((id) => present.has(id)).map((id) => html`<a class="btn btn-ghost" href="${part && !local.has(id) ? `${base}#${id}` : `#${id}`}">${t(lang, `occasion.sections.${id}`)}</a>`);
  return html`<nav class="sections" aria-label="${t(lang, "occasion.sections_label")}">${chips}</nav>`;
}

function introSection(env) {
  const { lang, occ, mdCtx, ctx, kathasById } = env;
  const kinds = [...new Set((occ.sensitive || []).map((k) => SENSITIVE_KEY[k] || k))];
  // G15 at render: t() throws when the note for a sensitive kind is missing from the UI table
  const notes = kinds.map((k) => html`<p class="caveat" data-sensitive="${k}">${tp(ctx, lang, `honesty.${k}_note`)}</p>`);
  const katha = occ.kathaId && kathasById.get(occ.kathaId);
  return html`<section id="intro" class="prose" aria-label="${t(lang, "occasion.sections.intro")}">
<p>${inlineProse(occ.overview[lang], mdCtx)}</p>
${katha ? html`<p><a href="${ctx.R.href(`${lang}/kathas/${katha.slug}/`)}">${t(lang, "occasion.katha_link")}</a></p>` : ""}
${notes}
</section>`;
}

export function layerLegend(lang) {
  return html`<p class="chips layers"><span class="meta">${t(lang, "occasion.layers")}:</span>${LAYERS.map((l) => layerChip({ layer: l }, lang))}</p>`;
}

export function rolesCard(env) {
  const { lang, occ, mdCtx } = env;
  return html`<section class="card" id="roles" aria-labelledby="h-roles">
<h2 id="h-roles">${t(lang, "occasion.sections.roles")}</h2>
<dl class="roles">${(occ.roles || []).map((r) => html`<div><dt>${r.role[lang]}</dt><dd>${inlineProse(r.does[lang], mdCtx)}</dd></div>`)}</dl>
</section>`;
}

/** The PGS I.8.11–13 .sutra block — once per page (decisions.md §1 point 3): the corpus record when present, else the fallback. */
export function sutraBlock(env) {
  const { lang, mantraById, sources, mdCtx } = env;
  const rec = mantraById.get(PGS_SUTRA_ID);
  if (rec) {
    const entry = rec.source && sources ? sources.get(rec.source.ref) : null;
    return html`<blockquote class="sutra" data-sutra="${PGS_SUTRA_ID}">${verseBlock(rec, lang, { tools: false, showKind: false, id: "sutra-pgs" })}${rec.meaning && rec.meaning[lang] ? html`<p class="m0">${inlineProse(rec.meaning[lang], mdCtx)}</p>` : ""}<cite>${entry ? sourceLink(entry, lang) : ""}${rec.locator ? html` ${rec.locator}` : ""}</cite></blockquote>`;
  }
  const f = PGS_SUTRA_FALLBACK;
  const entry = sources && sources.get(f.sourceRef);
  const url = (entry && entry.url) || f.url;
  const cite = html`<a href="${url}" rel="external noopener">${t(lang, "occasion.sutra_cite")}<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (${t(lang, "ext.label")})</span></a>`;
  return html`<blockquote class="sutra" data-sutra="${PGS_SUTRA_ID}"><div class="verse"><p class="mantra" lang="sa" id="sutra-pgs" data-plain="${ariaPlain(f.devanagari)}"><span class="deva">${padaSpans(f.devanagari, splitPadas)}</span></p><p class="iast" lang="sa-Latn">${padaSpans(toIAST(f.devanagari, PGS_SUTRA_ID), splitBars)}</p></div><p class="m0">${t(lang, "occasion.sutra_meaning")}</p><cite>${cite}</cite></blockquote>`;
}

function variantsSection(env) {
  const { lang, occ, mdCtx, sources } = env;
  if (!Array.isArray(occ.variants) || !occ.variants.length) return "";
  return html`<section id="variants" aria-labelledby="h-variants">
<h2 id="h-variants">${t(lang, "occasion.sections.variants")}</h2>
${sutraBlock(env)}
<p class="meta">${t(lang, "occasion.sutra_note")}</p>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${occ.variants.map((v) => {
    const entry = v.source && sources ? sources.get(v.source) : null;
    return html`<div class="card variant"><h3 class="m0">${regionLabel(lang, v.region)}</h3><p class="m0">${inlineProse(v.what[lang], mdCtx)}</p>${entry ? html`<p class="meta m0">${t(lang, "occasion.variant_source")}: ${sourceLink(entry, lang)}</p>` : ""}</div>`;
  })}</div>
</section>`;
}

function faqSection(env) {
  const { lang, occ, mdCtx } = env;
  if (!Array.isArray(occ.faq) || !occ.faq.length) return "";
  return html`<section id="faq" aria-labelledby="h-faq">
<h2 id="h-faq">${t(lang, "occasion.sections.faq")}</h2>
${occ.faq.map((f) => html`<details class="faq"><summary>${f.q[lang]}</summary><div class="prose"><p>${inlineProse(f.a[lang], mdCtx)}</p></div></details>`)}
</section>`;
}

/** #sources: the occasion's registry sources, its variant sources and the sources of the mantras rendered on this page. */
function occasionSources(env, recs) {
  const { lang, occ, sources } = env;
  const records = [...(occ.sources || []).map((ref) => ({ source: { ref } })), { variants: occ.variants || [] }, ...recs];
  return sourcesSection(records, lang, { sources });
}

function partsList(env) {
  const { ctx, lang, occ } = env;
  return html`<ol class="part-cards grid grid-md-2 grid-lg-3" aria-label="${t(lang, "occasion.parts")}">${occ.parts.map((p, i) => {
    const own = stepsOf(occ, p);
    return html`<li><a class="card card-link part-card" href="${occHref(ctx, lang, occ, p)}"><span class="chip">${t(lang, "occasion.part_of", { i: num(i + 1), n: num(occ.parts.length) })}</span><h3 class="m0">${p.title[lang]}</h3>${p.summary && p.summary[lang] ? html`<p class="m0">${p.summary[lang]}</p>` : ""}<span class="meta">${t(lang, "occasion.steps", { n: num(own.length) })}</span><span class="more">${t(lang, "home.more")}</span></a></li>`;
  })}</ol>`;
}

export function stepsList(env, steps) {
  const { ctx, lang, derived, occasionsById, sources, textsById, mdCtx, mantraById, occ } = env;
  return html`<div class="stack steps">${steps.map((s) => stepCard(s, { ctx, lang, derived, occasionsById, sources, textsById, mdCtx, mantraById, occ }))}</div>`;
}

function partPager(env, part) {
  const { ctx, lang, occ } = env;
  const i = occ.parts.findIndex((p) => p.id === part.id);
  const prev = i > 0 ? occ.parts[i - 1] : null;
  const next = i < occ.parts.length - 1 ? occ.parts[i + 1] : null;
  return html`<nav class="pager" aria-label="${t(lang, "occasion.parts")}">
${prev ? html`<a class="btn" rel="prev" href="${occHref(ctx, lang, occ, prev)}">${t(lang, "occasion.prev_part")}<span class="sr"> — ${prev.title[lang]}</span></a>` : html`<span></span>`}
<a class="btn btn-ghost" href="${occHref(ctx, lang, occ)}">${t(lang, "occasion.back_overview")}</a>
${next ? html`<a class="btn" rel="next" href="${occHref(ctx, lang, occ, next)}">${t(lang, "occasion.next_part")}<span class="sr"> — ${next.title[lang]}</span></a>` : html`<span></span>`}
</nav>`;
}

function actions(env) {
  const { ctx, lang, occ } = env;
  return html`<div class="actions">
<a class="btn btn-primary" href="${pothiHref(ctx, lang, occ)}">${icon("i-book")}${t(lang, "pothi.label")}</a>
<button class="btn" type="button" data-print>${icon("i-print")}${t(lang, "pothi.print")}</button>
<button class="btn" type="button" data-save-offline="${occ.id}" data-l-saved="${t(lang, "pothi.saved")}" hidden>${icon("i-download")}${t(lang, "pothi.save")}</button>
</div>`;
}

function rightRail(env, recs) {
  const { ctx, lang, occ } = env;
  return html`<aside class="rail rail-right">
${samagriCard(ctx, lang, occ)}
${recs.length ? readingSettings(ctx, lang) : ""}
${recs.some((r) => r.svara === true) ? svaraLegend(lang) : ""}
</aside>`;
}

/** Body of the base route: overview, when, roles, parts list or steps, variants, FAQ, sources. */
export function occasionBody(env) {
  const { lang, occ } = env;
  const multi = occ.parts.length > 0;
  const steps = multi ? [] : stepsOf(occ);
  const recs = env.mantraRecs(steps);
  const present = new Set(["intro", "when", "roles", "samagri", "vidhi", "sources"]);
  if (occ.variants && occ.variants.length) present.add("variants");
  if (occ.faq && occ.faq.length) present.add("faq");
  const all = stepsOf(occ);
  return html`<div class="page-head">
<div><h1>${occ.title[lang]}</h1><p class="lede m0">${occ.lede[lang]}</p>
<p class="meta"><span>${t(lang, `groups.${occ.group}`)}</span>${layerSummary(lang, all)}<span>${t(lang, "occasion.steps", { n: num(all.length) })}</span>${multi ? html`<span>${t(lang, "occasion.parts_count", { n: num(occ.parts.length) })}</span>` : ""}</p></div>
${actions(env)}
</div>
${sectionsNav(env, { present })}
<div class="layout has-both">
${trackerRail(env, { onPage: new Set(steps.map((s) => s.n)) })}
<div class="stack">
${introSection(env)}
<div class="pair">
${whenCard(env.ctx, lang, occ, { mdCtx: env.mdCtx })}
${rolesCard(env)}
</div>
<section id="vidhi" aria-labelledby="h-vidhi">
<h2 id="h-vidhi">${t(lang, "occasion.sections.vidhi")}</h2>
${multi ? partsList(env) : html`${layerLegend(lang)}${stepsList(env, steps)}`}
</section>
${variantsSection(env)}
${faqSection(env)}
${occasionSources(env, recs)}
</div>
${rightRail(env, recs)}
</div>`;
}

/** Body of a part route: the part's steps with the same rails, prev/next pager, sources. */
export function partBody(env, part) {
  const { lang, occ } = env;
  const i = occ.parts.findIndex((p) => p.id === part.id);
  const steps = stepsOf(occ, part);
  const recs = env.mantraRecs(steps);
  const present = new Set(["intro", "when", "roles", "samagri", "vidhi", "sources"]);
  if (occ.variants && occ.variants.length) present.add("variants");
  if (occ.faq && occ.faq.length) present.add("faq");
  return html`<div class="page-head">
<div><h1>${occ.title[lang]} — ${part.title[lang]}</h1><p class="lede m0">${(part.summary && part.summary[lang]) || occ.lede[lang]}</p>
<p class="meta"><span>${t(lang, "occasion.part_of", { i: num(i + 1), n: num(occ.parts.length) })}</span>${layerSummary(lang, steps)}<span>${t(lang, "occasion.steps", { n: num(steps.length) })}</span></p></div>
${actions(env)}
</div>
${sectionsNav(env, { part, present })}
<div class="layout has-both">
${trackerRail(env, { part, onPage: new Set(steps.map((s) => s.n)) })}
<div class="stack">
<section id="vidhi" aria-labelledby="h-vidhi">
<h2 id="h-vidhi">${t(lang, "occasion.sections.vidhi")} · ${t(lang, "occasion.part_of", { i: num(i + 1), n: num(occ.parts.length) })}</h2>
${layerLegend(lang)}
${stepsList(env, steps)}
</section>
${partPager(env, part)}
${occasionSources(env, recs)}
</div>
${rightRail(env, recs)}
</div>`;
}

export function occasionCrumbs(ctx, lang, occ = null) {
  const R = ctx.R;
  const crumbs = [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/occasions/`), label: t(lang, "nav.occasions") }];
  if (occ) crumbs.push({ href: occHref(ctx, lang, occ), label: occ.title[lang] });
  return crumbs;
}

export const offlinePlaceholder = (occ) => raw(`<!--pb-offline-urls:${occ.id}-->`);

export function occasionPage(ctx, { route, occ, data, derived, occasionsById }) {
  const lang = route.lang;
  const env = occasionEnv(ctx, lang, { occ, data, derived, occasionsById });
  return layout(ctx, {
    route,
    title: occ.title[lang],
    description: clip(occ.lede[lang]),
    section: "occasions",
    ogType: "article",
    crumbs: occasionCrumbs(ctx, lang),
    body: occasionBody(env),
    bodyEnd: offlinePlaceholder(occ),
  });
}

export function occasionPartPage(ctx, { route, occ, part, data, derived, occasionsById }) {
  const lang = route.lang;
  const env = occasionEnv(ctx, lang, { occ, data, derived, occasionsById });
  const i = occ.parts.findIndex((p) => p.id === part.id);
  const prev = i > 0 ? occ.parts[i - 1] : null;
  const next = i < occ.parts.length - 1 ? occ.parts[i + 1] : null;
  return layout(ctx, {
    route,
    title: `${occ.title[lang]} — ${part.title[lang]}`,
    description: clip((part.summary && part.summary[lang]) || occ.lede[lang]),
    section: "occasions",
    ogType: "article",
    crumbs: occasionCrumbs(ctx, lang, occ),
    headExtra: html`${prev ? html`<link rel="prev" href="${occHref(ctx, lang, occ, prev)}">\n` : ""}${next ? html`<link rel="next" href="${occHref(ctx, lang, occ, next)}">` : ""}`,
    body: partBody(env, part),
    bodyEnd: offlinePlaceholder(occ),
  });
}
