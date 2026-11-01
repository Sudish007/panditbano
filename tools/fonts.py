#!/usr/bin/env python
# -*- coding: ascii -*-
"""Build the self-hosted web fonts for Pandit Bano (FEAT-101).

Run with the workspace venv Python (fontTools 4.59.2 + brotli 1.1.0):

    c:\\Users\\sudiskmr\\Downloads\\DomainClassification\\.venv\\Scripts\\python.exe tools\\fonts.py

What it does (idempotent; downloads are cached in %TEMP%\\pb-fonts):
  1. downloads the OFL sources from google/fonts (Tiro Devanagari Sanskrit Regular TTF,
     Noto Sans Devanagari [wdth,wght] variable TTF, Noto Sans [wdth,wght] variable TTF and
     each family's OFL.txt) and records URL + fetch date + bytes in %TEMP%\\pb-fonts\\ledger.json;
  2. instantiates static Noto faces with fontTools.varLib.instancer (wdth=100, wght=400 and 600);
  3. subsets each face with pyftsubset (--flavor=woff2 --name-IDs='*' --layout-features='*')
     using the unicode ranges of design.md 6.1 + design-review NIT 16;
  4. copies OFL.txt verbatim beside each family and keeps two unsubset TTF statics for the
     sharp OG renderer (fonts/<family>/src/*.ttf).
The variable originals stay in %TEMP% and are never committed.
"""
import datetime
import json
import os
import shutil
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(REPO, "fonts")
TMP = os.path.join(os.environ.get("TEMP", os.path.join(REPO, ".tmp")), "pb-fonts")
LEDGER = os.path.join(TMP, "ledger.json")

GF = "https://raw.githubusercontent.com/google/fonts/main/ofl/"

SOURCES = {
    "tiro-devanagari-sanskrit": {
        "dir": "tirodevanagarisanskrit",
        "files": ["TiroDevanagariSanskrit-Regular.ttf", "OFL.txt"],
    },
    "noto-sans-devanagari": {
        "dir": "notosansdevanagari",
        "files": ["NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf", "OFL.txt"],
    },
    "noto-sans": {
        "dir": "notosans",
        "files": ["NotoSans%5Bwdth%2Cwght%5D.ttf", "OFL.txt"],
    },
}

# Unicode ranges (design.md 6.1; design-review NIT 16 for the Tiro IAST block).
DEVA_BASE = "U+0900-097F,U+1CD0-1CFF,U+A8E0-A8FF,U+200C-200D,U+0964-0965,U+093D,U+0020-007E"
TIRO_EXTRA = "U+00A0-00FF,U+0100-017F,U+1E00-1EFF,U+2018-2019,U+02BC,U+0304,U+0323"
UNICODES = {
    "tiro": DEVA_BASE + "," + TIRO_EXTRA,
    "noto-deva": DEVA_BASE,
    "noto-latin": "U+0020-007E,U+00A0-00FF,U+0100-017F,U+2000-206F,U+20B9",
}

# Output faces: (family dir, output woff2 name, source key, instance axes or None, unicodes key)
FACES = [
    ("tiro-devanagari-sanskrit", "TiroDevanagariSanskrit-Regular.woff2", "TiroDevanagariSanskrit-Regular.ttf", None, "tiro"),
    ("noto-sans-devanagari", "NotoSansDevanagari-Regular.woff2", "NotoSansDevanagari[wdth,wght].ttf", {"wdth": 100, "wght": 400}, "noto-deva"),
    ("noto-sans-devanagari", "NotoSansDevanagari-SemiBold.woff2", "NotoSansDevanagari[wdth,wght].ttf", {"wdth": 100, "wght": 600}, "noto-deva"),
    ("noto-sans", "NotoSans-Regular.woff2", "NotoSans[wdth,wght].ttf", {"wdth": 100, "wght": 400}, "noto-latin"),
    ("noto-sans", "NotoSans-SemiBold.woff2", "NotoSans[wdth,wght].ttf", {"wdth": 100, "wght": 600}, "noto-latin"),
]

# Unsubset TTF statics kept for the OG renderer (family dir, static TTF name).
OG_STATICS = [
    ("noto-sans-devanagari", "NotoSansDevanagari-SemiBold.ttf"),
    ("noto-sans", "NotoSans-SemiBold.ttf"),
]


