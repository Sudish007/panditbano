// Derived data (design.md §10.6, §11.1 stage 3, §11.6, §16.1; decisions.md §7.2). Everything here is computed from
// the loaded content: IAST / easy-Roman / ariaPlain per record, vinyog from occasion steps, counts, the published
// chapter set, chapter pagination (≤ 40 verses per part), glossary pages, Shubhvela URLs and attribution lines.
import { toIAST, toEasy, ariaPlain } from "./translit.mjs";
import { countFallbackSvara } from "./deva.mjs";

export const LANGS = ["hi", "en", "bho"];
export const PART_SIZE = 40;
export const SHUBHVELA = "https://sudish007.github.io/shubhvela/";

const hasTri = (o) => !!o && typeof o === "object" && LANGS.every((l) => typeof o[l] === "string" && o[l].trim());

/** A chapter is published when every verse has a meaning in all three languages (brief §6.1; design G7). */
export const isPublished = (chapter) => Array.isArray(chapter.verses) && chapter.verses.length > 0 && chapter.verses.every((v) => hasTri(v.meaning));

/** Split verses into parts of ≤ PART_SIZE (design §7.8); a single part when the chapter fits. */
export function paginate(verses, size = PART_SIZE) {
  const parts = [];
  for (let i = 0; i < verses.length; i += size) parts.push(verses.slice(i, i + size));
  return parts.length ? parts : [[]];
}

function translit(rec, id) {
  const iast = toIAST(rec.devanagari, id);
  return { iast, easy: toEasy(iast), ariaPlain: ariaPlain(rec.devanagari), svaraFallback: countFallbackSvara(rec.devanagari) };
}

/** Year-less, always-valid Shubhvela hrefs (design §16.1); app.mjs upgrades festival/muhurat links with the device clock. */
export function shubhvelaUrl(lang, kind, id = null) {
  switch (kind) {
    case "muhurat": return `${SHUBHVELA}${lang}/muhurat/`;
    case "festival": return `${SHUBHVELA}${lang}/festivals/`;
    case "vrat": return id ? `${SHUBHVELA}${lang}/vrat/${id}/` : `${SHUBHVELA}${lang}/festivals/`;
    case "panchang": return `${SHUBHVELA}${lang}/panchang/new-delhi/`;
    default: return `${SHUBHVELA}${lang}/`;
  }
}

/** Which attribution line pattern (decisions.md §7.2) a registry entry gets. */
export function attributionPattern(entry) {
  if (!entry) return "O";
  switch (entry.project) {
    case "wikisource": return "W";
    case "sanskritdocuments": return "S";
    case "gretil": return "G";
    case "vhp": return "V";
    case "publisher": return "B";
    case "archive": return entry.kind === "scan" || entry.kind === "copy" ? "T" : "B";
    default: return entry.kind === "copy" || entry.kind === "scan" ? "T" : entry.kind === "link" ? "V" : "O";
  }
}

const CC = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC_HI = "https://creativecommons.org/licenses/by-sa/4.0/deed.hi";
const NC = "https://creativecommons.org/licenses/by-nc-sa/4.0/";
const wsName = { sa: { hi: "संस्कृत", en: "Sanskrit", bho: "संस्कृत" }, hi: { hi: "हिन्दी", en: "Hindi", bho: "हिन्दी" } };

/**
 * The attribution line for a record's source (decisions.md §7.2 lines W/S/G/V/B/T verbatim where given; hi/bho
 * renderings of G/B/T/O follow the W/S wording). Returns { pattern, text, url, licenceUrl }.
 */
