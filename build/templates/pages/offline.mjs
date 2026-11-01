// /{lang}/offline/ — service-worker navigation fallback (design.md §3.2, §19). No chrome, no motif; the saved-items
// list is filled by offline.mjs (FEAT-109) from pb-saved.
import { html, t } from "../lib.mjs";
import { plainDocument } from "../layout.mjs";

export function offlinePage(ctx, { route }) {
  const lang = route.lang;
  const R = ctx.R;
  const body = html`<main id="main" class="plain">
<a class="wordmark" href="${R.href(`${lang}/`)}">${t(lang, "site.name")}</a>
<section class="block">
<h1>${t(lang, "offline.offline_title")}</h1>
<p>${t(lang, "offline.offline_body")}</p>
<p class="links"><a class="btn btn-primary" href="${R.href(`${lang}/`)}">${t(lang, "nav.home")}</a><a class="btn" href="${R.href(`${lang}/occasions/`)}">${t(lang, "nav.occasions")}</a></p>
</section>
<section class="block saved-list" data-saved-list hidden aria-labelledby="h-saved">
<h2 id="h-saved">${t(lang, "offline.saved_list")}</h2>
<ul class="compact-steps" data-saved-items></ul>
</section>
</main>`;
  return plainDocument(ctx, {
    lang,
    route,
    pageType: "offline",
    title: t(lang, "offline.offline_title"),
    description: t(lang, "offline.offline_body"),
    body,
    noindex: true,
  });
}
