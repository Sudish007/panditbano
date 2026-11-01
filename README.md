# Pandit Bano · पंडित बनो · पंडित बनीं

A free, static reference and course site for the rituals a North Indian Hindu family performs — every occasion as a complete
procedure (overview, when, roles, samagri checklist, ordered steps with their mantras and the pandit's spoken line, regional
variants, FAQ, sources), the ritual-mantra corpus and the long texts verse by verse (Devanagari with svara marks → IAST /
easy-Roman → word split → meaning → explanation → where it is used → source line), kathas retold in the site's own words, a
Learn path toward acting as a purohit, a glossary, a printable / offline "pothi" mode. Everything is in **Hindi (default),
English and Bhojpuri**; the Sanskrit is identical in all three. Live at <https://sudish007.github.io/panditbano/> (GitHub
Pages). Dates and muhurat are never computed here — the site links [Shubhvela](https://sudish007.github.io/shubhvela/).

No accounts, no analytics, no cookies, no third-party requests at runtime (fonts self-hosted), no ads, no booking, no API keys.

## How it is built

An in-repo static generator (Node 24, ESM, plain JavaScript, no framework, no bundler) reads `content/**` (JSON records and
Markdown) and writes one HTML file per page per language into `dist/`, plus the service worker, manifests, sitemap, robots and
one OG image per page. Vanilla CSS with design tokens (`assets/css/tokens.css` is the only file with colour literals) and
vanilla JS modules (theme, language, transliteration, voice, checklist ticks, quiz, pothi, offline).

| Path | Holds |
|---|---|
| `build/` | `build.mjs` (the pipeline), `gate.mjs` (content gate G1–G22), `lib/` (schema, loaders, derive, transliteration, Markdown subset, routes), `templates/` (page and component templates), `pwa.mjs`, `seo.mjs`, `og.mjs`, `report.mjs` |
| `content/` | `ui/{hi,en,bho}.json`, registries (`sources.json`, `institutions.json`, `shubhvela-ids.json`, `termbank.json`, …), then `mantras/`, `occasions/`, `texts/`, `kathas/`, `learn/`, `glossary/`, `reference/`, `static/` as content lands |
| `assets/` | CSS, JS modules, SVG sprite and motifs, icon sources, OG template, service-worker template, `dev/fonts.html` |
| `fonts/` | self-hosted OFL woff2 (Tiro Devanagari Sanskrit, Noto Sans Devanagari, Noto Sans) with `OFL.txt` beside each family |
| `tools/` | `audit.py` (real-browser UI audit), `live-check.py`, `lighthouse.mjs`, `fonts.py`, `fonts-check.py`, `render-icons.py`, `shubhvela-ids.mjs` |
| `test/` | `run.mjs`, `unit/`, `integration/` (over `dist/`), `fixtures/content-sample/` (a complete miniature corpus) and `fixtures/content-bad/` (one failing fixture per gate rule) |
| `docs/` | owner-facing copies: `design.md`, `research-summary.md`, `CONTENT-RULES.md`, review packs, verification reports, screenshots — start with `docs/README.md` |

## Build, test, audit locally

Requirements: Node ≥ 24 (`npm ci` installs the four exact-pinned devDependencies); for the browser audits, Python 3.13 with
Playwright 1.55 and Microsoft Edge (the workspace venv on the build machine).

```sh
npm ci
npm test                      # unit tests → build (runs the content gate) → integration tests over dist/
npm run build                 # dist/ for BASE_PATH=/panditbano/ (default)
npm run gate                  # content gate alone (dist/_reports/gate.json)
npm run test:unit
npm run test:integration      # needs a prior build

# flags override the environment for one process (parallel steps share one shell, so no persistent env vars):
node build/build.mjs --content test/fixtures/content-sample --dist dist     # the fixture corpus
node build/build.mjs --base-path / --site-origin https://panditbano.in      # a future apex domain
node build/build.mjs --ci                                                   # budgets fatal, as in CI

# real-browser UI audit of dist/ (one line per check per page / width / theme; PNG shots; exit 1 on any FAIL)
python tools/audit.py --pages all-types --widths 390,1440 --themes light,dark --langs hi --prefix local
python tools/audit.py --sweep overflow --prefix s320          # every page at 320 px
python tools/audit.py --origin https://sudish007.github.io/panditbano/ --pages all-types --prefix live
```

The build fails on any content-gate FAIL (exit 3) and, with `CI=true`, on any budget violation (exit 4): per page HTML + CSS + JS
≤ 150 KB, data JSON ≤ 300 KB, fonts ≤ 450 KB, service-worker precache ≤ 2 MB, OG stage ≤ 60 MB / 45 s. `dist/_reports/build.json`
records every number.

## Branches, commits, shipping

- Phase 1 is built on `main` and pushed only at its ship steps (1a, 1b). Phase 2 and 3 work on `phase-2` / `phase-3`, rebased on
  `main` and merged `--ff-only` at their ship. Never force-push.
- One commit per build feature or content item, prefixed with its id (`FEAT-110: …`, `C1A-03: …`); the commit body is the
  verification record (commands run, counts, shot paths). The tree is clean at the end of every step.
- `.github/workflows/pages.yml` deploys on every push to `main` (and on `workflow_dispatch`): `npm ci` → `npm test` with
  `CI=true` → `configure-pages` → `upload-pages-artifact` (`dist/`) → `deploy-pages`. Nothing ships from a red tree. GitHub
  Pages is configured with the Actions source (`build_type=workflow`).
- Ship steps tag `v1-phase-1a`, `v1-phase-1b`, `v1-phase-2`, `v1.0`, run the live audit (every page 200, UI checks at 390 / 1440
  in both themes and at 2560, Lighthouse on three pages) and write `docs/verification-phase-<N>.md`.
- Content is authored in parallel lanes under gitignored staging folders and integrated by a single writer that runs the gate
  before each commit (`docs/CONTENT-RULES.md`).

## Licences

- **Code** (`build/`, `assets/js`, `assets/css`, `tools/`, `test/`): MIT — see `LICENSE`.
- **The site's own prose** (explanations, meanings, katha retellings, procedures, lessons, glossary, UI strings in all three
  languages): CC BY-SA 4.0.
