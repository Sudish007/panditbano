# Verification — Phase 1a

This file is started by the Phase 1a fixer (`FIX-1a`, 2026-11-02) with the local measurements the ship step must
re-run live. The ship step (`SHIP-1a`) appends its own section (live URLs, Lighthouse live, `tools/live-check.py`,
screenshots under `docs/screenshots/phase-1a/`) below.

## 1. Fixer measurements (local, build `9f51f0e5be04`, 2026-11-02, commits `5f3fff6` … see `git log --grep FIX-1a`)

### 1.1 Tests and gate

| Check | Command | Result |
|---|---|---|
| Unit | `npm run test:unit` | 159 / 159 pass |
| Build | `npm run build` | 1 442 pages, 1 724 files, hash `9f51f0e5be04`, exit 0 |
| Integration | `npm run test:integration` | 15 / 15 pass (incl. the new nested-anchor test) |
| Content gate (strict) | `npm run gate` | 0 FAIL · 329 FLAG · 0 WARN (G13 57 · G14 64 · G21 10 · G9 33 · G11 165) |
| Fixture corpus | `node build/gate.mjs --dir test/fixtures/content-sample` · `node build/build.mjs --content … --dist $TEMP\pb\fix1a\dist-sample` · `test:integration` (DIST scoped to a child shell) | gate 0 FAIL / 17 FLAG · 146 pages · 14 / 14 |
| Lane gate | `node --test test/unit/gate.test.mjs` | 6 / 6 (chapter-only staging adopt = WARN; staged copy of an existing chapter = G18 FAIL; cross-pool duplicate = WARN) |

### 1.2 Page budget (brief §16, `build/report.mjs`, `test/integration/budgets.test.mjs`, CI-fatal)

| Rule | Cap | Measured (max) | Page | Over |
|---|---|---|---|---|
| (a) CSS + JS per page, uncompressed | 150 KB | **82.5 KB** | `hi/occasions/aarti-pushpanjali-visarjan/` | 0 |
| (b) HTML + CSS + JS per page, gzip level 6 | 150 KB | **115.1 KB** | `hi/occasions/vivah/mukhya/` | 0 |
| (c) HTML per page, uncompressed (note only) | 150 KB | 623.0 KB | `hi/occasions/vivah/mukhya/` | 56 pages (not fatal) |

CSS 54.8 KB (12.1 KB gzip) · app.mjs 3.9 KB · fonts 294 KB of 450 · precache 53 URLs 1 457 KB of 2 048 · OG 249 images
2.7 MB, bundled TTFs matched.

Ten heaviest pages (uncompressed HTML | HTML + CSS + JS uncompressed | gzip):

| Page | HTML | Uncompressed | Gzip |
|---|---|---|---|
| `hi/occasions/vivah/mukhya/` | 623.0 KB | 705.5 KB | 115.1 KB |
| `bho/occasions/vivah/mukhya/` | 616.4 KB | 698.9 KB | 113.5 KB |
| `hi/occasions/vivah/uttarang/` | 477.0 KB | 559.5 KB | 95.1 KB |
| `en/occasions/vivah/mukhya/` | 477.0 KB | 559.5 KB | 106.2 KB |
| `bho/occasions/vivah/uttarang/` | 471.1 KB | 553.6 KB | 93.7 KB |
| `hi/occasions/dikpal-panchang-pujan/dikpala/` | 446.8 KB | 529.3 KB | 88.0 KB |
| `bho/occasions/dikpal-panchang-pujan/dikpala/` | 437.4 KB | 519.9 KB | 85.6 KB |
| `hi/occasions/navagraha-sthapana-pujan/` | 432.3 KB | 514.8 KB | 72.0 KB |
| `bho/occasions/navagraha-sthapana-pujan/` | 425.2 KB | 507.7 KB | 71.3 KB |
| `hi/occasions/vivah/pothi/` | 401.2 KB | 468.6 KB | 91.2 KB |

### 1.3 Lighthouse (brief §16 d) — NOT VERIFIED at ≥ 95; next-phase mandatory item (plan.md §5 fallback)

`node tools/lighthouse.mjs --label fix-1a-heavy --serve dist …` — Lighthouse 12.8.2, mobile preset, Edge, dist served
with gzip (as GitHub Pages does). Build `b3eac39eff83` (the shipped CSS differs by two wrapping rules only).

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | DOM |
|---|---|---|---|---|---|---|---|---|
| `/hi/occasions/vivah/mukhya/` | **78** | 100 | 100 | 100 | 2.5 s | 3.3 s | 440 ms | 6 238 |
| `/hi/occasions/navagraha-sthapana-pujan/` | **74** | 100 | 100 | 100 | 2.2 s | 3.0 s | 750 ms | 4 539 |
| `/hi/texts/satyanarayan-vrat-katha-sanskrit/3/` (40-verse part) | **91** | 100 | 100 | 100 | 2.0 s | 3.2 s | 0 ms | 2 054 |
| `/hi/occasions/vivah/pothi/` | **89** | 100 | 100 | 100 | 2.0 s | 3.2 s | 180 ms | 2 890 |

Before the fallback (pada tables open) the same pages read 69 / 89 / 93 / 93 with TBT 880 ms on mukhya; the fold (closed
`<details class="pada-fold">` per step mantra) took TBT to 249–440 ms. The fallback is applied; the target is still
missed, for a reason common to all four pages and to the 22-KB chapter page: LCP render delay ≈ 2.6–2.9 s on a text
element. The two preloaded `font-display: optional` faces (Noto Sans Devanagari 400 54 KB + Tiro Devanagari Sanskrit
400 138 KB) hold first paint until they arrive (≈ 1 s on the 1.6-Mbps profile), then Style & Layout costs 2.1–3.0 s at
4× CPU on the 2.9–6.2 k-element DOMs. Baseline at the wip measurement: `/hi/` 95, `/hi/mantras/vs-36-3/` 94. The lever
(not preloading Tiro, or a smaller Tiro subset) is a design §6.2 / UI-23 decision for the orchestrator, recorded in
`docs/design.md` "Deviations and notes". The ship step re-measures live; local numbers read lower than live (FEAT-103).

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

- Lighthouse ≥ 95 on the four heavy pages (§1.3) — live re-measure; design decision on the Tiro preload pending.
- 57 G13 FLAGs remain: glossary terms used only in label fields (titles, samagri items, quiz text, step heads), 7
  records whose JSON is not `JSON.stringify(…, null, 2)`-formatted (`mantras/satyanarayan-puja/*`,
  `occasions/kathas/satyanarayan-puja.json`, `kathas/satyanarayan-katha/katha.json`) and the label-only `learn/*.json`.
- Open fixer notes not acted on (design questions, not defects): the en glossary index sorts by the English gloss
  ("wedding (vivaha)" under W) because the en display form IS the gloss; term pages have no `#sources` section because
  glossary records carry no `sources[]` (definitions are the site's own words).
- The 320 sweep was not re-run over all 1 441 pages after the CSS fix (the 31 failing pages were re-probed; the rule
  change only adds break opportunities).
