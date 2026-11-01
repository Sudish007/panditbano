// Page shell (design.md §4.1, §9, §17; mock_shell.py#header/footer). Every page except pothi / 404 / offline uses
// layout(); those three use plainDocument(). The inline head script (≤ 400 bytes) sets data-theme and data-translit
// before first paint and validates both values (design-review NIT 8).
import { html, raw, t, icon, extLink, uiSprite, esc } from "./lib.mjs";
import { NAV_SECTIONS, STATIC_SLUGS } from "../lib/routes.mjs";

export const HEAD_SCRIPT =
  "<script>(function(){var d=document.documentElement,g=function(k){try{return localStorage.getItem(k)}catch(e){return null}},t=g('pb-theme'),r=g('pb-translit');" +
  "d.setAttribute('data-theme',t==='dark'||t==='system'?t:'light');d.setAttribute('data-translit',r==='easy'||r==='off'?r:'iast')})();</script>";

export const GITHUB_REPO = "https://github.com/Sudish007/panditbano";
export const SHUBHVELA = "https://sudish007.github.io/shubhvela/";

const SECTION_PATH = { learn: "learn/", occasions: "occasions/", texts: "texts/", kathas: "kathas/", glossary: "glossary/", reference: "reference/", search: "search/" };

/** <head> content shared by shell pages and plain pages. */
export function headTags(ctx, { lang, route, title, description, noindex = false, ogType = "website" }) {
  const { R, assets, themeColors, hash } = ctx;
  const site = t(lang, "site.name");
  const alts = route ? R.hreflangs(route) : [];
  return html`<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — ${site}</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${themeColors.light}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${themeColors.dark}">
<meta name="pb-build" content="${hash}">
${noindex ? html`<meta name="robots" content="noindex">` : ""}
${route ? html`<link rel="canonical" href="${route.abs}">` : ""}
${alts.map((a) => html`<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}">\n`)}
${route ? html`<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${route.abs}">
<meta property="og:site_name" content="${site}">
<meta property="og:type" content="${ogType}">
${lang === "hi" || lang === "en" ? html`<meta property="og:locale" content="${lang}_IN">` : ""}` : ""}
<link rel="icon" href="${R.href("assets/icons/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R.href("assets/icons/icon-192.png")}">
<link rel="manifest" href="${R.href(`${lang}/manifest.webmanifest`)}">
<link rel="preload" href="${R.href("fonts/noto-sans-devanagari/NotoSansDevanagari-Regular.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${R.href("fonts/tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2")}" as="font" type="font/woff2" crossorigin>
${raw(HEAD_SCRIPT)}
<link rel="stylesheet" href="${R.href(assets.css)}">`;
}

export function themeButton(lang) {
  const L = (k) => `${t(lang, "theme.label")}: ${t(lang, `theme.${k}`)}`;
  return html`<button class="btn" type="button" data-theme-toggle aria-live="polite" data-l-light="${L("light")}" data-l-dark="${L("dark")}" data-l-system="${L("system")}">${icon("i-sun", { cls: "ic" })}${icon("i-moon", { cls: "ic", hidden: true })}${icon("i-auto", { cls: "ic", hidden: true })}<span class="lbl">${L("light")}</span></button>`;
}

export function langSeg(ctx, lang, route) {
  const alts = ctx.R.alternates(route);
  return html`<nav class="seg" aria-label="${t(lang, "lang.label")}">${["hi", "en", "bho"].map(
    (l) => html`<a href="${alts[l]}" lang="${l}" hreflang="${l}" data-lang="${l}"${l === lang ? raw(' aria-current="true"') : ""}><span class="long">${t(lang, `lang.${l}.long`)}</span><span class="short">${t(lang, `lang.${l}.short`)}</span></a>`
  )}</nav>`;
}

function navItems(ctx, lang, section, { withSearch = false } = {}) {
  const items = [];
  if (withSearch && ctx.features.search) {
    items.push(html`<li><a href="${ctx.R.href(`${lang}/search/`)}" data-search>${icon("i-search", { size: 18 })}${t(lang, "nav.search")}</a></li>`);
  }
  for (const key of NAV_SECTIONS) {
    items.push(html`<li><a href="${ctx.R.href(`${lang}/${SECTION_PATH[key]}`)}"${key === section ? raw(' aria-current="page"') : ""}>${t(lang, `nav.${key}`)}</a></li>`);
  }
  return items;
}

export function header(ctx, { lang, route, section }) {
  const home = ctx.R.href(`${lang}/`);
  const search = ctx.features.search
    ? html`<span class="nav-row"><a class="btn btn-icon" href="${ctx.R.href(`${lang}/search/`)}" data-search aria-label="${t(lang, "nav.search")}" title="${t(lang, "nav.search")}">${icon("i-search", { size: 22 })}</a></span>`
    : "";
  return html`<header class="site-head">
