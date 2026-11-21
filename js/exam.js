'use strict';
/* =====================================================================
   NEXTEST — exam.js : mesin ujian siswa + sistem anti-contek
   - Layar penuh wajib; deteksi pindah tab, keluar layar penuh, jendela lain,
     layar terbagi, tangkapan layar; blokir salin-tempel & pintasan.
   - Peristiwa beruntun dalam 3 dtk digabung jadi 1 pelanggaran.
   - Jawaban disimpan seketika di perangkat, sinkron berkala 120±30 dtk.
   - Server adalah penentu status (terkunci/dibuka/selesai).
   ===================================================================== */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt, LS = NX.LS;
  const EX = window.EX = { active: false, idUjian: '' };
  let X = null;
  const VMSG = {
    PINDAH_TAB: 'Anda terdeteksi meninggalkan halaman ujian (pindah tab atau aplikasi).',
    KELUAR_LAYAR_PENUH: 'Anda keluar dari mode layar penuh.',
    JENDELA_MENGAMBANG: 'Anda membuka jendela atau aplikasi lain (jendela mengambang, notifikasi, atau pencarian layar).',
    LAYAR_TERBAGI: 'Ujian dibuka dalam layar terbagi atau jendela kecil.',
    TANGKAP_LAYAR: 'Tangkapan layar terdeteksi.', LOGIN_GANDA: 'Akun dipakai di perangkat lain.',
    SALIN_TEMPEL: 'Salin, tempel, atau klik kanan diblokir.', PINTASAN: 'Pintasan keyboard diblokir.', MUAT_ULANG: 'Halaman ujian dimuat ulang.'
  };
  const VLABEL = { PINDAH_TAB: 'Pindah tab / aplikasi', KELUAR_LAYAR_PENUH: 'Keluar layar penuh', JENDELA_MENGAMBANG: 'Jendela lain / hilang fokus', LAYAR_TERBAGI: 'Layar terbagi', TANGKAP_LAYAR: 'Tangkapan layar', LOGIN_GANDA: 'Login ganda', SALIN_TEMPEL: 'Salin-tempel', PINTASAN: 'Pintasan keyboard', MUAT_ULANG: 'Muat ulang halaman' };
  EX.VLABEL = VLABEL;
  const TIPE_L = { PG: 'Pilihan ganda', MCMA: 'PG kompleks (pilih semua yang benar)', KATEGORI: 'PG kompleks (kategori)', ESAI: 'Esai' };
  EX.TIPE_L = TIPE_L;
  const HUR = ['A', 'B', 'C', 'D', 'E'];

  // ------------------------------------------------------------ layar penuh
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function reqFS() {
    const d = document.documentElement;
    try {
      if (fsEl()) return Promise.resolve();
      if (d.requestFullscreen) return d.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      if (d.webkitRequestFullscreen) { d.webkitRequestFullscreen(); return Promise.resolve(); }
    } catch (e) { /* abaikan */ }
    return Promise.resolve();
  }
  function exitFS() { try { if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* abaikan */ } }
  EX.reqFS = reqFS;

  // ------------------------------------------------------------ masuk (dari halaman konfirmasi)
  EX.masuk = async function (idUjian, token, btn, onErr) {
    await reqFS();
    NX.btnBusy(btn, true, 'Memuat soal…');
    try {
      const pl = await NX.api('exam.mulai', { id_ujian: idUjian, token: token || '' }, { retry: 4, timeout: 60000 });
      LS.set('nx_ex_dev_' + idUjian, true);
      init(pl);
      NX.go('exam/' + idUjian);
    } catch (e) {
      NX.btnBusy(btn, false);
      exitFS();
      if (e.kode === 'SUDAH_SELESAI') { NX.toast(e.message, 'ok'); NX.go('s/hasil'); return; }
      NX.toast(e.message, 'err');
      if (onErr) onErr(e);
    }
  };

  function keyLocal() { return 'nx_ex_' + X.sesi.id_sesi; }
  function init(pl) {
    const loc = LS.get('nx_ex_' + pl.sesi.id_sesi, null);
    const jaw = Object.assign({}, pl.jawaban || {}, loc && loc.jaw || {});
    X = {
      id: pl.ujian.id_ujian, u: pl.ujian, sesi: pl.sesi, soal: pl.soal, aturan: pl.aturan || { dihitung: [], interval: 120, tenggang: 5 },
      jaw: jaw, ragu: new Set((loc && loc.ragu) || pl.ragu || []), idx: loc && loc.idx < pl.soal.length ? loc.idx : 0,
      pending: (loc && loc.pending) || [], status: pl.sesi.status, batas: pl.sesi.batas, mulai: pl.sesi.mulai, limit: pl.sesi.limit,
      pel: pl.sesi.pelanggaran, lastSync: Date.now(), lat: NX.lastLatency || 0, offline: !navigator.onLine, lastViolAt: 0, tabCount: 0,
      fs: LS.get('nx_fs', 1), timers: [], submitting: false, done: false, initW: innerWidth, initH: innerHeight
    };
    X.pel += X.pending.filter((e) => X.aturan.dihitung.indexOf(e.j) > -1).length;
    LS.set('nx_ex_snap_' + X.id, pl);
    EX.active = true; EX.idUjian = X.id;
    const rl = LS.get('nx_ex_reload_' + X.sesi.id_sesi, 0);
    if (rl) { LS.del('nx_ex_reload_' + X.sesi.id_sesi); logEv('MUAT_ULANG', 'Dimuat ulang'); }
    save();
  }
  function save() { if (X) LS.set(keyLocal(), { jaw: X.jaw, ragu: Array.from(X.ragu), idx: X.idx, pending: X.pending, ts: Date.now() }); }

  // ------------------------------------------------------------ rute ujian
  NX.route('exam/:id', {
    role: 'SISWA', layout: 'bare',
    skeleton: () => '<div class="loader-full"><div class="tc"><div class="ring" style="margin:0 auto"></div><p class="mt16 b6">Memuat soal…</p><p class="small muted">Jangan tutup aplikasi.</p></div></div>',
    async render(p) {
      if (!X || X.id !== p.id || X.done) {
        X = null;
        try { init(await NX.api('exam.mulai', { id_ujian: p.id }, { retry: 2, timeout: 60000 })); }
        catch (e) {
          if (e.kode === 'SUDAH_SELESAI') { cleanupLocal(p.id); setTimeout(() => NX.go('s/hasil'), 50); return ''; }
          if (e.kode === 'TOKEN' || e.kode === 'LOGIN_GANDA' || e.kode === 'BELUM_DIBUKA' || e.kode === 'DITUTUP') { EX.active = false; NX.toast(e.message, 'warn'); setTimeout(() => NX.go('s/konfirmasi/' + p.id), 50); return ''; }
          const snap = LS.get('nx_ex_snap_' + p.id, null);
          if (snap && e.kode === 'JARINGAN') { init(snap); NX.toast('Mode luring: jawaban disimpan di perangkat sampai koneksi pulih.', 'warn'); }
          else { EX.active = false; throw e; }
        }
      }
      document.title = X.u.judul + ' · Ujian';
      return shell();
    },
    mount() { start(); }
  });

  function shell() {
    const me = S.me, c = S.cfg || {};
    return '<div class="ex" id="exam" style="--fs:' + X.fs + '">' +
      '<div class="offline-bar" id="exOff" ' + (X.offline ? '' : 'hidden') + '>' + ic('wifiOff', 'sm') + 'Sinyal terputus — jawaban aman tersimpan di perangkat dan akan dikirim saat tersambung</div>' +
      '<header class="ex-top">' +
        '<div class="flex ic g12 f1" style="min-width:0"><div class="brand" style="padding:0"><div class="logo" style="width:42px;height:42px">' + NX.logoHtml(128) + '</div></div><div class="hide-sm b8" style="font-family:var(--f-h);color:var(--p-d)">' + esc(c.nama_aplikasi || 'NEXTEST') + '</div><span class="hide-sm" style="width:1px;height:28px;background:var(--line)"></span><div style="min-width:0"><div class="b7 clamp1">' + esc(X.u.judul) + '</div><div class="xs muted clamp1">' + esc(X.u.mapel) + ' · ' + esc(NX.jenisPendek(X.u.jenis)) + '</div></div></div>' +
        '<div class="ex-timer" id="exTimer"><div class="t">' + ic('clock') + '<span id="exT">--:--:--</span></div><div class="meter"><i id="exTM" style="width:0"></i></div></div>' +
        '<div class="flex ic g8 f1 je wrap"><span class="pill pill-err" id="exViol">Pelanggaran 0/' + X.limit + '</span><span class="pill pill-p nodot hide-sm" id="exSync">' + ic('cloudCheck', 'sm') + '<span id="exSyncT">Tersimpan</span></span>' +
        '<div class="flex ic g8 hide-sm" style="margin-left:6px"><div class="tr"><div class="b6 small clamp1" style="max-width:160px">' + esc(me.nama) + '</div><div class="xs muted mono">NIS ' + esc(me.nis) + '</div></div>' + NX.avatar(me.nama, S.fotoSaya || '', 'sm') + '</div>' +
        '<button class="btn btn-s btn-sm ex-nav-btn" style="display:none" onclick="document.body.classList.add(\'qnav-open\')">' + ic('grid', 'sm') + 'Nomor Soal</button></div>' +
      '</header>' +
      '<main class="ex-body">' +
        '<section class="card card-p ex-q"><div class="wm" id="exWm"></div><div class="guard-msg"><div><div class="tile lg warn" style="margin:0 auto 12px">' + ic('eyeOff', 'lg') + '</div><h3>Soal disembunyikan</h3><p class="tx2 mt4">Kembali ke halaman ujian untuk melanjutkan.</p></div></div><div class="qbody" id="exQ"></div></section>' +
        '<aside class="card card-p ex-nav" id="exNav"></aside>' +
      '</main><div class="scrim" onclick="document.body.classList.remove(\'qnav-open\')"></div></div>';
  }

  // ------------------------------------------------------------ mulai mesin
  function start() {
    stopTimers();
    X.done = false;
    applyWatermark();
    paintQ(); paintNav(); paintViol(); tick();
    X.timers.push(setInterval(tick, 1000));
    X.timers.push(setInterval(paintSync, 10000));
    schedule(15000 + Math.random() * 15000);
    bind();
    if (X.status === 'TERKUNCI') showLocked();
    else if (!fsEl()) fsGate(false);
  }
  function stopTimers() { if (X && X.timers) X.timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); if (X) X.timers = []; clearTimeout(EX._sync); }

  function applyWatermark() {
    const t = (S.me.nama || '').slice(0, 34) + ' · ' + (S.me.nis || '') + ' · ' + F.tgl(Date.now());
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="230"><text x="10" y="135" transform="rotate(-24 220 115)" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#64748B" fill-opacity=".09">' + esc(t) + '</text></svg>';
    const w = document.getElementById('exWm'); if (w) w.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  // ------------------------------------------------------------ tampilan soal
  const sudah = (v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.some((x) => x !== null && x !== '' && x !== undefined));
  function paintQ() {
    const s = X.soal[X.idx], el = document.getElementById('exQ'); if (!s || !el) return;
    const a = X.jaw[s.id];
    let body = '';
    if (s.tipe === 'PG' || s.tipe === 'MCMA') {
      body = '<div class="opts" role="' + (s.tipe === 'PG' ? 'radiogroup' : 'group') + '">' + s.opsi.map((o, i) => {
        const on = s.tipe === 'PG' ? a === o.k : Array.isArray(a) && a.indexOf(o.k) > -1;
        return '<button class="opt ' + (s.tipe === 'MCMA' ? 'box ' : '') + (on ? 'on' : '') + '" data-k="' + o.k + '" role="' + (s.tipe === 'PG' ? 'radio' : 'checkbox') + '" aria-checked="' + on + '"><span class="lt">' + HUR[i] + '</span><span class="tx">' + NX.rich(o.t) + (o.img ? '<img src="' + NX.driveImg(o.img, 600) + '" alt="">' : '') + '</span><span class="ck">' + ic('check', 'sm') + '</span></button>';
      }).join('') + '</div>' + (s.tipe === 'MCMA' ? '<p class="small muted mt12">' + ic('info', 'sm') + ' Jawaban benar bisa lebih dari satu. Pilih semua yang benar.</p>' : '');
    } else if (s.tipe === 'KATEGORI') {
      const arr = Array.isArray(a) ? a : [];
      body = '<table class="kat-tbl"><thead><tr><th>Pernyataan</th>' + s.kategori.map((k) => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + s.pernyataan.map((p, i) => '<tr><td>' + NX.rich(p) + '</td>' + s.kategori.map((k, j) => '<td><input type="radio" name="kt' + i + '" id="kt' + i + '_' + j + '" data-row="' + i + '" value="' + esc(k) + '" ' + (arr[i] === k ? 'checked' : '') + '><label for="kt' + i + '_' + j + '">' + ic('check', 'sm') + '</label></td>').join('') + '</tr>').join('') + '</tbody></table>';
    } else {
      const v = typeof a === 'string' ? a : '';
      body = '<div class="field mt20"><label class="label" for="exEsai">Jawaban Anda</label><textarea class="textarea" id="exEsai" rows="9" maxlength="3000" style="font-size:calc(15px * var(--fs,1));user-select:text;-webkit-user-select:text" placeholder="Tulis jawaban Anda di sini…">' + esc(v) + '</textarea><div class="help flex jb"><span>Tersimpan otomatis di perangkat</span><span id="exEsaiN">' + v.length + '/3000</span></div></div>';
    }
    const fig = s.gambar ? '<div class="figure"><div class="flex jb ic mb8"><span class="small b6 flex ic g6">' + ic('image', 'sm') + 'Gambar soal</span><button class="btn btn-g btn-xs" onclick="NX.zoomImg(\'' + NX.driveImg(s.gambar, 1800) + '\')">' + ic('zoomIn', 'sm') + 'Perbesar</button></div><img src="' + NX.driveImg(s.gambar, 1200) + '" alt="Gambar soal" onclick="NX.zoomImg(this.src)"></div>' : '';
    const lamp = s.lampiran && s.lampiran.length ? '<button class="btn btn-s btn-sm mt16" onclick="EX.lampiran()">' + ic('clip', 'sm') + 'Lihat Lampiran (' + s.lampiran.length + ' halaman)</button>' : '';
    el.innerHTML = '<div class="flex jb ic g12 wrap"><div class="flex ic g12"><span class="qnum">' + (X.idx + 1) + '</span><div><div class="b7" style="font-family:var(--f-h)">Soal ' + (X.idx + 1) + ' dari ' + X.soal.length + '</div><div class="xs muted up b6">' + esc(TIPE_L[s.tipe]) + ' · bobot ' + F.num(s.bobot) + '</div></div></div>' +
      '<div class="seg"><button onclick="EX.font(-1)" aria-label="Perkecil teks">A−</button><button class="on" style="pointer-events:none" id="exFs">' + Math.round(X.fs * 100) + '%</button><button onclick="EX.font(1)" aria-label="Perbesar teks">A+</button></div></div>' +
      '<div class="divider"></div><div class="qtext">' + NX.rich(s.teks) + '</div>' + fig + lamp + body +
      '<div class="ex-foot"><button class="btn btn-s" onclick="EX.nav(-1)" ' + (X.idx === 0 ? 'disabled' : '') + '>' + ic('arrowL', 'sm') + '<span class="lbl-sm">Soal Sebelumnya</span></button>' +
      '<button class="btn btn-ragu ' + (X.ragu.has(s.id) ? 'on' : '') + '" onclick="EX.toggleRagu()">' + ic('flag', 'sm') + 'Ragu-ragu</button>' +
      (X.idx < X.soal.length - 1 ? '<button class="btn btn-p" onclick="EX.nav(1)"><span class="lbl-sm">Soal Berikutnya</span>' + ic('arrowR', 'sm') + '</button>' : '<button class="btn btn-pu" onclick="EX.selesai()">' + ic('checkCircle', 'sm') + 'Selesai</button>') + '</div>';
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'fadeIn .15s ease';
    el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => pilih(b.dataset.k)));
    el.querySelectorAll('.kat-tbl input').forEach((r) => r.addEventListener('change', () => { const arr = Array.isArray(X.jaw[s.id]) ? X.jaw[s.id].slice() : s.pernyataan.map(() => ''); arr[+r.dataset.row] = r.value; X.jaw[s.id] = arr; changed(); }));
    const t = el.querySelector('#exEsai');
    if (t) t.addEventListener('input', () => { X.jaw[s.id] = t.value; document.getElementById('exEsaiN').textContent = t.value.length + '/3000'; changedSoft(); });
  }
  function pilih(k) {
    const s = X.soal[X.idx];
    if (X.status !== 'MENGERJAKAN') return;
    if (s.tipe === 'PG') X.jaw[s.id] = X.jaw[s.id] === k ? '' : k;
    else { const arr = Array.isArray(X.jaw[s.id]) ? X.jaw[s.id].slice() : []; const i = arr.indexOf(k); if (i > -1) arr.splice(i, 1); else arr.push(k); X.jaw[s.id] = arr.sort(); }
    document.querySelectorAll('#exQ .opt').forEach((b) => { const on = s.tipe === 'PG' ? X.jaw[s.id] === b.dataset.k : X.jaw[s.id].indexOf(b.dataset.k) > -1; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    changed();
  }
  function changed() { X.dirty = true; save(); paintNav(); paintSync(); }
  const changedSoft = NX.debounce(changed, 400);

  function paintNav() {
    const el = document.getElementById('exNav'); if (!el) return;
    let a = 0, r = 0;
    X.soal.forEach((s) => { if (X.ragu.has(s.id)) r++; else if (sudah(X.jaw[s.id])) a++; });
    const b = X.soal.length - a - r;
    const tol = X.u.toleransi || 0, rem = X.batas - NX.now(), finOk = !tol || rem <= tol * 60000;
    el.innerHTML = '<div class="flex jb ic"><h3 class="flex ic g8">' + ic('grid', 'ink-p') + 'Navigasi Soal</h3>' + NX.pill(X.soal.length + ' butir', 'p', 'nodot') + '</div>' +
      '<div class="flex g12 mt12 small wrap" style="padding:10px 12px;border-radius:10px;background:var(--muted-bg)"><span class="flex ic g6"><i style="width:10px;height:10px;border-radius:3px;background:var(--p-d);display:inline-block"></i>' + a + ' Dijawab</span><span class="flex ic g6"><i style="width:10px;height:10px;border-radius:3px;background:var(--acc);display:inline-block"></i>' + r + ' Ragu</span><span class="flex ic g6"><i style="width:10px;height:10px;border-radius:3px;background:#CBD5E1;display:inline-block"></i>' + b + ' Belum</span></div>' +
      '<div class="qgrid mt16">' + X.soal.map((s, i) => '<button class="qn ' + (i === X.idx ? 'cur' : X.ragu.has(s.id) ? 'rg' : sudah(X.jaw[s.id]) ? 'ans' : '') + '" data-i="' + i + '" aria-label="Soal ' + (i + 1) + '">' + (i + 1) + '</button>').join('') + '</div>' +
      '<button class="btn btn-pu btn-lg btn-block mt20" onclick="EX.selesai()" ' + (finOk ? '' : 'disabled') + '>' + ic('checkCircle') + 'Kumpulkan Ujian</button>' +
      '<p class="xs muted tc mt8">' + (finOk ? 'Pastikan semua butir telah terjawab sebelum mengumpulkan.' : 'Tombol aktif ' + tol + ' menit sebelum waktu habis.') + '</p>' +
      '<div class="card card-ps mt16" style="background:var(--muted-bg);box-shadow:none"><div class="flex jb ic small"><b>Integritas Peramban</b><span class="pill ' + (fsEl() ? 'pill-p' : 'pill-warn') + '">' + (fsEl() ? 'Layar penuh' : 'Tidak penuh') + '</span></div><div class="grid gc2 keep2 mt8 xs" style="gap:6px"><div class="muted">Perpindahan tab</div><div class="tr b6">' + X.tabCount + ' kali</div><div class="muted">Koneksi</div><div class="tr b6">' + (X.offline ? '<span class="ink-warn">Terputus</span>' : (X.lat || '-') + ' ms') + '</div></div></div>';
    el.querySelectorAll('.qn').forEach((q) => q.addEventListener('click', () => { EX.go(+q.dataset.i); document.body.classList.remove('qnav-open'); }));
  }
  function paintViol() {
    const el = document.getElementById('exViol'); if (!el) return;
    el.textContent = 'Pelanggaran ' + X.pel + '/' + X.limit;
    el.className = 'pill ' + (X.pel === 0 ? 'pill-p' : X.pel >= X.limit - 1 ? 'pill-err' : 'pill-warn');
  }
  function paintSync() {
    const t = document.getElementById('exSyncT'), el = document.getElementById('exSync'); if (!t) return;
    if (X.offline) { t.textContent = 'Luring · tersimpan di perangkat'; el.className = 'pill pill-warn nodot hide-sm'; }
    else if (X.syncing) { t.textContent = 'Menyinkronkan…'; el.className = 'pill pill-p nodot hide-sm'; }
    else { t.textContent = (X.dirty ? 'Tersimpan di perangkat' : 'Tersinkron') + ' · ' + F.lalu(X.lastSync + S.off); el.className = 'pill pill-p nodot hide-sm'; }
    const off = document.getElementById('exOff'); if (off) off.hidden = !X.offline;
  }
  function tick() {
    if (!X || X.done) return;
    const rem = X.batas - NX.now(), total = Math.max(1, X.batas - X.mulai);
    const t = document.getElementById('exT'); if (t) t.textContent = F.hms(rem);
    const m = document.getElementById('exTM'); if (m) m.style.width = Math.min(100, Math.max(0, (1 - rem / total) * 100)) + '%';
    const box = document.getElementById('exTimer'); if (box) box.classList.toggle('low', rem <= 5 * 60000);
    if (X.u.toleransi && Math.abs(rem - X.u.toleransi * 60000) < 1000) paintNav();
    if (rem <= 0 && X.status === 'MENGERJAKAN' && !X.submitting) waktuHabis();
  }

  // ------------------------------------------------------------ aksi siswa
  EX.go = (i) => { if (i < 0 || i >= X.soal.length) return; X.idx = i; save(); paintQ(); paintNav(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  EX.nav = (d) => EX.go(X.idx + d);
  EX.toggleRagu = () => { const id = X.soal[X.idx].id; if (X.ragu.has(id)) X.ragu.delete(id); else X.ragu.add(id); changed(); paintQ(); };
  EX.font = (d) => { X.fs = Math.round(NX.clamp(X.fs + d * 0.1, 0.8, 1.5) * 10) / 10; LS.set('nx_fs', X.fs); document.getElementById('exam').style.setProperty('--fs', X.fs); const f = document.getElementById('exFs'); if (f) f.textContent = Math.round(X.fs * 100) + '%'; };
  EX.lampiran = () => { const s = X.soal[X.idx]; NX.modal({ title: 'Lampiran soal', icon: 'clip', size: 'xl', body: '<div class="col g16">' + s.lampiran.map((id, i) => '<div class="tc"><div class="xs muted mb8">Halaman ' + (i + 1) + '</div><img src="' + NX.driveImg(id, 1600) + '" style="border-radius:10px;border:1px solid var(--line);max-width:100%"></div>').join('') + '</div>' }); };

  EX.selesai = function () {
    if (X.status !== 'MENGERJAKAN') return;
    const tol = X.u.toleransi || 0, rem = X.batas - NX.now();
    if (tol && rem > tol * 60000) { NX.toast('Tombol Selesai aktif ' + tol + ' menit sebelum waktu habis.', 'warn'); return; }
    let a = 0, r = 0;
    X.soal.forEach((s) => { if (X.ragu.has(s.id)) r++; if (sudah(X.jaw[s.id])) a++; });
    const k = X.soal.length - a;
    const m = NX.modal({ title: 'Selesaikan Ujian?', icon: 'checkCircle', iconCls: 'pu', size: 'narrow',
      body: '<p class="tx2">Setelah dikumpulkan, jawaban tidak dapat diubah lagi.</p><div class="grid gc3 keep3 mt16" style="gap:10px">' + [['Dijawab', a, 'ok'], ['Ragu-ragu', r, 'acc'], ['Belum', k, 'err']].map((x) => '<div class="card card-ps tc"><div class="num b8 ink-' + x[2] + '" style="font-size:24px">' + x[1] + '</div><div class="xs muted">' + x[0] + '</div></div>').join('') + '</div>' + (k ? '<div class="banner warn mt16">' + ic('alert', 'sm') + '<div class="small">Masih ada <b>' + k + ' soal</b> yang belum dijawab.</div></div>' : ''),
      foot: '<button class="btn btn-s" data-x>Periksa Lagi</button><button class="btn btn-p" id="okKumpul">' + ic('send', 'sm') + 'Ya, Kumpulkan</button>' });
    m.$('#okKumpul').onclick = () => { m.close(true); kumpul('MANUAL'); };
  };

  // ------------------------------------------------------------ anti-contek
  let bound = false;
  function bind() {
    if (bound) return; bound = true;
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('fullscreenchange', onFS);
    document.addEventListener('webkitfullscreenchange', onFS);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    ['copy', 'cut', 'paste', 'contextmenu', 'dragstart'].forEach((ev) => document.addEventListener(ev, onBlock, true));
    document.addEventListener('selectstart', onSelect, true);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', save);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  }
  function unbind() {
    if (!bound) return; bound = false;
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('fullscreenchange', onFS);
    document.removeEventListener('webkitfullscreenchange', onFS);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    ['copy', 'cut', 'paste', 'contextmenu', 'dragstart'].forEach((ev) => document.removeEventListener(ev, onBlock, true));
    document.removeEventListener('selectstart', onSelect, true);
    window.removeEventListener('beforeunload', onUnload);
    window.removeEventListener('pagehide', save);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  }
  const aktif = () => X && EX.active && !X.done && X.status === 'MENGERJAKAN' && !X.submitting;
  function guard(on) { const e = document.getElementById('exam'); if (e) e.classList.toggle('ex-guard', !!on); }
  function onVis() {
    if (!aktif()) return;
    if (document.hidden) { X.hiddenAt = Date.now(); X.tabCount++; guard(true); violation('PINDAH_TAB', 'Meninggalkan halaman ujian'); }
    else { guard(false); if (X.hiddenAt) { const d = Math.round((Date.now() - X.hiddenAt) / 1000); const ev = X.pending[X.pending.length - 1]; if (ev && ev.j === 'PINDAH_TAB' && !ev.k2) { ev.k = 'Meninggalkan halaman ' + d + ' dtk'; ev.k2 = 1; save(); } X.hiddenAt = 0; } paintNav(); }
  }
  function onFS() {
    if (!X || !EX.active || X.done) return;
    paintNav();
    if (fsEl()) { const g = document.getElementById('fsGate'); if (g) g.remove(); return; }
    if (!aktif()) return;
    violation('KELUAR_LAYAR_PENUH', 'Keluar dari layar penuh');
    fsGate(true);
  }
  function onBlur() {
    if (!aktif()) return;
    clearTimeout(X.blurT);
    X.blurT = setTimeout(() => {
      if (!aktif() || document.hidden || document.hasFocus()) return;
      guard(true);
      violation('JENDELA_MENGAMBANG', 'Fokus berpindah ke jendela/aplikasi lain');
    }, 2000);
  }
  function onFocus() { if (!X) return; clearTimeout(X.blurT); if (!document.hidden) guard(false); }
  const touch = () => matchMedia('(pointer:coarse)').matches;
  const onResize = NX.debounce(function () {
    if (!aktif()) return;
    const typing = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
    let kecil;
    if (touch()) kecil = !typing && Math.max(innerWidth, innerHeight) < 0.6 * Math.max(screen.width, screen.height);
    else kecil = innerWidth < 0.7 * X.initW || innerHeight < 0.6 * X.initH;
    if (kecil) violation('LAYAR_TERBAGI', 'Jendela ' + innerWidth + '×' + innerHeight);
    if (!touch() && fsEl()) { X.initW = Math.max(X.initW, innerWidth); X.initH = Math.max(X.initH, innerHeight); }
  }, 1200);
  function onKey(e) {
    if (!X || !EX.active || X.done) return;
    const k = e.key, ctrl = e.ctrlKey || e.metaKey;
    if (k === 'PrintScreen' || (e.metaKey && e.shiftKey && /^[345s]$/i.test(k))) { e.preventDefault(); copyKosong(); if (aktif()) violation('TANGKAP_LAYAR', 'Tombol tangkapan layar'); return; }
    const devtools = k === 'F12' || (ctrl && e.shiftKey && /^[ijck]$/i.test(k)) || (ctrl && /^[ups]$/i.test(k));
    if (devtools) { e.preventDefault(); e.stopPropagation(); logEv('PINTASAN', 'Tombol ' + (ctrl ? 'Ctrl+' : '') + (e.shiftKey ? 'Shift+' : '') + k); return; }
    if (ctrl && /^[cvxa]$/i.test(k) && !(document.activeElement && document.activeElement.id === 'exEsai' && /^[a]$/i.test(k))) { e.preventDefault(); logEv('SALIN_TEMPEL', 'Ctrl+' + k.toUpperCase()); return; }
    if (k === 'F5' || (ctrl && /^r$/i.test(k))) { e.preventDefault(); return; }
    if (document.querySelector('.ov,#fsGate,.lock-screen')) return;
    const inText = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
    if (inText || !aktif()) return;
    const s = X.soal[X.idx];
    if (k === 'ArrowRight') { e.preventDefault(); EX.nav(1); }
    else if (k === 'ArrowLeft') { e.preventDefault(); EX.nav(-1); }
    else if (/^[a-e]$/i.test(k) && s && s.opsi) { const i = HUR.indexOf(k.toUpperCase()); if (s.opsi[i]) pilih(s.opsi[i].k); }
  }
  function onKeyUp(e) { if (e.key === 'PrintScreen' && X && EX.active) { copyKosong(); if (aktif()) violation('TANGKAP_LAYAR', 'Tombol tangkapan layar'); } }
  function copyKosong() { try { navigator.clipboard && navigator.clipboard.writeText(''); } catch (e) { /* abaikan */ } }
  let lastBlock = 0;
  function onBlock(e) {
    if (!X || !EX.active || X.done) return;
    const inEsai = e.target && e.target.id === 'exEsai';
    if (e.type === 'contextmenu' || e.type === 'dragstart' || !inEsai || e.type === 'paste' || e.type === 'copy' || e.type === 'cut') {
      e.preventDefault();
      if (Date.now() - lastBlock > 3000) { lastBlock = Date.now(); logEv('SALIN_TEMPEL', e.type === 'contextmenu' ? 'Klik kanan' : e.type); NX.toast('Tindakan ini diblokir selama ujian.', 'warn', 2000); }
    }
  }
  function onSelect(e) { if (X && EX.active && !(e.target && e.target.closest && e.target.closest('textarea,input'))) e.preventDefault(); }
  function onUnload(e) { if (!X || !EX.active || X.done) return; save(); LS.set('nx_ex_reload_' + X.sesi.id_sesi, Date.now()); e.preventDefault(); e.returnValue = ''; return ''; }
  function onOnline() { if (!X) return; X.offline = false; paintSync(); paintNav(); syncNow(); }
  function onOffline() { if (!X) return; X.offline = true; paintSync(); paintNav(); }

  /** Catat kejadian yang tidak dihitung (blokir salin, pintasan, muat ulang). */
  function logEv(j, k) {
    if (!X) return;
    X.pending.push({ id: NX.uid(), j, t: NX.now(), k: k || '' });
    if (X.pending.length > 60) X.pending = X.pending.slice(-60);
    save();
    if (X.aturan.dihitung.indexOf(j) > -1) { X.pel++; paintViol(); afterCount(j); }
  }
  /** Pelanggaran utama — digabung bila beruntun ≤ 3 dtk. */
  function violation(j, k) {
    if (!aktif()) return;
    const now = Date.now();
    if (now - X.lastViolAt < 3000) { X.lastViolAt = now; return; }
    X.lastViolAt = now;
    const ev = { id: NX.uid(), j, t: NX.now(), k: k || '' };
    X.pending.push(ev); save();
    alarm();
    if (navigator.vibrate) try { navigator.vibrate([180, 80, 180]); } catch (e) { /* abaikan */ }
    if (X.aturan.dihitung.indexOf(j) > -1) { X.pel++; paintViol(); afterCount(j, ev); }
    syncNow();
  }
  function afterCount(j, ev) {
    if (X.pel >= X.limit && X.aturan.aksi === 'KUMPUL') { kumpulPelanggaran(); return; }
    if (X.pel >= X.limit) { X.status = 'TERKUNCI'; closeOverlays(); showLocked(); syncNow(); }
    else warnModal(j, ev || X.pending[X.pending.length - 1]);
  }
  function closeOverlays() { document.querySelectorAll('.ov').forEach((o) => o.remove()); }
  let audioCtx = null;
  function alarm() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22].forEach((d) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'square'; o.frequency.value = d ? 660 : 880; g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + 0.18); });
    } catch (e) { /* abaikan */ }
  }
  function warnModal(j, ev) {
    closeOverlays();
    const last = X.pel >= X.limit - 1, n = X.pel;
    const m = NX.modal({ title: false, dismiss: false, size: 'narrow',
      body: '<div class="viol-modal" style="margin:-20px -24px 0"><div class="vbar"><i style="width:' + Math.round(n / X.limit * 100) + '%;' + (last ? 'background:var(--err)' : '') + '"></i></div></div><div class="tc mt20"><div class="tile lg ' + (last ? 'err' : 'acc') + '" style="margin:0 auto;border-radius:50%;width:72px;height:72px">' + ic(last ? 'shieldAlert' : 'alert', 'xl') + '</div>' +
        '<span class="pill ' + (last ? 'pill-err' : 'pill-acc') + ' up mt16" style="letter-spacing:.06em">Pelanggaran ' + n + ' dari ' + X.limit + ' toleransi</span><h2 class="mt12">' + (last ? 'Peringatan Terakhir!' : 'Pelanggaran Terdeteksi!') + '</h2><p class="tx2 mt8">' + esc(VMSG[j] || VMSG.PINDAH_TAB) + '</p></div>' +
        '<div class="card card-ps mt16" style="background:var(--muted-bg);box-shadow:none"><div class="flex jb small"><span>Status akumulasi</span><b class="' + (last ? 'ink-err' : 'ink-acc') + '">' + n + ' / ' + X.limit + ' pelanggaran</b></div><div class="vseg mt8 ' + (last ? 'red' : '') + '" style="grid-template-columns:repeat(' + X.limit + ',1fr)">' + Array.from({ length: X.limit }).map((_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="card card-ps mt12 flex g12" style="box-shadow:none"><span class="tile sm acc">' + ic('monitor', 'sm') + '</span><div class="small"><b>' + esc(VLABEL[j] || j) + '</b><br><span class="muted">Waktu: ' + F.jam(ev ? ev.t : NX.now()) + ' WIB</span></div></div>' +
        '<div class="banner ' + (last ? 'err' : 'acc') + ' mt12">' + ic('info', 'sm') + '<div class="small">Jika mencapai <b>' + X.limit + ' kali pelanggaran</b>, ' + (X.aturan.aksi === 'KUMPUL' ? 'jawaban Anda akan <b>DIKUMPULKAN OTOMATIS</b> dan ujian berakhir.' : 'sesi ujian Anda akan otomatis <b>TERKUNCI</b> dan hanya dapat dibuka oleh pengawas ruang.') + '</div></div>',
      foot: '<button class="btn btn-p btn-lg btn-block" id="vOk">Saya Mengerti & Lanjutkan Ujian ' + ic('arrowR', 'sm') + '</button>' });
    m.$('#vOk').onclick = () => { reqFS(); guard(false); m.close(true); };
  }
  function fsGate(dihitung) {
    if (document.getElementById('fsGate') || !X || X.done) return;
    const g = document.createElement('div');
    g.className = 'fs-gate'; g.id = 'fsGate';
    g.innerHTML = '<div class="card card-p tc" style="max-width:420px;animation:scaleIn .25s var(--ease)"><div class="tile lg" style="margin:0 auto">' + ic('maximize', 'lg') + '</div><h2 class="mt16">' + (dihitung ? 'Anda keluar dari layar penuh' : 'Masuk ke layar penuh') + '</h2><p class="tx2 mt8">' + (dihitung ? 'Soal disembunyikan sampai Anda kembali ke mode layar penuh.' : 'Ujian hanya dapat dikerjakan dalam mode layar penuh.') + '</p><button class="btn btn-p btn-lg btn-block mt20">' + ic('maximize') + 'Kembali ke Layar Penuh</button>' + (!(document.fullscreenEnabled || document.webkitFullscreenEnabled) ? '<p class="xs muted mt12">Perangkat tidak mendukung layar penuh — lanjutkan dengan hati-hati.</p><button class="btn btn-g btn-sm mt8" id="fsSkip">Lanjut tanpa layar penuh</button>' : '') + '</div>';
    document.body.appendChild(g);
    g.querySelector('.btn-p').onclick = () => { reqFS().then(() => setTimeout(() => { if (fsEl()) g.remove(); }, 300)); };
    const sk = g.querySelector('#fsSkip'); if (sk) sk.onclick = () => g.remove();
  }

  // ------------------------------------------------------------ sinkron
  function schedule(ms) {
    clearTimeout(EX._sync);
    const base = (X.aturan.interval || 120) * 1000;
    EX._sync = setTimeout(() => { syncNow().finally(() => { if (X && !X.done) schedule(base * (0.75 + Math.random() * 0.5)); }); }, ms === undefined ? base : ms);
  }
  async function syncNow() {
    if (!X || X.done || X.submitting) return;
    if (X.syncing) { X.again = true; return; }
    X.syncing = true; paintSync();
    const sent = X.pending.slice();
    try {
      const r = await NX.api('exam.sinkron', { id_sesi: X.sesi.id_sesi, jawaban: X.jaw, ragu: Array.from(X.ragu), viol: sent.map((e) => ({ id: e.id, j: e.j, t: e.t, k: e.k })) }, { retry: 1, timeout: 30000 });
      const ids = {}; sent.forEach((e) => { ids[e.id] = 1; });
      X.pending = X.pending.filter((e) => !ids[e.id]);
      X.lastSync = Date.now(); X.lat = NX.lastLatency; X.offline = false; X.dirty = false;
      applyServer(r);
      save();
    } catch (e) {
      if (e.kode === 'LOGIN_GANDA' || e.kode === 'SESI') { berhenti(e.kode === 'SESI' ? 'Sesi Anda diakhiri (reset login oleh pengawas). Jawaban tersimpan di perangkat ini. Masuk kembali untuk melanjutkan.' : e.message); return; }
      if (e.kode === 'JARINGAN') { X.offline = true; schedule(20000); }
    } finally {
      if (X) { X.syncing = false; paintSync(); paintNav(); if (X.again) { X.again = false; setTimeout(syncNow, 500); } }
    }
  }
  function applyServer(r) {
    if (!r || !X) return;
    if (r.batas) X.batas = r.batas;
    const pendingCounted = X.pending.filter((e) => X.aturan.dihitung.indexOf(e.j) > -1).length;
    if (r.status === 'SELESAI') { selesaiDariServer(); return; }
    if (r.status === 'TERKUNCI') { X.pel = Math.max(r.pelanggaran, X.limit); if (X.status !== 'TERKUNCI') { X.status = 'TERKUNCI'; closeOverlays(); showLocked(); } }
    else if (r.status === 'MENGERJAKAN') {
      if (X.status === 'TERKUNCI') unlocked(r);
      else X.pel = r.pelanggaran + pendingCounted;
    }
    paintViol();
  }

  /** Batas tercapai pada ujian bertindakan KUMPUL: jawaban dikirim & dinilai. */
  function kumpulPelanggaran() {
    if (X.submitting) return;
    X.status = 'WAKTU'; closeOverlays(); guard(true);
    const m = NX.modal({ title: false, dismiss: false, size: 'narrow', body: '<div class="tc"><div class="tile lg err" style="margin:0 auto;border-radius:50%;width:72px;height:72px">' + ic('shieldAlert', 'xl') + '</div><h2 class="mt16">Batas Pelanggaran Tercapai</h2><p class="tx2 mt8">Sesuai aturan ujian ini, jawaban Anda <b>dikumpulkan otomatis</b> dan dinilai apa adanya.</p></div>' });
    X.timers.push(setTimeout(() => { m.close(true); kumpul('PELANGGARAN'); }, 2500));
  }

  // ------------------------------------------------------------ terkunci
  function showLocked() {
    if (document.querySelector('.lock-screen')) return;
    guard(true);
    const L = document.createElement('div');
    L.className = 'lock-screen';
    L.innerHTML = '<div class="lock-box"><div class="lock-ic">' + ic('lock', 'xl') + '</div><h1>Ujian Dikunci</h1><p class="lock-sub">Batas pelanggaran tercapai. Jawaban terakhir Anda sudah dikirim otomatis.</p>' +
      '<div class="lock-card"><div class="flex ic g12"><span class="tile sm" style="background:rgba(255,255,255,.1);color:#fff">' + ic('shield', 'sm') + '</span><div class="f1 tl"><b>Hubungi pengawas ruang</b><div class="xs" style="color:#CBD5E1">Pengawas/admin membuka kunci dari menu <b>Monitoring Langsung</b>. Halaman ini akan terbuka sendiri — tidak perlu memuat ulang.</div></div></div>' +
      '<div class="lock-wait mt16"><span class="lock-spin"></span><span id="lockMsg">Menunggu dibuka pengawas…</span></div></div>' +
      '<div class="lock-meta"><span>' + esc(S.me.nama) + '</span><span>·</span><span>NIS ' + esc(S.me.nis || S.me.nisn || '') + '</span></div>' +
      '<p class="xs mt12 flex jc ic g6" style="color:#86EFAC">' + ic('cloudCheck', 'sm') + 'Jawaban Anda sudah tersimpan</p></div>';
    document.body.appendChild(L);
    clearInterval(X.lockPoll);
    X.lockPoll = setInterval(async () => {
      if (!X || X.status !== 'TERKUNCI') { clearInterval(X && X.lockPoll); return; }
      const msg = document.getElementById('lockMsg');
      try {
        if (X.pending.length) await syncNow();
        const r = await NX.api('exam.status', { id_sesi: X.sesi.id_sesi }, { retry: 0 });
        if (r.status === 'MENGERJAKAN') unlocked(r);
        else if (r.status === 'SELESAI') selesaiDariServer();
        else if (msg) msg.textContent = 'Menunggu dibuka pengawas… (diperiksa ' + F.jam(NX.now()) + ')';
      } catch (e) {
        if (e.kode === 'SESI' || e.kode === 'LOGIN_GANDA') berhenti(e.message);
        else if (msg) msg.textContent = 'Koneksi terputus — mencoba lagi…';
      }
    }, 10000);
    X.timers.push(X.lockPoll);
  }
  function unlocked(r) {
    clearInterval(X.lockPoll);
    X.status = 'MENGERJAKAN'; X.pel = r.pelanggaran || 0; if (r.batas) X.batas = r.batas;
    const L = document.querySelector('.lock-screen'); if (L) L.remove();
    guard(false); paintViol(); paintNav();
    NX.toast('Kunci dibuka pengawas. Silakan lanjutkan ujian.' + (r.extra ? '' : ''), 'ok');
    if (!fsEl()) fsGate(false);
  }

  // ------------------------------------------------------------ waktu habis & kumpul
  function waktuHabis() {
    X.status = 'WAKTU';
    closeOverlays();
    const delay = Math.round(Math.random() * 90);
    const m = NX.modal({ title: false, dismiss: false, size: 'narrow', body: '<div class="tc"><div class="tile lg err" style="margin:0 auto;border-radius:50%">' + ic('hourglass', 'lg') + '</div><h2 class="mt16">Waktu Habis</h2><p class="tx2 mt8">Jawaban dikunci dan sedang dikirim otomatis. Jangan tutup halaman ini.</p><div class="num b8 mt16" style="font-size:28px" id="whCd">' + delay + '</div><div class="xs muted">detik menuju pengiriman (antre agar server tidak penuh)</div></div>' });
    let left = delay;
    const t = setInterval(() => { left--; const c = m.$('#whCd'); if (c) c.textContent = Math.max(0, left); if (left <= 0) { clearInterval(t); m.close(true); kumpul('WAKTU'); } }, 1000);
    X.timers.push(t);
    syncNow();
  }
  async function kumpul(alasan) {
    if (!X || X.submitting) return;
    X.submitting = true;
    closeOverlays();
    const m = NX.modal({ title: false, dismiss: false, size: 'narrow', body: '<div class="tc"><div class="ring" style="margin:0 auto"><div class="loader-full" style="position:static;background:none"><div class="ring" style="width:56px;height:56px;border-radius:50%;border:5px solid var(--p-100);border-top-color:var(--p);animation:spin .8s linear infinite"></div></div></div><h3 class="mt16">Mengirim jawaban…</h3><p class="small muted mt4" id="kmMsg">Mohon tunggu, jangan tutup halaman.</p><button class="btn btn-p mt16" id="kmRetry" hidden>' + ic('refresh', 'sm') + 'Coba kirim lagi</button></div>' });
    const kirim = async () => {
      try {
        const r = await NX.api('exam.kumpul', { id_sesi: X.sesi.id_sesi, jawaban: X.jaw, ragu: Array.from(X.ragu), viol: X.pending.map((e) => ({ id: e.id, j: e.j, t: e.t, k: e.k })), alasan }, { retry: 6, timeout: 60000 });
        m.close(true);
        tamat(r);
      } catch (e) {
        if (e.kode === 'SUDAH_SELESAI') { m.close(true); tamat({ status: 'SELESAI', tampilkan_nilai: false }); return; }
        if (e.kode === 'TERKUNCI') { m.close(true); X.submitting = false; X.status = 'TERKUNCI'; showLocked(); return; }
        if (e.kode === 'BELUM_BOLEH') { m.close(true); X.submitting = false; X.status = 'MENGERJAKAN'; NX.toast(e.message, 'warn'); return; }
        const msg = m.$('#kmMsg'); if (msg) msg.innerHTML = '<span class="ink-warn">' + esc(e.message) + '</span><br>Jawaban aman tersimpan di perangkat. Mencoba lagi otomatis…';
        const b = m.$('#kmRetry'); if (b) { b.hidden = false; b.onclick = () => { b.hidden = true; kirim(); }; }
        X.timers.push(setTimeout(kirim, 20000));
      }
    };
    kirim();
  }
  async function selesaiDariServer() {
    if (X.done) return;
    try { const r = await NX.api('exam.kumpul', { id_sesi: X.sesi.id_sesi, jawaban: X.jaw, ragu: Array.from(X.ragu), alasan: 'WAKTU' }, { retry: 2 }); tamat(r); }
    catch (e) { tamat({ status: 'SELESAI', tampilkan_nilai: false }); }
  }
  function cleanupLocal(id) { LS.del('nx_ex_snap_' + id); LS.del('nx_ex_dev_' + id); Object.keys(localStorage).forEach((k) => { if (k.indexOf('nx_ex_' + id + '|') === 0) LS.del(k); }); }
  function berhenti(msg) {
    if (!X) return;
    X.done = true; stopTimers(); unbind(); EX.active = false; exitFS(); closeOverlays();
    const L = document.querySelector('.lock-screen'); if (L) L.remove();
    NX.modal({ title: 'Sesi ujian dihentikan', icon: 'alert', iconCls: 'warn', dismiss: false, body: '<p class="tx2">' + esc(msg) + '</p>', foot: '<button class="btn btn-p" onclick="NX.logout()">Masuk ulang</button>' });
  }

  /** Layar hasil setelah mengumpulkan. */
  function tamat(r) {
    X.done = true; stopTimers(); unbind(); EX.active = false; exitFS(); closeOverlays();
    const L = document.querySelector('.lock-screen'); if (L) L.remove();
    const g = document.getElementById('fsGate'); if (g) g.remove();
    const id = X.id, sesi = X.sesi, u = X.u, me = S.me;
    LS.del(keyLocal()); cleanupLocal(id);
    NX.drop('sw_');
    const show = r.tampilkan_nilai && r.nilai !== undefined;
    const kkm = r.kkm || (S.boot && S.boot.kkm) || 75;
    const tun = show && r.nilai >= kkm;
    const page = document.getElementById('page');
    page.innerHTML = '<div style="min-height:100vh;background:radial-gradient(circle at 20% 10%,var(--p-50),transparent 50%),var(--bg);padding:32px 16px">' +
      '<header class="flex ic jb" style="max-width:1000px;margin:0 auto"><div class="flex ic g12"><div class="brand" style="padding:0"><div class="logo" style="width:40px;height:40px">' + NX.logoHtml(128) + '</div></div><div><b style="font-family:var(--f-h);color:var(--p-d)">' + esc(NX.appName()) + '</b><div class="xs muted">Portal Siswa</div></div></div><div class="flex ic g8">' + NX.avatar(me.nama, S.fotoSaya || '', 'sm') + '<div class="small"><b>' + esc(me.nama) + '</b><div class="xs muted">' + esc(me.kelas || '') + ' · NIS ' + esc(me.nis) + '</div></div></div></header>' +
      '<div class="card" style="max-width:1000px;margin:24px auto 0;overflow:hidden;animation:slideUp .5s var(--ease)"><div style="height:6px;background:linear-gradient(90deg,var(--p),var(--pu))"></div><div class="card-p tc">' +
        '<span class="pill pill-p">' + ic('checkCircle', 'sm') + ' Ujian Selesai Dikumpulkan</span><h1 class="mt12" style="font-size:30px">' + esc(u.judul) + '</h1>' +
        '<div class="small muted mt8 flex jc g16 wrap"><span class="flex ic g4">' + ic('hash', 'sm') + esc(id) + '</span><span class="flex ic g4">' + ic('calendar', 'sm') + F.tgl(NX.now()) + '</span><span class="flex ic g4">' + ic('clock', 'sm') + F.jam(sesi.mulai) + ' – ' + F.jam(r.selesai || NX.now()) + ' WIB</span></div>' +
        (r.alasan === 'PAKSA' ? '<div class="banner neu mt16" style="text-align:left">' + ic('info', 'sm') + '<div class="small">Ujian Anda <b>diselesaikan oleh pengawas</b>. Semua jawaban yang sudah Anda isi tetap tersimpan dan dinilai.</div></div>' : r.alasan === 'PELANGGARAN' ? '<div class="banner err mt16" style="text-align:left">' + ic('shieldAlert', 'sm') + '<div class="small">Jawaban dikumpulkan otomatis karena <b>batas pelanggaran</b> tercapai.</div></div>' : '') +
        (show ? '<div class="flex jc mt24">' + NX.chart.ring(r.nilai, 100, 180, tun ? 'var(--p)' : 'var(--warn)', '/ 100') + '</div><div class="mt16">' + (r.status_nilai === 'MENUNGGU_KOREKSI' ? NX.pill('Nilai sementara · esai menunggu koreksi guru', 'pu', 'pill-lg') : NX.pill((tun ? 'TUNTAS' : 'BELUM TUNTAS') + ' · KKM ' + kkm, tun ? 'p' : 'warn', 'pill-lg')) + '</div><p class="mt12 tx2">' + (r.status_nilai === 'MENUNGGU_KOREKSI' ? 'Nilai akhir menyusul setelah jawaban esai dikoreksi guru.' : tun ? 'Selamat! Nilai Anda melampaui kriteria ketuntasan minimal.' : 'Tetap semangat — pelajari kembali materi yang belum dikuasai.') + '</p>' +
          '<div class="grid gc3 keep3 res-stat mt24" style="text-align:left">' + [['Jawaban benar', r.benar, 'check', 'ink-p', 'p'], ['Jawaban salah', r.salah, 'x', 'ink-err', 'err'], ['Tidak dijawab', r.kosong, 'minus', '', 'neu']].map((x) => '<div class="card card-ps" style="background:var(--muted-bg);box-shadow:none"><div class="flex jb ic"><span class="small tx2">' + x[0] + '</span><span class="tile sm ' + x[4] + '" style="border-radius:50%">' + ic(x[2], 'sm') + '</span></div><div class="num b8 mt8 ' + x[3] + '" style="font-size:30px">' + (x[1] || 0) + ' <small class="small muted b6">butir</small></div></div>').join('') + '</div>'
          : '<div class="tile lg pu" style="margin:28px auto 0;border-radius:50%;width:84px;height:84px">' + ic('hourglass', 'xl') + '</div><h3 class="mt16">Jawaban berhasil dikumpulkan</h3><p class="tx2 mt8">Hasil dan nilai akan diumumkan oleh guru setelah sesi evaluasi berakhir.</p>') +
        '<div class="card card-ps mt24" style="background:var(--p-50);border-color:var(--p-100);box-shadow:none;text-align:left"><div class="flex jb ic"><b>Log & Integritas Pelaksanaan</b><span class="xs ink-p b6 flex ic g4">' + ic('shieldCheck', 'sm') + 'Terautentikasi</span></div><div class="grid gc3 mt12" style="gap:12px">' +
          [['timer', 'Waktu pengerjaan', F.dur(r.durasi || ((r.selesai || NX.now()) - sesi.mulai) / 1000), 'Dari alokasi ' + u.durasi + ' menit'], ['shield', 'Status integritas', r.pelanggaran ? r.pelanggaran + ' pelanggaran' : '100% bersih', (r.pelanggaran || 0) + ' dari ' + X.limit + ' toleransi'], ['cloudCheck', 'Sinkronisasi server', 'Tersimpan aman', 'Server sekolah']].map((x) => '<div class="card card-ps flex g12" style="box-shadow:none"><span class="tile sm">' + ic(x[0], 'sm') + '</span><div><div class="xs muted">' + x[1] + '</div><div class="b7">' + esc(x[2]) + '</div><div class="xs muted">' + esc(x[3]) + '</div></div></div>').join('') + '</div></div>' +
        '<div class="res-act mt24"><button class="btn btn-p btn-lg" onclick="NX.go(\'s/home\')">Kembali ke Dashboard ' + ic('arrowR', 'sm') + '</button><button class="btn btn-s btn-lg" onclick="NX.go(\'s/hasil\')">' + ic('chart', 'sm') + 'Lihat Rekap di Hasil Saya</button></div>' +
      '</div></div></div>';
    NX.afterRender(page);
    if (tun) confetti();
    X = null;
  }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#2251E0', '#7C3AED', '#16A34A', '#F97316', '#F59E0B', '#0891B2'];
    for (let i = 0; i < 90; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
      c.style.animationDuration = (2.2 + Math.random() * 2) + 's'; c.style.animationDelay = Math.random() * 0.6 + 's';
      c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      document.body.appendChild(c); setTimeout(() => c.remove(), 5200);
    }
  }
})();
