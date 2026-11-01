// "कब" card (design.md §4.3, §16.1; FEAT-106): the muhurat rules prose, the "इस साइट पर तिथि की गणना नहीं होती" sentence and
// year-less Shubhvela links — muhurat → /{lang}/muhurat/ (data-sv="muhurat" data-sv-id), festival → /{lang}/festivals/
// (data-sv="festival" data-sv-id), vrat → /{lang}/vrat/{slug}/, panchang → /{lang}/panchang/new-delhi/ — all rel="external
// noopener" with the marker; app.mjs upgrades festival/muhurat hrefs with the device clock only.
import { html, raw, t, extLink } from "../lib.mjs";
import { shubhvelaUrl } from "../../lib/derive.mjs";
import { inlineProse } from "./verse.mjs";

export function shubhvelaLinks(lang, when = {}) {
  const sv = (when && when.shubhvela) || {};
  const links = [];
  if (sv.muhurat) links.push(extLink(lang, shubhvelaUrl(lang, "muhurat"), t(lang, "shubhvela.muhurat"), { cls: "btn", sv: "muhurat", svId: sv.muhurat }));
  if (sv.festival) links.push(extLink(lang, shubhvelaUrl(lang, "festival"), t(lang, "shubhvela.festivals"), { cls: "btn", sv: "festival", svId: sv.festival }));
  if (sv.vrat) links.push(extLink(lang, shubhvelaUrl(lang, "vrat", sv.vrat), t(lang, "shubhvela.vrat"), { cls: "btn", sv: "vrat", svId: sv.vrat }));
  links.push(extLink(lang, shubhvelaUrl(lang, "panchang"), t(lang, "shubhvela.panchang"), { cls: "btn", sv: "panchang" }));
  return links;
}

export function whenCard(ctx, lang, occ, { mdCtx, id = "when", heading = "h2" } = {}) {
  const H = heading;
  const rules = occ.when && occ.when.rules && occ.when.rules[lang];
  return html`<section class="card when" id="${id}" aria-labelledby="h-${id}">
${raw(`<${H} id="h-${id}">`)}${t(lang, "occasion.sections.when")}${raw(`</${H}>`)}
${rules ? html`<p class="prose">${inlineProse(rules, mdCtx)}</p>` : ""}
<p class="meta">${t(lang, "honesty.no_dates")} ${t(lang, "shubhvela.links_label")}</p>
<div class="btns">${shubhvelaLinks(lang, occ.when)}</div>
</section>`;
}
