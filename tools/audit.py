# -*- coding: utf-8 -*-
"""Pandit Bano — real-browser audit of the hard UI rules (design.md §20 UI-01…UI-33, §27; brief §5.1, §9, §10).

Usage (venv Python 3.13, Playwright 1.55, Edge channel):
  audit.py --pages all-types --widths 390,1440 --themes light,dark --langs hi --prefix feat105-r1
  audit.py --pages /hi/,/hi/offline/ --widths 320,390,1440,2560 --themes light,dark --langs hi,en,bho --prefix x
  audit.py --origin https://sudish007.github.io/panditbano/ --pages all-types --prefix ship-1a   (live; no server)
  audit.py --sweep overflow --prefix s320        (UI-30: every dist page at 320)
  audit.py --sweep font-floor --prefix s390      (UI-29: every dist page at 390)
  audit.py --sweep pothi --prefix sp             (UI-26 on every pothi page)
  audit.py --budget --prefix b                   (UI-31 from dist/)

Serving: dist/ is served under BASE_PATH on a daemon-thread socketserver inside this process (no background
servers; GitHub Pages behaviour: unknown paths get 404.html with status 404). Browser per brief §10:
chromium.launch(channel="msedge", headless=True, args=["--disable-lcd-text"]); new_context(viewport, dsf 1 or 0.75
at ≥ 2560, reduced_motion="reduce"); dark via localStorage pb-theme before navigation; wait 0.8 s; scrollBehavior
auto; viewport-only shots named <prefix>-<page>-<theme>-<width>.png (never > 1920 px per side).

Output: one line per check per page/width/theme (PASS / FAIL / N-A + measurement), JSON report to --out
(default dist/_reports/audit-<prefix>.json), exit 1 on any FAIL. N-A means the check has nothing to measure on
that page (e.g. UI-26 on a non-pothi page) and never fails the run.
"""
import argparse
import functools
import http.server
import io
import json
import os
import posixpath
import socketserver
import sys
import threading
import time
import urllib.parse

# Windows consoles default to cp1252: measures quote Devanagari (h1 text, mantra lines), so never let a print() abort a run.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, ".."))
DEFAULT_DIST = os.path.join(REPO, "dist")
DEFAULT_SHOTS = os.path.join(REPO, ".agents", "tasks", "v1-build", "shots")
ALL_CHECKS = [f"UI-{n:02d}" for n in range(1, 34)]
SHOT_SIDE_MAX = 1920
LIGHT_PAPER = "rgb(248, 236, 212)"
DARK_PAPER = "rgb(23, 18, 9)"
SKIP_TYPES = {"root-redirect"}  # redirects to the Hindi home immediately; nothing to measure


# ---------------------------------------------------------------- local server (GitHub Pages behaviour)
class PagesHandler(http.server.SimpleHTTPRequestHandler):
    base_path = "/panditbano/"
    dist = DEFAULT_DIST

    def log_message(self, *a):
        pass

    def translate_path(self, path):
        path = urllib.parse.unquote(urllib.parse.urlparse(path).path)
        if not path.startswith(self.base_path):
            return os.path.join(self.dist, "__outside_base_path__")
        rel = path[len(self.base_path):]
        if rel == "" or rel.endswith("/"):
            rel += "index.html"
        rel = posixpath.normpath("/" + rel).lstrip("/")
        return os.path.join(self.dist, *rel.split("/"))

    def send_head(self):
        p = self.translate_path(self.path)
        if os.path.isdir(p):
            p = os.path.join(p, "index.html")
        if not os.path.isfile(p):
            nf = os.path.join(self.dist, "404.html")
            body = open(nf, "rb").read() if os.path.isfile(nf) else b"404"
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return io.BytesIO(body)
        return super().send_head()

    def guess_type(self, path):
        if path.endswith(".mjs") or path.endswith(".js"):
            return "text/javascript; charset=utf-8"
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".woff2"):
            return "font/woff2"
        if path.endswith(".svg"):
            return "image/svg+xml"
        if path.endswith(".html"):
            return "text/html; charset=utf-8"
        if path.endswith(".json"):
            return "application/json; charset=utf-8"
        return super().guess_type(path)


def serve_dist(dist, base_path):
    """Start a daemon-thread server for dist/ under base_path; returns (origin_with_base, server)."""
    handler = type("H", (PagesHandler,), {"base_path": base_path, "dist": dist})
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{srv.server_address[1]}{base_path}", srv


def read_build_json(dist):
    p = os.path.join(dist, "_reports", "build.json")
    if not os.path.isfile(p):
        sys.exit(f"audit: {p} missing — run `npm run build` first")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dist_pages(dist):
    """Every HTML page in dist as a BASE_PATH-relative path (index.html → directory URL)."""
    out = []
    for root, dirs, files in os.walk(dist):
        rel_root = os.path.relpath(root, dist).replace(os.sep, "/")
        if rel_root.startswith("_dev") or rel_root.startswith("_reports") or rel_root.startswith("assets") or rel_root.startswith("fonts"):
            continue
        for f in files:
            if not f.endswith(".html"):
                continue
            rel = f if rel_root == "." else f"{rel_root}/{f}"
            if rel == "index.html":
                continue  # root redirect
            out.append(rel[:-len("index.html")] if rel.endswith("/index.html") else rel)
    return sorted(out)


# ---------------------------------------------------------------- browser-side measurements
# Shared helpers injected once per page (window.__pb). Every check is a function returning
# {pass: bool|null, measure: string, detail: any}; pass === null means not applicable.
HELPERS_JS = r"""
() => {
  if (window.__pb) return;
  const pb = {};
  pb.vis = (el) => {
    if (!(el instanceof Element)) return false;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  };
  pb.isSr = (el) => !!el.closest('.sr, [hidden], script, style, noscript, template, svg');
  pb.tag = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  pb.textOwners = () => Array.from(document.querySelectorAll('body *')).filter(el => !pb.isSr(el) && pb.vis(el) && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim()));
  pb.parseColor = (s) => {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(s || '');
    if (!m) return s === 'transparent' || !s ? [0, 0, 0, 0] : null;
    let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [+m[1], +m[2], +m[3], a];
  };
  pb.over = (top, bottom) => { // src-over compositing, both [r,g,b,a]
    const a = top[3] + bottom[3] * (1 - top[3]); if (a === 0) return [0, 0, 0, 0];
    const c = (i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
    return [c(0), c(1), c(2), a];
  };
  pb.bgBehind = (el) => { // composited background behind `el`'s text: el's own background over every ancestor's (alpha-aware), html at the bottom
    const chain = []; let e = el;
    while (e) { chain.push(e); e = e.parentElement; }
    let acc = [255, 255, 255, 1];
    for (let i = chain.length - 1; i >= 0; i--) {
      const cs = getComputedStyle(chain[i]); const c = pb.parseColor(cs.backgroundColor);
      if (c && c[3] > 0) acc = pb.over(c, acc);
    }
    return acc;
  };
  pb.bgOutside = (el) => el.parentElement ? pb.bgBehind(el.parentElement) : pb.bgBehind(document.documentElement);
  pb.lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  pb.ratio = (fg, bg) => { const f = pb.over(fg, bg); const l1 = pb.lum(f), l2 = pb.lum(bg); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  pb.hex = (c) => '#' + [0, 1, 2].map(i => Math.round(c[i]).toString(16).padStart(2, '0')).join('');
  pb.chWidth = (el) => { const cs = getComputedStyle(el); const cv = document.createElement('canvas').getContext('2d'); cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return cv.measureText('0').width; };
  pb.rectsOverlap = (a, b, tol) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > tol && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > tol;
  pb.gutterExpected = (w) => Math.min(96, Math.max(16, 0.035 * w));
  window.__pb = pb;
}
"""

