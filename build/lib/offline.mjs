// Per-occasion offline manifest (design.md §13.2; design-review MEDIUM 5; FEAT-106). The occasion, part and pothi pages
// carry <script type="application/json" id="pb-offline-urls">{"id","hash","bytes","urls":[…]}</script>: the overview, the
// part routes, the pothi, every mantra page the steps reference, the hashed site.css / app.mjs / page modules of those page
// types and the five woff2 faces. `bytes` is the sum of the dist file sizes of those URLs, computed at build from the
// rendered output — the manifest sits inside the HTML it measures, so the embed iterates to a fixed point (the digit count
// of `bytes` can change the size once). FEAT-109's offline.mjs posts the manifest to the service worker.
import { LANGS } from "../config.mjs";

export const OFFLINE_PAGE_TYPES = ["occasion", "occasion-part", "pothi", "mantra"];
const PLACEHOLDER = /<!--pb-offline-urls:([a-z0-9][a-z0-9-]*)-->/g;

/** dist file key of a site href ("/panditbano/hi/occasions/vivah/" → "hi/occasions/vivah/index.html"). */
export function fileOf(href, basePath) {
  const rel = href.startsWith(basePath) ? href.slice(basePath.length) : href.replace(/^\/+/, "");
  return rel.endsWith("/") || rel === "" ? `${rel}index.html` : rel;
}

/** The URL list of one occasion in one language (order: overview, parts, pothi, mantra pages, css, js, modules, fonts). */
export function offlineUrls(occ, lang, { R, ctx, out }) {
  const urls = [];
  const base = `${lang}/occasions/${occ.slug}/`;
  urls.push(R.href(base));
  for (const p of occ.parts || []) urls.push(R.href(`${base}${p.slug}/`));
  urls.push(R.href(`${base}pothi/`));
  const seen = new Set();
  for (const s of occ.steps || []) for (const id of s.mantraIds || []) if (!seen.has(id)) { seen.add(id); urls.push(R.href(`${lang}/mantras/${id}/`)); }
  urls.push(R.href(ctx.assets.css), R.href(ctx.assets.js));
  const mods = new Set();
  for (const type of OFFLINE_PAGE_TYPES) for (const m of (ctx.modules && ctx.modules[type]) || []) mods.add(R.href(`assets/js/${m.replace(/^\.\//, "")}`));
  urls.push(...mods);
  for (const key of out.keys()) if (key.startsWith("fonts/") && key.endsWith(".woff2")) urls.push(R.href(key));
  return urls;
}

const sizeOf = (body) => (Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body), "utf8"));

/** {id, hash, bytes, urls} for one occasion/language against the current output map (missing files count 0 and are reported). */
export function offlineManifest(occ, lang, { R, ctx, out }) {
  const urls = offlineUrls(occ, lang, { R, ctx, out });
  let bytes = 0;
  const missing = [];
  for (const u of urls) {
    const f = fileOf(u, R.BASE_PATH);
    const body = out.get(f);
    if (body === undefined) missing.push(f);
    else bytes += sizeOf(body);
  }
  return { manifest: { id: occ.id, hash: ctx.hash, bytes, urls }, missing };
}

export const manifestScript = (m) => `<script type="application/json" id="pb-offline-urls">${JSON.stringify(m)}</script>`;

/**
 * Replace every <!--pb-offline-urls:<id>--> placeholder in the rendered pages with the manifest script. Runs after all pages
 * are in `out`; iterates until the byte totals are stable (≤ 4 rounds). Returns { embedded, missing } for the build report.
 */
export function embedOfflineManifests(out, { R, ctx, occasions }) {
  const byId = new Map(occasions.map((o) => [o.id, o]));
  const targets = [];
  for (const [file, body] of out) {
    if (Buffer.isBuffer(body) || !file.endsWith(".html")) continue;
    const s = String(body);
    const m = PLACEHOLDER.exec(s);
    PLACEHOLDER.lastIndex = 0;
    if (!m) continue;
    const lang = LANGS.find((l) => file.startsWith(`${l}/`));
    const occ = byId.get(m[1]);
    if (!occ || !lang) throw new Error(`offline placeholder ${m[1]} in ${file} has no occasion/language`);
    targets.push({ file, template: s, occ, lang });
  }
  let missing = [];
  let last = new Map();
  for (let round = 0; round < 4; round++) {
    missing = [];
    const next = new Map();
    for (const tg of targets) {
      const { manifest, missing: miss } = offlineManifest(tg.occ, tg.lang, { R, ctx, out });
      missing.push(...miss.map((f) => `${tg.file}: ${f}`));
      next.set(tg.file, manifest.bytes);
      out.set(tg.file, tg.template.replace(PLACEHOLDER, () => manifestScript(manifest)));
    }
    let stable = true;
    for (const [f, b] of next) if (last.get(f) !== b) stable = false;
    last = next;
    if (stable) break;
  }
  return { embedded: targets.length, missing: [...new Set(missing)] };
}
