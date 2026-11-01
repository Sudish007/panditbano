/* Pandit Bano service worker (design.md §13.2, §19, §21, §22; design-review MEDIUM 5). Hand-written; build/pwa.mjs
   replaces the four placeholders below (build hash, BASE_PATH, the language list, the precache list) and writes the
   result to dist/sw.js (served at BASE_PATH + "sw.js", registered with scope BASE_PATH).
   Caches: pb-static-<hash> (precached shell: CSS, JS, fonts, icons, offline pages, 404, root, home pages, section
   indexes, manifests), pb-pages-<hash> (visited HTML), pb-search-<hash> (search shards), pb-saved (explicit "save this
   occasion offline" sets — survives every deploy; stale sets are re-fetched on activate). Only same-origin GET requests
   under BASE_PATH are handled; cross-origin requests (Shubhvela, GitHub) are never intercepted; opaque responses are
   never cached. skipWaiting happens only on the page's SKIP_WAITING message (update toast). */
"use strict";
var HASH = "__PB_HASH__";
var BASE = "__PB_BASE__";
var LANGS = __PB_LANGS__;
var PRECACHE = __PB_PRECACHE__;
var STATIC = "pb-static-" + HASH;
var PAGES = "pb-pages-" + HASH;
var SEARCH = "pb-search-" + HASH;
var SAVED = "pb-saved";
var MAX_SETS = 60;
var MAX_URLS = 400;
var MAX_URL_LEN = 300;
var NAV_TIMEOUT_MS = 3000;
var ID_RE = /^[a-z0-9-]{2,64}$/;
var HASHED_ASSET_RE = /^assets\/(css|js)\/[A-Za-z0-9_-]+\.[0-9a-f]{12}\.(css|mjs)$/;
var ORIGIN = self.location.origin;

// ---------------------------------------------------------------- helpers
/** Cache key of a URL: same-origin absolute URL without query or fragment. */
function keyOf(url) {
  var u = new URL(url, ORIGIN);
  return u.origin + u.pathname;
}
function manifestKey(id) { return ORIGIN + BASE + "_saved/" + id + ".json"; }
function isManifestKey(url) { return url.indexOf(ORIGIN + BASE + "_saved/") === 0; }
function langOf(pathname) {
  var rel = pathname.slice(BASE.length);
  for (var i = 0; i < LANGS.length; i++) if (rel === LANGS[i] || rel.indexOf(LANGS[i] + "/") === 0) return LANGS[i];
  return LANGS[0];
}
function cacheable(res) { return !!res && res.ok && res.type === "basic"; }
function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    var t = setTimeout(function () { reject(new Error("timeout")); }, ms);
    promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
  });
}
function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}

/** Every saved-set manifest in pb-saved, oldest first. */
function listSets() {
  return caches.open(SAVED).then(function (c) {
    return c.keys().then(function (keys) {
      var ms = keys.filter(function (r) { return isManifestKey(r.url); });
      return Promise.all(ms.map(function (r) { return c.match(r).then(function (res) { return res ? res.json().catch(function () { return null; }) : null; }); }));
    });
  }).then(function (list) {
    return list.filter(Boolean).sort(function (a, b) { return (a.savedAt || 0) - (b.savedAt || 0); });
  });
}

/** URL keys referenced by every set except `exceptId`. */
function referencedElsewhere(sets, exceptId) {
  var used = {};
  sets.forEach(function (m) { if (m.id !== exceptId) m.urls.forEach(function (u) { used[keyOf(u)] = true; }); });
  return used;
}

/** Delete the URLs of one set that no other set references, then its manifest. */
function deleteSet(c, sets, m) {
  var used = referencedElsewhere(sets, m.id);
  var work = m.urls.filter(function (u) { return !used[keyOf(u)]; }).map(function (u) { return c.delete(keyOf(u)); });
  work.push(c.delete(manifestKey(m.id)));
  return Promise.all(work);
}

/** Fetch every URL of a set; resolves to [{key, res}] only when all are ok and basic; onProgress(n, total) per URL. */
function fetchSet(urls, onProgress) {
  var n = 0;
  return Promise.all(urls.map(function (u) {
    var key = keyOf(u);
    return fetch(new Request(key, { credentials: "same-origin", cache: "no-cache" })).then(function (res) {
      if (!cacheable(res)) throw new Error("fetch " + key + " → " + res.status);
      n++;
      if (onProgress) onProgress(n, urls.length);
      return { key: key, res: res };
    });
  }));
}

/** Put a fetched set + its manifest into pb-saved; on any failure delete what this call wrote (all-or-nothing). */
function storeSet(c, sets, entries, manifest) {
  var used = referencedElsewhere(sets, manifest.id);
  var written = [];
  var i = 0;
  function next() {
    if (i >= entries.length) return c.put(manifestKey(manifest.id), jsonResponse(manifest));
    var e = entries[i++];
    return c.put(e.key, e.res).then(function () { if (!used[e.key]) written.push(e.key); return next(); });
  }
  return next().catch(function (err) {
    return Promise.all(written.map(function (k) { return c.delete(k); })).then(function () { throw err; });
  });
}

