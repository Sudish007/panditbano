# Pandit Bano — design (owner copy)

FEAT-110 copies the approved design document here. Until then this file holds only the running list of
implementation deviations, which every build step appends to.

## Deviations and notes

- **FEAT-102 · test scripts use glob patterns.** Node 24's `--test` does not accept a bare directory
  (`node --test test/unit/` fails with "Cannot find module"), so `package.json` uses
  `node --test "test/unit/**/*.test.mjs"` and `"test/integration/**/*.test.mjs"`; `test/run.mjs` passes the same
  patterns and skips a suite whose folder has no `*.test.mjs` yet.
- **FEAT-102 · one theme button, not two.** The mocks rendered a desktop button and a second icon-only button for
  phones. The shell renders one `button[data-theme-toggle]` whose label becomes visually hidden below 820 px (CSS),
  so there is one `aria-live` region and one persisted state. The three icons (`#i-sun`, `#i-moon`, `#i-auto`) are
  toggled with the `hidden` attribute (SVG elements have no `hidden` IDL property).
- **FEAT-102 · footer column headings are `<h2 class="label">`**, not `<h3>` as in the mocks, so a page whose
  main content has only an `<h1>` (offline, index shells) does not skip a heading level (audit UI-20).
- **FEAT-102 · `@font-face` URLs are relative** (`../../fonts/<family>/…` from `assets/css/site.<hash>.css`), which
  resolves to `BASE_PATH/fonts/` for both `BASE_PATH=/panditbano/` and `/` without a build-time rewrite.
- **FEAT-102 · a minimal `/{lang}/manifest.webmanifest` is already written** (name, distinct `short_name`, `lang`,
  relative `start_url`/`scope`, icons, paper colours, no `id`) so the `<link rel="manifest">` of every page resolves;
  FEAT-109 owns the final manifest and `sw.js`.
- **FEAT-102 · `content/forbidden-hi-in-bho.json` is committed now** (copy of the research file) because the
  UI-string unit test needs it in CI; FEAT-104 registers it as a gate input.
- **FEAT-102 · group tiles show no example chips and no counts yet**: both are computed from content
  (design §27.3) and the corpus is empty at this step; the template omits a count line while it is 0 rather than
  printing a literal.
- **FEAT-102 · English brand wordmark wraps to two lines at ≤ 390 px** ("Pandit / Bano") because the header row
  carries the language control and the theme button; no overflow or intersection (audit 0 violations). A later
  polish may shrink the brand on phones.
- **FEAT-103 · dark `--hair-strong` nudged from `#875747` to `#93624F`.** The research hex measured 2.82:1
  against the dark `--surface` (`#231B10`), so every `.btn` border inside a card failed UI-09 (non-text contrast
  ≥ 3.0, WCAG 1.4.11). `#93624F` gives 3.32 on surface and 3.64 on paper; light tokens are unchanged
  (`#98873F` is 3.05 on paper, 3.46 on surface — but only 2.85 on `--accent-tint`, so a bordered control placed on
  a tinted background will fail UI-09; later FEATs must avoid that combination, e.g. `.rail nav .n` inside
  `a[aria-current]`).
- **FEAT-103 · `.head-row` wraps below 820 px.** Under the WCAG 1.4.12 text-spacing override (letter-spacing
  0.12em, word-spacing 0.16em) the English header overflowed by 18 px at 320 (`.head-ctl` beyond the viewport);
  with `flex-wrap: wrap` the controls drop to a second line only when they do not fit. No visible change at the
  normal spacing (the 320 overflow sweep was already clean).
- **FEAT-103 · group grid carries `data-grid="fixed"`.** Design §20 UI-17 fails a grid whose last row is more than
  half empty when it has ≥ 8 items; §27.3 fixes the group grid at 3 columns at 1440, and 10 groups leave one card
  in the last row. §27 wins, so the audit waives the last-row rule for grids marked `data-grid="fixed"` (column
  count dictated by the design) as it does for `data-grid="list"`.
