// Reference page (design.md §3.2 reference-page, §4.8, §9.3 pb-sankalpa, §12 sankalpa.mjs, §18 3.3.7; FEAT-108): the
// Markdown prose (headings shifted, GFM tables in .table-wrap at full width — text stays at the reading measure via
// .prose-wide), {{mantra:}} / {{sutra:}} embeds as on lessons, #sources for the embedded records; right rail = "इस पृष्ठ में"
// (the prose headings), reading settings when verses are on the page, and the other reference pages.
// reference/sankalpa/ adds the worked example: the two-field form (gotra, name — ≤ 60 chars, remembered as pb-sankalpa by
// sankalpa.mjs) and the `sankalp` occasion's panditSays.sa lines whose {placeholders} become <span data-sankalpa="key">
// slots filled via textContent; without that occasion the UI-string example line carries the two slots.
import { html, raw, esc, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { sourcesSection, svaraLegend } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { splitPadas, joinDanda } from "../../lib/deva.mjs";
import { lessonProse } from "./lesson.mjs";
import { clip, refHref, refMeta, refList, referenceCrumbs } from "./reference.mjs";

export const SANKALPA_OCCASION = "sankalp";
const SLOT_RE = /\{([a-z][a-z0-9_-]*)\}/g;

/** Slot label in the page language: sankalpa.slot.<key> when the UI has it, else "[key]". */
export function slotLabel(lang, key) {
  try { return t(lang, `sankalpa.slot.${key}`); } catch (e) { return `[${key}]`; }
}

/** Escape a text and turn every {key} placeholder into a slot span (filled by sankalpa.mjs via textContent). */
function slotEsc(text, lang) {
  const parts = String(text ?? "").split(SLOT_RE);
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) out += esc(parts[i]);
    else out += `<span class="slot" data-sankalpa="${esc(parts[i])}" data-empty="${esc(slotLabel(lang, parts[i]))}">${esc(slotLabel(lang, parts[i]))}</span>`;
  }
  return out;
}
/** A text with {key} placeholders → Raw HTML with slot spans; mantra mode keeps one pada per line (design §27 item 1). */
export function slotted(text, lang, { mantra = false } = {}) {
  if (!mantra) return raw(slotEsc(text, lang));
  const segs = String(text ?? "").split(/\n+/).flatMap((line) => splitPadas(line.trim()));
  return raw(segs.map((seg) => `<span class="pada">${joinDanda(slotEsc(seg, lang))}</span>`).join(""));
}

/** The occasion whose panditSays.sa carries sankalpa placeholders: `sankalp` first, else the first foundations record with {…}. */
export function sankalpaOccasion(data) {
  const has = (o) => (o.steps || []).some((s) => s.panditSays && typeof s.panditSays.sa === "string" && SLOT_RE.test(s.panditSays.sa));
  const byId = (data.occasions || []).find((o) => o.id === SANKALPA_OCCASION);
  if (byId && has(byId)) return byId;
  return (data.occasions || []).find((o) => o.group === "foundations" && has(o)) || null;
}

