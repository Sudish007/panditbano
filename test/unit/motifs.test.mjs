// FEAT-102: sprite ⇄ MOTIFS.md parity and every symbol referenced by a template exists in the sprite (design §5.2, §22).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spriteIds } from "../../build/templates/lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ids = spriteIds();
const motifs = readFileSync(join(ROOT, "assets", "MOTIFS.md"), "utf8");
const listed = [...motifs.matchAll(/^\| `([im]-[a-z0-9-]+)` \|/gm)].map((m) => m[1]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test("sprite symbols ⇄ MOTIFS.md rows", () => {
  assert.deepEqual([...ids].sort(), [...new Set(listed)].sort());
  assert.ok(ids.includes("i-ext") && ids.includes("i-auto") && ids.includes("m-jaali"));
});

test("every #symbol referenced by build/templates or assets/js exists in the sprite", () => {
  const used = new Set();
  for (const dir of ["build/templates", "assets/js"]) {
    for (const f of walk(join(ROOT, dir))) {
      for (const m of readFileSync(f, "utf8").matchAll(/href="#([im]-[a-z0-9-]+)"|icon\("([im]-[a-z0-9-]+)"|"([im]-[a-z0-9-]+)"/g)) {
        const id = m[1] || m[2] || m[3];
        if (/^[im]-/.test(id)) used.add(id);
      }
    }
  }
  const missing = [...used].filter((id) => !ids.includes(id));
  assert.deepEqual(missing, []);
  assert.ok(used.has("m-diya") && used.has("i-sun") && used.has("i-ext"));
});
