# Fonts (self-hosted, SIL OFL 1.1)

Built by `tools/fonts.py` (venv Python, fontTools 4.59.2, brotli 1.1.0) from the google/fonts OFL sources; verified by `tools/fonts-check.py`. Design: `design.md` §6 (`.agents` copy) → `docs/design.md`. None of the three families declares a Reserved Font Name, so subsetting is allowed under OFL §1/§2 and the `name` tables are kept whole (`--name-IDs='*'`). Each family's `OFL.txt` is committed verbatim beside its woff2 and ships to `dist/fonts/<family>/`.

## Sources (fetched 2026-11-01 from `https://raw.githubusercontent.com/google/fonts/main/ofl/…`)

| Family | Version (name ID 5) | Source file | URL | Bytes |
|---|---|---|---|---|
| Tiro Devanagari Sanskrit | Version 1.52 | `TiroDevanagariSanskrit-Regular.ttf` | `…/tirodevanagarisanskrit/TiroDevanagariSanskrit-Regular.ttf` | 761,856 |
| Tiro Devanagari Sanskrit | — | `OFL.txt` | `…/tirodevanagarisanskrit/OFL.txt` | 4,387 |
| Noto Sans Devanagari | Version 2.007 | `NotoSansDevanagari[wdth,wght].ttf` (variable) | `…/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf` | 641,944 |
| Noto Sans Devanagari | — | `OFL.txt` | `…/notosansdevanagari/OFL.txt` | 4,386 |
| Noto Sans | Version 2.015 | `NotoSans[wdth,wght].ttf` (variable) | `…/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf` | 2,049,096 |
| Noto Sans | — | `OFL.txt` | `…/notosans/OFL.txt` | 4,396 |

