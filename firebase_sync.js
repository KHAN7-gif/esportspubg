/* ═══════════════════════════════════════════════════════════
   MAIDA ESPORTS — FIREBASE REALTIME DATABASE SYNC v5
   REST API (fetch) — tiada SDK, percuma, tanpa billing.

   SETUP (Firebase Console):
   1. Build → Realtime Database → Create Database
   2. Pilih lokasi (cth: asia-southeast1)
   3. Gunakan Firebase Authentication dan rules berasaskan peranan.
      Jangan gunakan public write untuk kejohanan rasmi.
   4. Catat URL database, isi DB_URL di bawah
═══════════════════════════════════════════════════════════ */

var DB_URL = "https://maida-esports-ca555-default-rtdb.asia-southeast1.firebasedatabase.app";

var _FB = {
  poll: {},
  last: {},
  ok: false
};

/* ── WRITE (overwrite path) ── */
function fsSet(path, data, onOk, onErr){
  return fetch(DB_URL + "/" + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error("HTTP "+r.status+": "+t.substring(0,200)); });
    return r.json();
  })
  .then(function(){ _FB.ok = true; if(onOk) onOk(); })
  .catch(function(e){ _FB.ok = false; console.warn("[FB set] "+path, e); if(onErr) onErr(e); });
}

/* ── READ ONCE ── */
function fsGet(path, cb, onErr){
  return fetch(DB_URL + "/" + path + ".json")
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error("HTTP "+r.status+": "+t.substring(0,200)); });
    return r.json();
  })
  .then(function(data){ _FB.ok = true; if(cb) cb(data); })
  .catch(function(e){
    _FB.ok = false;
    console.warn("[FB get] "+path, e);
    if(onErr) onErr(e);
  });
}

/* ── REALTIME LISTENER (polling) ── */
function fsListen(path, cb, interval){
  fsUnlisten(path);
  var ms = Math.max(250, (interval || 2) * 1000);
  var listener = { timer: null, stopped: false };
  _FB.poll[path] = listener;
  function poll(){
    if(listener.stopped) return;
    fsGet(path, function(d){
      if(listener.stopped) return;
      var str = JSON.stringify(d);
      if(str !== _FB.last[path]){ _FB.last[path] = str; cb(d); }
    }).then(function(){
      if(!listener.stopped) listener.timer = setTimeout(poll, ms);
    });
  }
  poll();
}
function fsUnlisten(path){
  var listener = _FB.poll[path];
  if(listener){
    listener.stopped = true;
    clearTimeout(listener.timer);
    delete _FB.poll[path];
    delete _FB.last[path];
  }
}

/* ── CHECK STATUS ── */
function fsCheckStatus(cb){
  // Shallow GET checks read connectivity without modifying tournament data.
  return fetch(DB_URL + "/maida.json?shallow=true")
  .then(function(r){ _FB.ok = r.ok; if(cb) cb(r.ok); })
  .catch(function(){ _FB.ok = false; if(cb) cb(false); });
}

/* ── COMPAT ALIASES (sama API dgn kod sedia ada) ── */
function fbSet(path, data, onOk, onErr){ fsSet(path, data, onOk, onErr); }
function fbGet(path, cb, onErr){ fsGet(path, cb, onErr); }
function fbListen(path, cb, interval){ fsListen(path, cb, interval); }
function fbUnlisten(path){ fsUnlisten(path); }
function fbCheckStatus(cb){ fsCheckStatus(cb); }
function fbWhenReady(fn){ fn(); }
function fbOnReady(fn){ fn(); }
function fbListenAll(cb){ fsListen("maida", cb, 2); }
function fbSaveAll(data, onOk){
  fsSet("maida", data, onOk);
  try{ localStorage.setItem("_fb_bk", JSON.stringify(data)); }catch(e){}
}
function fbLoadAll(cb){
  fsGet("maida", function(d){
    cb(d);
  }, function(){
    var data = null;
    try{ var b = localStorage.getItem("_fb_bk"); data = b ? JSON.parse(b) : null; }catch(e){}
    cb(data);
  });
}

console.log("[Firebase RTDB] Module loaded ✓ —", DB_URL);
