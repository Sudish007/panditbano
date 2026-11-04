# Verification — Phase 1a

This file is started by the Phase 1a fixer (`FIX-1a`, 2026-11-02) with the local measurements the ship step must
re-run live. The ship step (`SHIP-1a`) appends its own section (live URLs, Lighthouse live, `tools/live-check.py`,
screenshots under `docs/screenshots/phase-1a/`) below.

## 1. Fixer measurements (local, final review-fix build `dd80dcf5c9d3`, 2026-11-04, commits `5f3fff6` … see `git log --grep FIX-1a`)

### 1.1 Tests and gate

| Check | Command | Result |
|---|---|---|
| Unit | `npm run test:unit` | 159 / 159 pass |
| Build | `npm run build` | 1 442 pages, 1 724 files, hash `dd80dcf5c9d3`, exit 0 |
| Integration | `npm run test:integration` | 15 / 15 pass (incl. the new nested-anchor test) |
| Content gate (strict) | `npm run gate` | 0 FAIL · 329 FLAG · 0 WARN (G13 57 · G14 64 · G21 10 · G9 33 · G11 165) |
| Fixture corpus | `node build/gate.mjs --dir test/fixtures/content-sample` · `node build/build.mjs --content … --dist $TEMP\pb\fix1a\dist-sample` · `test:integration` (DIST scoped to a child shell) | gate 0 FAIL / 17 FLAG · 146 pages · 14 / 14 |
| Lane gate | `node --test test/unit/gate.test.mjs` | 6 / 6 (chapter-only staging adopt = WARN; staged copy of an existing chapter = G18 FAIL; cross-pool duplicate = WARN) |

### 1.2 Page budget (brief §16, `build/report.mjs`, `test/integration/budgets.test.mjs`, CI-fatal)

Final review-fix build `dd80dcf5c9d3`:

| Rule | Cap | Measured (max) | Page | Over |
|---|---|---|---|---|
| (a) CSS + JS per page, uncompressed | 150 KB | **70.9 KB** | `hi/occasions/aarti-pushpanjali-visarjan/` | 0 |
| (b) HTML + CSS + JS per page, gzip level 6 | 150 KB | **120.3 KB** | `hi/occasions/vivah/mukhya/` | 0 |
| (c) HTML per page, uncompressed (note only) | 150 KB | 665.9 KB | `hi/occasions/vivah/mukhya/` | 97 pages (not fatal) |

CSS 42.8 KB (8.4 KB gzip) · app.mjs 3.9 KB · fonts 294 KB of 450 · precache 53 URLs 1 707 KB of 2 048 · OG 249 images, 2.7 MB, bundled TTFs matched.

Ten heaviest pages (uncompressed HTML | HTML + CSS + JS uncompressed | gzip):

| Page | HTML | Uncompressed | Gzip |
|---|---|---|---|
| `hi/occasions/vivah/mukhya/` | 665.9 KB | 736.8 KB | 120.3 KB |
| `bho/occasions/vivah/mukhya/` | 659.3 KB | 730.2 KB | 118.6 KB |
| `hi/occasions/vivah/uttarang/` | 519.9 KB | 590.8 KB | 100.3 KB |
| `en/occasions/vivah/mukhya/` | 519.9 KB | 590.8 KB | 111.3 KB |
| `bho/occasions/vivah/uttarang/` | 514.0 KB | 584.9 KB | 98.8 KB |
| `hi/occasions/dikpal-panchang-pujan/dikpala/` | 489.7 KB | 560.6 KB | 93.2 KB |
| `bho/occasions/dikpal-panchang-pujan/dikpala/` | 480.3 KB | 551.2 KB | 90.7 KB |
| `hi/occasions/navagraha-sthapana-pujan/` | 475.2 KB | 546.1 KB | 77.1 KB |
| `bho/occasions/navagraha-sthapana-pujan/` | 468.1 KB | 539.0 KB | 76.3 KB |
| `hi/occasions/vivah/pothi/` | 444.1 KB | 499.9 KB | 96.2 KB |

### 1.3 Lighthouse (brief §16 d) — VERIFIED

