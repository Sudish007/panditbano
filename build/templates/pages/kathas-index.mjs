// Kathas index (design.md §3.2 kathas-index, §4.8; FEAT-107): one card per katha — title, lede, deity, the computed adhyaya
// count and the number of original verses its adhyayas reference. Shared helpers for the katha pages live here.
import { html, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

export const kathaHref = (ctx, lang, katha, n = null) => ctx.R.href(`${lang}/kathas/${katha.slug}/${n ? `${n}/` : ""}`);

/** Adhyayas in n order. */
export const adhyayasOf = (katha) => (katha.adhyayas || []).slice().sort((a, b) => a.n - b.n);
/** Number of original verses the katha's adhyayas reference (verseRefs). */
export const verseRefCount = (katha, adhyaya = null) => (adhyaya ? [adhyaya] : adhyayasOf(katha)).reduce((n, a) => n + ((a.verseRefs || []).length), 0);

export function kathasCrumbs(ctx, lang, katha = null) {
  const R = ctx.R;
  const crumbs = [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/kathas/`), label: t(lang, "nav.kathas") }];
  if (katha) crumbs.push({ href: kathaHref(ctx, lang, katha), label: katha.title[lang] });
  return crumbs;
}

export function kathaCard(ctx, katha, lang) {
  const n = adhyayasOf(katha).length;
  const verses = verseRefCount(katha);
  return html`<a class="card card-link katha-card" href="${kathaHref(ctx, lang, katha)}">
${katha.deity ? html`<span class="chip chip-paddhati" lang="sa">${katha.deity}</span>` : ""}
<h3 class="m0">${katha.title[lang]}</h3>
<p class="m0">${clip(katha.lede[lang])}</p>
<span class="meta">${t(lang, "kathas.adhyayas", { n: num(n) })}${verses ? ` · ${t(lang, "counts.verses", { n: num(verses) })}` : ""}</span>
<span class="more">${t(lang, "home.more")}</span>
</a>`;
}

export function kathasIndexBody(ctx, { lang, kathas }) {
  const list = kathas.slice().sort((a, b) => String(a.title[lang]).localeCompare(String(b.title[lang]), lang === "en" ? "en" : "hi"));
  return html`<div class="page-head">
<div><h1>${t(lang, "kathas.title")}</h1><p class="lede m0">${t(lang, "kathas.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.kathas", { n: num(list.length) })}</span></div>
</div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${list.map((k) => kathaCard(ctx, k, lang))}</div>`;
}

export function kathasIndexPage(ctx, { route, kathas }) {
  const lang = route.lang;
  const R = ctx.R;
  return layout(ctx, {
    route,
    title: t(lang, "kathas.title"),
    description: clip(t(lang, "kathas.lede")),
    section: "kathas",
    crumbs: [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: kathasIndexBody(ctx, { lang, kathas }),
  });
}
