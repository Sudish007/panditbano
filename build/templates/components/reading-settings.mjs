// Reading-settings card (design.md §4.4, §8.2, §9.3–9.4; mock_shell.py#translit_seg / speed_ctl): the single home of the
// transliteration radiogroup (IAST / सरल रोमन / बंद), the voice speed stepper, the Repeat toggle, the voice-name line and
// the voice status note. The ⚙ link in every verse's tools row points at #reading-settings. The UI strings voice.mjs needs
// at run time travel as data-l-* attributes on the card (no second string table in JS).
import { html, t } from "../lib.mjs";

export const TRANSLIT_VALUES = ["iast", "easy", "off"];
export const RATE = { min: 0.5, max: 1.5, step: 0.1, default: 0.9 };

/**
 * Pronunciation-lesson link for the card: Level 1 when the corpus has it, else the Learn index when any level exists, else
 * none (FEAT-110: the fixed `learn/level-1/` link was a dead link on every verse page until Level 1 lands in Phase 1b).
 */
export function learnHrefFor(R, levels, lang) {
  const list = Array.isArray(levels) ? levels : [];
  if (list.some((l) => l.level === 1)) return R.href(`${lang}/learn/level-1/`);
  if (list.length) return R.href(`${lang}/learn/`);
  return null;
}

export function readingSettings(ctx, lang, { lessonHref = null, id = "reading-settings" } = {}) {
  const href = lessonHref || (ctx.learnHref ? ctx.learnHref(lang) : null);
  const speed = t(lang, "voice.speed");
  return html`<div class="card reading-settings" id="${id}" data-reading-settings data-l-none="${t(lang, "voice.none")}" data-l-name="${t(lang, "voice.name")}" data-l-speaking="${t(lang, "voice.speaking")}" data-l-failed="${t(lang, "voice.failed")}" data-l-lesson="${t(lang, "voice.lesson")}"${href ? html` data-lesson-href="${href}"` : ""}>
<h2 class="rail-h">${t(lang, "verse.settings")}</h2>
<div class="setting">
<p class="label" id="${id}-translit">${t(lang, "translit.label")}</p>
<div class="seg" role="radiogroup" aria-labelledby="${id}-translit" data-translit>${TRANSLIT_VALUES.map((v, i) => html`<button type="button" role="radio" aria-checked="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}" data-value="${v}">${t(lang, `translit.${v}`)}</button>`)}</div>
</div>
<div class="setting">
<p class="label" id="${id}-speed">${speed}</p>
<div class="voice-row">
<div class="stepper" role="group" aria-labelledby="${id}-speed"><button type="button" data-rate="-" aria-label="${speed} −">−</button><output data-rate-out aria-live="polite">${RATE.default.toFixed(1)}×</output><button type="button" data-rate="+" aria-label="${speed} +">+</button></div>
<button class="btn" type="button" data-repeat aria-pressed="false">${t(lang, "voice.repeat")}</button>
</div>
</div>
<p class="meta" data-voice-name hidden></p>
<p class="meta" role="status" data-voice-status></p>
${href ? html`<p class="small"><a href="${href}">${t(lang, "voice.lesson")}</a></p>` : ""}
<p class="small m0">${t(lang, "storage.note")}</p>
</div>`;
}
