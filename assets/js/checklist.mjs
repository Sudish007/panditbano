// checklist.mjs (design.md §4.3, §9.3, §12, §15; FEAT-106): samagri ticks → localStorage pb-check:<occasionId> (a JSON
// array of item ids), restored on load; Clear asks confirm() with the UI string carried in data-l-confirm; "सूची छापें" adds
// body.print-samagri, prints and removes the class on afterprint; the page-head Print button prints the whole page.
// Storage failures degrade to in-page state (Safari private mode). Nothing here throws to the top level.
const mem = {};
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* memory only */ } };

function readIds(key) {
  try { const v = JSON.parse(get(key) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch (e) { return []; }
}

export function initChecklist(root) {
  const id = root.getAttribute("data-checklist");
  if (!id) return;
  const key = "pb-check:" + id;
  const boxes = Array.from(root.querySelectorAll('input[type="checkbox"][data-item]'));
  const ticked = new Set(readIds(key));
  boxes.forEach((b) => { b.checked = ticked.has(b.getAttribute("data-item")); });
  const save = () => set(key, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.getAttribute("data-item"))));
  boxes.forEach((b) => b.addEventListener("change", save));
  Array.from(root.querySelectorAll("[data-clear-checks]")).forEach((btn) => btn.addEventListener("click", () => {
    const msg = root.getAttribute("data-l-confirm") || "Clear?";
    if (!window.confirm(msg)) return;
    boxes.forEach((b) => { b.checked = false; });
    save();
  }));
  Array.from(root.querySelectorAll("[data-print-samagri]")).forEach((btn) => btn.addEventListener("click", () => {
    let d = root.closest("details");
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); }
    if (root.tagName === "DETAILS") root.open = true;
    document.body.classList.add("print-samagri");
    const done = () => { document.body.classList.remove("print-samagri"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    // browsers without afterprint (or a cancelled dialog) — clean up on the next tick after the dialog closes
    setTimeout(() => { if (document.body.classList.contains("print-samagri")) done(); }, 1500);
  }));
}

export function init() {
  document.querySelectorAll("[data-checklist]").forEach((root) => { try { initChecklist(root); } catch (e) { console.warn("pb:checklist", e); } });
  document.querySelectorAll("[data-print]").forEach((btn) => btn.addEventListener("click", () => window.print()));
}