- **FEAT-103 · audit N-A state.** `tools/audit.py` reports a third state besides PASS/FAIL: N-A when a check has
  nothing to measure on that page/width (UI-04/16/17/18 below their widths, UI-26 on non-pothi pages, UI-22 outside
  `_dev/fonts.html`, UI-19 until `content/sources.json#titles` and `content/institutions.json` exist, UI-33 without
  `.verse-tools`). N-A never fails the run; the report counts it separately so a reviewer sees what was not measured.
- **FEAT-103 · UI-32 lives in `tools/lighthouse.mjs`, not in `audit.py`;** the local server for Lighthouse and the
  live-check is started inside the respective script (`--serve`), because PowerShell steps may not leave background
  servers running and the port is not knowable in advance. Local Lighthouse numbers are informational: the local
  server sends no gzip, so `uses-text-compression` fails and performance reads 92 (LCP 3.2 s under mobile
  throttling, render delay 2.7 s — the 34.8 KB render-blocking stylesheet competes with the two preloaded faces,
  192 KB of woff2). The ship step records the live numbers; if performance stays < 95 live, FEAT-110 / the 1b fixer
  must revisit the preload strategy (design §6.2) or inline the token block.
- **FEAT-103 · `_dev/fonts.html` reads `pb-theme`** (one inline line) so the audit can open it dark the same way as
  every other page; the page is still not linked from the site.
- **FEAT-104 · the sample corpus points at the repo registries instead of copying `ui/`.**
  `test/fixtures/content-sample/_fixture.json` holds `{"registries": "../../../content"}`: the loader reads `ui/*.json`,
  `termbank.json`, the forbidden lists, `sources.json`, `institutions.json`, `latin-allow.json` and `shubhvela-ids.json`
  from `content/` and only the records from the fixture, so template FEATs (105–108) never see UI keys that drift from
  the real tables. `content-bad/G*/` fixtures hold `{"base": "../../content-sample"}` plus the one changed file.
- **FEAT-104 · G16 (named sources are links) checks prose fields, not labels.** The rule runs over Markdown bodies and
  the prose keys `overview explanation rules action note a definition intro what does caveat summary lede meaning`;
  `title`, samagri `item`, `role`, pada `gloss` and quiz option texts are exempt because a label cannot carry a link
  (the text record titled "रुद्राष्टाध्यायी" would otherwise fail on its own title). UI-19 in the DOM audit remains the
  second check.
- **FEAT-104 · G18 duplicate ids are per collection.** Mantras, occasions, texts, kathas, lessons and glossary terms each
  have their own id space (an occasion `havan` and a glossary term `havan` may coexist); in lane mode the same id in the
  same collection of another pool is a FAIL.
- **FEAT-104 · the §10.9 U+0953/U+0954 FLAG is rule id `G22`** (design §10.7 numbers G1–G21 and adds this FLAG without a
  number).
- **FEAT-104 · G11 (length ratio) skips English strings under 40 characters** — labels such as "Preliminary rites
  (purvanga)" vs "पूर्वांग" are legitimately short in Devanagari and would otherwise FLAG on every record.
- **FEAT-104 · lane mode (orchestrator addition).** `node build/gate.mjs --dir <path> --lane` resolves references against
  `<dir> ∪ content/ ∪ .agents/tasks/v1-build/staging/<A|B|C>/<item-id>/`, reports unresolved ids as `WARN`, fails
  duplicate ids across pools, and takes the registries from `content/` (a lane's own `sources.json` is merged). See
  `docs/CONTENT-RULES.md` §11.
- **FEAT-104 · Hindi nukta consonants in `hi`/`awa` texts transliterate to plain Roman letters** (ज़→z, फ़→f, क़→q, ख़→kh,
  ग़→g, ड़→ṛ, ढ़→ṛh) so IAST never carries a Devanagari nukta sign; sanscript has no mapping for them. ꣳ/ꣴ and the
  chandrabindu become ṃ; ळ becomes ḻ; ओ३म् becomes oṁ, ॐ stays oṃ.