CHECKS_JS = r"""
(args) => {
  const pb = window.__pb; const vw = innerWidth; const W = args.width; const out = {};
  const NA = (m) => ({ pass: null, measure: m });
  const R = (ok, m, d) => ({ pass: !!ok, measure: m, detail: d });

  // UI-01 no horizontal overflow
  out['UI-01'] = (() => {
    const sw = document.documentElement.scrollWidth; const beyond = [];
    document.querySelectorAll('body *').forEach(el => {
      if (!pb.vis(el) || el.closest('.table-wrap, .nav, .sections, .sr')) return;
      const cs = getComputedStyle(el); if (cs.position === 'fixed' && el.classList.contains('skip')) return;
      const r = el.getBoundingClientRect(); if (r.right > vw + 1) beyond.push(pb.tag(el) + ' right=' + Math.round(r.right));
    });
    return R(sw <= vw && beyond.length === 0, `scrollWidth ${sw} / innerWidth ${vw}; ${beyond.length} boxes beyond`, beyond.slice(0, 5));
  })();

  // UI-02 gutters
  out['UI-02'] = (() => {
    const c = document.querySelector('.container, main.plain, .plain'); if (!c) return NA('no .container');
    const cs = getComputedStyle(c); const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight); const exp = pb.gutterExpected(vw);
    return R(Math.abs(pl - exp) <= 1 && Math.abs(pr - exp) <= 1, `padding-inline ${pl.toFixed(1)}/${pr.toFixed(1)} px, expected ${exp.toFixed(1)}`);
  })();

  // UI-03 no container max-width below 2200
  out['UI-03'] = (() => {
    const main = document.querySelector('main'); if (!main) return NA('no main');
    const bad = []; let e = main;
    while (e) { const mw = getComputedStyle(e).maxWidth; if (mw !== 'none') { const px = parseFloat(mw); if (!(mw.endsWith('px') && px >= 2200)) bad.push(pb.tag(e) + ' max-width ' + mw); } e = e.parentElement; }
    return R(bad.length === 0, bad.length ? bad.join('; ') : 'main and ancestors: max-width none', bad);
  })();

  // UI-04 content box ≥ 88 % at ≥ 1920
  out['UI-04'] = (() => {
    if (vw < 1920) return NA('width < 1920');
    const el = document.querySelector('main .layout') || document.querySelector('main'); if (!el) return NA('no main');
    const cs = getComputedStyle(el); const inner = el.getBoundingClientRect().width - (el.matches('main') ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0);
    const ratio = inner / vw; return R(ratio >= 0.88, `content box ${Math.round(inner)} px = ${(ratio * 100).toFixed(1)} % of ${vw}`);
  })();

  // UI-05 reading measure ≤ 80ch (own font)
  out['UI-05'] = (() => {
    const els = Array.from(document.querySelectorAll('.prose, .mantra, .lede, .verse p')).filter(pb.vis); if (!els.length) return NA('no prose/mantra/lede');
    let max = 0, maxEl = ''; els.forEach(el => { const ch = el.clientWidth / pb.chWidth(el); if (ch > max) { max = ch; maxEl = pb.tag(el); } });
    return R(max <= 80, `widest ${max.toFixed(1)}ch (${maxEl}) of ${els.length} blocks`);
  })();

  // UI-06 controls 40–48 (≤ 48 only single-line, NIT 9); checkbox/radio ≥ 22 in a ≥ 44 row
  out['UI-06'] = (() => {
    const bad = []; let n = 0, min = 1e9;
    document.querySelectorAll('button, a.btn, .seg a, .seg button, .rail nav a, .nav a, .katha-nav a, .stepper button, summary').forEach(el => {
      if (!pb.vis(el)) return; n++; const h = el.getBoundingClientRect().height; min = Math.min(min, h);
      // multi-line wrapped controls (mocks decision 5) only need ≥ 40. "Single-line" = the control's text sits on one line box:
      // count the distinct line tops of its text rects (a flex/block <a> whose child span wraps has ONE client rect but TWO
      // text lines — FEAT-110 fix; the old getClientRects().length === 1 test failed the tracker rail at 320/360)
      const lines = (() => { const r = document.createRange(); r.selectNodeContents(el); const tops = Array.from(r.getClientRects()).filter(x => x.width > 0 && x.height > 0).map(x => x.top).sort((a, b) => a - b); let n = tops.length ? 1 : 0; for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > 10) n++; return n || 1; })();
      const single = lines === 1 && h < 60;
      if (h < 39.5) bad.push(`${pb.tag(el)} "${(el.textContent || '').trim().slice(0, 18)}" h=${h.toFixed(1)}`);
      else if (single && h > 48.5 && !el.matches('summary')) bad.push(`${pb.tag(el)} "${(el.textContent || '').trim().slice(0, 18)}" single-line h=${h.toFixed(1)} > 48 (${el.className})`);
    });
    document.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(el => {
      if (!pb.vis(el)) return; n++; const h = el.getBoundingClientRect().height; const row = el.closest('li, label, .opt, .check li') || el.parentElement; const rh = row.getBoundingClientRect().height;
      if (h < 21.5 || rh < 43.5) bad.push(`${pb.tag(el)} box=${h.toFixed(1)} row=${rh.toFixed(1)}`);
    });
    if (!n) return NA('no controls');
    return R(bad.length === 0, `${n} controls, min height ${min === 1e9 ? '-' : min.toFixed(1)} px, ${bad.length} violations`, bad.slice(0, 6));
  })();

  // UI-07 type floor and scale
  out['UI-07'] = (() => {
    let minFs = 1e9, minEl = '';
    pb.textOwners().forEach(el => { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < minFs) { minFs = fs; minEl = pb.tag(el); } });
    const body = parseFloat(getComputedStyle(document.body).fontSize); const bad = [];
    if (minFs < 12) bad.push(`min font ${minFs.toFixed(2)} px (${minEl})`);
    if (vw <= 390 && Math.abs(body - 17) > 0.2) bad.push(`body ${body.toFixed(2)} ≠ 17`);
    if (vw >= 2560 && Math.abs(body - 22) > 0.2) bad.push(`body ${body.toFixed(2)} ≠ 22`);
    if (body < 16.8 || body > 22.2) bad.push(`body ${body.toFixed(2)} outside 17–22`);
    const m = Array.from(document.querySelectorAll('.mantra')).filter(pb.vis)[0]; let mm = '';
    if (m) { const cs = getComputedStyle(m); const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) / fs; mm = `; mantra ${fs.toFixed(2)} px (${(fs / body).toFixed(3)}×), lh ${lh.toFixed(2)}`;
      if (!m.closest('.sutra, .marks, .pothi-step') && Math.abs(fs - body * 1.35) > 0.3) bad.push(`mantra ${fs.toFixed(2)} ≠ 1.35×body`);
      if (lh < 1.9) bad.push(`mantra line-height ${lh.toFixed(2)} < 1.9`); }
    return R(bad.length === 0, `min ${minFs === 1e9 ? '-' : minFs.toFixed(2)} px (${minEl}); body ${body.toFixed(2)} px${mm}`, bad);
  })();

  // UI-08 text contrast (composited)
  out['UI-08'] = (() => {
    const bad = []; let n = 0, worst = 99, worstEl = '';
    pb.textOwners().forEach(el => {
      const cs = getComputedStyle(el); const fg = pb.parseColor(cs.color); if (!fg) return;
      const bg = pb.bgBehind(el); const r = pb.ratio(fg, bg); n++;
      const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700; const need = fs >= 24 || (fs >= 18.66 && bold) ? 3 : 4.5;
      if (r < worst) { worst = r; worstEl = pb.tag(el); }
      if (r < need) bad.push(`${pb.tag(el)} "${(el.textContent || '').trim().slice(0, 14)}" ${r.toFixed(2)} < ${need} (${pb.hex(fg)} on ${pb.hex(bg)})`);
    });
    if (!n) return NA('no text');
    return R(bad.length === 0, `${n} text elements, worst ${worst.toFixed(2)} (${worstEl}), ${bad.length} below AA`, bad.slice(0, 8));
  })();

  // UI-09 non-text contrast: control borders, focus ring, chip borders, icon glyphs ≥ 3.0
  out['UI-09'] = (() => {
    const bad = []; let n = 0, worst = 99, worstEl = '';
    const consider = (el, label, colorStr, bg) => { const c = pb.parseColor(colorStr); if (!c || c[3] === 0) return; n++; const r = pb.ratio(c, bg); if (r < worst) { worst = r; worstEl = label; } if (r < 3) bad.push(`${label} ${r.toFixed(2)} (${pb.hex(c)} on ${pb.hex(bg)})`); };
    document.querySelectorAll('.btn, .seg, .chip, .stepper, .katha-nav a, input[type=checkbox], input[type=radio], input[type=search], input[type=text], select, .caveat, .rail nav .n').forEach(el => {
      if (!pb.vis(el)) return; const cs = getComputedStyle(el); if (parseFloat(cs.borderTopWidth) === 0 || cs.borderTopStyle === 'none') return;
      consider(el, pb.tag(el) + ' border', cs.borderTopColor, pb.bgOutside(el));
    });
    document.querySelectorAll('.btn svg, .btn-icon svg, button svg, .ext-ic').forEach(svg => {
      if (!pb.vis(svg)) return; const host = svg.closest('button, a') || svg.parentElement; consider(svg, pb.tag(host) + ' icon', getComputedStyle(svg).color, pb.bgBehind(host));
    });
    const root = getComputedStyle(document.documentElement); const focus = root.getPropertyValue('--focus').trim();
    if (focus) { const probe = document.createElement('div'); probe.style.cssText = `position:absolute;left:-9999px;color:${focus}`; document.body.appendChild(probe); const fc = getComputedStyle(probe).color; probe.remove();
      ['--paper', '--surface'].forEach(v => { const p2 = document.createElement('div'); p2.style.cssText = `position:absolute;left:-9999px;background:${root.getPropertyValue(v).trim()}`; document.body.appendChild(p2); const bg = pb.parseColor(getComputedStyle(p2).backgroundColor); p2.remove(); consider(probe, `focus ring on ${v}`, fc, bg); }); }
    if (!n) return NA('no bordered controls / icons');
    return R(bad.length === 0, `${n} boundaries, worst ${worst.toFixed(2)} (${worstEl}), ${bad.length} below 3.0`, bad.slice(0, 8));
  })();

  // UI-10 no box intersections (+ §27 band inside header, measured scrolled by the caller)
  out['UI-10'] = (() => {
    let inter = 0; const ex = [];
    document.querySelectorAll('.card, .step, li, .toolbar, .verse-tools, .head-row, .page-head, .hero-text, .block').forEach(box => {
      const kids = Array.from(box.children).filter(k => pb.vis(k) && !['inline', 'contents'].includes(getComputedStyle(k).display) && getComputedStyle(k).position !== 'absolute').map(k => ({ k, r: k.getBoundingClientRect() }));
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (pb.rectsOverlap(kids[i].r, kids[j].r, 1)) { inter++; if (ex.length < 5) ex.push(`${pb.tag(kids[i].k)} × ${pb.tag(kids[j].k)} in ${pb.tag(box)}`); }
    });
    const head = document.querySelector('.site-head'), band = document.querySelector('.band'); let bandMsg = '';
    if (head && band) { const hr = head.getBoundingClientRect(), br = band.getBoundingClientRect(); const inside = br.bottom <= hr.bottom + 0.5; bandMsg = `; band ${inside ? 'inside' : 'BELOW'} header (${Math.round(br.bottom)} vs ${Math.round(hr.bottom)})`; if (!inside) { inter++; ex.push('band hangs below header'); } }
    return R(inter === 0, `${inter} intersections${bandMsg}`, ex);
  })();

  // UI-11 stateful controls show state (attribute AND computed-style difference)
  out['UI-11'] = (() => {
    const bad = [], seen = [];
    const cur = document.querySelector('.seg a[aria-current="true"]'); const other = document.querySelector('.seg a:not([aria-current])');
    if (cur && other) { seen.push('lang'); const a = getComputedStyle(cur), b = getComputedStyle(other); if (a.backgroundColor === b.backgroundColor && a.color === b.color && a.borderColor === b.borderColor) bad.push('language: aria-current without a style difference'); }
    else if (document.querySelector('.seg a')) bad.push('language: no aria-current');
    const tb = document.querySelector('[data-theme-toggle]');
    if (tb) { seen.push('theme'); const theme = document.documentElement.getAttribute('data-theme'); const lbl = tb.querySelector('.lbl'); const exp = tb.getAttribute('data-l-' + theme);
      const icons = Array.from(tb.querySelectorAll('svg.ic')).filter(s => getComputedStyle(s).display !== 'none'); const want = { light: '#i-sun', dark: '#i-moon', system: '#i-auto' }[theme];
      if (!lbl || lbl.textContent !== exp) bad.push(`theme label "${lbl && lbl.textContent}" ≠ "${exp}"`); if (icons.length !== 1 || icons[0].querySelector('use').getAttribute('href') !== want) bad.push(`theme icon ${icons.map(i => i.querySelector('use').getAttribute('href')).join(',') || 'none'} ≠ ${want}`); }
    const tr = document.querySelectorAll('[role=radio][aria-checked], .seg button[aria-checked]');
    if (tr.length) { seen.push('translit'); const on = Array.from(tr).find(b => b.getAttribute('aria-checked') === 'true'), off = Array.from(tr).find(b => b.getAttribute('aria-checked') !== 'true'); if (!on) bad.push('translit: no aria-checked=true'); else if (off && getComputedStyle(on).backgroundColor === getComputedStyle(off).backgroundColor && getComputedStyle(on).color === getComputedStyle(off).color) bad.push('translit: no style difference'); }
    const vb = document.querySelector('.verse-tools [aria-pressed]'); if (vb) seen.push('voice');
    const ck = document.querySelector('.check input[type=checkbox]');
    if (ck) { seen.push('checklist'); const was = ck.checked; ck.checked = true; const lab = ck.nextElementSibling; const onStyle = lab ? getComputedStyle(lab).color + getComputedStyle(lab.querySelector('.name') || lab).textDecorationLine : ''; ck.checked = false; const offStyle = lab ? getComputedStyle(lab).color + getComputedStyle(lab.querySelector('.name') || lab).textDecorationLine : ''; ck.checked = was; if (lab && onStyle === offStyle) bad.push('checklist: :checked without style difference'); }
    const rails = document.querySelectorAll('details.rail-fold');
    if (rails.length) { seen.push('rail'); rails.forEach(d => { const s = d.querySelector('summary'); const after = getComputedStyle(s, '::after').content; if (vw >= 1024 && !d.open) bad.push('rail closed at ≥ 1024'); if (!after || after === 'none') bad.push('rail summary shows no open/closed marker'); }); }
    if (!seen.length) return NA('no stateful controls');
    return R(bad.length === 0, `${seen.join(', ')}: ${bad.length ? bad.length + ' problems' : 'attribute + style present'}`, bad);
  })();

  // UI-14 reduced motion (this context has reduce): no transition/animation
  out['UI-14'] = (() => {
    const bad = []; document.querySelectorAll('body *').forEach(el => { const cs = getComputedStyle(el); const td = cs.transitionDuration.split(',').map(parseFloat).some(v => v > 0); if (td || (cs.animationName && cs.animationName !== 'none')) bad.push(pb.tag(el)); });
    return R(bad.length === 0, `${bad.length} elements animate under prefers-reduced-motion: reduce`, bad.slice(0, 5));
  })();

  // UI-15 each fact once
  out['UI-15'] = (() => {
    const h1s = Array.from(document.querySelectorAll('h1')); if (h1s.length !== 1) return R(false, `${h1s.length} h1 elements`);
    const h1 = h1s[0].textContent.trim(); const dup = [];
    document.querySelectorAll('h2, h3, h4, h5, h6, .crumbs, .page-head .meta, .meta').forEach(el => { if (el.closest('.sr')) return; const txt = el.textContent.trim(); if (h1 && txt === h1) dup.push(pb.tag(el)); });
    return R(dup.length === 0, `one h1 "${h1.slice(0, 30)}"; ${dup.length} repeats in headings/crumbs/meta`, dup);
  })();

  // UI-16 hero halves + §27.2 hero gap at ≥ 1920
  out['UI-16'] = (() => {
    const hero = document.querySelector('.hero'); if (!hero) return NA('no .hero'); if (vw < 1920) return NA('width < 1920');
    const kids = Array.from(hero.children).filter(pb.vis); const bad = [];
    kids.forEach(k => { const h = k.clientHeight; const has = k.textContent.trim().length > 0 || k.querySelector('svg'); if (h < 120 || !has) bad.push(`${pb.tag(k)} h=${h} ${has ? '' : 'empty'}`); });
    let gap = null; if (kids.length >= 2) { const a = kids[0].getBoundingClientRect(), b = kids[1].getBoundingClientRect(); gap = Math.round(b.left - a.right); if (gap > 96) bad.push(`hero gap ${gap} px > 96 (§27.2)`); }
    return R(bad.length === 0, `${kids.length} hero children, heights ${kids.map(k => k.clientHeight).join('/')}, gap ${gap} px`, bad);
  })();

  // UI-17 grids fill the wide column (+ §27.3 group-card fill ≥ 0.55 at ≥ 1920)
  out['UI-17'] = (() => {
    if (vw < 1440) return NA('width < 1440');
    const grids = Array.from(document.querySelectorAll('.grid')).filter(pb.vis); const bad = []; const cols = [];
    // data-grid="list": a deliberate one-column list; data-grid="fixed": column count fixed by design §27.3 (1/2/3/4 at 390/820/1440/1920), so the last-row rule is waived
    grids.forEach(g => { const n = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length; cols.push(n); const kind = g.getAttribute('data-grid'); if (n < 3 && kind !== 'list') bad.push(`${pb.tag(g)} has ${n} columns`);
      const items = Array.from(g.children).filter(pb.vis).length; if (items >= 8 && !kind) { const last = items % n; if (last && last / n < 0.5) bad.push(`${pb.tag(g)} last row ${last}/${n} filled`); } });
    let fill = null; if (vw >= 1920) { const cards = Array.from(document.querySelectorAll('.group-card')).filter(pb.vis); if (cards.length) { fill = Math.min(...cards.map(gc => { const r = gc.getBoundingClientRect(); const cs = getComputedStyle(gc); const inner = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); let l = 1e9, rr = 0; gc.querySelectorAll('.gc-head, .chips, .t').forEach(e => { const b = e.getBoundingClientRect(); l = Math.min(l, b.left); rr = Math.max(rr, b.right); }); return (rr - l) / inner; })); if (fill < 0.55) bad.push(`group-card fill ${(fill * 100).toFixed(0)} % < 55 (§27.3)`); } }
    if (!grids.length && fill === null) return NA('no .grid');
    return R(bad.length === 0, `grids columns ${cols.join('/') || '-'}${fill !== null ? `; group-card fill ${(fill * 100).toFixed(0)} %` : ''}`, bad);
  })();

  // UI-18 rails at ≥ 1440
  out['UI-18'] = (() => {
    const l = document.querySelector('.layout.has-both'); if (!l) return NA('no .layout.has-both'); if (vw < 1440) return NA('width < 1440');
    const n = getComputedStyle(l).gridTemplateColumns.split(' ').filter(Boolean).length; const closed = Array.from(l.querySelectorAll('.rail details.rail-fold')).filter(d => !d.open).length;
    return R(n === 3 && closed === 0, `${n} columns, ${closed} closed rails`);
  })();

  // UI-19 named sources are links
  out['UI-19'] = (() => {
    const names = (args.sourceNames || []).filter(s => s && s.length >= 4); if (!names.length) return NA('no sources.json#titles / institutions.json yet');
    const main = document.querySelector('main'); if (!main) return NA('no main'); const bad = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT); let node;
    // prose only: the page's own h1, quiz questions/options (the gate's G16 exempts them too), form labels/legends, buttons,
    // summaries and Sanskrit text are not citations (FEAT-108)
    const SKIP = 'a, h1, .quiz, label, legend, button, summary, [lang="sa"], [lang="sa-Latn"]';
    while ((node = walker.nextNode())) { const txt = node.textContent; if (!txt.trim()) continue; if (node.parentElement.closest(SKIP)) continue; names.forEach(nm => { if (txt.includes(nm)) bad.push(`"${nm}" unlinked in ${pb.tag(node.parentElement)}`); }); }
    return R(bad.length === 0, `${names.length} names checked, ${bad.length} unlinked`, bad.slice(0, 8));
  })();

  // UI-20 external links marked
  out['UI-20'] = (() => {
    const links = Array.from(document.querySelectorAll('a[href^="http"]')).filter(a => { const u = new URL(a.href); return u.origin !== location.origin && !(args.siteOrigin && a.href.startsWith(args.siteOrigin)); });
    if (!links.length) return NA('no external links'); const bad = [];
    links.forEach(a => { const rel = (a.getAttribute('rel') || '').split(/\s+/); const marked = a.querySelector('.ext-ic, .sr'); if (!rel.includes('external') || !marked) bad.push(`${a.href} rel="${a.getAttribute('rel')}" marker=${!!marked}`); });
    return R(bad.length === 0, `${links.length} external links, ${bad.length} unmarked`, bad.slice(0, 5));
  })();

  // UI-21 language of parts
  out['UI-21'] = (() => {
    const bad = []; const hl = document.documentElement.getAttribute('lang'); if (!['hi', 'en', 'bho'].includes(hl)) bad.push(`html lang="${hl}"`);
    const own = (m) => { const c = m.closest('[lang]'); return c && c !== document.documentElement ? c.getAttribute('lang') : null; }; // html[lang] does not count
    document.querySelectorAll('.mantra').forEach(m => { const l = own(m); if (!['sa', 'awa', 'hi'].includes(l)) bad.push(`${pb.tag(m)} lang=${l}`); });
    document.querySelectorAll('.iast, .roman-easy').forEach(m => { const l = own(m); if (l !== 'sa-Latn') bad.push(`${pb.tag(m)} lang=${l}`); });
    return R(bad.length === 0, `html lang=${hl}; ${document.querySelectorAll('.mantra').length} mantra, ${document.querySelectorAll('.iast, .roman-easy').length} roman blocks checked`, bad.slice(0, 5));
  })();

  // UI-22 Devanagari rendering on _dev/fonts.html: fonts.check AND canvas width differs from the generic fallback (NIT 10)
  out['UI-22'] = (() => {
    const ps = Array.from(document.querySelectorAll('p.t[data-font]')); if (!ps.length) return NA('not the fonts test page');
    const bad = []; const rows = [];
    ps.forEach(p => { const face = p.getAttribute('data-font') === 'tiro' ? 'Tiro Devanagari Sanskrit' : 'Noto Sans Devanagari'; const generic = p.getAttribute('data-font') === 'tiro' ? 'serif' : 'sans-serif'; const size = p.getAttribute('data-size') + 'px';
      const txt = Array.from(p.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); const chk = document.fonts.check(`${size} "${face}"`, txt);
      const cv = document.createElement('canvas').getContext('2d'); cv.font = `${size} "${face}"`; const w1 = cv.measureText(txt).width; cv.font = `${size} ${generic}`; const w2 = cv.measureText(txt).width;
      const ok = chk && Math.abs(w1 - w2) > 0.5; rows.push({ test: p.getAttribute('data-test'), face, size, check: chk, wFace: +w1.toFixed(1), wGeneric: +w2.toFixed(1) }); if (!ok) bad.push(`${p.getAttribute('data-test')} ${face} ${size}: check=${chk} w=${w1.toFixed(1)} vs ${w2.toFixed(1)}`); });
    return R(bad.length === 0, `${ps.length} strings × faces: fonts.check true and measureText differs for ${ps.length - bad.length}`, { bad, rows });
  })();

  // UI-24 zero third-party requests: measured by the caller (page.on('request')) — placeholder filled outside
  out['UI-26'] = (() => {
    if (!document.querySelector('.pothi-step')) return NA('not a pothi page'); return { pass: null, measure: 'measured under print media by the caller' };
  })();

  // UI-28 no orphan danda / number
  out['UI-28'] = (() => {
    const blocks = Array.from(document.querySelectorAll('.mantra, .iast')).filter(pb.vis); if (!blocks.length) return NA('no .mantra/.iast');
    let n = 0; const bad = []; const re = /(\S)(\s*)([।॥]|\|\||\|)(\s*[०-९0-9]+\s*(?:[।॥]|\|\|))?/g;
    blocks.forEach(b => { const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let node; while ((node = walker.nextNode())) { if (node.parentElement.closest('.sr')) continue; const s = node.textContent; let m; while ((m = re.exec(s))) { n++; const r1 = document.createRange(); r1.setStart(node, m.index); r1.setEnd(node, m.index + 1); const r2 = document.createRange(); const di = m.index + m[1].length + m[2].length; r2.setStart(node, di); r2.setEnd(node, di + m[3].length); const a = r1.getClientRects()[0], c = r2.getClientRects()[0]; if (a && c && Math.abs(a.top - c.top) > 1) bad.push(`${pb.tag(b)} "…${s.slice(Math.max(0, m.index - 6), m.index + 1)} ${m[3]}" on the next line`); } } });
    if (!n) return NA('no danda/number markers'); return R(bad.length === 0, `${n} markers, ${bad.length} orphaned`, bad.slice(0, 5));
  })();

  return out;
}
"""

