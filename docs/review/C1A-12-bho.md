# C1A-12 — Bhojpuri review pack

Written 2026-11-01. Records: katha `satyanarayan-katha` — adhyaya 3, 4 and 5 retellings (`kathas/satyanarayan-katha/{3,4,5}.{hi,en,bho}.md`, 59 `{{verse:}}` panels: 20 + 19 + 20) and `katha.json` with `adhyayas[]` extended to 1–5 (the file is C1A-11's with three entries added; the staged `1.*`/`2.*` md files are byte-identical copies of C1A-11's so the lane gate could load the katha). Gate (lane mode, item dir): 0 FAIL, 6 FLAG (none from the new files — 2 G14 belong to C1A-11's adhyaya 1–2 copies, 4 to `ui/bho.json`), 123 WARN (cross-item references that resolve at integrate). Merged lane-B run (C1A-16+13+14+15+11+12 in `%TEMP%`): 0 FAIL, 27 FLAG, 100 WARN — every verse reference resolves; the only new FLAG line is `katha.json` G13 (titles/lede unmarked, as C1A-11 left them).

Sources of the Bhojpuri wording: term bank spellings (`termbank.json`: बरत, परसाद, जजमान, पुर्नवासी, घीव, केरा), the Bhojpuri verse meanings of C1A-14/C1A-15 (so the retelling and the मूल श्लोक panels use the same words), Shubhvela UI spellings, and the register rules of brief §6.4 / CONTENT-RULES §7.

## Pairs (EN → BHO)

1. The story resumes — King Ulkamukha → कथा फेर सुरू होला — राजा उल्कामुख
2. master of his senses, truthful, in the temple every day → जितेंद्रिय, सत्यवादी, रोज देवालय जाए वाला
3. "Sadhu" is the merchant's name here; the word also means "a good man" → इहाँ "साधु" ओह बनिया के नाँव बा; शब्द के माने "भला आदमी" भी होला
4. O king, what is this you are doing with a heart so full of devotion? → राजन, भक्ति से भरल मन से रउआ ई का करत बानी?
5. I too have no children → हमरो कवनो संतान नइखे
6. "when I have a child, then I shall perform this vrat" → "जब हमरा घरे संतान आ जाई, तब हम ई बरत करब"
7. That one sentence is the root of the whole story that follows → इहे एक वाक्य आगे के पूरा कथा के जड़ बा
8. by the grace of Satyadeva Lilavati was expecting a child → सत्यदेव के किरपा से लीलावती के पाँव भारी भइल
9. She grew day by day like the moon in the bright fortnight → ऊ अँजोरिया पाख के चाँद जइसन दिन-दिन बढ़े लगली
10. why do you not perform the vrat you resolved upon? → जवन बरत के संकल्प रउआ कइले रहीं, ओकरा काहे नइखीं करत?
11. find an excellent groom for the girl → कन्या खातिर कवनो श्रेष्ठ दुलहा खोजऽ
12. at the time of the wedding he forgot that excellent vrat → बियाह के बेरा ऊ उत्तम बरत उनका से बिसर गइल
13. he set the wealth down there in fear and slipped away unseen → ऊ डर से धन ओहिजे राख के चुपचाप सरक गइल
14. Without any inquiry the king had the two put in the prison of the great fort → राजा बिना कवनो बिचार कइले दुनो के बड़ दुर्ग के जेल में डाल दिहलन
15. Lilavati wandered from house to house → लीलावती घर-घर भटके लगली
16. daughter, where were you at night, what is on your mind? → बेटी, रात में कहाँ रहले, मन में का बा?
17. may my husband and my son-in-law come home soon, and may their offence be forgiven → हमार पति आ दमाद जल्दिये घरे लवटसु, आ उनकर अपराध छमा होखे
18. this great sorrow came upon you by fate; now there is nothing to fear → ई बड़ दुख तोहनी के दैव के जोग से मिलल; अब कवनो डर नइखे
19. by your grace we shall go → राउर किरपा से हमनी के जाइब
20. the practical point for the pandit is to ask the host at the sankalpa whether this katha fulfils an earlier vow → पंडित खातिर व्यवहार के बात ई बा कि संकल्प के बेरा जजमान से पूछ लीं कि ई कथा कवनो पुरान मनौती के पूरा करे खातिर बा कि ना
21. judgement without inquiry becomes injustice → बिना जाँच के न्याय अन्याय बन जाला
22. Sadhu, what is there in your boat? → साधु, तोहार नाव में का बा?
23. Do you want to carry off our money? → का हमनी के मुद्रा ले जाइल चाहत बाड़?
24. let your words be true → तोहार कहल साँच होखे
25. he saw the boat riding high on the water, as if it had been emptied → देखलन कि नाव पानी पर ऊपर उठल बा — जइसे खाली हो गइल होखे
26. Come, let us take refuge with him; only then will things come right → चलीं, उनका सरन में चलीं, तबे काज बनी
27. whatever I said in your presence, forgive me that offence → रउरा सोझा जे कुछ हम कह दिहनी, हमार ऊ अपराध छमा करीं
28. do not weep; listen to me → मत रोव, हमार बात सुन
29. I am a fool, deluded by your maya; how could I have known you? → हम मूरख, रउरा माया से मोहित, रउरा के कइसे जानतीं?
30. I have come to you for refuge — save me → हम सरन में आइल बानी, हमार रक्षा करीं
31. look, there is my Ratnapuri! → देख, ई हमार रत्नपुरी बा!
32. I am going to see your father; come quickly too → हम तोहार बाबूजी के देखे जात बानी, तू भी झट से आव
33. she ran off to see her husband without taking the prasad → परसाद लिहले बिना ही पति के देखे दउर पड़ली
34. By slighting which god has this happened? → कवना देवता के हेलना से ई भइल!
35. who can fathom the greatness of Satyadeva! → सत्यदेव के महिमा के जान सकेला!
36. the katha neither praises it nor recommends it → कथा ना एकरा सराहेले, ना एकर सलाह देले
37. his words were heard from the sky → अकास से उनकर बचन सुनाई पड़ल
38. now come home; why do you delay? → अब घरे चलीं, देरी काहे करत बानी?
39. "Never leave the prasad" → "परसाद कबो मत छोड़ीं"
40. Kalavati's mistake is haste, not disrespect → कलावती के भूल जल्दीबाजी के बा, अनादर के ना
41. sages, hear one more katha → हे मुनि लोग, अब एगो आउर कथा सुनीं
42. out of pride he neither went over nor bowed to the Lord → अहंकार से ना उहाँ गइलन, ना भगवान के परनाम कइलन
43. His hundred sons perished and all his wealth and grain was lost → उनकर सौ बेटा आ सगरी धन-धान नास हो गइल
44. the text's own statement, which the pandit reads at the close of the katha → ग्रंथ के आपन कथन, जेकरा पंडित कथा के अंत में पढ़ेलन
45. the poor man finds riches, the one in bonds is freed from his bonds, the fearful is released from fear → गरीब धन पावेला, बंदी बंधन से छूटेला, डेराइल मनई डर से छूटेला
46. some will call that same Lord "Kala", some "Satya", some "Isha" → कुछ लोग ओही भगवान के "काल" कहिहें, कुछ "सत्य", कुछ "ईश"
47. the katha names him here for the first time, Shatananda → कथा इहाँ पहिला बेर उनकर नाँव लेले, शतानंद
48. Shri Ranganatha is Vishnu reclining on Shesha → श्रीरंगनाथ शेष पर सुतल विष्णु बाड़न
49. herdsmen under a banyan tree, with no pandit and no temple → बर के पेड़ तरे ग्वाला लोग, बिना पंडित, बिना मंदिर
50. The katha ends here — go on to the Satyanarayan puja procedure, or read again from adhyaya 1 → कथा इहाँ पूरा भइल — आगे सत्यनारायण पूजा-विधि देखीं, भा पहिला अध्याय से फेर पढ़ीं

## Register decisions

- Narrative past in the honorific plural (-लन / -ली) for the Lord, the kings, Sadhu, the son-in-law, the messenger, Lilavati and Kalavati — the same choice as the verse meanings of C1A-14/15; plain -ल for the thief and the servants (सरक गइल, ले गइल).
- Pronouns inside reported speech follow the Sanskrit: the Lord and the kings address Sadhu / the merchants as तू / तोहार / तोहनी के (dandi: "मत रोव, हमार बात सुन"); Sadhu, the merchants and the daughter address the Lord, the king and the father as रउआ / राउर / रउरा (Kalavati to her father: "अब घरे चलीं"); Lilavati to Sadhu रउआ; Lilavati to Kalavati तू. Flagged again below — the owner has been asked the same question by C1A-13/14/15.
- Site voice: imperatives in -ीं only in the reader-facing lines (देखीं, पढ़ीं, पूछ लीं, कहीं); narration otherwise impersonal.
- Term-bank / folk forms over tatsama: बरत, परसाद, जजमान, पुर्नवासी, बियाह, जनम, नाँव, किरपा, छमा, सरन (सरनागति), परनाम, दरसन, धरम (धरमात्मा), सपना, भेस, बनिया, दमाद, माई/बाबूजी, हित-नाता, समुंदर, मलाह, खड़ाऊँ, अकास, बर के पेड़, ग्वाला, सिकार, सोक, हरख, बिपत, बिचार, बिसवास, बरनन, तियाग, दुरलभ, पुन्न, धारन, जोग (दैव के जोग), जेल, बेड़ी, सिपाही, रोज, जरूर, खबर.
- Tatsama kept for deity names and shastric terms (ण kept): सत्यनारायण, नारायण, विष्णु, जनार्दन, फलश्रुति, संकल्प, स्तुति, माया, अंतर्धान, निषादराज, वैकुंठ, गोलोक, पुराण, श्रृंगवेरपुर; ण → न in everyday words: कारन, गुन, गुनवान, चरन, बरनन, सरनागति, परीच्छा, अंस.
- ब्रज / ब्रजमंडल (not व्रज) as in the chapter-5 verse meanings of C1A-15; सत्यपुर, सत्यदेव, प्रभु kept as in the text.
- Pregnancy: the idiom "पाँव भारी भइल" (3.12) instead of the clinical गर्भवती of the verse meaning — natural speech and it keeps the health lint silent; the verse panel still shows the literal meaning.
- Sadhu's conditional vow: "जब हमरा घरे संतान आ जाई" (verse 3.10 meaning has "जब हमरा संतान होई", which the gate flags as an outcome phrase) — asked below.
- "with" = संगे; "or" = भा; "but" = बाकिर; "then" = फेर; "again and again" = बेर-बेर; "only" = खाली / बस; "at once" = तुरते / झट से; "even so" = तबो; "really" = सचहूँ; "a little way" = तनिके दूर; "already" = पहिलहीं.
- Honesty frames: कथा कहेले / ई ग्रंथ के आपन कथन बा / फलश्रुति for every statement of fruit; परंपरा में मानल जाला कि … for the two efficacy sentences in the site's voice (3: "ई बरत संकट से छोड़ावेला", 4: "परसाद के आदर बरत के अंग बा"); the sati-like resolve of 4.33 is explicitly marked "कथा के बरनन बा — ना सराहेले, ना सलाह देले".
- Verse numbers and chapter numbers in Latin digits (श्लोक 10–17); ordinals in words (तीसरा, चउथा, पाँचवाँ, पहिला, दुसरा).
- Nukta only in ड़/ढ़ (जरूर, रोज, खबर, जमीन, जल्दीबाजी).

## Unsure about

- बनिया for वैश्य (Sadhu) — the chapter meanings use it too; साहूकार / सेठ / वैश्य possible; owner to decide
- दमाद — or जमाई / दामाद; owner to decide
- माई / बाबूजी for Kalavati's parents — or माई-बाबू / महतारी; owner to decide
- हित-नाता for "kinsfolk" (बंधु-बांधव) — or नाता-रिस्ता / कुटुंब; owner to decide
- "पाँव भारी भइल" for pregnancy — idiom chosen over गर्भवती (which the verse meaning 3.12 uses); is the idiom acceptable in a katha retelling, and should both places agree?
- "जब हमरा घरे संतान आ जाई" for "when I have a child" — chosen over "संतान होई" (lint); does it sound natural?
- सरन / सरनागति (शरण) — tadbhava in the Lord's own episode; or keep शरण / शरणागति?
- सोक (शोक), सिकार (शिकार), छमा (क्षमा), किरपा, परनाम, दरसन, धरम, तियाग, दुरलभ, पुन्न, धारन, बरनन — the tadbhava set; owner to confirm the line between folk and shastric words
- अकास / अकास-मंडल / अकासबानी (heading of the 4.37–39 section) — spelling आकास? and is अकासबानी the right word for the voice from the sky?
- बर के पेड़ for वट-वृक्ष — or बरगद; owner to decide
- गोप vs ग्वाला — both used (गोप in the text's sense, ग्वाला as the gloss); owner to decide whether one should win
- मुद्रा (रुपया) for Sanskrit mudrā in the dandi's exchange — or सिक्का / पइसा?
- समुंदर, मलाह, खड़ाऊँ, जेल, सिपाही, बेड़ी — everyday words inside a Puranic story; too modern (जेल, सिपाही)?
- जल्दीबाजी vs हरबरी / अझुराहट for Kalavati's haste
- मनौती for a conditional vow (काम बन जाए त …) — the Hindi-belt word; Bhojpuri equivalent?
- जजमान (termbank spelling) — or यजमान in the katha pages?
- लमहर (long) for the hymn — or लंबा?
- भाव-केंद्र ("emotional centre") — a tatsama coinage; is there a plainer phrase?
- "के जान सकेला" (who can know) — के as 'who' before a verb; or केहू ना जान सकेला?
- एक्के (same / one and the same) vs एके / एकही
- तबो, तनिके, सचहूँ, पहिलहीं — register check (too rustic or fine?)
- "मत रोव" — the Lord's familiar imperative to Sadhu; or "रोवऽ मत"?
- "शेष पर सुतल विष्णु" — सुतल for 'reclining'; or शेष-शायी kept?
- Gender agreement of कथा / ग्रंथ as subjects: कथा कहेले / देखावेले (fem.) but ग्रंथ कहेला (masc.) — consistent with C1A-11's choice, owner to confirm the convention
- The son-in-law in honorific plural even after he sinks ("अलोप हो गइलन") — fine, or plain -ल for a young man?
- Register of the Lord / kings towards Sadhu (तू) vs Sadhu towards them (रउआ) — the same open question as C1A-13/14/15 (owner to decide once for the whole katha)
- Chapter titles in katha.json: "तीसरा / चउथा / पाँचवाँ अध्याय — …" (C1A-11's पहिला/दुसरा style) while text.json has तीसरा / चउथा / पाँचवाँ for the text pages — the two sets differ in wording after the dash; owner to decide whether katha and text titles should match

## Statements phrased as practice or tradition that are INFERENCE (owner / reviewer to confirm)

- "हिंदी पट्टी के कई घर में बियाह के बाद सत्यनारायण कथा करावे के रीति बा, जेकरा एही परसंग से जोड़ल जाला" (adhyaya 3 takeaways; also hi/en) — common Hindi-belt practice, not sourced to a text; marked as लोकाचार.
- "पंडित खातिर व्यवहार के बात … संकल्प के बेरा जजमान से पूछ लीं कि ई कथा कवनो पुरान मनौती के पूरा करे खातिर बा" (adhyaya 3) — the site's own practical advice.
- "जे ना आ पावल ओकरा घरे परसाद पठावल जाव" (adhyaya 5) — matches C1A-11's occasion ("पंजीरी घर में बाँटीं, पड़ोस में पठाईं"); custom, not text.
- "बर के पेड़ तरे ग्वाला लोग, बिना पंडित, बिना मंदिर" (adhyaya 5) — reading of 5.3–5.8 (the text names no priest); INFERENCE.
- "पूजा-विधि में पंडित एकरा (फलश्रुति) कथा के बाद, आरती से पहिले पढ़ेलन" (adhyaya 5) — the pothi order (phalashruti is part of adhyaya 5; aarti follows the katha in C1A-11's steps).
- The Ranganatha–Ikshvaku sentence on 5.21 is inherited from C1A-15's verse note, framed परंपरा में मानल जाला (INFERENCE from the Srirangam tradition).

## Gate FLAGs

Item dir `staging/B/C1A-12/content` (lane mode): 0 FAIL, 6 FLAG, 123 WARN. None of the FLAG lines is from the new 3/4/5 files; the two G14 lines are in C1A-11's adhyaya 1–2 copies (already listed in C1A-11's packs), the four G9 lines are the pre-existing `ui/bho.json` soft-list words.

```
FLAG  kathas/satyanarayan-katha/1.bho.md  G14  body: honesty lint (absolute claim): “नारद के मन में एकही सवाल उठल — अइसन कवन उपाय होखे जेसे एह लोग के दुख पक्का मिट जाए?” — frame as परम्परा में माना जाता है / tradition holds
FLAG  kathas/satyanarayan-katha/2.hi.md  G14  body: honesty lint (curative verb): “परंपरा में माना जाता है कि यह व्रत दुख दूर करता है; साइट इसे परंपरा के विश्वास के रूप में ” — frame as परम्परा में माना जाता है / tradition holds
FLAG  ui/bho.json  G9  site.description: review these token(s) (soft list): साथ
FLAG  ui/bho.json  G9  offline.update: review these token(s) (soft list): नया
FLAG  ui/bho.json  G9  home.path_learn_body: review these token(s) (soft list): साथ
FLAG  ui/bho.json  G9  home.path_texts_body: review these token(s) (soft list): साथ
```

Merged lane-B run (`%TEMP%\pb\1a\C1A-12\merged\content`, lane mode): 0 FAIL, 27 FLAG, 100 WARN. The only FLAG touching this item's files is the G13 line on `katha.json` (title/lede/adhyaya-title fields unmarked — `prasad` comes from the new adhyaya-4 title; C1A-11 left the other four unmarked on purpose because the titles render in headings). The 3/4/5 md files have no FLAG once C1A-16's glossary is present (every glossary term marked on first use).

```
FLAG  kathas/satyanarayan-katha/katha.json  G13  glossary term(s) used without [[…]] marking: puja, vidhi, vidhan, shlok, prasad
```

Two G14 FLAGs that appeared in the first run on the new files were reworded before the final run: 5.hi "कथा … समाप्त होती है" → "पूरी होती है"; 5.bho "खतम होले" → "पूरा होले".

## Integrate step (2026-11-02, main) — strings changed or added at integration
Copied from staging/B/C1A-12 unchanged: kathas/satyanarayan-katha/3.bho.md, 4.bho.md, 5.bho.md (and the hi/en files) and this pack.
The staged 1.*.md and 2.*.md were NOT copied: they are byte-identical to the repo's (SHA-256 verified), as the lane's note says. The
staged katha.json was NOT copied as a file: as the INTEGRATE NOTE on prd C1A-12 asks, only its adhyayas[] entries n = 3, 4, 5 (titles
hi/en/bho + 20/19/20 verseRefs) were inserted, text-level, into the repo's katha.json after the n = 2 entry (89 added lines, nothing
else changed — the repo's caveat strings with the [भविष्यपुराण](…) links and the 400-char cap, its shorter puranicSource.locator
"SkP Reva 233–237 (katha adhyaya 1–5)" and its CRLF line endings stay; the staged file's caveat and locator are the pre-fix C1A-11
versions). Field-by-field check before the merge: every other field of the two files equal; adhyaya 1–2 entries equal. No Bhojpuri
string of the lane was changed; the 31 "Unsure about" items above stay for the owner, plus the lane's two owner questions on 3.12
(पाँव भारी idiom) and 4.33 (no {{note:grief}} on the sati-like resolve).
Verification (this integration): npm run gate (strict, normal mode) 0 FAIL / 262 FLAG / 0 WARN — the same 262 as after C1A-15: no FLAG, FAIL
or WARN on 3/4/5.{hi,en,bho}.md or katha.json; every {{verse:}} ref and verseRef of adhyayas 3–5 resolves against content/texts/
satyanarayan-vrat-katha-sanskrit/3.json, 4.json, 5.json (the G13 line the lane saw in its merged run — katha.json title/lede/adhyaya
titles unmarked, incl. `prasad` from the adhyaya-4 title — does not fire here because the glossary terms it names arrive with
C1A-16; expect it at the C1A-16 integrate). npm run build 1154 pages / 1385 files (1145/1367 → +9 = adhyaya 3, 4, 5 × hi/en/bho),
hash 6922d4cc564e, clean first attempt. npm run test:integration 13/14 — budgets.test.mjs fails as in C1A-01…15 (159 pages > 150 KB;
+9 this item = the nine new adhyaya pages, hi 186.8 / 181.9 / 185.1 KB, en 163.1 / 159.6 / 162.5 KB, bho 185.6 / 180.3 / 184.1 KB;
the katha page itself was already over at 353 KB because it embeds the vidhi; p1a-fixer seam); links/offline/SEO/PWA/mantra-lang
tests pass. tools/audit.py C1A-12-r1 (/hi/kathas/satyanarayan-katha/3/, /4/, /5/ and the katha page at 390 + 1440, light + dark)
420 lines 0 FAIL 16 shots; r4 (adhyaya 4 and 5 in en and bho at 390 + 1440 light) 224 lines 0 FAIL 8 shots; r2 = eight Playwright
detail shots (verse panels 3.9, 4.33, 5.19 opened at 1440 light; 3.1 opened at 390 dark; the katha page's adhyaya cards; adhyaya 5's
"अगले जन्म" section with the curid links; the page bottoms); r3 = four shots of the "इस अध्याय से क्या समझें" lists and pagers
(adhyaya 5 at 1440, adhyaya 3 at 390). Shots read after the dimension check (.agents/tasks/v1-build/shots/C1A-12-r1-*, -r2-*, -r3-*,
-r4-*): danda line breaks and Devanagari verse numbers (॥ ३३ ॥ with IAST || 33 ||), speaker line "सूत उवाच" above 3.1, the visible
"स्वर चिह्न नहीं दिखाए गए" note and the श्लोक chip on every opened panel, the meaning line and the "→ text chapter" link under each,
external links with the ext icon, the five adhyaya tabs + विधि, the left rail with all five adhyayas, the pager on adhyaya 5 reading
"← पिछला अध्याय · कथा का परिचय · विधि →", the header band inside the header; no hard-UI-rule violation, no content defect found.
Observations for the p1a-fixer (not changed here): (a) the katha page and the kathas index print "5 अध्याय · 82 श्लोक" — 82 is the
number of verses quoted in the retellings (11 + 12 + 20 + 19 + 20), not the text's 170; the label may want to say so; (b) the
"स्रोत" list of every adhyaya page starts with the text-level entries (Reva index + अध्याय:२३३) before the chapter's own, as on
adhyayas 1–2; (c) the kathas index still prints "1 कथाएँ" (plural UI string for n = 1, noted at C1A-11); (d) [[sankalp]] and the
other term marks link to /hi/glossary/ until C1A-16 defines the terms.
