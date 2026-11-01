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