# UI-27: WCAG 1.4.12 text-spacing override (line-height raised only where below 1.5; letter 0.12em; word 0.16em; paragraph 2em),
# then UI-01 + UI-10 again + svara collision between mantra line boxes.
TEXT_SPACING_JS = r"""
() => {
  const pb = window.__pb;
  document.querySelectorAll('body *').forEach(el => { const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); const lh = parseFloat(cs.lineHeight); if (!isNaN(lh) && lh / fs < 1.5) el.style.setProperty('line-height', '1.5', 'important'); el.style.setProperty('letter-spacing', '0.12em', 'important'); el.style.setProperty('word-spacing', '0.16em', 'important'); });
  document.querySelectorAll('p').forEach(p => p.style.setProperty('margin-bottom', '2em', 'important'));
  const vw = innerWidth; const sw = document.documentElement.scrollWidth; const beyond = [];
  document.querySelectorAll('body *').forEach(el => { if (!pb.vis(el) || el.closest('.table-wrap, .nav, .sections, .sr')) return; const r = el.getBoundingClientRect(); if (r.right > vw + 1) beyond.push(pb.tag(el)); });
  let inter = 0; const ex = [];
  document.querySelectorAll('.card, .step, li, .toolbar, .verse-tools, .head-row, .page-head, .hero-text, .block').forEach(box => { const kids = Array.from(box.children).filter(k => pb.vis(k) && !['inline', 'contents'].includes(getComputedStyle(k).display) && getComputedStyle(k).position !== 'absolute').map(k => k.getBoundingClientRect()); for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (pb.rectsOverlap(kids[i], kids[j], 1)) { inter++; if (ex.length < 3) ex.push(pb.tag(box)); } });
  let collisions = 0, lines = 0;
  // line boxes = the rects of the TEXT nodes of the visible Devanagari (.deva): the visually hidden .sr span (design-review
  // MEDIUM 4) is a 1-px clipped box, and the block-level .pada spans (§27 item 1) would add whole-block rects, not lines
  document.querySelectorAll('.mantra').forEach(m => { const root = m.querySelector('.deva') || m; const rects = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let tn; while ((tn = tw.nextNode())) { if (!tn.textContent.trim() || tn.parentElement.closest('.sr')) continue; const r = document.createRange(); r.selectNodeContents(tn); rects.push(...Array.from(r.getClientRects()).filter(x => x.height > 1)); } const tops = []; rects.forEach(x => { if (!tops.some(t => Math.abs(t.top - x.top) < 2)) tops.push(x); }); tops.sort((a, b) => a.top - b.top); lines += tops.length; for (let i = 1; i < tops.length; i++) if (tops[i - 1].bottom > tops[i].top + 1) collisions++; });
  return { overflow: sw > vw || beyond.length > 0, scrollWidth: sw, beyond: beyond.slice(0, 5), intersections: inter, ex, mantraLines: lines, svaraCollisions: collisions };
}
"""

