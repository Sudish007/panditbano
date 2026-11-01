# Motifs and icons (`assets/sprite.svg`, `assets/icon.svg`, `assets/og-template.svg`)

Attestation: **objects and geometry only; no deity figure** (brief §1, design.md §5.2 and §22, R4 §8.2). Every SVG under `assets/` is thin-line, one colour (`currentColor` in the sprite; the light-theme tokens `#F8ECD4` paper / `#A65310` accent in the rasterised icons and the OG template). The swastika is not in the sprite; it may appear only inside a captioned ritual diagram (design §5.2). `#i-om` and every `m-*` symbol must never be used in the footer strip, on the 404/offline pages, inside destructive controls or under wrong-answer feedback (a template test checks the ids).

`test/unit/fonts.test.mjs` asserts that every `<symbol id>` in `assets/sprite.svg` appears in the table below and vice versa, and that no id contains "deity", "ganesh", "shiva", "devi" or "murti".

## UI icons (`i-*`, 24 × 24)

| id | Description |
|---|---|
| `i-search` | magnifier: circle + handle |
| `i-sun` | sun disc with eight rays (theme: light) |
| `i-moon` | crescent moon (theme: dark) |
| `i-play` | filled right-pointing triangle (listen / play) |
| `i-print` | printer outline |
| `i-download` | arrow down onto a baseline (save offline) |
| `i-check` | tick mark |
| `i-book` | open book, two leaves |
| `i-list` | three bulleted lines (list / word split) |
| `i-copy` | two overlapping rectangles (copy) |
| `i-cap` | graduation cap (Learn) |
| `i-fire` | single flame outline (havan / foundations) |
| `i-home` | house outline (home & property) |
| `i-sun2` | rising sun over a horizon (daily / nitya karma) |
| `i-child` | head and shoulders silhouette, abstract (birth & childhood) |
| `i-rings` | two interlocking rings (marriage) |
| `i-pind` | ball on a baseline — a pinda (death & ancestors) |
| `i-moonstar` | crescent with a small star (vrats) |
| `i-flag` | pennant flag (festivals) |
| `i-om` | the syllable ॐ set as text in Tiro Devanagari Sanskrit (texts / mantras; sacred — restricted placement) |
| `i-ext` | external-link arrow: box with an arrow leaving its top-right corner (design §5.2; NEW) |
| `i-auto` | half-filled circle — theme = system (design-review NIT 11; NEW) |

## Motifs (`m-*`, thin-line objects)

| id | Description |
|---|---|
| `m-kalash` | kalash pot with mango leaves and a coconut, 120 × 150 |
| `m-leaf` | single mango leaf, 24 × 40 |
| `m-diya` | diya oil lamp with one flame, 120 × 100 — brand mark and hero motif; also `assets/icon.svg`, `assets/icons/*`, `assets/og-template.svg` |
| `m-lotus` | five-petal lotus outline on a baseline, 120 × 80 |
| `m-bell` | temple bell outline, 80 × 100 |
| `m-shankh` | conch outline, 120 × 100 |
| `m-jaali` | one jaali lattice cell: diamond with a centre ring, 18 × 18 — tile for the header band (NEW; the band in the mocks was an inline `<pattern>` with the same geometry) |

## Other SVG assets

| file | Description |
|---|---|
| `assets/icon.svg` | the `m-diya` paths as a standalone mark, `currentColor` |
| `assets/icons/favicon.svg` | diya mark in accent on a rounded paper square |
| `assets/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | rendered by `tools/render-icons.py` from `icon.svg` on paper `#F8ECD4`; the maskable mark sits inside the 80 % safe zone |
| `assets/og-template.svg` | 1200 × 630 geometry only: paper field, hairline frame, jaali strip, 3-px kumkum rule, diya panel, language-chip outline; text is composited by sharp (FEAT-109) |
