// Template helpers (design.md §11.2): every interpolated string is HTML-escaped by `html`; raw HTML enters only
// through raw(). t(lang, key, vars) reads the UI strings loaded from content/ui/<lang>.json.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Marks a string as already-safe HTML (output of a template or renderer). */
export class Raw {
  constructor(s) { this.s = String(s ?? ""); }
  toString() { return this.s; }
}
export const raw = (s) => (s instanceof Raw ? s : new Raw(s));

/** Tagged template: escapes interpolations unless they are Raw (or arrays of Raw/strings, joined). */
export function html(strings, ...values) {
  let out = "";
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += part(values[i]);
  }
  return new Raw(out);
}
function part(v) {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join("");
  return esc(v);
}
/** Trim indentation-only whitespace between tags (design §11.1 stage 4: "minified only by trimming indentation"). */
export function tidy(s) {
  return String(s).replace(/\n[ \t]+/g, "\n").replace(/\n{2,}/g, "\n").trim() + "\n";
}

// ---------------------------------------------------------------- UI strings
const UI = new Map();
/** Register the UI string table of a language (called by the build after loading content/ui/*.json). */
export function setUI(lang, table) { UI.set(lang, table); }
export function getUI(lang) {
  const u = UI.get(lang);
  if (!u) throw new Error(`UI strings for "${lang}" are not loaded`);
  return u;
}
/** Load content/ui/<lang>.json for every language from a content dir (used by the build and by tests). */
export function loadUI(contentDir, langs = ["hi", "en", "bho"]) {
  for (const l of langs) setUI(l, JSON.parse(readFileSync(join(contentDir, "ui", `${l}.json`), "utf8")));
}
/** t("hi", "theme.light") → "हल्की"; vars replace {name} placeholders. Missing keys throw (a build must not ship a hole). */
export function t(lang, key, vars) {
  let cur = getUI(lang);
  for (const k of key.split(".")) {
    cur = cur?.[k];
    if (cur === undefined) throw new Error(`UI string ${lang}:${key} missing`);
  }
  if (typeof cur !== "string") throw new Error(`UI string ${lang}:${key} is not a string`);
  // singular form: when {n} is 1 (any script) and a sibling key "<key>_one" exists, it wins ("1 term", not "1 terms" — FIX-1a)
  if (vars && vars.n !== undefined && /^[1१]$/.test(String(vars.n))) {
    const parts = key.split("."), last = parts.pop();
    let parent = getUI(lang);
    for (const k of parts) parent = parent?.[k];
    const one = parent?.[`${last}_one`];
    if (typeof one === "string") cur = one;
  }
  return vars ? cur.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k]))) : cur;
}

// ---------------------------------------------------------------- sprite and icons
let spriteCache;
/** The inline SVG sprite (assets/sprite.svg) as Raw. */
export function uiSprite() {
  if (!spriteCache) spriteCache = new Raw(readFileSync(join(ROOT, "assets", "sprite.svg"), "utf8").trim());
  return spriteCache;
}
export const spriteIds = () => [...uiSprite().s.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);
/** Decorative icon referencing a sprite symbol. */
export function icon(id, { cls = "", size = 20, hidden = false } = {}) {
  return html`<svg class="${cls}" width="${size}" height="${size}" aria-hidden="true" focusable="false"${hidden ? raw(" hidden") : ""}><use href="#${id}"/></svg>`;
}
/** External link: rel="external noopener", the #i-ext marker and an sr-only label (design §5.2, UI-20). */
export function extLink(lang, hrefUrl, label, { cls = "", sv = null, svId = null, rel = "external noopener" } = {}) {
  const attrs = [];
  if (cls) attrs.push(html` class="${cls}"`);
  if (sv) attrs.push(html` data-sv="${sv}"`);
  if (svId) attrs.push(html` data-sv-id="${svId}"`);
  return html`<a href="${hrefUrl}" rel="${rel}"${attrs}>${label}<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (${t(lang, "ext.label")})</span></a>`;
}
/** Latin-digit number formatting for UI text (decisions.md §9 rule 5; design-review NIT 13). */
export const num = (n) => Number(n).toLocaleString("en-IN");