PRINT_JS = r"""
() => {
  const bar = document.querySelector('.pothi-bar'); const steps = Array.from(document.querySelectorAll('.pothi-step')); const bad = [];
  if (bar && getComputedStyle(bar).display !== 'none') bad.push('.pothi-bar visible in print');
  steps.forEach((s, i) => { const ba = getComputedStyle(s).breakAfter; if (ba !== 'page' && ba !== 'always') bad.push(`step ${i + 1} break-after ${ba}`); });
  let minM = 1e9; document.querySelectorAll('.pothi-step .mantra').forEach(m => { minM = Math.min(minM, parseFloat(getComputedStyle(m).fontSize)); });
  if (minM !== 1e9 && minM < 18.66) bad.push(`mantra ${minM.toFixed(2)} px < 18.67 in print`);
  ['.site-head', '.site-foot', '.floating'].forEach(sel => { const e = document.querySelector(sel); if (e && getComputedStyle(e).display !== 'none') bad.push(sel + ' visible in print'); });
  return { pass: bad.length === 0, measure: `${steps.length} pothi steps, mantra ${minM === 1e9 ? '-' : minM.toFixed(2)} px in print, ${bad.length} problems`, detail: bad };
}
"""

FOCUS_STEP_JS = r"""
() => {
  const el = document.activeElement; if (!el || el === document.body) return { end: true };
  const r = el.getBoundingClientRect(); const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
  const inView = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const hit = document.elementFromPoint(cx, cy); const ok = inView && hit && (hit === el || el.contains(hit) || hit.contains(el));
  const cover = hit && !ok ? (hit.closest('.site-head') ? 'site-head' : hit.closest('.rail') ? 'rail' : hit.tagName.toLowerCase()) : '';
  return { end: false, ok, tag: window.__pb.tag(el), cover, inView };
}
"""

