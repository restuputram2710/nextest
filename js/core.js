'use strict';
/* =====================================================================
   NEXTEST — core.js
   State, penyimpanan lokal, API (fetch ke Apps Script) dengan ulang otomatis,
   dedupe & batch, router hash, tema dinamis, utilitas format.
   ===================================================================== */
(function () {
  const NX = window.NX = window.NX || {};
  const CFG = window.APP_CONFIG || {};
  NX.VERSION = '1.0.0';

  // ------------------------------------------------------------ penyimpanan
  const LS = NX.LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } }
  };
  const SS = NX.SS = {
    get(k, d) { try { const v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* abaikan */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* abaikan */ } }
  };
  /** ID perangkat (dipakai server untuk aturan satu akun satu perangkat). */
  let dv = LS.get('nx_dv', '');
  if (!dv) { dv = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); LS.set('nx_dv', dv); }
  NX.DV = dv;

  // ------------------------------------------------------------ state
  const S = NX.S = { tok: SS.get('nx_tok', '') || LS.get('nx_tok_siswa', ''), me: null, boot: null, cfg: LS.get('nx_cfg', null), cache: {}, off: 0, cur: null, chrome: '' };

  // ------------------------------------------------------------ util
  const esc = NX.esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  NX.escA = (s) => esc(s).replace(/\\/g, '\\\\');
  NX.now = () => Date.now() + S.off;
  NX.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  NX.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  NX.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };
  NX.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  NX.byId = (arr, k, v) => (arr || []).find((x) => x[k] === v);
  NX.$ = (sel, root) => (root || document).querySelector(sel);
  NX.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const TZ = 'Asia/Jakarta';
  const fmtCache = {};
  function fmt(opts) { const k = JSON.stringify(opts); return fmtCache[k] || (fmtCache[k] = new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: TZ }, opts))); }
  NX.fmt = {
    tgl: (ms) => (ms ? fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(ms) : '-'),
    tglPanjang: (ms) => (ms ? fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(ms) : '-'),
    jam: (ms) => (ms ? fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(ms).replace(/\./g, ':') : '-'),
    tglJam: (ms) => (ms ? NX.fmt.tgl(ms) + ' · ' + NX.fmt.jam(ms) : '-'),
    hari: (ms) => fmt({ day: '2-digit' }).format(ms), bln: (ms) => fmt({ month: 'short' }).format(ms),
    num: (n, d) => (n === null || n === undefined || n === '' || isNaN(n) ? '-' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 2 : d, minimumFractionDigits: 0 })),
    dur: (detik) => { detik = Math.max(0, Math.round(detik || 0)); const h = Math.floor(detik / 3600), m = Math.floor((detik % 3600) / 60), s = detik % 60; return h ? h + ' j ' + m + ' mnt' : m ? m + ' mnt' + (s ? ' ' + s + ' dtk' : '') : s + ' dtk'; },
    hms: (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); },
    lalu: (ms) => { if (!ms) return '-'; const d = Math.round((NX.now() - ms) / 1000); if (d < 60) return d + ' dtk lalu'; if (d < 3600) return Math.round(d / 60) + ' mnt lalu'; if (d < 86400) return Math.round(d / 3600) + ' jam lalu'; return NX.fmt.tgl(ms); },
    /** nilai input datetime-local (WIB) ↔ ms */
    toLocalInput: (ms) => { if (!ms) return ''; const d = new Date(ms + 7 * 3600e3); return d.toISOString().slice(0, 16); },
    fromLocalInput: (s) => (s ? new Date(s + ':00+07:00').getTime() : 0)
  };
  NX.salam = () => { const h = Number(fmt({ hour: '2-digit', hour12: false }).format(Date.now())); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; };

  // ------------------------------------------------------------ aktivitas (polling adaptif)
  const Activity = NX.Activity = {
    at: Date.now(), last: {},
    init() { ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'].forEach((ev) => addEventListener(ev, () => { this.at = Date.now(); }, { passive: true })); },
    idle() { return Date.now() - this.at > 120000; },
    due(key, activeMs, idleMs) {
      if (document.visibilityState !== 'visible') return false;
      if (Date.now() - (this.last[key] || 0) < (this.idle() ? idleMs : activeMs) - 400) return false;
      this.last[key] = Date.now(); return true;
    }
  };
  Activity.init();

  // ------------------------------------------------------------ API
  const READ = /^(app\.|auth\.config|.*\.(list|ambil|detail|peserta|log|saya|daftar|status|foto|gsheet)$|dashboard\.|hasil\.|koreksi\.list|pelanggaran\.|batch)/;
  const Perf = NX.Perf = { rows: [], add(r) { this.rows.push(r); if (this.rows.length > 200) this.rows.shift(); }, table() { console.table(this.rows.slice(-40)); }, summary() { const g = {}; this.rows.forEach((r) => { const x = g[r.aksi] || (g[r.aksi] = { n: 0, total: 0, server: 0, cache: 0 }); x.n++; x.total += r.total; x.server += r.server || 0; if (r.cache) x.cache++; }); Object.keys(g).forEach((k) => { const x = g[k]; x.total = Math.round(x.total / x.n); x.server = Math.round(x.server / x.n); }); console.table(g); } };
  NX.configured = () => !!CFG.GAS_URL && !/GANTI|XXXX/.test(CFG.GAS_URL);
  const inflight = {};
  let writeEpoch = 0;

  /** Panggil API. Mengembalikan data; melempar Error({kode}) bila gagal. */
  NX.api = function (action, data, opts) {
    opts = opts || {};
    const isRead = READ.test(action) && !opts.write;
    if (!isRead) { writeEpoch++; return run(action, data, opts); }
    const k = writeEpoch + '|' + action + '|' + S.tok.slice(-12) + '|' + JSON.stringify(data || {});
    if (inflight[k]) return inflight[k];
    const p = run(action, data, opts);
    inflight[k] = p;
    p.then(() => delete inflight[k], () => delete inflight[k]);
    return p;
  };
  async function run(action, data, opts) {
    if (!NX.configured()) throw Object.assign(new Error('Alamat server (GAS_URL) di js/config.js belum diisi.'), { kode: 'KONFIG' });
    const maxTry = opts.retry === undefined ? 3 : opts.retry;
    let attempt = 0, lastErr;
    while (attempt <= maxTry) {
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), opts.timeout || 45000);
        const res = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: S.tok, data: data || {}, dv: NX.DV }), signal: ctrl.signal, redirect: 'follow' });
        clearTimeout(to);
        const txt = await res.text();
        let j;
        try { j = JSON.parse(txt); } catch (e) { throw Object.assign(new Error('Respons server tidak valid. Pastikan Web App sudah di-deploy dengan akses "Anyone".'), { kode: 'JARINGAN', retry: true }); }
        if (j.serverTime) S.off = j.serverTime - Date.now() - Math.round((performance.now() - t0) / 2);
        Perf.add({ aksi: action, total: Math.round(performance.now() - t0), server: j.ms, cache: !!j.cached, ok: j.ok });
        NX.lastLatency = Math.round(performance.now() - t0);
        if (j.ok) return j.data;
        const err = Object.assign(new Error(j.error && j.error.pesan || 'Terjadi kesalahan.'), { kode: j.error && j.error.kode || 'GAGAL' });
        if (err.kode === 'SIBUK') err.retry = true;
        throw err;
      } catch (e) {
        lastErr = e.kode ? e : Object.assign(new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.'), { kode: 'JARINGAN', retry: true });
        if (lastErr.kode === 'SESI' && !opts.noSesiRedirect) { NX.sesiHabis(lastErr.message); throw lastErr; }
        if (!lastErr.retry || attempt >= maxTry) throw lastErr;
        const wait = Math.min(16000, 2000 * Math.pow(2, attempt)) + Math.random() * 1500;
        attempt++;
        await NX.sleep(wait);
      }
    }
    throw lastErr;
  }
  /** Penggabung otomatis: beberapa panggilan baca dalam satu tik → 1 eksekusi 'batch'. */
  const Batcher = { q: null,
    add(action, data) { return new Promise((res, rej) => { if (!this.q) { this.q = []; setTimeout(() => this.flush(), 0); } this.q.push({ action, data: data || {}, res, rej }); }); },
    flush() {
      const q = this.q; this.q = null;
      if (q.length === 1) { NX.api(q[0].action, q[0].data).then(q[0].res, q[0].rej); return; }
      for (let i = 0; i < q.length; i += 10) {
        const part = q.slice(i, i + 10);
        NX.api('batch', { calls: part.map((c) => ({ action: c.action, data: c.data })) }).then((list) => {
          list.forEach((r, j) => { if (r.ok) part[j].res(r.data); else part[j].rej(Object.assign(new Error(r.error.pesan), { kode: r.error.kode })); });
        }, (e) => part.forEach((c) => c.rej(e)));
      }
    } };
  NX.apiQ = (action, data) => Batcher.add(action, data);

  /** Cache SWR per kunci. */
  NX.load = async function (key, action, data, ttl, viaBatch) {
    const c = S.cache[key];
    ttl = ttl === undefined ? 30000 : ttl;
    if (c && Date.now() - c.t < ttl) return c.d;
    if (c && c.d !== undefined && !c.p) {
      c.p = (viaBatch ? NX.apiQ : NX.api)(action, data).then((d) => { S.cache[key] = { t: Date.now(), d }; if (JSON.stringify(d) !== JSON.stringify(c.d)) NX.rerender(); }).catch(() => { c.p = null; });
      return c.d;
    }
    if (c && c.p && c.d === undefined) return c.p;
    const p = (viaBatch ? NX.apiQ : NX.api)(action, data).then((d) => { S.cache[key] = { t: Date.now(), d }; return d; });
    S.cache[key] = { t: 0, p };
    try { return await p; } catch (e) { delete S.cache[key]; throw e; }
  };
  NX.drop = (prefix) => Object.keys(S.cache).forEach((k) => { if (k.indexOf(prefix) === 0) delete S.cache[k]; });
  NX.warm = (scope) => {
    if (!NX.configured()) return;
    const k = 'nx_warm_' + scope;
    if (Date.now() - (SS.get(k, 0)) < 240000) return;
    SS.set(k, Date.now());
    try { fetch(CFG.GAS_URL + '?w=' + scope, { mode: 'no-cors' }).catch(() => {}); } catch (e) { /* abaikan */ }
  };

  // ------------------------------------------------------------ sesi
  NX.setSession = function (tok, me) {
    S.tok = tok; S.me = me;
    SS.set('nx_tok', tok);
    if (me.role === 'SISWA') LS.set('nx_tok_siswa', tok); else LS.del('nx_tok_siswa');
  };
  NX.logout = function (msg) {
    if (S.tok) NX.api('auth.logout', {}, { retry: 0, noSesiRedirect: true }).catch(() => {});
    S.tok = ''; S.me = null; S.boot = null; S.cache = {}; S.chrome = '';
    SS.del('nx_tok'); LS.del('nx_tok_siswa');
    if (msg) SS.set('nx_msg', msg);
    location.hash = '#/login';
    NX.render();
  };
  NX.sesiHabis = function (msg) { if (window.EX && EX.active) return; NX.logout(msg || 'Sesi berakhir. Silakan masuk kembali.'); };

  NX.boot = async function (force) {
    if (S.boot && !force) return S.boot;
    const b = await NX.api('app.boot', {});
    S.boot = b; S.me = b.me;
    if (b.cfg) NX.applyTheme(b.cfg);
    return b;
  };

  // ------------------------------------------------------------ tema
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgbToHex(r) { return '#' + r.map((x) => Math.round(NX.clamp(x, 0, 255)).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }
  NX.shade = mix;
  NX.lum = (hex) => { const c = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  NX.contrast = (a, b) => { const x = NX.lum(a), y = NX.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  NX.driveImg = (id, w) => (id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 1200) : '');
  NX.applyTheme = function (cfg) {
    if (!cfg) return;
    S.cfg = Object.assign({}, S.cfg || {}, cfg);
    LS.set('nx_cfg', S.cfg);
    const p = /^#[0-9a-f]{6}$/i.test(cfg.warna_primer || '') ? cfg.warna_primer : '#2251E0';
    const a = /^#[0-9a-f]{6}$/i.test(cfg.warna_aksen || '') ? cfg.warna_aksen : '#F97316';
    const r = document.documentElement.style;
    r.setProperty('--p', p); r.setProperty('--p-h', mix(p, '#000000', 0.12)); r.setProperty('--p-d', mix(p, '#000000', 0.32));
    r.setProperty('--p-100', mix(p, '#ffffff', 0.84)); r.setProperty('--p-50', mix(p, '#ffffff', 0.92)); r.setProperty('--p-rgb', hexToRgb(p).join(','));
    r.setProperty('--acc', a); r.setProperty('--acc-s', NX.contrast(mix(a, '#000000', 0.25), '#ffffff') >= 4.5 ? mix(a, '#000000', 0.25) : mix(a, '#000000', 0.45)); r.setProperty('--acc-50', mix(a, '#ffffff', 0.92));
    const nm = cfg.nama_aplikasi || 'NEXTEST';
    if (!(window.EX && EX.active)) document.title = nm + (cfg.tagline ? ' — ' + cfg.tagline : '');
    const fav = document.getElementById('favicon');
    if (fav && cfg.logo_kecil_id) fav.href = NX.driveImg(cfg.logo_kecil_id, 128);
    const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = p;
  };
  if (S.cfg) NX.applyTheme(S.cfg);
  NX.appName = () => (S.cfg && S.cfg.nama_aplikasi) || 'NEXTEST';
  NX.logoHtml = (size) => {
    const c = S.cfg || {};
    const id = size && size > 128 ? (c.logo_file_id || c.logo_kecil_id) : (c.logo_kecil_id || c.logo_file_id);
    return id ? '<img src="' + NX.driveImg(id, size || 128) + '" alt="" onerror="this.remove()">' : esc(NX.appName().charAt(0));
  };

  // ------------------------------------------------------------ router
  const ROUTES = [];
  NX.route = function (pattern, def) { const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '$'); ROUTES.push({ pattern, re, keys, def }); };
  NX.go = (path) => { if (location.hash === '#/' + path) NX.render(); else location.hash = '#/' + path; };
  NX.home = () => (S.me && S.me.role === 'ADMIN' ? 'a/dash' : 's/home');
  function match(path) {
    for (const r of ROUTES) { const m = r.re.exec(path); if (m) { const p = {}; r.keys.forEach((k, i) => { p[k] = decodeURIComponent(m[i + 1]); }); return { r, p }; } }
    return null;
  }
  let renderSeq = 0;
  NX.render = async function () {
    const seq = ++renderSeq;
    let path = (location.hash || '').replace(/^#\/?/, '');
    const qi = path.indexOf('?');
    const query = {};
    if (qi > -1) { path.slice(qi + 1).split('&').forEach((kv) => { const [k, v] = kv.split('='); if (k) query[k] = decodeURIComponent(v || ''); }); path = path.slice(0, qi); }
    if (window.EX && EX.active && path.indexOf('exam/') !== 0) { location.hash = '#/exam/' + EX.idUjian; return; }
    if (!NX.configured()) { NX.showConfigError(); return; }
    if (!path) path = S.tok ? '' : 'login';
    if (path !== 'login' && !S.tok) { location.hash = '#/login'; return; }
    if (S.tok && !S.me) {
      try { await NX.boot(); } catch (e) { if (e.kode !== 'SESI') { NX.fatal(e); } return; }
      if (seq !== renderSeq) return;
    }
    if (!path || (path === 'login' && S.me)) { location.hash = '#/' + NX.home(); return; }
    const m = match(path);
    if (!m) { location.hash = '#/' + (S.me ? NX.home() : 'login'); return; }
    const def = m.r.def;
    if (def.role && (!S.me || S.me.role !== def.role)) { location.hash = '#/' + (S.me ? NX.home() : 'login'); return; }
    const params = Object.assign({}, m.p, { q: query });
    S.cur = { path, pattern: m.r.pattern, params, def };
    document.body.classList.remove('nav-open');
    NX.closeMenus && NX.closeMenus();
    const root = document.getElementById('app');
    if (def.layout === 'bare') { S.chrome = ''; root.innerHTML = '<div id="page" class="bare"></div>'; }
    else if (S.chrome !== S.me.role) { root.innerHTML = NX.chrome(); S.chrome = S.me.role; }
    NX.updateChrome && def.layout !== 'bare' && NX.updateChrome(def, params);
    const page = document.getElementById('page');
    if (!S._rerender) { page.innerHTML = def.skeleton ? def.skeleton() : NX.skelPage(); window.scrollTo(0, 0); }
    const keepScroll = S._rerender ? window.scrollY : 0;
    try {
      const html = await def.render(params);
      if (seq !== renderSeq) return;
      page.className = def.layout === 'bare' ? 'bare' : 'page';
      if (S._rerender) page.style.animation = 'none'; else page.style.animation = '';
      page.innerHTML = html;
      if (def.mount) def.mount(params, page);
      NX.afterRender(page);
      if (S._rerender) window.scrollTo(0, keepScroll);
    } catch (e) {
      if (seq !== renderSeq) return;
      if (e.kode === 'SESI') return;
      page.innerHTML = NX.errorBox(e, true);
    } finally { S._rerender = false; }
  };
  /** Render ulang halaman saat ini tanpa skeleton (dipakai setelah data diperbarui). */
  NX.rerender = NX.debounce(function () { if (!S.cur) return; if (NX.$('.ov')) return; S._rerender = true; NX.render(); }, 60);
  window.addEventListener('hashchange', () => NX.render());

  NX.errorBox = function (e, retry) {
    return '<div class="card card-p empty"><div class="tile err lg">' + NX.ic('alert', 'lg') + '</div><h3>Gagal memuat</h3><p>' + esc(e && e.message || e) + '</p>' + (retry ? '<button class="btn btn-p mt16" onclick="NX.render()">' + NX.ic('refresh') + 'Coba lagi</button>' : '') + '</div>';
  };
  NX.fatal = function (e) { document.getElementById('app').innerHTML = '<div class="page" style="max-width:560px;margin:60px auto">' + NX.errorBox(e, true) + '</div>'; };
  NX.showConfigError = function () {
    document.getElementById('app').innerHTML = '<div class="page" style="max-width:640px;margin:60px auto"><div class="card card-p"><div class="tile warn lg mb16">' + NX.ic('settings', 'lg') + '</div><h2>Konfigurasi belum lengkap</h2><p class="tx2 mt8">Buka berkas <b>js/config.js</b> lalu isi <b>GAS_URL</b> dengan alamat <span class="mono">/exec</span> dari Web App Google Apps Script Anda, kemudian unggah ulang ke GitHub.</p></div></div>';
  };

  // ------------------------------------------------------------ init
  NX.start = function () {
    const msg = SS.get('nx_msg', '');
    if (msg) { SS.del('nx_msg'); setTimeout(() => NX.toast(msg, 'warn'), 300); }
    NX.render();
  };
})();
