// Long-text chapter view (design.md §4.5, §7.5, §7.8, §12 expand.mjs, §27 items 1, 4, 5; design-pick decision 2; FEAT-107).
// Routes /{lang}/texts/{slug}/{n}/ (part 1) and /{n}/p{k}/ (k ≥ 2): a chapter is split into parts of ≤ 40 verses
// (derive.paginate); verse anchors #v{n} are stable across parts, so the navigator links …/p2/#v57 for a verse on part 2.
// .layout.has-both: left rail = chapter list (aria-current="page") + verse navigator (40-px targets with 28-px discs,
// aria-current set by tracker.mjs); content = chapter intro, tools row (Expand all / Collapse all with aria-expanded,
// transliteration shortcut, the part pager as TEXT + link — never a bar, §27 item 4), the verse list (.verse-item =
// verseBlock + <details class="meaning">), pager, #sources; right rail = reading settings, svara legend (§27 item 5),
// source card, "कहाँ पढ़ा जाता है". At ≥ 1920 each .verse-item is two columns (site.css). Mantra paragraphs carry the
// text's lang (sa / awa / hi — plan §2.5) so UI-21 holds; the verse kind label follows verseKind for awa/hi texts.
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { verseBlock, padaCard, sourceLine, sourcesSection, sourceLink, svaraLegend, kindChip, kindLabel, mdContext, inlineProse } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { textHref, chapterHref, textsCrumbs, langLabel, usedInCard, clip, excerpt } from "./texts-index.mjs";

/** Verse kind label: the record's verseKind, else "mantra" for Vedic Sanskrit texts and "shloka" otherwise. */
export function verseKindLabel(v, text, lang) {
  return kindLabel(v, lang) || t(lang, `verse_kind.${(text.lang || "sa") === "sa" && text.kind === "vedic" ? "mantra" : "shloka"}`);
}

/** Part index (1-based) that holds verse number n, from the chapter's parts. */
export function partOf(chapter, n) {
  const i = chapter.parts.findIndex((p) => p.some((v) => v.v === n));
  return i < 0 ? 1 : i + 1;
}

/** Previous / next targets: the neighbouring part, else the neighbouring PUBLISHED chapter (its first part). */
export function neighbours(ctx, lang, text, chapter, k) {
  const chapters = text.chapters || [];
  const i = chapters.findIndex((c) => c.n === chapter.n);
  const prevCh = i > 0 ? chapters[i - 1] : null;
  const nextCh = i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null;
  const parts = chapter.parts.length;
  const prev = k > 1
    ? { href: chapterHref(ctx, lang, text, chapter.n, k - 1), label: t(lang, "verse.prev"), title: t(lang, "chapter.part", { k: num(k - 1), n: num(parts) }), kind: "part" }
    : prevCh ? { href: chapterHref(ctx, lang, text, prevCh.n), label: t(lang, "chapter.prev_chapter"), title: prevCh.title[lang], kind: "chapter" } : null;
  const next = k < parts
    ? { href: chapterHref(ctx, lang, text, chapter.n, k + 1), label: t(lang, "verse.next"), title: t(lang, "chapter.part", { k: num(k + 1), n: num(parts) }), kind: "part" }
    : nextCh ? { href: chapterHref(ctx, lang, text, nextCh.n), label: t(lang, "chapter.next_chapter"), title: nextCh.title[lang], kind: "chapter" } : null;
  return { prev, next, prevCh, nextCh };
}

function chapterRail(ctx, lang, text, chapter, k, verses) {
  const chapters = text.chapters || [];
  const onPage = new Set(verses.map((v) => v.v));
  const all = chapter.verses || [];
  return html`<aside class="rail rail-left">
<details class="rail-fold card" id="chapters"><summary><h2 class="rail-h">${t(lang, "texts.chapters")} · ${num(chapters.length)}</h2></summary>
<nav aria-label="${t(lang, "texts.chapters")}"><ol>${chapters.map((c) => html`<li><a href="${chapterHref(ctx, lang, text, c.n)}"${c.n === chapter.n ? raw(' aria-current="page"') : ""}><span class="n">${num(c.n)}</span><span class="t">${c.title[lang]}<span class="meta"> · ${num(c.verses.length)}</span></span></a></li>`)}</ol></nav>
</details>
${all.length > 1 ? html`<details class="rail-fold card" id="vnav"><summary><h2 class="rail-h">${t(lang, "chapter.navigator")} · ${num(all.length)}</h2></summary>
<nav aria-label="${t(lang, "chapter.navigator")}" data-tracker><ol class="vnav">${all.map((v) => {
    const here = onPage.has(v.v);
    const href = here ? `#v${v.v}` : `${chapterHref(ctx, lang, text, chapter.n, partOf(chapter, v.v))}#v${v.v}`;
    return html`<li><a href="${href}"${here ? html` data-step="${v.v}"` : ""} aria-label="${verseKindLabel(v, text, lang)} ${num(v.v)}"><span class="n">${num(v.v)}</span></a></li>`;
  })}</ol></nav>
</details>` : ""}
</aside>`;
}

