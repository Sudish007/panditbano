// FEAT-108: Learn index, level page (Level 0 institutions table — every name linked), lesson page (prose with {{mantra}} /
// {{sutra}}, quiz with ≥ 3 questions, answers hidden in <details> without JS, rails, related) — design.md §3.2, §4.7, §9.3;
// decisions.md §10; design-review NIT 17 (lesson ids never start with "level-").
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { learnIndexPage, lessonMinutes, levelsOf } from "../../build/templates/pages/learn-index.mjs";
import { learnLevelPage, institutionsTable, institutionName } from "../../build/templates/pages/learn-level.mjs";
import { lessonPage, lessonProse, quizSection } from "../../build/templates/pages/lesson.mjs";
import { marksTable, MARKS } from "../../build/templates/components/marks-table.mjs";
import { validateLesson, LESSON_ID_RE } from "../../build/lib/schema.mjs";
import { isLessonId, createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const MODULES = { lesson: ["./translit.abc.mjs", "./voice.abc.mjs", "./quiz.abc.mjs"], "learn-index": ["./quiz.abc.mjs"], "learn-level": ["./quiz.abc.mjs"] };
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: MODULES, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const lesson = data.lessons.find((l) => l.id === "l0-01-purohit-kaun");
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const index = (lang) => learnIndexPage(ctx, { route: routeOf(lang, "learn-index"), data, counts: derived.counts }).toString();
const level = (lang, n = 0) => learnLevelPage(ctx, { route: routeOf(lang, "learn-level", { level: n }), level: data.levels.find((l) => l.level === n), data }).toString();
const page = (lang) => lessonPage(ctx, { route: routeOf(lang, "lesson", { lessonId: lesson.id }), lesson, data, derived }).toString();
const count = (s, re) => (s.match(re) || []).length;

test("lesson page: ≥ 3 questions as <fieldset data-answer>, radio .opt rows, जाँचें button, result slot, storage note; answers only inside a closed <details>", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = page(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1, `${lang}: one h1`);
    const n = count(s, /<fieldset data-answer="[a-d]"/g);
    assert.ok(n >= 3, `${lang}: ${n} questions`);
    assert.equal(n, lesson.quiz.length);
    assert.equal(count(s, /<label class="opt"><input type="radio"/g), lesson.quiz.reduce((a, q) => a + q.options.length, 0));
    assert.ok(s.includes('data-quiz="l0-01-purohit-kaun"') && s.includes("data-quiz-check") && s.includes("data-quiz-result"), `${lang}: quiz hooks`);
    assert.ok(s.includes(`data-l-result="${lang === "en" ? "{right}/{total} correct" : "{right}/{total} सही"}"`), `${lang}: result template travels on the section`);
    // answers: the correct option text appears in <strong> only inside <details class="answers"> (closed — no `open`)
    const det = s.slice(s.indexOf('<details class="answers"'), s.indexOf("</details>", s.indexOf('<details class="answers"')));
    assert.ok(det && !det.startsWith('<details class="answers" open'), `${lang}: answers details is closed by default`);
    for (const q of lesson.quiz) {
      const ans = q.options.find((o) => o.id === q.answer).text[lang];
      assert.ok(det.includes(`<strong>${ans}</strong>`), `${lang}: answer "${ans}" listed in details`);
    }
    assert.equal(count(s, /<strong>(शुक्ल यजुर्वेद माध्यंदिन|Shukla Yajurveda Madhyandina)<\/strong>/g), 1, `${lang}: the answer is not revealed outside the details`);
    assert.ok(!s.includes('class="opt correct"') && !s.includes('class="opt wrong"'), `${lang}: no pre-marked option`);
    assert.ok(s.includes('data-page="lesson"'));
  }
});

