# C1A-14 — Hindi review pack
Written 2026-11-01. Records: `content/texts/satyanarayan-vrat-katha-sanskrit/3.json` (51 verses, SkP Reva 235 — every verse with `meaning` in hi/en/bho, chapter `intro` and `note` in hi/en/bho, 9 `variants[]` notes in hi/en/bho, one verse `note` on 3.3, 27 per-verse `source.modified` entries) and `text.json`, a byte-identical copy of C1A-13's file (the gate needs the text record next to its chapter files; nothing in it changed — the integrate step may skip it). Gate (lane mode, `npm run gate -- --dir staging/B/C1A-14/content --lane --dist %TEMP%\pb\1a\C1A-14\dist`): 0 FAIL, 12 FLAG (4 G14 honesty-lint FLAGs on the translated verse text of 3.10 and 3.12 — see below; 4 G7 for chapters 1, 2, 4, 5 that live in other staging items; 4 pre-existing `ui/bho.json` soft-list FLAGs, none in this item's files), 1 WARN (cross-item `vidhiOccasionId` → `satyanarayan-puja`, C1A-11 in this lane). A second run over the merged chapters 1–3 of this lane (C1A-13's text.json + 1.json + 2.json + this 3.json, in %TEMP%) gave 0 FAIL, 10 FLAG, 1 WARN — same findings minus the two G7 lines for chapters 1–2. Every record keeps `review: {"hi": "draft", "bho": "draft"}`.
## Pairs (EN → HI)
1. **3.1** Suta said: Now I shall tell what came next; listen, best of sages. In former times there was a king named Ulkamukha, a man of great wisdom. → सूत जी बोले — हे श्रेष्ठ मुनियों, अब मैं आगे की कथा कहता हूँ; सुनो। पहले समय में उल्कामुख नाम का एक बड़ा बुद्धिमान राजा था।
2. **3.3** His wife was lovely, lotus-faced and devoted to her husband. On the bank of the river Bhadrashila the king kept the vrat of Satyadeva (the Lord). → उनकी पत्नी बड़ी सुंदर, कमल-सी मुखवाली और पतिव्रता थी। भद्रशीला नदी के तट पर राजा ने सत्यदेव का व्रत किया।
3. **3.4** Meanwhile a merchant arrived there — Sadhu, which the katha uses as his name; he had come out to trade and was surrounded by much wealth of many kinds. → इसी बीच वहाँ साधु नाम का एक वैश्य आया, जो व्यापार के लिए निकला था और अनेक प्रकार के बहुत धन से घिरा (भरा-पूरा) था।
4. **3.6** The merchant said: O king, what is this that you are doing with a heart so full of devotion? Make it all known to me; I wish to hear it now. → साधु बोला — हे राजन, भक्ति से भरे मन से आप यह क्या कर रहे हैं? वह सब मुझे बताइए; मैं अभी सुनना चाहता हूँ।
5. **3.7** The king said: Sadhu, worship is being offered to Vishnu of matchless radiance, and this vrat is kept together with my own people, out of the wish for sons and the like. → राजा बोले — हे साधु, अतुल तेजवाले भगवान विष्णु का पूजन किया जा रहा है, और स्वजनों के साथ यह व्रत — पुत्र आदि की प्राप्ति की कामना से।
6. **3.9** I too have no offspring; from this vrat it will surely come. Then, done with his trading, he came home rejoicing. → मेरी भी संतान नहीं है; इस व्रत से वह निश्चय ही होगी। फिर व्यापार से निवृत्त होकर वह आनंद के साथ घर आया।
7. **3.10** He told his wife all about the vrat that grants offspring: "When I have a child, then I shall perform this vrat." → उसने पत्नी को संतान देने वाले इस व्रत की सारी बात कह सुनाई — "जब मुझे संतान होगी, तब मैं यह व्रत करूँगा।"
8. **3.12** — joined with her husband, glad at heart and given to dharma; and by the grace of Satyadeva that wife of his became pregnant. → — पति के साथ आनंदित मन से धर्म में लगी रही, और सत्यदेव की कृपा से उसकी वह पत्नी गर्भवती हुई।
9. **3.13** In the tenth month a jewel of a daughter was born to her. Day by day she grew, as the moon grows in the bright fortnight. → दसवें महीने में उसने एक [[kanya]]-रत्न को जन्म दिया। वह दिन-दिन ऐसे बढ़ने लगी जैसे शुक्ल पक्ष में चंद्रमा बढ़ता है।
10. **3.15** "Why do you not perform the vrat you resolved upon long ago?" The merchant said: "My dear, I shall perform the vrat at the time of her wedding." → "जिस व्रत का संकल्प आपने पहले किया था, उसे आप क्यों नहीं करते?" साधु बोला — "हे प्रिये, इसके विवाह के समय मैं वह व्रत करूँगा।"
11. **3.21** Then, as fate would have it, at the time of her wedding he forgot that excellent vrat; and at that the Lord grew angry with him. → फिर भाग्यवश कन्या के विवाह के समय वह उस उत्तम व्रत को भूल गया; इस पर प्रभु उससे रुष्ट हो गए।
12. **3.25** — seeing that he had broken his promise, laid a curse on him: "A dreadful, harsh and great sorrow shall befall him." → — उसे प्रतिज्ञा से गिरा हुआ देखकर शाप दिया — "इसे दारुण, कठिन और बड़ा दुख होगा।"
13. **3.31** By the maya of Satyadeva no one listened to what the two of them said; and so King Chandraketu took their wealth as well. → सत्यदेव की माया से उन दोनों की बात किसी ने नहीं सुनी; इसलिए राजा चंद्रकेतु ने उनका धन भी ले लिया।
14. **3.33** Beset by troubles of mind and body, tormented by hunger and thirst, worrying where food would come from, she wandered from house to house; and the girl Kalavati too went wandering every day. → मानसिक और शारीरिक पीड़ा से घिरी, भूख-प्यास से अत्यंत दुखी, अन्न की चिंता में वह घर-घर भटकने लगी; और कन्या कलावती भी हर दिन भटकती रही।
15. **3.37** The girl Kalavati answered her mother at once: "Mother, in a Brahmin's house I saw a vrat that grants what one wishes for." → कन्या कलावती ने माता को तुरंत उत्तर दिया — "माँ, मैंने एक ब्राह्मण के घर में मनचाही सिद्धि देने वाला व्रत देखा है।"
16. **3.42** and all the wealth you have now taken must be given back. If not, I shall destroy you along with your kingdom, your wealth and your sons." → और जो धन तुमने अभी लिया है, वह सब उन्हें दे दो। नहीं तो मैं तुम्हें राज्य, धन और पुत्रों के साथ नष्ट कर दूँगा।"
17. **3.43** Having said this to the king, the Lord withdrew, to be reached only in meditation. Then at daybreak the king, with his own people — → राजा से इतना कहकर प्रभु अंतर्धान हो गए — केवल [[dhyan]] से पाए जाने योग्य रह गए। फिर प्रातःकाल राजा अपने सभासदों के साथ —
18. **3.44** — sat in the midst of the assembly and told the people his dream: "Quickly release the two bound merchants, the two merchants' sons." → — सभा के बीच बैठकर लोगों को अपना स्वप्न कह सुनाया — "बँधे हुए उन दोनों महाजनों, दोनों वणिक-पुत्रों को शीघ्र छोड़ दो।"
19. **3.48** "This great sorrow came upon you by fate; now there is nothing to fear." Then he had their fetters removed and had them shaved, bathed and groomed. → "यह बड़ा दुख तुम्हें दैवयोग से मिला; अब कोई भय नहीं है।" तब राजा ने उनकी बेड़ियाँ खोलवाईं और क्षौर-कर्म आदि (नहाना-सँवरना) करवाया।
20. **3.51** Bowing to the king, the merchant said: "By your grace we shall go." With these words the two great merchants set out for their home. → राजा को प्रणाम करके साधु ने कहा — "आपकी कृपा से हम जाएँगे।" यह कहकर वे दोनों महावैश्य अपने घर की ओर चल पड़े।
## Register decisions
- Khari Boli for a family reader; anusvara throughout (चंद्रकेतु, संतान, अंतर्धान, बंदी, कंचन, जितेंद्रिय, संतुष्ट, संकल्प, चिंता, स्कंदपुराण, रेवाखंड, ग्रंथ, छंद, लंबा, पाठांतर); the conjunct spellings (चन्द्रकेतु, सन्तति, स्कन्दपुराण) stay inside the Sanskrit fields and the Sanskrit quotations only (G10). The English note carries the Sanskrit colophon; the Hindi note describes it.
- Deities and kings in the respectful plural (राजा उल्कामुख … थे / करते थे; प्रभु … हो गए; राजा चंद्रकेतु ने … कहा / बोले); the merchant Sadhu, the messenger, the thief and the king's men in plain narration; Lilavati and Kalavati in the singular (रही, हुई, गई).
- Speech: the merchant to the king आप / बताइए; the king to the merchant हे साधु with तुम-less imperatives avoided (3.50 "अपने घर जाओ" is the text's own familiar गच्छ); the Lord to King Chandraketu तुम / छोड़ दो / दे दो; the mother to her daughter तू / तेरे; the wife to her husband आप / करते.
- Words: वणिक (वणिक्) kept for the merchant with वैश्य once in 3.4 and in the title; महाजन kept as the text's word in 3.44–3.46; दामाद for जामाता; बेड़ियाँ for निगड; कारागार, दुर्ग kept; क्षौर-कर्म with the gloss (नहाना-सँवरना); सत्यदेव kept as a name with "(भगवान)" once (3.3), as in C1A-13.
- Half-verses that run on into the next verse (3.11→12, 3.19→20, 3.22→23, 3.24→25, 3.38→39→40→41→42, 3.43→44, 3.46→47) end and begin with "—" so the reader sees the sentence continue; speaker lines appear as "सूत जी बोले —", "साधु बोला —", "राजा बोले —".
- Honesty: the statements of fruit in 3.9, 3.10 and 3.37 are the characters' words, translated as the text says them and marked `phalashruti: true` (label "फलश्रुति — ग्रन्थ का अपना कथन"); 3.12 गर्भवती is the story's narrative fact (G14 health-term FLAG accepted, listed below). The intro says "कथा कहता है" and asserts nothing about outcomes.
- Nukta: none needed in this chapter (कंचन, दुर्ग, कारागार — no z/f sounds); Latin digits for verse numbers in the intro and notes.
## Unsure about
- वणिक vs वैश्य vs व्यापारी for वणिक्/साधु; महाजन kept or replaced by व्यापारी; owner to decide.
- "उसने एक कन्या-रत्न को जन्म दिया" (3.13) — keep the Sanskrit flavour कन्या-रत्न or say "एक सुंदर कन्या"; owner to decide.
- भाग्यवश (3.21, the copy source) vs दुर्भाग्य से (the variant's sense); owner to decide which the Hindi should carry.
- "प्रभो" (Sanskrit vocative kept in 3.29) vs "हे प्रभु"; "हे नृपश्रेष्ठ" (3.41) vs "हे राजाओं में श्रेष्ठ"; owner to decide.
- दैवयोग से (3.48) vs भाग्य से / विधि के विधान से; owner to decide.
- माता in narration (3.36) and माँ in Kalavati's speech (3.37) — keep both or one; owner to decide.
- "ध्यान से पाए जाने योग्य रह गए" for ध्यानगम्योऽभवत् (3.43) — or "ध्यान-गम्य हो गए" / simply "अंतर्धान हो गए"; owner to decide.
- "साधु" as the merchant's name throughout (हे साधु, साधु बोला) — or "साधु वैश्य" at every mention; owner to decide.
- Chapter title from C1A-13 kept ("तृतीय अध्याय — राजा उल्कामुख, साधु वैश्य और कलावती"); the story also turns on Lilavati and King Chandraketu — retitle or keep; owner to decide.
## Gate FLAGs
```
WARN  texts/satyanarayan-vrat-katha-sanskrit/text.json  G5  vidhiOccasionId "satyanarayan-puja" not found in this dir, content/ or any staging dir (lane mode — the integrate step re-checks)
FLAG  texts/satyanarayan-vrat-katha-sanskrit/3.json  G14  $.verses[9].meaning.bho: honesty lint (curative verb): “ऊ पत्नी से संतान देवे वाला एह बरत के सब बात कह सुनवलन — "जब हमरा संतान होई, तब हम ई बरत कर” — frame as परम्परा में माना जाता है / tradition holds
FLAG  texts/satyanarayan-vrat-katha-sanskrit/3.json  G14  $.verses[11].meaning.hi: honesty lint (health term): “— पति के साथ आनंदित मन से धर्म में लगी रही, और सत्यदेव की कृपा से उसकी वह पत्नी गर्भवती हु” — frame as परम्परा में माना जाता है / tradition holds
FLAG  texts/satyanarayan-vrat-katha-sanskrit/3.json  G14  $.verses[11].meaning.en: honesty lint (health term): “— joined with her husband, glad at heart and given to dharma; and by the grace of Satyadev” — frame as परम्परा में माना जाता है / tradition holds
FLAG  texts/satyanarayan-vrat-katha-sanskrit/3.json  G14  $.verses[11].meaning.bho: honesty lint (health term): “— पति के साथे आनंदित मन से धरम में लागल रहली, आ सत्यदेव के किरपा से उनकर ऊ पत्नी गर्भवती भ” — frame as परम्परा में माना जाता है / tradition holds
FLAG  texts/satyanarayan-vrat-katha-sanskrit/text.json  G7  chapter 1 is listed but texts/satyanarayan-vrat-katha-sanskrit/1.json does not exist yet (not rendered)
FLAG  texts/satyanarayan-vrat-katha-sanskrit/text.json  G7  chapter 2 is listed but texts/satyanarayan-vrat-katha-sanskrit/2.json does not exist yet (not rendered)
FLAG  texts/satyanarayan-vrat-katha-sanskrit/text.json  G7  chapter 4 is listed but texts/satyanarayan-vrat-katha-sanskrit/4.json does not exist yet (not rendered)
FLAG  texts/satyanarayan-vrat-katha-sanskrit/text.json  G7  chapter 5 is listed but texts/satyanarayan-vrat-katha-sanskrit/5.json does not exist yet (not rendered)
FLAG  ui/bho.json  G9  site.description: review these token(s) (soft list): साथ
FLAG  ui/bho.json  G9  offline.update: review these token(s) (soft list): नया
FLAG  ui/bho.json  G9  home.path_learn_body: review these token(s) (soft list): साथ
FLAG  ui/bho.json  G9  home.path_texts_body: review these token(s) (soft list): साथ
```

## Integrate step (2026-11-02, main) — strings changed or added at integration
Copied from staging/B/C1A-14 unchanged: texts/satyanarayan-vrat-katha-sanskrit/3.json (51 verses, SkP Reva 235) and this pack.
The staged text.json was NOT copied (as the lane's own deviation note and the INTEGRATE NOTE on prd C1A-14 ask): it is a
byte-identical copy of C1A-13's original, while the repo's text.json carries the C1A-13 integrate's भविष्यपुराण / Bhavishya Purana
links (G16 / UI-19) and the vidhiOccasionId "satyanarayan-puja" restored at C1A-11; its chapters[2] entry (n 3, verseCount 51,
locator SkP Reva 235, the lane's titles) already matches 3.json, so no text.json edit was needed. G18 clean: no verse of chapter 3
existed in content/ (the texts dir held text.json, 1.json, 2.json). Sources: ws-skanda-reva-235 (copy) and sd-satyanarayan-katha
(checkedAgainst) were already registered — sources.json untouched (147 → 147).
Changed in place, outside the lane's files: occasions/kathas/satyanarayan-puja.json steps[n=15] (कथा-श्रवण) textRefs[0].chapter
[1, 2] → [1, 2, 3]. The C1A-11 integrate had cut the lane's [1, 2, 3, 4, 5] to the published chapters because normal-mode G5
resolves chapters from chapter files; chapter 3 is published now, C1A-15 restores the full list (its INTEGRATE NOTE updated to say
the step currently reads [1, 2, 3]). Effect on the pages: the mukhya part page's step 15 now links "सत्यनारायण व्रतकथा (संस्कृत) —
अध्याय 3" beside adhyayas 1–2, and the chapter-3 page's "कहाँ पढ़ा जाता है" rail shows "सत्यनारायण पूजा विधि → चरण 15". No
hi/en/bho string of the lane was changed; the open word questions above stay for the owner.
Chapter 3 is the site's first paginated chapter (51 verses > the 40-verse page): /texts/satyanarayan-vrat-katha-sanskrit/3/ carries
verses 1–40 and /3/p2/ verses 41–51; the meta line says "पृष्ठ 1/2", the rail prints "मंत्र 1–40 · कुल 51 · अगला पृष्ठ →" /
"मंत्र 41–51 · कुल 51 · ← पिछला पृष्ठ" as text + link with no bar (design §27.4), and the verse navigator links 41–51 to /3/p2/#v41….
Verification (this integration): npm run gate (strict) 0 FAIL / 264 FLAG / 0 WARN (261 → 264 = +4 G14 on 3.json — 3.10 bho
curative-verb on a phalashruti verse, the record-level/per-verse lint quirk the lane reported, and 3.12 hi/en/bho गर्भवती/pregnant as
the story's narrative fact — minus the G7 line for chapter 3; G7 for chapters 4–5 stays until C1A-15); npm run build 1136 pages /
1352 files (1130/1340 → +6 = chapter 3 and its p2 in hi/en/bho), hash beca0b60ab6c, clean first attempt; npm run test:integration
13/14 — budgets.test.mjs fails as in C1A-01…13 (142 pages > 150 KB; +3 this item = hi/en/bho chapter 3 at 239.0 / 215.5 / 238.0 KB,
confirmed by building HEAD's content into a %TEMP% dist: 139 → 142, nothing else moved; p1a-fixer seam); links/offline/SEO/PWA/
mantra-lang tests pass. tools/audit.py C1A-14-r1 (chapter 3, the text page, /hi/occasions/satyanarayan-puja/mukhya/ at 390 + 1440,
light + dark, hi) 315 lines 0 FAIL 12 shots; r2 (/3/p2/ at 390 + 1440, light + dark) 105 lines 0 FAIL 4 shots; r3a/r3b detail shots
at #v33 (page 1) and #v44, #v51 (p2) at 1440 light 0 FAIL. Eight shots read after the dimension check
(.agents/tasks/v1-build/shots/C1A-14-r1-*, -r2-*, -r3a-*, -r3b-*): chapter 3 at 1440 light / 390 light / 1440 dark, the v33 detail
(the six-pada verse on three lines each ending at its danda, ॥ ३३ ॥ in Devanagari digits, IAST mirrored with | / || 33 ||,
"स्वर चिह्न नहीं दिखाए गए" visible under the block), the v44 detail (बद्धौ reading as the lane chose), p2 at 1440 light, the text
page at 1440 light (3 अध्याय · 102 श्लोक, three chapter cards, the "कहाँ पढ़ा जाता है" rail with steps 13 / 15 / 20) and the mukhya
part page at 1440 light. Header band inside the header (UI-10 / UI-10b pass); no hard-UI-rule violation seen on any of them; no
content defect found, nothing fixed in place.
Passed on to the p1a-fixer brief (engine, not content): (a) the lane's GATE LIMIT — a chapter-only staging dir FAILs G1 without a
text.json copy and the copy FAILs G18 once content/ has the real one (hits C1A-15 and every Phase 2 chapter item); (b) the G14
lint reads phalashruti from the chapter record once and per verse once, so a phalashruti verse's bho meaning still FLAGs.
