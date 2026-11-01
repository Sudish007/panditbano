// Named-source linking (brief §5.1 "every named book, text, course, institution and source in prose is a link"; design
// G16 / UI-19; FEAT-108). The gate forces content prose to link its citations; this helper does the same for the strings
// the templates own — UI prose (home, index ledes, honesty notes), attribution lines (W/S lines name the project), the
// sources-page group headings. The name list is data: sources.json#sources[].titles[] → entry.url and
// institutions.json#institutions[] name/names[] → url (the same list tools/audit.py checks). Longest names win at a
// position; text already inside <a>…</a> is left alone; tags are never touched.
import { esc, raw, t } from "../lib.mjs";

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** [{ name (HTML-escaped), url }] from the registry map (+ optional institutions registry), longest first. */
export function nameIndex(sources, institutions = null) {
  const out = [];
  const seen = new Set();
  const push = (name, url) => {
    if (typeof name !== "string" || name.trim().length < 4 || !url || seen.has(name)) return;
    seen.add(name);
    out.push({ name: esc(name), url: esc(url) });
  };
  for (const e of sources ? sources.values() : []) for (const title of e.titles || []) push(title, e.url);
  for (const i of (institutions && institutions.institutions) || []) { push(i.name, i.url); for (const n of i.names || []) push(n, i.url); }
  out.sort((a, b) => b.name.length - a.name.length);
  return out;
}

const anchor = (lang, url, label) => `<a href="${url}" rel="external noopener">${label}<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (${esc(t(lang, "ext.label"))})</span></a>`;

/** Wrap every bare occurrence of an indexed name in an HTML string (already escaped) with an external link. */
export function linkNames(htmlString, lang, index) {
  if (!index || !index.length) return String(htmlString ?? "");
  const byName = new Map(index.map((x) => [x.name, x.url]));
  const re = new RegExp(index.map((x) => reEsc(x.name)).join("|"), "g");
  // tokens: whole anchors (skipped), tags (skipped), text (searched)
  return String(htmlString ?? "").split(/(<a\b[\s\S]*?<\/a>|<[^>]+>)/).map((tok, i) => (i % 2 === 1 ? tok : tok.replace(re, (m) => anchor(lang, byName.get(m), m)))).join("");
}

/** A UI prose string with its named sources linked (Raw). ctx.names is the index built by the build; absent → plain escaped text. */
export function tp(ctx, lang, key, vars) {
  return raw(linkNames(esc(t(lang, key, vars)), lang, ctx && ctx.names));
}
