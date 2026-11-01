# -*- coding: utf-8 -*-
"""Pandit Bano — live check (brief §9; design.md §16.1, design-review MEDIUM 1).

GETs every page of dist/ against an origin and every distinct Shubhvela href found in the dist HTML after the same
device-clock upgrade app.mjs applies (data-sv="festival" → festival/<id>/<yyyy>/, data-sv="muhurat" →
muhurat/<id>/<yyyy-mm>/). Concurrency 8, 100 ms pacing between request starts, 20-s timeout. Prints every non-200,
writes dist/_reports/live-check-<label>.json, exits 1 on any failure.

  live-check.py --origin https://sudish007.github.io/panditbano/ --dist dist --label ship-1a     (live)
  live-check.py --serve --dist dist --label local      (serves dist/ on a daemon thread inside this process)
  live-check.py --origin http://127.0.0.1:<port>/panditbano/ --dist dist     (a server you started elsewhere)
"""
import argparse
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audit import dist_pages, read_build_json, serve_dist  # noqa: E402

SHUBHVELA = "https://sudish007.github.io/shubhvela/"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        d = dict(attrs)
        href = d.get("href")
        if href and href.startswith(SHUBHVELA):
            self.links.append((href, d.get("data-sv"), d.get("data-sv-id")))


def upgrade(href, sv, sv_id, now):
    """Mirror app.mjs: festival → current year, muhurat → current yyyy-mm (year-less hrefs only)."""
    if sv == "festival" and sv_id and href.endswith("festivals/"):
        return re.sub(r"festivals/$", f"festival/{sv_id}/{now.tm_year}/", href)
    if sv == "muhurat" and sv_id and href.endswith("muhurat/"):
        return re.sub(r"muhurat/$", f"muhurat/{sv_id}/{now.tm_year}-{now.tm_mon:02d}/", href)
    return href


def shubhvela_hrefs(dist, pages, now):
    out = set()
    for p in pages:
        f = os.path.join(dist, *(p + "index.html" if p.endswith("/") or p == "" else p).split("/"))
        lp = LinkParser()
        with open(f, encoding="utf-8") as fh:
            lp.feed(fh.read())
        for href, sv, sv_id in lp.links:
            out.add(upgrade(href, sv, sv_id, now))
    return sorted(out)


def fetch(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "panditbano-live-check/1.0 (+https://github.com/Sudish007/panditbano)"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            r.read(65536)
            return {"url": url, "status": r.status, "ms": int((time.time() - t0) * 1000)}
    except urllib.error.HTTPError as e:
        return {"url": url, "status": e.code, "ms": int((time.time() - t0) * 1000)}
    except Exception as e:  # timeout, connection refused, DNS
        return {"url": url, "status": 0, "error": str(e)[:120], "ms": int((time.time() - t0) * 1000)}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--origin", default="https://sudish007.github.io/panditbano/")
    ap.add_argument("--dist", default=os.path.join(HERE, "..", "dist"))
    ap.add_argument("--serve", action="store_true", help="serve --dist locally (daemon thread) and check that instead of --origin")
    ap.add_argument("--label", default="live")
    ap.add_argument("--concurrency", type=int, default=8)
    ap.add_argument("--pace", type=float, default=0.1)
    ap.add_argument("--timeout", type=float, default=20.0)
    ap.add_argument("--no-shubhvela", action="store_true")
    a = ap.parse_args()
    dist = os.path.abspath(a.dist)
    build = read_build_json(dist)
    base_path = build.get("basePath", "/panditbano/")
    srv = None
    origin = a.origin if a.origin.endswith("/") else a.origin + "/"
    if a.serve:
        origin, srv = serve_dist(dist, base_path)
    pages = dist_pages(dist) + [""]  # "" = the root redirect index.html
    now = time.localtime()
    page_urls = [origin + p for p in pages]
    sv_urls = [] if a.no_shubhvela else shubhvela_hrefs(dist, [p for p in pages if p], now)
    print(f"live-check {a.label}: origin {origin}; {len(page_urls)} pages + {len(sv_urls)} Shubhvela hrefs; concurrency {a.concurrency}, pace {a.pace * 1000:.0f} ms, timeout {a.timeout:.0f} s", flush=True)

    lock = threading.Lock()
    last = [0.0]

    def paced(url):
        with lock:
            wait = last[0] + a.pace - time.time()
            if wait > 0:
                time.sleep(wait)
            last[0] = time.time()
        return fetch(url, a.timeout)

    with ThreadPoolExecutor(max_workers=a.concurrency) as ex:
        results = list(ex.map(paced, page_urls + sv_urls))
    bad = [r for r in results if r["status"] != 200]
    for r in bad:
        print(f"  {r['status'] or 'ERR'} {r['url']} {r.get('error', '')}")
    report = {"label": a.label, "origin": origin, "when": time.strftime("%Y-%m-%d %H:%M:%S"), "build": build.get("hash"), "pages": len(page_urls), "shubhvela": len(sv_urls),
              "failures": len(bad), "results": results}
    out = os.path.join(dist, "_reports", f"live-check-{a.label}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    ok = len(results) - len(bad)
    print(f"live-check {a.label}: {ok}/{len(results)} returned 200 ({len(page_urls)} pages, {len(sv_urls)} Shubhvela); {len(bad)} failures → {out}")
    if srv:
        srv.shutdown()
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