VOICE_JS = r"""
async () => {
  const tools = document.querySelector('.verse-tools'); if (!tools) return { pass: null, measure: 'no .verse-tools' };
  const btn = tools.querySelector('[data-voice], button[aria-pressed]'); if (!btn) return { pass: false, measure: '.verse-tools without a voice button' };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let voices = speechSynthesis.getVoices(); if (!voices.length) { await wait(600); voices = speechSynthesis.getVoices(); }
  const hindi = voices.some(v => (v.lang || '').toLowerCase().startsWith('hi'));
  btn.click();
  if (!hindi) { await wait(400); const note = tools.querySelector('[role=status]') || document.querySelector('[role=status]'); const shown = note && note.textContent.trim() && getComputedStyle(note).display !== 'none'; return { pass: !!shown, measure: `branch no-hindi-voice (${voices.length} voices): note ${shown ? 'shown' : 'MISSING'}`, branch: 'no-voice' }; }
  let speaking = false, pressed = false; for (let i = 0; i < 20; i++) { await wait(100); pressed = btn.getAttribute('aria-pressed') === 'true'; speaking = speechSynthesis.speaking; if (pressed && speaking) break; }
  try { speechSynthesis.cancel(); } catch (e) {}
  return { pass: pressed && speaking, measure: `branch hindi-voice (${voices.length} voices): aria-pressed=${pressed}, speaking=${speaking} within 2 s`, branch: 'voice' };
}
"""

