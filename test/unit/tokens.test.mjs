// FEAT-102: tokens.css invariants (design.md §5.1, §22, §24; design-review NIT 7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tokens = readFileSync(join(ROOT, "assets", "css", "tokens.css"), "utf8");
const site = readFileSync(join(ROOT, "assets", "css", "site.css"), "utf8");

function block(css, selector) {
  const i = css.indexOf(selector);
  assert.ok(i >= 0, `selector ${selector} not found`);
  const open = css.indexOf("{", i);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close).split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
}

test("dark and system token blocks are byte-identical", () => {
  const dark = block(tokens, ':root[data-theme="dark"]');
  const system = block(tokens, ':root[data-theme="system"]');
  assert.equal(system, dark);
  assert.ok(dark.includes("--paper: #171209"));
  assert.ok(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\[data-theme="system"\]/.test(tokens), "system block must sit inside the dark media query");
});

test("light block is the default (first paint) and carries the fourteen tokens", () => {
  const light = block(tokens, ':root, :root[data-theme="light"]');
  for (const t of ["--paper", "--surface", "--ink", "--ink-2", "--accent", "--accent-ink", "--accent-tint", "--accent-2", "--haldi", "--on-haldi", "--good", "--hair", "--hair-strong", "--focus", "--shadow", "color-scheme: light"]) {
    assert.ok(light.includes(t), `light block lacks ${t}`);
  }
  assert.ok(light.includes("--paper: #F8ECD4"));
});

test("print block remaps paper/ink to white/black", () => {
  assert.match(tokens, /@media print\s*\{\s*:root\s*\{[^}]*--paper: #FFFFFF[^}]*--ink: #000000/);
});

test("type, space and radius tokens live in tokens.css (NIT 7)", () => {
  for (const t of ["--fs-body: clamp(17px, 16.1px + 0.2304vw, 22px)", "--fs-mantra", "--fs-pothi", "--fs-small", "--fs-meta", "--lh-body: 1.65", "--lh-mantra: 2", "--h1", "--h2", "--h3", "--display-weight: 600", "--gutter: clamp(16px, 3.5vw, 96px)", "--gap", "--measure: 72ch", "--control-h: 44px", "--head-h: 64px", "--radius: 8px", "--radius-s: 6px", "--radius-ctl: 8px", "--font-mantra", "--font-body", "--font-latin", "--font-display", "--on-haldi", "--shadow"]) {
    assert.ok(tokens.includes(t), `tokens.css lacks ${t}`);
  }
});

test("site.css defines no custom property under :root", () => {
  const roots = [...site.matchAll(/:root[^{]*\{([^}]*)\}/g)];
  for (const m of roots) assert.ok(!/--[a-z]/.test(m[1]), `site.css :root block defines a custom property: ${m[0].slice(0, 80)}`);
  assert.ok(!/^\s*--[a-z0-9-]+\s*:/m.test(site.replace(/var\(--[^)]*\)/g, "")), "site.css declares a custom property");
});

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const SCAN = ["assets/css", "assets/js", "build"];
const ALLOW = new Set(["assets/css/tokens.css"]);

test("no colour literal (#hex, rgb(, hsl() outside tokens.css", () => {
  const offenders = [];
  for (const dir of SCAN) {
    for (const f of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, f).split("\\").join("/");
      if (ALLOW.has(rel) || !/\.(css|mjs|js)$/.test(rel)) continue;
      const text = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      // allow "#rgb"-looking fragment ids like href="#i-ext" (letters after # must be hex to count)
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        const cleaned = line.replace(/#[im]-[a-z0-9-]+/g, "").replace(/#\{[^}]*\}/g, "").replace(/#(main|v\{n\}|[a-z]+-[a-z-]+)\b/g, "");
        if (COLOUR.test(cleaned)) offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
  }
  assert.deepEqual(offenders, []);
});