export function sankalpaCard(ctx, lang, data) {
  const R = ctx.R;
  const occ = sankalpaOccasion(data);
  const lines = occ ? (occ.steps || []).filter((s) => s.panditSays && typeof s.panditSays.sa === "string" && /\{[a-z][a-z0-9_-]*\}/.test(s.panditSays.sa)) : [];
  return html`<section class="card sankalpa-card" id="sankalpa" aria-labelledby="h-sankalpa" data-sankalpa-form data-l-remembered="${t(lang, "sankalpa.remembered")}">
<h2 id="h-sankalpa">${t(lang, "sankalpa.form_title")}</h2>
<div class="fields">
<label class="field"><span class="label">${t(lang, "sankalpa.gotra")}</span><input type="text" name="gotra" data-sankalpa-input="gotra" maxlength="60" autocomplete="off" spellcheck="false"></label>
<label class="field"><span class="label">${t(lang, "sankalpa.name")}</span><input type="text" name="name" data-sankalpa-input="name" maxlength="60" autocomplete="off" spellcheck="false"></label>
</div>
<div class="toolbar"><button class="btn btn-primary" type="button" data-sankalpa-remember>${t(lang, "sankalpa.remember")}</button><button class="btn" type="button" data-sankalpa-forget>${t(lang, "sankalpa.forget")}</button><output class="meta" data-sankalpa-status aria-live="polite"></output><span class="small note">${t(lang, "storage.note")}</span></div>
<p class="meta">${t(lang, "sankalpa.help")}</p>
<h3 id="h-sankalpa-example">${t(lang, "sankalpa.example_title")}</h3>
<p class="example" id="sankalpa-example">${slotted(t(lang, "sankalpa.example_line"), lang)}</p>
${lines.map((s, i) => html`<div class="verse sankalpa-line" data-step="${s.n}"><p class="mantra" lang="sa" id="sankalpa-sa-${i + 1}">${slotted(s.panditSays.sa, lang, { mantra: true })}</p>${s.action && s.action[lang] ? html`<p class="meta m0">${t(lang, "verse.step", { n: s.n })} — ${s.action[lang]}</p>` : ""}</div>`)}
${occ ? html`<p class="small m0"><a href="${R.href(`${lang}/occasions/${occ.slug}/`)}">${occ.title[lang]} →</a></p>` : ""}
</section>`;
}

/** "इस पृष्ठ में": the prose headings as a rail nav (ids s-1, s-2 … from md.mjs). */
export function onPageCard(lang, headings) {
  const items = (headings || []).filter((h) => h.level <= 3);
  if (items.length < 2) return "";
  return html`<div class="card on-page"><h2 class="rail-h">${t(lang, "reference.on_page")}</h2><nav aria-label="${t(lang, "reference.on_page")}"><ol>${items.map((h, i) => html`<li><a href="#${h.id}"><span class="n">${num(i + 1)}</span><span class="t">${h.text}</span></a></li>`)}</ol></nav></div>`;
}

export function referencePageBody(ctx, { lang, ref, data, derived }) {
  const md = ref.md && ref.md[lang];
  if (!md) throw new Error(`reference ${ref.slug}: no ${lang} Markdown`);
  const meta = md.meta || {};
  const prose = lessonProse(md, { ctx, lang, derived, sources: data.sources });
  const others = refList(data).filter((r) => r.slug !== ref.slug);
  const svara = prose.recs.some((r) => r.svara === true);
  return html`<div class="page-head">
<div><h1>${meta.title || ref.slug}</h1>${meta.summary ? html`<p class="lede m0">${meta.summary}</p>` : ""}</div>
</div>
<div class="layout has-right">
<div class="stack">
<article class="prose-wide ref-prose" id="content" data-verses="${prose.recs.length}">
${raw(prose.html)}
</article>
${ref.slug === "sankalpa" ? sankalpaCard(ctx, lang, data) : ""}
${sourcesSection(prose.recs, lang, { sources: data.sources })}
</div>
<aside class="rail rail-right">
${onPageCard(lang, prose.headings)}
${prose.recs.length || ref.slug === "sankalpa" ? readingSettings(ctx, lang) : ""}
${svara ? svaraLegend(lang) : ""}
${others.length ? html`<div class="card"><h2 class="rail-h">${t(lang, "reference.others")}</h2><nav aria-label="${t(lang, "reference.others")}"><ul>${others.map((r) => html`<li><a href="${refHref(ctx, lang, r)}"><span class="t">${refMeta(r, lang).title || r.slug}</span></a></li>`)}</ul></nav></div>` : ""}
</aside>
</div>`;
}

export function referencePagePage(ctx, { route, ref, data, derived }) {
  const lang = route.lang;
  const meta = refMeta(ref, lang);
  return layout(ctx, {
    route,
    title: meta.title || ref.slug,
    description: clip(meta.summary || meta.title || ref.slug),
    section: "reference",
    ogType: "article",
    crumbs: referenceCrumbs(ctx, lang),
    body: referencePageBody(ctx, { lang, ref, data, derived }),
  });
}
