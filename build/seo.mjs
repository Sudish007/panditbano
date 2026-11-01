// Stage 8 — SEO files and per-page structured data (design.md §17; FEAT-109). sitemap.xml (or a sitemap index +
// sitemap-<lang>.xml when a language exceeds 45,000 URLs) with xhtml:link hi/en/x-default alternates (bho URLs are ordinary
// <url> entries — Google has no hreflang code for Bhojpuri), robots.txt, and a <head> injection per page: og:image metas,
// twitter:card and one JSON-LD block (WebSite on home — SearchAction only when features.search; BreadcrumbList on inner
// pages; Article for lessons/kathas/reference/static; HowTo with HowToStep for occasions; DefinedTerm for glossary terms).
// The page title/description/crumbs are read back from the rendered HTML, so every template stays the single source.
import { LANGS } from "./config.mjs";
import { renderInline } from "./lib/md.mjs";
import { mdContext } from "./templates/components/verse.mjs";

export const SITEMAP_SPLIT_AT = 45000;
const OG_W = 1200, OG_H = 630;

// ---------------------------------------------------------------- HTML read-back
const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
export const unesc = (s) => String(s ?? "").replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENT[m]);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** {title, description, crumbs:[{href,label}]} of a rendered page; title without the " — <site>" suffix. */
export function pageMeta(html, siteName) {
  const t = /<title>([^<]*)<\/title>/.exec(html);
  let title = t ? unesc(t[1]) : "";
  const suffix = ` — ${siteName}`;
  if (siteName && title.endsWith(suffix)) title = title.slice(0, -suffix.length);
  const d = /<meta name="description" content="([^"]*)">/.exec(html);
  const crumbs = [];
  const ol = /<ol class="crumbs">([\s\S]*?)<\/ol>/.exec(html);
  if (ol) for (const m of ol[1].matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/g)) crumbs.push({ href: unesc(m[1]), label: unesc(m[2].replace(/<[^>]+>/g, "")) });
  return { title, description: d ? unesc(d[1]) : "", crumbs };
}

// ---------------------------------------------------------------- JSON-LD
const ARTICLE_TYPES = new Set(["lesson", "katha", "katha-adhyaya", "reference-page", "static"]);

function howTo(page, { occasions, R, ctx, derived }, meta, lang) {
  const occ = occasions.find((o) => o.slug === page.route.params.slug);
  if (!occ) return null;
  const part = page.pageType === "occasion-part" ? page.route.params.part : null;
  const steps = (occ.steps || []).filter((s) => !part || s.part === part);
  // the action is a prose field ([[term]], [text](url), **bold**): render it like the page does, then drop the tags
  const mdCtx = mdContext(ctx, lang, derived);
  const plain = (s) => unesc(renderInline(String(s ?? ""), mdCtx).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  return {
    "@type": "HowTo",
    name: meta.title,
    description: meta.description,
    inLanguage: lang,
    url: page.route.abs,
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: plain(s.action?.[lang]) })),
  };
}

/** The JSON-LD graph of one page (array of nodes; empty for pages that carry none). */
export function jsonLd(page, meta, { R, ctx, data, derived }) {
  const lang = page.lang;
  const nodes = [];
  const site = ctx.ui[lang].site.name;
  if (page.pageType === "home") {
    const ws = { "@type": "WebSite", name: site, url: page.route.abs, inLanguage: lang, description: meta.description };
    if (ctx.features.search) ws.potentialAction = { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${R.abs(`${lang}/search/`)}?q={search_term_string}` }, "query-input": "required name=search_term_string" };
    nodes.push(ws);
    return nodes;
  }
  if (meta.crumbs.length) {
    const items = meta.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${R.SITE_ORIGIN}${c.href}` }));
    items.push({ "@type": "ListItem", position: items.length + 1, name: meta.title, item: page.route.abs });
    nodes.push({ "@type": "BreadcrumbList", itemListElement: items });
  }
  if (ARTICLE_TYPES.has(page.pageType)) nodes.push({ "@type": "Article", headline: meta.title, description: meta.description, inLanguage: lang, url: page.route.abs, publisher: { "@type": "Organization", name: site } });
  else if (page.pageType === "occasion" || page.pageType === "occasion-part") { const h = howTo(page, { occasions: data.occasions, R, ctx, derived }, meta, lang); if (h) nodes.push(h); }
  else if (page.pageType === "term") {
    const term = (derived.glossaryPages || []).find((g) => g.id === page.route.params.termId);
    nodes.push({ "@type": "DefinedTerm", name: meta.title, description: meta.description, inLanguage: lang, url: page.route.abs, termCode: term ? term.id : page.route.params.termId, inDefinedTermSet: { "@type": "DefinedTermSet", name: ctx.ui[lang].nav.glossary, url: R.abs(`${lang}/glossary/`) } });
  }
  return nodes;
}

