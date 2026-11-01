#!/usr/bin/env python
# -*- coding: ascii -*-
"""Inspect the committed woff2 faces (FEAT-101).

    c:\\Users\\sudiskmr\\Downloads\\DomainClassification\\.venv\\Scripts\\python.exe tools\\fonts-check.py

Prints, per face: file size, family/version from the name table, the RFN tripwire
(fails if any name record contains "Plex" or "Merriweather" -- R4 9.3) and whether
each of the svara / Vedic marks the site relies on has a glyph. Exit code 1 on a
tripwire hit or when a REQUIRED mark is missing from a Devanagari face.
"""
import glob
import os
import sys

from fontTools.ttLib import TTFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(REPO, "fonts")
TRIPWIRE = ("Plex", "Merriweather")

# (codepoint, label, required in Devanagari faces?)
MARKS = [
    (0x0951, "udatta / svarita", True),
    (0x0952, "anudatta", True),
    (0x0953, "grave (Tiro lacks; Noto fallback)", False),
    (0x0954, "acute (Tiro lacks; Noto fallback)", False),
    (0x1CDA, "double svarita", False),
    (0x1CEA, "Vedic kashmiri independent svarita", True),
    (0x1CED, "Vedic tone yajurvedic aggravated independent svarita", True),
    (0xA8F3, "candrabindu virama (gum)", True),
    (0x093D, "avagraha", True),
    (0x0964, "danda", True),
    (0x0965, "double danda", True),
    (0x1E39, "IAST l with dot and macron (Tiro lacks)", False),
]


def check(path):
    rel = os.path.relpath(path, REPO).replace(os.sep, "/")
    f = TTFont(path)
    name = f["name"]
    family = name.getDebugName(4) or name.getDebugName(1) or "?"
    version = name.getDebugName(5) or "?"
    hits = []
    for rec in name.names:
        try:
            txt = rec.toUnicode()
        except Exception:
            continue
        for w in TRIPWIRE:
            if w in txt:
                hits.append("nameID %d: %s" % (rec.nameID, txt))
    cmap = f.getBestCmap()
    deva = "Devanagari" in family or "Tiro" in family
    print("%s  %d bytes" % (rel, os.path.getsize(path)))
    print("  name: %s; %s; glyphs %d" % (family, version, len(f.getGlyphOrder())))
    print("  RFN tripwire (Plex/Merriweather): %s" % ("FAIL " + "; ".join(hits) if hits else "clean"))
    failed = bool(hits)
    if deva:
        for cp, label, required in MARKS:
            present = cp in cmap
            tag = "present" if present else ("MISSING" if required else "absent (expected)")
            if required and not present:
                failed = True
            print("  U+%04X %-56s %s" % (cp, label, tag))
    else:
        for cp in (0x20B9, 0x2019, 0x2014, 0x00E9):
            print("  U+%04X %s" % (cp, "present" if cp in cmap else "absent"))
    f.close()
    return failed


def main():
    files = sorted(glob.glob(os.path.join(FONTS_DIR, "*", "*.woff2")))
    if not files:
        print("no woff2 files under fonts/ -- run tools/fonts.py first")
        return 1
    bad = False
    for p in files:
        bad = check(p) or bad
        print("")
    print("RESULT: %s" % ("FAIL" if bad else "OK (%d faces)" % len(files)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
