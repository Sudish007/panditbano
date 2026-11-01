// FEAT-110: every href / src in dist/ resolves to a dist file or points at an allowed external origin (design §24;
// brief §1 "no third-party requests at runtime" — the only external hosts are the ones the content cites).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT, DIST, FILES, BASE_PATH, SITE_ORIGIN, pages, hrefToFile } from "./_dist.mjs";
import { BUILD_TOOLS, OFL_URL, GITHUB_PRIVACY } from "../../build/templates/pages/static.mjs";
import { GITHUB_REPO, SHUBHVELA } from "../../build/templates/layout.mjs";
import { SEARCH_HOSTS } from "../../build/lib/schema.mjs";

const host = (u) => { try { return new URL(u).host; } catch (e) { return null; } };
const registryHosts = () => {
  const hosts = new Set();
  const dirs = [join(ROOT, "content")];
  if (process.env.CONTENT_DIR) dirs.push(resolve(process.env.CONTENT_DIR));
  for (const dir of dirs) {
    for (const name of ["sources.json", "institutions.json"]) {
      const p = join(dir, name);
      if (!existsSync(p)) continue;
      const j = JSON.parse(readFileSync(p, "utf8"));
      const entries = Array.isArray(j) ? j : j.sources || j.institutions || [];
      for (const e of entries) {
        for (const u of [e.url, ...(e.urls || [])]) if (u && host(u)) hosts.add(host(u));
      }
    }
  }
  return hosts;
};

/** Allowed external origins (FEAT-110 step 2): Shubhvela/GitHub, the registry + institution hosts, Creative Commons, the OFL
 *  page, the build tools, the samagri purchase-search hosts the schema allows (design §10.3 — no affiliate). */
export const ALLOWED_HOSTS = new Set([
  host(SHUBHVELA), host(GITHUB_REPO), host(GITHUB_PRIVACY), "creativecommons.org", host(OFL_URL), "schema.org",
  ...SEARCH_HOSTS,
  ...BUILD_TOOLS.map((x) => host(x.url)),
  ...registryHosts(),
]);

const ATTR_RE = /\s(?:href|src|poster|data|action)="([^"]*)"/g;

test("every href/src in every HTML file resolves to a dist file or an allowed external origin", () => {
  const missing = [];
  const foreign = new Map();
  let internal = 0, external = 0;
  for (const file of FILES) {
    if (!file.endsWith(".html")) continue;
    const html = readFileSync(join(DIST, file), "utf8");
    for (const m of html.matchAll(ATTR_RE)) {
      const v = m[1].replace(/&amp;/g, "&");
      if (v === "" || v.startsWith("#") || v.startsWith("mailto:") || v.startsWith("data:") || v.startsWith("javascript:")) continue;
      if (/^https?:\/\//.test(v) && !v.startsWith(SITE_ORIGIN + BASE_PATH)) {
        external++;
        const h = host(v);
        if (!ALLOWED_HOSTS.has(h)) { if (!foreign.has(h)) foreign.set(h, `${file}: ${v}`); }
        continue;
      }
      internal++;
      let target;
      if (v.startsWith(SITE_ORIGIN) || v.startsWith("/")) target = hrefToFile(v);
      else {
        // relative URL (e.g. the dev page's ../fonts/…): resolve against the file's directory
        const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
        const parts = (dir + v.split("#")[0].split("?")[0]).split("/");
        const out = [];
        for (const p of parts) { if (p === "..") out.pop(); else if (p !== "." && p !== "") out.push(p); }
        target = out.join("/") + (v.endsWith("/") ? "/index.html" : "");
      }
      if (target === null) { missing.push(`${file}: ${v} (outside BASE_PATH ${BASE_PATH})`); continue; }
      if (!FILES.has(target)) missing.push(`${file}: ${v} → ${target}`);
    }
  }
  assert.ok(internal > 100, `internal links counted: ${internal}`);
  assert.deepEqual(missing.slice(0, 20), [], `${missing.length} unresolved internal URL(s)`);
  assert.deepEqual([...foreign.values()].slice(0, 20), [], `${foreign.size} external host(s) not in the allowed set: ${[...foreign.keys()].join(", ")}`);
  console.log(`links: ${internal} internal, ${external} external over ${[...FILES].filter((f) => f.endsWith(".html")).length} HTML files; allowed hosts ${ALLOWED_HOSTS.size}`);
});

test("every page of build.json#pageList exists and sitemap URLs resolve", () => {
  for (const p of pages()) assert.ok(FILES.has(p.file), `${p.href} → ${p.file}`);
  const sm = readFileSync(join(DIST, "sitemap.xml"), "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0, "sitemap has URLs");
  for (const u of locs) {
    assert.ok(u.startsWith(SITE_ORIGIN + BASE_PATH), `sitemap URL under the site: ${u}`);
    assert.ok(FILES.has(hrefToFile(u)), `sitemap URL resolves: ${u}`);
  }
});
