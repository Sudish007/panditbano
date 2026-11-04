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

## 2. Ship measurements (live, final commit `6118fcb`, dist hash `52a0edb17e88`, 2026-11-05)

### 2.1 GitHub and deployment

| Check | Real result |
|---|---|
| `gh auth status` | Active account `Sudish007`; token scopes include `repo` and `workflow` |
| Initial repository state | clean `main` |
| Repository create | `Sudish007/panditbano` created public without `--push`; `origin` added |
| Pages enable before first push | `POST repos/Sudish007/panditbano/pages`, `build_type=workflow`, HTTPS enforced |
| First push and tag | `main` pushed; `v1-phase-1a` created and pushed |
| Pages runs | `41889073140`, `41889580925`, and `41889938383` exposed a Linux Pango font-probe assumption; fixes committed as `05bbde4`, `c4a3057`, `6118fcb`. Final run `41890279186` passed: test/build 35 s, deploy 1 min 7 s. |
| Final local suite | `npm test`: 159 / 159 unit and 15 / 15 integration tests; 1 442 pages built; gate 0 FAIL / 329 FLAG / 0 WARN; gzip max 120.3 KB |

The CI-only fixes do not change page content or layout. They make the bundled-TTF Pango probe independent of Linux font-registration order.

### 2.2 Generated corpus and budgets

Computed from `dist/_reports/build.json`:

- **1 442 pages**, 1 724 files
- **20 occasions**, **299 mantra records**, **182 verses**, **68 glossary terms**, **4 lessons**
- 6 chapters, 2 texts, 1 katha and 5 level records
- CSS + JS max **70.9 KB** uncompressed, cap 150 KB, 0 over
- HTML + CSS + JS max **120.3 KB gzip level 6**, cap 150 KB, 0 over
- Uncompressed HTML warning: 97 pages exceed 150 KB; largest is `hi/occasions/vivah/mukhya/` at 665.9 KB HTML. This is the binding non-fatal rule (c), and the same ten heaviest-page table in §1.2 remains current.

### 2.3 Live URL and link check

`tools/live-check.py --origin https://sudish007.github.io/panditbano --dist dist --label ship-1a`:

- **1 473 / 1 473 returned HTTP 200**
- 1 442 generated pages checked
- 31 distinct Shubhvela links checked
- 0 failures

Report: `dist/_reports/live-check-ship-1a.json`.

### 2.4 Live layout, contrast and screenshot audit

`tools/audit.py --origin https://sudish007.github.io/panditbano --pages all-types --widths 390,1440,2560 --themes light,dark --langs hi --shots-dir docs/screenshots/phase-1a --prefix ship-1a-live`:

- 26 generated page-layout samples, covering every Phase 1a page type
- 390 and 1440 in light and dark; 2560 light at device scale factor 0.75
- **4 018 results: 3 047 PASS, 0 FAIL, 971 N-A**
- UI-08/UI-09 text and non-text contrast included on every applicable sample in both themes
- **130 viewport-only screenshots**: 52 at 390×844, 52 at 1440×900, 26 at 1920×810; 0 images above 1 920 px per side
- All 130 shots were reviewed through two dimension-checked contact sheets; no material visual defect was established.

Reports and shots:

- `dist/_reports/audit-ship-1a-live.json`
- `docs/screenshots/phase-1a/ship-1a-live-hi-light-390.png`
- `docs/screenshots/phase-1a/ship-1a-live-hi-light-2560.png`
- `docs/screenshots/phase-1a/ship-1a-live-hi-occasions-aarti-pushpanjali-visarjan-light-1440.png`
- `docs/screenshots/phase-1a/ship-1a-live-hi-texts-satyanarayan-vrat-katha-sanskrit-3-p2-dark-390.png`
- `docs/screenshots/phase-1a/ship-1a-live-hi-occasions-aarti-pushpanjali-visarjan-pothi-light-2560.png`
- The same directory contains all 130 files; the JSON report lists each exact path.

### 2.5 Full-corpus sweeps

The first live-origin sweep attempts reached the 30-minute command limit before completing, so they are not counted as proof. The final sweeps used the local `dist` with the same `52a0edb17e88` build hash deployed live:

| Sweep | Result |
|---|---|
| `audit.py --dist dist --sweep overflow --prefix ship-1a-overflow-final --no-shots` | **1 441 pages, 0 FAIL, 0 N-A** at 320 px |
| `audit.py --dist dist --sweep font-floor --prefix ship-1a-font-floor-final --no-shots` | **1 441 pages, 0 FAIL, 0 N-A** at 390 px |

Reports: `dist/_reports/audit-ship-1a-overflow-final.json` and `dist/_reports/audit-ship-1a-font-floor-final.json`.

### 2.6 Lighthouse live

Lighthouse 12.8.2 mobile preset, Edge, `node tools/lighthouse.mjs --label ship-1a-live …`:

| Live page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/hi/` | **97** | 100 | 100 | 100 | 1.344 s | 1.382 s | 16 ms | 0.099 |
| `/hi/occasions/vivah/mukhya/` | **99** | 100 | 100 | 100 | 1.655 s | 1.690 s | 37 ms | 0 |
| `/hi/texts/satyanarayan-vrat-katha-sanskrit/3/` | **100** | 100 | 100 | 100 | 1.356 s | 1.356 s | 0 ms | 0 |
| `/hi/occasions/vivah/pothi/` | **100** | 100 | 100 | 100 | 1.453 s | 1.453 s | 2 ms | 0 |

Every category met its target. Lighthouse also emitted a zero-weight `label-content-name-mismatch` diagnostic on the pothi route while its accessibility category remained 100; this diagnostic is recorded rather than hidden. Report: `dist/_reports/lighthouse-ship-1a-live.json`.

## 3. NOT VERIFIED

- The actual sound and Vedic accuracy of a real `hi-IN` system voice. The browser branch works, but the UI correctly labels machine speech approximate and says it does not reproduce Vedic svara.
- The Haldi–Chandan paper colour on a cheap physical LCD, including the known possible yellow cast.
- Google indexing and treatment of `/bho/`; Bhojpuri pages intentionally omit unsupported Bhojpuri `hreflang` while remaining crawlable.
- Owner language review: 36 Hindi/Bhojpuri review packs contain 427 open “Unsure about” entries. The 329 content-gate FLAGs remain review items, not failures.
- Owner choices in `docs/OWNER-TODO.md`, including अछत/अच्छत, हरदी/हल्दी, शब्द/सब्द and the `panchang-pujan` glossary sense.
