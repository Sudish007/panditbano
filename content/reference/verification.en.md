{"title": "How this site was verified", "summary": "The checklist every piece of content passes, the real-browser audit, the font and language-tag checks — and what has not been verified yet."}

This page says which tests the content and the layout of the site pass, and where their limits are. No page claims scholarly review; whatever a machine could check is checked every time, and whatever only a person can judge is listed below under "not verified yet".

# The checks every content file passes

Every [[mantra]], occasion, [[katha]], lesson and glossary term goes through a fixed checklist — when the content is added and again every time the site is built. A single failure stops the build, so a page that is visible has passed all of these:

- **Shape** — every record has all of its required fields; an unknown field fails, so that a typo cannot hide.
- **Three languages** — every text field is filled in Hindi, English and Bhojpuri; a Bhojpuri string that is an exact copy of the Hindi (beyond short shared headings) fails.
- **Devanagari only** — a mantra field holds nothing but Devanagari: letters, the danda, the avagraha, digits, [[svara]] and the Vedic extension signs; Latin letters or Western punctuation fail. The transliteration code must recognise every character, and that is tested too.
- **Sources** — the source of every mantra and verse is registered in the site's source registry with its address and the date of retrieval; where a second digital source exists, a recorded comparison is mandatory. A mantra typed from memory cannot be in the registry, so it fails.
- **Completeness** — every occasion has at least one step, one item of samagri, one source, a timing section and roles; every linked identifier (mantra, text, katha, lesson) really exists; a mantra spoken in a step of a rite carries a word-by-word split and an explanation.
- **Chapters** — a chapter of a text is published only when every one of its verses has a meaning in all three languages; there is no "coming soon" verse. The declared and the actual number of verses must agree.
- **Language rules** — no Latin words in Hindi or Bhojpuri prose except listed proper names; a list of Hindi forms is forbidden in Bhojpuri (hard forms fail, soft forms are flagged for review), as are Hindi sentence patterns; in Bhojpuri the nukta appears only in ड़ and ढ़; Hindi prose uses the anusvara rather than the conjunct nasal (पंडित, मंत्र, संध्या — the conjunct forms belong only in Sanskrit fields); Hindi and Bhojpuri text much shorter or much longer than the English is flagged.
- **Links and terms** — every internal link leads to a real page; glossary marks are identifiers from the term bank; every book, source and institution named in prose is a link; numbers are only ever counted from the data.
- **Honesty** — a sentence with an outcome verb, a health word or an absolute claim ("always", "certainly") is flagged for review; a claim about a mantra or a puja that names a disease fails. Where an occasion touches health, grief or astrology, the reminder line must exist in all three languages.
- **Identifiers** — no identifier appears twice; the [Shubhvela](https://sudish007.github.io/shubhvela/en/) identifiers written into occasions for muhurats, festivals and vrats really exist in that site's lists.

Every run writes a report file naming each failure and each flagged line with its file; the flagged lines are copied into the review pack of that content, which the site's Bhojpuri-speaking owner reads.

# Checks in a real browser

The layout is checked by measurement, not by eye. Every page type that changed is opened with [Playwright](https://playwright.dev/) in the Edge browser — at widths from 320 to 2560 pixels, in both the light and the dark theme, in Hindi and, where the text or the layout changed, in English and Bhojpuri as well — and these things are measured:

- At no width does the page overflow sideways; inside a card or list item no two boxes overlap.
- No text is smaller than 12 pixels; every button and control is 40–44 pixels tall; every target is at least 24 pixels.
- The contrast of text against its background meets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA, computed with transparency taken into account.
- The first paint is always the light theme; language, theme, transliteration, voice and checklist — every control shows its state in both themes.
- Each fact appears once per page; on wide screens no half of a panel is empty; group cards and lists fill their width.
- Every book, course and source named in prose is a link — counted in the page structure, with zero exceptions.
- Devanagari renders correctly: conjuncts (क्ष त्र ज्ञ द्ध ह्म), the nukta, the chandrabindu, the avagraha, the danda and the accent marks — in both the mantra face and the prose face; the proof is kept as a separate note in the site's [documents](https://github.com/Sudish007/panditbano/tree/main/docs).
- A mantra line breaks at the danda, never in the middle of a pada; verse numbers are in Devanagari digits.
- Heading levels are not skipped; Sanskrit and Roman lines carry language tags; when moving by keyboard, no focused element hides under the sticky header.
- The print layout and the pothi mode are checked separately; opening offline is tested in a real "aeroplane mode".

On every live release a [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) report is taken for three pages (the home page, one occasion, one chapter of a long text); the targets are 95 or more for performance and 100 for accessibility, best practices and search, and the actual scores are written into the release report — also when they fall short of the target.

Every verification report, with its screenshots, lives in the site's [documents](https://github.com/Sudish007/panditbano/tree/main/docs).

# Language tags and Bhojpuri

Every page carries the tag of its language: Hindi, English or Bhojpuri. The valid tag for Bhojpuri is [bho](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry); the old tag [bh](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) was the code of the "Bihari languages" group and is now deprecated, so it is used nowhere.

The [hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions) signal that tells search engines about the language versions of a page is set here only for Hindi, English and [x-default](https://developers.google.com/search/docs/specialty/international/localized-versions) (which points to the Hindi page). **For Bhojpuri this signal is deliberately omitted**, because Google accepts only the two-letter language codes of ISO 639-1 and Bhojpuri has no such code. The Bhojpuri pages are nevertheless in the sitemap, linked from the language control of every page, and carry their own correct language tag; the sharing metadata likewise carries no locale code for Bhojpuri, because support for one is uncertain.

# Not verified yet

- **Bhojpuri** — the Bhojpuri text was written by the site's authors from the rules of the language and the spellings of [Shubhvela](https://sudish007.github.io/shubhvela/en/), but no native reader has read it yet; every Bhojpuri record is in "draft" state and every page says so in its footer.
- **Hindi and English** — written by the site's authors; no scholar's review is claimed.
- **Accent marks** — shown only where the source has them; where it does not, the page says so. The browser voice does not speak the accents and is labelled approximate.
- **Descriptions of tradition** — where the research could not confirm a point from a source, the page says "tradition holds" or "practice varies" instead of stating a fact; such points are listed separately in the review pack of each piece of content.
- **Regional custom** — the variants of Mithila, the Bhojpuri belt, Awadh and Braj, Rajasthan, the hills and Punjab-Haryana were written from the sources available; the custom of any one family may differ, and by the grihya-sutra that custom is the authority.
- **Search and offline** — the search engine and the automated offline test arrive in the site's third phase; until then these pages say "not yet".

Every release report restates this "not verified" list, so that nothing stays unsaid. If you see a mistake, say so on [GitHub Issues](https://github.com/Sudish007/panditbano/issues). The source policy is on the [Sources](/sources/) page and the list of books on the [Bibliography](/reference/bibliography/).