function partPagerText(lang, verses, total) {
  return t(lang, "verse.pager", { from: num(verses[0].v), to: num(verses[verses.length - 1].v), total: num(total) });
}

function toolsRow(ctx, lang, text, chapter, k, verses, nb) {
  const parts = chapter.parts.length;
  return html`<div class="chapter-tools" role="group" aria-label="${t(lang, "chapter.tools")}">
<div class="toolbar">
<button class="btn btn-ghost" type="button" data-expand="open" aria-controls="verses" aria-expanded="false">${icon("i-list")}${t(lang, "verse.expand_all")}</button>
<button class="btn btn-ghost" type="button" data-expand="close" aria-controls="verses" aria-expanded="false">${t(lang, "verse.collapse_all")}</button>
<a class="btn btn-ghost" href="#reading-settings">${icon("i-settings")}${t(lang, "translit.label")}</a>
</div>
${parts > 1 ? html`<nav class="pager pager-part" aria-label="${t(lang, "chapter.pager_label")}">
<span class="meta">${partPagerText(lang, verses, chapter.verses.length)}</span>
${nb.prev && nb.prev.kind === "part" ? html`<a class="btn btn-ghost" rel="prev" href="${nb.prev.href}">${nb.prev.label}</a>` : ""}
${nb.next && nb.next.kind === "part" ? html`<a class="btn btn-ghost" rel="next" href="${nb.next.href}">${nb.next.label}</a>` : ""}
</nav>` : ""}
</div>`;
}

/** One verse item: chips (kind + number, locator), speaker line, the verse block, the collapsed meaning panel. */
export function verseItem(v, { ctx, lang, text, derived, sources, total, mdCtx }) {
  const kind = verseKindLabel(v, text, lang);
  const meaning = v.meaning && v.meaning[lang];
  const explanation = v.explanation && v.explanation[lang];
  const note = v.note && v.note[lang];
  return html`<article class="verse-item" id="v${v.v}">
<div class="chips"><span class="chip">${t(lang, "chapter.verse_n", { kind, n: num(v.v) })}${total ? html`<span class="sr"> / ${num(total)}</span>` : ""}</span>${v.locator ? html`<span class="chip chip-paddhati">${v.locator}</span>` : ""}${v.phalashruti === true ? html`<span class="chip chip-lok">${t(lang, "verse.phalashruti")}</span>` : ""}</div>
${v.speaker ? html`<p class="speaker" lang="${text.lang || "sa"}">${v.speaker}</p>` : ""}
${verseBlock(v, lang, { n: v.v, textLang: text.lang || "sa", id: `m-${v.id}` })}
<details class="meaning" id="meaning-${v.v}"><summary>${t(lang, "verse.meaning")}</summary>
<div class="prose">
${meaning ? html`<p>${inlineProse(meaning, mdCtx)}</p>` : ""}
${explanation ? html`<p class="label">${t(lang, "verse.explain")}</p><p>${inlineProse(explanation, mdCtx)}</p>` : ""}
${note ? html`<p class="label">${t(lang, "verse.note")}</p><p>${inlineProse(note, mdCtx)}</p>` : ""}
${padaCard(v, lang, { id: `pada-${v.id}`, heading: "h3" })}
${v.source ? sourceLine(v, lang, { sources }) : ""}
</div>
</details>
</article>`;
}

function sourceCard(lang, text, chapter, sources) {
  const main = chapter.source && sources ? sources.get(chapter.source.ref) : null;
  const checked = (chapter.checkedAgainst || []).map((c) => sources && sources.get(c.ref)).filter(Boolean);
  if (!main && !checked.length && !chapter.locator) return "";
  return html`<div class="card source-card"><h2 class="rail-h">${t(lang, "chapter.source_card")}</h2>
${main ? html`<p class="meta m0">${t(lang, "verse.source")}: ${sourceLink(main, lang)}${chapter.locator ? html` · ${chapter.locator}` : ""}</p>` : chapter.locator ? html`<p class="meta m0">${t(lang, "verse.locator")}: ${chapter.locator}</p>` : ""}
${checked.length ? html`<p class="meta">${t(lang, "verse.checked")}: ${checked.map((e, i) => html`${i ? ", " : ""}${sourceLink(e, lang)}`)}</p>` : ""}
</div>`;
}

