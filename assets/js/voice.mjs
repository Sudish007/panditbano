// voice.mjs (design.md §8.2–8.3, §12; brief §3.10): per-verse browser speechSynthesis with honest fallbacks.
// - buttons[data-listen] stay hidden until this module runs; without speechSynthesis they stay hidden and the
//   reading-settings card shows the "no Hindi voice" note once
// - voice: hi* voices, localService first, then a name containing Hindi/हिन्दी/हिंदी, else the first; else any sa voice;
//   Chrome loads voices asynchronously → wait for voiceschanged up to 1.5 s; the name is shown in the card and kept in
//   sessionStorage only
// - speaks the .mantra's data-plain (svara-less), chunked at । ॥ \n into ≤ 1,500 chars, one utterance at a time;
//   boundary events drive a 2-px progress line, else a static "बोल रहा है…" text (no pulsing bar — reduced motion)
// - speed 0.5–1.5 step 0.1 (default 0.9, pb-rate) and Repeat (≤ 10 rounds, 1-s pause, pb-repeat); pagehide cancels
// - no Hindi voice: the click shows a role="status" note with the Level 1 lesson link; aria-disabled is NOT set
const S = typeof window !== "undefined" ? window.speechSynthesis : null;
const HAS = !!(S && typeof window.SpeechSynthesisUtterance === "function");
const RATE = { min: 0.5, max: 1.5, step: 0.1, def: 0.9 };
const MAX_CHUNK = 1500;
const MAX_ROUNDS = 10;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* memory only */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
};
const clampRate = (r) => { const n = Number(r); if (!isFinite(n)) return RATE.def; return Math.round(Math.min(RATE.max, Math.max(RATE.min, n)) * 10) / 10; };

