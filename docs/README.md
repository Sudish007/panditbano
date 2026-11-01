# docs/ — what to read, in order

Owner-facing copies of the documents that drove the build (the working artifacts under `.agents/` are gitignored; these
copies are the ones that survive the machine). Read them in this order:

1. **`OWNER-TODO.md`** (written by each ship step) — the short list of things only you can do: buy the domains, read the
   Bhojpuri review packs, settle the open word choices. Not present until the first ship.
2. **`verification-phase-<N>.md`** + **`screenshots/phase-<N>/`** (written by each ship step) — every check the ship ran with
   its real output, the Lighthouse numbers, the live screenshots at 390 / 1440 (both themes) and 2560, and the "NOT VERIFIED"
   list restated. Phase 1a is the first.
3. **`research-summary.md`** — the Phase 0 research synthesis: the tradition baseline (Paraskara Grihya Sutra + Shukla
   Yajurveda Madhyandina), the occasion priority list for the three phases, the transliteration scheme, the font proof, the
   three palettes, the attribution lines, the Bhojpuri decisions, the formal purohit routes, the open items — and, at the
   end, your 2026-10-31 copyright decision (every inventory text reproduced in full).
4. **`design.md`** — the approved design (direction 2 Haldi–Chandan): site map and URLs, page anatomy, tokens, typography,
   verse rendering, audio, navigation and settings, the content model and the 21-rule content gate, the build pipeline,
   client modules, PWA, search, pothi/print, SEO, accessibility, the 33 measurable UI checks, budgets, testability, the §27
   orchestrator decisions — followed by **"Deviations and notes"**, the running list of every point where the build departed
   from the text and why (one entry per deviation, per FEAT).
5. **`CONTENT-RULES.md`** — the rules every content author follows (record shapes, the gate rules G1–G22 with their fixes,
   Hindi and Bhojpuri register, honesty phrasing, attribution lines, the `--content` / `--dist` flags and lane mode).
6. **`review/<item-id>-bho.md`** and **`review/<item-id>-hi.md`** (one pair per content item) — the Bhojpuri and Hindi review
   packs "waiting for your eye": up to 50 EN/BHO pairs, the register decisions, and an "Unsure about" word list per item. The
   records keep `review: draft` until you have read them.
7. **`FINAL-REPORT.md`** (Phase 3 ship) — what to look at first and what only you can do.

The repo-root `README.md` explains how to build, test and audit the site locally.