FONTS_JS = r"""
async (basePath) => {
  await document.fonts.ready; const faces = Array.from(document.fonts);
  const before = faces.filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
  await Promise.all(faces.map(f => f.load().catch(() => null)));
  const after = faces.map(f => ({ face: f.family + ' ' + f.weight, status: f.status }));
  const displays = []; for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r instanceof CSSFontFaceRule) displays.push(r.style.getPropertyValue('font-display') || '(none)'); } catch (e) {} }
  const preloads = Array.from(document.querySelectorAll('link[rel=preload][as=font]')).map(l => l.getAttribute('href'));
  return { before, after, displays, preloads, basePath };
}
"""


def load_source_names(repo):
    """UI-19 name list (design §20): sources.json#sources[].titles[] (the names under which prose may cite a source — G16)
    and institutions.json#institutions[] name + names[] (English and Devanagari forms). Top-level titles[] / names[] lists
    are accepted too. The registry 'title' field itself is NOT a cite name (FEAT-108: the loader read only top-level keys before)."""
    names = []

    def read(rel):
        p = os.path.join(repo, rel)
        if not os.path.isfile(p):
            return None
        try:
            with open(p, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    src = read("content/sources.json")
    if isinstance(src, dict):
        names.extend(x for x in src.get("titles", []) if isinstance(x, str))
        for e in src.get("sources", []) or []:
            if isinstance(e, dict):
                names.extend(x for x in e.get("titles", []) or [] if isinstance(x, str))
    inst = read("content/institutions.json")
    if isinstance(inst, dict):
        names.extend(x for x in inst.get("names", []) if isinstance(x, str))
        for e in inst.get("institutions", []) or []:
            if isinstance(e, dict):
                if isinstance(e.get("name"), str):
                    names.append(e["name"])
                names.extend(x for x in e.get("names", []) or [] if isinstance(x, str))
    return sorted(set(names))


def page_label(path):
    s = path.strip("/").replace("/", "-").replace(".html", "") or "root"
    return s.replace("_dev-", "dev-")


class Audit:
    def __init__(self, a):
        self.a = a
        self.results = []  # dicts: page, width, theme, lang, check, status, measure, detail
        self.shots = []
        self.fails = 0

    def rec(self, page, width, theme, check, res):
        status = "N-A" if res is None or res.get("pass") is None else ("PASS" if res.get("pass") else "FAIL")
        measure = (res or {}).get("measure", "")
        if status == "FAIL":
            self.fails += 1
        self.results.append({"page": page, "width": width, "theme": theme, "check": check, "status": status, "measure": measure, "detail": (res or {}).get("detail")})
        print(f"{status:4} {check} {page} {width} {theme}: {measure}", flush=True)

    def new_context(self, browser, width, height, theme, color_scheme=None, reduced="reduce", dsf=None):
        dsf = dsf if dsf is not None else (0.75 if width >= 2560 else 1.0)
        kw = dict(viewport={"width": width, "height": height}, device_scale_factor=dsf, reduced_motion=reduced, locale="hi-IN")
        if color_scheme:
            kw["color_scheme"] = color_scheme
        ctx = browser.new_context(**kw)
        if theme in ("dark", "system"):
            ctx.add_init_script(f"try{{localStorage.setItem('pb-theme','{theme}')}}catch(e){{}}")
        return ctx

    def goto(self, pg, url, wait="load"):
        pg.goto(url, wait_until=wait)
        pg.evaluate("document.documentElement.style.scrollBehavior='auto'")
        try:
            pg.evaluate("document.fonts.ready")
        except Exception:
            pass
        time.sleep(0.8)
        pg.evaluate(HELPERS_JS)

    def shot(self, pg, name):
        path = os.path.join(self.a.shots_dir, name)
        pg.screenshot(path=path, full_page=False)
        self.shots.append(path)
        print("shot", path, flush=True)

    def audit_page(self, browser, origin, path, widths, themes, checks, langs_label):
        label = page_label(path)
        url = origin + path.lstrip("/")
        want = lambda c: c in checks
        requests_seen = {}
        for theme in themes:
            for w in widths:
                h = 844 if w <= 430 else (1080 if w >= 1920 else 900)
                ctx = self.new_context(browser, w, h, theme)
                pg = ctx.new_page()
                hosts = set()
                pg.on("request", lambda r, hosts=hosts: hosts.add(urllib.parse.urlparse(r.url).netloc))
                self.goto(pg, url)
                res = pg.evaluate(CHECKS_JS, {"width": w, "sourceNames": self.a.source_names, "siteOrigin": self.a.site_origin})
                for c in ["UI-01", "UI-02", "UI-03", "UI-04", "UI-05", "UI-06", "UI-07", "UI-08", "UI-09", "UI-10", "UI-11", "UI-14", "UI-15", "UI-16", "UI-17", "UI-18", "UI-19", "UI-20", "UI-21", "UI-22", "UI-28"]:
                    if want(c):
                        self.rec(path, w, theme, c, res.get(c))
                # §27 band in the scrolled state (sticky header ≥ 820)
                if want("UI-10") and w >= 820 and pg.evaluate("!!document.querySelector('.site-head .band')"):
                    pg.evaluate("window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight / 2))")
                    time.sleep(0.2)
                    band = pg.evaluate("() => { const h = document.querySelector('.site-head').getBoundingClientRect(), b = document.querySelector('.band').getBoundingClientRect(); return { pass: b.bottom <= h.bottom + 0.5 && h.top <= 0.5, measure: `scrolled ${Math.round(scrollY)} px: header ${Math.round(h.top)}–${Math.round(h.bottom)}, band bottom ${Math.round(b.bottom)}` }; }")
                    self.rec(path, w, theme, "UI-10b", band)
                    pg.evaluate("window.scrollTo(0, 0)")
                    time.sleep(0.2)
                if want("UI-24"):
                    local = urllib.parse.urlparse(origin).netloc
                    foreign = sorted(x for x in hosts if x != local)
                    self.rec(path, w, theme, "UI-24", {"pass": not foreign, "measure": f"{len(hosts)} host(s): {', '.join(sorted(hosts))}", "detail": foreign})
                if want("UI-27"):
                    ts = pg.evaluate(TEXT_SPACING_JS)
                    ok = not ts["overflow"] and ts["intersections"] == 0 and ts["svaraCollisions"] == 0
                    self.rec(path, w, theme, "UI-27", {"pass": ok, "measure": f"text-spacing override: scrollWidth {ts['scrollWidth']}, {ts['intersections']} intersections, {ts['mantraLines']} mantra lines, {ts['svaraCollisions']} collisions", "detail": ts})
                    pg.reload(wait_until="load")
                    time.sleep(0.3)
                    pg.evaluate(HELPERS_JS)
                if want("UI-26"):
                    if pg.evaluate("!!document.querySelector('.pothi-step')"):
                        pg.emulate_media(media="print")
                        time.sleep(0.2)
                        self.rec(path, w, theme, "UI-26", pg.evaluate(PRINT_JS))
                        pg.emulate_media(media="screen")
                    else:
                        self.rec(path, w, theme, "UI-26", {"pass": None, "measure": "not a pothi page"})
                if want("UI-33") and theme == "light" and w == widths[0]:
                    self.rec(path, w, theme, "UI-33", pg.evaluate(VOICE_JS))
                if want("UI-25") and theme == "light" and w in (390, 1440):
                    self.rec(path, w, theme, "UI-25", self.focus_walk(pg))
                if want("UI-23") and theme == "light" and w == widths[0]:
                    pg.reload(wait_until="load")
                    time.sleep(0.5)
                    fr = pg.evaluate(FONTS_JS, self.a.base_path)
                    bad = [f for f in fr["after"] if f["status"] != "loaded"]
                    disp_ok = fr["displays"] and all(d == "optional" for d in fr["displays"])
                    pre_ok = len(fr["preloads"]) >= 2 and all(p.startswith(self.a.base_path + "fonts/") or "/fonts/" in p for p in fr["preloads"])
                    local = urllib.parse.urlparse(origin).netloc
                    foreign = sorted(x for x in hosts if x != local)
                    self.rec(path, w, theme, "UI-23", {"pass": not bad and disp_ok and pre_ok and not foreign, "measure": f"{len(fr['after'])} faces loaded ({len(fr['before'])} before forced load); font-display {sorted(set(fr['displays']))}; {len(fr['preloads'])} preloads; cross-origin {foreign or 'none'}", "detail": fr})
                # brief §8/§10: shots at 390 + 1440 in both themes, wider layouts light only, never the 320 sweep width
                if w in self.a.shot_widths and w >= 390 and (theme == "light" or w in (390, 1440)):
                    pg.evaluate("window.scrollTo(0, 0)")  # the UI-25 focus walk leaves the page scrolled to its end (FEAT-108 fix)
                    time.sleep(0.2)
                    self.shot(pg, f"{self.a.prefix}-{label}{langs_label}-{theme}-{w}.png")
                    for i, sel in enumerate(self.a.detail):  # scrolled detail shots (shoot.py pattern), 72 px above the target
                        if pg.evaluate("(s) => !!document.querySelector(s)", sel):
                            pg.evaluate("(s) => { document.querySelector(s).scrollIntoView({block: 'start'}); window.scrollBy(0, -72); }", sel)
                            time.sleep(0.3)
                            self.shot(pg, f"{self.a.prefix}-{label}{langs_label}-detail{i + 1 if len(self.a.detail) > 1 else ''}-{theme}-{w}.png")
                            pg.evaluate("window.scrollTo(0, 0)")
                ctx.close()
        # once per page: first paint (UI-12) and persistence (UI-13)
        if want("UI-12"):
            ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, reduced_motion="reduce")
            pg = ctx.new_page()
            pg.goto(url, wait_until="domcontentloaded")
            fp = pg.evaluate("[getComputedStyle(document.documentElement).backgroundColor, document.documentElement.getAttribute('data-theme')]")
            self.rec(path, 390, "fresh", "UI-12", {"pass": fp[0] == LIGHT_PAPER and fp[1] == "light", "measure": f"domcontentloaded: bg {fp[0]}, data-theme={fp[1]}"})
            ctx.close()
        if want("UI-13"):
            ctx = self.new_context(browser, 390, 844, "dark")
            pg = ctx.new_page()
            pg.goto(url, wait_until="domcontentloaded")
            d1 = pg.evaluate("[getComputedStyle(document.documentElement).backgroundColor, document.documentElement.getAttribute('data-theme')]")
            ctx.close()
            ctx = self.new_context(browser, 390, 844, "system", color_scheme="dark")
            pg = ctx.new_page()
            pg.goto(url, wait_until="load")
            d2 = pg.evaluate("[getComputedStyle(document.documentElement).backgroundColor, document.documentElement.getAttribute('data-theme')]")
            ctx.close()
            self.rec(path, 390, "dark", "UI-13", {"pass": d1 == [DARK_PAPER, "dark"] and d2[0] == DARK_PAPER and d2[1] == "system", "measure": f"pb-theme=dark → {d1}; system + emulated dark → {d2}"})
        if want("UI-14"):
            # no-preference branch: all durations ≤ 250 ms
            ctx = self.new_context(browser, 1440, 900, "light", reduced="no-preference")
            pg = ctx.new_page()
            pg.goto(url, wait_until="load")
            mx = pg.evaluate("() => { let mx = 0; document.querySelectorAll('body *').forEach(el => { const cs = getComputedStyle(el); cs.transitionDuration.split(',').forEach(v => { mx = Math.max(mx, parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000) || 0); }); cs.animationDuration.split(',').forEach(v => { mx = Math.max(mx, parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000) || 0); }); }); return mx; }")
            self.rec(path, 1440, "no-pref", "UI-14b", {"pass": mx <= 250, "measure": f"longest transition/animation {mx:.0f} ms under no-preference"})
            ctx.close()

    def focus_walk(self, pg):
        """UI-25: Tab through the page (≤ 300 stops) until focus returns to the document; each stop must be in the
        viewport and hit-testable at its centre (not under the sticky header or a rail)."""
        pg.evaluate("window.scrollTo(0,0); if (document.activeElement && document.activeElement.blur) document.activeElement.blur()")
        bad, n = [], 0
        for _ in range(300):
            pg.keyboard.press("Tab")
            r = pg.evaluate(FOCUS_STEP_JS)
            if r["end"]:
                break
            n += 1
            if not r["ok"]:
                bad.append(f"{r['tag']} covered by {r['cover'] or 'nothing (off-screen)'}")
        return {"pass": not bad, "measure": f"{n} tab stops, {len(bad)} obscured", "detail": bad[:8]}


