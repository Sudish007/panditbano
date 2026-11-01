// FEAT-109: three per-language web app manifests (design §13.1; design-review NIT 17) — no `id`, relative start_url/scope,
// distinct short_name per language, maskable icon, paper colours from tokens.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { manifestFor, writeManifests } from "../../build/pwa.mjs";
import { paperColours } from "../../build/build.mjs";
import { ROOT } from "./_fixture-build.mjs";

const ui = {};
for (const l of ["hi", "en", "bho"]) ui[l] = JSON.parse(readFileSync(join(ROOT, "content", "ui", `${l}.json`), "utf8"));
const colours = paperColours(readFileSync(join(ROOT, "assets", "css", "tokens.css"), "utf8"));

test("three manifests: no id, relative start_url and scope, lang/dir, standalone, three icons incl. maskable", () => {
  const out = new Map();
  writeManifests(out, { ui, themeColors: colours });
  assert.deepEqual([...out.keys()].sort(), ["bho/manifest.webmanifest", "en/manifest.webmanifest", "hi/manifest.webmanifest"]);
  for (const l of ["hi", "en", "bho"]) {
    const m = JSON.parse(out.get(`${l}/manifest.webmanifest`));
    assert.ok(!("id" in m), `${l}: no id`);
    assert.equal(m.start_url, "./");
    assert.equal(m.scope, "../");
    assert.equal(m.lang, l);
    assert.equal(m.dir, "ltr");
    assert.equal(m.display, "standalone");
    assert.equal(m.background_color, colours.light);
    assert.equal(m.theme_color, colours.light);
    assert.match(m.background_color, /^#[0-9A-Fa-f]{6}$/);
    assert.equal(m.icons.length, 3);
    assert.ok(m.icons.every((i) => i.src.startsWith("../assets/icons/") && i.type === "image/png"));
    assert.deepEqual(m.icons.map((i) => i.sizes), ["192x192", "512x512", "512x512"]);
    assert.equal(m.icons.filter((i) => i.purpose === "maskable").length, 1);
    assert.ok(m.description && m.description.length > 20);
  }
});

test("name and short_name are the language's display name — distinct across the three apps", () => {
  const names = ["hi", "en", "bho"].map((l) => manifestFor(ui[l], l, colours).short_name);
  assert.deepEqual(names, ["पंडित बनो", "Pandit Bano", "पंडित बनीं"]);
  assert.equal(new Set(names).size, 3);
  for (const l of ["hi", "en", "bho"]) assert.equal(manifestFor(ui[l], l, colours).name, ui[l].site.name);
});
