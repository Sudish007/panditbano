// Static pages about / sources / privacy (design.md §3.2 static, §4.8, §9.3, §10.10; R4 §6.3, §9; brief §14; FEAT-108).
// Every static page = page-head + the Markdown prose + a right rail linking the other site pages. Generated blocks:
// - sources: the one neutral §14 sentence (UI string), the source registry grouped by project — every entry with its
//   title linked, kind, retrieved date and a rel="license" link —, the fonts block (faces, authors, OFL link + the shipped
//   OFL.txt) and the build-tools line (minisearch MIT, @resvg/resvg-js MPL-2.0, sharp Apache-2.0, sanscript MIT);
// - privacy: the storage-keys table of design §9.3 and the R4 §6.3 GitHub sentences (IP logging, Issues).
import { html, raw, esc, t, extLink, num } from "../lib.mjs";
import { layout, GITHUB_REPO } from "../layout.mjs";
import { STATIC_SLUGS } from "../../lib/routes.mjs";
import { sourceTitle } from "../components/verse.mjs";
import { linkNames } from "../components/names.mjs";
import { lessonProse } from "./lesson.mjs";
import { refList, refHref, refMeta } from "./reference.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
export const staticHref = (ctx, lang, slug) => ctx.R.href(`${lang}/${slug}/`);
export const staticMeta = (page, lang) => (page.md && page.md[lang] && page.md[lang].meta) || {};

export const OFL_URL = "https://openfontlicense.org/";
export const FONTS = [
  { family: "Tiro Devanagari Sanskrit", authors: "Tiro Typeworks — The Indigo Project Authors (2020)", dir: "tiro-devanagari-sanskrit", role: { hi: "मंत्र", en: "mantras", bho: "मंत्र" } },
  { family: "Noto Sans Devanagari", authors: "The Noto Project Authors (2022)", dir: "noto-sans-devanagari", role: { hi: "हिंदी / भोजपुरी पाठ", en: "Hindi / Bhojpuri text", bho: "हिंदी / भोजपुरी पाठ" } },
  { family: "Noto Sans", authors: "The Noto Project Authors (2022)", dir: "noto-sans", role: { hi: "लैटिन", en: "Latin", bho: "लैटिन" } },
];
export const BUILD_TOOLS = [
  { name: "minisearch", licence: "MIT", url: "https://github.com/lucaong/minisearch" },
  { name: "@resvg/resvg-js", licence: "MPL-2.0", url: "https://github.com/thx/resvg-js" },
  { name: "sharp", licence: "Apache-2.0", url: "https://sharp.pixelplumbing.com/" },
  { name: "@indic-transliteration/sanscript", licence: "MIT", url: "https://github.com/indic-transliteration/sanscript.js" },
];
const CC_BY_SA = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC_BY_NC_SA = "https://creativecommons.org/licenses/by-nc-sa/4.0/";
const PD_MARK = "https://creativecommons.org/publicdomain/mark/1.0/";
export const GITHUB_PRIVACY = "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement";
/** The storage keys of design §9.3 (the Privacy page lists exactly these). */
export const STORAGE_KEYS = [["pb-theme", "theme"], ["pb-lang", "lang"], ["pb-translit", "translit"], ["pb-rate · pb-repeat", "rate"], ["pb-check:<occasion>", "check"], ["pb-quiz:<lesson>", "quiz"], ["pb-sankalpa", "sankalpa"], ["pb-saved", "saved"], ["pb-font-pct", "font"]];

/** Licence link target for a registry entry: CC BY-SA / CC BY-NC-SA / Public Domain Mark by the licence text, else the source's own page (its terms). */
export function licenceUrl(entry) {
  const l = String(entry.licence || "");
  if (/CC BY-NC-SA/i.test(l)) return CC_BY_NC_SA;
  if (/CC BY-SA/i.test(l)) return CC_BY_SA;
  if (/public[- ]domain/i.test(l)) return PD_MARK;
  return entry.url || "#";
}
const PROJECT_ORDER = ["wikisource", "sanskritdocuments", "gretil", "vhp", "archive", "stotranidhi", "kavitakosh", "titus", "iitk", "shubhvela", "publisher", "research", "government", "other"];
const projectLabel = (ctx, lang, p) => { let label; try { label = t(lang, `sources.project.${p}`); } catch (e) { label = p; } return raw(linkNames(esc(label), lang, ctx.names)); };

export function registrySection(ctx, lang, sources) {
  const entries = [...(sources ? sources.values() : [])].filter((e) => e && e.id);
  if (!entries.length) return "";
  const groups = new Map();
  for (const e of entries) { const p = PROJECT_ORDER.includes(e.project) ? e.project : "other"; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(e); }
  const ordered = PROJECT_ORDER.filter((p) => groups.has(p));
  return html`<section id="registry" aria-labelledby="h-registry">
<div class="section-head"><h2 id="h-registry">${t(lang, "sources.registry")}</h2><span class="meta">${t(lang, "counts.sources", { n: num(entries.length) })}</span></div>
<p class="lede m0">${t(lang, "sources.registry_lede")}</p>
<div class="src-groups">${ordered.map((p) => html`<section class="card src-group" aria-labelledby="h-src-${p}">
<h3 id="h-src-${p}">${projectLabel(ctx, lang, p)} <span class="meta">· ${num(groups.get(p).length)}</span></h3>
<ul class="src-list">${groups.get(p).map((e) => html`<li data-source="${e.id}"><span class="t">${extLink(lang, e.url || "#", sourceTitle(e, lang))}</span><span class="meta">${e.kind ? html`${e.kind}` : ""}${e.retrieved ? html` · ${t(lang, "sources.retrieved")} ${e.retrieved}` : ""}${e.locator ? html` · ${e.locator}` : ""}</span><span class="small lic">${t(lang, "sources.licence")}: ${extLink(lang, licenceUrl(e), e.licence || "—", { rel: "license external noopener" })}</span></li>`)}</ul>
</section>`)}</div>
</section>`;
}

