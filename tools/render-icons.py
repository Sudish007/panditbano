#!/usr/bin/env python
# -*- coding: ascii -*-
"""Render the PWA icon PNGs from assets/icon.svg (FEAT-101).

    c:\\Users\\sudiskmr\\Downloads\\DomainClassification\\.venv\\Scripts\\python.exe tools\\render-icons.py

Uses the venv Playwright (Edge channel, headless) to rasterise an HTML page that places the
diya mark (assets/icon.svg, currentColor = light accent #A65310) on the light paper #F8ECD4:
  assets/icons/icon-192.png          192 x 192, mark at 72 % of the side
  assets/icons/icon-512.png          512 x 512, mark at 72 % of the side
  assets/icons/icon-maskable-512.png 512 x 512, mark inside the 80 % safe zone (mark at 60 %)
The PNG bytes are never read here; verify dimensions with System.Drawing (brief 10).
"""
import os
import sys

from playwright.sync_api import sync_playwright

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_SVG = os.path.join(REPO, "assets", "icon.svg")
OUT_DIR = os.path.join(REPO, "assets", "icons")
PAPER = "#F8ECD4"
ACCENT = "#A65310"

TARGETS = [
    ("icon-192.png", 192, 0.72),
    ("icon-512.png", 512, 0.72),
    ("icon-maskable-512.png", 512, 0.60),
]


def page_html(svg, side, mark_frac):
    mark = int(round(side * mark_frac))
    inner = svg.replace('width="120" height="100"', 'width="%d" height="%d"' % (mark, int(round(mark * 100 / 120.0))))
    return (
        "<!doctype html><html><head><meta charset='utf-8'><style>"
        "html,body{margin:0;padding:0;background:%s;width:%dpx;height:%dpx;overflow:hidden}"
        "body{display:flex;align-items:center;justify-content:center;color:%s}"
        "svg{display:block}"
        "</style></head><body>%s</body></html>" % (PAPER, side, side, ACCENT, inner)
    )


def main():
    with open(ICON_SVG, "r", encoding="utf-8") as fh:
        svg = fh.read()
    os.makedirs(OUT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True, args=["--disable-lcd-text"])
        for name, side, frac in TARGETS:
            ctx = browser.new_context(viewport={"width": side, "height": side}, device_scale_factor=1)
            page = ctx.new_page()
            page.set_content(page_html(svg, side, frac))
            page.wait_for_timeout(300)
            out = os.path.join(OUT_DIR, name)
            page.screenshot(path=out, full_page=False, omit_background=False)
            ctx.close()
            print("wrote assets/icons/%s (%d x %d, mark %d%%) %d bytes" % (name, side, side, int(frac * 100), os.path.getsize(out)))
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