def log(msg):
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def load_ledger():
    if os.path.exists(LEDGER):
        with open(LEDGER, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return []


def save_ledger(entries):
    with open(LEDGER, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, indent=1)


def download_all():
    os.makedirs(TMP, exist_ok=True)
    ledger = load_ledger()
    by_path = dict((e["local"], e) for e in ledger)
    for family, spec in SOURCES.items():
        fam_tmp = os.path.join(TMP, family)
        os.makedirs(fam_tmp, exist_ok=True)
        for enc_name in spec["files"]:
            name = urllib.request.unquote(enc_name)
            local = os.path.join(fam_tmp, name)
            url = GF + spec["dir"] + "/" + enc_name
            if os.path.exists(local) and local in by_path:
                e = by_path[local]
                log("cached   %-60s %8d bytes  fetched %s" % (family + "/" + name, e["bytes"], e["fetched"]))
                continue
            log("download %s" % url)
            req = urllib.request.Request(url, headers={"User-Agent": "panditbano-fonts/1.0"})
            with urllib.request.urlopen(req, timeout=120) as resp, open(local, "wb") as out:
                shutil.copyfileobj(resp, out)
            size = os.path.getsize(local)
            entry = {
                "family": family,
                "file": name,
                "url": url,
                "fetched": datetime.date.today().isoformat(),
                "bytes": size,
                "local": local,
            }
            by_path[local] = entry
            log("fetched  %-60s %8d bytes" % (family + "/" + name, size))
    ledger = sorted(by_path.values(), key=lambda e: (e["family"], e["file"]))
    save_ledger(ledger)
    return ledger


def font_version(path):
    f = TTFont(path, lazy=True)
    try:
        name = f["name"]
        full = name.getDebugName(4) or ""
        ver = name.getDebugName(5) or ""
        return full, ver
    finally:
        f.close()


def instantiate(src_ttf, axes, out_ttf):
    if os.path.exists(out_ttf):
        return out_ttf
    log("instance %s -> %s  %s" % (os.path.basename(src_ttf), os.path.basename(out_ttf), json.dumps(axes)))
    vf = TTFont(src_ttf)
    try:
        static = instancer.instantiateVariableFont(vf, axes, inplace=False, updateFontNames=True)
    except Exception as exc:  # STAT without full names -> keep the original name table
        log("  name update skipped (%s); instancing without renaming" % exc.__class__.__name__)
        vf = TTFont(src_ttf)
        static = instancer.instantiateVariableFont(vf, axes, inplace=False, updateFontNames=False)
    static.save(out_ttf)
    return out_ttf


def subset_woff2(src_ttf, unicodes, out_woff2):
    args = [
        src_ttf,
        "--output-file=" + out_woff2,
        "--flavor=woff2",
        "--unicodes=" + unicodes,
        "--name-IDs=*",
        "--name-languages=*",
        "--layout-features=*",
        "--notdef-outline",
        "--glyph-names",
        "--recommended-glyphs",
        "--no-hinting",
    ]
    subset.main(args)
    return os.path.getsize(out_woff2)


def main():
    ledger = download_all()
    results = []
    for family, out_name, src_name, axes, ukey in FACES:
        fam_tmp = os.path.join(TMP, family)
        src = os.path.join(fam_tmp, src_name)
        if axes:
            stem = out_name.replace(".woff2", ".ttf")
            src = instantiate(src, axes, os.path.join(fam_tmp, stem))
        out_dir = os.path.join(FONTS_DIR, family)
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, out_name)
        size = subset_woff2(src, UNICODES[ukey], out)
        full, ver = font_version(out)
        results.append({"file": "fonts/%s/%s" % (family, out_name), "bytes": size, "name": full, "version": ver, "unicodes": UNICODES[ukey]})
        log("woff2    %-60s %8d bytes  (%s; %s)" % ("fonts/%s/%s" % (family, out_name), size, full, ver))
        # OFL.txt verbatim beside each family
        ofl_src = os.path.join(fam_tmp, "OFL.txt")
        ofl_dst = os.path.join(out_dir, "OFL.txt")
        if not os.path.exists(ofl_dst) or open(ofl_src, "rb").read() != open(ofl_dst, "rb").read():
            shutil.copyfile(ofl_src, ofl_dst)
    for family, static_name in OG_STATICS:
        src = os.path.join(TMP, family, static_name)
        dst_dir = os.path.join(FONTS_DIR, family, "src")
        os.makedirs(dst_dir, exist_ok=True)
        dst = os.path.join(dst_dir, static_name)
        if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src):
            shutil.copyfile(src, dst)
        log("ttf      %-60s %8d bytes  (OG static, unsubset)" % ("fonts/%s/src/%s" % (family, static_name), os.path.getsize(dst)))
    total = sum(r["bytes"] for r in results)
    log("total woff2 %d bytes (%.1f KB)" % (total, total / 1024.0))
    log("ledger %s" % LEDGER)
    for e in ledger:
        log("  %s %s %d %s" % (e["fetched"], e["url"], e["bytes"], e["file"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