Copyright lines (from the OFL.txt files): Tiro Devanagari Sanskrit — "Copyright 2020 The Indigo Project Authors"; Noto Sans Devanagari and Noto Sans — "Copyright 2022 The Noto Project Authors". The variable originals and the download ledger stay in `%TEMP%\pb-fonts\` and are not committed.

## Build steps

1. Noto statics are cut from the variable files with `fontTools.varLib.instancer.instantiateVariableFont(font, {"wdth": 100, "wght": 400 | 600}, updateFontNames=True)`.
2. Every face is subset to woff2 with `pyftsubset <src> --output-file=<out>.woff2 --flavor=woff2 --unicodes=<ranges> --name-IDs='*' --name-languages='*' --layout-features='*' --notdef-outline --glyph-names --recommended-glyphs --no-hinting` (hinting is dropped: all targets are high-DPI or render through DirectWrite/CoreText/FreeType autohinting; this is why Tiro lands at 138 KB rather than the 213 KB of the unsubset mock file).

`--unicodes` strings (design.md §6.1; design-review NIT 16):

| Face | `--unicodes` |
|---|---|
| Tiro Devanagari Sanskrit | `U+0900-097F,U+1CD0-1CFF,U+A8E0-A8FF,U+200C-200D,U+0964-0965,U+093D,U+0020-007E,U+00A0-00FF,U+0100-017F,U+1E00-1EFF,U+2018-2019,U+02BC,U+0304,U+0323` |
| Noto Sans Devanagari (both weights) | `U+0900-097F,U+1CD0-1CFF,U+A8E0-A8FF,U+200C-200D,U+0964-0965,U+093D,U+0020-007E` |
| Noto Sans (both weights) | `U+0020-007E,U+00A0-00FF,U+0100-017F,U+2000-206F,U+20B9` |

## Shipped files

| File | Bytes | Budget |
|---|---|---|
| `tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2` | 138,140 | ≤ 230 KB |
| `noto-sans-devanagari/NotoSansDevanagari-Regular.woff2` | 53,860 | ≤ 70 KB |
| `noto-sans-devanagari/NotoSansDevanagari-SemiBold.woff2` | 57,312 | ≤ 70 KB |
| `noto-sans/NotoSans-Regular.woff2` | 25,588 | ≤ 40 KB |
| `noto-sans/NotoSans-SemiBold.woff2` | 26,544 | ≤ 40 KB |
| **total woff2** | **301,444 (294.4 KB)** | ≤ 450 KB |
| `noto-sans-devanagari/src/NotoSansDevanagari-SemiBold.ttf` (OG static, unsubset) | 218,928 | — |
| `noto-sans/src/NotoSans-SemiBold.ttf` (OG static, unsubset) | 648,648 | — |

The two `src/*.ttf` statics are the full instances (not subset, not web-served); the OG renderer (sharp, FEAT-109) uses them for title text. `test/unit/fonts.test.mjs` enforces the budgets and the OFL.txt siblings.

## Known gaps

- Tiro Devanagari Sanskrit lacks **U+0953** (grave) and **U+0954** (acute); they fall back to Noto Sans Devanagari in the mantra stack (`"Tiro Devanagari Sanskrit", "Noto Sans Devanagari", serif`); the content gate counts them (decisions.md §5, design §10.9).
- Tiro lacks **ḹ U+1E39**; IAST lines fall back to Noto Sans for that glyph; the build counts ḹ (decisions.md §12 item 12).
- Devanagari Extended **U+A8FE/U+A8FF** are absent from Tiro (irrelevant unless Samavedic digits are adopted).
- The variable-font instancing of Noto Sans (2 MB) takes several minutes per instance on this machine; `tools/fonts.py` caches the instances in `%TEMP%\pb-fonts\` so re-runs are fast.

## `tools/fonts-check.py` output (2026-11-01)

```
fonts/noto-sans-devanagari/NotoSansDevanagari-Regular.woff2  53860 bytes
  name: Noto Sans Devanagari Regular; Version 2.007; glyphs 838
  RFN tripwire (Plex/Merriweather): clean
  U+0951 udatta / svarita                                         present
  U+0952 anudatta                                                 present
  U+0953 grave (Tiro lacks; Noto fallback)                        present
  U+0954 acute (Tiro lacks; Noto fallback)                        present
  U+1CDA double svarita                                           present
  U+1CEA Vedic kashmiri independent svarita                       present
  U+1CED Vedic tone yajurvedic aggravated independent svarita     present
  U+A8F3 candrabindu virama (gum)                                 present
  U+093D avagraha                                                 present
  U+0964 danda                                                    present
  U+0965 double danda                                             present
  U+1E39 IAST l with dot and macron (Tiro lacks)                  absent (expected)
fonts/noto-sans-devanagari/NotoSansDevanagari-SemiBold.woff2  57312 bytes
  name: Noto Sans Devanagari SemiBold; Version 2.007; glyphs 838
  RFN tripwire (Plex/Merriweather): clean
  (same twelve rows as Regular: all present except U+1E39 absent (expected))
fonts/noto-sans/NotoSans-Regular.woff2  25588 bytes
  name: Noto Sans Regular; Version 2.015; glyphs 729
  RFN tripwire (Plex/Merriweather): clean
  U+20B9 present  U+2019 present  U+2014 present  U+00E9 present
fonts/noto-sans/NotoSans-SemiBold.woff2  26544 bytes
  name: Noto Sans SemiBold; Version 2.015; glyphs 729
  RFN tripwire (Plex/Merriweather): clean
  U+20B9 present  U+2019 present  U+2014 present  U+00E9 present
fonts/tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2  138140 bytes
  name: Tiro Devanagari Sanskrit Regular; Version 1.52; glyphs 1594
  RFN tripwire (Plex/Merriweather): clean
  U+0951 udatta / svarita                                         present
  U+0952 anudatta                                                 present
  U+0953 grave (Tiro lacks; Noto fallback)                        absent (expected)
  U+0954 acute (Tiro lacks; Noto fallback)                        absent (expected)
  U+1CDA double svarita                                           present
  U+1CEA Vedic kashmiri independent svarita                       present
  U+1CED Vedic tone yajurvedic aggravated independent svarita     present
  U+A8F3 candrabindu virama (gum)                                 present
  U+093D avagraha                                                 present
  U+0964 danda                                                    present
  U+0965 double danda                                             present
  U+1E39 IAST l with dot and macron (Tiro lacks)                  absent (expected)
RESULT: OK (5 faces)
```

## Rendering proof

`assets/dev/fonts.html` (→ `dist/_dev/fonts.html`) renders the §6.5 test strings in both faces at 17 and 23 px. FEAT-101 shot it at 390 and 1440 in both themes (`.agents/tasks/v1-build/shots/feat101-r1-fonts-*.png`): `document.fonts.check()` true for all three families, no horizontal overflow, conjuncts क्ष त्र ज्ञ द्ध ह्म ङ्क ट्ट form as ligatures in both faces, U+0951/U+0952 and U+1CDA/1CEA/1CED sit clear of the base glyphs at line-height 2.0, ꣳ renders in both faces, U+0953/0954 render through the Noto fallback inside Tiro lines, no tofu. The `fonts.md` note with the audit-tool run is written by FEAT-103.