export function attributionLine(entry, { retrieved, modified = false, checked = false } = {}, lang = "hi") {
  const p = attributionPattern(entry);
  const title = entry?.title || "";
  const url = entry?.url || "";
  const date = retrieved || entry?.retrieved || "";
  const mod = (hi, en, bho) => ({ hi, en, bho })[lang];
  let text;
  switch (p) {
    case "W": {
      const ws = wsName[entry.wikisourceLang || "sa"][lang];
      const m = modified
        ? mod(`परिवर्तन: ${typeof modified === "string" ? modified : "विराम-चिह्न और अवग्रह का मानकीकरण"}; पाठान्तर नीचे दिए हैं।`, `Modified: ${typeof modified === "string" ? modified : "punctuation and avagraha normalised"}; variant readings listed below.`, `बदलाव: ${typeof modified === "string" ? modified : "विराम-चिह्न आ अवग्रह के मानकीकरन"}; पाठान्तर नीचे दिहल बा।`)
        : mod("बिना परिवर्तन।", "Unmodified.", "बिना बदलाव।");
      text = mod(
        `मूल पाठ: ${ws} विकिस्रोत, “${title}” (${url}), ${date} को लिया गया। प्रतिलेखन विकिस्रोत योगदानकर्ताओं का, CC BY-SA 4.0 (${CC_HI}); मूल रचना सार्वजनिक अधिकार-क्षेत्र (पब्लिक डोमेन) में है। ${m}`,
        `Source text: ${ws} Wikisource, “${title}” (${url}), retrieved ${date}. Transcription by Wikisource contributors, CC BY-SA 4.0 (${CC}); the work itself is in the public domain. ${m}`,
        `मूल पाठ: ${ws} विकिस्रोत, “${title}” (${url}), ${date} के लिहल गइल। प्रतिलेखन विकिस्रोत के योगदान देवे वाला लोग के, CC BY-SA 4.0 (${CC_HI}); मूल रचना पब्लिक डोमेन में बा। ${m}`,
      );
      return { pattern: p, text, url, licenceUrl: CC };
    }
    case "S": {
      const enc = entry.encoders ? ` (${entry.encoders})` : "";
      text = checked || entry.kind !== "copy"
        ? mod(
          `मिलान स्रोत: sanskritdocuments.org, “${title}” (${url}), स्वयंसेवकों द्वारा तैयार${enc}। उनकी फ़ाइल व्यक्तिगत अध्ययन और शोध के लिए है; सुधार sanskrit@cheerful.com पर।`,
          `Checked against: sanskritdocuments.org, “${title}” (${url}), prepared by volunteers${enc}. Their file is for personal study and research; corrections to sanskrit@cheerful.com.`,
          `मिलान स्रोत: sanskritdocuments.org, “${title}” (${url}), स्वयंसेवक लोग के बनावल${enc}। उनकर फ़ाइल निजी पढ़ाई आ शोध खातिर बा; सुधार sanskrit@cheerful.com पर।`,
        )
        : mod(
          `मूल पाठ: sanskritdocuments.org, “${title}” (${url}), ${date} को लिया गया; स्वयंसेवकों द्वारा तैयार${enc}; इस निःशुल्क, अव्यावसायिक साइट पर पूर्ण पाठ दिया गया है (स्वामी का निर्णय, 2026-10-31); व्यावसायिक पुनः-उपयोग नहीं; सुधार sanskrit@cheerful.com पर।`,
          `Source text: sanskritdocuments.org, “${title}” (${url}), retrieved ${date}; prepared by volunteers${enc}; reproduced in full on this free, non-commercial site (owner decision 2026-10-31); not for commercial reuse; corrections to sanskrit@cheerful.com.`,
          `मूल पाठ: sanskritdocuments.org, “${title}” (${url}), ${date} के लिहल गइल; स्वयंसेवक लोग के बनावल${enc}; एह मुफ़्त, गैर-व्यावसायिक साइट पर पूरा पाठ दिहल गइल बा (मालिक के फैसला, 2026-10-31); व्यावसायिक दोबारा-उपयोग ना; सुधार sanskrit@cheerful.com पर।`,
        );
      return { pattern: p, text, url, licenceUrl: null };
    }
    case "G": {
      const enc = entry.encoders ? mod(`, इनपुट ${entry.encoders}`, `, input by ${entry.encoders}`, `, इनपुट ${entry.encoders}`) : "";
      const m = modified ? mod("परिवर्तन दर्ज हैं।", `Modified: ${typeof modified === "string" ? modified : "see variants"}.`, "बदलाव दर्ज बा।") : mod("बिना परिवर्तन।", "Unmodified.", "बिना बदलाव।");
      text = mod(
        `मूल पाठ: GRETIL (SUB Göttingen), “${title}” (${url})${enc}; एन्कोडिंग CC BY-NC-SA 4.0 (${NC}); मूल रचना पब्लिक डोमेन में है। ${m}`,
        `Source text: GRETIL (SUB Göttingen), “${title}” (${url})${enc}; encoding CC BY-NC-SA 4.0 (${NC}); the work itself is in the public domain. ${m}`,
        `मूल पाठ: GRETIL (SUB Göttingen), “${title}” (${url})${enc}; एन्कोडिंग CC BY-NC-SA 4.0 (${NC}); मूल रचना पब्लिक डोमेन में बा। ${m}`,
      );
      return { pattern: p, text, url, licenceUrl: NC };
    }
    case "V":
      text = mod(`पाठ-संदर्भ: ${title} (${url})`, `Recitation reference: ${title} (${url})`, `पाठ-संदर्भ: ${title} (${url})`);
      if (entry.project === "vhp") text = mod(`पाठ-संदर्भ: वैदिक हेरिटेज पोर्टल, IGNCA (${url})`, `Recitation reference: Vedic Heritage Portal, IGNCA (${url})`, `पाठ-संदर्भ: वैदिक हेरिटेज पोर्टल, IGNCA (${url})`);
      return { pattern: p, text, url, licenceUrl: null };
    case "B": {
      const pub = [entry.publisher, entry.year].filter(Boolean).join(", ");
      text = mod(
        `क्रम और विधि-तथ्य मिलाए गए: ${title}${pub ? ", " + pub : ""} (${url})। इस संस्करण का कोई पाठ यहाँ नहीं लिया गया है।`,
        `Sequence and ritual facts cross-checked with: ${title}${pub ? ", " + pub : ""} (${url}). No text from this edition is reproduced.`,
        `क्रम आ विधि के तथ्य मिलावल गइल: ${title}${pub ? ", " + pub : ""} (${url})। एह संस्करन के कवनो पाठ इहाँ नइखे लिहल गइल।`,
      );
      return { pattern: p, text, url, licenceUrl: null };
    }
    case "T": {
      const pub = [entry.publisher, entry.year].filter(Boolean).join(", ");
      const item = entry.item ? mod(`, Internet Archive आइटम ${entry.item}`, `, Internet Archive item ${entry.item}`, `, Internet Archive आइटम ${entry.item}`) : "";
      text = mod(
        `प्रतिलेखन: ${title}${pub ? ", " + pub : ""}${item} (${url}; पब्लिक डोमेन), ${date} को लिया गया${checked ? "; दूसरे स्रोत से मिलान किया गया" : ""}।`,
        `Transcribed from ${title}${pub ? ", " + pub : ""}${item} (${url}; public domain), retrieved ${date}${checked ? "; verified against a second source" : ""}.`,
        `प्रतिलेखन: ${title}${pub ? ", " + pub : ""}${item} (${url}; पब्लिक डोमेन), ${date} के लिहल गइल${checked ? "; दूसरा स्रोत से मिलावल गइल" : ""}।`,
      );
      return { pattern: p, text, url, licenceUrl: null };
    }
    default:
      text = mod(`स्रोत: ${title} (${url}), ${date} को लिया गया।`, `Source: ${title} (${url}), retrieved ${date}.`, `स्रोत: ${title} (${url}), ${date} के लिहल गइल।`);
      return { pattern: "O", text, url, licenceUrl: null };
  }
}