- **Mantra and verse texts** (`devanagari` fields): ancient Sanskrit works are in the public domain; transcriptions taken from
  Sanskrit Wikisource are CC BY-SA 4.0 and the site carries the Wikisource notice and a per-record source line; other sources
  (sanskritdocuments.org, Vedic Heritage Portal, GRETIL, Internet Archive scans, Stotra Nidhi, Kavita Kosh) are credited per
  record with their locator. Per the owner's decision of 2026-10-31, 20th-century devotional texts (chalisas, aartis, modern vrat
  kathas) are reproduced in full as well, with their authorship stated neutrally.
- **Fonts**: SIL Open Font License 1.1 (`fonts/*/OFL.txt`). Build tools: minisearch (MIT), @indic-transliteration/sanscript
  (MIT), sharp (Apache-2.0), @resvg/resvg-js (MPL-2.0, used unmodified at build time).

## Honesty rules

Every claim about what a rite brings is phrased as what the tradition holds (`परम्परा में माना जाता है` / "tradition holds" /
`परंपरा में मानल जाला`), never as fact, and there are no medical, financial or legal outcome claims. Every page lists its
sources; every mantra record carries a source URL and locator (the gate refuses a record without one); nothing is typed from
memory. Every count on the site is computed from the data at build time. The machine voice is labelled approximate and
Vedic svara is not reproduced by it. English and Bhojpuri pages say that their text was written by the site's authors and is
awaiting native review, with corrections via GitHub Issues; Hindi pages say the content was written by the site's authors
from the listed sources. No page claims a scholarly review that did not happen.
