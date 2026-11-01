// Pothi mode (design.md §15; mocks decision 9; FEAT-106). No site chrome: a .pothi-bar toolbar (Back, A−/A+ with a live
// <output> %, Print, Save offline), a centred title block, then one .pothi-step --surface card per step of every part —
// number + locator, action, the mantra at --fs-pothi (1.5 × body, line-height 2), textRefs, "पंडित जी कहते हैं" — nothing
// else (no meanings, no chips, no rails). Two cards per row at ≥ 1440; @media print breaks after each card and keeps the
// mantra ≥ 18.67 px (UI-26). The print courtesy line is the owner-droppable UI string foot.print_courtesy (R4 §8.2 rule 3).
import { html, t, icon, num } from "../lib.mjs";
import { plainDocument } from "../layout.mjs";
import { verseBlock, inlineProse } from "../components/verse.mjs";
import { splitAction, stepsOf, saysBlock, textRefs } from "../components/step.mjs";
import { occasionEnv, occHref, offlinePlaceholder, clip } from "./occasion.mjs";

function pothiStep(env, step, total) {
  const { ctx, lang, occ, mantraById, textsById, mdCtx } = env;
  const { head, tail } = splitAction(step.action[lang]);
  const recs = (step.mantraIds || []).map((id) => {
    const rec = mantraById.get(id);
    if (!rec) throw new Error(`pothi ${occ.id} step ${step.n}: mantra "${id}" is not in the corpus`);
    return rec;
  });
  const part = occ.parts.find((p) => p.id === step.part);
  const locator = recs.map((r) => r.locator).filter(Boolean).join(" · ");
  const no = [t(lang, "pothi.step_of", { n: num(step.n), total: num(total) }), part ? part.title[lang] : "", locator].filter(Boolean).join(" · ");
  return html`<section class="pothi-step" id="p${step.n}">
<p class="no">${no}</p>
<h2>${inlineProse(head, mdCtx)}</h2>
${tail ? html`<p class="act">${inlineProse(tail, mdCtx)}</p>` : ""}
${recs.map((rec) => verseBlock(rec, lang, { tools: false, showKind: false, id: `pm-${step.n}-${rec.id}` }))}
${textRefs(ctx, lang, step, { textsById, mdCtx, cls: "act text-ref" })}
${saysBlock(step, lang)}
</section>`;
}

export function pothiBody(env) {
  const { ctx, lang, occ } = env;
  const steps = stepsOf(occ);
  const partNames = occ.parts.map((p) => p.title[lang]).join(" · ");
  return html`<div class="container pothi-bar" role="toolbar" aria-label="${t(lang, "pothi.toolbar")}">
<a class="btn btn-ghost" href="${occHref(ctx, lang, occ)}">← ${t(lang, "pothi.back")}</a>
<span class="spacer"></span>
<div class="stepper" role="group" aria-label="${t(lang, "pothi.size")}"><button type="button" data-size="-" aria-label="${t(lang, "pothi.smaller")}">A−</button><output data-size-out aria-live="polite">100%</output><button type="button" data-size="+" aria-label="${t(lang, "pothi.bigger")}">A+</button></div>
<button class="btn" type="button" data-print>${icon("i-print")}${t(lang, "pothi.print")}</button>
<button class="btn btn-primary" type="button" data-save-offline="${occ.id}" data-l-saved="${t(lang, "pothi.saved")}" hidden>${icon("i-download")}${t(lang, "pothi.save")}</button>
</div>
<main class="container" id="main">
<div class="pothi-title"><h1>${t(lang, "pothi.title", { title: occ.title[lang] })}</h1><p class="meta">${partNames ? html`${partNames} · ` : ""}${t(lang, "occasion.steps", { n: num(steps.length) })} · ${t(lang, "pothi.only")}</p></div>
<div class="pothi-steps">${steps.map((s) => pothiStep(env, s, steps.length))}</div>
<p class="meta pothi-foot print-only">${t(lang, "foot.print_courtesy")}</p>
</main>`;
}

export function pothiPage(ctx, { route, occ, data, derived, occasionsById }) {
  const lang = route.lang;
  const env = occasionEnv(ctx, lang, { occ, data, derived, occasionsById });
  return plainDocument(ctx, {
    lang,
    route,
    pageType: "pothi",
    title: t(lang, "pothi.title", { title: occ.title[lang] }),
    description: clip(occ.lede[lang]),
    bodyClass: "pothi",
    sprite: true,
    body: pothiBody(env),
    bodyEnd: offlinePlaceholder(occ),
  });
}