/** Term bank lookup helpers: display form per language and the bracketed alternate for first use (R5 B7). */
export function termForms(tbEntry, lang) {
  if (!tbEntry) return null;
  const display = tbEntry[lang] || tbEntry.hi;
  let alt = null;
  if (lang === "bho") alt = (tbEntry.bhoFolk && tbEntry.bhoFolk[0]) || (tbEntry.bhoAlt && tbEntry.bhoAlt[0]) || null;
  else if (lang === "hi") alt = (tbEntry.hiAlt && tbEntry.hiAlt[0]) || tbEntry.sa || null;
  else alt = tbEntry.sa || null;
  if (alt === display) alt = null;
  return { display, alt };
}

/**
 * Derive everything the render stage needs. Mutates the loaded records (adds iast/easy/ariaPlain/vinyog/parts)
 * and returns { counts, groups, publishedChapters, unpublishedChapters, glossaryPages, termbankById, vinyog }.
 */
export function derive(data, { R = null } = {}) {
  const termbankById = new Map();
  for (const t of data.termbank?.terms || []) termbankById.set(t.id, t);

  // mantras
  const mantraById = new Map();
  for (const m of data.mantras) {
    Object.assign(m, translit(m, m.id));
    m.vinyog = [];
    mantraById.set(m.id, m);
  }
  // vinyog from occasion steps
  for (const o of data.occasions) {
    o.slug = o.id;
    o.parts = (o.parts || []).map((p) => ({ ...p, slug: p.id }));
    for (const s of o.steps || []) {
      for (const id of s.mantraIds || []) {
        const m = mantraById.get(id);
        if (m) m.vinyog.push({ occasionId: o.id, step: s.n, part: s.part || null, action: s.action });
      }
    }
  }
  // texts and chapters
  let verseCount = 0;
  const publishedChapters = [];
  const unpublishedChapters = [];
  for (const t of data.texts) {
    t.slug = t.id;
    const meta = new Map((t.chapters || []).map((c) => [c.n, c]));
    const chapters = [];
    for (const c of t.chapterFiles || []) {
      const info = meta.get(c.n ?? c._n) || {};
      const ch = { ...c, n: c.n ?? c._n, title: c.title || info.title, verseCount: info.verseCount, published: isPublished(c) };
      for (const v of ch.verses || []) Object.assign(v, translit(v, `${t.id}-${ch.n}-${v.v}`), { id: `${t.id}-${ch.n}-${v.v}` });
      ch.parts = paginate(ch.verses || []);
      if (ch.published) { chapters.push(ch); publishedChapters.push(`${t.id}-${ch.n}`); verseCount += ch.verses.length; }
      else unpublishedChapters.push({ text: t.id, n: ch.n, missing: (ch.verses || []).filter((v) => !hasTri(v.meaning)).length });
    }
    t.allChapters = t.chapterFiles || [];
    t.chapters = chapters; // routes expand only published chapters (brief §6.1)
    t.publishedCount = chapters.length;
  }
  for (const k of data.kathas) k.slug = k.id;
  // glossary pages: terms with a definition and a term-bank entry
  const glossaryPages = [];
  for (const g of data.terms) {
    const tb = termbankById.get(g.id);
    g.slug = g.id;
    g.forms = tb ? { hi: termForms(tb, "hi"), en: termForms(tb, "en"), bho: termForms(tb, "bho"), category: tb.category, evidence: tb.evidence } : null;
    if (tb) glossaryPages.push(g);
  }
  // counts
  const groups = {};
  for (const o of data.occasions) groups[o.group] = (groups[o.group] || 0) + 1;
  const counts = {
    occasions: data.occasions.length,
    mantras: data.mantras.length,
    verses: verseCount,
    terms: glossaryPages.length,
    chapters: publishedChapters.length,
    texts: data.texts.filter((t) => t.publishedCount > 0).length,
    kathas: data.kathas.length,
    lessons: data.lessons.length,
    levels: Array.isArray(data.levels) ? data.levels.length : 0,
    groupCount: Object.values(groups).filter((n) => n > 0).length,
    groups,
  };
  // group examples for the home cards (design §27 item 3): up to 4 real page titles per group
  const groupInfo = Object.keys(groups).map((id) => ({
    id,
    examples: data.occasions.filter((o) => o.group === id).slice(0, 4).map((o) => ({ id: o.id, title: o.title, href: (lang) => (R ? R.href(`${lang}/occasions/${o.id}/`) : `/${lang}/occasions/${o.id}/`) })),
  }));
  const vinyog = Object.fromEntries([...mantraById.values()].filter((m) => m.vinyog.length).map((m) => [m.id, m.vinyog]));
  return { counts, groups: groupInfo, publishedChapters, unpublishedChapters, glossaryPages, termbankById, vinyog, mantraById };
}
