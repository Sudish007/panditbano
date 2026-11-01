// tracker.mjs (design.md §4.3, §9.1, §12; FEAT-106): IntersectionObserver → aria-current="true" on the step tracker link
// of the step in view and aria-current="location" on the .sections chip of the section in view. No scroll hijacking: the
// module only sets attributes. A .sections chip that targets an element inside a folded <details> (the samagri rail on
// phones) opens the fold before the browser jumps. Falls back to doing nothing without IntersectionObserver.
function targetsOf(links) {
  const out = [];
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#") || href.length < 2) return;
    const el = document.getElementById(decodeURIComponent(href.slice(1)));
    if (el) out.push({ a, el });
  });
  return out;
}

function watch(pairs, attr, value) {
  if (!pairs.length || typeof IntersectionObserver !== "function") return;
  const visible = new Set();
  const byEl = new Map(pairs.map((p) => [p.el, p.a]));
  // a target inside a sticky rail (≥ 1024) is always "in view": it never wins over the content section being read
  const stuck = (el) => { const r = el.closest(".rail"); return !!r && getComputedStyle(r).position === "sticky"; };
  const pick = () => {
    let best = null, top = Infinity;
    visible.forEach((el) => { if (stuck(el)) return; const t = Math.abs(el.getBoundingClientRect().top); if (t < top) { top = t; best = el; } });
    pairs.forEach((p) => { if (p.el === best) p.a.setAttribute(attr, value); else p.a.removeAttribute(attr); });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    pick();
  }, { rootMargin: "-10% 0px -55% 0px", threshold: [0, 0.1] });
  byEl.forEach((_, el) => io.observe(el));
}

export function init() {
  try {
    const rail = Array.from(document.querySelectorAll("[data-tracker] a[data-step]"));
    watch(targetsOf(rail), "aria-current", "true");
    const chips = Array.from(document.querySelectorAll(".sections a"));
    watch(targetsOf(chips), "aria-current", "location");
    chips.forEach((a) => a.addEventListener("click", () => {
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const el = document.getElementById(href.slice(1));
      let d = el && (el.tagName === "DETAILS" ? el : el.closest("details"));
      while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); }
    }));
  } catch (e) { console.warn("pb:tracker", e); }
}