<div class="container head-row">
<a class="brand" href="${home}" aria-label="${t(lang, "site.name")} — ${t(lang, "nav.home")}">${icon("m-diya", { cls: "mark", size: 30 })}<span>${t(lang, "site.name")}</span></a>
<div class="nav-row"><ul class="nav" aria-label="${t(lang, "nav.sections")}">${navItems(ctx, lang, section)}</ul></div>
<div class="head-ctl">${search}${langSeg(ctx, lang, route)}${themeButton(lang)}</div>
</div>
<div class="container head-mobile-nav"><ul class="nav" aria-label="${t(lang, "nav.sections")}">${navItems(ctx, lang, section, { withSearch: true })}</ul></div>
<svg class="band" aria-hidden="true" focusable="false"><defs><pattern id="band-jaali" width="18" height="18" patternUnits="userSpaceOnUse"><use href="#m-jaali" width="18" height="18"/></pattern></defs><rect width="100%" height="100%" fill="url(#band-jaali)"/></svg>
</header>`;
}

export function breadcrumbs(lang, crumbs) {
  if (!crumbs || !crumbs.length) return "";
  return html`<nav aria-label="${t(lang, "nav.crumbs")}"><ol class="crumbs">${crumbs.map((c) => html`<li><a href="${c.href}">${c.label}</a></li>`)}</ol></nav>`;
}

export function footer(ctx, { lang, route }) {
  const R = ctx.R;
  const home = R.href(`${lang}/`);
  const sections = [...NAV_SECTIONS, "reference"].map((key) => html`<li><a href="${R.href(`${lang}/${SECTION_PATH[key]}`)}">${t(lang, `nav.${key}`)}</a></li>`);
  const issue = `${GITHUB_REPO}/issues/new?title=${encodeURIComponent(`Correction: ${route ? route.sitePath : ""}`)}&body=${encodeURIComponent(route ? route.abs : R.abs(""))}`;
  const more = [
    html`<li><a href="${R.href(`${lang}/about/`)}">${t(lang, "foot.about")}</a></li>`,
    html`<li><a href="${R.href(`${lang}/sources/`)}">${t(lang, "foot.sources")}</a></li>`,
    html`<li>${extLink(lang, issue, t(lang, "foot.corrections"))}</li>`,
    html`<li><a href="${R.href(`${lang}/privacy/`)}">${t(lang, "foot.privacy")}</a></li>`,
    html`<li>${extLink(lang, `${SHUBHVELA}${lang}/`, t(lang, "foot.shubhvela"))}</li>`,
  ];
  const note = lang === "hi" ? t(lang, "foot.note_hi") : t(lang, "foot.note_translation");
  return html`<footer class="site-foot">
<div class="container">
<div class="foot-grid">
<div><a class="brand" href="${home}"><span>${t(lang, "site.name")}</span></a><p class="meta mt0">${t(lang, "site.tagline")}</p></div>
<div><h2 class="label">${t(lang, "foot.sections")}</h2><ul>${sections}</ul></div>
<div><h2 class="label">${t(lang, "foot.more")}</h2><ul>${more}</ul></div>
<div><h2 class="label">${t(lang, "foot.licences_label")}</h2><p class="small m0">${t(lang, "foot.licences")}</p></div>
</div>
<div class="note-line small"><p>${note}</p><p>${t(lang, "foot.privacy_line")} <a href="${R.href(`${lang}/privacy/`)}">${t(lang, "foot.privacy")}</a></p><p class="print-only">${t(lang, "foot.print_courtesy")}</p></div>
</div>
</footer>`;
}

function modulesJson(ctx, pageType) {
  const list = ctx.modules?.[pageType] || [];
  return html`<script type="application/json" id="pb-modules">${raw(JSON.stringify(list))}</script>`;
}

/**
 * The full shell. page = {route, title, description, section, crumbs, body (Raw), bodyClass, ogType,
 * headExtra (Raw: extra <link>/<meta> tags, e.g. rel="prev"/"next" — FEAT-106), bodyEnd (Raw: inert markup before #pb-modules,
 * e.g. the #pb-offline-urls placeholder)}.
 */
export function layout(ctx, page) {
  const { route } = page;
  const lang = route.lang;
  return html`<!DOCTYPE html>
<html lang="${lang}" dir="ltr" data-base="${ctx.R.BASE_PATH}" data-lang="${lang}" data-page="${route.pageType}" data-theme="light" data-translit="iast">
<head>
${headTags(ctx, { lang, route, title: page.title, description: page.description, ogType: page.ogType })}
${page.headExtra || ""}
</head>
<body${page.bodyClass ? html` class="${page.bodyClass}"` : ""}>
<a class="skip" href="#main">${t(lang, "skip.label")}</a>
${uiSprite()}
${header(ctx, { lang, route, section: page.section })}
<main id="main" class="container page">
${breadcrumbs(lang, page.crumbs)}
${page.body}
</main>
${footer(ctx, { lang, route })}
${page.bodyEnd || ""}
${modulesJson(ctx, route.pageType)}
<script type="module" src="${ctx.R.href(ctx.assets.js)}"></script>
</body>
</html>
`;
}

/** Chrome-less document for 404 / offline / pothi (design §3.2, §15): head + body, no header/footer; sprite only when asked. */
export function plainDocument(ctx, { lang, route, title, description, body, pageType, noindex = false, bodyClass = "plain-page", sprite = false, headExtra = "", bodyEnd = "" }) {
  return html`<!DOCTYPE html>
<html lang="${lang}" dir="ltr" data-base="${ctx.R.BASE_PATH}" data-lang="${lang}" data-page="${pageType}" data-theme="light" data-translit="iast">
<head>
${headTags(ctx, { lang, route, title, description, noindex })}
${headExtra || ""}
</head>
<body class="${bodyClass}">
${sprite ? uiSprite() : ""}
${body}
${bodyEnd || ""}
${modulesJson(ctx, pageType)}
<script type="module" src="${ctx.R.href(ctx.assets.js)}"></script>
</body>
</html>
`;
}

export { esc };
