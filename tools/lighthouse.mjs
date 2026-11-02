#!/usr/bin/env node
// Pandit Bano — Lighthouse runner (brief §7, §9; design.md §20 UI-32, §23). Pinned lighthouse@12.8.2 through
// `npx --yes`, mobile preset (Lighthouse default), Edge as the browser (CHROME_PATH), one JSON per URL in $TEMP.
//
//   node tools/lighthouse.mjs --label ship-1a https://sudish007.github.io/panditbano/hi/ <url2> <url3>
//   node tools/lighthouse.mjs --label local --serve dist /panditbano/hi/     (serves dist/ in-process on an ephemeral port)
//
// Writes dist/_reports/lighthouse-<label>.json, prints a table, exits 1 if any target is missed
// (perf ≥ 95, accessibility 100, best-practices 100, SEO 100). Ship steps record the real numbers either way.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = { performance: 95, accessibility: 100, "best-practices": 100, seo: 100 };
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function parseArgs(argv) {
  const a = { label: "local", urls: [], serve: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--label") a.label = argv[++i];
    else if (argv[i] === "--serve") a.serve = argv[++i];
    else a.urls.push(argv[i]);
  }
  return a;
}

function chromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (existsSync(EDGE)) return EDGE;
  const pw = join(process.env.LOCALAPPDATA || "", "ms-playwright");
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter((n) => n.startsWith("chromium-")).sort().reverse()) {
      const p = join(pw, d, "chrome-win", "chrome.exe");
      if (existsSync(p)) return p;
    }
  }
  throw new Error("no Edge and no Playwright chromium found; set CHROME_PATH");
}

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

/** Static server with GitHub Pages semantics (directory → index.html; unknown → 404.html with status 404) under BASE_PATH. */
function serveDist(dist, basePath) {
  const srv = createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = null;
    if (url.startsWith(basePath)) {
      let rel = url.slice(basePath.length);
      if (rel === "" || rel.endsWith("/")) rel += "index.html";
      const p = resolve(dist, ...rel.split("/"));
      if (p.startsWith(resolve(dist)) && existsSync(p) && statSync(p).isFile()) file = p;
    }
    if (!file) {
      const nf = join(dist, "404.html");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(existsSync(nf) ? readFileSync(nf) : "404");
      return;
    }
    // gzip text assets like GitHub Pages does (FIX-1a): the per-page budget is a gzip figure now, and an uncompressed local
    // server made `uses-text-compression` fail and performance read 92 on pages that transfer ≈ 100 KB gzip live
    const type = MIME[extname(file)] || "application/octet-stream";
    const body = readFileSync(file);
    const gz = /^(text\/|application\/(json|javascript|xml|manifest))/.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache", ...(gz ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}) });
    res.end(gz ? gzipSync(body, { level: 6 }) : body);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok({ srv, origin: `http://127.0.0.1:${srv.address().port}` })));
}

function run(cmd, args, opts) {
  return new Promise((ok) => {
    const child = spawn(cmd, args, opts);
    const timer = opts.timeout ? setTimeout(() => child.kill(), opts.timeout) : null;
    child.on("error", (error) => { if (timer) clearTimeout(timer); ok({ status: null, signal: null, error }); });
    child.on("close", (status, signal) => { if (timer) clearTimeout(timer); ok({ status, signal }); });
  });
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.urls.length) {
    console.error("usage: node tools/lighthouse.mjs --label <label> [--serve dist] <url-or-path> …");
    return 2;
  }
  const chrome = chromePath();
  let server = null;
  let urls = a.urls;
  if (a.serve) {
    const dist = resolve(ROOT, a.serve);
    const build = JSON.parse(readFileSync(join(dist, "_reports", "build.json"), "utf8"));
    server = await serveDist(dist, build.basePath || "/panditbano/");
    urls = a.urls.map((u) => (u.startsWith("http") ? u : server.origin + u));
    console.log(`lighthouse: serving ${dist} at ${server.origin}`);
  }
  const outDir = join(ROOT, "dist", "_reports");
  mkdirSync(outDir, { recursive: true });
  const rows = [];
  let missed = 0;
  for (const url of urls) {
    const tmp = join(tmpdir(), `pb-lh-${a.label}-${rows.length + 1}.json`);
    const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
    const cmd = ["npx", "--yes", "lighthouse@12.8.2", q(url), "--output=json", `--output-path=${q(tmp)}`, '--chrome-flags="--headless=new"', "--quiet", "--only-categories=performance,accessibility,best-practices,seo"].join(" ");
    const t0 = Date.now();
    // async spawn through the shell (npx is a .cmd on Windows): a blocking spawnSync would freeze the event loop and
    // starve the in-process --serve server (observed as ETIMEDOUT)
    const r = await run(cmd, [], { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, CHROME_PATH: chrome }, shell: true, timeout: 600000 });
    if (r.status !== 0 || !existsSync(tmp)) {
      rows.push({ url, error: `lighthouse exited ${r.status}${r.signal ? ` signal ${r.signal}` : ""}${r.error ? ` ${r.error.message}` : ""}; json ${existsSync(tmp) ? "written" : "missing"}` });
      missed++;
      continue;
    }
    const lhr = JSON.parse(readFileSync(tmp, "utf8"));
    const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const row = {
      url, performance: score("performance"), accessibility: score("accessibility"), "best-practices": score("best-practices"), seo: score("seo"),
      lcpMs: Math.round(lhr.audits["largest-contentful-paint"]?.numericValue ?? 0), fcpMs: Math.round(lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
      cls: lhr.audits["cumulative-layout-shift"]?.numericValue ?? null, tbtMs: Math.round(lhr.audits["total-blocking-time"]?.numericValue ?? 0),
      formFactor: lhr.configSettings?.formFactor, lighthouseVersion: lhr.lighthouseVersion, runMs: Date.now() - t0, json: tmp,
      failedAudits: Object.values(lhr.audits).filter((x) => x.score !== null && x.score < 1 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "manual" && x.scoreDisplayMode !== "notApplicable").map((x) => `${x.id} (${x.score})`).slice(0, 25),
    };
    row.missed = Object.entries(TARGETS).filter(([k, v]) => row[k] < v).map(([k]) => k);
    if (row.missed.length) missed++;
    rows.push(row);
  }
  if (server) server.srv.close();
  const report = { label: a.label, when: new Date().toISOString(), chrome, targets: TARGETS, rows };
  const out = join(outDir, `lighthouse-${a.label}.json`);
  writeFileSync(out, JSON.stringify(report, null, 1) + "\n");
  console.log("\nurl | perf | a11y | bp | seo | LCP ms | missed");
  for (const r of rows) console.log(r.error ? `${r.url} | ${r.error}` : `${r.url} | ${r.performance} | ${r.accessibility} | ${r["best-practices"]} | ${r.seo} | ${r.lcpMs} | ${r.missed.join(",") || "-"}`);
  for (const r of rows) if (r.failedAudits?.length) console.log(`  ${r.url}: failing audits ${r.failedAudits.join(", ")}`);
  console.log(`lighthouse ${a.label}: ${rows.length} pages, ${missed} missing a target → ${out}`);
  return missed ? 1 : 0;
}

main().then((code) => process.exit(code), (err) => { console.error(`lighthouse: ${err.message}`); process.exit(2); });
