/* Color Hunt — standalone web adapter.
   Provides the same storage interface the app uses inside Claude, backed by Supabase. */
window.__CH_WEB = true;
(function () {
  var cfg = window.CH_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    window.claude = { use: function () { return Promise.resolve(null); } };
    return;
  }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false } });
  var T = "docs", BUCKET = "photos";

  function rid(n) { var a = new Uint8Array(n || 16); crypto.getRandomValues(a); return Array.from(a, function (b) { return "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]; }).join(""); }
  function parentCol(p) { return p.split("/").slice(0, -1).join("/"); }
  function snapDoc(path, row) { return { id: path.split("/").pop(), exists: !!row, data: function () { return row ? row.data : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } }; }
  function dbErr(e) { var x = new Error((e && e.message) || "Database error"); x.code = "unavailable"; return x; }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function deepMerge(a, b) { var out = Object.assign({}, a); Object.keys(b).forEach(function (k) { out[k] = isObj(out[k]) && isObj(b[k]) ? deepMerge(out[k], b[k]) : b[k]; }); return out; }

  /* realtime: one channel; listeners refetch when a matching path changes */
  var subs = new Set(), channel = null;
  function ensureChannel() {
    if (channel) return;
    channel = sb.channel("docs-all").on("postgres_changes", { event: "*", schema: "public", table: T }, function (payload) {
      var path = (payload.new && payload.new.path) || (payload.old && payload.old.path);
      if (path) touch(path);
    }).subscribe();
  }
  function touch(path) { subs.forEach(function (s) { s.touch(path); }); }
  function listen(match, fetcher, next, error) {
    var timer = null, dead = false;
    function run() { fetcher().then(function (r) { if (!dead) next(r); }).catch(function (e) { console.warn(e); }); }
    var s = { touch: function (p) { if (match(p)) { clearTimeout(timer); timer = setTimeout(run, 120); } } };
    subs.add(s); ensureChannel(); run();
    var iv = setInterval(run, 30000);
    return function () { dead = true; subs.delete(s); clearInterval(iv); };
  }

  function docRef(path) {
    var ref = {
      id: path.split("/").pop(), path: path,
      get: function () { return sb.from(T).select("data").eq("path", path).maybeSingle().then(function (r) { if (r.error) throw dbErr(r.error); return snapDoc(path, r.data); }); },
      set: function (d) { return sb.from(T).upsert({ path: path, col: parentCol(path), data: d, updated_at: new Date().toISOString() }).then(function (r) { if (r.error) throw dbErr(r.error); touch(path); }); },
      update: function (d) {
        return ref.get().then(function (cur) {
          if (!cur.exists) { var x = new Error("Document does not exist"); x.code = "invalid_argument"; throw x; }
          return sb.from(T).update({ data: deepMerge(cur.data(), d), updated_at: new Date().toISOString() }).eq("path", path);
        }).then(function (r) { if (r.error) throw dbErr(r.error); touch(path); });
      },
      delete: function () { return sb.from(T).delete().eq("path", path).then(function (r) { if (r.error) throw dbErr(r.error); touch(path); }); },
      acquire: function () { return Promise.resolve({ acquired: true }); },
      onSnapshot: function (next, error) { return listen(function (p) { return p === path; }, ref.get, next, error); },
      collection: function (p) { return colRef(path + "/" + p); }
    };
    return ref;
  }
  function colRef(path, filters, lim) {
    filters = filters || []; lim = lim || 0;
    var q = {
      path: path,
      doc: function (id) { return docRef(path + "/" + (id || rid(14))); },
      where: function (f, op, v) { return colRef(path, filters.concat([[f, op, v]]), lim); },
      limit: function (n) { return colRef(path, filters, n); },
      orderBy: function () { return colRef(path, filters, lim); },
      get: function () {
        var qq = sb.from(T).select("path,data").eq("col", path);
        filters.forEach(function (f) { if (f[1] === "==") qq = qq.eq("data->>" + f[0], String(f[2])); });
        qq = qq.order("path"); if (lim) qq = qq.limit(lim);
        return qq.then(function (r) {
          if (r.error) throw dbErr(r.error);
          var docs = r.data.map(function (row) { return snapDoc(row.path, row); });
          return { docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } };
        });
      },
      onSnapshot: function (next, error) { return listen(function (p) { return parentCol(p) === path; }, q.get, next, error); },
      add: function (d) { var r = q.doc(); return r.set(d).then(function () { return r; }); }
    };
    return q;
  }

  window.CH_ASSET_URL = function (id) { return sb.storage.from(BUCKET).getPublicUrl(id).data.publicUrl; };
  var assets = {
    upload: function (blob, opts) {
      var id = rid(24) + ".jpg";
      return sb.storage.from(BUCKET).upload(id, blob, { contentType: (opts && opts.type) || blob.type || "image/jpeg", upsert: false }).then(function (r) {
        if (r.error) { var x = new Error(r.error.message); x.code = "upstream_error"; throw x; }
        return { id: id, url: window.CH_ASSET_URL(id), sizeBytes: blob.size, contentType: "image/jpeg" };
      });
    },
    delete: function (id) { return sb.storage.from(BUCKET).remove([id]).then(function () { return { deleted: true }; }); },
    list: function () { return Promise.resolve({ assets: [], usage: {} }); }
  };
  var downloads = {
    save: function (o) {
      var blob = o.data instanceof Blob ? o.data : new Blob([o.data]);
      var isImg = /\.(jpe?g|png)$/i.test(o.filename);
      if (isImg && navigator.canShare) {
        try {
          var file = new File([blob], o.filename, { type: "image/jpeg" });
          if (navigator.canShare({ files: [file] })) return navigator.share({ files: [file] }).then(function () { return { status: "saved" }; }).catch(function (e) { if (e && e.name === "AbortError") { var x = new Error("declined"); x.code = "declined"; throw x; } return anchor(blob, o.filename); });
        } catch (e) {}
      }
      return anchor(blob, o.filename);
    }
  };
  function anchor(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    return Promise.resolve({ status: "saved" });
  }
  var caps = {
    db: { doc: docRef, collection: function (p) { return colRef(p); } },
    user: { id: function () { return Promise.resolve(null); }, can: function () { return Promise.resolve(true); }, isOwner: function () { return false; } },
    assets: assets, downloads: downloads
  };
  window.claude = { use: function (n) { return Promise.resolve(caps[n] || null); } };
})();