/** Validate a SAVE payload (design §21). Returns the clean manifest or null. */
function validateSave(d) {
  if (!d || typeof d.id !== "string" || !ID_RE.test(d.id)) return null;
  if (!Array.isArray(d.urls) || d.urls.length === 0 || d.urls.length > MAX_URLS) return null;
  if (typeof d.hash !== "string" || !/^[0-9a-f]{6,64}$/.test(d.hash)) return null;
  var bytes = Number(d.bytes);
  if (!isFinite(bytes) || bytes < 0) return null;
  var urls = [];
  for (var i = 0; i < d.urls.length; i++) {
    var u = d.urls[i];
    if (typeof u !== "string" || u.length > MAX_URL_LEN) return null;
    var abs;
    try { abs = new URL(u, ORIGIN); } catch (e) { return null; }
    if (abs.origin !== ORIGIN || abs.pathname.indexOf(BASE) !== 0) return null;
    urls.push(abs.origin + abs.pathname);
  }
  var title = typeof d.title === "string" ? d.title.slice(0, 120) : "";
  var url = "";
  if (typeof d.url === "string" && d.url.length <= MAX_URL_LEN) {
    try { var pu = new URL(d.url, ORIGIN); if (pu.origin === ORIGIN && pu.pathname.indexOf(BASE) === 0) url = pu.pathname; } catch (e) { /* ignored */ }
  }
  return { id: d.id, hash: d.hash, bytes: Math.round(bytes), urls: urls, title: title, url: url || urls[0].slice(ORIGIN.length), lang: langOf(new URL(urls[0]).pathname), savedAt: Date.now() };
}

/** Storage-pressure check (design §13.2): remaining quota must be ≥ bytes × 1.5. Resolves true when it cannot be measured. */
function quotaOk(bytes) {
  if (!self.navigator || !navigator.storage || !navigator.storage.estimate) return Promise.resolve(true);
  return navigator.storage.estimate().then(function (est) {
    if (!est || typeof est.quota !== "number" || typeof est.usage !== "number") return true;
    return est.quota - est.usage >= bytes * 1.5;
  }).catch(function () { return true; });
}

// ---------------------------------------------------------------- SAVE / UNSAVE
function save(d, reply) {
  var m = validateSave(d);
  if (!m) { reply({ type: "ERROR", id: d && d.id, reason: "bad-request" }); return Promise.resolve(); }
  var c;
  var sets;
  return caches.open(SAVED).then(function (cache) {
    c = cache;
    return listSets();
  }).then(function (list) {
    sets = list;
    return quotaOk(m.bytes);
  }).then(function (ok) {
    if (!ok) throw { reason: "quota" };
    // MAX_SETS: evict the oldest set (not this id) before saving a new one; the page shows a toast for it
    var others = sets.filter(function (s) { return s.id !== m.id; });
    var evict = [];
    while (others.length >= MAX_SETS) { var old = others.shift(); evict.push(old); }
    return Promise.all(evict.map(function (old) {
      return deleteSet(c, sets, old).then(function () { sets = sets.filter(function (s) { return s.id !== old.id; }); reply({ type: "EVICTED", id: old.id, title: old.title }); });
    }));
  }).then(function () {
    return fetchSet(m.urls, function (n, total) { reply({ type: "PROGRESS", id: m.id, n: n, total: total }); });
  }).then(function (entries) {
    var previous = sets.filter(function (s) { return s.id === m.id; })[0];
    return storeSet(c, sets, entries, m).then(function () {
      if (!previous) return null;
      // the set was re-saved: drop URLs of the previous version that the new version and the other sets no longer use
      var keep = {};
      m.urls.forEach(function (u) { keep[keyOf(u)] = true; });
      var used = referencedElsewhere(sets, m.id);
      return Promise.all(previous.urls.filter(function (u) { var k = keyOf(u); return !keep[k] && !used[k]; }).map(function (u) { return c.delete(keyOf(u)); }));
    });
  }).then(function () {
    reply({ type: "SAVED", id: m.id, bytes: m.bytes, title: m.title, url: m.url });
  }).catch(function (err) {
    var reason = err && err.reason ? err.reason : (err && /^fetch /.test(err.message || "") ? "fetch" : "store");
    reply({ type: "ERROR", id: m.id, reason: reason, total: m.urls.length });
  });
}

function unsave(d, reply) {
  if (!d || typeof d.id !== "string" || !ID_RE.test(d.id)) { reply({ type: "ERROR", id: d && d.id, reason: "bad-request" }); return Promise.resolve(); }
  var c;
  return caches.open(SAVED).then(function (cache) { c = cache; return listSets(); }).then(function (sets) {
    var m = sets.filter(function (s) { return s.id === d.id; })[0];
    if (!m) return null;
    return deleteSet(c, sets, m);
  }).then(function () { reply({ type: "UNSAVED", id: d.id }); })
    .catch(function () { reply({ type: "ERROR", id: d.id, reason: "store" }); });
}