test("lesson prose: {{mantra:vs-36-3}} → verse block + meaning + mantra link; {{sutra:pgs-1-8-1}} → .sutra with cite; [[vivah]] → glossary link; #sources lists both records", () => {
  const s = page("hi");
  assert.ok(s.includes('<div class="lesson-verse" data-mantra="vs-36-3">') && s.includes('<p class="mantra" lang="sa" id="m-vs-36-3"'), "inline verse block");
  assert.ok(s.includes("भूर्भुवः॒ स्वः॒"), "Gayatri text with svara");
  assert.ok(s.includes('href="/panditbano/hi/mantras/vs-36-3/"'), "link to the mantra page");
  assert.ok(s.includes('<div class="sutra" data-sutra="pgs-1-8-1">') && s.includes("<cite>") && s.includes("PGS 1.8.1"), "sutra block with cite");
  assert.ok(s.includes('class="term" href="/panditbano/hi/glossary/vivah/"'), "[[vivah]] → glossary term page");
  assert.ok(s.includes('<section id="sources"') && s.includes('data-source="ws-syv-36"') && s.includes('data-source="ws-pgs"'), "sources of both embedded records");
  assert.ok(s.includes('data-verses="2"'));
  assert.ok(!s.includes("unresolved"));
  // an unknown id throws (the build must not ship a hole)
  assert.throws(() => lessonProse({ body: "x\n{{mantra:nope-1}}\n" }, { ctx, lang: "hi", derived, sources: data.sources }), /unresolved/);
  assert.equal(lessonProse({ body: "सिर्फ़ गद्य।" }, { ctx, lang: "hi", derived, sources: data.sources }).recs.length, 0);
});

test("lesson rails: levels card (aria-current on the level), lessons fold with a[data-lesson], reading settings + svara legend (svara verse on page), progress card", () => {
  const s = page("hi");
  assert.ok(s.includes('<div class="layout has-both">'));
  assert.ok(s.includes('class="rail-fold card levels-card"') && s.includes('href="/panditbano/hi/learn/level-0/" aria-current="page"'), "levels card marks the level");
  assert.ok(s.includes('id="lessons-rail"') && s.includes('data-lesson="l0-01-purohit-kaun" aria-current="page"'), "lesson list fold marks the lesson");
  assert.ok(s.includes('id="reading-settings"') && s.includes('class="card svara-legend"'), "verse with svara → settings + legend");
  assert.ok(s.includes('data-level-progress="0"') && s.includes('data-lessons="[&quot;l0-01-purohit-kaun&quot;]"'), "progress card lists the level's lesson ids");
  assert.ok(s.includes('data-quiz-badge="l0-01-purohit-kaun"'), "badge placeholder");
  assert.ok(s.includes('<section id="related"') && s.includes('href="/panditbano/hi/occasions/vivah/"') && s.includes('href="/panditbano/hi/mantras/vs-36-3/"'), "related occasions and mantras");
  assert.ok(!s.includes('class="marks"'), "Level 0 lesson has no svara-marks table");
  assert.ok(!s.includes('id="checklist"'), "no Level 3 checklist card on a Level 0 lesson");
  assert.equal(lessonMinutes(lesson, "hi"), 10);
  assert.equal(lessonMinutes({ md: { hi: { body: Array(360).fill("शब्द").join(" ") } } }, "hi"), 2);
});

