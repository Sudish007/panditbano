// Step pieces shared by the occasion page and the pothi (design.md §4.3, §15; FEAT-106): the step title derived from the
// action prose, the layer chip (वैदिक / पद्धति / लोकाचार — mocks decision 7), textRefs as "पाठ: <text> अध्याय n" links,
// the "पंडित जी कहते हैं" callout and the .step card itself (number chip, h3, layer chip, action, verses via verseFull,
// textRefs, says, note, step samagri). Every record string passes through html``/esc() or renderInline.
import { html, t, num } from "../lib.mjs";
import { proseOnly } from "../../lib/md.mjs";
import { verseFull, inlineProse } from "./verse.mjs";

export const LAYER_CHIP = { vedic: "chip-vedic", paddhati: "chip-paddhati", lok: "chip-lok" };

/**
 * Split an action into a short head (the step title) and the remaining prose: "पवित्रीकरण — पंडित…" → head "पवित्रीकरण",
 * tail "पंडित…". A label before a colon works the same way ("मार्जन: पंडित…" → head "मार्जन") when the label is ≤ 60
 * characters and holds no sentence boundary (the corpus authors wrote 448 of the 1a steps this way — C1A-01 integrate).
 * Without a dash or label a short action is the title alone; a long one gets a ≤ 72-char head and keeps the full text.
 * The tail is rendered as its own paragraph under the heading, so a Latin lowercase start ("Whom it falls on: relatives…")
 * is capitalised (C1A-02 integrate; Devanagari has no case and is untouched).
 */
export function splitAction(action) {
  const s = String(action ?? "").trim();
  const m = /^(.{2,80}?)\s+[—–]\s+([\s\S]+)$/.exec(s) || /^(.{2,80}?)\s+-\s+([\s\S]+)$/.exec(s) || /^((?:(?!\. |। |; |\? |! ).){2,60}?):\s+(\S[\s\S]*)$/.exec(s);
  if (m) return { head: m[1].trim(), tail: m[2].trim().replace(/^[a-z]/, (c) => c.toUpperCase()) };
  if (s.length <= 80) return { head: s, tail: "" };
  const cut = s.slice(0, 72);
  const i = Math.max(cut.lastIndexOf(" "), 30);
  return { head: cut.slice(0, i).trim() + "…", tail: s };
}
/**
 * Plain-text step title (rail, pothi locator, <title>): the head with Markdown links/marks removed. With a mdCtx the
 * [[term]] marks become the term's display form first, so a head that is only a mark ("[[pranayam]]: …") keeps a label.
 */
export function stepTitle(step, lang, mdCtx = null) {
  let head = splitAction(step.action && step.action[lang]).head;
  if (mdCtx) head = head.replace(/\[\[([a-z0-9-]+)\]\]/g, (m, id) => (mdCtx.term(id) || {}).display || m);
  return proseOnly(head).replace(/\s+/g, " ").trim();
}

export function layerChip(step, lang) {
  return html`<span class="chip ${LAYER_CHIP[step.layer] || "chip-lok"}">${t(lang, `layer.${step.layer}`)}</span>`;
}

