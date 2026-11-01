// Pandit Bano — app.mjs (design.md §12): theme cycle, language persistence, rail folds, Shubhvela href upgrade,
// per-page hook dispatch. Progressive enhancement: every page is readable without this file. No module throws to
// the top level; each feature is wrapped so one failure never breaks another. Storage failures degrade to memory.
const root = document.documentElement;
const mem = {};
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* private mode / quota: memory only */ } },
};
window.pb = { base: root.getAttribute("data-base") || "/", lang: root.getAttribute("data-lang") || "hi", page: root.getAttribute("data-page") || "" };

function guard(name, fn) { try { fn(); } catch (e) { console.warn("pb:" + name, e); } }

// ---- theme: light → dark → system (mocks decision 6); label + icon + data-theme; aria-live on the button ----
const THEMES = ["light", "dark", "system"];
function applyTheme(t) {
  root.setAttribute("data-theme", t);
  document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
    const lbl = b.querySelector(".lbl");
    if (lbl) lbl.textContent = b.getAttribute("data-l-" + t) || t;
    // SVG elements have no `hidden` IDL property: toggle the attribute
    b.querySelectorAll("svg.ic").forEach((s, i) => { if (THEMES[i] === t) s.removeAttribute("hidden"); else s.setAttribute("hidden", ""); });
  });
}
guard("theme", () => {
  const cur = root.getAttribute("data-theme");
  applyTheme(THEMES.includes(cur) ? cur : "light");
  document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
    const i = THEMES.indexOf(root.getAttribute("data-theme"));
    const next = THEMES[(i + 1) % THEMES.length];
    store.set("pb-theme", next);
    applyTheme(next);
  }));
});

// ---- language: persist only on an explicit click (design §9.2) ----
guard("lang", () => {
  document.querySelectorAll(".seg a[data-lang]").forEach((a) => a.addEventListener("click", () => {
    const l = a.getAttribute("data-lang");
    if (l === "hi" || l === "en" || l === "bho") store.set("pb-lang", l);
  }));
});

// ---- rails: open at ≥ 1024, folded on phones so the content comes first (design §9.4) ----
guard("rails", () => {
  const wide = window.matchMedia("(min-width: 1024px)");
  const folds = () => document.querySelectorAll("details.rail-fold").forEach((d) => { d.open = wide.matches; });
  folds();
  if (wide.addEventListener) wide.addEventListener("change", folds);
});

// ---- Shubhvela links: upgrade year-less hrefs with the device clock only (design §16.1) ----
guard("shubhvela", () => {
  const now = new Date();
  const y = String(now.getFullYear());
  const ym = y + "-" + String(now.getMonth() + 1).padStart(2, "0");
  document.querySelectorAll('a[data-sv="festival"][data-sv-id]').forEach((a) => {
    a.href = a.href.replace(/festivals\/$/, "festival/" + a.getAttribute("data-sv-id") + "/" + y + "/");
  });
  document.querySelectorAll('a[data-sv="muhurat"][data-sv-id]').forEach((a) => {
    a.href = a.href.replace(/muhurat\/$/, "muhurat/" + a.getAttribute("data-sv-id") + "/" + ym + "/");
  });
});

// ---- per-page hooks: the build lists the hashed module URLs for this page type in #pb-modules ----
guard("modules", () => {
  const el = document.getElementById("pb-modules");
  const list = el ? JSON.parse(el.textContent || "[]") : [];
  const here = new URL(import.meta.url);
  list.forEach((rel) => {
    import(new URL(rel, here).href).then((m) => { if (typeof m.init === "function") m.init(window.pb); }).catch((e) => console.warn("pb:module " + rel, e));
  });
});

// ---- service worker: registered by FEAT-109 (sw.js at BASE_PATH, scope BASE_PATH) ----
export function registerSW() { /* stub until FEAT-109 ships sw.js */ }
guard("sw", registerSW);
