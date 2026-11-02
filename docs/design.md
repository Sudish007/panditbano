# Pandit Bano — design (owner copy)

> Copied by FEAT-110 from `.agents/tasks/v1-build/design.md` (approved 2026-11-01 after the owner picked direction 2
> Haldi–Chandan — `design-pick.md` — and the design review closed with 0 HIGH / 6 MEDIUM / 11 NIT). The source is
> gitignored; this is the copy the owner should read. The section **Deviations and notes** at the end lists every point
> where the build departed from this text and why; every build step appends to it.


Written 2026-11-01 (00:43 IST start) by the design step of workflow `wf_e03e8033d3dec6a3`, after the owner chose mock direction **2 — Haldi–Chandan** (`design-pick.md`, answer "2" received 2026-11-01 00:39 IST; ORCHESTRATOR FINDINGS: none). Inputs, in order of authority: `brief.md` (§1 decisions, §5 design rules, §7 stack, §8 speed directive, §14 copyright decision are binding), `research/decisions.md` (wins over brief §3–§12 where they differ), `research/R3-benchmark.md` (R3), `research/R4-legal.md` (R4), `research/R5-language.md` (R5), `research/inventory.md` (R2, via decisions.md §3), `design-pick.md` and the built mocks under `design-mocks/` (`assets/tokens-d2.css`, `assets/base.css`, `assets/app.js`, `mock_shell.py`). Every design choice below names the research section that backs it; "mocks" means the measured d2 mocks (`design-mocks/audit.json`, 288 entries, 0 hard-UI-rule violations).

This document is the contract for the planner (`plan.md`, `features/FEAT-*.json`) and for every build step. It fixes the stack, the site map and URL scheme, the visual system, the verse renderer, the audio control, the navigation and settings model, the content model and gate, the build pipeline, PWA/offline, search, pothi/print, SEO, accessibility, the hard UI rules as measurable checks, error handling, input validation, invariants, tests and budgets. Where two approaches were viable, one is chosen and the reason is given; the implementer makes no architectural decisions.

---

## 0. The five decisions this document fixes (summary with citations)

| Decision | Fixed as | Research basis |
|---|---|---|
| **Palette** | Haldi–Chandan (decisions.md §6.2 / R3 §8.4), hexes unchanged: light paper `#F8ECD4`, surface `#FFFBF3`, ink `#3A2812`, accent (kesar) `#A65310`, accent-2 (kumkum) `#AA381E`, good (tulsi) `#355E3B`; dark paper `#171209`, ink `#F5ECDC`, accent `#E89A4A`, accent-2 `#E07A5E`. Of the 28 pairs computed in R3 §8.4 (14 per theme), the 26 that carry a WCAG target all pass (ink/paper 12.02 light, 15.90 dark; accent/paper 4.64 / 8.12; white on accent 5.43); the two decorative hairline rows have no target by design. | Anchors from Wikipedia hex infoboxes (Alloy orange `#C46210`, Chinese red `#AA381E`, Hunter green `#355E3B`, Antique white/Vanilla, Sepia — R3 §8.1); derivation by HLS-lightness only (R3 §8.2); "paper, not white" pattern of every calm reader (bhagavadgita.com `#FAF9F5`, IITK `#FFF4D6`, vedabase ≈ `#F3D4A5` — R3 §4 point 9); avoids the 2.1–2.7:1 saturated saffron backgrounds of drikpanchang `#D57E2F`, sanskritdocuments `#FFCC99`, astrosage `#FFD180` (R3 §5 point 7, §8.1 contrast facts); owner's pick (design-pick.md). Risk carried: warmest paper may look yellow-cast on cheap LCDs (R3 §8.4 INFERENCE) — mitigated in §5.6. |
| **Fonts** | Mantra/shloka/IAST: **Tiro Devanagari Sanskrit** 400. Hindi/Bhojpuri body, UI and display headings: **Noto Sans Devanagari** 400/600. English body/UI/headings: **Noto Sans** 400/600 (Latin subset). Self-hosted woff2, `font-display: optional`, two first-paint faces preloaded, `OFL.txt` beside every file. | Tiro Sanskrit is the only candidate with 42/42 Vedic Extensions + U+0951/0952 + 25/26 IAST diacritics in one file, traditional conjuncts, proven renders (R3 §9.2–9.4, shots `r3-r3-font-svara23/34`, `-vedicext`, `-conj17`); Noto Sans Devanagari: 5-line fit at 17 px/358 px, 41/42 Vedic, 32/32 Devanagari Extended, Shubhvela's body face (R3 §9.5, §7); Noto Sans Latin shares metrics with it (cap 12.14 px, x 9.11 px at 17 px — R3 §9.5); licences OFL 1.1, no Reserved Font Names, so subsetting is allowed (R4 §9.3, OFL FAQ 2.6 in R4 §9.2); decisions.md §5 (§12.7). Why it differs from Shubhvela: §16.2. |
| **Verse layout** | One verse = one left-aligned block on a `--surface` panel with a 3-px kumkum rule, fixed internal order Devanagari → IAST → easy-Roman → tools (▶, svara flag, voice note) → word split → per-word meaning → prose meaning → explanation → vinyog → source line; mantra 1.35 × body at line-height 2.0; column ≤ 72ch; danda and verse number joined with NBSP; sub-blocks collapsible with Expand/Collapse all; svara-less `aria-label`. | Shared block order of IITK (Moolam → Padachheda → Shabdārtha), bhagavadgita.com (Devanagari → IAST → audio → word meanings) and vedabase (Devanagari → IAST → Synonyms → Translation) — R3 §3, §4 point 1, decisions.md §11 point 1; sizes IITK 21.6/43.2 and bhagavadgita.com 24/48 both at ratio 2.0, and Tiro's accented line needs 39.71 px of ink at 23 px against a 43.7-px box at 1.9, so 2.0 (R3 §4 point 2, §9.3; decisions.md §5); orphaned `॥ ४७ ॥` on vedabase and `2.47।।` on bhagavadgita.com → NBSP/nowrap (R3 §5 point 8, C17; decisions.md §4 point 7); hover meanings as toggles not tooltips (WCAG 1.4.13, R4 §7.2); svara-less text for assistive tech (R4 §7.3); brief §6.1 record shape. |
| **Audio control** | Inline, verse-scoped ▶ "सुनें / Listen / सुनीं" button in each verse's tools row, toggling to "रोकें / Stop / रोकीं" with `aria-pressed`; browser `speechSynthesis` with the best `hi-IN` voice; speed −/+ stepper 0.5–1.5× and Repeat in the reading-settings card; progress shown from `boundary` events; label "मशीन की आवाज़ (लगभग) — वैदिक स्वर नहीं" always beside the control; honest disabled state when no Hindi voice exists; never autoplays. | Inline verse-scoped players are what the best readers do (bhagavadgita.com pill under the IAST, quran.com per-verse ▶, IITK "Practice chanting") — R3 §4 point 4, decisions.md §11 point 3; autoplaying background music is a measured failure (vedicheritage, R3 §5 point 5); brief §3.10 wording and fallback; WCAG 1.4.2 user-initiated audio, 1.1.1 named controls, 2.5.7 −/+ instead of a drag-only slider (R4 §7.2, §7.1). |
| **Navigation** | Header: wordmark · five sections (सीखें · अवसर · मंत्र और पाठ · कथाएँ · शब्दावली) · search icon · language segmented control · theme button with visible state; sticky only at ≥ 820 px; on phones a second horizontally scrolling nav row starting with Search. Reading pages use a three-rail layout (left: step tracker / chapter list / lesson list; right: samagri checklist + one "reading settings" card holding transliteration, voice speed and repeat), rails collapsed on phones so content comes first. Footer with the same help links in the same order on every page. | Settings live in one place reached from one control (quran.com gear, sefaria "A", bible.com Settings, sacred-texts Reader settings — R3 §4 point 5); clutter before content is the measured failure of the Indian sites (IITK's drawer over the verse on mobile, shlokam's 0 Devanagari words above the fold — R3 §5 point 5); 40–44 px controls met only by quran.com and bhagavadgita.com (R3 §2 control heights); WCAG 2.4.11 focus not obscured by sticky bars, 3.2.6 consistent help, 2.5.8 24-px targets (R4 §7.1); Bhojpuri nav labels and theme labels from the term bank (R5 §10, decisions.md §8); brief §2.1 three paths + glossary; mocks decisions 3–4 (design-pick.md). |

---

## 1. Overview

