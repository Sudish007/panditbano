// Lesson page (design.md §3.2 lesson, §4.7, §9.3 pb-quiz, §11.3, §12 quiz.mjs, §27 items 1 and 5; mock d2/learn.html;
// FEAT-108). page-head (title, summary, level link, minutes, question count, progress badge, prev/next lesson) →
// .layout.has-both: left rail = levels card + the level's lesson list (done ticks from pb-quiz:<id> via quiz.mjs);
// content = the Markdown prose ({{mantra:id}} → an inline verse block with its meaning, {{sutra:id}} → the .sutra quote,
// [[term]] → glossary links), the .marks table on Level 1, the quiz (<fieldset> per question, radio .opt rows, "जाँचें",
// per-option feedback + border colour, result line, storage note, <details> "उत्तर देखें" for JS-off), the related
// occasions / mantras / terms / texts, the Level 3 "पंडित की चेकलिस्ट" card (links the occasion pothi), pager, #sources;
// right rail = reading settings (when verses are on the page), svara legend (when a verse has svara), progress, "आगे".
import { html, raw, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { renderMarkdown } from "../../lib/md.mjs";
import { verseBlock, sourcesSection, sourceLink, svaraLegend, mdContext, inlineProse } from "../components/verse.mjs";
import { readingSettings } from "../components/reading-settings.mjs";
import { marksTable } from "../components/marks-table.mjs";
import { clip, levelHref, lessonHref, levelsOf, learnCrumbs, lessonMinutes, levelsCard, progressCard, quizBadge } from "./learn-index.mjs";

/** Lesson list fold for the left rail: the level's lessons in order; quiz.mjs adds .done to a[data-lesson] with a full score. */
export function lessonsFold(ctx, lang, level, { current = null, id = "lessons-rail" } = {}) {
  return html`<details class="rail-fold card" id="${id}"><summary><h2 class="rail-h">${t(lang, "learn.lessons_of")} · ${num(level.lessons.length)}</h2></summary>
<nav aria-label="${t(lang, "learn.lessons_of")}"><ol>${level.lessons.map((l) => html`<li><a href="${lessonHref(ctx, lang, l)}" data-lesson="${l.id}"${l.id === current ? raw(' aria-current="page"') : ""}><span class="n">${num(l.order)}</span><span class="t">${l.title[lang]}</span></a></li>`)}</ol></nav>
</details>`;
}

/**
 * The lesson prose: Markdown with {{mantra:}} and {{sutra:}} resolved against the corpus. Returns { html, recs (mantra
 * records embedded, for #sources and the rails), headings }. An unresolved mantra/sutra id throws (the build must not ship a hole).
 */
export function lessonProse(md, { ctx, lang, derived, sources }) {
  const recs = [];
  const base = mdContext(ctx, lang, derived);
  const rec = (id) => (derived.mantraById && derived.mantraById.get(id)) || null;
  const mdCtx = {
    ...base,
    mantra: (id) => {
      const r = rec(id);
      if (!r) return null;
      recs.push(r);
      const meaning = r.meaning && r.meaning[lang];
      const title = (r.title && r.title[lang]) || r.id;
      return html`<div class="lesson-verse" data-mantra="${id}">${verseBlock(r, lang, { id: `m-${id}` })}${meaning ? html`<p class="meta m0">${t(lang, "verse.meaning")}: ${inlineProse(meaning, base)}</p>` : ""}<p class="small m0"><a href="${ctx.R.href(`${lang}/mantras/${id}/`)}">${title} →</a></p></div>`.toString();
    },
    sutra: (id) => {
      const r = rec(id);
      if (!r) return null;
      recs.push(r);
      const entry = r.source && sources ? sources.get(r.source.ref) : null;
      const meaning = r.meaning && r.meaning[lang];
      return html`<div class="sutra" data-sutra="${id}">${verseBlock(r, lang, { tools: false, showKind: false, id: `sutra-${id}` })}${meaning ? html`<p class="m0">${inlineProse(meaning, base)}</p>` : ""}<cite>${entry ? sourceLink(entry, lang) : ""}${r.locator ? html` ${r.locator}` : ""}</cite></div>`.toString();
    },
  };
  const r = renderMarkdown(md.body, mdCtx);
  const unresolved = r.unresolved.filter((u) => u.type === "mantra" || u.type === "sutra");
  if (unresolved.length) throw new Error(`lesson prose: unresolved ${unresolved.map((u) => `{{${u.type}:${u.arg}}}`).join(", ")}`);
  return { html: r.html, recs, headings: r.headings };
}

/** The quiz: one <fieldset> per question; grading, feedback and storage by quiz.mjs; answers readable without JS in <details>. */
export function quizSection(lang, lesson) {
  const qs = Array.isArray(lesson.quiz) ? lesson.quiz : [];
  if (!qs.length) return "";
  const answerText = (q) => { const o = (q.options || []).find((x) => x.id === q.answer); return o ? o.text[lang] : q.answer; };
  return html`<section class="quiz" id="quiz" aria-labelledby="h-quiz" data-quiz="${lesson.id}" data-l-result="${t(lang, "quiz.result")}" data-l-unanswered="${t(lang, "quiz.unanswered")}" data-l-correct="${t(lang, "quiz.correct")}" data-l-wrong="${t(lang, "quiz.wrong")}">
<h2 id="h-quiz">${t(lang, "learn.quiz_heading")}</h2>
<p class="meta">${t(lang, "learn.quiz_note")}</p>
${qs.map((q, i) => html`<fieldset data-answer="${q.answer}" data-fb-ok="${q.feedback.ok[lang]}" data-fb-no="${q.feedback.no[lang]}">
<legend>${num(i + 1)}. ${q.q[lang]}</legend>
${(q.options || []).map((o) => html`<label class="opt"><input type="radio" name="q-${lesson.id}-${i + 1}" value="${o.id}"><span class="txt">${o.text[lang]}</span><span class="fb" aria-live="polite"></span></label>`)}
<p class="fbtext meta" role="status" hidden></p>
</fieldset>`)}
<div class="toolbar"><button class="btn btn-primary" type="button" data-quiz-check>${t(lang, "quiz.check")}</button><output class="meta result" data-quiz-result aria-live="polite"></output><span class="small note">${t(lang, "storage.note")}</span></div>
<details class="answers" id="answers"><summary>${t(lang, "quiz.show_answers")}</summary>
<ol>${qs.map((q) => html`<li><span class="q">${q.q[lang]}</span> — <strong>${answerText(q)}</strong>${q.feedback && q.feedback.ok && q.feedback.ok[lang] ? html` <span class="meta">${q.feedback.ok[lang]}</span>` : ""}</li>`)}</ol>
</details>
</section>`;
}

/** Related occasions / mantras / terms / texts / lessons as chip rows (ids resolved against the corpus; unknown ids are skipped). */
export function relatedSection(ctx, lang, lesson, { data, derived }) {
  const R = ctx.R;
  const rel = lesson.related || {};
  const occ = new Map((data.occasions || []).map((o) => [o.id, o]));
  const txt = new Map((data.texts || []).map((x) => [x.id, x]));
  const les = new Map((data.lessons || []).map((l) => [l.id, l]));
  const glossary = new Set((derived.glossaryPages || []).map((g) => g.id));
  const rows = [];
  const row = (key, items) => { if (items.length) rows.push(html`<div><dt>${t(lang, `learn.related_${key}`)}</dt><dd class="chips">${items}</dd></div>`); };
  row("occasions", (rel.occasions || []).filter((id) => occ.has(id)).map((id) => html`<a class="chip" href="${R.href(`${lang}/occasions/${occ.get(id).slug}/`)}">${occ.get(id).title[lang]}</a>`));
  row("mantras", (rel.mantras || []).filter((id) => derived.mantraById && derived.mantraById.get(id)).map((id) => { const m = derived.mantraById.get(id); return html`<a class="chip" href="${R.href(`${lang}/mantras/${id}/`)}">${(m.title && m.title[lang]) || id}</a>`; }));
  row("texts", (rel.texts || []).filter((id) => txt.has(id)).map((id) => html`<a class="chip" href="${R.href(`${lang}/texts/${txt.get(id).slug}/`)}">${txt.get(id).title[lang]}</a>`));
  row("terms", (rel.terms || []).filter((id) => derived.termbankById && derived.termbankById.get(id)).map((id) => { const tb = derived.termbankById.get(id); return html`<a class="chip" href="${R.href(glossary.has(id) ? `${lang}/glossary/${id}/` : `${lang}/glossary/`)}">${tb[lang] || tb.hi}</a>`; }));
  row("lessons", (rel.lessons || []).filter((id) => les.has(id)).map((id) => html`<a class="chip" href="${lessonHref(ctx, lang, les.get(id))}">${les.get(id).title[lang]}</a>`));
  if (!rows.length) return "";
  return html`<section id="related" aria-labelledby="h-related"><h2 id="h-related">${t(lang, "learn.related")}</h2><dl class="related">${rows}</dl></section>`;
}

/** Level 3 playbook hook: one card per related occasion with its pothi (the pandit's checklist — content arrives in Phase 3). */
export function checklistCard(ctx, lang, lesson, data) {
  if (lesson.level !== 3) return "";
  const occ = new Map((data.occasions || []).map((o) => [o.id, o]));
  const items = ((lesson.related || {}).occasions || []).filter((id) => occ.has(id)).map((id) => occ.get(id));
  if (!items.length) return "";
  return html`<section class="card checklist-card" id="checklist" aria-labelledby="h-checklist"><h2 id="h-checklist">${t(lang, "learn.checklist")}</h2><p>${t(lang, "learn.checklist_body")}</p><div class="actions">${items.map((o) => html`<a class="btn" href="${ctx.R.href(`${lang}/occasions/${o.slug}/pothi/`)}">${icon("i-print")}${o.title[lang]} — ${t(lang, "pothi.label")}</a>`)}</div></section>`;
}

export function lessonBody(ctx, { lang, lesson, data, derived }) {
  const levels = levelsOf(data);
  const level = levels.find((l) => l.level === lesson.level);
  if (!level) throw new Error(`lesson ${lesson.id}: level ${lesson.level} is not in learn/levels.json`);
  const i = level.lessons.findIndex((l) => l.id === lesson.id);
  const prev = i > 0 ? level.lessons[i - 1] : null;
  const next = i >= 0 && i < level.lessons.length - 1 ? level.lessons[i + 1] : null;
  const md = lesson.md && lesson.md[lang];
  if (!md) throw new Error(`lesson ${lesson.id}: no ${lang} Markdown`);
  const prose = lessonProse(md, { ctx, lang, derived, sources: data.sources });
  const q = Array.isArray(lesson.quiz) ? lesson.quiz.length : 0;
  const svara = prose.recs.some((r) => r.svara === true);
  return html`<div class="page-head">
<div><h1>${lesson.title[lang]}</h1><p class="lede m0">${lesson.summary[lang]}</p>
<p class="meta"><span><a href="${levelHref(ctx, lang, level.level)}">${level.title[lang]}</a></span><span>${t(lang, "learn.minutes", { n: num(lessonMinutes(lesson, lang)) })}</span><span>${t(lang, "learn.questions", { n: num(q) })}</span>${quizBadge(lang, lesson)}</p></div>
${prev || next ? html`<div class="actions">${prev ? html`<a class="btn" rel="prev" href="${lessonHref(ctx, lang, prev)}">${t(lang, "learn.prev_lesson")}<span class="sr"> — ${prev.title[lang]}</span></a>` : ""}${next ? html`<a class="btn btn-primary" rel="next" href="${lessonHref(ctx, lang, next)}">${t(lang, "learn.next_lesson")}<span class="sr"> — ${next.title[lang]}</span></a>` : ""}</div>` : ""}
</div>
<div class="layout has-both">
<aside class="rail rail-left">
${levelsCard(ctx, lang, levels, { current: level.level })}
${lessonsFold(ctx, lang, level, { current: lesson.id })}
</aside>
<div class="stack">
<article class="prose lesson-prose" id="lesson" data-verses="${prose.recs.length}">
${raw(prose.html)}
</article>
${lesson.level === 1 ? marksTable(lang) : ""}
${quizSection(lang, lesson)}
${relatedSection(ctx, lang, lesson, { data, derived })}
${checklistCard(ctx, lang, lesson, data)}
<nav class="pager" aria-label="${t(lang, "learn.lessons_of")}">
${prev ? html`<a class="btn" rel="prev" href="${lessonHref(ctx, lang, prev)}">${t(lang, "learn.prev_lesson")}<span class="sr"> — ${prev.title[lang]}</span></a>` : html`<span></span>`}
<a class="btn btn-ghost" href="${levelHref(ctx, lang, level.level)}">${t(lang, "learn.back_level")}</a>
${next ? html`<a class="btn btn-primary" rel="next" href="${lessonHref(ctx, lang, next)}">${t(lang, "learn.next_lesson")}<span class="sr"> — ${next.title[lang]}</span></a>` : html`<a class="btn btn-primary" href="${ctx.R.href(`${lang}/learn/`)}">${t(lang, "learn.path")} →</a>`}
</nav>
${sourcesSection(prose.recs, lang, { sources: data.sources })}
</div>
<aside class="rail rail-right">
${prose.recs.length || lesson.level === 1 ? readingSettings(ctx, lang) : ""}
${svara || lesson.level === 1 ? svaraLegend(lang) : ""}
${progressCard(lang, level)}
${next ? html`<div class="card"><h2 class="rail-h">${t(lang, "learn.next_heading")}</h2><p class="m0">${t(lang, "learn.lesson_n", { n: num(next.order) })}: ${next.title[lang]}</p><p class="m0"><a class="btn" href="${lessonHref(ctx, lang, next)}">${t(lang, "learn.next_lesson")}</a></p></div>` : ""}
</aside>
</div>`;
}

export function lessonPage(ctx, { route, lesson, data, derived }) {
  const lang = route.lang;
  const levels = levelsOf(data);
  const level = levels.find((l) => l.level === lesson.level);
  const list = level ? level.lessons : [];
  const i = list.findIndex((l) => l.id === lesson.id);
  const prev = i > 0 ? list[i - 1] : null;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  return layout(ctx, {
    route,
    title: lesson.title[lang],
    description: clip(lesson.summary[lang]),
    section: "learn",
    ogType: "article",
    crumbs: learnCrumbs(ctx, lang, level),
    headExtra: html`${prev ? html`<link rel="prev" href="${lessonHref(ctx, lang, prev)}">\n` : ""}${next ? html`<link rel="next" href="${lessonHref(ctx, lang, next)}">` : ""}`,
    body: lessonBody(ctx, { lang, lesson, data, derived }),
  });
}
