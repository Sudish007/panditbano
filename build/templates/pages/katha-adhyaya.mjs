// Katha adhyaya page (design.md §3.2 katha-adhyaya, §4.6, §11.3; plan §2.5 {{verse:}}; §27 items 1 and 5; FEAT-107): the
// own-words retelling (Markdown → .prose.dropcap) in which every {{verse:<textSlug>-<n>-<v>}} becomes a collapsible
// <details class="mula"> "मूल श्लोक" panel holding the original verse block (lang of its text) and its prose meaning;
// .katha-nav with the current adhyaya; left rail = adhyaya list; right rail = reading settings (when verses are on the page),
// svara legend (§27 item 5), the chapter of the Sanskrit text; pager + rel prev/next between adhyayas; #sources.
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { renderMarkdown } from "../../lib/md.mjs";
import { verseBlock, sourcesSection, svaraLegend, mdContext, inlineProse } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { kathaHref, kathasCrumbs, adhyayasOf, verseRefCount, clip } from "./kathas-index.mjs";
import { kathaNav, adhyayaFold, adhyayaMeta, readingMinutes, kathaSourceRecords } from "./katha.mjs";
import { chapterHref } from "./texts-index.mjs";
import { verseKindLabel } from "./chapter.mjs";

/** <details class="mula"> for one verse ref; null when the id is not in the corpus (the gate's G5 fails that first). */
export function mulaPanel(id, { ctx, lang, derived, sources, open = false }) {
  const hit = derived.verseById && derived.verseById.get(id);
  if (!hit) return null;
  const { verse, text, chapter } = hit;
  const meaning = verse.meaning && verse.meaning[lang];
  const mdCtx = mdContext(ctx, lang, derived);
  const label = `${t(lang, "katha.mula")} — ${verseKindLabel(verse, text, lang)} ${num(verse.v)}`;
  const link = chapter.published ? `${chapterHref(ctx, lang, text, chapter.n, Math.max(1, chapter.parts.findIndex((p) => p.some((v) => v.v === verse.v)) + 1))}#v${verse.v}` : null;
  return html`<details class="mula" id="mula-${id}" data-verse="${id}"${open ? raw(" open") : ""}><summary>${label}</summary>
<div class="mula-body">
${verse.speaker ? html`<p class="speaker" lang="${text.lang || "sa"}">${verse.speaker}</p>` : ""}
${verseBlock(verse, lang, { n: verse.v, textLang: text.lang || "sa", id: `m-${id}` })}
${meaning ? html`<p class="meta mula-meaning">${t(lang, "verse.meaning")}: ${inlineProse(meaning, mdCtx)}</p>` : ""}
${link ? html`<p class="small m0"><a href="${link}">${text.title[lang]} — ${chapter.title[lang]} →</a></p>` : ""}
</div>
</details>`.toString();
}

/** The retelling: Markdown with the mula panels resolved; the first paragraph gets the drop cap. Returns { html, verses } */
export function retelling(md, { ctx, lang, derived, sources }) {
  const verses = [];
  const mdCtx = {
    ...mdContext(ctx, lang, derived),
    verse: (id) => { const p = mulaPanel(id, { ctx, lang, derived, sources }); if (p !== null) verses.push(id); return p; },
  };
  const r = renderMarkdown(md.body, mdCtx);
  const unresolved = r.unresolved.filter((u) => u.type === "verse");
  if (unresolved.length) throw new Error(`katha retelling: unresolved {{verse:}} ${unresolved.map((u) => u.arg).join(", ")}`);
  return { html: r.html.replace("<p>", '<p class="dropcap">'), verses, headings: r.headings };
}