Pandit Bano is a static, trilingual (hi / en / bho) reference and course site generated at build time from JSON and Markdown content into one HTML file per page per language, served from GitHub Pages under `/panditbano/` (and later an apex domain), with no runtime third-party requests, no accounts, no analytics and no cookies. The reading experience is the product: every Sanskrit mantra is shown identically in all three language variants, in a dedicated Vedic-capable face, with its transliteration, word split, meaning, explanation, ritual use and source line in the current language, and every occasion is a complete procedure (overview, when, roles, samagri, ordered steps with mantras and the pandit's spoken line, variants, FAQs, sources) that can also be rendered as a clean printable pothi and saved offline. The visual system is the owner's chosen Haldi–Chandan direction: warm chandan paper, kesar accent, kumkum second accent, flat geometry, thin-line object motifs (jaali band, diya mark), Noto Sans Devanagari 600 display, square 8-px controls. Layout is fluid to 2560 px: the reading column stays at 72ch and the extra width goes to side rails and card columns, never to line length.

The whole site is plain JavaScript on Node 24: an in-repo generator (`build/build.mjs`) that validates content (the content gate), derives IAST/easy-Roman/counts/search shards, renders templates, and emits a hand-written versioned service worker, per-language manifests, sitemaps, OG images and `robots.txt`. Client behaviour is a handful of vanilla ES modules (theme, language, transliteration, voice, checklist, quiz, rails, search, pothi, PWA). Tests run with `node --test`; browser audits run with the workspace venv Playwright per brief §10.

---

## 2. Technology stack (locked — brief §7; changes only through a WARNING to the owner)

| Layer | Choice | Notes |
|---|---|---|
| Runtime / build | Node **24** (v24.16.0 on the build machine), ESM (`"type": "module"`), plain JavaScript, no framework, no bundler, no transpiler | `build/build.mjs` is the only entry; `npm run build`, `npm run gate`, `npm test` |
| devDependencies (exact-pinned) | `@indic-transliteration/sanscript` 1.3.3 (MIT) — Devanagari → IAST at build (decisions.md §4.2, §A); `minisearch` 7.2.0 (MIT; registry checked 2026-11-01 01:21 IST at https://registry.npmjs.org/minisearch) — client search engine, copied from `node_modules/minisearch/dist/es/index.js` to `dist/assets/js/vendor/`; `@resvg/resvg-js` 2.6.2 (**MPL-2.0**, same check; acceptable for an unmodified build-time tool — the licence binds only modifications to resvg itself, none are made; recorded on the Sources page's "build tools" line) — SVG → PNG for OG images at build (§11.7). sanscript pulls `toml` and `@indic-transliteration/common_maps` (its own dependencies, build-time only) | Nothing else. No test framework (built-in `node:test`), no HTML parser (own regex-based checks, §24), no Markdown library (own subset renderer, §11.3), no schema library (hand-written validators, §10.9) |
| CSS | Vanilla, two files: `assets/css/tokens.css` (every colour, radius, type step, space; the only file allowed to contain colour literals) and `assets/css/site.css` (layout, components, `@media print`) | A test greps for colour literals outside `tokens.css` (§24) |
| Client JS | Vanilla ES modules under `assets/js/`, `<script type="module">`, conditional dynamic imports per page hook; no polyfills; progressive enhancement everywhere (every page is readable with JS off) | Per-page JS ≤ 25 KB uncompressed excluding the lazily loaded search bundle |
| Fonts | Self-hosted woff2: `TiroDevanagariSanskrit-Regular`, `NotoSansDevanagari-Regular/SemiBold`, `NotoSans-Regular/SemiBold` (Latin subset), each with `OFL.txt` | Built once with fontTools (`pyftsubset --flavor=woff2 --name-IDs='*'`) from the google/fonts files and committed; command recorded in `fonts.md` |
| Icons / OG | 192/512/maskable icons rendered once from `assets/icon.svg` with the venv Playwright (`tools/render-icons.py`) and committed; per-page OG PNGs rendered at build with resvg-js from an SVG template using the repo fonts | OG rendering is non-fatal (fallback image per page type, §11.7, §19) |
| PWA | Hand-written `sw.js` (versioned by build hash), `manifest.webmanifest` per language (relative URLs, no `id`) | §13 |
| Hosting / CI | GitHub Pages (Actions source), `.github/workflows/pages.yml` on push to `main` + `workflow_dispatch`: tests → gate → build → `actions/checkout@v7`, `actions/setup-node@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5` | Build fails on any gate FAIL |
| Audit tooling | `tools/audit.py` (venv Playwright, Edge channel, headless, `--disable-lcd-text`, dsf 1; 2560 at dsf 0.75; daemon-thread `socketserver` for `dist/`), modelled on `design-mocks/shoot.py` | Implements the checks of §20; brief §10 rules baked in |
| Lighthouse | Run in ship steps against live URLs with `npx lighthouse@<pinned>` and `CHROME_PATH` = Edge; mobile preset | Targets brief §7: perf ≥ 95, a11y 100, BP 100, SEO 100; real numbers recorded in `docs/verification-phase-N.md` |

Branches, commits and repo hygiene follow brief §7 (`main` for Phase 1; `phase-2`/`phase-3` branches; one commit per FEAT/content item; `.gitignore` covers `node_modules/`, `dist/`, `.agents/`; owner-facing copies in `docs/`).

---

## 3. Site map and URL scheme

### 3.1 URL scheme

Every page exists three times under a language prefix: `/hi/…` (default, first paint for `/`), `/en/…`, `/bho/…`. Section and item slugs are **language-neutral ASCII easy-Roman slugs** (R5 §4.3 S3: term ids are ASCII slugs of the easy-Roman form), identical in all three prefixes. The alternative — localised section slugs such as `/hi/avsar/` vs `/en/occasions/` (the illustrative snippet in R4 §10) — was rejected because one route table, a prefix swap for `hreflang` alternates, one service-worker precache pattern and one search-document URL per id are simpler and less error-prone, and because Shubhvela uses the same scheme (`/${lang}/festivals/`, `/${lang}/vrat/${slug}/` — read from `shubhvela/web/src/templates/*.mjs` on 2026-11-01), so the two owner sites behave alike.

All generated URLs are root-relative and prefixed by one build variable `BASE_PATH` (default `/panditbano/`; `BASE_PATH=/` for the future apex domain) through a single `href(path)` helper; absolute URLs (canonical, `hreflang`, sitemap, OG) use `SITE_ORIGIN` (default `https://sudish007.github.io`). The HTML carries `<html data-base="/panditbano/">` so client modules resolve the service worker, search shards and offline page without hard-coding. No `CNAME` file is written (brief §1). Trailing slashes everywhere (`…/vivah/` → `vivah/index.html`), which GitHub Pages serves without redirects.

### 3.2 Route table

| Route (under `/{lang}`) | Page type / template | Phase | Notes |
|---|---|---|---|
| `/` (site root, no prefix) | `root-redirect` | 1 | `index.html` with `<meta http-equiv="refresh" content="0; url=hi/">`, canonical `/hi/`, and a 6-line script that redirects to the persisted `pb-lang` if valid (`hi`/`en`/`bho`) else `hi/`. The only page without a language prefix besides `404.html`, `sw.js`, `robots.txt`, `sitemap.xml`. |
| `/{lang}/` | `home` | 1 | §4.2 |
| `/{lang}/learn/` | `learn-index` | 1 | Levels 0–4 with lesson lists, per-lesson progress badge (client, localStorage) |
| `/{lang}/learn/level-{0..4}/` | `learn-level` | 1 (0–2), 3 (3–4) | Level intro + lesson cards; Level 0 includes the formal-routes table (decisions.md §10) |
| `/{lang}/learn/{lessonId}/` | `lesson` | 1 (levels 0–2), 3 (3–4) | Lesson prose + quiz; left rail = the level's lesson list; §4.7 |
| `/{lang}/occasions/` | `occasions-index` | 1 | Ten groups in order: foundations · daily · birth · marriage · home · death · kathas · vrats · festivals · shanti; computed counts |
| `/{lang}/occasions/{slug}/` | `occasion` | 1–3 per decisions.md §3 | §4.3; multi-part occasions add `/{slug}/{part}/` (part slug from the record), the base route then being the overview with the parts list |
| `/{lang}/occasions/{slug}/pothi/` | `pothi` | 1 | No chrome; all steps of all parts; §15 |
| `/{lang}/mantras/` | `mantras-index` | 1 | Ritual-mantra corpus grouped by source kind (Vedic by VS adhyaya · Puranic · paddhati · folk), counts computed |
| `/{lang}/mantras/{mantraId}/` | `mantra` | 1 | Single mantra view (the Gayatri mock): verse block, word split, meaning, explanation, vinyog list, variants, source |
| `/{lang}/texts/` | `texts-index` | 1 | Long texts with computed chapter and verse counts; unpublished chapters are not counted |
| `/{lang}/texts/{textSlug}/` | `text` | 1 | Intro, attribution, chapter list, link to the paath vidhi occasion |
| `/{lang}/texts/{textSlug}/{n}/` and `/{textSlug}/{n}/p{k}/` | `chapter` | 1 (Rudrashtadhyayi, Satyanarayan Sanskrit, Purusha/Shri Sukta, Navagraha stotra), 2 (rest) | Chapter view, paginated into parts of ≤ 40 verses (§7.8); verse anchors `#v{n}` |
| `/{lang}/kathas/` | `kathas-index` | 1 | |
| `/{lang}/kathas/{slug}/` | `katha` | 1 (Satyanarayan), 2 (rest) | Intro + source caveat + adhyaya nav + vidhi (occasion component) |
| `/{lang}/kathas/{slug}/{n}/` | `katha-adhyaya` | 1 / 2 | Own-words retelling with the Sanskrit verses in collapsible "मूल श्लोक" panels where an original exists |
| `/{lang}/glossary/` and `/{lang}/glossary/{termId}/` | `glossary-index`, `term` | 1 (≥ 150 defined terms), 2 (≥ 300) | Only terms with a definition in all three languages get a page; index letter groups |
| `/{lang}/reference/` + `panchang-basics/`, `muhurat-rules/`, `gotra-pravara/`, `dhyana-shlokas/`, `sutak-patak/`, `sankalpa/`, `verification/`, `bibliography/` | `reference`, `reference-page` | 1 (sankalpa, verification, bibliography, muhurat-rules), 2 (rest) | `verification/` is the "how this site was verified" page and states the Bhojpuri `hreflang` omission (R4 §10) |
| `/{lang}/search/` | `search` | 3 (page shell in 1 so the header icon has a target; engine in 3) | §14 |
| `/{lang}/about/`, `/{lang}/sources/`, `/{lang}/privacy/` | `static` | 1 | Sources = source registry with licence lines + fonts block; Privacy = R4 §6.3 text; Corrections = footer link to GitHub Issues (`…/issues/new?template=correction.yml&title=…&body=<page URL>`), no page |
| `/{lang}/offline/` | `offline` | 1 | Service-worker navigation fallback, precached |
| `/404.html` | `not-found` | 1 | Trilingual (three blocks with their own `lang`), language links, search link, **no sacred motif** (R4 §8.2 rule 4) |
| `/{lang}/manifest.webmanifest`, `/sw.js`, `/robots.txt`, `/sitemap.xml`, `/assets/**`, `/fonts/**`, `/og/**`, `/search/{lang}/*.json` | files | 1 (search shards 3) | §11, §13, §14 |
| `/_dev/fonts.html` | dev only | 1 | Devanagari rendering test page (§6.5); excluded from sitemap, `robots.txt` `Disallow: /_dev/`, not precached |

Page counts are computed at build and written to `dist/_reports/build.json`; the planner's sizing numbers come from decisions.md §3.5 (193 occasion/module pages, ≈ 900 mantra records, ≈ 2,600 verse records, 629 terms).

### 3.3 Section ids and group ids

Nav sections: `learn`, `occasions`, `texts` (covers `/mantras/` and `/texts/`), `kathas`, `glossary`; `reference` is reachable from the footer "Sections" list, the Learn index and every occasion's "when" block. Occasion groups and their ids: `foundations` (F01–F17, the ritual grammar — rendered as occasion records so they get steps, mantras and pothi, and linked from Learn Level 2), `daily` (D01–D10), `birth` (B01–B16), `marriage` (M00–M28), `home` (H01–H09), `death` (A01–A16), `kathas` (K01–K40, each katha's vidhi is an occasion record and the katha page embeds it), `vrats` and `festivals` (V01–V59 split by the record's `group`), `shanti` (S01–S16). Group labels in three languages come from `content/ui/{lang}.json`; the Bhojpuri "Occasions" label is अवसर with subtitle घर के पूजा-पाठ (R5 §7 question 25 fallback).

---

## 4. Page anatomy

### 4.1 Shell (every page except pothi, 404, offline-fallback)

Header (`.site-head`, as in `mock_shell.py#header`): brand (diya mark 30 px in `--accent` + wordmark पंडित बनो / Pandit Bano / पंडित बनीं at 1.35 × body, Noto Sans Devanagari 600 / Noto Sans 600), five nav links (40 px tall, `aria-current="page"` on the active section, filled `--accent-tint`), search icon button (44 px, `aria-label`), language segmented control (three links हिं / EN / भो on phones, हिंदी / English / भोजपुरी at ≥ 1024, each `lang` + `hreflang`, the current one `aria-current="true"` filled `--accent` with `--accent-ink` text), theme button (icon + label "थीम: हल्की" at ≥ 820, icon-only with sr label on phones). The header is `position: sticky` only at ≥ 820 px; on phones it is static and a second row (`.head-mobile-nav`) scrolls horizontally with Search first, then the five sections. Under the header sits the 18-px jaali band (`--hair-strong`, `aria-hidden`). `html { scroll-padding-top: calc(var(--head-h) + 24px) }` keeps focused and anchored elements out from under the sticky bar (WCAG 2.4.11, R4 §7.1).

Main (`<main id="main">`) always begins with a visually hidden "skip to content" link target; a breadcrumb trail (`.crumbs`) lists ancestors only — the current page's name appears once, in the `<h1>` (brief §5.1 "each fact shown once"). Page head: `<h1>`, a `.meta` row (group · tradition layer summary · phase of content review where relevant), a `.lede`, and the `.actions` row (Pothi, Print, Save offline where applicable). Every content page type (occasion, mantra, chapter, katha, lesson, glossary term, reference) ends with a `#sources` section listing the records' sources with their attribution lines (brief §1 "every page lists its sources"); index and static pages link the Sources page instead.

Footer (`.site-foot`): four columns at ≥ 1440 (brand + tagline; Sections; More = About · Sources · Corrections (GitHub) · Privacy · "तिथि और मुहूर्त शुभवेला पर" external link; Licences block "पाठ CC BY-SA 4.0 · कोड MIT · मंत्र-पाठ पब्लिक डोमेन · फ़ॉन्ट … SIL OFL 1.1"), three columns at 820–1439, one on phones; then the one-line note: Hindi pages "इस पृष्ठ की सामग्री साइट के लेखकों ने नीचे दिए स्रोतों से लिखी है…", English and Bhojpuri pages the translation-awaiting-review sentence (brief §6.5; strings in `content/ui`). The help links (About, Corrections) keep the same relative order on every page (WCAG 3.2.6, R4 §7.1). No sacred motif in the footer strip (decisions.md §6.4, R4 §8.2 rule 4).

### 4.2 Home

Hero (`.hero`): left column h1 (site name at 1.1 × h1), tagline (R5 §7 question 27 fallback "हर अवसर के मंत्र, विधि और कथा"), lede (what the site is, one sentence per audience), two actions ("सीखना शुरू करें" primary, "अवसर देखें" secondary); right column a `--surface` panel with a hairline border holding the diya motif (`#m-diya`, thin line, `--accent`), 240 px at 1024, 280 px at 1920. Grid 1.25fr/0.75fr at 1024, 1.1fr/0.9fr at ≥ 1920 so neither half is empty (brief §5.1; audit UI-16). Then: three path cards (Learn · Occasions · Texts, each with an icon, one line, and a computed count), the ten occasion groups as tiles (icon + name + computed count, 2 columns at 390, 3 at 820, 5 at 1440, 5 at 1920), the "आज की तिथि और मुहूर्त" panel linking Shubhvela (panchang, festivals, muhurat — §16.1) with the line "इस साइट पर तिथि की गणना नहीं होती", a "यह साइट कैसे लिखी गई" card (links to Sources and Verification), a "पहले यहाँ से" list (Satyanarayan katha, Vivah, Diwali Lakshmi puja, Gayatri, Level 0), and a client-rendered "ऑफ़लाइन सहेजे गए" list (hidden when empty).

### 4.3 Occasion page (the Vivah mock)

Layout `.layout.has-both`: left rail (`<aside class="rail rail-left">`, 260 px at 1440, 300 px at ≥ 1920, sticky) holds the **step tracker** — a `<details class="rail-fold">` whose summary is the occasion name's section list and whose body is an ordered list of parts → steps (28-px numbered discs; `aria-current` on the step in view via `IntersectionObserver`, no scroll hijack); at 1024–1439 the left rail folds above the content; on phones both rails are collapsed `<details>` so the content comes first (mocks decision 3). Right rail (320 px at 1024, 340 at 1440, 400 at ≥ 1920, sticky) holds the **samagri checklist** card (real checkboxes 24 px, 44-px rows, quantity column, ticked rows struck through with a `--good` SVG check; "केवल इसी ब्राउज़र में सहेजा गया" label; Print and Clear buttons — Clear has no motif near it) and the **reading settings** card (transliteration radiogroup IAST / सरल रोमन / बंद; voice speed stepper; Repeat toggle; link to Pothi).

Content order (section ids are stable for anchors and the `.sections` scroller): `#intro` (overview prose ≤ 72ch), `#when` card (muhurat rules text + Shubhvela links + "tradition holds" phrasing), `#roles` card (definition list role → does), `#vidhi` (steps), `#variants` (regional variant cards, each quoting PGS I.8.11–13 once per page in a `.sutra` block — decisions.md §1 point 3), `#faq` (`<details class="faq">`), `#sources` (ordered list with attribution lines, every title a link). Each step is a `.step` card: `.step-head` with the filled `--accent` number chip, `<h3>` action title, layer chip (वैदिक outline `--accent` · पद्धति outline `--accent-2` · लोकाचार outline `--hair-strong` — decisions.md §1 point 2, mocks decision 7), then the action prose, the verse block(s) (§7), the "पंडित जी कहते हैं" callout (`.says`, 3-px `--accent` left rule) and an optional note. At ≥ 1920 a step with a verse becomes two columns (`.step.two`: action left, verse right).

Multi-part occasions: the base route renders overview, when, roles, samagri, variants, FAQ, sources and a parts list (cards with step counts); each part route renders its steps with the same rails; `rel="prev"/"next"` between parts; the pothi route renders every step of every part.

### 4.4 Mantra view (the Gayatri mock)

`.layout.has-both`: left rail = the mantra's corpus group list (same VS adhyaya / same module); content = the verse block, `#pada` card (word split as a two-column `<dl>`: Sanskrit term in Tiro at 1.15 × body / gloss), `#arth` prose (meaning, explanation), `#vinyog` card (list of occasion → step links, computed from the occasions' `mantraIds`), variants, source line; right rail = reading settings + "इसी पाठ में" neighbours. At ≥ 1920 the verse block and its source sit beside the word-split card (`.verse-row`, mocks decision 2).

### 4.5 Long-text chapter view

Left rail = chapter list of the text with the current chapter marked and a verse navigator (numbers, 28-px targets, `aria-current`); content = chapter intro, chapter tools row (Expand all / Collapse all meanings, transliteration shortcut, part pager), the verse list (`.verse-item` per verse: verse block + `<details class="meaning">` with the prose meaning and optional word split), pager; right rail = reading settings + source/attribution card. At ≥ 1920 each `.verse-item` becomes two columns (verse left, meaning right).

### 4.6 Katha pages

Katha landing: intro, the attribution caveat `.caveat` ("traditionally attributed to the Skanda Purana, Reva Khanda … scholars date it late" — decisions.md §2.3), adhyaya nav (`.katha-nav`, 40-px chips), the vidhi rendered with the occasion components (samagri rail, steps), sources. Adhyaya page: retelling paragraphs (`.prose.dropcap`), each paragraph group followed by a `<details>` "मूल श्लोक" containing the Sanskrit verse blocks where an original exists; left rail = adhyaya list; right rail = reading settings.

### 4.7 Learn pages

Level page: level intro + lesson cards (title, one line, estimated minutes computed from word count, progress badge). Lesson page: left rail = the level's lesson list with done ticks (from `pb-quiz:<lessonId>`), content = prose sections (Level 1 lessons embed the svara-marks table `.marks` at 1.5 × body, line-height 1.9, and ▶ per row), the quiz (`.quiz`: `<fieldset>` per question, radio `.opt` rows 44 px, "जाँचें" button, per-option feedback text + border colour, result line "{right}/{total}", "केवल इसी ब्राउज़र में सहेजा गया"), related occasions/mantras; right rail = reading settings + the lesson's glossary terms. Level 3 playbook lessons add a "पंडित की चेकलिस्ट" card (print button → the occasion's pothi).

### 4.8 Index pages, glossary, reference, search, static

Index pages use `.grid` cards (1 column at 390 for cards with body text, 2 for compact tiles; 2–3 at 820; 3 at 1024; 4 at 1440; 4–6 at ≥ 1920 — UI-17). Glossary index groups by Devanagari letter (hi/bho) or A–Z (en) with a 44-px letter bar; term page shows the three forms, alternates/folk forms (first-use bracket rule from R5 §4.2 B7), definition, related occasions. Reference pages are prose + tables (`.marks`-style tables, horizontal scroll allowed for data tables only — WCAG 1.4.10). Search: §14. Static pages: prose.

---

## 5. Visual system

### 5.1 Tokens (`assets/css/tokens.css` — the only file with colour literals)

Carried verbatim from `design-mocks/assets/tokens-d2.css` (hexes = decisions.md §6.2 = R3 §8.4), plus the print re-mapping and the `--on-haldi` label colour:

```css
:root, :root[data-theme="light"] {
  --paper:#F8ECD4; --surface:#FFFBF3; --ink:#3A2812; --ink-2:#75603F;
  --accent:#A65310; --accent-ink:#FFFFFF; --accent-tint:#FBE3B6; --accent-2:#AA381E;
  --haldi:#F4C430; --on-haldi:#3A2812; --good:#355E3B; --hair:#DDCCA2; --hair-strong:#98873F;
  --focus:#C46210; --shadow:0 10px 30px rgba(58,40,18,0.18); color-scheme:light; }
:root[data-theme="dark"] {
  --paper:#171209; --surface:#231B10; --ink:#F5ECDC; --ink-2:#C0B097;
  --accent:#E89A4A; --accent-ink:#171209; --accent-tint:#3E2E14; --accent-2:#E07A5E;
  --haldi:#F4C430; --on-haldi:#171209; --good:#8FBF7F; --hair:#3D3222; --hair-strong:#875747;
  --focus:#E89A4A; --shadow:0 10px 30px rgba(0,0,0,0.55); color-scheme:dark; }
@media (prefers-color-scheme: dark) { :root[data-theme="system"] { /* the same fourteen dark values, repeated verbatim (no preprocessor) */ } }
@media print { :root { --paper:#FFFFFF; --surface:#FFFFFF; --ink:#000000; --ink-2:#333333; --hair:#BBBBBB; --hair-strong:#777777; } }
```

The `system` block repeats the dark values rather than using a shared selector because `:root[data-theme="system"]` must only turn dark inside the media query, and a test asserts the two blocks are identical (§24).

Role of each token: `--paper` page background; `--surface` reading panels (verse, cards, steps, rails); `--ink` body and mantra text; `--ink-2` secondary text (meta, IAST, labels); `--accent` links, primary buttons, step chips, verse numbers, "pandit says" rule, Vedic layer chip; `--accent-2` the verse block's left rule and the paddhati chip; `--accent-tint` selected nav/aria-pressed backgrounds and chip text backgrounds; `--haldi` a fill only (callout "important step" background, samagri "must-have" marker) with `--on-haldi` text, never as text itself (R3 §8.1: `#F4C430` = 1.64:1); `--good` ticks, svara-on dot, correct-answer border; `--hair` decorative rules and card borders; `--hair-strong` control borders and the jaali band (≥ 3.05:1 non-text); `--focus` the 3-px focus ring; `--shadow` only on `.floating` (toasts, sheets, menus — brief §1). The contrast table for every pair that carries a WCAG target is R3 §8.4 (light: 13 targeted pairs pass; dark: 13 pass); pairs against `--surface` are lighter/darker than against `--paper` and therefore pass with margin — the audit (UI-08) recomputes all of them from rendered pixels rather than trusting the table.

Typography tokens (from `base.css`): `--fs-body: clamp(17px, 16.1px + 0.2304vw, 22px)` (17.0 at 320–390, 19.4 at 1440, 20.5 at 1920, 22.0 at 2560), `--fs-mantra: calc(var(--fs-body) * 1.35)`, `--fs-pothi: calc(var(--fs-body) * 1.5)`, `--fs-small: max(12px, calc(var(--fs-body) * .8))` (13.6 px at 17), `--fs-meta: max(12px, calc(var(--fs-body) * .88))`, `--lh-body: 1.65`, `--lh-mantra: 2`, `--h1: 1.9×`, `--h2: 1.4×`, `--h3: 1.15×`, `--display-weight: 600`, `--font-body`, `--font-latin`, `--font-mantra`, `--font-display` stacks as in tokens-d2.css. Spacing: `--gutter: clamp(16px, 3.5vw, 96px)`, `--gap: clamp(16px, 2vw, 32px)`, card padding `clamp(16px, 1.6vw, 28px)`, `--control-h: 44px`, `--measure: 72ch`, `--head-h: 64px`. Radii `--radius: 8px`, `--radius-s: 6px`, `--radius-ctl: 8px` (square controls, not pills — direction 2).

Why these numbers: body 17 → 22 px and ≤ 75–80ch sit inside Butterick's 15–25 px / 45–90 characters and Apple's 17-pt default (R3 §4 point 8, S29/S30) and match Sefaria 22/35.2 in 700 px and Standard Ebooks 18/27 in 608 px (R3 §4 point 8); 1.65 body leading is Shubhvela's hi/bho value (R3 §7); 44-px controls are the brief's floor, met in the field only by quran.com and bhagavadgita.com (R3 §2); the 12-px floor exists because the Indian sites measured 7.8–11.5 px labels (R3 §5 point 2).

### 5.2 Motifs and iconography

Thin-line SVG, one colour (`currentColor`), objects and geometry only: jaali lattice band under the header (18 px, `--hair-strong`), diya as brand mark and hero motif, and the icon set from `mock_shell.py#SPRITE` (search, sun, moon, play, print, download, check, book, list, copy, cap, fire, home, sun2, child, rings, pind, moon-star, flag, om-in-text) plus a new `#i-ext` external-link arrow. The lotus, bell, shankh and kalash symbols stay in the sprite for group tiles and diagrams. **No deity figures of any kind** (not even line-drawn), no raster clipart, no photographs of people or murtis (brief §1; R4 §8.2 rule 1–2; decisions.md §6.4). The swastika appears only inside a captioned ritual diagram (kalash sthapana), never as ornament, bullet, favicon or loader (R4 §8.2). No sacred motif (ॐ, swastika, mantra text) in the footer strip, on 404/offline pages, inside destructive controls (Clear ticks, Remove saved) or under "wrong answer" feedback (R4 §8.2 rule 4). Decorative SVGs are `aria-hidden="true" focusable="false"`; icon-only controls have `aria-label`. The external-link marker is an inline SVG with an sr-only "बाहरी कड़ी" span rather than a `::after` text glyph, so it never depends on a font having ↗ (the mocks used `content: " ↗"`; this changes it).

### 5.3 Components and their visible states

Every stateful control shows its state in both themes through an accessible attribute **and** a visual change (brief §5.1): language `.seg a[aria-current]` filled `--accent`/`--accent-ink`; theme `button[data-theme-toggle]` label text "थीम: हल्की / गहरी / सिस्टम" (hi), "थीम: हलुक / गहिर / सिस्टम" (bho), "Theme: Light / Dark / System" (en) + sun/moon icon + `aria-live="polite"`; transliteration `role="radiogroup"` buttons `aria-checked` filled; voice `aria-pressed` + label Listen/Stop + progress bar; Repeat `aria-pressed` + tint; checklist `input:checked` + strike-through + `--good` check; rail folds `+`/`−`; quiz options `.correct`/`.wrong` border + feedback text (never colour alone); Save offline `aria-pressed` + label "सहेजा गया"; Expand/Collapse all `aria-expanded` on the button. Buttons wrap their labels (`white-space: normal`) so long Bhojpuri/English labels never overflow 320 px (mocks decision 5). Focus: `:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px }` (≥ 3:1 on paper in both themes — R3 §8.4 focus rows 3.52 / 8.12).

### 5.4 Dark theme

Designed, not inverted (R3 §8.2): the accent becomes the light colour (`#E89A4A`), the paper colour becomes the button label, mantra text is `--ink #F5ECDC` on `--paper #171209` — warm, never white-on-black "burnt" (decisions.md §6.4; R4 §8.2 rule 5). `color-scheme: dark` makes form controls and scrollbars match. `<meta name="theme-color">` is emitted twice with `media="(prefers-color-scheme: light|dark)"` using `--paper` of each theme.

### 5.5 Motion

Transitions only inside `@media (prefers-reduced-motion: no-preference)` and only on background/border/colour, 150 ms (≤ 250 ms rule); no scroll animations; `scroll-behavior: auto`; the toast appears without animation. `<details>` toggles are instant.

### 5.6 The yellow-cast risk and its mitigation

R3 §8.4 flags Haldi–Chandan's paper as the warmest of the three and a possible yellow cast on cheap LCDs (INFERENCE). Mitigation fixed here: all long reading happens on `--surface #FFFBF3` (verse panels, step cards, chapter verse items, katha prose cards, rails), `--paper` is only the page field around them; the dark theme is one tap away; nothing else is added now (a "paper tone" setting would be a Phase 3 owner request, not a design default).

---

## 6. Typography and fonts

### 6.1 Faces, roles, files

| Role | Face / weight | File (woff2, `fonts/<family>/`) | Why |
|---|---|---|---|
| Mantra, shloka, verse, IAST and easy-Roman lines, Sanskrit terms in word splits, dhyana shlokas, pothi text | Tiro Devanagari Sanskrit 400 | `TiroDevanagariSanskrit-Regular.woff2` (213 KB in the mocks; production subset keeps U+0900–097F, U+1CD0–1CFF, U+A8E0–A8FF, U+200C/200D, U+0964/0965, U+093D, Devanagari digits, the IAST Latin block, basic Latin punctuation) | 42/42 Vedic Extensions, U+0951/0952, 25/26 IAST, traditional conjuncts, same vertical metrics (755/−245) as Shubhvela's Tiro Hindi (R3 §9.2, §9.4) |
| Hindi/Bhojpuri body, UI, display headings (600) | Noto Sans Devanagari 400 / 600 (static instances cut from the variable file) | `NotoSansDevanagari-Regular.woff2`, `-SemiBold.woff2` (61 / 65 KB) | 5-line fit at 17 px, 41/42 Vedic, 32/32 Devanagari Extended, Shubhvela's body face (R3 §9.5) |
| English body, UI, headings (600), Latin digits/punctuation inside hi/bho | Noto Sans 400 / 600, Latin subset | `NotoSans-Regular.woff2`, `-SemiBold.woff2` (193 / 206 KB unsubset in the mocks → subset to Latin + Latin-1 + Latin Ext-A + General Punctuation + ₹ U+20B9, target ≤ 40 KB each) | Identical metrics to Noto Sans Devanagari (R3 §9.5, C19) |

Not shipped: Tiro Devanagari Sanskrit Italic, Noto Serif Devanagari, Mukta (alternates, decisions.md §5); Hind and Adishila rejected (R3 §9.4; R4 §9.3).

### 6.2 Loading

`@font-face` × 5 with `font-display: optional` (brief §5.1), `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two first-paint faces (Noto Sans Devanagari 400, Tiro Devanagari Sanskrit 400) on every page (every page renders Devanagari — brief §5.1), the full Devanagari faces loaded on every page, the Latin subset too (nav digits, EN labels). Consequence of `optional` accepted per the brief: on a cold, slow first load a page may paint in the system Devanagari face and the webfont serves from the next navigation (the service worker precaches all five files at install, §13). Stacks: `--font-mantra: "Tiro Devanagari Sanskrit", "Noto Sans Devanagari", serif`; `--font-body: "Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif`; `--font-latin: "Noto Sans", "Noto Sans Devanagari", system-ui, sans-serif`; `html[lang="en"] body { font-family: var(--font-latin) }`.

### 6.3 Licences

Each family's `OFL.txt` is committed verbatim in `fonts/<family>/OFL.txt` and copied to `dist/fonts/<family>/` beside the woff2 (OFL 1.1 "each copy contains the above copyright notice and this license" — R4 §9.1); `fonts/README.md` lists family, version, source URL, fetch date, subsetting command; the Sources page has a Fonts block naming the faces, authors and linking `openfontlicense.org` (R4 §9.4). None of the three families declares a Reserved Font Name, so subsetting (a modification under OFL FAQ 2.6) is allowed and the `name` tables stay unchanged (R4 §9.3). Test: every `dist/fonts/**/*.woff2` has a sibling `OFL.txt`; no font `name` table contains "Plex" or "Merriweather" (the two RFN words of the rejected candidates — a cheap tripwire).

### 6.4 Where IAST comes from and how it is set

IAST lines are set in Tiro Devanagari Sanskrit's own Latin (same baseline and colour as the Devanagari — R3 §9.5, decisions.md §4.4), `lang="sa-Latn"`, `--ink-2`, 1.02 × body at line-height 1.7; easy-Roman lines in Noto Sans at `--fs-meta`. The one missing IAST glyph ḹ (U+1E39) falls back to Noto Sans; the build counts ḹ in the generated IAST and reports it in `build.json` (decisions.md §12 item 12).

### 6.5 Devanagari rendering verification (`fonts.md`)

A dev page `dist/_dev/fonts.html` renders, in **both** the mantra face and the body face, at 17 px and 23 px: the conjunct set क्ष त्र ज्ञ द्ध ह्म ङ्क श्र द्य ट्ट ण्ड क्त द्व रु रू हृ क्ष्म स्त्र; nukta ज़ फ़ ड़ ढ़; chandrabindu हँ अँ चाँद; avagraha सोऽहम्; dandas । ॥; digits ०–९; svara marks U+0951/U+0952 on the Gayatri (VS 36.3) and the ganapatiaccent lines used in R3 §9.3; U+1CDA, U+1CEA, U+1CED; U+A8F3 ꣳ in its sequences (decisions.md §5 "adds U+1CEA, U+1CED, U+A8F3"); U+0953/U+0954 (which Tiro lacks — R3 §9.2 — so they fall back to Noto Sans Devanagari; the gate counts them, see §10.9). `tools/audit.py` shoots this page in both themes at 390 and 1440, checks with `document.fonts.check()` that each test string resolves in the intended face, and the step reading the shot records conjunct formation, mark placement and the absence of tofu in `fonts.md` together with the subsetting commands and file sizes (brief §5.1).

---

## 7. Verse / mantra rendering

### 7.1 The block

`verse_block()` in the templates (`build/templates/components/verse.mjs`) emits, in this order and only this order (R3 §4 point 1; decisions.md §11 point 1):

```html
<div class="verse">
  <p class="mantra" lang="sa" id="m-vs-36-3" aria-label="{svara-less Devanagari}">{Devanagari from the record, svara marks kept}&nbsp;।<span class="nb vn">&nbsp;॥&nbsp;{n}&nbsp;॥</span></p>
  <p class="iast" lang="sa-Latn">{generated IAST}&nbsp;||&nbsp;{n}&nbsp;||</p>
  <p class="roman-easy" lang="sa-Latn">{generated easy Roman}</p>
  <div class="verse-tools">▶ Listen · svara flag · voice note · [copy]</div>
</div>
```

followed (on mantra pages and in steps when `pada` exists) by the word split `<dl class="pada">`, then meaning, explanation, vinyog and the source line (`<p class="src">`). Devanagari is `--ink` at `--fs-mantra` / `--lh-mantra` (1.35 × body at 2.0 — R3 §4 point 2, §9.3), left-aligned on the `--surface` panel with a 3-px `--accent-2` left rule and rounded right corners (direction 2), max-width 72ch of its own font; the verse number `.vn` is `--accent`. `:root[data-translit]` CSS hides the IAST or easy-Roman line (or both) according to the persisted setting (§9.3).

### 7.2 Danda and number joining (C17)

`joinDanda(html)` in `build/lib/deva.mjs` replaces the whitespace before every `।`/`॥` with U+00A0 and wraps the terminal `॥ n ॥` in `<span class="nb vn">` (`white-space: nowrap`); IAST/easy `|`/`||` and the number get the same NBSP treatment (mocks decision 1). Unit tests: a danda is never the first character of a line box (also checked in the browser, UI-28).

### 7.3 Svara

Records carry `svara: true|false`. The verse tools row shows the flag: green dot "स्वर चिह्न दिखाए गए (माध्यंदिन संहिता)" or grey dot "स्वर चिह्न नहीं दिखाए गए" (brief §6.1; mocks decision 8). Every `.mantra` with svara marks carries `aria-label` = `stripSvara(devanagari)`: removes U+0951–0954, U+1CD0–1CFF, U+A8E0–A8FF, maps ꣳ → ं so screen readers and the browser voice get clean text (R4 §7.3; decisions.md §4.5). Unit-tested.

### 7.4 Transliteration

Generated at build (§11.4), displayed per the persisted setting `pb-translit` ∈ {`iast`, `easy`, `off`} (default `iast`) through one `role="radiogroup"` segmented control in the reading-settings card; the verse tools row has no duplicate control but a ⚙ link that opens/scrolls to that card (R3 §4 point 3; decisions.md §4.4). UI and English prose use easy-Roman for names; IAST only inside verse blocks (R5 §4.3 S2).

### 7.5 Word split and meanings

`<dl class="pada">`: two-column rows (Sanskrit term in Tiro 1.15 × body / line-height 1.8; gloss in the current language), two columns of rows at ≥ 820. Per-word meanings are static text, not hover tooltips (WCAG 1.4.13 — R4 §7.2). Ritual mantras require `pada`; long-text verses may omit it (brief §6.1). The prose meaning and explanation sit in `.prose` sections; on chapter pages the meaning is a `<details class="meaning">` (collapsed by default, opened by Expand all).

### 7.6 Vinyog and layer

The mantra page lists every occasion step that uses the mantra (derived at build from `steps[].mantraIds`), as links "विवाह → चरण 14 पाणिग्रहण"; inside an occasion step the layer chip (वैदिक / पद्धति / लोकाचार) comes from the step's `layer` (decisions.md §1 point 2).

### 7.7 Source line

Rendered from the record's `source` through the attribution patterns of decisions.md §7.2 (Line W for Wikisource, Line S for sanskritdocuments "checked against", Line G GRETIL, Line V VHP, Line B modern edition, Line T PD scan), in the page language, `<p class="src">` under the block; the URL and the licence are links (`rel="external license"`). After brief §14 the lines are kept for verification, not as a legal gate (§10.10).

### 7.8 Long chapters

A chapter page carries ≤ 40 verses; longer chapters are split into parts `/{n}/`, `/{n}/p2/`, … with `rel="prev"/"next"`, a pager top and bottom, and the verse navigator spanning all parts. This keeps every page under the 150-KB payload budget (a 100-verse chapter with meanings would exceed it) and answers the measured failure of 86,000-px single pages (R3 §5 point 6). Verse anchors `#v{n}` are stable across parts (the navigator links `…/p2/#v57`).

### 7.9 Honesty frames and phalashruti

A verse record with `phalashruti: true` renders its meaning under the label "फलश्रुति — ग्रन्थ का अपना कथन" (R4 §5.2; decisions.md §7.4); the site's own prose uses the "परम्परा में माना जाता है / tradition holds / परंपरा में मानल जाला" frame (brief §1), linted by gate rule G14 (§10.7).

---

## 8. Audio control (pronunciation module)

### 8.1 Decision

Per-verse inline control, browser `speechSynthesis` only (brief §3.10; no recordings in Phase 1–2; Phase 3 may add CC recordings bundled and credited — decisions.md §3.3). Alternatives considered: a page-level fixed bottom bar (shlokam.org — R3 §3) was rejected because it detaches the audio from the verse being read and covers content on phones (WCAG 2.4.11); a `<audio>` element per verse is impossible without recordings. The inline pill of bhagavadgita.com and quran.com's per-verse ▶ are the measured best practice (R3 §4 point 4).

### 8.2 Behaviour (`assets/js/voice.mjs`)

- Every `.verse-tools` has `<button data-listen="<verse id>" aria-pressed="false">` with icon + label "सुनें"; the label flips to "रोकें" and `aria-pressed="true"` while speaking; a 2-px progress line under the button advances on `boundary` events (character index / text length) when the engine fires them, else stays indeterminate (a pulsing bar is **not** used — reduced-motion rule; a static "बोल रहा है…" text replaces it). The text spoken is the `.mantra`'s `aria-label` (svara-less) or `textContent`; `utterance.lang = 'hi-IN'`.
- Voice choice at first use: `speechSynthesis.getVoices()` filtered by `lang` starting with `hi`, preference order: `localService` true → name containing "Hindi"/"हिन्दी" → first match; else any `sa` voice (rare) → else none. Chrome loads voices asynchronously: the module waits for `voiceschanged` up to 1.5 s before deciding. The chosen voice name is shown as a `.meta` line inside the reading-settings card ("आवाज़: Microsoft Swara — मशीन की आवाज़ (लगभग)"), and remembered in `sessionStorage` only.
- No Hindi voice: the ▶ buttons remain enabled but on click show the inline note "इस ब्राउज़र में हिंदी आवाज़ नहीं है" (hi) / "This browser has no Hindi voice" / "एह ब्राउजर में हिंदी आवाज नइखे" with a link to the Level 1 pronunciation lesson; `aria-disabled` is **not** set (the user may still try after installing a voice); the note is `role="status"`. No `speechSynthesis` object at all: the module hides the buttons (`hidden`) and renders the same note once in the reading-settings card.
- Speed: `.stepper` −/+ in 0.1 steps, 0.5–1.5, default 0.9, `<output aria-live="polite">0.9×</output>`; persisted as `pb-rate`. Repeat: a toggle button `aria-pressed` that re-queues the utterance up to 10 times with a 1-s pause; persisted `pb-repeat`. Both are 44-px controls with text labels (WCAG 2.5.7 single-pointer alternative, R4 §7.1 — there is no slider).
- Only one utterance at a time: starting a verse cancels the running one and resets the other button's state. Navigating away (`pagehide`) cancels.
- The label "मशीन की आवाज़ (लगभग) — वैदिक स्वर नहीं" sits in the tools row of every verse (brief §3.10), and the lesson "स्वर क्यों नहीं सुनाई देते" is linked from the reading-settings card. The button's accessible name is "सुनें — श्लोक ३, मशीन की आवाज़" (R4 §7.2 1.1.1).

### 8.3 Failure handling

| Condition | Behaviour | Logged |
|---|---|---|
| `speechSynthesis` missing | Buttons hidden; one note in the settings card | no |
| No `hi-IN` voice after 1.5 s | Click shows note; nothing spoken | no |
| `utterance.onerror` (e.g. `synthesis-failed`, `interrupted`) | Button resets to "सुनें"; if `error !== 'interrupted'` the note "आवाज़ चल नहीं सकी, फिर कोशिश करें" appears for 4 s | `console.warn` only |
| Text > 4,000 characters (some engines truncate) | The module splits at `।`/`॥`/`\n` boundaries into ≤ 1,500-char chunks and queues them | no |

---

## 9. Navigation, language and settings model

### 9.1 Navigation

As §4.1. Section order and labels (hi / en / bho): सीखें / Learn / सीखीं · अवसर / Occasions / अवसर · मंत्र और पाठ / Mantras & texts / मंत्र आ पाठ · कथाएँ / Kathas / कथा · शब्दावली / Glossary / शब्दावली; search खोजें / Search / खोजीं; home मुखपृष्ठ / Home / पहिला पन्ना (R5 §10; decisions.md §8). Breadcrumbs are ancestors only. The `.sections` in-page scroller on long pages (occasion: परिचय · कब · भूमिकाएँ · सामग्री · विधि · प्रादेशिक भेद · प्रश्न · स्रोत) uses 40-px chips and `aria-current="location"` via `IntersectionObserver` (no scroll hijacking). Keyboard: all nav items are real links; the phone nav row is a scrollable `<ul>` (no hidden-until-hamburger drawer, so nothing needs a focus trap — the measured mobile failure of IITK's drawer is avoided, R3 §5 point 5).

### 9.2 Language

The language is the URL prefix (SEO, `hreflang`, sharing), and a persisted preference `pb-lang` written whenever the user clicks the language control (not on mere visits, so a shared `/en/` link does not silently change a Hindi reader's default). The root `index.html` redirects to the persisted language or `hi/`. The segmented control's three links point at the **same page** in the other languages (computed at build from the route table); where a target page does not exist in a language (never, by the id-parity gate — but defensively) the link falls back to that language's section index. `<html lang>` is `hi`, `en` or `bho` — never `bh`, never `hi-Deva` (R4 §10; R5 §6, L2, L5). Sanskrit spans `lang="sa"`, transliteration `lang="sa-Latn"`, quoted Hindi inside English `lang="hi"`, Bhojpuri `lang="bho"` (decisions.md §4.5).

Wordmarks: पंडित बनो (hi), Pandit Bano (en), पंडित बनीं (bho — R5 §5, D1–D3); the `<title>` suffix and `manifest.name` follow the page language.

### 9.3 Settings and persistence (all "stored in this browser only")

| Key | Values | Default | Where it is set | Where shown |
|---|---|---|---|---|
| `pb-theme` | `light` · `dark` · `system` | `light` (first paint for everyone — brief §1) | header theme button, cycles light → dark → system (mocks decision 6) | button label + icon; `data-theme` on `<html>` |
| `pb-lang` | `hi` · `en` · `bho` | unset (→ `hi`) | language control click | current link `aria-current` |
| `pb-translit` | `iast` · `easy` · `off` | `iast` | reading-settings radiogroup | `aria-checked`; `data-translit` on `<html>` |
| `pb-rate`, `pb-repeat` | `0.5`–`1.5`, `0|1` | `0.9`, `0` | reading-settings card | `<output>`, `aria-pressed` |
| `pb-check:<occasionId>` | JSON array of ticked samagri item ids | `[]` | samagri checklist | checkbox state + strike-through |
| `pb-quiz:<lessonId>` | `{right, total, at}` | none | quiz "जाँचें" | lesson progress badge, Learn index |
| `pb-sankalpa` | `{gotra, name}` | none | sankalpa worked example form | prefilled fields (WCAG 3.3.7, R4 §7.1) |
| `pb-saved` | JSON array of saved occasion ids with version | `[]` | Save offline button | button state, Home "saved" list |
| `pb-font-pct` (pothi only) | 80–160 | 100 | pothi A−/A+ | `<output>` "100%" |

A head script of ≤ 400 bytes (as `mock_shell.py#HEAD_SCRIPT`) reads `pb-theme` and `pb-translit` and sets `data-theme` / `data-translit` before first paint, so there is no flash; it validates values against the allowed set and falls back to defaults. All storage access is wrapped in `try/catch` (Safari private mode throws on `setItem`); failure degrades to in-memory state for the page and shows nothing to the user. The Privacy page lists exactly these keys (R4 §6.3 names the categories; the page enumerates them).

### 9.4 Rails and reading settings

The right rail's "पढ़ने की सेटिंग" card is the single home of transliteration, voice speed, repeat and the voice name; a ⚙ link in each verse's tools row jumps to it (R3 §4 point 5 — one place, one icon). On phones the rails are `<details>` folded closed; a script opens them at ≥ 1024 (`matchMedia`) — the measured problem of IITK's drawer covering the verse on mobile is designed out (R3 §5 point 5; mocks decision 3). Rails are `position: sticky` under the header at ≥ 1024/1440 with their own scroll (`max-height: calc(100vh − header − 2·gap)`), so a long samagri list never pushes the page.

---

## 10. Content model and content gate

### 10.1 Files

```
content/
  ui/{hi,en,bho}.json                 UI strings (flat keys), incl. nav, theme, voice, honesty frames, footer notes
  termbank.json                       copied from research/termbank.json (629 terms; glossary source)
  forbidden-hi-in-bho.json            copied from research (gate lists)
  sources.json                        source registry: id → {project, title, url, retrieved, licence, kind, note, titles[]} (titles[] = the names under which prose may cite it, for G16/UI-19)
  institutions.json                   named institutions/courses of decisions.md §10 with URLs (Level 0 table; G16/UI-19 link check)
  shubhvela-ids.json                  festival slugs, vrat slugs, muhurat activity ids copied from Shubhvela with the copy date (§16.1, G20)
  latin-allow.json                    proper names allowed in Latin inside hi/bho prose (G8)
  mantras/<group>/<mantraId>.json     ritual-mantra records (≈ 900)
  texts/<textSlug>/text.json          text metadata + chapter list
  texts/<textSlug>/<n>.json           one chapter: verses[] (long-text verse records)
  occasions/<group>/<slug>.json       occasion records (incl. foundations F01–F17 and katha vidhis)
  kathas/<slug>/katha.json            katha metadata, caveat, adhyaya list, vidhiOccasionId
  kathas/<slug>/<n>.{hi,en,bho}.md    adhyaya retelling (Markdown subset, §11.3); verse refs by id
  learn/levels.json, learn/<lessonId>.json (+ .{hi,en,bho}.md prose)   lessons + quizzes
  glossary/<termId>.json              definitions (hi/en/bho) for terms that get a page; refs termbank id
  reference/<slug>.{hi,en,bho}.md     reference pages
  static/<slug>.{hi,en,bho}.md        about, sources (generated part + prose), privacy
```

Ids: ASCII slugs `[a-z0-9-]+` (R5 S3); occasion ids keep the R2 code as a field (`code: "M00"`) but the URL slug is the easy-Roman name (`vivah`). Trilingual text fields are objects `{ "hi": "...", "en": "...", "bho": "..." }` (brief §6.2 "authored once in a language-neutral structure"); the gate requires all three keys (id parity).

### 10.2 Mantra / verse record (`content/mantras/**` and `texts/<slug>/<n>.json#verses[]`)

```json
{
  "id": "vs-36-3", "kind": "vedic", "text": "shukla-yajurveda", "locator": "VS 36.3",
  "devanagari": "<the verse copied from the Wikisource SYV 36 page with its svara marks — never typed from memory>",
  "svara": true, "variants": [{"reading": "…", "note": {"hi":"…","en":"…","bho":"…"}, "source": "sd-syv-sandhya"}],
  "pada": [{"sa": "तत्", "gloss": {"hi":"वह","en":"that","bho":"ऊ"}}],
  "meaning": {"hi":"…","en":"…","bho":"…"},
  "explanation": {"hi":"…","en":"…","bho":"…"},
  "phalashruti": false,
  "source": {"ref": "wikisource-syv-36", "retrieved": "2026-10-31", "modified": false},
  "checkedAgainst": [{"ref": "sd-syv-sandhya", "retrieved": "2026-10-31"}],
  "copyright": "pd", "reproduce": true, "copyrightBasis": "ancient Sanskrit; Wikisource transcription CC BY-SA 4.0",
  "tags": ["gayatri", "sandhya"], "review": {"bho": "draft", "hi": "draft"}
}
```

`iast`, `easy`, `vinyog[]` (occasion steps using the mantra) and `ariaPlain` are **derived at build**, never authored. `source.ref` points into `sources.json`; the renderer picks the attribution line pattern by the registry entry's `project`. `kind` ∈ {`vedic`, `puranic`, `paddhati`, `folk`, `author`} (decisions.md §7.3 plus `author` for Tulsidas and the named-author aartis). Required: `id`, `kind`, `devanagari`, `svara`, `meaning` (all three), `source.ref`+`retrieved`; `pada` required when the mantra is referenced by any occasion step (ritual mantra — brief §6.1), optional for long-text verses; `explanation` required for ritual mantras.

### 10.3 Occasion record

```json
{
  "id": "vivah", "code": "M00", "group": "marriage", "phase": 1,
  "title": {"hi":"विवाह (बियाह)","en":"Wedding (vivah)","bho":"बियाह"},
  "lede": {...}, "overview": {...},
  "when": {"rules": {...}, "shubhvela": {"muhurat": "muhurat-marriage", "festival": null, "vrat": null}},
  "roles": [{"role": {...}, "does": {...}}],
  "samagri": [{"id": "kalash", "item": {...}, "qty": "1", "note": {...}, "must": true, "searchUrl": "https://…"}],
  "parts": [{"id": "purvanga", "title": {...}}],
  "steps": [{"n": 1, "part": "purvanga", "layer": "paddhati", "action": {...}, "mantraIds": ["vs-36-3"],
             "panditSays": {"sa": "…", "hi": "…", "en": "…", "bho": "…"}, "note": {...}, "important": false}],
  "variants": [{"region": "mithila", "what": {...}, "source": "r1-m8"}],
  "faq": [{"q": {...}, "a": {...}}],
  "sources": ["pgs-wikisource", "ia-vivah-mvf"],
  "sensitive": ["grief"|"health"|"pregnancy"|"astrology"],
  "tags": [...], "review": {...}
}
```

Required (brief §6.6): ≥ 1 step, ≥ 1 samagri item, ≥ 1 source, `when`, `roles`, `overview`. `samagri[].searchUrl` is the brief's optional purchase-search link (brief §6.2): a plain `https:` web-search URL, rendered as an external link with `rel="external noopener nofollow"`, never an affiliate or shop URL: the validator accepts only hosts on a three-entry allow-list (`duckduckgo.com`, `www.google.com`, `www.bing.com`) and rejects any query parameter named `tag`, `ref`, `affid`, `aff`, `utm_*`. `panditSays.sa` is optional (some steps are spoken in Hindi only); `hi/en/bho` required. `sensitive` drives the one-line notes of R4 §5.3 rule 4 and the astrology statement of rule 6. `when.shubhvela` keys are validated against the Shubhvela id lists committed in `content/shubhvela-ids.json` (§16.1).

### 10.4 Text, chapter, katha, lesson, glossary, reference records

- `texts/<slug>/text.json`: `{id, title{}, intro{}, source{ref}, attributionCaveat{}?, chapters:[{n, title{}, verseCount}], vidhiOccasionId?, phase}`; `verseCount` is checked against the chapter file; a chapter file whose `verses[]` lack any `meaning` is **unpublished** (not rendered, not counted, not in search — brief §6.1).
- `kathas/<slug>/katha.json`: `{id, title{}, deity, puranicSource{ref, locator}, caveat{}?, adhyayas:[{n, title{}, verseRefs:[...]}], vidhiOccasionId, phase}`; adhyaya prose in Markdown per language.
- `learn/<lessonId>.json`: `{id, level, order, title{}, minutes?, prose: md, quiz:[{q{}, options:[{id, text{}}], answer, feedback{ok{}, no{}}}], related:{occasions[], mantras[], terms[]}}`; ≥ 3 questions per lesson; one answer per question.
- `glossary/<termId>.json`: `{id (termbank id), definition{}, related[]}`; the term's three display forms come from the term bank.
- Markdown files carry YAML-less front matter as the first JSON line `{"title": "...", "summary": "..."}`.

### 10.5 UI strings

`content/ui/{lang}.json` flat key → string, placeholders `{name}`. The Bhojpuri file is scanned by the forbidden-word gate; keys must match across the three files (id parity).

### 10.6 Derived data (build-time)

IAST and easy-Roman per record (§11.4); `ariaPlain`; `vinyog` from occasion steps; counts (occasions per group, mantras, verses per text, terms); the search documents; `shubhvela` link URLs; chapter pagination; the sources page; `build.json` report.

### 10.7 The content gate (`npm run gate`, `build/gate.mjs`)

Runs in CI, before every content commit (the integrate step) and inside `npm run build` (build fails on FAIL). Reads `content/**`, writes `dist/_reports/gate.json` and prints one line per finding `LEVEL  file  rule  message`. Levels: **FAIL** (blocks), **FLAG** (listed, does not block). Rules:

| # | Rule | Level | Source |
|---|---|---|---|
| G1 | Schema: every record validates against its hand-written validator (§10.9); unknown keys FAIL | FAIL | brief §6.6 |
| G2 | Id parity: every trilingual field has non-empty `hi`, `en`, `bho`; UI files have identical key sets | FAIL | brief §6.2, §6.6 |
| G3 | Devanagari-only in `devanagari`, `pada[].sa`, `panditSays.sa`: allowed U+0900–097F, U+0964/0965, U+093D, U+0951–0954, U+1CD0–1CFF, U+A8E0–A8FF, U+200C/200D, U+0020, U+000A, Devanagari digits, the pluta ३ in ओ३म्, and `{`/`}` placeholders only in `panditSays.sa` (sankalpa blanks); anything else (Latin letters, ASCII punctuation, `|`, `S`) FAIL | FAIL | brief §6.1; decisions.md §4.1 (R2 C10 extension) |
| G4 | Source: every mantra/verse record has `source.ref` resolving to `sources.json` with a `url` and `retrieved`; `checkedAgainst` present where the registry entry has `secondSourceAvailable: true` | FAIL | brief §6.1; decisions.md §7.3 |
| G5 | Occasion completeness: ≥ 1 step, ≥ 1 samagri, ≥ 1 source, `when`, `roles`, `overview`; every `mantraIds` entry resolves; every `part` referenced by a step exists | FAIL | brief §6.6 |
| G6 | Ritual-mantra depth: a mantra referenced by any step has `pada` (≥ 1) and `explanation` | FAIL | brief §6.1 |
| G7 | Unpublished chapters: any verse without `meaning` → chapter marked unpublished; FLAG with count; a text with zero published chapters FAIL at phase ≥ its own phase | FLAG/FAIL | brief §6.1 |
| G8 | No Latin tokens in hi/bho prose except the allow-list (`latinAllow` of forbidden file + URLs, ids, numerals, IAST inside `lang="sa-Latn"` spans, proper names listed in `content/latin-allow.json`) | FAIL | brief §6.6 |
| G9 | Forbidden Hindi in Bhojpuri: `forbidden-hi-in-bho.json` `hard` → FAIL, `soft` → FLAG, `patterns` → FAIL, with the `_meta.tokenisation` contract; skips `devanagari`/`sa` fields | FAIL/FLAG | brief §6.4; R5 §8.2 |
| G10 | Bhojpuri nukta only in ड़/ढ़; Hindi pancham-varna conjunct check (IS 16500 §2.6.1.2) in `hi` prose fields | FAIL | R5 §4.1 H2, §4.2 B4 |
| G11 | Length ratio hi:en and bho:en of each trilingual field within 0.6–1.8 | FLAG | brief §6.6 |
| G12 | Internal links in Markdown/prose resolve to a route in the route table | FAIL | brief §6.6 |
| G13 | Glossary terms marked in prose (`[[term-id]]` syntax, §11.3) exist in `termbank.json`; unmarked occurrences of a term's `hi`/`bho`/alternates in prose are FLAGged once per page so the author can mark them | FAIL/FLAG | brief §6.6 |
| G14 | Honesty lint: R4 §5.4 regex seeds over site-voice fields (`overview`, `meaning`, `explanation`, `action`, `note`, `faq`, Markdown prose) → FLAG; a FLAG whose sentence subject is a mantra/puja/vrat and whose verb is curative, containing a Schedule disease term, → FAIL. Allow-list: fields with `phalashruti: true`, glossary definitions of disease terms | FLAG/FAIL | R4 §5.3–5.4; brief §1 |
| G15 | Sensitive pages: an occasion with `sensitive` includes the matching note strings (checked at render) | FAIL | R4 §5.3 rule 4, 6 |
| G16 | Every named source in prose is a link: Markdown prose may not contain a bare title from `sources.json#titles[]` or `bibliography` without a link; checked again in the DOM audit (UI-19) | FAIL | brief §5.1 |
| G17 | Counts shown in prose (`{{count:occasions}}`, `{{count:mantras}}` placeholders) are the only way to print a number about the corpus; literal counts near those words FLAG | FLAG | brief §1 |
| G18 | Duplicate ids across all content FAIL (lanes split by domain — brief §13.2) | FAIL | brief §13 |
| G19 | `reproduce: false` records are not allowed in the inventory after brief §14 — FAIL with the message "owner decision §14: reproduce in full"; `copyright`/`copyrightBasis` still required for the record | FAIL | brief §14 |
| G20 | Shubhvela ids in `when.shubhvela` exist in `content/shubhvela-ids.json` | FAIL | §16.1 |

### 10.8 Review packs

Content steps write `review/<item>-bho.md` and `review/<item>-hi.md` (brief §6.4); the gate does not read them, but rule **G21 (same-text check)** catches untranslated text: a `bho` field identical to its `hi` sibling FLAGs when over 12 characters and FAILs when over 40 (short shared tatsama headings such as संकल्प are legitimately identical — R5 C25).

### 10.9 Validators (hand-written, `build/lib/schema.mjs`)

One function per record type returning `{ok, errors:[{path, message}]}`. Rules: required keys, types, enums (`kind`, `layer`, `group`, `phase` 1–3, `copyright`), id pattern `^[a-z0-9][a-z0-9-]{1,63}$`, string length caps (title ≤ 120, lede ≤ 300, action ≤ 1,000, meaning ≤ 4,000, explanation ≤ 8,000 characters per language), array caps (steps ≤ 200, samagri ≤ 150, quiz ≤ 20), date format `YYYY-MM-DD`, URL scheme `https:` only (one `http:` exception list for government portals that have no TLS, e.g. `usvv.ac.in` — R1 table), no HTML tags in JSON string fields (Markdown only in `.md` files; JSON prose supports `[[term]]`, `**`, `*`, links `[t](url)` only). Unknown keys fail so typos cannot hide. A gate rule for U+0953/U+0954: FLAG with count (Tiro lacks them; the renderer's fallback is Noto Sans Devanagari — §6.5).

### 10.10 Licensing fields after brief §14

Every record keeps `source`, `checkedAgainst`, `copyright`, `copyrightBasis` for verification and the attribution line is still rendered (decisions.md §7.2 lines W/S/G/V/B/T — "they cost nothing and serve verification", brief §14.2). The gate no longer blocks on copyright status (G19 inverts the old rule). The Sources page states the owner's decision in one neutral sentence per language ("यह साइट सभी पारम्परिक पाठ पूर्ण रूप में देती है; स्रोत प्रत्येक अभिलेख पर दिए हैं").

---

## 11. Build pipeline (`build/build.mjs`)

### 11.1 Stages (sequential, each writes to `dist/` only at the end)

1. **Load**: read every file under `content/`, parse JSON (`JSON.parse` with the file path in any error), read Markdown; load `research/`-derived data copied into `content/` (term bank, forbidden lists, Shubhvela ids). Any parse error is **fatal** (exit 2, message `file:line:col`).
2. **Gate** (§10.7): FAIL → exit 3 with the findings list; FLAGs are written to the report and printed.
3. **Derive**: IAST/easy-Roman (§11.4), `ariaPlain`, vinyog maps, counts, chapter pagination, published-chapter set, glossary pages set (terms with definitions), route table (every page × 3 languages), Shubhvela URLs.
4. **Render**: templates (§11.2) → HTML strings; `joinDanda`; HTML is minified only by trimming indentation (no minifier dependency); each page is written as `dist/<lang>/<route>/index.html`.
5. **Assets**: copy `assets/css`, `assets/js`, `fonts/`, icons; the vendored `minisearch` ES build; `_dev/fonts.html`. CSS and JS files are written with a content hash in the name (`site.<hash>.css`, `app.<hash>.mjs`) and the references in the rendered HTML and in `sw.js` are rewritten to match, so they can be cached immutably (§13.2); fonts keep their names (they change only with a font upgrade and are versioned by the SW cache name).
6. **Search** (§14): build per-language shards `dist/search/<lang>/<shard>.json` and `dist/search/<lang>/index.json`.
7. **PWA**: `manifest.webmanifest` per language; `sw.js` with the build hash and the precache manifest (§13).
8. **SEO files**: `sitemap.xml` (split into `sitemap-<lang>.xml` + index if > 45,000 URLs), `robots.txt`, `404.html`, root redirect.
9. **OG images** (§11.7): resvg-js renders `dist/og/<lang>/<route-hash>.png` for every page; failures fall back to the page-type default and are counted in the report (non-fatal).
10. **Budgets and report** (§23): per-page payload sizes, data JSON sizes, counts; `dist/_reports/build.json`; budget violations are **fatal** in CI (`CI=true`) and warnings locally.

Determinism: file lists are sorted; no timestamps in HTML except `<meta name="pb-build">` (hash); the build hash is `sha256` of the content tree + templates + assets, 12 hex chars.

### 11.2 Templates

Plain JS tagged-template functions under `build/templates/` (`layout.mjs`, `components/*.mjs`, one file per page type) — the same approach as Shubhvela's `web/src/templates/*.mjs`, so the owner sees one pattern across both repos. An `esc()` helper HTML-escapes every interpolated string; raw HTML is inserted only through `raw()` wrapping output of the Markdown renderer or the verse renderer. A unit test renders every template with a fixture and asserts no unescaped `<` from data.

### 11.3 Markdown subset (`build/lib/md.mjs`)

Supported: paragraphs, `#`–`####` headings (shifted so the page `<h1>` stays unique), `**bold**`, `*em*`, `[text](url)` (external URLs get `rel="external noopener"` + the marker), lists `-`/`1.`, `> ` blockquote, `---` rule, `[[term-id]]` → glossary link with the term's display form in the page language (first occurrence on a page gets the bracketed alternate per R5 B7), `{{count:…}}` placeholders, `{{mantra:<id>}}` → inline verse block, `{{note:health|grief|astrology}}` → the fixed sensitive-content note, `{{sutra:pgs-1-8-11}}` → the `.sutra` quote block. Unsupported syntax is left as text (and `<` is escaped). Tables are allowed with the GFM pipe syntax and render inside `<div class="table-wrap">` (horizontal scroll only for tables — WCAG 1.4.10).

### 11.4 Transliteration (`build/lib/translit.mjs`)

`stripSvara()` first (U+0951–0954, U+1CD0–1CFF, U+A8E0–A8FF removed; ꣳ U+A8F3 → ं before stripping so the anusvara survives — decisions.md §4.2), then `sanscript.t(text, 'devanagari', 'iast')`; post-rules: `।` → `|`, `॥` → `||`, avagraha → `'`, ओ३म् → `oṁ`. Easy-Roman from IAST by the fixed table of decisions.md §4.3 (ā→aa, ī→ee, ū→oo, ṛ→ri, ṝ→ree, ḷ→li, ṃ/ṁ→m, ḥ→h, ṅ/ñ/ṇ→n, ṭ→t, ḍ→d, ś/ṣ→sh, c→ch, ch→chh). Fixture round-trip test with 40 lines including Gayatri, VS 16.1, PGS 1.8.8, Satyanarayan 233.1 and the ganapatiaccent line; expected outputs are committed and reviewed once by a human reader of IAST (the content-integrate step). A mantra whose IAST contains a character outside the IAST set after conversion (sanscript left something unmapped) FAILs the build with the record id.

### 11.5 Route table and `href()`

`build/lib/routes.mjs` holds every route pattern with its page type, `phase`, `precache` class (§13) and `sitemap` flag; `routesFor(lang)` yields the page list; `alternates(route)` yields the three language URLs (used by the header language control, `hreflang`, sitemap `xhtml:link`). `href(path)` = `BASE_PATH` + path without a leading slash; `abs(path)` = `SITE_ORIGIN` + `href(path)`. A test asserts every rendered `href`/`src` in `dist/` resolves to a file in `dist/` or is an allowed external origin (Shubhvela, GitHub, sources).

### 11.6 Counts and the "computed only" rule

Every number about the corpus on any page comes from `counts` (brief §1); templates have no literal counts; G17 lints prose. Index pages show "N अवसर", "N मंत्र", "N श्लोक" from the data.

### 11.7 OG images

`assets/og-template.svg` (1200×630, paper background, diya mark, title in Noto Sans Devanagari 600 / Noto Sans 600, site name, no deity figure) with `{title}`, `{site}`, `{lang}` placeholders; resvg-js with the repo fonts (`fontFiles` option), `fitTo` width 1200. Title length is capped at 70 characters with "…". Failure (resvg throws) → `dist/og/<lang>/default-<pageType>.png` (rendered once at the start; if even that fails, the build still passes and `og:image` is omitted; the report lists the failure).

---

## 12. Client modules (`assets/js/`)

| Module | Loaded on | Does | Size cap (unminified) |
|---|---|---|---|
| `head.js` (inline, ≤ 400 B) | every page | theme + translit attributes before paint | — |
| `app.mjs` | every page | registers the SW; theme cycle; language-click persistence; rail folds by `matchMedia`; external-link marker no-op; dispatches per-page hooks by `data-page` | 6 KB |
| `translit.mjs` | pages with verses | radiogroup → `data-translit` + storage | 2 KB |
| `voice.mjs` | pages with verses | §8 | 6 KB |
| `checklist.mjs` | occasion, katha | ticks → storage; Clear with confirm (`confirm()` dialog text from UI strings; no custom modal) | 2 KB |
| `tracker.mjs` | occasion, chapter, katha | `IntersectionObserver` → `aria-current` in rails and `.sections` | 2 KB |
| `quiz.mjs` | lesson | grading, feedback, storage, progress badge | 3 KB |
| `expand.mjs` | chapter | Expand/Collapse all `<details>` | 1 KB |
| `offline.mjs` | occasion, katha, home | Save-offline button → `postMessage` to the SW; "saved" list on Home; toast | 4 KB |
| `pothi.mjs` | pothi | A−/A+, Print, Save offline, back | 2 KB |
| `search.mjs` + `vendor/minisearch.js` | search page; header icon prefetches on `focus`/`pointerenter` | §14 | 6 KB + minisearch (~30 KB) |
| `sankalpa.mjs` | sankalpa reference | fills the worked example from a two-field form; remembers gotra/name | 2 KB |

No module throws to the top level: each page hook is wrapped so one failing feature (e.g. storage denied) never breaks another. Modules use no globals except `window.pb` with `{base, lang, page}` read from `<html data-*>`.

---

## 13. PWA and offline

### 13.1 Manifest

`/{lang}/manifest.webmanifest` per language: `name`/`short_name` (पंडित बनो · Pandit Bano · पंडित बनीं), `lang`, `dir: ltr`, `start_url: "./"` (relative), `scope: "../"` → the site root under `BASE_PATH`, `display: standalone`, `background_color`/`theme_color` = light paper `#F8ECD4`, icons 192/512 + maskable 512 (`purpose: "maskable"`) from `assets/icon.svg` (diya mark on paper — no deity), `description` from UI strings; **no `id`** (brief §7). Each page links its language's manifest.

### 13.2 Service worker (`sw.js`, hand-written, served at `BASE_PATH + "sw.js"` and registered with `scope: BASE_PATH`, so it covers all three language trees and nothing outside the site)

- Version string = build hash; caches `pb-static-<hash>` (CSS, JS, fonts, icons, offline page, 404, root redirect, UI shell pages: the three home pages and the three section indexes), `pb-pages` (visited HTML, runtime), `pb-saved` (explicit "save offline" sets), `pb-search` (search shards, runtime).
- Install: precache the static list (a JSON array embedded at build; every new page type's assets must be added to `build/lib/precache.mjs` — brief §7; a test asserts every route type is classified `precache: "static" | "runtime" | "none"`). `skipWaiting` is **not** automatic: the new worker waits; the page shows the update toast "नया संस्करण उपलब्ध — पुनः लोड करें" with a button that posts `SKIP_WAITING`, then reloads on `controllerchange` (one reload guard).
- Fetch: navigation requests → network-first with a 3-s timeout, fallback to `pb-pages`/`pb-saved` match, then `/{lang}/offline/` (language from the URL prefix, default hi); static assets → cache-first (hashed URLs are immutable: `assets/css/site.<hash>.css` etc.); search shards → stale-while-revalidate; cross-origin requests (Shubhvela, GitHub) are never intercepted. Opaque responses are never cached.
- "Save this occasion offline": `offline.mjs` posts `{type: "SAVE", id, urls: [...]}` with the list of that occasion's pages (overview, parts, pothi, mantra pages referenced, OG not needed) which the build embeds as `<script type="application/json" id="pb-offline-urls">` on the page; the worker fetches and stores them in `pb-saved` (max 60 occasions; oldest evicted with a toast), replies `{type: "SAVED", id, bytes}`; the button shows "सहेजा गया ✓" and Home lists saved items with Remove buttons (`{type: "UNSAVE", id}`). Progress is reported as "n / total" in the toast.
- Activation deletes caches whose names do not carry the current hash, except `pb-saved` (saved pages are re-fetched lazily: a saved page served from cache with an old hash triggers a background refresh when online).
- Storage pressure: `navigator.storage.estimate()` before SAVE; if the quota remaining is below the estimated size × 1.5, the SW replies `{type: "ERROR", reason: "quota"}` and the page shows "जगह नहीं बची — कुछ सहेजे गए अवसर हटाएँ".
- Fonts are in `pb-static`, so the `font-display: optional` miss happens only on the very first visit.

### 13.3 Offline test (Phase 3, brief §8)

Playwright: load Vivah online, click Save offline, wait for SAVED, `context.set_offline(True)`, navigate to the pothi route and a mantra it references → both render; navigate to an unsaved page → the offline page in the right language. Recorded in the Phase 3 verification report.

---

## 14. Search

### 14.1 Decision

Client-side `minisearch` (MIT) over per-language shards, loaded only on the search page or when the user focuses the header search (prefetch). Alternatives: own inverted index (more code, no fuzzy/prefix for free) or a server (not allowed). minisearch gives prefix + fuzzy search and field boosting in ~30 KB.

### 14.2 Index

Documents (per language): occasions (title, lede, group, step actions joined, samagri names), mantras and verses (id, Devanagari normalised, IAST, easy-Roman, first 160 characters of meaning, text/chapter), kathas (title, adhyaya titles, first paragraph), lessons (title, summary), glossary terms (three forms + alternates + folk forms), reference/static pages (title, summary). Fields: `title` (boost 3), `alt` (alternate names, boost 2), `body`, `deva` (normalised Devanagari), `roman`; stored fields: `url`, `type`, `title`, `snippet`. Sharding: the index is serialised once per language with `MiniSearch.toJSON()` and restored on the client with `MiniSearch.loadJSON()` (no client-side indexing). Two shapes, chosen by the build deterministically from the serialised size and recorded in `build.json`: one `dist/search/<lang>/all.json` when it is ≤ 300 KB (the brief's per-page data budget), otherwise per-type shards `dist/search/<lang>/<type>.json` (occasions, mantras, verses, kathas, lessons, terms, pages), each ≤ 300 KB, loaded in parallel on the first query (a shard over 300 KB — the long-text `verses` shard will be, at ≈ 2,600 verses — is split into `verses-1.json`, `verses-2.json`… by text, and the small manifest `dist/search/<lang>/index.json` lists the shards). Bodies are truncated to 160 characters per field before indexing so the serialised index stays small.

### 14.3 Devanagari normalisation (both at index and query time, `assets/js/deva-norm.mjs`, shared with the build via a copy test)

NFC; strip svara and Vedic marks (§11.4 rule); nukta-insensitive (ज़→ज, फ़→फ, ड़→ड, ढ़→ढ, क़→क, ख़→ख, ग़→ग); chandrabindu → anusvara (ँ→ं); visarga kept; anusvara vs pancham-conjunct folded (ङ्क→ंक, ञ्च→ंच, ण्ट→ंट, न्त→ंत, म्प→ंप and their aspirated partners); ZWJ/ZWNJ removed; danda removed; Devanagari digits → ASCII. Roman queries are lower-cased and run through the easy-Roman table so "shraddha", "śrāddha" and "shraaddha" meet. A query in Devanagari is also transliterated to easy-Roman client-side with a small table (no sanscript on the client) and searched in `roman` too.

### 14.4 UI

Search page: 44-px input with `type="search"`, results list grouped by type with counts, keyboard navigable, `aria-live="polite"` result count, "कोई परिणाम नहीं" with suggestions (glossary letter bar, groups). Empty query shows the groups. Query length cap 100 characters; results cap 50; debounce 120 ms. Header icon → `/{lang}/search/?q=` (the query is read from the URL on load so links are shareable; the query is HTML-escaped when echoed).

### 14.5 Failure handling

Shard fetch fails (offline, 404) → message "खोज सूची लोड नहीं हो सकी — ऑफ़लाइन?" with a retry button; JSON parse failure → same message plus `console.error`; minisearch throws on a malformed query (it does not; but the call is wrapped) → empty result set. Search never blocks page render (module loads `defer` and only on demand).

---

## 15. Pothi mode and print

Route `/{lang}/occasions/{slug}/pothi/` (also reachable from kathas via their vidhi occasion). No site chrome: a `.pothi-bar` toolbar (Back link to the occasion, A−/A+ stepper with a live `<output>` "100%", Print, Save offline), a centred title block (occasion name, part names), then one `.pothi-step` `--surface` card per step: number + locator (`.no`), action (`.act` 1.1 × body), the mantra at `--fs-pothi` (1.5 × body, line-height 2.0 — mocks decision 9; 25.5 px on a phone), "पंडित जी कहते हैं", nothing else (no meanings, no chips, no rails — brief §2.1 item 6). Two cards per row at ≥ 1440. The only drop shadow in the system is on the floating "saved offline" toast.

`@media print` (in `site.css`): hide `.pothi-bar`, `.floating`, header/footer/rails everywhere; `.pothi-step { break-after: page; border: 0 }`; `.step { break-inside: avoid }` on occasion pages; print tokens white paper/black ink (§5.1); mantra ≥ 14 pt (R4 §7.3): at print the A4 page is ≈ 794 CSS px wide, so `--fs-body` resolves to ≈ 17.9 px and the 1.5× pothi mantra to ≈ 27 px ≈ 20 pt; `@media print .pothi-step .mantra { font-size: max(var(--fs-pothi), 18.67px) }` guarantees the floor whatever the page size (UI-26 asserts ≥ 18.67 px); links print their URL after the text for external sources only; the print footer line "मंत्र-पाठ छपा है; कृपया आदर से रखें/रीसायकल करें" is included **by default** as an owner-droppable string in `content/ui` (R4 §8.2 rule 3; decisions.md §12 owner to-do) — dropping it is a one-key change. Ticks print as ✓ glyphs beside the item, not colour alone. The samagri checklist has its own "छापें" button that prints only the rail card (a `body.print-samagri` class toggled before `window.print()` and removed on `afterprint`).

---

## 16. Shubhvela cross-links and the font decision (brief §2.3)

### 16.1 Cross-links (dates are never computed here)

Shubhvela's routes, read from `shubhvela/web/src/templates/*.mjs` on 2026-11-01: `/{lang}/panchang/{city}/` (e.g. `new-delhi`), `/{lang}/festivals/` and `/{lang}/festivals/{year}/`, `/{lang}/festival/{slug}/{year}/` (102 festival slugs in `packages/content/corpus/festivals/en.json`, e.g. `diwali`, `chaitra-navratri`, `pitru-paksha`, `tulsi-vivah`, `chhath-puja`), `/{lang}/vrat/{slug}/`, `/{lang}/muhurat/` and `/{lang}/muhurat/{activityId}/{yyyy-mm}/` (25 activity ids in `corpus/muhurat-activities/en.json`, e.g. `muhurat-marriage`, `muhurat-griha-pravesh`, `muhurat-mundan`, `muhurat-naamkaran`, `muhurat-engagement`, `muhurat-education-start`, `muhurat-vehicle-purchase`, `muhurat-business-start`, `muhurat-property-registration`, `muhurat-vrat-start`), `/{lang}/glossary/{id}/`. Shubhvela uses the same `hi`/`en`/`bho` prefixes, so Pandit Bano links language-to-language.

Design: `content/shubhvela-ids.json` holds the festival slugs, vrat slugs and muhurat ids copied from Shubhvela's corpus (with the copy date); occasion records reference them in `when.shubhvela`; the gate checks the ids (G20). The build emits **year-less, always-valid** static hrefs: muhurat → `/{lang}/muhurat/` index (the activity's card is on it; no fragment, since Shubhvela's cards carry no ids), festival → `/{lang}/festivals/`, vrat → `/{lang}/vrat/{slug}/` (year-less by design), panchang → `/{lang}/panchang/new-delhi/`. `app.mjs` upgrades them on load with the **device clock only** (not panchang computation): festival links become `/festival/{slug}/{currentYear}/`, muhurat links `/muhurat/{activityId}/{currentYYYY-MM}/`, both marked `data-sv="festival|muhurat"` so the enhancement is a one-line attribute rewrite; if Shubhvela has no page for that year/month the user lands on Shubhvela's own 404/redirect, which is Shubhvela's concern (its `redirect.mjs` handles language). The alternative — baking the build year into hrefs — was rejected because a static page built in 2026 would link to 2026 forever. All Shubhvela links carry `rel="external noopener"` and the external marker; the Home "आज की तिथि और मुहूर्त" panel is three such links plus the sentence "इस साइट पर तिथि की गणना नहीं होती". The namakarana nakshatra-letter table links Shubhvela's panchang page for "today's nakshatra" rather than computing it.

Shared vocabulary: UI and glossary spellings reuse Shubhvela's term bank where the same word exists (बियाह, बरत, जनम, नाँव, weekdays एतवार … सनिचर, months, दक्खिन; theme labels थीम/सिस्टम/हल्की/गहरी and थीम/सिस्टम/हलुक/गहिर) — `termbank.json#_meta.rules.shubhvelaWins` (R5 §4, decisions.md §9).

### 16.2 Font decision relative to Shubhvela (brief §2.3 requires the reason)

Shubhvela: display Tiro Devanagari Hindi, body Noto Sans + Noto Sans Devanagari, TTF with `font-display: swap` (R3 §7, S38). Pandit Bano **keeps the body pair** (Noto Sans + Noto Sans Devanagari, 17 → 22 px, line-height 1.65) so navigation, dates and shared terms look identical across the two sites, and **changes two things**: (1) the display/mantra face is Tiro Devanagari **Sanskrit**, not Tiro Devanagari Hindi, because Tiro Hindi has 0/42 Vedic Extensions and no complete IAST Latin (R3 §9.2) — a panchang never needs svara marks, a mantra site needs them on every page — while Tiro Sanskrit is the same Tiro/Indigo design with identical vertical metrics (755/−245) and क bounds, so the sites still read as one family (R3 §9.5); the owner's direction 2 then uses Noto Sans Devanagari 600 for headings and reserves Tiro Sanskrit for Sanskrit text, which is the "handbook" look he chose over the "pothi" look of direction 1 (design-pick.md); (2) delivery moves from TTF + `swap` to subset woff2 + `optional` with preload of the two first-paint faces, as brief §5.1 requires. Token names stay Shubhvela's (`--paper --surface --ink --ink-2 --hair --hair-strong --accent --accent-ink --accent-tint --good`) plus `--accent-2`, `--haldi`, `--on-haldi`, `--focus` (R3 §8 note; decisions.md §6), so the owner keeps one mental model.

---

## 17. SEO, i18n metadata and sharing

- `<html lang="hi|en|bho" dir="ltr" data-base data-lang data-page>`; `<title>` "{page} — {site name in page language}"; `<meta name="description">` from the lede (≤ 160 chars); canonical = `abs(route)`.
- `hreflang`: `<link rel="alternate" hreflang="hi">`, `hreflang="en"`, `hreflang="x-default">` (→ the Hindi URL) on every page in all three language variants, URLs absolute; **no `hreflang` for Bhojpuri** because Google supports only ISO 639-1 language codes and Bhojpuri has none (R4 §10, C43–C44; R5 §6, L3–L4); `bh` is deprecated and never used (R4 C42). Stated on the Verification page in all three languages and here. Sitemap `<xhtml:link>` likewise; `/bho/` URLs listed as ordinary `<url>` entries.
- Open Graph / Twitter: `og:title`, `og:description`, `og:type=article|website`, `og:url`, `og:image` (1200×630 from §11.7) + `og:image:alt`, `og:site_name`, `og:locale` `hi_IN`/`en_IN` only (omitted for bho — R4 §10 UNCERTAIN), `twitter:card=summary_large_image`.
- JSON-LD: `WebSite` (home) with `SearchAction` (→ `/{lang}/search/?q={search_term_string}`), `BreadcrumbList` on inner pages, `Article` for lessons/kathas/reference, `HowTo` for occasions (steps = `HowToStep` with the action text; no supply prices), `DefinedTerm` for glossary — all generated from the same data, with `inLanguage`.
- `robots.txt`: `Allow: /`, `Disallow: /_dev/`, `Disallow: /_reports/`, `Sitemap:` absolute. `404.html` has `noindex`.
- No third-party scripts, no fonts from CDNs, no embeds (R4 §6.2 "never add anything that changes this posture").

---

## 18. Accessibility (WCAG 2.2 AA — R4 §7; brief §5.1)

Binding items and how each is met: 1.4.3/1.4.11 contrast — tokens table + computed audit (UI-08/09); 1.4.4 — no `maximum-scale`, no `user-scalable=no` (the measured regressions of sefaria/srimandir, R3 §5 point 10); 1.4.10 reflow at 320 — audit UI-01; 1.4.12 text spacing — audit UI-27 applies the override and re-checks overflow and svara collisions; 1.4.13 — per-word meanings are static, FAQs are `<details>`; 1.1.1 — motifs `aria-hidden`, icon buttons named; 1.4.2 — audio user-initiated with Stop; 2.1.1/2.4.7 — every control a native `<button>`/`<a>`/`<input>`, visible 3-px focus ring; 2.4.11 — `scroll-padding-top`, sticky header only ≥ 820, rails never overlay content (audit UI-25 tabs through each page type and asserts the focused element's box is not fully covered); 2.5.7 — steppers, no sliders; 2.5.8 — ≥ 24 px targets, 40–44 px for controls (audit UI-06); 3.1.1/3.1.2 — `lang` on `<html>` and every Sanskrit/IAST/quoted span (audit UI-21 counts Devanagari text nodes outside `lang="sa"` that match a mantra record — must be 0; and `lang="sa-Latn"` on every IAST line); 3.2.6 — footer help order; 3.3.7 — sankalpa form remembers inputs; 4.1.2 — `aria-pressed`/`aria-checked`/`aria-current` on every custom state; headings — one `<h1>`, no skipped levels (audit UI-20); skip link; `aria-live` regions for theme label, voice state, quiz result, search count, toasts (`role="status"`). Screen readers get the svara-less `aria-label` on accented lines (R4 §7.3). Lighthouse accessibility 100 is necessary, not sufficient (R4 §7.3): the manual checks above are listed in each phase's verification report.

---

## 19. Error handling — per operation

| Operation | Failure condition | Recoverable? | What the caller / user gets | Logged where |
|---|---|---|---|---|
| Build: content load | Unreadable file, malformed JSON, missing front matter | Fatal | `build.mjs` exits 2 with `file:line:col` and the rule; CI red | stdout + `gate.json` |
| Build: gate FAIL | Any §10.7 FAIL | Fatal | exit 3; the full finding list; nothing written to `dist/` | stdout + `dist/_reports/gate.json` (written even on failure) |
| Build: gate FLAG | §10.7 FLAGs | Recoverable | listed, build continues; the integrate step copies FLAGs into the review pack | `gate.json` |
| Build: transliteration | sanscript leaves an unmapped character | Fatal | exit 3 with record id and the character's code point | stdout |
| Build: OG render | resvg throws / font missing | Recoverable | default per-type image; count in `build.json`; CI warns | `build.json` |
| Build: budget | page > 150 KB, data JSON > 300 KB, search index > cap, JS module > cap | Fatal in CI, warning locally | list of offenders with sizes | `build.json` |
| Build: Shubhvela ids | id missing from `shubhvela-ids.json` | Fatal (G20) | record path + id | `gate.json` |
| Runtime: localStorage denied | `setItem` throws (private mode, quota) | Recoverable | state kept in memory for this page; no message (the brief's "stored in this browser only" label stays true: nothing is stored) | `console.info` once |
| Runtime: SW registration fails | insecure context, unsupported, script error | Recoverable | site works without offline; Save-offline buttons hidden; Home shows no saved list | `console.warn` |
| Runtime: SAVE fails | fetch error for one of the URLs, quota | Recoverable | toast "सहेज नहीं सका (n/total)" with Retry; partial saves are rolled back (the SW deletes the partial set) | `console.warn` |
| Runtime: navigation offline, page not cached | — | Recoverable | `/{lang}/offline/` page: explanation, links to saved items (read from `pb-saved`), Home | — |
| Runtime: update available | new SW waiting | Recoverable | toast with "पुनः लोड करें"; dismissible; shown once per session | — |
| Runtime: voice | §8.3 | Recoverable | inline notes | `console.warn` |
| Runtime: search shard | fetch/parse error | Recoverable | message + Retry | `console.error` |
| Runtime: quiz with no answer selected | user clicks जाँचें with blanks | Recoverable | blanks counted as wrong, feedback "उत्तर नहीं चुना" per blank | — |
| Runtime: `IntersectionObserver` missing | very old browser | Recoverable | rails show no `aria-current`; links still work | — |
| Runtime: JS disabled | — | Recoverable | everything readable; theme light; IAST shown (the CSS default); rails are server-rendered as closed `<details>` (so phones get content first), each with a 44-px summary the user can open — at desktop widths they stay closed without JS, which is acceptable; verse tools show no ▶ (the buttons are rendered `hidden` and un-hidden by `voice.mjs`); quiz shows the answers under a `<details>` "उत्तर देखें" | — |
| CI deploy | Pages run fails | Fatal for the ship step | the ship step re-dispatches once (`gh workflow run`), then WARNING | GitHub Actions log |

Nothing in the client ever shows a stack trace or raw error string to the user; the strings above come from `content/ui`.

---

## 20. Hard UI rules as measurable acceptance checks (brief §5.1; run by `tools/audit.py` against `dist/` served locally; results to `dist/_reports/audit-<round>.json` and the verification report)

Widths W = {320, 360, 390, 820, 1024, 1440, 1920, 2560} (2560 at dsf 0.75); themes T = {light, dark}; languages: hi for all pages, en/bho for pages whose strings/layout changed (brief §8 speed directive); page set P = one page of every page type in §3.2. Each check states the measurement and the pass condition.

| # | Check | Measurement (in the browser) | Pass |
|---|---|---|---|
| UI-01 | No horizontal overflow | `document.documentElement.scrollWidth` vs `innerWidth`; plus every element's `getBoundingClientRect().right` ≤ `innerWidth + 1` for elements not inside `.table-wrap`/`.nav`/`.sections` | equal; 0 elements beyond |
| UI-02 | Gutters | computed `padding-inline` of `.container` at each W | = `clamp(16px, 3.5vw, 96px)` evaluated (16 at 320–457, 3.5 vw between, 96 at ≥ 2743 → 89.6 at 2560) ± 1 px |
| UI-03 | No container max-width below 2200 | for every ancestor of `main` content: computed `max-width` is `none` or ≥ 2200 px | true |
| UI-04 | Content box ≥ 88 % of innerWidth at ≥ 1920 | `main .layout` (or `.page` content wrapper) `getBoundingClientRect().width / innerWidth` | ≥ 0.88 (mocks measured 0.93) |
| UI-05 | Reading measure | every `.prose`, `.mantra`, `.lede`, `p` inside `.verse`: `clientWidth / (ch of its own font)` where ch is measured with a canvas using the element's computed font | ≤ 80ch (target 72) |
| UI-06 | Controls 40–44 px; targets ≥ 24 | every `button`, `a.btn`, `.seg a|button`, `input[type=checkbox|radio]` (24), `.rail nav a`, `.nav a` → `getBoundingClientRect().height` | buttons/links-as-buttons ≥ 40 and ≤ 48 (44 nominal); checkboxes/radios ≥ 22 visible with a ≥ 44-px row |
| UI-07 | Type floor and scale | smallest computed `font-size` of any visible text node; `body` font-size; `.mantra` font-size and line-height | ≥ 12 px; body 17 (±0.2) at 320–390, 22 at 2560; mantra = 1.35 × body (±0.3) and line-height ≥ 1.9 × (2.0 nominal) |
| UI-08 | Contrast (text) | for every visible text node: composite the actual background by walking ancestors (alpha-composited) and compute WCAG ratio against the computed `color` | ≥ 4.5 (≥ 3.0 for text ≥ 24 px or ≥ 18.66 px bold) |
| UI-09 | Contrast (non-text) | control borders, focus ring, chip borders, icon-only glyphs vs their background | ≥ 3.0 |
| UI-10 | No box intersections | inside every `.card`, `.step`, `li`, `.toolbar`, `.verse-tools`, `.head-row`: pairwise `getBoundingClientRect()` of element children that are not ancestor/descendant | 0 intersections (allowing 1-px touch) |
| UI-11 | Stateful controls show state in both T | language `aria-current`, theme label text, translit `aria-checked`, voice `aria-pressed`, checklist `:checked`, rail `open`: assert the attribute AND a computed-style difference (background or border or text) vs the unselected sibling | both present |
| UI-12 | Light first paint | fresh context (no storage): `getComputedStyle(html).backgroundColor` == light `--paper` before any script finishes (`page.evaluate` at `domcontentloaded`) and `data-theme="light"` | true |
| UI-13 | Theme persistence | set `pb-theme=dark`, reload: `data-theme=dark` and `--paper` dark before first paint; set `system` + emulate dark → dark tokens | true |
| UI-14 | Reduced motion | `reduced_motion="reduce"`: no element has a `transition-duration` > 0 or `animation-name` ≠ none | true; and with `no-preference` all durations ≤ 250 ms |
| UI-15 | Each fact once | per page: the `<h1>` text does not appear as a whole in any other heading/breadcrumb/meta element; only one `<h1>` | true |
| UI-16 | No empty hero halves at 1920/2560 | each direct child of `.hero` has `clientHeight` ≥ 120 px and non-empty text or an SVG | true |
| UI-17 | Grids fill the wide column | at ≥ 1440 every `.grid` has ≥ 3 columns (`grid-template-columns` resolved) or is marked `data-grid="list"` deliberately; last row not more than 50 % empty when item count ≥ 8 | true |
| UI-18 | Rails present at ≥ 1440 on reading pages | `.layout.has-both` resolves to 3 columns; rails `open` | true |
| UI-19 | Named sources are links | DOM: every text run matching a title from `sources.json#titles[]` or an institution name from `content/institutions.json` inside `main` is within an `<a>` | 0 unlinked |
| UI-20 | External links marked | every `a[href^="http"]` not on `SITE_ORIGIN` has `rel~=external` and the marker icon (or sr text) | 0 unmarked |
| UI-21 | Language of parts | every text node containing Devanagari that equals a mantra record's text is inside `[lang="sa"]`; every `.iast`/`.roman-easy` has `lang="sa-Latn"`; `<html lang>` ∈ {hi, en, bho} | 0 violations |
| UI-22 | Devanagari rendering | `_dev/fonts.html` at 390/1440 both T: `document.fonts.check('23px "Tiro Devanagari Sanskrit"', s)` true for every mantra test string and the body face for body strings; a shot per theme is read by the step and `fonts.md` records conjuncts/marks/no tofu | all true; shot reviewed |
| UI-23 | Fonts self-hosted and optional | after `document.fonts.ready` on a second (warm-cache) load: all 5 faces `status=loaded` from `BASE_PATH/fonts/`; `@font-face` `font-display: optional`; preload links for the two faces present in `<head>` | true; 0 cross-origin requests in `page.on('request')` |
| UI-24 | Zero third-party requests | `page.on('request')`: every URL is same-origin (localhost in the audit, the Pages origin live) | 0 |
| UI-25 | Focus not obscured | Tab through the page at 390 and 1440 (up to 300 stops): the focused element's rect intersects the viewport and is not fully covered by `.site-head` or a sticky rail (`elementFromPoint` at rect centre is the element or its descendant) | 0 failures |
| UI-26 | Print / pothi | `page.emulate_media(media="print")` on a pothi page: `.pothi-bar` hidden; each `.pothi-step` `break-after: page`; mantra ≥ 14 pt (18.67 px) | true |
| UI-27 | Text spacing (1.4.12) | inject the WCAG text-spacing override; re-run UI-01, UI-10 and a svara collision check (consecutive `.mantra` line boxes: `getClientRects()` of inline spans do not overlap vertically) | pass |
| UI-28 | No orphan danda / number | for every `.mantra`, `.iast`: `Range.getClientRects()` of the terminal `।`/`॥`/`||`/number spans — the span's rect top equals the rect top of the preceding word's last glyph | 0 orphans |
| UI-29 | 12-px floor sweep across all pages (ship steps) | crawl `dist/**/index.html` at 390: min font-size | ≥ 12 px |
| UI-30 | 320 overflow sweep across all pages (ship steps) | crawl at 320: UI-01 | 0 |
| UI-31 | Payload budgets | `dist` sizes: HTML+CSS+JS per page ≤ 150 KB uncompressed excluding data JSON and fonts; data JSON per page ≤ 300 KB | true (also enforced by the build) |
| UI-32 | Lighthouse (live, three pages: home, occasion, chapter) | mobile preset | perf ≥ 95, a11y 100, BP 100, SEO 100; real numbers recorded |

The mock audit already shows the system meets UI-01, 04, 05, 06, 07, 10, 23 at all eight widths (design-pick.md "Measured facts"); the production audit re-measures on the real pages. Every FEAT's acceptance commands include the subset of UI-* that its pages touch (brief §8: audit only changed pages; one 2560 light shot per new layout).

---

## 21. External inputs and their validation

The site has no server, so "external input" means: content files (authored by agents, validated by the gate — §10.7, §10.9), browser storage values, URL query strings, `postMessage` payloads to the service worker, and Shubhvela/GitHub URLs.

| Input | Required? | Type / limits | On failure |
|---|---|---|---|
| `localStorage` `pb-theme` | optional | one of `light|dark|system` | ignore → `light` |
| `pb-lang` | optional | one of `hi|en|bho` | ignore → `hi` |
| `pb-translit` | optional | `iast|easy|off` | ignore → `iast` |
| `pb-rate` | optional | number string, 0.5–1.5 step 0.1 | clamp; non-number → 0.9 |
| `pb-repeat`, `pb-font-pct` | optional | `0|1`; integer 80–160 | default / clamp |
| `pb-check:*`, `pb-saved`, `pb-quiz:*`, `pb-sankalpa` | optional | JSON; arrays of ids matching `^[a-z0-9-]{2,64}$`, ≤ 200 entries; strings ≤ 80 chars | `JSON.parse` in try/catch; invalid → treated as empty and overwritten on next write |
| Search `?q=` | optional | string, trimmed, ≤ 100 chars, NFC | longer → truncated; always HTML-escaped when echoed; never used as HTML or in `innerHTML` |
| Sankalpa form fields (gotra, name) | optional | ≤ 60 chars each, any script; inserted via `textContent` | stored only on explicit "याद रखें" |
| SW `postMessage` | — | `{type ∈ SAVE|UNSAVE|SKIP_WAITING, id?, urls?}`; `urls` must be same-origin, under `BASE_PATH`, ≤ 400 entries, each ≤ 300 chars; `id` pattern as above | message ignored; `{type:"ERROR", reason:"bad-request"}` replied |
| SW fetch events | — | only same-origin GET is handled; others pass through | — |
| Build env `BASE_PATH`, `SITE_ORIGIN` | optional | `BASE_PATH` must start and end with `/`; `SITE_ORIGIN` `https://` no trailing slash | build exits 2 with a message |
| Shubhvela ids in content | required when `when.shubhvela` present | present in `content/shubhvela-ids.json` | gate FAIL G20 |
| Markdown links | — | relative links must resolve (G12); external must be `https:` (allow-list for `http:` government sites) | gate FAIL |

No `innerHTML` with any user-derived string anywhere; templates on the client use `textContent`/`createElement`.

---

## 22. Invariants and who enforces them

| Invariant | Owner layer | Why there |
|---|---|---|
| Devanagari is the single source of truth; IAST/easy-Roman are derived | build (`translit.mjs`); gate forbids authored `iast` keys (unknown-key rule) | one converter, deterministic, testable; authors cannot drift |
| Every mantra/verse has a source with URL | gate G4 | content-time check is cheapest and blocks before render |
| Every trilingual field has hi/en/bho | gate G2 | same |
| Light is the first paint; dark only via persisted choice | tokens.css default block + head script + UI-12 audit | CSS default = light, script only upgrades; the audit proves it in a fresh context |
| No colour literal outside `tokens.css` | unit test (grep) | catches drift at commit time |
| No third-party request at runtime | build (no external URLs in `<link>/<script>/<img>` templates — a test greps `dist/`) + UI-24 audit | two layers because the risk is high (brief §1) |
| No deity figure / sacred motif in forbidden places | design review of SVG assets (every SVG in `assets/` is listed in `assets/MOTIFS.md` with its description); template test that footer/404/offline/destructive controls contain none of the motif symbol ids `m-*` or `i-om` | the rule is semantic; the id check makes the mechanical part testable |
| Each fact once per page | templates (breadcrumb excludes current; meta row never repeats the title) + UI-15 | structural, so template-level |
| Danda/number never orphaned | build `joinDanda` + unit test + UI-28 | the browser is the only place a line break is known |
| Reading measure ≤ 72–80ch | CSS `--measure` on every prose/verse container + UI-05 | CSS enforces; audit proves per font |
| Counts are computed | templates take counts only from `counts`; G17 lints prose | brief §1 |
| Honesty frame on efficacy statements | gate G14 + content rules doc | lint seeds from R4 §5.4; human review for FLAGs |
| Bhojpuri register | gate G9/G10 | R5 lists are machine-checkable |
| Route ↔ precache classification complete | unit test over `routes.mjs` | brief §7 "every new page type must be added" |
| `lang` on every Sanskrit span | verse renderer (`lang="sa"` hard-coded in the component) + UI-21 | only the renderer emits mantra HTML |
| Pothi/print has no chrome | pothi template has no header/footer include; UI-26 | — |
| Saved-offline sets are complete or absent | SW SAVE handler (all-or-nothing with rollback) | partial sets would show broken pages offline |

---

## 23. Budgets

- Per page: HTML + CSS + JS ≤ **150 KB** uncompressed excluding data JSON and fonts (brief §7); target ≤ 90 KB for an occasion page (the Vivah mock HTML is 54 KB; CSS 30 KB; JS ≤ 25 KB). Data JSON per page ≤ **300 KB** (search `index.json` is the only per-page JSON; chapter pages embed their verses in HTML and load no JSON).
- Fonts total ≤ **450 KB** (Tiro ≈ 213 KB; Noto Sans Devanagari 61 + 65 KB; Noto Sans Latin subsets ≤ 40 + 40 KB).
- Search per language: `index.json` ≤ 300 KB; per-type shards ≤ 300 KB each.
- Service worker precache ≤ 2 MB (static shell); saved occasions capped at 60.
- Lighthouse mobile: perf ≥ 95, a11y 100, BP 100, SEO 100 on home, an occasion page, a chapter page (brief §7); LCP element is the `<h1>` or first verse (text), so the font strategy dominates perf — `optional` + preload keeps LCP ≤ 2.5 s on the Lighthouse mobile profile (bhagavadgita.com reaches similar metrics with Tiro Sanskrit at 24 px — R3 S19, as reference not proof).
- Build time ≤ 90 s for the full corpus on the CI runner (OG rendering is the slow stage; it runs only for pages whose title hash changed, cached in `dist/og/manifest.json` → in CI there is no cache, so OG render is parallelised with `Promise.all` in batches of 16).

---

## 24. Testability

**Unit (node --test, fast, no browser):** `translit` fixtures and round trip; `stripSvara`; `joinDanda`; Markdown subset (golden files); `deva-norm` (search normalisation shared with the client — a test asserts the two copies are byte-identical); validators (one failing fixture per rule); gate rules G1–G21 (fixtures under `test/fixtures/content-bad/`); `tokens.css` dark and `system` blocks byte-identical and no colour literal elsewhere; route table completeness (every route type has `precache`, `sitemap`, `pageType`); `href()`/`abs()` with both `BASE_PATH` values; `hreflang` set per page (hi, en, x-default only; never bho/bh); template escaping; counts; attribution-line patterns for each `project`; UI-string key parity; colour-literal grep; font licence files present; `MOTIFS.md` ↔ sprite ids; the sitemap/robots generators; manifest validity (no `id`, relative `start_url`); precache list ⊆ `dist` files.

**Integration (node --test + fs, after `npm run build`):** every `href`/`src` in `dist/` resolves; every page has exactly one `<h1>`, canonical, three `hreflang` links, `lang`; every mantra `<p class="mantra">` has `lang="sa"` and (if svara) `aria-label`; no page exceeds budgets; `sw.js` precache list matches files; search `index.json` parses with `MiniSearch.loadJSON`; each occasion page contains its samagri JSON for the offline button; the Devanagari test page exists.

**Browser (venv Playwright, `tools/audit.py`):** UI-01…UI-32 as scheduled by brief §8 (changed pages per step; full sweeps in phase fixers and ship steps); offline test (§13.3) in Phase 3; voice test limited to: button exists, no `hi-IN` voice in headless → the honest note appears (headless Chromium has no voices, which exercises the fallback path — the positive path is NOT VERIFIED automatically and is listed as such).

**Not automatically verifiable (listed in every verification report):** the actual sound of the `hi-IN` voice; the yellow-cast perception on specific LCDs; Google's indexing of `/bho/` without `hreflang`; Lighthouse numbers before the first live deploy.

---

## 25. Phase mapping of this design (what the planner slices)

- **Phase 1 (FEATs):** generator + route table + templates + tokens/site.css + head script + `app.mjs` (theme, language, rails) → content model + validators + gate G1–G21 → verse renderer + translit + voice + reading settings → occasion page + samagri checklist + tracker + pothi + print → mantra/text/chapter/katha/lesson/quiz/glossary/reference/static templates → search page shell (engine Phase 3) → PWA (manifest, SW, save offline, update toast, offline page) → SEO files + OG → `tools/audit.py` → fonts (subsetting, `fonts.md`, dev page) → CI workflow. Content lanes per decisions.md §3.1.
- **Phase 2:** content only (decisions.md §3.2) plus any template additions the new record types need (regional appendix pages reuse `occasion`; long texts reuse `chapter`); no new page types expected — if one appears, it is added to the route table, precache rules and the audit set (brief §7).
- **Phase 3:** search engine + shards, Learn 3–4, pronunciation polish (voice name display, chunking, Repeat), full pothi (all occasions), offline Playwright test, completeness tests, final audit, docs (`FINAL-REPORT.md`, `OWNER-TODO.md`).

---

## 26. Assumptions, open items and owner to-dos carried forward

Assumptions made here (the design review may challenge them): language-neutral slugs (§3.1); year-less Shubhvela hrefs upgraded by the device clock (§16.1); `minisearch` and `@resvg/resvg-js` as the two runtime-free build/vendor dependencies beyond sanscript (§2); the ≤ 40-verse chapter part size (§7.8); theme cycle order light → dark → system (mocks decision 6); `optional` font display accepted with the first-visit fallback (§6.2); the print courtesy line shipped by default as a droppable string (§15).

Open items from the research that touch the design (none blocks Phase 1): ḹ count at build (decisions.md §12 item 12); U+0953/0954 fallback counted by the gate (§10.9); Wikimedia Commons recordings for Phase 3 (decisions.md §12 item 13); WCAG 2.2 items not fetched (2.4.12, 3.3.9 — AAA, non-binding; R4 C33); `og:locale` for Bhojpuri (omitted — R4 §10).

Owner to-dos restated for `OWNER-TODO.md` (not blocking): the 27 word choices of R5 §7 (fallbacks in use are the "Recommendation" column); site licences (code MIT, own prose CC BY-SA 4.0, mantra fields Public Domain Mark — R4 §13, decisions.md §12); keep or drop the print courtesy line; buy panditbano.com/.in/.org; optional sanskritdocuments/AWGP e-mails (now moot for reproduction after brief §14, still courteous).

---

## Appendix A — mock artefacts this design is measured against

- Chosen direction: `c:\Users\sudiskmr\Downloads\DomainClassification\panditbano\.agents\tasks\v1-build\design-mocks\d2\{home,vivah,vivah-bho,vivah-en,gayatri,chapter,katha,learn,pothi}.html`; tokens `design-mocks\assets\tokens-d2.css` (→ `assets/css/tokens.css`), `design-mocks\assets\base.css` (→ `assets/css/site.css`, with the changes noted in §5.2 external marker and §5.1 print tokens), `design-mocks\assets\app.js` (→ split into the modules of §12), `design-mocks\mock_shell.py` (header/footer/verse HTML structure and the UI strings → `content/ui/*.json`), `design-mocks\shoot.py` (→ `tools/audit.py`).
- Shots: `…\v1-build\shots\mocks-d2-<page>-<light|dark>-<390|1440|1920|2560>.png` and `mocks-d2-<vivah|gayatri|chapter|katha|learn>-detail-light-<390|1440>.png`; audit `design-mocks\audit.json`.
- Research: `research\decisions.md` (§5 fonts, §6.2 palette, §4 transliteration, §8 language tags, §11 UI conclusions), `research\R3-benchmark.md` (§2–§5 measurements, §8.4 palette tables, §9 font proofs), `research\R4-legal.md` (§5 wording, §6 privacy, §7 WCAG, §8 sensitivity, §9 OFL, §10 hreflang), `research\R5-language.md` (§4 register, §5 display name, §6 tags, §7 owner questions, §10 hand-off).

## Appendix B — UI string keys the templates require (seeded from `mock_shell.py#UI`)

`site.name`, `site.tagline`, `nav.{learn,occasions,texts,kathas,glossary,search,home}`, `theme.{label,light,dark,system}`, `lang.label`, `lang.{hi,en,bho}.{long,short}`, `voice.{listen,stop,note,none,speed,repeat,speaking,failed,name}`, `translit.{label,iast,easy,off}`, `pothi.{label,save,saved,print,back,size}`, `offline.{saved_list,remove,quota,failed,retry,update,reload,offline_title,offline_body}`, `storage.note` ("केवल इसी ब्राउज़र में सहेजा गया"), `svara.{on,off}`, `verse.{says,action,meaning,explain,pada,vinyog,note,source,variants,phalashruti}`, `layer.{vedic,paddhati,lok}`, `occasion.sections.{intro,when,roles,samagri,vidhi,variants,faq,sources}`, `samagri.{clear,clear_confirm,print,must}`, `quiz.{check,result,unanswered,show_answers}`, `search.{label,placeholder,none,count,load_failed}`, `foot.{about,sources,corrections,privacy,sections,more,shubhvela,note_hi,note_translation,licences,print_courtesy}`, `honesty.{tradition,no_dates,health_note,grief_note,astrology_note}`, `ext.label`, `skip.label`, `notfound.{title,body}`, `shubhvela.{panchang,festivals,muhurat}`, `counts.{occasions,mantras,verses,terms,chapters}`. Bhojpuri values use the -ीं imperatives (सीखीं, खोजीं, सुनीं, रोकीं, छापीं, सहेजीं) and the Shubhvela theme labels (R5 §10).



## §27 ORCHESTRATOR DECISIONS — 2026-10-31, after the mock review (BINDING; wins over earlier sections; the code reviewer must not reject work for following this section, and must reject work that ignores it)

The owner picked direction 2 (Haldi–Chandan). The orchestrator reviewed the d1/d2 shots at 390/1440/2560 in both themes before design.md existed; these five findings were not delivered to the mock step and are now mandatory implementation items for FEAT-105…110, the 1a fixer and every later template change. Each has a measurable acceptance check that `tools/audit.py` or a unit test must prove.

1. **Mantra line breaks at the danda, never mid-pada.** In every mantra/verse block (`.mantra`, chapter verses, pothi mode, step mantras) the Devanagari is rendered one pada per line: the renderer splits on `।` and `॥` (keeping the danda at the end of its line) and emits `<br>` or one `<span class="pada">` per segment; the IAST/easy-Roman line mirrors the same segmentation (`|` / `||`). A pada longer than the measure may wrap, but a line never starts with a danda and the mock's "…जरदष्टिर्यथासः । भगो अर्यमा / सविता…" pattern (break after the first word of the next pada) must not occur. Test: a unit test over 20 fixture mantras asserts that every rendered line ends with `।`, `॥` or the end of a pada and that no line begins with `।`/`॥`. Verse numbers are rendered in Devanagari digits in hi/bho (`॥ ३ ॥`) and in the page language's digits in en (`|| 3 ||`), never mixed scripts inside one marker.
2. **Hero at ≥ 1920 has no dead gap.** On the home hero the gap between the text column and the illustration panel must be ≤ 96 px at 1920 and 2560 (mock d1/d2 showed ≈ 480 CSS px of empty paper at 2560). Acceptable solutions: the illustration panel grows to meet the text column; or the hero gains a third element in the gap (the "today" strip with Shubhvela links, or the search field with example queries) — not by widening the text measure beyond 80ch. Audit: at 1920 and 2560, `rect(illustration).left − rect(textColumn).right ≤ 96` (or the third element fills it with ≤ 48 px gutters each side).
3. **Group cards at ≥ 1920 are not mostly empty.** The "अवसर — समूह" grid is 4 columns at ≥ 1920 (3 at 1440, 2 at 820, 1 at 390) and each card shows, besides the title and count, up to 4 example-page chips (real page titles from the data, as links) so that ≥ 55 % of the card's inner width carries content at 1920/2560. Audit: measure the union width of text/chip boxes in each card ÷ card inner width ≥ 0.55 at 1920 and 2560.
4. **No pagination dressed as progress.** The chapter rail's "10 में से 5 मंत्र इस पृष्ठ पर" with a green bar is removed. If a chapter is paginated, show "मंत्र 1–5 · कुल 10 · अगला पृष्ठ →" as text + link (hi/en/bho strings), no bar. A bar is allowed only for a quantity that is actually progress (quiz score, reading position computed from scroll, offline download progress) and is labelled as such.
5. **Pothi/handbook mantra blocks state what is missing.** When `svara: false`, the per-block note "स्वर चिह्न नहीं दिखाए गए" (already in the mock) stays, but as a visible text node (not only a visually-hidden span — the design-review MEDIUM about `aria-label` is satisfied by the visible text plus a normal `<p>`); when the chapter has svara marks, the "स्वर चिह्न" legend rail (mock d1 chapter) appears on every page that renders svara-marked text, including occasion step pages.

Also binding, from the 2560 review of both directions: the sticky header's motif band (jaali/toran) must not overlap content in the scrolled state beyond the header's own box (set the band inside the header's height; content scrolls under the header, never under a band that hangs below it). Audit: at 1440 scrolled to the 13th vivaha step, no content box intersects the band's box.

---

## Deviations and notes

### Design-review items (0 HIGH, 6 MEDIUM, 11 NIT — `design-review.json`, 2026-11-01) and where each is implemented

| # | Finding (short) | Implemented in | Proof |
|---|---|---|---|
| MEDIUM 1 | Shubhvela muhurat ids are the 14 engine ids (no prefix); festival/vrat slugs copied from Shubhvela | FEAT-104: `tools/shubhvela-ids.mjs` → `content/shubhvela-ids.json` (14 muhurat / 102 festival / 12 vrat ids with the copy date); gate G20 fails an unknown id | `test/unit/shubhvela-ids.test.mjs`; live-check of Shubhvela hrefs at ship |
| MEDIUM 2 | resvg mis-shapes Devanagari text — text layers via sharp/libvips (Pango) with the repo TTFs | FEAT-109: `build/og.mjs` (sharp text layers + resvg geometry; `fontProbe()` records `og.fontMatched`, false is a fatal budget violation) | `test/unit/og.test.mjs`; OG PNGs read after the dimension check (FEAT-109 findings) |
| MEDIUM 3 | OG count/size/time budget; own image only for the listed page types | FEAT-109: route `og: "own" \| "type-default"` (`build/lib/routes.mjs`), `OG_BYTES_BUDGET` 60 MB / `OG_SECONDS_BUDGET` 45 s in `build/og.mjs`, palette PNGs | `build.json#og`; `test/integration/budgets.test.mjs` |
| MEDIUM 4 | No `aria-label` on `<p class="mantra">` — hidden accented `.deva` + visible-to-AT `.sr` twin | FEAT-105: `build/templates/components/verse.mjs` (`data-plain`, `.deva[aria-hidden]`, `.sr` iff svara) | `test/unit/verse.test.mjs`; `test/integration/mantra.test.mjs`; Playwright accessibility snapshot (FEAT-105 findings) |
| MEDIUM 5 | Saved-offline sets survive a deploy — per-set manifests `{id, hash, bytes, urls}`, stale refresh on activate | FEAT-106 (`#pb-offline-urls` per occasion/part/pothi page, `build/lib/offline.mjs`) + FEAT-109 (`assets/sw-template.js` pb-saved cache, `assets/js/offline.mjs`) | `test/unit/sw.test.mjs`, `test/unit/pothi.test.mjs`; `test/integration/offline-manifest.test.mjs`; two-build offline test in Phase 3 (`tools/offline-test.py`) |
| MEDIUM 6 | Search page exists from Phase 1 in browse mode; no `<input>`, no `[data-search]`, no SearchAction while `features.search` is false | FEAT-108: `build/templates/pages/search.mjs`; FEAT-102 `build/config.mjs` flag; FEAT-109 JSON-LD | `test/unit/search-shell.test.mjs`; audit `[data-search]` null on every page type |
| NIT 7 | Type/space/radius tokens live in `tokens.css` | FEAT-102 `assets/css/tokens.css` | `test/unit/tokens.test.mjs` |
| NIT 8 | Head script validates `pb-translit` (iast/easy/off) and `pb-theme` | FEAT-102 `build/templates/layout.mjs#HEAD_SCRIPT` (≤ 400 B) | `test/unit/head-script.test.mjs` |
| NIT 9 | UI-06: ≥ 40 px for every control; ≤ 48 px only for single-line controls | FEAT-103 `tools/audit.py` UI-06 | audit reports |
| NIT 10 | UI-22 glyph coverage by canvas `measureText` comparison, not `document.fonts.check()` | FEAT-103 `tools/audit.py` UI-22 on `_dev/fonts.html`; `fonts.md` | `fonts.md`; audit UI-22 |
| NIT 11 | `#i-auto` icon for the system theme state | FEAT-101 `assets/sprite.svg`; FEAT-102 theme button | `test/unit/templates.test.mjs`; audit UI-11 |
| NIT 12 | Footer says "this site collects no data" + Privacy link; GitHub IP logging stated on the Privacy page | FEAT-102 UI strings `foot.privacy_line`; FEAT-108 Privacy page (R4 §6.3 sentences) | `test/unit/ui-strings.test.mjs`, `test/unit/static.test.mjs` |
| NIT 13 | Latin digits in UI text (accessible names, counts); Devanagari digits only inside Sanskrit text | FEAT-105 `num()` / verse numbering; `assets/js/voice.mjs` names | `test/unit/verse.test.mjs`, `test/unit/ui-strings.test.mjs` |
| NIT 14 | On a gate FAIL only `dist/_reports/gate.json` is written | FEAT-104 `build/gate.mjs#writeReport`; `build/build.mjs` | `test/unit/gate.test.mjs` (CLI exit 3, gate.json written) |
| NIT 15 | Voice test branches on `getVoices()` and records which path ran | FEAT-103/105 `tools/audit.py` UI-33 | audit reports (FEAT-105 findings) |
| NIT 16 | Latin subset ranges for `pyftsubset` recorded | FEAT-101 `tools/fonts.py`, `fonts/README.md` | `test/unit/fonts.test.mjs`; `tools/fonts-check.py` |
| NIT 17 | Three per-language manifests = three installable apps; distinct `short_name`; lesson ids never start with `level-` | FEAT-102/109 `build/pwa.mjs`; `build/lib/routes.mjs#isLessonId` | `test/unit/manifest.test.mjs`, `test/unit/routes.test.mjs` |

### Planner additions to the content model (plan.md §2.5, binding since 2026-11-01)

- **`textRefs`** on occasion steps: `[{text, chapter}]` lets a step say "recite Rudrashtadhyayi adhyaya 5" without duplicating verse records as mantras (gate G5 resolves them against published chapter files; FEAT-106 renders "पाठ: <text> — अध्याय n" links).
- **`lang` per text** (`sa` default, `awa` for Tulsidas, `hi` for modern aartis / chalisas / vrat kathas) and **`verseKind`** per verse (shloka / chaupai / doha / soratha / chhand / stanza / sutra): the verse renderer emits the text's `lang` on the mantra paragraph and the audit's UI-21 checks accordingly.
- **`{{verse:<textSlug>-<n>-<v>}}`** in the Markdown subset for katha retellings (FEAT-107 renders a collapsible मूल श्लोक panel; an unresolved id fails the build).
- **`CONTENT_DIR`** (env) / **`--content`** (CLI, brief §15) selects the corpus so the test suite runs on `test/fixtures/content-sample/` while the real `content/` grows; `DIST` / `--dist`, `BASE_PATH` / `--base-path`, `SITE_ORIGIN` / `--site-origin`, `CI` / `--ci` likewise.
- **Manifests**: three per-language `/{lang}/manifest.webmanifest` files without `id` (three installable apps with distinct `short_name`), as design-review NIT 17 asked to be stated explicitly.
- **Review packs** are committed under `docs/review/<item-id>-{bho,hi}.md`; everything else under `.agents/` stays gitignored.

### Running list (one entry per deviation, appended by the build step that made it)

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
- **FEAT-105 · the mantra paragraph carries no `aria-label`** (design §7.1/§7.3 wrote one; design-review MEDIUM 4).
  `<p class="mantra" data-plain="…">` holds `<span class="deva" aria-hidden="true">` (accented, one `<span class="pada">`
  per line) and `<span class="sr" lang="…">` with the svara-less text; `.sr` is `user-select: none`, so the accessibility
  tree reads the plain string and a copy carries the accented text once (Playwright proof in the FEAT findings). When
  `svara: false` the `.deva` is not hidden and no `.sr` is emitted (the text is already plain).
- **FEAT-105 · rail card headings are `<h2 class="rail-h">`, not `<h3>`** as in the mocks, so the heading order stays
  h1 → h2 in DOM order (the left rail precedes the content; axe `heading-order` would flag h1 → h3). `.rail .rail-h` is
  styled exactly like `.rail h3`.
- **FEAT-105 · verse numbering.** `॥ n ॥` is added only to a text that ends with `॥` and carries no number yet; `n` comes
  from an explicit option or from a `vs-a-b` / `pgs-k-k-s` / `rv-m-h-v` id (never from a range id). hi/bho use Devanagari
  digits, en uses Latin digits in the Devanagari marker; the IAST/easy marker is always `|| n ||`. A half-verse ending in
  `।` is left as written.
- **FEAT-105 · source line vs. #sources.** Under the verse `<p class="src">` shows the label, the linked human title
  (`sources.json#titles[]` in the page script, else the registry title) and the locator; the full attribution lines
  (W/S/G/V/B/T) sit once in `#sources`. In an attribution line the quoted title (W/S), the registry title (B/T) or the
  phrase before the URL (V) becomes the link and the parenthesised URL is dropped from the visible text (the `href`
  carries it); licence URLs become `rel="external license noopener"` links.
- **FEAT-105 · the group list in the left rail shows titles only** (one line, 40-px rows; the mock listed incipits). An
  incipit (first words, svara-less, `lang="sa"`) is used only for a record without a title; the index cards show title +
  incipit + locator.
- **FEAT-105 · voice.mjs resolves the voice at module start**, not at the first click, so the reading-settings card can
  show "आवाज़: … (लगभग)" without a click; it still waits for `voiceschanged` up to 1.5 s. The ▶ buttons are rendered
  `hidden` and un-hidden by the module (no `speechSynthesis` → they stay hidden and the card shows the note once).
- **FEAT-105 · the ⚙ link is `#i-settings`** (new sprite symbol, listed in `assets/MOTIFS.md`); it sits right after
  the ▶ button so the two controls stay on one line while the svara flag and voice note wrap.
- **FEAT-105 · vinyog links point at `/{lang}/occasions/{slug}/{part}/#step-{n}`** (`{part}/` only for multi-part
  occasions). FEAT-106 must give every `.step` the id `step-{n}`.
- **FEAT-105 · `tools/audit.py` fixes.** stdout/stderr are reconfigured to UTF-8 (a Devanagari h1 in a UI-15 measure
  aborted the run under cp1252); the UI-27 svara-collision check now measures the rects of the text nodes inside
  `.mantra .deva` (the clipped `.sr` box and the block-level `.pada` spans produced false collisions).
- **FEAT-106 · step titles are derived from the action.** The schema has no step title: the `<h3>` (and the tracker / pothi
  locator) is the text before the first ` — ` of the action (“पवित्रीकरण — पंडित…” → “पवित्रीकरण”, the rest is the action
  prose); a dash-less action ≤ 80 chars is the title alone; a longer one gets a ≤ 72-char head and keeps the full prose.
- **FEAT-106 · `important` steps**: haldi fill on the number chip + a 4-px haldi left rule + a “मुख्य चरण” `chip-haldi`, not
  a haldi card fill (accent text on haldi is 3.5:1, below AA). `chip-haldi` borders are `--hair-strong` (haldi on surface
  is 1.6:1, below UI-09).
- **FEAT-106 · samagri card markup**: `<details class="rail-fold card samagri" id="samagri" data-checklist>` (folded on phones
  like the left rail); each row is `input + div.item (label[name, qty] + note + search link)` so the note and the
  `rel="external noopener nofollow"` search link sit under the label; the strike-through rule is `input:checked + .item`.
- **FEAT-106 · when + roles** sit in a `.pair` (2 columns from 820 px), not a `.grid`, so UI-17's ≥ 3-column rule stays
  meaningful for real grids.
- **FEAT-106 · Save-offline buttons** (page head and pothi bar) are rendered `hidden`; FEAT-109's offline.mjs registers
  `window.pb.offline` and un-hides them (pothi.mjs already delegates `click` → `offline.save(button)`).
- **FEAT-106 · vinyog on an occasion page** lists only the OTHER occasions that use the mantra (the current step is the use).
- **FEAT-106 · PGS I.8.11–13**: rendered from the corpus record `pgs-1-8-11-13` when it exists, else from a built-in copy of
  the mock's Wikisource text with the meaning in `occasion.sutra_meaning`; the block id is `sutra-pgs` (an `m-…` id would
  trip the motif-reference test). The block appears only when the occasion has `variants[]`.
- **FEAT-106 · reading-settings card** appears in the right rail only when the page renders a verse (the base route of a
  multi-part occasion has none); the svara legend only when a verse has `svara: true` (§27 item 5).
- **FEAT-106 · tracker.mjs** skips targets inside a sticky rail when choosing the `.sections` chip with
  `aria-current="location"` (the samagri card is always in view at ≥ 1024 and would otherwise always win).
- **FEAT-106 · part routes**: `<h1>` is “{occasion} — {part}”, the breadcrumb adds the occasion (an ancestor),
  `<link rel="prev|next">` in the head plus a visible pager; the base route of a multi-part occasion shows the parts list
  (step counts) instead of step cards.
- **FEAT-106 · offline manifest bytes** are computed from the rendered output in a fixed-point loop (the manifest sits inside
  the HTML it measures); `urls` include the modules of the occasion, part, pothi AND mantra page types.
- **FEAT-106 · pothi A−/A+** sets `--pothi-scale` on `<html>`; only the `.pothi-step` sizes use it (body font-size stays the
  design scale, so UI-07 holds), range 80–160 % in steps of 10, persisted as `pb-font-pct`.
- **FEAT-106 · `.sources li` / `.src` get `overflow-wrap: anywhere`**: a long Internet Archive item id in an attribution line
  overflowed 390 px under the WCAG text-spacing override (UI-27) on every page with that source.
- **FEAT-107 · build and gate paths are CLI flags** (brief §15, 2026-11-01): `node build/build.mjs --content <dir> --dist <dir>
  --base-path </x/> --site-origin <https://host> --ci` override the environment for that process only (flags are read only
  when `build/build.mjs` is the running script, so tests and tools keep their own argv); `node build/gate.mjs --dist <dir>`
  chooses where `gate.json` goes. Persistent `$env:` variables are no longer used by any step (see docs/CONTENT-RULES.md §10).
- **FEAT-107 · chapter `<h1>` is the chapter title**, not “{text} · अध्याय n” as in the mock: the text title is the breadcrumb
  ancestor (each fact once, UI-15) and a Satyanarayan chapter titled “प्रथम अध्याय” would otherwise read twice. The page
  `<title>` keeps “{text} · {chapter} · पृष्ठ k/n”.
- **FEAT-107 · verse navigator targets are 40 px** (the design's “28-px targets”): UI-06 requires every `.rail nav a` to be
  40–48 px, so each navigator link is a 40-px square holding the 28-px numeral disc; `tracker.mjs` sets `aria-current` on
  it through `data-step` (the same mechanism as the occasion step tracker).
- **FEAT-107 · part pager**: text “मंत्र 1–40 · कुल 95” + ← → links in the tools row and again at the bottom; `rel="prev|next"`
  go to the neighbouring part, else to the neighbouring PUBLISHED chapter (its first part). No bar anywhere (§27 item 4).
- **FEAT-107 · Expand / Collapse all**: two buttons, both `aria-controls="verses"`, both `aria-expanded="true"` only while every
  `<details class="meaning">` is open (kept in sync with manual toggles). A deep link `#v{n}` opens that verse's meaning.
- **FEAT-107 · unpublished chapters** are absent everywhere: no route, no card on the text page, not in the rail list, not in
  the counts (“N अध्याय · M श्लोक” on the texts index and text page come from the published set only — brief §6.1).
- **FEAT-107 · katha landing embeds the vidhi occasion once** (#vidhi): overview, when + roles pair, layer legend, step cards
  (grouped by part when the occasion has parts), pothi / full-page links; the samagri checklist is the right rail; the
  left rail holds the adhyaya list AND the step tracker (`trackerFold`). The page carries the occasion's offline
  placeholder so FEAT-109's save-offline works from the katha too.
- **FEAT-107 · katha caveat** is `katha.json#caveat` (optional per the schema); the fixture now carries one. Prose in it must
  avoid registered source titles unless linked (gate G16 / UI-19 — e.g. “रेवा खण्डम्” is a registered title; “रेवाखंड” is not).
- **FEAT-107 · {{verse:}} panels**: `<details class="mula">` “मूल श्लोक — श्लोक n” with the verse block (lang of its text), the
  prose meaning and a link to the chapter anchor; the build throws on an unresolved id (the gate's G5 fails it first). The
  drop cap is `.prose.dropcap > p:first-child::first-letter` (the first `<p>` also gets `class="dropcap"`; the old
  `.dropcap::first-letter` on the container would have doubled the letter).
- **FEAT-107 · attributionHtml links the registry URL first, literally**: a Wikisource URL containing “)” (…/खण्डः_५_(अवन्तीखण्डः)/…)
  was cut by the generic `(url)` regex and the title ended up linked twice (nested `<a>` → UI-20 unmarked + UI-25 obscured
  on the katha pages and on the `satyanarayan-puja` occasion page). Fixed for every page carrying such a source.
- **FEAT-107 · texts index**: the ritual-mantra corpus is one compact row card (icon · title · count · arrow) above the text
  cards so it is not an empty band at 1440+; texts with zero published chapters sort last but keep their page.
- **FEAT-108 · named sources in UI prose and attribution lines are linked by data**: `build/templates/components/names.mjs`
  builds a name index from `sources.json#sources[].titles[]` and `institutions.json` (name + names[]) and wraps every bare
  occurrence in an external link — in the home / texts / reference ledes, the honesty notes, the when-card label, the
  sources-page group headings and the W/S attribution lines (“संस्कृत विकिस्रोत”, “sanskritdocuments.org”). Before this,
  `tools/audit.py` UI-19 read only the top-level `titles`/`names` keys (which do not exist), so it checked 9 English
  institution names; it now reads the per-entry lists (176 names) and skips `h1`, `.quiz`, `label`, `legend`, `button`,
  `summary` and Sanskrit spans (not citations). Several pre-existing bare names on home, texts index and the occasion
  when-card (“शुभवेला”, “रुद्राष्टाध्यायी”, “संस्कृत विकिस्रोत”) are fixed by the same helper; all page types pass UI-19 at 1440/hi (en/bho spot-checked on 7 pages).
- **FEAT-108 · the search page exists while `features.search` is false** (design-review MEDIUM 6): a browse page (ten group
  cards with chips, glossary letter bar, texts) with no `<input>`, no `[data-search]`, no SearchAction; `data.features =
  { searchPage: true, search }` — the flag switches the page's mode, not its existence. With the flag on, the §14.4 markup
  renders (input, aria-live count, results region) and FEAT-301 wires `search.mjs`.
- **FEAT-108 · glossary pages only for terms defined in all three languages** (derive sets `published`; the term route filters
  on it); the index groups by the first Devanagari letter (hi/bho) or A–Z (en) with a 44-px letter bar and CSS multi-column
  word lists (not `.grid`, so UI-17's last-row rule does not fight alphabetical groups). The term page's h1 is the display
  form; the forms card shows the OTHER two languages + Sanskrit (three forms on the page, each fact once), alternates and
  folk forms as lists (the first-use bracket rule applies in prose); related occasions = `occasions[]` ∪ records whose text
  marks `[[id]]`; lessons marking the term are listed too.
- **FEAT-108 · Level 0 institutions table** renders every row of `content/institutions.json` — name linked (hi/bho: the first
  Devanagari `names[]` form, en: `name`), extra `urls[]` as host links, status chip (fact / to-confirm / uncertain). The
  registry's `course` and `duration` are language-neutral English strings and render in `lang="en"` cells; a later content
  item may add hi/bho columns to the registry (noted for C1A-18 / OWNER-TODO).
- **FEAT-108 · levels card is a `details.rail-fold`** (closed on phones, opened at ≥ 1024 by app.mjs) like every other rail,
  so the lesson prose comes first at 390.
- **FEAT-108 · lesson quiz**: `<fieldset data-answer data-fb-ok data-fb-no>` per question, `label.opt` rows (44 px, 22-px radio),
  per-option “✓ सही / ✗ गलत” + border colour (`--good` / `--accent`) and the question's ok/no sentence; result
  “{right}/{total} सही”; `pb-quiz:<id> = {right,total,at}`; a closed `<details class="answers">` lists the answers for JS-off.
  “Done” (rail tick, level progress bar) means a full score; the badge shows any stored score. `quiz.mjs` is 3.9 KB
  unminified (design §12 cap 3 KB) because it also fills badges, ticks and the progress card on the index/level pages
  (one module instead of two); `sankalpa.mjs` is 2.6 KB (cap 2 KB) — both well under the 150-KB page budget.
- **FEAT-108 · sankalpa worked example**: the form card on `/reference/sankalpa/` renders the UI-string example line with
  `<span data-sankalpa="gotra|name">` slots and, when the `sankalp` occasion exists (C1A-02), every `panditSays.sa` line with
  `{placeholders}` as a mantra block (one pada per line) whose placeholders become slots labelled from `sankalpa.slot.*`
  (unknown keys → `[key]`). The fixture has no such occasion, so only the example line is proven here.
- **FEAT-108 · static pages**: sources = prose + the §14 sentence (UI string, once — the fixture prose no longer repeats it) +
  the registry grouped by project (title linked, kind, retrieved, `rel="license"` link: CC BY-SA / CC BY-NC-SA / Public Domain
  Mark by the licence text, else the source's own page) + fonts (OFL link + shipped OFL.txt) + build tools; privacy = prose +
  the design §9.3 storage-keys table + the R4 §6.3 GitHub sentences. Authors write only the prose part (CONTENT-RULES §8).
- **FEAT-108 · reference pages use `.prose-wide`** (paragraphs at the reading measure, GFM tables at full column width inside
  `.table-wrap`); `{{mantra:}}` / `{{sutra:}}` embeds work in lesson, reference and static Markdown (an unresolved id fails the build).
- **FEAT-108 · `tools/audit.py` shots scroll to the top first** — the UI-25 focus walk left every 390-light shot at the page footer.
- **FEAT-109 · three installable apps.** Each language has its own `/{lang}/manifest.webmanifest` without `id`, so a
  browser treats `/hi/`, `/en/` and `/bho/` as three installable apps (the `id` defaults to `start_url`). `short_name` is the
  language's display name (पंडित बनो / Pandit Bano / पंडित बनीं), so the three home-screen icons read differently (design
  §13.1; design-review NIT 17). One root manifest with `start_url: ./hi/` was the alternative; three was chosen so an
  English or Bhojpuri reader's installed app opens in their language.
- **FEAT-109 · precache class of `static` pages and `/search/` is `runtime`**, not `static` as the FEAT-102 route table had
  them: the Sources page is 91 KB of HTML and would have pushed the shell precache past 1 MB for a page nobody needs offline
  first. The static shell is: root redirect, 404, the three offline pages, the three home pages, the seven section indexes
  (learn, occasions, mantras, texts, kathas, glossary, reference), the manifests, hashed CSS/JS, fonts, icons — 53 URLs,
  925 KB on the fixture corpus (budget 2 MB). Reference pages (`og: "own"`) and the search page keep their own OG image.
- **FEAT-109 · OG text layers use the TTF's full family name** (`"Noto Sans Devanagari SemiBold 56"`, not
  `"Noto Sans Devanagari 600 56"` as design §11.7 wrote): Pango matches the description against the static file's
  name-table family (nameID 1 = "Noto Sans Devanagari SemiBold", style "Regular"), and the weight form silently fell back to
  a system face (measured: its metrics equalled a nonexistent family's). `build/og.mjs#fontProbe()` renders a probe in the
  real and in a bogus family and records `og.fontMatched` in `build.json`; `false` is a budget violation (fatal in CI), so
  the Linux runner cannot ship tofu/mis-shaped Devanagari unnoticed (design-review MEDIUM 2).
- **FEAT-109 · OG PNG encoding**: palette PNG with `compressionLevel 4, effort 3, dither 0` (≈ 9–14 KB each, 11–17 ms per image
  in batches of 16) instead of `compressionLevel 9` (31 ms); text layers are composited as raw RGBA, not re-encoded PNGs. The
  site-name and language-chip layers are rendered once per language per process. ≈ 2,000 own images stay well under the
  45-s stage budget; a local rebuild re-uses `dist/og/manifest.json` (key = title + lang + site + template/font hash).
- **FEAT-109 · head metas before offline bytes.** `og:image*`, `twitter:card` and the JSON-LD block are injected into the
  rendered HTML (stage 8a) BEFORE the `#pb-offline-urls` byte counts are fixed, so `bytes` stays exact; sitemap/robots are
  written afterwards. The injector reads title/description/crumbs back from the page `<head>`/`.crumbs`, so templates stay
  the single source and no page type needs a second metadata path.
- **FEAT-109 · JSON-LD scope**: `WebSite` on home (no `SearchAction` while `features.search` is false — MEDIUM 6);
  `BreadcrumbList` on every page with crumbs; `HowTo` + `HowToStep` (the step's action text, no `name`) on occasion and
  occasion-part pages (a part lists only its own steps); `Article` on lesson / katha / katha-adhyaya / reference-page /
  static; `DefinedTerm` (+ `DefinedTermSet` = the glossary index) on term pages; nothing on offline / 404 / pothi. Index,
  mantra, text and chapter pages carry only the breadcrumb list (schema.org has no honest type for a verse list; `Article`
  on a scripture chapter would misdescribe it).
- **FEAT-109 · client UI strings travel in `#pb-ui`** (one JSON script per page, ≈ 600 B, the 12 keys `offline.*`,
  `pothi.save|saved`) because offline.mjs runs on every page type and has no template of its own. Two UI keys were added
  in all three languages: `offline.evicted` ("सबसे पुराना सहेजा गया अवसर हटाया गया: {title}") and `offline.close` ("बंद करें").
- **FEAT-109 · offline.mjs owns the Save-offline buttons** (FEAT-106 wrote that pothi.mjs delegates the click): it is in
  `COMMON_MODULES`, loaded on EVERY page type, registers the worker, un-hides and binds `[data-save-offline]`, restores
  `aria-pressed` from `pb-saved` on load, fills `[data-saved-list]` and shows the toasts. pothi.mjs no longer touches the button.
- **FEAT-109 · the update reload happens only after the user asked.** `controllerchange` also fires on the FIRST install
  (`clients.claim()`), so reloading on every `controllerchange` reloaded each first visit once; the page now reloads only
  after its own "पुनः लोड करें" click posted `SKIP_WAITING`. The update toast is shown once per session (`sessionStorage`).
- **FEAT-109 · saved-set manifests live in `pb-saved` under `BASE_PATH/_saved/<id>.json`** (synthetic cache keys, never
  fetched), carrying `{id, hash, bytes, urls, title, url, lang, savedAt}`; `UNSAVE` and eviction delete only URLs no other
  set still references (two saved occasions share the CSS/JS/fonts). The Home / offline lists read the manifests straight
  from the Cache API (no SW round trip), so they work before the worker controls the page.
- **FEAT-109 · per-module JS caps of design §12 are warnings, not violations.** Eight modules exceed their unminified caps
  (offline 7.2 KB > 4, voice 9.1 > 6, quiz 3.9 > 3, checklist 2.7 > 2, tracker 2.5 > 2, translit 2.4 > 2, sankalpa 2.6 > 2,
  expand 1.5 > 1), mostly comments; the per-page 150 KB budget, which is the brief's rule, is what fails the CI build.
  `build.json#budgets.modules` records every size; FEAT-110 / the 1a fixer decide whether to minify or re-cap.
- **FEAT-109 · the Sources page exceeds the 150 KB page budget on the fixture corpus** (hi 152.9 KB, bho 152.8 KB; 91 KB of
  HTML for 84 registry rows, each with two external links and their marker SVGs + sr text, + 52 KB CSS + 11 KB JS). The
  build reports it as a budget violation (warning locally, exit 4 in CI); it is NOT fixed here because the fix is a template
  decision (collapse the registry per project into `<details>`, or drop the per-row licence marker) that belongs to
  FEAT-108's page — recorded for FEAT-110 / the 1a fixer as a mandatory item. The real corpus will carry more rows.
- **FEAT-109 · `build()` takes overrides** (`{CONTENT_DIR, DIST, CI, quiet}`) so the FEAT-109 unit tests build the fixture
  corpus into a temp dist in-process (one build per test file); CLI flags (`--content`, `--dist`, `--ci`) are unchanged.

- **FEAT-110 · the source registry moved to per-project pages.** The one-page registry (84 rows × ≈ 800 B on the fixture corpus)
  pushed `/{lang}/sources/` to 153 KB, over the 150-KB page budget of brief §7, and the real corpus has several times as many
  entries. `/{lang}/sources/` now shows one summary card per project (label linked to the project page, entry count, kinds,
  each distinct licence linked once with `rel="license"`) followed by the fonts and build-tools cards; the rows live on
  `/{lang}/sources/{project}/` (new page type `sources-project`, precache `runtime`, in the sitemap, type-default OG image,
  breadcrumb Home › Sources, right rail = the project list + the site-links card), grouped by licence with the licence linked
  once per group. Sources page 36 KB; the largest project page (Wikisource, 46 rows) 44 KB. Ceiling: ≈ 570 B per row, so a
  single project stays under the budget up to ≈ 115 rows — if Wikisource grows past that, paginate the project page
  (`/sources/{project}/p{k}/` like chapter parts). The project pages exist only together with the Sources static page.
- **FEAT-110 · no dead links on a partial corpus.** The section indexes (`/learn/`, `/occasions/`, `/mantras/`, `/texts/`,
  `/kathas/`, `/glossary/`, `/reference/`) are now unconditional routes (the header nav, home and 404 link them on every
  page; the index templates render their honest empty state), the footer links About / Sources / Privacy only when that
  static page exists (`ctx.has.static(slug)`), the home "how this site was verified" / "sources" links likewise
  (`ctx.has.reference("verification")`), and the reading-settings card's pronunciation link follows the corpus: Level 1 when
  it exists, the Learn index when any level exists, no link otherwise (`learnHrefFor`). Before this, every verse page linked
  `/learn/level-1/`, which lands only in Phase 1b. `test/integration/links.test.mjs` now fails the build on any unresolved
  internal URL.
- **FEAT-110 · the built-in PGS I.8.11–13 sutra block carries `data-plain`** like every other `.mantra` (the integration test
  requires it; the corpus record path already had it).
- **FEAT-110 · OG stage hardened against an intermittent native crash.** On a cold OG cache the Windows build died with
  STATUS_HEAP_CORRUPTION (0xC0000374) about one run in eight (`npm test` once, the `sw.test.mjs` fixture build twice, 1 of 10
  scripted in-process builds). Two changes in `build/og.mjs`, both kept: Pango `text` runs (which register `fontfile` with
  fontconfig on every call) go through a promise queue one at a time, and every composite gets its own copy of the layer
  pixels — the cached site-name / language-chip layers were shared Buffers across the 16 concurrent composites of a batch,
  and that sharing is where the crash reproduced (0 crashes in 40 scripted runs with copies; `BATCH = 1` also gave 0/15 but
  cost 2.5 s instead of 1.4 s per 93 images). Compositing and PNG encoding stay parallel; measured cold-cache cost unchanged
  (93 images in 1.4–1.6 s ≈ 16 ms/image → ≈ 32 s for 2,000 images, under the 45-s stage budget). Linux CI is not known to be
  affected; recorded so a CI crash with that signature is recognised.
- **FEAT-110 · integration suite over dist/** (`test/integration/`, run by `npm test` after the build): links (every href/src
  resolves or is on an allowed external host — Shubhvela, GitHub, the registry and institution hosts, Creative Commons,
  openfontlicense.org, the samagri search hosts, the build-tool pages; sitemap URLs resolve), page-head (one `<h1>`, canonical =
  own URL, hreflang hi/en/x-default and never bho/bh, `<html lang>` = route language, two theme-color metas, the language's
  manifest, description, og:url/og:image, skip link + `<main>`), mantra (lang + `data-plain` on every `.mantra`; `.sr` and
  `aria-hidden` `.deva` iff svara marks; IAST lines `lang="sa-Latn"`), budgets (no violation; largest page, data JSON, fonts,
  precache, OG under their caps; `og.fontMatched` not false), sw (HASH/BASE/LANGS, PRECACHE ⊆ dist with the shell, manifests
  without `id`), offline-manifest (`#pb-offline-urls` on every occasion/part/pothi page: id, build hash, bytes, urls ⊆ dist),
  fonts-page (`_dev/fonts.html` present and disallowed in robots.txt with `_reports/`; OFL.txt beside every family). 14 tests;
  green on the fixture corpus (143 pages) and on the real, still-empty `content/` (32 pages).
- **FEAT-110 · CI** `.github/workflows/pages.yml`: push to `main` + `workflow_dispatch`, no schedule; `npm ci` → `npm test`
  with `CI=true` (budgets fatal) → `configure-pages@v6` → `upload-pages-artifact@v5` (`dist`) → `deploy-pages@v5`; validated
  with PyYAML (structure) and by reading against Shubhvela's file; the first real run happens at the Phase 1a ship.
- **FEAT-110 · per-module JS caps stay warnings** (FEAT-109 left the decision here): the eight modules over their design §12
  caps are mostly comments, the brief's per-page 150-KB budget is the rule that fails CI, and minifying would cost a build
  dependency the stack forbids (design §2 "no bundler"). Recorded in `build.json#budgets.modules`; revisit only if a page
  nears 150 KB.

- **FIX-1a · per-page budget measured on gzip bytes (ORCHESTRATOR DECISION 2026-11-02 — the owner-side amendment of brief §7 and
  design §23 / UI-31).** The 150-KB uncompressed rule assumed a shell + JSON architecture; here the content IS the HTML
  (Devanagari is 3 bytes a character; a step inlines verse + pada + meaning + explanation) and GitHub Pages transfers gzip.
  After the 1a content loop 161 pages were over (hi/occasions/vivah/mukhya/ 777 KB = 678 HTML + 54 CSS + 45 JS; vivah/pothi
  401 KB; navagraha 480; dikpal/dikpala 459; katha landing 355; 40-verse chapters 190–250; mantras index 234), while the
  largest gzip figure was 115 KB. Pagination was ruled out (the owner's "everything in detail"; step pages and chapters are
  NOT split further). Rules now enforced by `build/report.mjs` and `test/integration/budgets.test.mjs` (fatal in CI): (a)
  CSS + JS per page ≤ 150 KB uncompressed — the code-bloat tripwire (99 KB today); (b) HTML + CSS + JS per page ≤ 150 KB gzip
  level 6, pothi routes included, no exemptions; (c) uncompressed HTML per page is a warning only; `build.json#budgets.page`
  carries `code`, `gzip`, `html` and `heaviest` (the ten heaviest pages with both figures) for the verification report.
  `tools/audit.py --budget` (UI-31) measures the same three figures. Proof that the heavy pages still perform: Lighthouse
  mobile locally on vivah/mukhya, navagraha, a 40-verse chapter and vivah/pothi — numbers in the FIX-1a commit body and
  `docs/verification-phase-1a.md`; the fallback if any is < 95 is a closed `<details>` around each step's pada table, not
  pagination.
- **FIX-1a · no vinyog card inside occasion steps (orchestrator sub-decision B, 2026-11-02).** FEAT-106 rendered the mantra's
  vinyog list (every OTHER occasion step using it, with those steps' action texts) under every step mantra — 18–51 KB per
  occasion page and the step texts of other occasions on a page about this one. `verseFull()` now renders block → pada →
  meaning/explanation → variants → source line, and the source line carries a "मंत्र का पृष्ठ →" link (UI key
  `verse.mantra_page`, hi/en/bho) to the mantra page where the vinyog card lives (design §7.6).
- **FIX-1a · occasion JSON-LD is `WebPage`, not `HowTo` + `HowToStep`.** The step list repeated every action text in the
  head (31 KB on vivah/mukhya) and Google retired HowTo rich results in September 2023; `BreadcrumbList` stays on every page,
  `Article` on lessons/kathas/reference/static, `DefinedTerm` on terms.
- **FIX-1a · a lone last card in a data-driven grid spans the row.** UI-17 failed `/hi/mantras/` at 1440 (three groups with
  3n+1 records → last row 1/3 filled). `.grid-lg-3 / .grid-lg-4 / .grid-xl-4 > :last-child:nth-child(kn+1)` now takes
  `grid-column: 1 / -1`; grids marked `data-grid` (the §27.3 group grid, lists) are excluded so their column count stays as
  designed. No markup change.
- **FIX-1a · trims NOT made, and why.** The external-link marker stays inline SVG + sr span (design §5.2 — never a `::after`
  glyph; under gzip the 241 repeated markers of vivah/mukhya cost ≈ 1 KB) and `data-plain` stays on every `.mantra`
  (the integration test and the FEAT-105 accessibility proof rely on it; gzip removes the duplicate almost entirely).
