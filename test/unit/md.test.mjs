// FEAT-104: Markdown subset (design §11.3; plan §2.5 {{verse:}}) — golden file + behaviour checks.
// Regenerate the golden file deliberately with UPDATE_GOLDEN=1 after reading the diff.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontMatter, renderMarkdown, renderInline, internalLinks, proseOnly } from "../../build/lib/md.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIX = join(ROOT, "test", "fixtures", "md");

const TERMS = {
  vivah: { href: "/panditbano/hi/glossary/vivah/", display: "विवाह", alt: "शादी" },
  kalash: { href: "/panditbano/hi/glossary/kalash/", display: "कलश", alt: null },
  havan: { href: null, display: "हवन", alt: "होम" }, // in the term bank, no glossary page yet (FIX-1a)
};
const ctx = {
  lang: "hi",
  extLabel: "बाहरी कड़ी",
  href: (p) => "/panditbano/hi/" + p.replace(/^\/+/, ""),
  term: (id) => TERMS[id] || null,
  mantra: (id) => (id === "vs-36-3" ? '<div class="verse" data-id="vs-36-3">[mantra block]</div>' : null),
  verse: (k) => (k === "rudrashtadhyayi-1-1" ? '<div class="verse" data-id="rudrashtadhyayi-1-1">[verse block]</div>' : null),
  sutra: (id) => (id === "pgs-1-8-1" ? '<blockquote class="sutra">[sutra]</blockquote>' : null),
  note: (k) => (k === "health" ? "यह धार्मिक परम्परा का विवरण है, चिकित्सा-सलाह नहीं।" : null),
  count: (k) => (k === "occasions" ? 193 : null),
};

test("front matter: first JSON line is parsed; a non-JSON first line throws with the file name", () => {
  const { meta, body } = parseFrontMatter('{"title": "T", "summary": "S"}\n\nBody', "x.md");
  assert.deepEqual(meta, { title: "T", summary: "S" });
  assert.equal(body.trim(), "Body");
  assert.throws(() => parseFrontMatter("# no front matter", "y.md"), /y\.md:1:1/);
  assert.throws(() => parseFrontMatter('{"title": broken}', "z.md"), /z\.md:1:1: front matter/);
});

test("golden file: subset.md renders exactly as subset.html", () => {
  const { body } = parseFrontMatter(readFileSync(join(FIX, "subset.md"), "utf8"), "subset.md");
  const r = renderMarkdown(body, ctx);
  const golden = join(FIX, "subset.html");
  if (process.env.UPDATE_GOLDEN === "1" || !existsSync(golden)) writeFileSync(golden, r.html + "\n");
  assert.equal(r.html + "\n", readFileSync(golden, "utf8"));
  // structural facts the golden encodes
  assert.match(r.html, /<h2 id="s-1">Heading one<\/h2>/, "headings are shifted one level");
  assert.match(r.html, /<h5 id="s-3">Heading four<\/h5>/);
  assert.match(r.html, /<a href="\/panditbano\/hi\/occasions\/vivah\/">the wedding<\/a>/, "internal links go through href()");
  assert.match(r.html, /rel="external noopener">Sanskrit Wikisource<svg class="ext-ic"/, "external marker");
  assert.match(r.html, /&lt;script&gt;/, "HTML in the source is escaped");
  assert.ok(!/<script/.test(r.html));
  assert.match(r.html, /<div class="table-wrap"><table>/);
  assert.match(r.html, /<p class="note note-health" role="note">/);
  assert.equal((r.html.match(/data-first="1"/g) || []).length, 2, "first use of each term is marked once (vivah, kalash)");
  assert.match(r.html, /विवाह<\/a> <span class="term-alt">\(शादी\)<\/span>/, "R5 B7 bracketed alternate on first use");
  assert.equal(r.unresolved.length, 3);
  assert.deepEqual(r.unresolved.map((u) => u.type).sort(), ["count", "mantra", "term"]);
  assert.deepEqual(r.terms, ["vivah", "vivah", "kalash", "no-such-term"]);
  assert.ok(r.links.some((l) => l.url === "/occasions/vivah/") && r.links.some((l) => l.url.startsWith("https://sa.wikisource.org/")));
});

test("inline: emphasis, escaping and placeholders", () => {
  assert.equal(renderInline("a **b** *c* d", ctx), "a <strong>b</strong> <em>c</em> d");
  assert.equal(renderInline("2 * 3 * 4", ctx), "2 * 3 * 4", "lone asterisks are not emphasis");
  assert.equal(renderInline("<b>x</b> & y", ctx), "&lt;b&gt;x&lt;/b&gt; &amp; y");
  assert.equal(renderInline("{{count:occasions}} अवसर", ctx), '<span class="count" data-count="occasions">193</span> अवसर');
  assert.match(renderInline("[[kalash]]", ctx), /^<a class="term" href="\/panditbano\/hi\/glossary\/kalash\/" data-first="1">कलश<\/a>$/);
  assert.equal(renderInline("[[havan]] और [[havan]]", ctx), '<span class="term" data-term="havan" data-first="1">हवन</span> <span class="term-alt">(होम)</span> और <span class="term" data-term="havan">हवन</span>', "no page yet → text with the first-use bracket, no link to the index (FIX-1a)");
  assert.match(renderInline("[x](#frag)", ctx), /href="#frag"/, "anchors are kept as-is");
});

test("helpers for the gate: internalLinks() and proseOnly()", () => {
  assert.deepEqual(internalLinks("see [a](/occasions/vivah/) and [b](https://x.y/) and [c](#top) and [d](reference/sankalpa/)"), ["/occasions/vivah/", "reference/sankalpa/"]);
  const p = proseOnly("Text [[vivah]] with [link](https://example.com/Path) and {{count:occasions}} **bold**");
  assert.ok(!p.includes("https://") && !p.includes("[[") && !p.includes("{{") && p.includes("link") && p.includes("bold"));
});
