# C1A-14 — Bhojpuri review pack
Written 2026-11-01. Records: `content/texts/satyanarayan-vrat-katha-sanskrit/3.json` (51 verses, SkP Reva 235 — every verse with `meaning` in hi/en/bho, chapter `intro` and `note` in hi/en/bho, 9 `variants[]` notes in hi/en/bho, one verse `note` on 3.3, 27 per-verse `source.modified` entries) and `text.json`, a byte-identical copy of C1A-13's file (the gate needs the text record next to its chapter files; nothing in it changed — the integrate step may skip it). Gate (lane mode, `npm run gate -- --dir staging/B/C1A-14/content --lane --dist %TEMP%\pb\1a\C1A-14\dist`): 0 FAIL, 12 FLAG (4 G14 honesty-lint FLAGs on the translated verse text of 3.10 and 3.12 — see below; 4 G7 for chapters 1, 2, 4, 5 that live in other staging items; 4 pre-existing `ui/bho.json` soft-list FLAGs, none in this item's files), 1 WARN (cross-item `vidhiOccasionId` → `satyanarayan-puja`, C1A-11 in this lane). A second run over the merged chapters 1–3 of this lane (C1A-13's text.json + 1.json + 2.json + this 3.json, in %TEMP%) gave 0 FAIL, 10 FLAG, 1 WARN — same findings minus the two G7 lines for chapters 1–2.
Every record keeps `review: {"hi": "draft", "bho": "draft"}`. The Bhojpuri below was written by the site's authors and waits for the owner's native reading; nothing here is a scholarly review. The Sanskrit itself is copied from the source (Wikisource Reva 235, revid 404766, fetched 2026-11-01) and checked against sanskritdocuments.org, not written by us.
## Pairs (EN → BHO)
50 of the 51 verse meanings (the cap). Not paired here, read in the record: 3.51, the chapter intro, the chapter note, the note on 3.3 and the 9 variant notes.
### Adhyaya 3 (SkP Reva 235)
1. **3.1** Suta said: Now I shall tell what came next; listen, best of sages. In former times there was a king named Ulkamukha, a man of great wisdom. → सूत जी कहलन — हे श्रेष्ठ मुनि लोग, अब हम आगे के कथा कहत बानी; सुनीं। पहिले के समय में उल्कामुख नाँव के एगो बहुते बुद्धिमान राजा रहलन।
2. **3.2** Master of his senses and truthful, he went to the temple every day; day after day that wise king gave wealth and kept the Brahmins content. → ऊ जितेंद्रिय आ सत्यवादी रहलन आ रोज देवालय जात रहलन; ऊ बुद्धिमान राजा रोज-रोज धन दे के ब्राह्मण लोग के संतुष्ट करत रहलन।
3. **3.3** His wife was lovely, lotus-faced and devoted to her husband. On the bank of the river Bhadrashila the king kept the vrat of Satyadeva (the Lord). → उनकर पत्नी बहुते सुंदर, कमल अइसन मुँह वाली आ पतिव्रता रहली। भद्रशीला नदी के तीरे राजा सत्यदेव के बरत कइलन।
4. **3.4** Meanwhile a merchant arrived there — Sadhu, which the katha uses as his name; he had come out to trade and was surrounded by much wealth of many kinds. → एही बीच उहाँ साधु नाँव के एगो बनिया अइलन, जे बेपार खातिर निकलल रहलन आ कई तरह के ढेर धन से घेराइल (भरल-पूरल) रहलन।
5. **3.5** He moored his boat on that bank and went up to the king. Seeing the king engaged in the vrat, he asked with humility: → ऊ आपन नाव ओह तीरे लगवलन आ राजा के लगे गइलन। राजा के बरत करत देख के ऊ बिनय से पूछलन —
6. **3.6** The merchant said: O king, what is this that you are doing with a heart so full of devotion? Make it all known to me; I wish to hear it now. → साधु कहलन — हे राजन, भक्ति से भरल मन से रउआ ई का करत बानी? ऊ सब हमरा बताईं; हम अबहीं सुनल चाहत बानी।
7. **3.7** The king said: Sadhu, worship is being offered to Vishnu of matchless radiance, and this vrat is kept together with my own people, out of the wish for sons and the like. → राजा कहलन — हे साधु, अतुल तेज वाला भगवान विष्णु के [[puja]] हो रहल बा, आ घर के लोग के साथे ई बरत — बेटा आदि के पावे के कामना से।
8. **3.8** Hearing the king's words, the merchant said respectfully: Tell me all of it, O king; I will do just as you say. → राजा के बात सुन के साधु आदर से कहलन — हे राजन, हमरा सब कुछ बताईं; रउआ जवन कहब, हम ओही करब।
9. **3.9** I too have no offspring; from this vrat it will surely come. Then, done with his trading, he came home rejoicing. → हमरो संतान नइखे; एह बरत से ऊ जरूर होई। फेर बेपार से निवृत्त हो के ऊ आनंद के साथे घरे अइलन।
10. **3.10** He told his wife all about the vrat that grants offspring: "When I have a child, then I shall perform this vrat." → ऊ पत्नी से संतान देवे वाला एह बरत के सब बात कह सुनवलन — "जब हमरा संतान होई, तब हम ई बरत करब।"
11. **3.11** So spoke the merchant, that worthy man, to his wife Lilavati. One day his devoted wife Lilavati — → श्रेष्ठ साधु आपन पत्नी लीलावती से ई कहलन। एक दिन उनकर पतिव्रता पत्नी लीलावती —
12. **3.12** — joined with her husband, glad at heart and given to dharma; and by the grace of Satyadeva that wife of his became pregnant. → — पति के साथे आनंदित मन से धरम में लागल रहली, आ सत्यदेव के किरपा से उनकर ऊ पत्नी गर्भवती भइली।
13. **3.13** In the tenth month a jewel of a daughter was born to her. Day by day she grew, as the moon grows in the bright fortnight. → दसवाँ महीना में उनका एगो [[kanya]]-रतन के जनम भइल। ऊ दिन-दिन अइसे बढ़े लगली जइसे अँजोरिया पाख में चाँद बढ़ेला।
14. **3.14** Her naming rite was done: she was called Kalavati. Then Lilavati spoke sweet words to her husband: → ओकर नामकरण कइल गइल — नाँव राखल गइल कलावती। फेर लीलावती आपन स्वामी से मीठ बोली कहली —
15. **3.15** "Why do you not perform the vrat you resolved upon long ago?" The merchant said: "My dear, I shall perform the vrat at the time of her wedding." → "जवन बरत के संकल्प रउआ पहिले कइले रहीं, ओकरा रउआ काहे नइखीं करत?" साधु कहलन — "हे प्रिये, एकरा बियाह के बेरा हम ऊ बरत करब।"
16. **3.16** Having reassured his wife in this way, he went off to the city. Then the girl Kalavati grew up in her father's house. → पत्नी के अइसे भरोसा दे के ऊ नगर चल गइलन। फेर कन्या कलावती बाबूजी के घर में बढ़े लगली।
17. **3.17** Then, seeing the girl in the city with her friends, the merchant, who knew his duty, took counsel and quickly sent off a messenger: → फेर एक दिन नगर में सखी लोग के साथे कन्या के देख के धरम जाने वाला साधु (घर में) बिचार कइलन आ तुरते दूत पठवलन —
18. **3.18** "Look for an excellent groom for the girl's marriage." So commanded by him, the messenger went to the city of Kanchana. → "कन्या के बियाह खातिर कवनो श्रेष्ठ दुलहा खोजऽ।" उनकर आज्ञा पा के ऊ दूत कंचन नगर गइल।
19. **3.19** From there he returned bringing a merchant's son. Seeing that handsome, virtuous young merchant's son — → उहाँ से ऊ एगो बनिया के बेटा के साथे ले के लवटल। ओह सुंदर, गुनवान बनिया-पुत्र के देख के —
20. **3.20** — the merchant, content at heart, together with his kinsmen and relatives, gave his daughter to that youth with all due rites. → — साधु संतुष्ट मन से, जाति-हित के साथे, [[vidhi]]-विधान से आपन कन्या ओह लड़िका (दुलहा) के दे दिहलन।
21. **3.21** Then, as fate would have it, at the time of her wedding he forgot that excellent vrat; and at that the Lord grew angry with him. → फेर भाग के फेर से कन्या के बियाह के बेरा ऊ उत्तम बरत उनका से बिसर गइल; एह पर प्रभु उनका पर रुष्ट हो गइलन।
22. **3.22** Then in due course the merchant, skilled in his own calling and bound to it, quickly set out for trade together with his son-in-law — → फेर कुछ समय बाद आपन काम में कुसल आ ओह में बान्हल ऊ बनिया बेपार खातिर जल्दिये दमाद के साथे —
23. **3.23** — went to the lovely city of Ratnasarapura near the sea, and there the merchant carried on his trade with his wealthy son-in-law. → — समुंदर के लगे बसल सुंदर रत्नसारपुर गइलन, आ उहाँ साधु आपन धनी दमाद के साथे बेपार कइलन।
24. **3.24** The two went into that lovely city of King Chandraketu. At this very time Lord Satyanarayan — → ऊ दुनो राजा चंद्रकेतु के ओह सुंदर नगर में गइलन। ओही समय प्रभु सत्यनारायण —
25. **3.25** — seeing that he had broken his promise, laid a curse on him: "A dreadful, harsh and great sorrow shall befall him." → — उनका के आपन वचन से गिरल देख के उनका शाप दिहलन — "एकरा दारुन, कठिन आ बड़ दुख होई।"
26. **3.26** One day a thief, having taken the king's wealth, came to the very place where the two merchants were staying. → एक दिन एगो चोर राजा के धन ले के ठीक ओही जगह आ गइल जहाँ ऊ दुनो बनिया ठहरल रहलन।
27. **3.27** Seeing the king's men running after him, in fear he set the wealth down right there and at once slipped away unseen. → आपन पाछे दउरत आवत राजा के सिपाही लोग के देख के ऊ डेराइल मन से धन ओहिजे राख के चुपचाप तुरते सरक गइल।
28. **3.28** Then the king's men came to where the honest merchant was. Seeing the king's wealth there, they bound the two merchants and brought them away. → फेर राजा के दूत उहाँ पहुँचलन जहाँ ऊ सज्जन बनिया रहलन। उहाँ राजा के धन देख के ऊ लोग दुनो बनिया-पुत्र के बान्ह के ले अइलन।
29. **3.29** Running up in high spirits, they said before the king: "Lord, two thieves have been brought in; look at them and give your orders." → हरख से दउरत ऊ लोग राजा के लगे जा के कहलन — "प्रभु, दू गो चोर पकड़ के ले आइल गइल बाड़न; देख के आज्ञा दीं।"
30. **3.30** At the king's command they at once bound the two of them tightly and, without any inquiry, put them in the prison of the great fort. → राजा के आज्ञा पा के ऊ लोग तुरते दुनो के कस के बान्हलन आ बिना कवनो बिचार कइले बड़ दुर्ग के जेल में डाल दिहलन।
31. **3.31** By the maya of Satyadeva no one listened to what the two of them said; and so King Chandraketu took their wealth as well. → सत्यदेव के माया से ऊ दुनो के बात केहू ना सुनल; एह से राजा चंद्रकेतु उनकर धन भी ले लिहलन।
32. **3.32** Through that same curse, at the home of the two the (merchant's) wife too fell into great distress: whatever wealth lay in the house, a thief carried it all off. → ओही शाप से ऊ दुनो के घरे भी (साधु के) पत्नी बहुते दुखी हो गइली — घर में जवन धन राखल रहे, ऊ सब चोर ले गइल।
33. **3.33** Beset by troubles of mind and body, tormented by hunger and thirst, worrying where food would come from, she wandered from house to house; and the girl Kalavati too went wandering every day. → मन आ देह के पीड़ा से घेराइल, भूख-पियास से बहुते दुखी, अन्न के चिंता में ऊ घर-घर भटके लगली; आ कन्या कलावती भी रोज भटकत रहली।
34. **3.34** One day, faint with hunger, she went to a Brahmin's house, and there she saw the vrat of Satyanarayan being performed. → एक दिन भूख से बेहाल हो के ऊ एगो ब्राह्मण के घरे गइली आ उहाँ सत्यनारायण के बरत होत देखली।
35. **3.35** She sat down, listened to the katha and also prayed for a boon; after eating the prasad she went home at night. → उहाँ बइठ के ऊ कथा सुनली आ आपन मनोकामना खातिर [[prarthana]] भी कइली; परसाद खा के ऊ रात में घरे गइली।
36. **3.36** Her mother said lovingly to the girl Kalavati: "Daughter, where were you at night? What is on your mind?" → माई कन्या कलावती से नेह से कहली — "बेटी, रात में तू कहाँ रहले? तोहरा मन में का बा?"
37. **3.37** The girl Kalavati answered her mother at once: "Mother, in a Brahmin's house I saw a vrat that grants what one wishes for." → कन्या कलावती माई के तुरते जवाब दिहली — "माई, हम एगो ब्राह्मण के घर में मनचाहा सिद्धि देवे वाला बरत देखले बानी।"
38. **3.38** Hearing the girl's words, the merchant's wife then made ready to perform the vrat of Satyanarayan — → कन्या के बात सुन के बनिया के पत्नी तब सत्यनारायण के बरत करे खातिर तइयार भइली —
39. **3.39** — and that virtuous woman performed the vrat with her kinsfolk and her own people, (praying:) "May my husband and my son-in-law quickly come back to their home, → — आ ऊ साध्वी हित-नाता आ घर के लोग के साथे बरत कइली (आ प्रार्थना कइली) — "हमार पति आ दमाद जल्दिये आपन घर लवट आवसु,
40. **3.40** and be pleased to forgive the offence of my husband and my son-in-law." Pleased by this vrat, Satyanarayan then — → आ हमार पति आ दमाद के अपराध छमा करे के किरपा करीं।" एह बरत से खुस हो के सत्यनारायण फेर —
41. **3.41** — appeared in a dream to Chandraketu, that best of kings: "Best of kings, release the two imprisoned merchants in the morning, → — श्रेष्ठ राजा चंद्रकेतु के सपना में दरसन दिहलन — "हे राजा लोग में श्रेष्ठ, भोरे ऊ दुनो बंदी बनिया के छोड़ दऽ,
42. **3.42** and all the wealth you have now taken must be given back. If not, I shall destroy you along with your kingdom, your wealth and your sons." → आ जवन धन तू अबहीं लिहले बाड़े, ऊ सब उनका लोग के दे दऽ। ना त हम तोहरा के राज, धन आ बेटा सहित नास कर देब।"
43. **3.43** Having said this to the king, the Lord withdrew, to be reached only in meditation. Then at daybreak the king, with his own people — → राजा से एतना कह के प्रभु अंतर्धान हो गइलन — खाली धियान से पावे जोग रह गइलन। फेर भोरे राजा आपन सभासद लोग के साथे —
44. **3.44** — sat in the midst of the assembly and told the people his dream: "Quickly release the two bound merchants, the two merchants' sons." → — सभा के बीचे बइठ के लोग के आपन सपना कह सुनवलन — "बान्हल ऊ दुनो महाजन, दुनो बनिया-पुत्र के जल्दिये छोड़ दऽ।"
45. **3.45** Hearing these words of the king, they set the two merchants free, brought them before the king and said humbly: → राजा के ई बात सुन के ऊ लोग दुनो महाजन के छोड़ के राजा के आगे ले अइलन आ बिनय से कहलन —
46. **3.46** "The two merchants' sons have been brought, freed from their fetters." Then the two merchants bowed to Chandraketu, the best of kings — → "दुनो बनिया-पुत्र के बेड़ी से छोड़ा के ले आइल गइल बा।" तब दुनो महाजन श्रेष्ठ राजा चंद्रकेतु के [[namaskar]] कइलन —
47. **3.47** — and, remembering what had gone before, they said nothing, overcome with fear. The king looked at the two merchants' sons and spoke to them with respect: → — आ पहिले के घटना इयाद कइके डर से बेहाल ऊ कुछ बोल ना पवलन। राजा दुनो बनिया-पुत्र के देख के आदर से कहलन —
48. **3.48** "This great sorrow came upon you by fate; now there is nothing to fear." Then he had their fetters removed and had them shaved, bathed and groomed. → "ई बड़ दुख तोहनी के दैव के जोग से मिलल; अब कवनो डर नइखे।" तब राजा उनकर बेड़ी खोलववलन आ क्षौर-करम आदि (नहाना-सँवरना) करववलन।
49. **3.49** The king gave the two merchants' sons clothes and ornaments, satisfied them, honoured them, and with kind words made them very glad. → राजा ऊ दुनो बनिया-पुत्र के कपड़ा आ गहना दे के संतुष्ट कइलन, उनका लोग के सम्मान दिहलन आ मीठ बोली से उनका लोग के बहुते खुस कइलन।
50. **3.50** The wealth that had earlier been taken from them the king gave back doubled, and then said to them: "Sadhu, go home to your own place." → जवन धन पहिले उनका लोग से लिहल गइल रहे, ऊ दुगुना कइके राजा उनका लोग के दे दिहलन आ कहलन — "हे साधु, आपन घर जा।"
## Register decisions
- **बरत, बियाह, परसाद, नाँव, जनम** — Shubhvela spellings as common nouns (soft-list words व्रत/विवाह/प्रसाद/नाम/जन्म avoided); **व्रत / विवाह** only inside the Sanskrit fields and the Sanskrit quotations of the variant notes. Chapter title kept from C1A-13's text.json ("तीसरा अध्याय — राजा उल्कामुख, साधु बनिया आ कलावती").
- **Names and shastric words keep ण / tatsama** (decisions.md §9 rule 2): सत्यनारायण, ब्राह्मण, विष्णु, प्रभु, महावैश्य (3.51), सभासद, आज्ञा, आदेश, स्रोत, पाठांतर. **Everyday words go tadbhava / ण→न**: बिनय (विनय), बिचार (विचार), बेपार (व्यापार), बनिया (वणिक / वैश्य), दमाद (जामाता), दुलहा (वर), कुसल, गुनवान, दारुन, धरम, करम (क्षौर-करम), धियान, दरसन, परनाम, किरपा, छमा (क्षमा), हरख (हर्ष), समुंदर, पियास, इयाद, बिसेसन (विशेषण), सुभाव (स्वभाव), सबद (शब्द), अरथ, दरज, टिप्पनी, अंगरेजी.
- **साधु** is kept as the merchant's name (the intro says so once and notes the word also means 'a good man'); **बनिया** renders वणिक/वैश्य in the prose; **महाजन** kept as the text's own word for the two merchants in 3.44–3.46.
- **Honorific plural -लन** for the king Ulkamukha, King Chandraketu, the merchant Sadhu, Suta, the Lord, the Brahmins and (collectively) the king's men; **feminine honorific -ली** for Lilavati and Kalavati (रहली, कहली, गइली, भइली, देखली); **plain forms** for the thief and the messenger (गइल, लवटल, सरक गइल, राख दिहल).
- **Second person inside the story**: the merchant to the king and the wife to her husband use **रउआ / राउर** and the -ीं imperatives (बताईं, दीं, करीं); the king and the merchant to each other as equals in 3.50–3.51 (जा / राउर किरपा); the Lord to the king uses the familiar **तू / तोहरा / दऽ / लिहले बाड़े** (as the Lord to Narada in C1A-13); the mother to her daughter **तू / रहले / तोहरा**; the king to the two merchants **तोहनी के**; the merchant to his wife **हे प्रिये** with हम / करब.
- **Kinship**: हित-नाता (बन्धु), घर के लोग (स्वजन), जाति-हित (ज्ञाति-बन्धु), माई (माता), बाबूजी (पिता), दमाद (जामाता), पत्नी kept tatsama (मेहरारू felt too colloquial for a Puranic narration — owner to confirm, see below).
- **Connectives and copulas** as in C1A-13: आ (and), फेर (then), एह से (therefore), ना त (if not), काहे कि (because), भी (also); बा / बाड़न / बानी / रहे / रहलन / भइल; habitual -ेला / -ेलन (पढ़ेला, गिनेला, करेलन); future करब / होई / देब / जाइब; subjunctive आवसु (may they come, 3.39).
- **शुक्ल पक्ष** rendered **अँजोरिया पाख** (3.13); **कारागार** rendered **जेल** (3.30); **निगड** rendered **बेड़ी**; **क्षौरकर्म** kept as क्षौर-करम with the gloss (नहाना-सँवरना).
- **Honesty**: the statements about the vrat's fruit in 3.9, 3.10 and 3.37 are the characters' words and carry `phalashruti: true`, so the renderer labels them "ग्रन्थ का अपना कथन" (the G14 FLAG on 3.10 bho is a gate quirk: a chapter's verse fields are linted once at record level — where `phalashruti` is read from the chapter, i.e. false — and once per verse, where the verse flag is honoured; the record-level pass raised this FLAG. Reported for the FEAT owner; the line is listed below anyway). 3.12 "गर्भवती भइली" is a narrative fact of the story (health-term FLAG accepted: a translation, not a claim of the site). The intro uses "कथा कहेला" and describes the story without asserting outcomes.
- **दुसरा** (not दूसरा), ordinals **तीसरा, दसवाँ**; Latin digits in prose; "[[shlok]] 33 छह पद के बा" worded so the count lint (G17) does not read it as a corpus count.
- `[[term-id]]` marks on first use per file: vrat, vidhan, sankalp, shlok, brahman, prasad (intro); puja (3.7), kanya (3.13), vidhi (3.20), prarthana (3.35), dhyan (3.43), namaskar (3.46), vastra (3.49). Other term-bank forms that appear (भगवान, विष्णु, सत्यनारायण, कथा, अध्याय, पाठ, नामकरण, दिन, रात, जगह, महीना, आगे, काम) are left unmarked — they are deity/calendar/UI terms not in glossary batch 1; G13 will FLAG them once their glossary records exist, as C1A-16's findings predicted.
## Unsure about
- बनिया for वणिक / वैश्य — or बैस / सेठ / बेपारी; owner to decide.
- दमाद vs दामाद vs जमाई for जामाता (the Hindi appended on the Wikisource page says जमाई); owner to decide.
- दुलहा for वर (the groom) — or बर; owner to decide.
- माई vs माता vs महतारी for माता; बाबूजी vs बाबू vs पिता for पितृ-; owner to decide.
- अँजोरिया पाख for शुक्ल पक्ष — or उजियार पाख / सुकुल पाख / शुक्ल पक्ष kept; owner to decide.
- हरख (हर्ष) — or खुसी; खुस vs खुश (no-nukta rule, as in C1A-13); owner to decide.
- छमा vs क्षमा; किरपा vs कृपा; धियान vs ध्यान; दरसन vs दर्शन — tadbhava or tatsama for a katha page; owner to decide.
- इयाद vs याद (3.47); डेराइल vs डराइल (3.27); बेहाल for व्याकुल / विह्वल / क्षुधार्ता; owner to decide.
- जेल for कारागार (3.30) — or कारागार / बंदीघर / हवालात; owner to decide.
- बेपार vs व्यापार; कुसल vs कुशल; गुनवान vs गुणवान; दारुन vs दारुण (3.25); owner to decide.
- "भाग के फेर से" for भाग्यवशात् (3.21) — idiom acceptable, or "भाग से" / "किस्मत से"; owner to decide.
- पत्नी kept tatsama — or मेहरारू / घरवाली (C1A-11 raised घरवाली); owner to decide.
- तोहनी के (3.48, the king to the two merchants) — or तोहनी लोग के / रउआ लोग के; register of a king towards merchants he has wronged; owner to decide.
- आवसु (3.39, 'may they come back') — or आ जासु / लवट आवें; owner to decide.
- देवे वाला (3.10, 3.37) vs देबे वाला; owner to decide.
- समुंदर vs समुद्र (3.23); सिपाही for the king's men (धावकान् दूतान्, 3.27) — or दूत / पहरुआ / राजपुरुष; owner to decide.
- बान्हल / बान्ह के (बद्ध, 3.28, 3.30, 3.44) vs बाँधल / बाँध के; owner to decide.
- सरक गइल (3.27, slipped away) — or खिसक गइल / भाग गइल; owner to decide.
- लमहर (3 intro, 'longest') — or लंबा; बिसरला / बिसर गइल for 'forgot' — or भुला गइल; owner to decide.
- कन्या-रतन (3.13) — keep the Sanskrit flavour, or बेटी / लरिकी; owner to decide.
- मनोकामना (3.35) for वर 'boon' — avoids बर (groom) but is tatsama; or मनौती / आसीस; owner to decide.
- The Lord addressing King Chandraketu as तू (3.41–3.42) — right for a deity in a dream, or रउआ; owner to decide (same question as C1A-13 for the Lord and Narada).
## Editorial decisions on the Sanskrit (for the owner and the next items)
- Copy source Wikisource Reva 235 (MediaWiki API wikitext, revid 404766, fetched 2026-11-01; raw under %TEMP%\pb\1a\C1A-14\ws-२३५.wikitext.txt with URL + date meta); second source sanskritdocuments.org satyanArAyaNavratakathA (Playwright inner_text fetched 2026-11-01 by C1A-13, copied with its meta; the adhyaya-3 block saved as sd-ch3.txt). Both have 51 verses with the same division; verse 33 has six padas in both.
- Normalised as recorded in the chapter's `source.modified`: ASCII colon → ः, half-verse ॥ → ।, verse numbers / quotation marks / one ASCII hyphen / the appended Hindi translation dropped, spacing normalised. 27 per-verse `source.modified` entries list the typing slips corrected against the second source (dropped viramas, dropped vowel signs, सम्ना→नाम्ना, किमर्यं→किमर्थं, सार्वं→सार्धं, राज्यन्→राजन्, रुष्टे→रुष्टो, मुक्तो→मुक्तौ, स्वामाश्रमम्→स्वमाश्रमम्, प्रासादतः→प्रसादतः, the sandhi कन्याया वरं) and the places where the second source's own slips were NOT followed (प्रपच्छ, र्गभिणी, दत्तावान्, दृष्टवा, र्प्राथित, ही, देवात्).
- One reading departs from the copy source: 3.44 **बद्धौ** महाजनौ (second source) for the page's वृद्धौ, because 3.45–3.48 speak of release from fetters and वृ/ब is an easy slip; recorded as a variant with the page's reading. The other eight variants (3.4 परिपूरितः, 3.18 विवाहार्थं, 3.21 ततोऽभाग्यवशात्, 3.29 प्रोचुः, 3.34 याता, 3.38 मुदा, 3.42 सराज्यधनपुत्रकम्, 3.50 प्रोवाच च) record the second source's reading while the copy source's stands in `devanagari`.
- Speaker lines: `speaker` set where the verse opens with the speaker (3.1 सूत उवाच, 3.6 साधुरुवाच, 3.7 राजोवाच); the mid-verse साधुरुवाच of 3.15 kept inside `devanagari` as the page prints it (as C1A-13 did for 1.8, 2.4, 2.5).
- The Wikisource page breaks off inside the colophon ('…तृतीयोऽध्या'); the chapter `note` gives the second source's full colophon. The appended Hindi translation on the page was not used (brief §6.1: own-words meanings).
- INTEGRATE NOTE: a chapter-only item cannot pass the lane gate by itself — without text.json the gate FAILs G1 (orphan chapter), and with content/ holding C1A-13's text.json a copy FAILs G18 at integrate time. The byte-identical text.json copy here lets the lane gate run now; the integrate step should copy only 3.json (and the review packs) and run the normal gate over content/. C1A-15 and every Phase 2 chapter item (Durga Saptashati, Sundarkand, Gita…) will meet the same limit; a FEAT fix (lane mode: resolve an orphan chapter's text.json from the pools and WARN) would remove it.
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
