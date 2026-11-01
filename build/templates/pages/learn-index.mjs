// Learn index (design.md §3.2 learn-index, §4.7; FEAT-108): the Pandit Bano path — every level of learn/levels.json as a
// section (title → level page, summary, computed lesson count) with its lesson cards (title, one line, minutes, question
// count, a progress badge that quiz.mjs fills from pb-quiz:<lessonId>). A level without lessons yet shows one honest line.
// Shared helpers for the level / lesson pages live here (levelHref, lessonHref, lessonsOf, lessonCard, levelsCard).
import { html, raw, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };

export const levelHref = (ctx, lang, level) => ctx.R.href(`${lang}/learn/level-${level}/`);
export const lessonHref = (ctx, lang, lesson) => ctx.R.href(`${lang}/learn/${lesson.id}/`);

/** Levels sorted by number; `lessons` (sorted by order) attached to each. */
export function levelsOf(data) {
  const levels = (Array.isArray(data.levels) ? data.levels : []).slice().sort((a, b) => a.level - b.level);
  return levels.map((l) => ({ ...l, lessons: lessonsOf(data, l.level) }));
}
export const lessonsOf = (data, level) => (data.lessons || []).filter((l) => l.level === level).slice().sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)));

/** Reading time: the record's minutes when authored, else ≈ 180 words / min over the lesson prose (floor 1). */
export function lessonMinutes(lesson, lang) {
  if (Number.isInteger(lesson.minutes) && lesson.minutes > 0) return lesson.minutes;
  const body = lesson.md && lesson.md[lang] ? lesson.md[lang].body : "";
  const words = String(body).replace(/\{\{[^}]*\}\}/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function learnCrumbs(ctx, lang, level = null) {
  const R = ctx.R;
  const crumbs = [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/learn/`), label: t(lang, "nav.learn") }];
  if (level) crumbs.push({ href: levelHref(ctx, lang, level.level), label: level.title[lang] });
  return crumbs;
}

/** Progress badge placeholder: quiz.mjs writes "{right}/{total}" and unhides it when pb-quiz:<id> exists. */
export const quizBadge = (lang, lesson) => html`<span class="chip badge" data-quiz-badge="${lesson.id}" data-l-score="${t(lang, "learn.score")}" data-l-done="${t(lang, "learn.done")}" hidden></span>`;

export function lessonCard(ctx, lang, lesson) {
  const q = Array.isArray(lesson.quiz) ? lesson.quiz.length : 0;
  return html`<li><a class="card card-link lesson-card" href="${lessonHref(ctx, lang, lesson)}" data-lesson-card="${lesson.id}">
<span class="chip">${t(lang, "learn.lesson_n", { n: num(lesson.order) })}</span>
<h3 class="m0">${lesson.title[lang]}</h3>
<p class="m0">${lesson.summary[lang]}</p>
<span class="meta">${t(lang, "learn.minutes", { n: num(lessonMinutes(lesson, lang)) })} · ${t(lang, "learn.questions", { n: num(q) })} ${quizBadge(lang, lesson)}</span>
<span class="more">${t(lang, "learn.start")}</span>
</a></li>`;
}

/** Left-rail "पंडित बनो पथ" card: the five levels with computed lesson counts; aria-current on the level in view. */
export function levelsCard(ctx, lang, levels, { current = null } = {}) {
  // a rail fold: closed on phones so the content comes first, opened at ≥ 1024 by app.mjs (design §9.4; mocks decision 3)
  return html`<details class="rail-fold card levels-card" id="levels-rail"><summary><h2 class="rail-h">${t(lang, "learn.path")}</h2></summary>
<nav aria-label="${t(lang, "learn.levels")}"><ol>${levels.map((l) => html`<li><a href="${levelHref(ctx, lang, l.level)}"${l.level === current ? raw(' aria-current="page"') : ""}><span class="n">${num(l.level)}</span><span class="t">${l.title[lang]}${l.lessons.length ? html` <span class="meta">· ${t(lang, "counts.lessons", { n: num(l.lessons.length) })}</span>` : ""}</span></a></li>`)}</ol></nav>
</details>`;
}

/** "प्रगति" card: level progress text + bar filled by quiz.mjs from the lessons' pb-quiz keys (a real quantity — design §27 item 4). */
export function progressCard(lang, level) {
  const ids = level.lessons.map((l) => l.id);
  return html`<div class="card progress-card" data-level-progress="${level.level}" data-lessons="${JSON.stringify(ids)}" data-l-progress="${t(lang, "learn.level_progress")}">
<h2 class="rail-h">${t(lang, "learn.progress")}</h2>
<div class="progress"><p class="meta m0" data-progress-text>${t(lang, "learn.level_progress", { done: 0, total: num(ids.length) })}</p><div class="bar" aria-hidden="true"><span data-progress-bar style="width:0%"></span></div><p class="small m0">${t(lang, "storage.note")}</p></div>
</div>`;
}

function levelSection(ctx, lang, level) {
  return html`<section class="level-block" id="level-${level.level}" aria-labelledby="h-level-${level.level}">
<div class="section-head"><h2 id="h-level-${level.level}"><a href="${levelHref(ctx, lang, level.level)}">${level.title[lang]}</a></h2><span class="meta">${level.lessons.length ? t(lang, "counts.lessons", { n: num(level.lessons.length) }) : ""}</span></div>
<p class="lede m0">${level.summary[lang]}</p>
${level.lessons.length ? html`<ol class="grid grid-md-2 grid-lg-3 grid-xl-4 lesson-grid" aria-label="${t(lang, "learn.lessons_heading")}">${level.lessons.map((l) => lessonCard(ctx, lang, l))}</ol>` : html`<p class="meta">${t(lang, "learn.no_lessons")}</p>`}
</section>`;
}

export function learnIndexBody(ctx, { lang, data, counts = {} }) {
  const levels = levelsOf(data);
  return html`<div class="page-head">
<div><h1>${t(lang, "learn.title")}</h1><p class="lede m0">${t(lang, "learn.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.levels", { n: num(levels.length) })}</span><span>${t(lang, "counts.lessons", { n: num(counts.lessons || 0) })}</span></div>
</div>
${levels.map((l) => levelSection(ctx, lang, l))}`;
}

export function learnIndexPage(ctx, { route, data, counts }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: t(lang, "learn.title"),
    description: clip(t(lang, "learn.lede")),
    section: "learn",
    crumbs: [{ href: ctx.R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: learnIndexBody(ctx, { lang, data, counts }),
  });
}