`node tools/lighthouse.mjs --label p1a-fix-final3 --serve dist …` — Lighthouse 12.8.2 mobile preset, Edge, build `dd80dcf5c9d3`, local server with gzip level 6.

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| `/hi/occasions/vivah/mukhya/` | **99** | 100 | 100 | 100 | 1.485 s | 1.604 s | 16 ms | 0 |
| `/hi/occasions/navagraha-sthapana-pujan/` | **100** | 100 | 100 | 100 | 1.292 s | 1.502 s | 36 ms | 0 |
| `/hi/texts/satyanarayan-vrat-katha-sanskrit/3/` (40-verse part) | **100** | 100 | 100 | 100 | 1.136 s | 1.294 s | 0 ms | 0 |
| `/hi/occasions/vivah/pothi/` | **99** | 100 | 100 | 100 | 1.420 s | 1.576 s | 0 ms | 0 |

The fix compacts CSS, inlines the complete stylesheet on heavy reading routes, reserves hidden control geometry, and skips below-viewport card layout with `content-visibility:auto`. On a first narrow-screen visit, platform faces paint while the service worker precaches the five bundled fonts; `pb-fonts=1` enables those fonts from cache on later navigations. `audit.py` UI-23 confirms all five faces loaded before forced load after the warm-cache reload, with `font-display: optional`, two local preloads and no cross-origin request.

### 1.4 Browser audit (`tools/audit.py`, Edge headless, dist served locally)

| Run | Scope | Result |
|---|---|---|
| `fix-1a-r2` | all page types, 390 + 1440, light + dark, hi | 2 724 lines · **0 FAIL** · 104 shots |
| `fix-1a-2560` | all page types, 2560 light, hi (dsf 0.75) | 777 lines · 1 FAIL → UI-17 `/hi/mantras/` (2/4 cards measured 49 % with the gap) → audit measures occupied columns → re-run `fix-1a-ui17` 0 FAIL (`/hi/`, `/hi/mantras/`, `/hi/occasions/` at 1440 + 2560) |
| `fix-1a-s390` | `--sweep font-floor`, every page at 390 | 1 441 pages · **0 FAIL** |
| `fix-1a-s320` | `--sweep overflow`, every page at 320 | 1 441 pages · 31 FAIL on build `b3eac39eff83` (long single-word headings — `गणेशसहितगौर्यादिषोडशमातृकाभ्यो`, `sanskritdocuments.org`, `Varunasyottambhanam`; `span.chip` related terms with `nowrap`; slash-joined runs in prose) → `h1–h4 { overflow-wrap: anywhere }`, `span.chip[data-term]` wraps like `a.chip`, `body { overflow-wrap: break-word }` → all 31 pages re-probed at 320 on `9f51f0e5be04`: `scrollWidth` 320 |
| `fix-1a-langs` | `/en/`, `/bho/`, `/en/occasions/vivah/`, `/bho/occasions/vivah/`, `/hi/` at 390 + 1440 light + dark | 1 050 lines · **0 FAIL** · 40 shots |

Shots read (dimension-checked, ≤ 1920 px): home 2560 (texts path card was split in three by a nested `<a>` — fixed,
re-shot clean), occasion part page 2560 (three rails, closed पदच्छेद folds, header band inside the header), mantras index
2560, Level 0 2560 (institutions table in Hindi), quiz fieldsets at 390 before/after (legends inside the frame),
institutions table at 390, mantra page `vs-7-48` at 390 (new `[[term]]` marks render as links in व्याख्या).

### 1.5 Not verified by the fixer (for the ship step / reviewer)

- 57 G13 FLAGs remain: glossary terms used only in label fields (titles, samagri items, quiz text, step heads), 7
  records whose JSON is not `JSON.stringify(…, null, 2)`-formatted (`mantras/satyanarayan-puja/*`,
  `occasions/kathas/satyanarayan-puja.json`, `kathas/satyanarayan-katha/katha.json`) and the label-only `learn/*.json`.
- Open fixer notes not acted on (design questions, not defects): the en glossary index sorts by the English gloss
  ("wedding (vivaha)" under W) because the en display form IS the gloss; term pages have no `#sources` section because
  glossary records carry no `sources[]` (definitions are the site's own words).
- The 320 sweep was not re-run over all 1 441 pages after the CSS fix (the 31 failing pages were re-probed; the rule
  change only adds break opportunities).
