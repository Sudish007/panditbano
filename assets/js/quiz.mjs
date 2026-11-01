// quiz.mjs (design.md §4.7, §9.3 pb-quiz, §12; FEAT-108): grades the lesson quiz (one <fieldset data-answer> per question),
// marks every answered option .correct / .wrong with its feedback text, shows the question's ok/no sentence, writes the
// result line "{right}/{total}" and stores pb-quiz:<lessonId> = {right, total, at}. On every learn page it also fills the
// progress badges ([data-quiz-badge]), the rail done ticks (a[data-lesson]) and the level progress card from storage.
// Storage failures degrade to in-page state. Nothing here throws to the top level.
const mem = {};
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* memory only */ } };
const tpl = (s, v) => String(s || "").replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));

export function readResult(id) {
  try { const r = JSON.parse(get("pb-quiz:" + id) || "null"); return r && Number.isInteger(r.right) && Number.isInteger(r.total) && r.total > 0 ? r : null; } catch (e) { return null; }
}
const full = (r) => !!r && r.right === r.total;

/** Badges, done ticks and level progress from storage (idempotent; called on load and after every check). */
export function refresh() {
  document.querySelectorAll("[data-quiz-badge]").forEach((el) => {
    const r = readResult(el.getAttribute("data-quiz-badge"));
    if (!r) return;
    el.textContent = tpl(el.getAttribute("data-l-score") || "{right}/{total}", r) + (full(r) ? " ✓" : "");
    el.classList.toggle("chip-good", full(r));
    el.hidden = false;
  });
  document.querySelectorAll("a[data-lesson]").forEach((a) => a.classList.toggle("done", full(readResult(a.getAttribute("data-lesson")))));
  document.querySelectorAll("[data-level-progress]").forEach((card) => {
    let ids = [];
    try { ids = JSON.parse(card.getAttribute("data-lessons") || "[]"); } catch (e) { ids = []; }
    const done = ids.filter((id) => full(readResult(id))).length;
    const text = card.querySelector("[data-progress-text]");
    if (text) text.textContent = tpl(card.getAttribute("data-l-progress"), { done, total: ids.length });
    const bar = card.querySelector("[data-progress-bar]");
    if (bar) bar.style.width = (ids.length ? Math.round((done / ids.length) * 100) : 0) + "%";
  });
}

export function grade(quiz) {
  const L = (k) => quiz.getAttribute("data-l-" + k) || "";
  const sets = Array.from(quiz.querySelectorAll("fieldset[data-answer]"));
  let right = 0;
  sets.forEach((fs) => {
    const want = fs.getAttribute("data-answer");
    const picked = fs.querySelector("input:checked");
    const fb = fs.querySelector(".fbtext");
    fs.querySelectorAll(".opt").forEach((o) => { o.classList.remove("correct", "wrong"); const f = o.querySelector(".fb"); if (f) f.textContent = ""; });
    if (!picked) { if (fb) { fb.textContent = L("unanswered"); fb.hidden = false; } return; }
    const ok = picked.value === want;
    const opt = picked.closest(".opt");
    if (opt) { opt.classList.add(ok ? "correct" : "wrong"); const f = opt.querySelector(".fb"); if (f) f.textContent = (ok ? "✓ " : "✗ ") + L(ok ? "correct" : "wrong"); }
    if (fb) { fb.textContent = fs.getAttribute(ok ? "data-fb-ok" : "data-fb-no") || ""; fb.hidden = false; }
    if (ok) right++;
  });
  const result = { right, total: sets.length, at: Date.now() };
  const out = quiz.querySelector("[data-quiz-result]");
  if (out) out.textContent = tpl(L("result"), result);
  set("pb-quiz:" + quiz.getAttribute("data-quiz"), JSON.stringify(result));
  return result;
}

export function init() {
  try { refresh(); } catch (e) { console.warn("pb:quiz", e); }
  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    quiz.querySelectorAll("[data-quiz-check]").forEach((btn) => btn.addEventListener("click", () => { try { grade(quiz); refresh(); } catch (e) { console.warn("pb:quiz", e); } }));
  });
}