const ldScript = (nodes) => {
  const doc = nodes.length === 1 ? { "@context": "https://schema.org", ...nodes[0] } : { "@context": "https://schema.org", "@graph": nodes };
  return `<script type="application/ld+json">${JSON.stringify(doc).replace(/</g, "\\u003c")}</script>`;
};

/**
 * Inject og:image metas, twitter:card and JSON-LD into every rendered language page. `ogFor(page)` returns the site-relative
 * og image href of the page (own or type default) or null. Returns the number of pages touched.
 */
export function injectHeadMeta(out, { pages, R, ctx, data, derived, ogFor }) {
  let n = 0;
  for (const p of pages) {
    if (!p.lang || !p.route) continue;
    const html = out.get(p.file);
    if (typeof html !== "string") continue;
    const meta = pageMeta(html, ctx.ui[p.lang].site.name);
    const extra = [];
    const og = ogFor ? ogFor(p) : null;
    if (og && p.route.sitemap) {
      extra.push(`<meta property="og:image" content="${esc(R.abs(og))}">`, `<meta property="og:image:width" content="${OG_W}">`, `<meta property="og:image:height" content="${OG_H}">`, `<meta property="og:image:alt" content="${esc(meta.title)}">`, `<meta name="twitter:card" content="summary_large_image">`);
    }
    const nodes = jsonLd(p, meta, { R, ctx, data, derived });
    if (nodes.length) extra.push(ldScript(nodes));
    if (!extra.length) continue;
    out.set(p.file, html.replace("</head>", `${extra.join("\n")}\n</head>`));
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- sitemap + robots
const urlEntry = (R, p) => {
  const lines = [`<url><loc>${esc(p.route.abs)}</loc>`];
  if (p.lang !== "bho") for (const a of R.hreflangs(p.route)) lines.push(`<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`);
  lines.push("</url>");
  return lines.join("");
};
const urlset = (entries) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;

/** sitemap.xml (+ per-language files when any language exceeds SITEMAP_SPLIT_AT URLs). Returns { files: [names], urls }. */
export function writeSitemaps(out, { pages, R }) {
  const listed = pages.filter((p) => p.route && p.route.sitemap && p.lang);
  const byLang = Object.fromEntries(LANGS.map((l) => [l, listed.filter((p) => p.lang === l)]));
  const files = [];
  if (LANGS.some((l) => byLang[l].length > SITEMAP_SPLIT_AT)) {
    for (const l of LANGS) { out.set(`sitemap-${l}.xml`, urlset(byLang[l].map((p) => urlEntry(R, p)))); files.push(`sitemap-${l}.xml`); }
    out.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LANGS.map((l) => `<sitemap><loc>${esc(R.abs(`sitemap-${l}.xml`))}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`);
  } else {
    out.set("sitemap.xml", urlset(listed.map((p) => urlEntry(R, p))));
  }
  files.unshift("sitemap.xml");
  return { files, urls: listed.length };
}

export function robotsTxt(R) {
  return `User-agent: *\nAllow: /\nDisallow: ${R.href("_dev/")}\nDisallow: ${R.href("_reports/")}\n\nSitemap: ${R.abs("sitemap.xml")}\n`;
}

/** Stage 8 entry (files only; the head injection runs earlier so the offline byte counts stay exact). */
export function stageSeoFiles(out, { pages, R }) {
  const sm = writeSitemaps(out, { pages, R });
  out.set("robots.txt", robotsTxt(R));
  return { sitemaps: sm.files, urls: sm.urls };
}
