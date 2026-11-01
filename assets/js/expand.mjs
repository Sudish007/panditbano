// expand.mjs (design.md §4.5, §12; FEAT-107): "Expand all" / "Collapse all" for the <details class="meaning"> panels of a
// chapter page. Both buttons carry aria-controls="verses" and aria-expanded = "true" only while EVERY meaning panel is
// open (kept in sync with manual toggles). A deep link #v{n} opens that verse's meaning so the anchored verse is read
// with its meaning. No scroll hijacking; without JS the panels still open one by one.
function panels() { return Array.from(document.querySelectorAll("#verses details.meaning")); }
function buttons() { return Array.from(document.querySelectorAll("[data-expand]")); }
function sync() {
  const all = panels();
  const allOpen = all.length > 0 && all.every((d) => d.open);
  buttons().forEach((b) => b.setAttribute("aria-expanded", allOpen ? "true" : "false"));
}
export function init() {
  try {
    buttons().forEach((b) => b.addEventListener("click", () => {
      const open = b.getAttribute("data-expand") === "open";
      panels().forEach((d) => { d.open = open; });
      sync();
    }));
    panels().forEach((d) => d.addEventListener("toggle", sync));
    const openHash = () => {
      const m = /^#v(\d+)$/.exec(location.hash || "");
      if (!m) return;
      const item = document.getElementById("v" + m[1]);
      const d = item && item.querySelector("details.meaning");
      if (d) { d.open = true; sync(); }
    };
    openHash();
    window.addEventListener("hashchange", openHash);
    sync();
  } catch (e) { console.warn("pb:expand", e); }
}