test("marks table (Level 1 component): five rows, .mantra lang=sa cells with data-plain, a hidden ▶ per row; quizSection empty without questions", () => {
  const s = marksTable("hi").toString();
  assert.equal(count(s, /<tr>\n<td><span class="mantra" lang="sa">/g), MARKS.length);
  assert.equal(count(s, /data-listen="marks-/g), MARKS.length);
  assert.ok(s.includes('id="marks-anudatta" data-plain="वि"') && s.includes("क॒") && s.includes("क॑"), "svara glyphs and svara-less data-plain");
  assert.ok(s.includes('<table class="marks">') && s.includes("स्वर चिह्न — पहचान तालिका"));
  assert.equal(quizSection("hi", { id: "x", quiz: [] }), "");
  // a Level 1 lesson embeds the table
  const l1 = { ...lesson, id: "l1-01-test", level: 1, order: 1 };
  const d1 = { ...data, levels: [...data.levels, { level: 1, title: { hi: "स्तर 1", en: "Level 1", bho: "स्तर 1" }, summary: { hi: "उच्चारण", en: "Pronunciation", bho: "उच्चारन" } }], lessons: [...data.lessons, l1] };
  const route = { ...routeOf("hi", "lesson", { lessonId: lesson.id }), params: { lessonId: l1.id }, path: `learn/${l1.id}/`, sitePath: `hi/learn/${l1.id}/`, href: `/panditbano/hi/learn/${l1.id}/`, abs: `https://sudish007.github.io/panditbano/hi/learn/${l1.id}/` };
  const s1 = lessonPage(ctx, { route, lesson: l1, data: d1, derived }).toString();
  assert.ok(s1.includes('<table class="marks">'), "Level 1 lesson renders the marks table");
});

test("lesson id with the level- prefix is rejected by the validator and by isLessonId (NIT 17)", () => {
  const bad = { ...lesson, id: "level-0-intro" };
  delete bad._file; delete bad._base; delete bad.md;
  const r = validateLesson(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /level-|l<level>/.test(e.message)), JSON.stringify(r.errors));
  assert.equal(isLessonId("level-0"), false);
  assert.equal(isLessonId("l0-01-purohit-kaun"), true);
  assert.ok(LESSON_ID_RE.test("l2-07-havan-vidhi") && !LESSON_ID_RE.test("level-2"));
  const good = { ...lesson }; delete good._file; delete good._base; delete good.md;
  assert.equal(validateLesson(good).ok, true, JSON.stringify(validateLesson(good).errors));
});

test("Level 0 page: institutions table with every registry name linked (UI-19), status chips, course cells lang=en; lesson cards; levels rail", () => {
  const inst = data.institutions.institutions;
  for (const lang of ["hi", "en", "bho"]) {
    const s = level(lang, 0);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.ok(s.includes('<table class="institutions">'), `${lang}: table`);
    assert.equal(count(s, /<tr data-institution="/g), inst.length, `${lang}: one row per institution`);
    for (const i of inst) {
      const name = institutionName(i, lang);
      const re = new RegExp(`<a href="${i.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" rel="external noopener">${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<svg`);
      assert.ok(re.test(s), `${lang}: "${name}" linked to ${i.url}`);
    }
    // no institution name appears outside an <a>
    const main = s.slice(s.indexOf('<main id="main"'), s.indexOf("</main>"));
    const stripped = main.replace(/<a [^>]*>[\s\S]*?<\/a>/g, "");
    for (const i of inst) for (const nm of [i.name, ...(i.names || [])]) assert.ok(!stripped.includes(nm), `${lang}: "${nm}" unlinked`);
    assert.ok(s.includes('class="card card-link lesson-card"') && s.includes(`href="/panditbano/${lang}/learn/l0-01-purohit-kaun/"`), `${lang}: lesson card`);
    assert.ok(s.includes('class="rail-fold card levels-card"'));
    assert.ok(s.includes('data-page="learn-level"'));
  }
  const hi = level("hi", 0);
  assert.ok(hi.includes('<td lang="en">') && hi.includes("पुष्टि बाकी") && hi.includes("पृष्ठ पर पुष्ट"), "status chips and English data cells");
  assert.ok(hi.includes("2026-11-01"), "registry date in the note");
  assert.equal(institutionsTable("hi", null), "");
  assert.equal(institutionsTable("hi", { institutions: [] }), "");
});

test("learn index: one section per level with the computed lesson count, lesson cards with badge placeholders, honest line for an empty level", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = index(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /<section class="level-block"/g), data.levels.length, `${lang}: level sections`);
    assert.ok(s.includes(`href="/panditbano/${lang}/learn/level-0/"`) && s.includes(`href="/panditbano/${lang}/learn/l0-01-purohit-kaun/"`));
    assert.ok(s.includes('data-quiz-badge="l0-01-purohit-kaun"'));
    assert.ok(s.includes('data-page="learn-index"'));
  }
  assert.ok(index("hi").includes(">1 पाठ<"), "computed count");
  const d2 = { ...data, levels: [...data.levels, { level: 4, title: { hi: "स्तर 4", en: "Level 4", bho: "स्तर 4" }, summary: { hi: "उन्नत", en: "Advanced", bho: "आगे" } }] };
  const s2 = learnIndexPage(ctx, { route: routeOf("hi", "learn-index"), data: d2, counts: derived.counts }).toString();
  assert.ok(s2.includes("इस स्तर के पाठ अगले चरण में जुड़ेंगे।"), "empty level → honest line");
  assert.equal(levelsOf(d2).length, 2);
});