/** The published chapter route for a textRef, else the text page (an unpublished chapter has no route — brief §6.1). */
export function textRefHref(ctx, lang, ref, textsById) {
  const text = textsById && textsById.get(ref.text);
  if (!text) return null;
  const published = new Set((text.chapters || []).map((c) => c.n));
  return (n) => ctx.R.href(published.has(n) ? `${lang}/texts/${text.slug}/${n}/` : `${lang}/texts/${text.slug}/`);
}
/** "पाठ: <text> — अध्याय n" links, one per chapter (design §4.3; plan §2.5). Unknown text ids are a build error (gate G12). */
export function textRefs(ctx, lang, step, { textsById, mdCtx, cls = "text-ref" } = {}) {
  const refs = Array.isArray(step.textRefs) ? step.textRefs : [];
  if (!refs.length) return "";
  return html`${refs.map((ref) => {
    const text = textsById && textsById.get(ref.text);
    if (!text) throw new Error(`step ${step.n}: textRefs text "${ref.text}" is not in the corpus`);
    const hrefFor = textRefHref(ctx, lang, ref, textsById);
    const chapters = Array.isArray(ref.chapter) ? ref.chapter : [ref.chapter];
    const title = (text.title && text.title[lang]) || text.id;
    return html`<p class="${cls}">${t(lang, "occasion.text_ref")}: ${chapters.map((n, i) => html`${i ? " · " : ""}<a href="${hrefFor(n)}">${title} — ${t(lang, "occasion.chapter", { n: num(n) })}</a>`)}${ref.note && ref.note[lang] ? html` <span class="meta">(${mdCtx ? inlineProse(ref.note[lang], mdCtx) : ref.note[lang]})</span>` : ""}</p>`;
  })}`;
}

/** The "पंडित जी कहते हैं" callout: the Sanskrit line (when given) then the spoken line in the page language. */
export function saysBlock(step, lang) {
  const s = step.panditSays;
  if (!s || !s[lang]) return "";
  return html`<div class="says"><p class="label">${t(lang, "verse.says")}</p>${s.sa ? html`<p class="sa" lang="sa">${s.sa}</p>` : ""}<p class="m0">${s[lang]}</p></div>`;
}

/** Step → .step card. opts: { ctx, lang, derived, occasionsById, sources, textsById, mdCtx, mantraById, occ, samagriHref } */
export function stepCard(step, { ctx, lang, derived, occasionsById, sources, textsById, mdCtx, mantraById, occ }) {
  const { head, tail } = splitAction(step.action[lang]);
  const recs = (step.mantraIds || []).map((id) => {
    const rec = mantraById.get(id);
    if (!rec) throw new Error(`step ${step.n}: mantra "${id}" is not in the corpus`);
    return rec;
  });
  // vinyog on an occasion page lists the OTHER occasions that use the mantra (the current one is this very step)
  const others = occasionsById && occ ? new Map([...occasionsById].filter(([id]) => id !== occ.id)) : occasionsById;
  const samagri = (step.samagriIds || []).map((id) => (occ.samagri || []).find((s) => s.id === id)).filter(Boolean);
  const cls = ["step", recs.length ? "two" : "", step.important ? "important" : ""].filter(Boolean).join(" ");
  return html`<article class="${cls}" id="step-${step.n}">
<div class="step-head"><span class="step-no">${num(step.n)}</span><h3>${inlineProse(head, mdCtx)}</h3>${layerChip(step, lang)}${step.important ? html`<span class="chip chip-haldi">${t(lang, "occasion.important")}</span>` : ""}</div>
<div class="step-body">
${tail ? html`<p class="prose action">${inlineProse(tail, mdCtx)}</p>` : ""}
${textRefs(ctx, lang, step, { textsById, mdCtx })}
${saysBlock(step, lang)}
${step.note && step.note[lang] ? html`<p class="meta note"><strong>${t(lang, "verse.note")}:</strong> ${inlineProse(step.note[lang], mdCtx)}</p>` : ""}
${samagri.length ? html`<p class="meta step-samagri">${t(lang, "occasion.step_samagri")}: ${samagri.map((s, i) => html`${i ? ", " : ""}<a href="#sg-${occ.id}-${s.id}">${s.item[lang]}</a>`)}</p>` : ""}
</div>
${recs.length ? html`<div class="step-verses">${recs.map((rec) => verseFull(rec, lang, { ctx, derived, occasionsById: others, sources, heading: "h4", idPrefix: `s${step.n}-${rec.id}`, id: `m-s${step.n}-${rec.id}` }))}</div>` : ""}
</article>`;
}

/** Steps of one part (or all steps when the occasion has no parts), in n order. */
export function stepsOf(occ, part = null) {
  return (occ.steps || []).filter((s) => !part || s.part === part.id).slice().sort((a, b) => a.n - b.n);
}
