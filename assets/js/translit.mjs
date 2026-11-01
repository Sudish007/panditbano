// translit.mjs (design.md §7.4, §9.3, §12): the reading-settings radiogroup → html[data-translit] + localStorage pb-translit.
// The head script already set data-translit before first paint; this module only syncs the control, handles clicks and
// the arrow keys of the radiogroup, and opens the folded rail when a verse's ⚙ link targets #reading-settings.
const VALUES = ["iast", "easy", "off"];
const root = document.documentElement;
const valid = (v) => (VALUES.includes(v) ? v : null);
function save(v) { try { localStorage.setItem("pb-translit", v); } catch (e) { /* private mode: in-page state only */ } }

export function init() {
  const groups = Array.from(document.querySelectorAll('[role="radiogroup"][data-translit]'));
  const radios = (g) => Array.from(g.querySelectorAll('[role="radio"]'));
  const apply = (v, persist) => {
    root.setAttribute("data-translit", v);
    groups.forEach((g) => radios(g).forEach((b) => {
      const on = b.getAttribute("data-value") === v;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.setAttribute("tabindex", on ? "0" : "-1");
    }));
    if (persist) save(v);
  };
  apply(valid(root.getAttribute("data-translit")) || "iast", false);
  groups.forEach((g) => {
    g.addEventListener("click", (e) => {
      const b = e.target.closest('[role="radio"]');
      if (b && g.contains(b)) { const v = valid(b.getAttribute("data-value")); if (v) apply(v, true); }
    });
    g.addEventListener("keydown", (e) => {
      const list = radios(g);
      const i = list.indexOf(document.activeElement);
      if (i < 0) return;
      let j = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % list.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + list.length) % list.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = list.length - 1;
      if (j < 0) return;
      e.preventDefault();
      const v = valid(list[j].getAttribute("data-value"));
      if (v) apply(v, true);
      list[j].focus();
    });
  });
  // ⚙ links: make sure the folded rail (phones) opens before the browser scrolls to the card
  document.querySelectorAll('a[href="#reading-settings"]').forEach((a) => a.addEventListener("click", () => {
    const card = document.getElementById("reading-settings");
    let d = card && card.closest("details");
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); }
  }));
}