/** Split at । ॥ and line ends into ≤ max-char chunks; dandas become full stops for the engine. */
export function chunk(text, max = MAX_CHUNK) {
  const parts = String(text || "").split(/(?<=[।॥\n])/);
  const out = [];
  let cur = "";
  for (const p of parts) {
    if (cur && (cur + p).length > max) { out.push(cur); cur = p; } else cur += p;
  }
  if (cur) out.push(cur);
  const hard = (s) => { const r = []; let rest = s; while (rest.length > max) { let cut = rest.lastIndexOf(" ", max); if (cut < max / 2) cut = max; r.push(rest.slice(0, cut)); rest = rest.slice(cut); } if (rest) r.push(rest); return r; };
  return out.flatMap((c) => (c.length <= max ? [c] : hard(c))).map((c) => c.replace(/[।॥]/g, ".").replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Pick the voice per design §8.2. */
export function pickVoice(voices) {
  const hi = voices.filter((v) => /^hi/i.test(v.lang || ""));
  if (hi.length) {
    return hi.find((v) => v.localService) || hi.find((v) => /hindi|हिन्दी|हिंदी/i.test(v.name || "")) || hi[0];
  }
  return voices.find((v) => /^sa/i.test(v.lang || "")) || null;
}

function waitVoices(ms = 1500) {
  return new Promise((resolve) => {
    let v = S.getVoices();
    if (v.length) return resolve(v);
    let done = false;
    const finish = () => { if (done) return; done = true; S.removeEventListener("voiceschanged", finish); resolve(S.getVoices()); };
    S.addEventListener("voiceschanged", finish);
    setTimeout(finish, ms);
  });
}

export function init() {
  const card = document.querySelector("[data-reading-settings]");
  const L = (k, fb = "") => (card && card.getAttribute("data-l-" + k)) || fb;
  const buttons = Array.from(document.querySelectorAll("button[data-listen]"));
  const cardStatus = card && card.querySelector("[data-voice-status]");
  if (!HAS) {
    if (cardStatus && buttons.length) cardStatus.textContent = L("none");
    return; // buttons remain hidden
  }
  if (!buttons.length && !card) return;

  // ---- speed and repeat (persisted) ----
  let rate = clampRate(store.get("pb-rate") || RATE.def);
  let repeat = store.get("pb-repeat") === "1";
  const outs = Array.from(document.querySelectorAll("[data-rate-out]"));
  const showRate = () => outs.forEach((o) => { o.textContent = rate.toFixed(1) + "×"; });
  showRate();
  document.querySelectorAll("[data-rate]").forEach((b) => b.addEventListener("click", () => {
    rate = clampRate(rate + (b.getAttribute("data-rate") === "+" ? RATE.step : -RATE.step));
    store.set("pb-rate", String(rate));
    showRate();
  }));
  const reps = Array.from(document.querySelectorAll("[data-repeat]"));
  const showRepeat = () => reps.forEach((b) => b.setAttribute("aria-pressed", repeat ? "true" : "false"));
  showRepeat();
  reps.forEach((b) => b.addEventListener("click", () => { repeat = !repeat; store.set("pb-repeat", repeat ? "1" : "0"); showRepeat(); }));

  // ---- voice ----
  let voice = null;
  const ready = waitVoices().then((list) => {
    const remembered = store.sget("pb-voice");
    voice = (remembered && list.find((v) => v.name === remembered && /^hi/i.test(v.lang || ""))) || pickVoice(list);
    if (voice) {
      store.sset("pb-voice", voice.name);
      const nameEl = card && card.querySelector("[data-voice-name]");
      if (nameEl) { nameEl.textContent = L("name", "{name}").replace("{name}", voice.name); nameEl.hidden = false; }
    }
    return voice;
  });

  // ---- per-button helpers ----
  const tools = (btn) => btn.closest(".verse-tools");
  const statusEl = (btn) => { const t = tools(btn); return t ? t.querySelector("[data-vstatus]") : null; };
  const setStatus = (btn, text) => { const s = statusEl(btn); if (s) s.textContent = text; };
  const setPressed = (btn, on) => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    const lbl = btn.querySelector(".lbl");
    const play = btn.getAttribute("data-l-play") || "", stop = btn.getAttribute("data-l-stop") || "";
    if (lbl) lbl.textContent = on ? stop : play;
    const aria = btn.getAttribute("aria-label");
    if (aria && play && stop) btn.setAttribute("aria-label", on ? aria.replace(play, stop) : aria.replace(stop, play));
  };
  const progress = (btn, frac) => { const p = btn.querySelector(".vprog"); if (p) p.style.width = frac > 0 ? Math.min(100, Math.round(frac * 100)) + "%" : "0"; };
  const textFor = (btn) => {
    const m = document.getElementById(btn.getAttribute("data-listen"));
    if (!m) return "";
    const plain = m.getAttribute("data-plain");
    if (plain) return plain;
    const deva = m.querySelector(".deva");
    return (deva || m).textContent || "";
  };
  const noVoiceNote = (btn) => {
    const s = statusEl(btn);
    if (!s) return;
    s.textContent = L("none") + " ";
    const href = card && card.getAttribute("data-lesson-href");
    if (href) { const a = document.createElement("a"); a.href = href; a.textContent = L("lesson", href); s.appendChild(a); }
  };

  buttons.forEach((b) => {
    b.hidden = false;
    if (!b.querySelector(".vprog")) { const p = document.createElement("span"); p.className = "vprog"; p.setAttribute("aria-hidden", "true"); b.appendChild(p); }
  });

  // ---- speaking: one utterance at a time ----
  let active = null;
  let noteTimer = null;
  const flash = (btn, text, ms) => { setStatus(btn, text); clearTimeout(noteTimer); noteTimer = setTimeout(() => setStatus(btn, ""), ms); };
  const stop = () => {
    const a = active;
    active = null;
    if (a) { clearTimeout(a.timer); setPressed(a.btn, false); progress(a.btn, 0); setStatus(a.btn, ""); }
    try { S.cancel(); } catch (e) { /* ignore */ }
  };
  const next = () => {
    const a = active;
    if (!a) return;
    if (a.i >= a.chunks.length) {
      a.round++;
      if (repeat && a.round < MAX_ROUNDS) { a.i = 0; a.spoken = 0; progress(a.btn, 0); a.timer = setTimeout(next, 1000); return; }
      stop();
      return;
    }
    const text = a.chunks[a.i];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    if (voice) u.voice = voice;
    u.rate = rate;
    const base = a.spoken;
    u.onboundary = (e) => { if (active !== a) return; a.boundary = true; setStatus(a.btn, ""); progress(a.btn, (base + (e.charIndex || 0)) / a.total); };
    u.onend = () => { if (active !== a) return; a.spoken += text.length; a.i++; next(); };
    u.onerror = (e) => {
      if (active !== a) return;
      const err = e && e.error;
      stop();
      if (err !== "interrupted" && err !== "canceled") { console.warn("pb:voice", err); flash(a.btn, L("failed"), 4000); }
    };
    a.utter = u; // keep a reference: Chromium drops utterances that are garbage-collected mid-speech
    S.speak(u);
    if (a.i === 0 && a.round === 0) a.timer = setTimeout(() => { if (active === a && !a.boundary) setStatus(a.btn, L("speaking")); }, 1500);
  };
  const start = (btn) => {
    if (active && active.btn === btn) { stop(); return; }
    stop();
    const text = textFor(btn);
    if (!text.trim()) return;
    active = { btn, chunks: chunk(text), i: 0, round: 0, total: text.length, spoken: 0, boundary: false, timer: null, utter: null };
    setPressed(btn, true);
    next();
  };

  buttons.forEach((b) => b.addEventListener("click", () => {
    ready.then(() => {
      if (!voice) voice = pickVoice(S.getVoices());
      if (!voice) { stop(); noVoiceNote(b); return; }
      start(b);
    });
  }));
  window.addEventListener("pagehide", stop);
}
