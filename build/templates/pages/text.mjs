// Text landing (design.md §3.2 text, §4.5; brief §6.1; FEAT-107): intro, the attribution caveat (.caveat) where the record
// has one, the list of PUBLISHED chapters with their verse counts (an unpublished chapter has no card — no "coming soon"),
// the paath-vidhi occasion link, the occasions that recite the text (derived textRefs) and #sources with the
// attribution lines of the text and its chapters. Every count is computed from the data.
import { html, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { kindChip, sourcesSection, mdContext, inlineProse } from "../components/verse.mjs";
import { textHref, chapterHref, textsCrumbs, langLabel, textCounts, usedInCard, clip, excerpt } from "./texts-index.mjs";

export function chapterCard(ctx, lang, text, ch) {
  const kind = ch.verses && ch.verses[0] && ch.verses[0].verseKind ? t(lang, `verse_kind.${ch.verses[0].verseKind}`) : null;
  const n = ch.verses.length;
  return html`<li><a class="card card-link chapter-card" href="${chapterHref(ctx, lang, text, ch.n)}">
<span class="chip">${t(lang, "occasion.chapter", { n: num(ch.n) })}</span>
<h3 class="m0">${ch.title[lang]}</h3>
${ch.intro && ch.intro[lang] ? html`<p class="m0">${clip(ch.intro[lang], 140)}</p>` : ""}
<span class="meta">${kind ? `${num(n)} ${kind}` : t(lang, "counts.verses", { n: num(n) })}${ch.locator ? ` · ${ch.locator}` : ""}${ch.parts.length > 1 ? ` · ${t(lang, "counts.pages", { n: num(ch.parts.length) })}` : ""}</span>
<span class="more">${t(lang, "home.more")}</span>
</a></li>`;
}

export function textBody(ctx, { lang, text, data, derived, occasionsById }) {
  const R = ctx.R;
  const mdCtx = mdContext(ctx, lang, derived);
  const vidhi = text.vidhiOccasionId && occasionsById ? occasionsById.get(text.vidhiOccasionId) : null;
  const chapters = text.chapters || [];
  return html`<div class="page-head">
<div><h1>${text.title[lang]}</h1>
<p class="meta">${kindChip(text, lang)}<span>${langLabel(lang, text)}</span>${text.deity ? html`<span>${t(lang, "texts.deity")}: <span lang="sa">${text.deity}</span></span>` : ""}<span>${textCounts(lang, text)}</span></p></div>
${chapters.length ? html`<div class="actions"><a class="btn btn-primary" href="${chapterHref(ctx, lang, text, chapters[0].n)}">${t(lang, "occasion.chapter", { n: num(chapters[0].n) })} →</a>${vidhi ? html`<a class="btn" href="${R.href(`${lang}/occasions/${vidhi.slug}/`)}">${t(lang, "texts.vidhi_link")}</a>` : ""}</div>` : ""}
</div>
<div class="layout has-right">
<div class="stack">
<section id="intro" class="prose" aria-label="${t(lang, "texts.intro")}">
<p>${inlineProse(text.intro[lang], mdCtx)}</p>
${text.author && text.author[lang] ? html`<p class="meta">${text.author[lang]}</p>` : ""}
</section>
${text.attributionCaveat && text.attributionCaveat[lang] ? html`<p class="caveat">${inlineProse(text.attributionCaveat[lang], mdCtx)}</p>` : ""}
<section id="chapters" aria-labelledby="h-chapters">
<div class="section-head"><h2 id="h-chapters">${t(lang, "texts.chapters")}</h2><span class="meta">${t(lang, "counts.chapters", { n: num(chapters.length) })}</span></div>
${chapters.length ? html`<ol class="grid grid-md-2 grid-lg-3" aria-label="${t(lang, "texts.chapters")}">${chapters.map((ch) => chapterCard(ctx, lang, text, ch))}</ol>` : html`<p class="meta m0">${t(lang, "occasions.empty_group")}</p>`}
</section>
${sourcesSection([text, ...text.allChapters.filter((c) => c.published)], lang, { sources: data.sources })}
</div>
<aside class="rail rail-right">
${vidhi ? html`<div class="card"><h2 class="rail-h">${t(lang, "texts.vidhi_link")}</h2><nav aria-label="${t(lang, "texts.vidhi_link")}"><ul><li><a href="${R.href(`${lang}/occasions/${vidhi.slug}/`)}"><span class="n">→</span><span class="t">${vidhi.title[lang]}</span></a></li><li><a href="${R.href(`${lang}/occasions/${vidhi.slug}/pothi/`)}"><span class="n">≡</span><span class="t">${t(lang, "pothi.label")}</span></a></li></ul></nav></div>` : ""}
${usedInCard(ctx, lang, text, { derived, occasionsById })}
<div class="card"><h2 class="rail-h">${t(lang, "nav.texts")}</h2><nav aria-label="${t(lang, "nav.texts")}"><ul><li><a href="${R.href(`${lang}/texts/`)}"><span class="n">≡</span><span class="t">${t(lang, "texts.all")}</span></a></li><li><a href="${R.href(`${lang}/mantras/`)}"><span class="n">ॐ</span><span class="t">${t(lang, "mantras.title")}</span></a></li></ul></nav></div>
</aside>
</div>`;
}

export function textPage(ctx, { route, text, data, derived, occasionsById }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: text.title[lang],
    description: excerpt(text.intro[lang], mdContext(ctx, lang, derived)),
    section: "texts",
    ogType: "article",
    crumbs: textsCrumbs(ctx, lang),
    body: textBody(ctx, { lang, text, data, derived, occasionsById }),
  });
}

export { textHref };
