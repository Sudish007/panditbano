// pothi.mjs (design.md §9.3, §12, §15; FEAT-106): A−/A+ scale the pothi text 80–160 % in steps of 10 (localStorage
// pb-font-pct, shown live in the <output>), Print calls window.print(), Back is a plain link. The Save-offline button is
// owned by offline.mjs (FEAT-109, loaded on every page): it un-hides and binds [data-save-offline] once the SW is registered.
const MIN = 80, MAX = 160, STEP = 10;
const mem = {};
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* memory only */ } };

export function applyPct(pct) {
  const p = Math.min(MAX, Math.max(MIN, Math.round(pct / STEP) * STEP));
  document.documentElement.style.setProperty("--pothi-scale", String(p / 100));
  document.querySelectorAll("[data-size-out]").forEach((o) => { o.value = p + "%"; o.textContent = p + "%"; });
  document.querySelectorAll('[data-size="-"]').forEach((b) => { b.disabled = p <= MIN; });
  document.querySelectorAll('[data-size="+"]').forEach((b) => { b.disabled = p >= MAX; });
  return p;
}

export function init() {
  try {
    let pct = parseInt(get("pb-font-pct") || "100", 10);
    if (!Number.isFinite(pct)) pct = 100;
    pct = applyPct(pct);
    document.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => {
      pct = applyPct(pct + (b.getAttribute("data-size") === "+" ? STEP : -STEP));
      set("pb-font-pct", String(pct));
    }));
    document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));
  } catch (e) { console.warn("pb:pothi", e); }
}
