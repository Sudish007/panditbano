// offline.mjs (design §12/§13/§19, MEDIUM 5; FEAT-109) — on every page: registers sw.js (scope BASE_PATH); un-hides and
// binds [data-save-offline] (posts #pb-offline-urls as SAVE; progress / saved ✓ aria-pressed / quota / failed+retry toasts);
// fills [data-saved-list] from the pb-saved cache with Remove (UNSAVE); update toast → SKIP_WAITING → one reload.
// Strings come from #pb-ui; only textContent/createElement; the toast (.floating) is the only element with --shadow.
let UI = {}, base = "/", reg = null, toastEl = null, timer = 0, reloading = false;
const pending = {};
const tr = (k, v) => String(UI[k] || k).replace(/\{(\w+)\}/g, (m, x) => (v && v[x] !== undefined ? String(v[x]) : m));
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const btn = (cls, label, onClick) => { const b = el("button", cls, label); b.type = "button"; b.addEventListener("click", onClick); return b; };

function hide() { if (toastEl) toastEl.hidden = true; }
function toast(text, { ok = false, actions = [], sticky = false } = {}) {
  if (!toastEl) { toastEl = el("div", "floating"); toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
  clearTimeout(timer);
  toastEl.replaceChildren();
  if (ok) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"), use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("class", "ok"); svg.setAttribute("aria-hidden", "true"); use.setAttribute("href", "#i-check"); svg.appendChild(use); toastEl.appendChild(svg);
  }
  toastEl.appendChild(el("span", "", text));
  for (const a of actions) toastEl.appendChild(btn("btn", a.label, () => { a.run(); hide(); }));
  if (sticky || actions.length) { const c = btn("btn btn-ghost", "×", hide); c.setAttribute("aria-label", tr("offline.close")); toastEl.appendChild(c); }
  toastEl.hidden = false;
  if (!sticky && !actions.length) timer = setTimeout(hide, 4000);
}

async function listSaved() {
  if (!("caches" in window)) return [];
  const c = await caches.open("pb-saved"), out = [];
  for (const k of await c.keys()) {
    if (!k.url.includes(base + "_saved/")) continue;
    try { const m = await (await c.match(k)).json(); if (m && m.id) out.push(m); } catch (e) { /* skip */ }
  }
  return out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}
const post = (msg) => { const w = navigator.serviceWorker.controller || (reg && reg.active); if (w) w.postMessage(msg); return !!w; };

async function renderSavedList() {
  const secs = document.querySelectorAll("[data-saved-list]");
  if (!secs.length) return;
  const sets = await listSaved();
  secs.forEach((sec) => {
    const ul = sec.querySelector("[data-saved-items]");
    if (!ul) return;
    ul.replaceChildren();
    for (const m of sets) {
      const li = el("li"), a = el("a", "", m.title || m.id);
      a.href = m.url || "#"; if (m.lang) a.lang = m.lang;
      const b = btn("btn btn-ghost", tr("offline.remove"), () => { b.disabled = true; if (!post({ type: "UNSAVE", id: m.id })) b.disabled = false; });
      b.setAttribute("data-unsave", m.id);
      li.append(a, b); ul.appendChild(li);
    }
    sec.hidden = !sets.length;
  });
}

function mark(b, saved) {
  b.setAttribute("aria-pressed", saved ? "true" : "false");
  const lbl = saved ? b.getAttribute("data-l-saved") || tr("pothi.saved") : b.getAttribute("data-l-save") || tr("pothi.save");
  const tn = [...b.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).pop();
  if (tn) tn.textContent = lbl; else b.appendChild(document.createTextNode(lbl));
}
function save(b) {
  let m = null;
  try { m = JSON.parse(document.getElementById("pb-offline-urls").textContent); } catch (e) { return; }
  if (!m || !Array.isArray(m.urls)) return;
  const h1 = document.querySelector("h1");
  if (!post({ type: "SAVE", id: m.id, hash: m.hash, bytes: m.bytes, urls: m.urls, title: (h1 && h1.textContent.trim()) || document.title, url: location.pathname })) return;
  pending[m.id] = b; b.disabled = true;
  toast(tr("offline.progress", { n: 0, total: m.urls.length }), { sticky: true });
}
async function bindSaveButtons() {
  const bs = document.querySelectorAll("[data-save-offline]");
  if (!bs.length) return;
  const sets = await listSaved();
  bs.forEach((b) => {
    if (!b.getAttribute("data-l-save")) b.setAttribute("data-l-save", (b.textContent || "").trim());
    mark(b, sets.some((s) => s.id === b.getAttribute("data-save-offline")));
    b.removeAttribute("hidden");
    b.addEventListener("click", () => save(b));
  });
}

function onMessage(e) {
  const d = e.data || {}, b = d.id ? pending[d.id] : null;
  if (d.type === "PROGRESS") { if (b) toast(tr("offline.progress", { n: d.n, total: d.total }), { sticky: true }); }
  else if (d.type === "SAVED") { if (b) { b.disabled = false; mark(b, true); delete pending[d.id]; } toast(tr("pothi.saved"), { ok: true }); renderSavedList(); }
  else if (d.type === "UNSAVED") { document.querySelectorAll("[data-save-offline]").forEach((x) => { if (x.getAttribute("data-save-offline") === d.id) mark(x, false); }); renderSavedList(); }
  else if (d.type === "EVICTED") toast(tr("offline.evicted", { title: d.title || d.id }), { sticky: true });
  else if (d.type === "ERROR") {
    if (b) { b.disabled = false; delete pending[d.id]; }
    if (d.reason === "quota") toast(tr("offline.quota"), { sticky: true });
    else toast(tr("offline.failed", { n: d.n || 0, total: d.total || 0 }), b ? { actions: [{ label: tr("offline.retry"), run: () => save(b) }] } : { sticky: true });
  }
}

function offerUpdate(w) {
  if (!w) return;
  try { if (sessionStorage.getItem("pb-update") === "1") return; sessionStorage.setItem("pb-update", "1"); } catch (e) { /* show anyway */ }
  toast(tr("offline.update"), { actions: [{ label: tr("offline.reload"), run: () => { reloading = "wanted"; w.postMessage({ type: "SKIP_WAITING" }); } }] });
}
function watchUpdates(r) {
  if (r.waiting && navigator.serviceWorker.controller) offerUpdate(r.waiting);
  r.addEventListener("updatefound", () => { const nw = r.installing; if (nw) nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) offerUpdate(nw); }); });
  // reload once, and only after the user asked for the update (the first install's clients.claim also fires controllerchange)
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloading === "wanted") { reloading = true; location.reload(); } });
}

export async function init(pb) {
  try {
    const u = document.getElementById("pb-ui");
    UI = u ? JSON.parse(u.textContent || "{}") : {};
    base = (pb && pb.base) || document.documentElement.getAttribute("data-base") || "/";
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.addEventListener("message", onMessage);
    reg = await navigator.serviceWorker.register(base + "sw.js", { scope: base });
    await navigator.serviceWorker.ready;
    // The worker's install is atomic and precaches all five faces. Use them from the next navigation instead of making
    // first-paint text depend on font transfers (font-display:optional's documented first-visit fallback).
    try { localStorage.setItem("pb-fonts", "1"); } catch (e) { /* the platform fallback remains readable */ }
    watchUpdates(reg);
    window.pb = Object.assign(window.pb || {}, { offline: { save, list: listSaved } });
    await bindSaveButtons();
    await renderSavedList();
  } catch (e) { console.warn("pb:offline", e); } // the site works without offline; Save buttons stay hidden (design §19)
}
