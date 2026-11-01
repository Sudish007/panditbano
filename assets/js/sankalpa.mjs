// sankalpa.mjs (design.md §9.3 pb-sankalpa, §12, §18 WCAG 3.3.7; FEAT-108): the two-field form on reference/sankalpa/ fills
// every <span data-sankalpa="gotra|name"> of the worked example via textContent as the visitor types (≤ 60 chars each);
// "याद रखें" stores pb-sankalpa = {gotra, name} and prefills on the next visit; "भूल जाएँ" removes it. Other slots
// ({tithi}, {nakshatra} …) keep their bracketed labels. Storage failures degrade to in-page state; nothing throws.
const MAX = 60;
const mem = {};
const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* memory only */ } };
const del = (k) => { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };
const clean = (v) => String(v || "").replace(/\s+/g, " ").trim().slice(0, MAX);

export function readStored() {
  try { const r = JSON.parse(get("pb-sankalpa") || "null"); return r && typeof r === "object" ? { gotra: clean(r.gotra), name: clean(r.name) } : null; } catch (e) { return null; }
}

export function fill(values) {
  document.querySelectorAll("[data-sankalpa]").forEach((s) => {
    const v = clean(values[s.getAttribute("data-sankalpa")]);
    s.textContent = v || s.getAttribute("data-empty") || "";
    s.classList.toggle("filled", !!v);
  });
}

export function init() {
  const form = document.querySelector("[data-sankalpa-form]");
  if (!form) return;
  const inputs = Array.from(form.querySelectorAll("input[data-sankalpa-input]"));
  const status = form.querySelector("[data-sankalpa-status]");
  const values = () => { const v = {}; inputs.forEach((i) => { v[i.getAttribute("data-sankalpa-input")] = clean(i.value); }); return v; };
  const stored = readStored();
  if (stored) inputs.forEach((i) => { i.value = stored[i.getAttribute("data-sankalpa-input")] || ""; });
  fill(values());
  inputs.forEach((i) => i.addEventListener("input", () => { if (i.value.length > MAX) i.value = i.value.slice(0, MAX); fill(values()); if (status) status.textContent = ""; }));
  form.querySelectorAll("[data-sankalpa-remember]").forEach((b) => b.addEventListener("click", () => {
    set("pb-sankalpa", JSON.stringify(values()));
    if (status) status.textContent = form.getAttribute("data-l-remembered") || "✓";
  }));
  form.querySelectorAll("[data-sankalpa-forget]").forEach((b) => b.addEventListener("click", () => {
    del("pb-sankalpa");
    inputs.forEach((i) => { i.value = ""; });
    fill({});
    if (status) status.textContent = "";
  }));
}
