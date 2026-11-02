// Markdown subset (design.md §11.3; plan.md §2.5 adds {{verse:}}). Supported: paragraphs, #–#### headings (shifted
// one level so the page <h1> stays unique), **bold**, *em*, [text](url) (external URLs get rel="external noopener"
// + the marker), lists - / 1., > blockquote, --- rule, GFM pipe tables inside <div class="table-wrap">, [[term-id]]
// glossary links (first use on a page carries the bracketed alternate — R5 B7), {{count:key}}, {{mantra:id}},
// {{verse:<textSlug>-<n>-<v>}}, {{note:health|grief|astrology}}, {{sutra:id}}. Unsupported syntax stays text; every
// `<` from the source is escaped. The first line of a file is JSON front matter {"title", "summary"}.
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

export const PLACEHOLDER_RE = /\{\{(count|mantra|verse|note|sutra):([a-z0-9][a-z0-9-]*)\}\}/g;
export const TERM_RE = /\[\[([a-z0-9][a-z0-9-]*)\]\]/g;
export const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
export const NOTE_KINDS = ["health", "grief", "astrology"];

/** Split the JSON front-matter line from the body. Throws with the file name when the first line is not JSON. */
export function parseFrontMatter(src, file = "<md>") {
  const text = String(src ?? "").replace(/^\uFEFF/, "");
  const nl = text.indexOf("\n");
  const first = (nl === -1 ? text : text.slice(0, nl)).trim();
  if (!first.startsWith("{")) throw new Error(`${file}:1:1: first line must be JSON front matter {"title": …, "summary": …}`);
  let meta;
  try { meta = JSON.parse(first); } catch (err) { throw new Error(`${file}:1:1: front matter is not valid JSON: ${err.message}`); }
  return { meta, body: nl === -1 ? "" : text.slice(nl + 1) };
}

const isExternal = (u) => /^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith("#");

function defaultCtx(ctx) {
  return {
    lang: "hi",
    extLabel: "external link",
    href: (p) => p,
    term: () => null,
    mantra: () => null,
    verse: () => null,
    sutra: () => null,
    note: () => null,
    count: () => null,
    ...ctx,
  };
}