export function fontsSection(ctx, lang) {
  return html`<section class="card" id="fonts" aria-labelledby="h-fonts">
<h2 id="h-fonts">${t(lang, "sources.fonts")}</h2>
<p>${t(lang, "sources.fonts_body")}</p>
<ul class="m0">${FONTS.map((f) => html`<li><strong lang="en">${f.family}</strong> — ${f.role[lang]} — <span lang="en">${f.authors}</span> — ${extLink(lang, OFL_URL, "SIL Open Font License 1.1", { rel: "license external noopener" })} (<a href="${ctx.R.href(`fonts/${f.dir}/OFL.txt`)}">OFL.txt</a>)</li>`)}</ul>
</section>`;
}

export function toolsSection(lang) {
  return html`<section class="card" id="tools" aria-labelledby="h-tools">
<h2 id="h-tools">${t(lang, "sources.tools")}</h2>
<p>${t(lang, "sources.tools_body")}</p>
<ul class="m0">${BUILD_TOOLS.map((x) => html`<li>${extLink(lang, x.url, x.name)} — <span lang="en">${x.licence}</span></li>`)}</ul>
</section>`;
}

export function privacyExtras(lang) {
  const issues = `${GITHUB_REPO}/issues`;
  return html`<section id="stored" aria-labelledby="h-stored">
<h2 id="h-stored">${t(lang, "privacy.stored_title")}</h2>
<p class="lede m0">${t(lang, "privacy.stored_lede")}</p>
<div class="table-wrap"><table class="keys"><thead><tr><th scope="col">${t(lang, "privacy.key")}</th><th scope="col">${t(lang, "privacy.what")}</th></tr></thead>
<tbody>${STORAGE_KEYS.map(([k, key]) => html`<tr><td><code>${k}</code></td><td>${t(lang, `privacy.keys.${key}`)}</td></tr>`)}</tbody></table></div>
<p class="github-line" id="github">${t(lang, "privacy.github")} ${extLink(lang, GITHUB_PRIVACY, t(lang, "privacy.github_link"))} · ${t(lang, "privacy.issues")} ${extLink(lang, issues, "GitHub Issues")}</p>
</section>`;
}

/** Right rail: the other static pages and the reference pages (WCAG 3.2.6 — the same relative order everywhere). */
export function siteLinksCard(ctx, lang, data, current) {
  const R = ctx.R;
  const statics = STATIC_SLUGS.filter((s) => s !== current).map((s) => html`<li><a href="${staticHref(ctx, lang, s)}"><span class="t">${t(lang, `foot.${s}`)}</span></a></li>`);
  const refs = refList(data).map((r) => html`<li><a href="${refHref(ctx, lang, r)}"><span class="t">${refMeta(r, lang).title || r.slug}</span></a></li>`);
  return html`<div class="card"><h2 class="rail-h">${t(lang, "foot.more")}</h2><nav aria-label="${t(lang, "foot.more")}"><ul>${statics}<li>${extLink(lang, `${GITHUB_REPO}/issues`, t(lang, "foot.corrections"))}</li></ul></nav>${refs.length ? html`<h2 class="rail-h mt">${t(lang, "nav.reference")}</h2><nav aria-label="${t(lang, "nav.reference")}"><ul>${refs}<li><a href="${R.href(`${lang}/reference/`)}"><span class="t">${t(lang, "reference.pages")} →</span></a></li></ul></nav>` : ""}</div>`;
}

export function staticBody(ctx, { lang, page, data, derived }) {
  const md = page.md && page.md[lang];
  if (!md) throw new Error(`static ${page.slug}: no ${lang} Markdown`);
  const meta = md.meta || {};
  const prose = lessonProse(md, { ctx, lang, derived, sources: data.sources });
  return html`<div class="page-head">
<div><h1>${meta.title || page.slug}</h1>${meta.summary ? html`<p class="lede m0">${meta.summary}</p>` : ""}</div>
</div>
<div class="layout has-right">
<div class="stack">
<article class="prose" id="content">
${raw(prose.html)}
</article>
${page.slug === "sources" ? html`<p class="caveat" id="owner-decision">${t(lang, "sources.owner_decision")}</p>${registrySection(ctx, lang, data.sources)}<div class="pair">${fontsSection(ctx, lang)}${toolsSection(lang)}</div>` : ""}
${page.slug === "privacy" ? privacyExtras(lang) : ""}
</div>
<aside class="rail rail-right">
${siteLinksCard(ctx, lang, data, page.slug)}
</aside>
</div>`;
}

export function staticPage(ctx, { route, page, data, derived }) {
  const lang = route.lang;
  const meta = staticMeta(page, lang);
  return layout(ctx, {
    route,
    title: meta.title || page.slug,
    description: clip(meta.summary || meta.title || page.slug),
    section: null,
    crumbs: [{ href: ctx.R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: staticBody(ctx, { lang, page, data, derived }),
  });
}