export function chapterBody(ctx, { lang, text, chapter, k, data, derived, occasionsById }) {
  const R = ctx.R;
  const parts = chapter.parts;
  const verses = parts[k - 1] || [];
  const total = chapter.verses.length;
  const nb = neighbours(ctx, lang, text, chapter, k);
  const mdCtx = mdContext(ctx, lang, derived);
  const sources = data.sources;
  const vidhi = text.vidhiOccasionId && occasionsById ? occasionsById.get(text.vidhiOccasionId) : null;
  const svara = verses.some((v) => v.svara === true);
  const kindOf = verseKindLabel(verses[0] || {}, text, lang);
  return html`<div class="page-head">
<div><h1>${chapter.title[lang]}</h1>
<p class="meta">${kindChip(text, lang)}<span>${langLabel(lang, text)}</span>${chapter.locator ? html`<span>${chapter.locator}</span>` : ""}<span>${num(total)} ${kindOf}</span>${parts.length > 1 ? html`<span>${t(lang, "chapter.part", { k: num(k), n: num(parts.length) })}</span>` : ""}</p></div>
<div class="actions"><a class="btn" href="${textHref(ctx, lang, text)}">${icon("i-book")}${t(lang, "chapter.back_text")}</a>${vidhi ? html`<a class="btn" href="${R.href(`${lang}/occasions/${vidhi.slug}/`)}">${t(lang, "texts.vidhi_link")}</a>` : ""}</div>
</div>
<div class="layout has-both">
${chapterRail(ctx, lang, text, chapter, k, verses)}
<div class="stack">
${k === 1 && chapter.intro && chapter.intro[lang] ? html`<section id="intro" class="prose" aria-label="${t(lang, "texts.intro")}"><p>${inlineProse(chapter.intro[lang], mdCtx)}</p></section>` : ""}
${toolsRow(ctx, lang, text, chapter, k, verses, nb)}
<div class="verse-list stack" id="verses">${verses.map((v) => verseItem(v, { ctx, lang, text, derived, sources, total, mdCtx }))}</div>
<nav class="pager" aria-label="${t(lang, "chapter.pager_label")}">
${nb.prev ? html`<a class="btn" rel="prev" href="${nb.prev.href}">${nb.prev.label}<span class="sr"> — ${nb.prev.title}</span></a>` : html`<span></span>`}
${parts.length > 1 ? html`<span class="meta">${partPagerText(lang, verses, total)}</span>` : html`<a class="btn btn-ghost" href="${textHref(ctx, lang, text)}">${t(lang, "chapter.back_text")}</a>`}
${nb.next ? html`<a class="btn" rel="next" href="${nb.next.href}">${nb.next.label}<span class="sr"> — ${nb.next.title}</span></a>` : html`<span></span>`}
</nav>
${sourcesSection([chapter, text, ...verses.filter((v) => v.source)], lang, { sources })}
</div>
<aside class="rail rail-right">
${readingSettings(ctx, lang)}
${svara ? svaraLegend(lang) : ""}
${sourceCard(lang, text, chapter, sources)}
${usedInCard(ctx, lang, text, { derived, occasionsById, chapter: chapter.n })}
</aside>
</div>`;
}

export function chapterPage(ctx, { route, text, chapter, k = 1, data, derived, occasionsById }) {
  const lang = route.lang;
  const nb = neighbours(ctx, lang, text, chapter, k);
  const parts = chapter.parts.length;
  const title = `${text.title[lang]} · ${chapter.title[lang]}${parts > 1 ? ` · ${t(lang, "chapter.part", { k: num(k), n: num(parts) })}` : ""}`;
  const first = (chapter.parts[k - 1] || [])[0];
  // excerpt, not clip: a [[term]] mark in the intro / first meaning leaked into the meta description (FIX-1a)
  const description = excerpt((chapter.intro && chapter.intro[lang]) || (first && first.meaning && first.meaning[lang]) || text.intro[lang], mdContext(ctx, lang, derived));
  return layout(ctx, {
    route,
    title,
    description,
    section: "texts",
    ogType: "article",
    crumbs: textsCrumbs(ctx, lang, text),
    headExtra: html`${nb.prev ? html`<link rel="prev" href="${nb.prev.href}">\n` : ""}${nb.next ? html`<link rel="next" href="${nb.next.href}">` : ""}`,
    body: chapterBody(ctx, { lang, text, chapter, k, data, derived, occasionsById }),
  });
}
