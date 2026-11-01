// FEAT-102: the inline head script (design.md §9.3; design-review NIT 8): ≤ 400 bytes, validates pb-theme AND pb-translit.
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { HEAD_SCRIPT } from "../../build/templates/layout.mjs";

const js = HEAD_SCRIPT.replace(/^<script>/, "").replace(/<\/script>$/, "");

function run(storage, throwing = false) {
  const attrs = {};
  const sandbox = {
    document: { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } },
    localStorage: { getItem: (k) => { if (throwing) throw new Error("denied"); return k in storage ? storage[k] : null; } },
  };
  vm.runInNewContext(js, sandbox);
  return attrs;
}

test("head script is at most 400 bytes and starts with <script>(function()", () => {
  assert.ok(Buffer.byteLength(HEAD_SCRIPT) <= 400, `head script is ${Buffer.byteLength(HEAD_SCRIPT)} bytes`);
  assert.match(HEAD_SCRIPT, /^<script>\(function\(\)/);
});

test("defaults: no storage → light + iast", () => {
  assert.deepEqual(run({}), { "data-theme": "light", "data-translit": "iast" });
});

test("valid values are applied", () => {
  assert.deepEqual(run({ "pb-theme": "dark", "pb-translit": "easy" }), { "data-theme": "dark", "data-translit": "easy" });
  assert.deepEqual(run({ "pb-theme": "system", "pb-translit": "off" }), { "data-theme": "system", "data-translit": "off" });
});

test("bogus values fall back: pb-translit '<script>' → iast; pb-theme 'x' → light", () => {
  assert.deepEqual(run({ "pb-theme": "x", "pb-translit": "<script>" }), { "data-theme": "light", "data-translit": "iast" });
  assert.deepEqual(run({ "pb-theme": "", "pb-translit": "IAST" }), { "data-theme": "light", "data-translit": "iast" });
});

test("storage access that throws degrades to defaults", () => {
  assert.deepEqual(run({}, true), { "data-theme": "light", "data-translit": "iast" });
});