/** On activate: every saved set whose hash is not the current one is re-fetched from its overview page's embedded
    manifest (#pb-offline-urls) and replaced atomically; a set whose refresh fails is kept as it is (MEDIUM 5). */
function refreshStaleSets() {
  if (self.navigator && navigator.onLine === false) return Promise.resolve();
  var c;
  return caches.open(SAVED).then(function (cache) { c = cache; return listSets(); }).then(function (sets) {
    var stale = sets.filter(function (s) { return s.hash !== HASH; });
    return stale.reduce(function (p, old) {
      return p.then(function () {
        return fetch(new Request(keyOf(old.urls[0]), { credentials: "same-origin", cache: "no-cache" })).then(function (res) {
          if (!cacheable(res)) throw new Error("fetch");
          return res.text();
        }).then(function (html) {
          var mm = /id="pb-offline-urls">([^<]+)<\/script>/.exec(html);
          if (!mm) throw new Error("no manifest");
          var fresh = validateSave(JSON.parse(mm[1]));
          if (!fresh) throw new Error("bad manifest");
          fresh.title = old.title; fresh.url = old.url; fresh.savedAt = old.savedAt;
          return fetchSet(fresh.urls).then(function (entries) {
            return storeSet(c, sets, entries, fresh).then(function () {
              var keep = {};
              fresh.urls.forEach(function (u) { keep[keyOf(u)] = true; });
              var used = referencedElsewhere(sets, old.id);
              return Promise.all(old.urls.filter(function (u) { var k = keyOf(u); return !keep[k] && !used[k]; }).map(function (u) { return c.delete(keyOf(u)); }));
            });
          });
        }).catch(function () { /* keep the old set */ });
      });
    }, Promise.resolve());
  });
}

// ---------------------------------------------------------------- fetch strategies
function navigate(req, url) {
  var key = url.origin + url.pathname;
  return withTimeout(fetch(req), NAV_TIMEOUT_MS).then(function (res) {
    if (cacheable(res)) caches.open(PAGES).then(function (c) { return c.put(key, res.clone()); }).catch(function () { /* cache full */ });
    return res;
  }).catch(function () {
    return caches.match(key).then(function (hit) {
      if (hit) return hit;
      return caches.match(ORIGIN + BASE + langOf(url.pathname) + "/offline/").then(function (off) {
        return off || new Response("offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      });
    });
  });
}
function cacheFirst(req) {
  var key = keyOf(req.url);
  return caches.match(key).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (cacheable(res)) caches.open(STATIC).then(function (c) { return c.put(key, res.clone()); }).catch(function () { /* cache full */ });
      return res;
    });
  });
}
function staleWhileRevalidate(req) {
  var key = keyOf(req.url);
  return caches.open(SEARCH).then(function (c) {
    return c.match(key).then(function (hit) {
      var net = fetch(req).then(function (res) { if (cacheable(res)) c.put(key, res.clone()).catch(function () { /* cache full */ }); return res; }).catch(function () { return null; });
      if (hit) return hit;
      return net.then(function (res) { return res || Response.error(); });
    });
  });
}

// ---------------------------------------------------------------- events
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(STATIC).then(function (c) { return c.addAll(PRECACHE); }));
  // no skipWaiting here: the page shows the update toast and posts SKIP_WAITING (design §13.2)
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n.indexOf("pb-") === 0 && n !== SAVED && n.slice(-HASH.length - 1) !== "-" + HASH; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }).then(function () { return refreshStaleSets(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== ORIGIN || url.pathname.indexOf(BASE) !== 0) return; // cross-origin / outside the site: never intercepted
  if (req.mode === "navigate") { e.respondWith(navigate(req, url)); return; }
  var rel = url.pathname.slice(BASE.length);
  if (HASHED_ASSET_RE.test(rel) || rel.indexOf("fonts/") === 0 || rel.indexOf("assets/icons/") === 0) { e.respondWith(cacheFirst(req)); return; }
  if (rel.indexOf("search/") === 0 && /\.json$/.test(rel)) { e.respondWith(staleWhileRevalidate(req)); return; }
  // everything else (manifest, OG images, other JSON) goes to the network untouched
});

self.addEventListener("message", function (e) {
  var d = e.data || {};
  var reply = function (msg) { if (e.source && typeof e.source.postMessage === "function") e.source.postMessage(msg); };
  if (d.type === "SKIP_WAITING") { self.skipWaiting(); return; }
  if (d.type === "SAVE") { e.waitUntil(save(d, reply)); return; }
  if (d.type === "UNSAVE") { e.waitUntil(unsave(d, reply)); return; }
  if (d.type === "LIST") { e.waitUntil(listSets().then(function (sets) { reply({ type: "LIST", sets: sets }); })); return; }
  reply({ type: "ERROR", reason: "bad-request" });
});