export function kathaAdhyayaBody(ctx, { lang, katha, adhyaya, data, derived, occasionsById }) {
  const R = ctx.R;
  const list = adhyayasOf(katha);
  const i = list.findIndex((a) => a.n === adhyaya.n);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const md = katha.md && katha.md[adhyaya.n] && katha.md[adhyaya.n][lang];
  if (!md) throw new Error(`katha ${katha.id}: adhyaya ${adhyaya.n} has no ${lang} Markdown`);
  const meta = adhyayaMeta(katha, adhyaya.n, lang);
  const story = retelling(md, { ctx, lang, derived, sources: data.sources });
  const text = katha.textId ? (data.texts || []).find((x) => x.id === katha.textId) : null;
  const refs = (adhyaya.verseRefs || []).map((id) => derived.verseById && derived.verseById.get(id)).filter(Boolean);
  const svara = refs.some((h) => h.verse.svara === true);
  const chapters = new Map();
  for (const h of refs) chapters.set(`${h.text.id}-${h.chapter.n}`, h);
  const occ = occasionsById.get(katha.vidhiOccasionId);
  return html`<div class="page-head">
<div><h1>${adhyaya.title[lang]}</h1>${meta.summary ? html`<p class="lede m0">${meta.summary}</p>` : ""}
<p class="meta"><span>${t(lang, "katha.of", { i: num(i + 1), n: num(list.length) })}</span>${refs.length ? html`<span>${t(lang, "counts.verses", { n: num(verseRefCount(katha, adhyaya)) })}</span>` : ""}<span>${t(lang, "katha.reading_time", { n: num(readingMinutes(md.body)) })}</span></p></div>
<div class="actions"><a class="btn" href="${kathaHref(ctx, lang, katha)}">${icon("i-book")}${t(lang, "katha.back")}</a>${occ ? html`<a class="btn" href="${kathaHref(ctx, lang, katha)}#vidhi">${t(lang, "katha.vidhi")}</a>` : ""}</div>
</div>
${kathaNav(ctx, lang, katha, { current: adhyaya.n, vidhiHref: `${kathaHref(ctx, lang, katha)}#vidhi` })}
<div class="layout has-both">
<aside class="rail rail-left">
${adhyayaFold(ctx, lang, katha, { current: adhyaya.n })}
</aside>
<div class="stack">
<article class="prose dropcap retelling" id="retelling" aria-label="${t(lang, "katha.retelling", { title: adhyaya.title[lang] })}" data-verses="${story.verses.length}">
${raw(story.html)}
</article>
<p class="meta own-words">${t(lang, "katha.own_words")}</p>
<nav class="pager" aria-label="${t(lang, "katha.adhyayas")}">
${prev ? html`<a class="btn" rel="prev" href="${kathaHref(ctx, lang, katha, prev.n)}">${t(lang, "katha.prev")}<span class="sr"> — ${prev.title[lang]}</span></a>` : html`<span></span>`}
<a class="btn btn-ghost" href="${kathaHref(ctx, lang, katha)}">${t(lang, "katha.back")}</a>
${next ? html`<a class="btn btn-primary" rel="next" href="${kathaHref(ctx, lang, katha, next.n)}">${t(lang, "katha.next")}<span class="sr"> — ${next.title[lang]}</span></a>` : html`<a class="btn btn-primary" href="${kathaHref(ctx, lang, katha)}#vidhi">${t(lang, "katha.vidhi")} →</a>`}
</nav>
${sourcesSection([...kathaSourceRecords(katha, text), ...[...chapters.values()].map((h) => h.chapter), ...refs.map((h) => h.verse).filter((v) => v.source)], lang, { sources: data.sources })}
</div>
<aside class="rail rail-right">
${story.verses.length ? readingSettings(ctx, lang) : ""}
${svara ? svaraLegend(lang) : ""}
${chapters.size ? html`<div class="card"><h2 class="rail-h">${t(lang, "katha.text_link")}</h2><nav aria-label="${t(lang, "katha.text_link")}"><ul>${[...chapters.values()].map((h) => html`<li><a href="${h.chapter.published ? chapterHref(ctx, lang, h.text, h.chapter.n) : R.href(`${lang}/texts/${h.text.slug}/`)}"><span class="n">${num(h.chapter.n)}</span><span class="t">${h.text.title[lang]} — ${h.chapter.title[lang]}</span></a></li>`)}</ul></nav></div>` : ""}
</aside>
</div>`;
}

export function kathaAdhyayaPage(ctx, { route, katha, adhyaya, data, derived, occasionsById }) {
  const lang = route.lang;
  const list = adhyayasOf(katha);
  const i = list.findIndex((a) => a.n === adhyaya.n);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const meta = adhyayaMeta(katha, adhyaya.n, lang);
  return layout(ctx, {
    route,
    title: `${katha.title[lang]} · ${adhyaya.title[lang]}`,
    description: clip(meta.summary || katha.lede[lang]),
    section: "kathas",
    ogType: "article",
    crumbs: kathasCrumbs(ctx, lang, katha),
    headExtra: html`${prev ? html`<link rel="prev" href="${kathaHref(ctx, lang, katha, prev.n)}">\n` : ""}${next ? html`<link rel="next" href="${kathaHref(ctx, lang, katha, next.n)}">` : ""}`,
    body: kathaAdhyayaBody(ctx, { lang, katha, adhyaya, data, derived, occasionsById }),
  });
}
