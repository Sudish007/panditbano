// Reference index (design.md §3.2 reference, §4.8, §16.1; FEAT-108): one card per reference page (title + summary from the
// Markdown front matter, in the REFERENCE_SLUGS order, then any other slug) and the Shubhvela card (dates and muhurat are
// never computed here — brief §2.3). Shared helpers for the reference page live here (refHref, refMeta, refList, referenceCrumbs).
import { html, raw, t, extLink, num } from "../lib.mjs";
import { layout, SHUBHVELA } from "../layout.mjs";
import { REFERENCE_SLUGS } from "../../lib/routes.mjs";
import { tp } from "../components/names.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
export const refHref = (ctx, lang, ref) => ctx.R.href(`${lang}/reference/${ref.slug}/`);
/** Front matter {title, summary} of a reference page in the page language. */
export const refMeta = (ref, lang) => (ref.md && ref.md[lang] && ref.md[lang].meta) || {};
/** Reference pages in the design §3.2 order, unknown slugs after them alphabetically. */
export function refList(data) {
  const order = new Map(REFERENCE_SLUGS.map((s, i) => [s, i]));
  return (data.reference || []).slice().sort((a, b) => (order.has(a.slug) ? order.get(a.slug) : 99) - (order.has(b.slug) ? order.get(b.slug) : 99) || a.slug.localeCompare(b.slug));
}
export function referenceCrumbs(ctx, lang) {
  const R = ctx.R;
  return [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/reference/`), label: t(lang, "nav.reference") }];
}

export function refCard(ctx, lang, ref) {
  const meta = refMeta(ref, lang);
  return html`<a class="card card-link ref-card" href="${refHref(ctx, lang, ref)}"><h3 class="m0">${meta.title || ref.slug}</h3>${meta.summary ? html`<p class="m0">${clip(meta.summary)}</p>` : ""}<span class="more">${t(lang, "katha.read")}</span></a>`;
}

export function shubhvelaCard(ctx, lang, { heading = "h3" } = {}) {
  const H = heading;
  return html`<div class="card shubhvela-card">${raw(`<${H} class="m0">`)}${t(lang, "home.today_heading")}${raw(`</${H}>`)}<p class="m0">${t(lang, "honesty.no_dates")} ${tp(ctx, lang, "home.today_body")}</p><div class="chips">${extLink(lang, `${SHUBHVELA}${lang}/panchang/new-delhi/`, t(lang, "shubhvela.panchang"), { cls: "chip" })}${extLink(lang, `${SHUBHVELA}${lang}/festivals/`, t(lang, "shubhvela.festivals"), { cls: "chip" })}${extLink(lang, `${SHUBHVELA}${lang}/muhurat/`, t(lang, "shubhvela.muhurat"), { cls: "chip" })}</div></div>`;
}

export function referenceBody(ctx, { lang, data }) {
  const list = refList(data);
  return html`<div class="page-head">
<div><h1>${t(lang, "reference.title")}</h1><p class="lede m0">${tp(ctx, lang, "reference.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.pages", { n: num(list.length) })}</span></div>
</div>
<section id="pages" aria-labelledby="h-pages">
<h2 id="h-pages" class="sr">${t(lang, "reference.pages")}</h2>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${list.map((r) => refCard(ctx, lang, r))}${shubhvelaCard(ctx, lang)}</div>
</section>`;
}

export function referencePage(ctx, { route, data }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: t(lang, "reference.title"),
    description: clip(t(lang, "reference.lede")),
    section: "reference",
    crumbs: [{ href: ctx.R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: referenceBody(ctx, { lang, data }),
  });
}
