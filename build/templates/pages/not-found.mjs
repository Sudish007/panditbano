// 404.html (design.md §3.2): trilingual, three blocks each with its own lang, language links, Occasions link
// (search link only when features.search — design-review MEDIUM 6), NO sacred motif (R4 §8.2 rule 4): no sprite.
import { html, t } from "../lib.mjs";
import { plainDocument } from "../layout.mjs";

export function notFoundPage(ctx, { route }) {
  const R = ctx.R;
  const block = (lang) => html`<section class="block" lang="${lang}">
<h2>${t(lang, "notfound.title")}</h2>
<p>${t(lang, "notfound.body")}</p>
<p class="links"><a class="btn" href="${R.href(`${lang}/`)}">${t(lang, "nav.home")}</a><a class="btn" href="${R.href(`${lang}/occasions/`)}">${t(lang, "nav.occasions")}</a>${ctx.features.search ? html`<a class="btn" href="${R.href(`${lang}/search/`)}" data-search>${t(lang, "nav.search")}</a>` : ""}</p>
</section>`;
  const body = html`<main id="main" class="plain">
<a class="wordmark" href="${R.href("hi/")}" lang="hi">${t("hi", "site.name")}</a>
<h1 class="sr">404</h1>
<div class="blocks">${block("hi")}${block("en")}${block("bho")}</div>
</main>`;
  return plainDocument(ctx, {
    lang: "hi",
    route: null, // no canonical / hreflang on the error page (noindex)
    pageType: "not-found",
    title: `${t("hi", "notfound.title")} · ${t("en", "notfound.title")}`,
    description: t("en", "notfound.body"),
    body,
    noindex: true,
  });
}