/** Render Markdown; returns { html, links, terms, placeholders, unresolved }. */
export function renderMarkdown(body, ctx = {}) {
  const C = defaultCtx(ctx);
  const state = { links: [], terms: [], placeholders: [], unresolved: [], seenTerms: new Set(), headings: [] };
  const lines = String(body ?? "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const inline = (s) => renderInline(s, C, state);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    // block placeholder alone on a line
    if ((m = /^\s*\{\{(mantra|verse|sutra|note):([a-z0-9][a-z0-9-]*)\}\}\s*$/.exec(line))) {
      out.push(blockPlaceholder(m[1], m[2], C, state));
      i++; continue;
    }
    if (/^\s*---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    if ((m = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line))) {
      const level = m[1].length + 1;
      const n = state.headings.length + 1;
      const id = `s-${n}`;
      state.headings.push({ level, text: m[2], id });
      out.push(`<h${level} id="${id}">${inline(m[2])}</h${level}>`);
      i++; continue;
    }
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i].replace(/^\s*>\s?/, "")), i++;
      const innerHtml = renderMarkdown(buf.join("\n"), C);
      mergeState(state, innerHtml);
      out.push(`<blockquote>${innerHtml.html}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].replace(re, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += " " + lines[i].trim(), i++;
        items.push(item);
      }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i])), i++;
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    // paragraph: consecutive non-empty lines that are not another block start
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(\s*(#{1,4}\s|>|[-*]\s|\d+[.)]\s|---+\s*$|\|.*\|\s*$|\{\{(mantra|verse|sutra|note):))/.test(lines[i])) buf.push(lines[i]), i++;
    out.push(`<p>${inline(buf.join("\n").trim())}</p>`);
  }
  return { html: out.join("\n"), links: state.links, terms: state.terms, placeholders: state.placeholders, unresolved: state.unresolved, headings: state.headings };
}

/** A note handler returns a string (escaped here) or { html } (already-safe markup, e.g. with linked source names). */
const noteHtml = (n) => (n && typeof n === "object" && typeof n.html === "string" ? n.html : esc(n));

function mergeState(state, r) {
  state.links.push(...r.links);
  state.terms.push(...r.terms);
  state.placeholders.push(...r.placeholders);
  state.unresolved.push(...r.unresolved);
}

function blockPlaceholder(type, arg, C, state) {
  state.placeholders.push({ type, arg });
  let html = null;
  if (type === "mantra") html = C.mantra(arg);
  else if (type === "verse") html = C.verse(arg);
  else if (type === "sutra") html = C.sutra(arg);
  else if (type === "note") {
    const text = NOTE_KINDS.includes(arg) ? C.note(arg) : null;
    html = text ? `<p class="note note-${esc(arg)}" role="note">${noteHtml(text)}</p>` : null;
  }
  if (html === null) {
    state.unresolved.push({ type, arg });
    return `<p class="unresolved" data-ref="${esc(type)}:${esc(arg)}">{{${esc(type)}:${esc(arg)}}}</p>`;
  }
  return html;
}

export function renderInline(src, ctx = {}, state = { links: [], terms: [], placeholders: [], unresolved: [], seenTerms: new Set() }) {
  const C = defaultCtx(ctx);
  const tokens = [];
  const hold = (html) => { tokens.push(html); return `\uE100${tokens.length - 1}\uE101`; };
  let s = String(src ?? "");
  // 1. protect links, terms and placeholders before escaping
  s = s.replace(LINK_RE, (_, text, url) => {
    const u = url.trim();
    state.links.push({ url: u, text });
    const inner = renderInline(text, C, state);
    if (isExternal(u)) return hold(`<a href="${esc(u)}" rel="external noopener">${inner}<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (${esc(C.extLabel)})</span></a>`);
    return hold(`<a href="${esc(u.startsWith("#") ? u : C.href(u))}">${inner}</a>`);
  });
  s = s.replace(TERM_RE, (_, id) => {
    state.terms.push(id);
    const term = C.term(id);
    if (!term) { state.unresolved.push({ type: "term", arg: id }); return hold(`<span class="unresolved" data-ref="term:${esc(id)}">[[${esc(id)}]]</span>`); }
    const first = !state.seenTerms.has(id);
    state.seenTerms.add(id);
    const alt = first && term.alt && term.alt !== term.display ? ` <span class="term-alt">(${esc(term.alt)})</span>` : "";
    // a term the bank knows but no glossary page defines yet (href null) stays plain text with its first-use bracket (FIX-1a)
    if (!term.href) return hold(`<span class="term" data-term="${esc(id)}"${first ? ' data-first="1"' : ""}>${esc(term.display)}</span>${alt}`);
    return hold(`<a class="term" href="${esc(term.href)}"${first ? ' data-first="1"' : ""}>${esc(term.display)}</a>${alt}`);
  });
  s = s.replace(PLACEHOLDER_RE, (_, type, arg) => {
    state.placeholders.push({ type, arg });
    if (type === "count") {
      const n = C.count(arg);
      if (n === null || n === undefined) { state.unresolved.push({ type, arg }); return hold(`<span class="unresolved" data-ref="count:${esc(arg)}">{{count:${esc(arg)}}}</span>`); }
      return hold(`<span class="count" data-count="${esc(arg)}">${esc(Number(n).toLocaleString("en-IN"))}</span>`);
    }
    // block placeholders used inline: render inline fallback
    const html = type === "note" ? (NOTE_KINDS.includes(arg) && C.note(arg) ? `<span class="note note-${esc(arg)}">${noteHtml(C.note(arg))}</span>` : null) : C[type](arg);
    if (html === null || html === undefined) { state.unresolved.push({ type, arg }); return hold(`<span class="unresolved" data-ref="${esc(type)}:${esc(arg)}">{{${esc(type)}:${esc(arg)}}}</span>`); }
    return hold(html);
  });
  // 2. escape the rest
  s = esc(s);
  // 3. emphasis
  s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?![*\w])/g, "$1<em>$2</em>");
  s = s.replace(/\n/g, "<br>\n");
  // 4. restore held HTML
  s = s.replace(/\uE100(\d+)\uE101/g, (_, n) => tokens[Number(n)]);
  return s;
}

/** All internal (non-external, non-anchor) link targets of a Markdown body — for gate rule G12. */
export function internalLinks(body) {
  const out = [];
  for (const m of String(body ?? "").matchAll(LINK_RE)) if (!isExternal(m[2]) && !m[2].startsWith("#")) out.push(m[2]);
  return out;
}

/** Prose with links, terms and placeholders removed (for lints that must not see URLs or ids). */
export function proseOnly(body) {
  return String(body ?? "")
    .replace(LINK_RE, (_, text) => text)
    .replace(TERM_RE, " ")
    .replace(PLACEHOLDER_RE, " ")
    .replace(/^\s*\|.*\|\s*$/gm, (l) => l.replace(/\|/g, " "))
    .replace(/[#>*_`]+/g, " ");
}