def run_sweep(a, browser, origin, pages):
    kind = a.sweep
    width = 320 if kind == "overflow" else 390
    au = Audit(a)
    ctx = au.new_context(browser, width, 900 if kind != "overflow" else 844, "light")
    for p in pages:
        pg = ctx.new_page()
        au.goto(pg, origin + p.lstrip("/"))
        if kind == "pothi":
            if pg.evaluate("!!document.querySelector('.pothi-step')"):
                pg.emulate_media(media="print")
                au.rec(p, width, "light", "UI-26", pg.evaluate(PRINT_JS))
        else:
            res = pg.evaluate(CHECKS_JS, {"width": width, "sourceNames": [], "siteOrigin": a.site_origin})
            if kind == "overflow":
                au.rec(p, width, "light", "UI-30", res["UI-01"])
            else:
                r = res["UI-07"]
                m = r["measure"]
                floor_ok = not any(d.startswith("min font") for d in (r.get("detail") or []))
                au.rec(p, width, "light", "UI-29", {"pass": floor_ok, "measure": m})
        pg.close()
    ctx.close()
    return au


def run_budget(a):
    au = Audit(a)
    dist = a.dist
    pages = dist_pages(dist)
    css_sizes = {}
    for root, _, files in os.walk(os.path.join(dist, "assets")):
        for f in files:
            css_sizes[f] = os.path.getsize(os.path.join(root, f))
    for p in pages:
        f = os.path.join(dist, *(p + "index.html" if p.endswith("/") or p == "" else p).split("/"))
        html = open(f, encoding="utf-8").read()
        size = os.path.getsize(f)
        import re
        for m in re.finditer(r'(?:href|src)="[^"]*?/assets/(?:css|js)/([^"/]+)"', html):
            size += css_sizes.get(m.group(1), 0)
        mods = re.search(r'id="pb-modules">(\[.*?\])<', html)
        if mods:
            for rel in json.loads(mods.group(1)):
                size += css_sizes.get(os.path.basename(rel), 0)
        data = 0
        for m in re.finditer(r'"([^"]+\.json)"', html):
            jp = os.path.join(dist, *m.group(1).replace(a.base_path, "").split("/"))
            if os.path.isfile(jp):
                data += os.path.getsize(jp)
        au.rec(p, 0, "-", "UI-31", {"pass": size <= 150 * 1024 and data <= 300 * 1024, "measure": f"HTML+CSS+JS {size / 1024:.1f} KB (≤ 150), data JSON {data / 1024:.1f} KB (≤ 300)"})
    return au


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dist", default=DEFAULT_DIST)
    ap.add_argument("--origin", default=None, help="audit a live origin (…/panditbano/) instead of serving dist/")
    ap.add_argument("--pages", default="all-types", help='comma list of BASE_PATH-relative paths or "all-types"')
    ap.add_argument("--widths", default="390,1440")
    ap.add_argument("--themes", default="light,dark")
    ap.add_argument("--langs", default="hi")
    ap.add_argument("--checks", default="all")
    ap.add_argument("--shots-dir", default=DEFAULT_SHOTS)
    ap.add_argument("--shot-widths", default=None, help="widths to screenshot (default: the audited widths)")
    ap.add_argument("--detail", default="", help="comma list of CSS selectors; one extra viewport shot scrolled to each (<prefix>-<page>-detail-<theme>-<width>.png)")
    ap.add_argument("--prefix", default="audit")
    ap.add_argument("--out", default=None)
    ap.add_argument("--sweep", choices=["overflow", "font-floor", "pothi"], default=None)
    ap.add_argument("--budget", action="store_true")
    ap.add_argument("--no-shots", action="store_true")
    a = ap.parse_args()

    build = read_build_json(a.dist)
    a.base_path = build.get("basePath", "/panditbano/")
    a.site_origin = build.get("siteOrigin", "https://sudish007.github.io") + a.base_path
    a.source_names = load_source_names(REPO)
    os.makedirs(a.shots_dir, exist_ok=True)
    widths = [int(x) for x in a.widths.split(",") if x]
    themes = [x for x in a.themes.split(",") if x]
    langs = [x for x in a.langs.split(",") if x]
    checks = ALL_CHECKS if a.checks == "all" else [c.strip().upper() for c in a.checks.split(",")]
    a.detail = [s.strip() for s in a.detail.split(",") if s.strip()]
    a.shot_widths = [] if a.no_shots else [int(x) for x in (a.shot_widths or a.widths).split(",") if x]
    out_path = a.out or os.path.join(a.dist, "_reports", f"audit-{a.prefix}.json")

    if a.budget:
        au = run_budget(a)
        write_report(out_path, a, au, build)
        return 1 if au.fails else 0

    if a.origin:
        origin = a.origin if a.origin.endswith("/") else a.origin + "/"
        srv = None
    else:
        origin, srv = serve_dist(a.dist, a.base_path)
    print(f"audit: origin {origin}; prefix {a.prefix}; checks {len(checks)}; widths {widths}; themes {themes}; langs {langs}", flush=True)

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True, args=["--disable-lcd-text"])
        if a.sweep:
            pages = dist_pages(a.dist)
            au = run_sweep(a, browser, origin, pages)
        else:
            au = Audit(a)
            if a.pages == "all-types":
                sample = build.get("samplePages") or {}
                if not sample:
                    sys.exit("audit: build.json has no samplePages — rebuild with FEAT-103's build.mjs")
                items = [(t, href[len(a.base_path):] if href.startswith(a.base_path) else href.lstrip("/")) for t, href in sample.items() if t not in SKIP_TYPES]
            else:
                items = [(None, x.strip().lstrip("/")) for x in a.pages.split(",") if x.strip()]
            for ptype, rel in items:
                variants = []
                seg = rel.split("/")[0]
                if seg in ("hi", "en", "bho"):
                    for l in langs:
                        variants.append((l, l + rel[len(seg):]))
                else:
                    variants.append((None, rel))
                for lang, rel2 in variants:
                    lab = f"-{lang}" if lang and lang != "hi" else ""
                    print(f"\n== {ptype or 'page'} {a.base_path}{rel2}", flush=True)
                    au.audit_page(browser, origin, rel2, widths, themes, checks, lab)
        browser.close()
    if srv:
        srv.shutdown()
    write_report(out_path, a, au, build)
    print(f"\naudit {a.prefix}: {len(au.results)} lines, {au.fails} FAIL, {sum(1 for r in au.results if r['status'] == 'N-A')} N-A, {len(au.shots)} shots → {out_path}")
    return 1 if au.fails else 0


def write_report(out_path, a, au, build):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    report = {"prefix": a.prefix, "when": time.strftime("%Y-%m-%d %H:%M:%S"), "build": build.get("hash"), "origin": a.origin or "local", "sweep": a.sweep, "budget": a.budget,
              "widths": a.widths, "themes": a.themes, "langs": a.langs, "checks": a.checks, "fails": au.fails,
              "summary": {s: sum(1 for r in au.results if r["status"] == s) for s in ("PASS", "FAIL", "N-A")},
              "shots": au.shots, "results": au.results}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    sys.exit(main())
