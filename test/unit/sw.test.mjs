// FEAT-109: service worker (design §13.2, §21, §22; design-review MEDIUM 5) — the template carries the placeholders, the
// rendered sw.js has none left and parses, the precache list ⊆ dist files after a fixture build and stays under 2 MB, every
// route type carries a precache class, and the worker's behaviour rules are present as code (no automatic skipWaiting,
// pb-saved survives activation, same-origin GET only).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTES } from "../../build/lib/routes.mjs";
import { SW_TEMPLATE, renderServiceWorker, PRECACHE_BUDGET } from "../../build/pwa.mjs";
import { fixtureBuild } from "./_fixture-build.mjs";

const template = readFileSync(SW_TEMPLATE, "utf8");

test("template has the four placeholders; rendering replaces them all and the result parses", () => {
  for (const p of ["__PB_HASH__", "__PB_BASE__", "__PB_LANGS__", "__PB_PRECACHE__"]) assert.ok(template.includes(p), p);
  const sw = renderServiceWorker(template, { hash: "abcdef123456", basePath: "/panditbano/", precache: ["/panditbano/", "/panditbano/404.html"] });
  assert.ok(!/__PB_[A-Z]+__/.test(sw), "no placeholder left");
  assert.ok(sw.includes('var HASH = "abcdef123456";') && sw.includes('var BASE = "/panditbano/";') && sw.includes('var LANGS = ["hi","en","bho"];'));
  assert.ok(sw.includes('"/panditbano/404.html"'));
  assert.doesNotThrow(() => new Function(sw), "sw.js is syntactically valid");
  assert.throws(() => renderServiceWorker("no placeholders", { hash: "x", basePath: "/", precache: [] }), /placeholders/);
});

test("behaviour rules are in the worker: no skipWaiting on install, pb-saved kept on activate, same-origin GET only, 3-s navigation timeout, 60-set cap, 400/300 limits", () => {
  const install = template.slice(template.indexOf('addEventListener("install"'), template.indexOf('addEventListener("activate"'));
  assert.ok(!/skipWaiting\(\)/.test(install), "install never calls skipWaiting");
  assert.ok(/d\.type === "SKIP_WAITING"[^\n]*skipWaiting\(\)/.test(template), "SKIP_WAITING message → skipWaiting");
  assert.ok(template.includes('n !== SAVED') && template.includes('var SAVED = "pb-saved"'), "activation spares pb-saved");
  assert.ok(template.includes('if (req.method !== "GET") return;') && template.includes("url.origin !== ORIGIN"), "same-origin GET only");
  assert.ok(template.includes("var NAV_TIMEOUT_MS = 3000;") && template.includes("var MAX_SETS = 60;") && template.includes("var MAX_URLS = 400;") && template.includes("var MAX_URL_LEN = 300;"));
  assert.ok(template.includes('res.type === "basic"'), "opaque responses are never cached");
  assert.ok(template.includes("navigator.storage.estimate") && template.includes("bytes * 1.5"), "quota check against bytes × 1.5");
  assert.ok(template.includes("refreshStaleSets") && template.includes("s.hash !== HASH"), "stale saved sets are re-fetched on activate (MEDIUM 5)");
  assert.ok(template.includes('"EVICTED"') && template.includes('"PROGRESS"') && template.includes('"SAVED"') && template.includes('"UNSAVED"') && template.includes('reason: "bad-request"'));
});

test("every route type is classified static | runtime | none; the FEAT-109 static set is the shell", () => {
  const classes = new Map(ROUTES.map((r) => [r.pageType, r.precache]));
  for (const [t, c] of classes) assert.ok(["static", "runtime", "none"].includes(c), `${t}: ${c}`);
  for (const t of ["root-redirect", "not-found", "home", "offline", "learn-index", "occasions-index", "mantras-index", "texts-index", "kathas-index", "glossary-index", "reference", "manifest"]) assert.equal(classes.get(t), "static", t);
  for (const t of ["occasion", "occasion-part", "pothi", "mantra", "chapter", "term", "lesson", "static", "search"]) assert.equal(classes.get(t), "runtime", t);
  assert.equal(classes.get("sw"), "none");
});

test("fixture build: sw.js exists at the root with the build hash; precache ⊆ dist files; shell pages + hashed assets + fonts included; ≤ 2 MB", async () => {
  const b = await fixtureBuild();
  const sw = b.read("sw.js");
  assert.ok(sw.includes(`var HASH = "${b.report.hash}";`));
  const list = JSON.parse(/var PRECACHE = (\[[^\n]*\]);/.exec(sw)[1]);
  assert.equal(list.length, b.report.pwa.precache.count);
  const missing = list.filter((u) => {
    const rel = u.replace(/^\/panditbano\//, "");
    const file = rel === "" || rel.endsWith("/") ? `${rel}index.html` : rel;
    return !b.has(file);
  });
  assert.deepEqual(missing, [], "every precache URL is a dist file");
  for (const u of ["/panditbano/", "/panditbano/404.html", "/panditbano/hi/", "/panditbano/en/", "/panditbano/bho/", "/panditbano/hi/offline/", "/panditbano/hi/occasions/", "/panditbano/bho/glossary/", "/panditbano/en/reference/", "/panditbano/hi/manifest.webmanifest", "/panditbano/fonts/tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2"]) {
    assert.ok(list.includes(u), `${u} precached`);
  }
  assert.ok(list.some((u) => /assets\/css\/site\.[0-9a-f]{12}\.css$/.test(u)) && list.some((u) => /assets\/js\/offline\.[0-9a-f]{12}\.mjs$/.test(u)));
  assert.ok(!list.some((u) => /\/occasions\/vivah\//.test(u) || /\/mantras\/[a-z]/.test(u) || /\/about\//.test(u)), "runtime pages are not precached");
  assert.ok(b.report.pwa.precache.bytes <= PRECACHE_BUDGET, `precache ${b.report.pwa.precache.bytes} B`);
  assert.ok(!/__PB_/.test(sw));
});
