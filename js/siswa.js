'use strict';
/* NEXTEST — siswa.js : dashboard, ujian saya, konfirmasi & token, hasil & nilai, profil */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt;
  const SW = window.SW = {};

  NX.mapelIcon = (nama) => { const n = String(nama || '').toLowerCase(); return /matem|mtk|hitung/.test(n) ? 'calc' : /fisika|kimia|biologi|ipa|sains/.test(n) ? 'beaker' : /inggris|english|asing|arab|jepang|mandarin/.test(n) ? 'globe' : /bahasa|sastra|indonesia|jawa|sunda/.test(n) ? 'book' : /sejarah|geografi|ekonomi|sosiologi|ips|pkn|pancasila/.test(n) ? 'school' : 'clipboard'; };
  const TILE_CLS = ['', 'pu', 'ok', 'acc', 'cy'];
  NX.mapelTile = (nama, size) => { const n = String(nama || ''); let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return '<span class="tile ' + (size || '') + ' ' + TILE_CLS[h % TILE_CLS.length] + '">' + ic(NX.mapelIcon(n)) + '</span>'; };
  NX.jenisLabel = (j) => ({ UH: 'Ulangan Harian', PTS: 'PTS · Tengah Semester', PAS: 'PAS · Akhir Semester', LATIHAN: 'Latihan', UMUM: 'Umum' }[j] || j || 'Umum');
  NX.jenisPendek = (j) => ({ UH: 'UH', PTS: 'PTS', PAS: 'PAS', LATIHAN: 'Latihan', UMUM: 'Umum' }[j] || 'Umum');

  /** Klasifikasi ujian untuk siswa */
  SW.klas = function (u) {
    const now = NX.now(), st = u.sesi && u.sesi.status;
    if (st === 'SELESAI') return 'selesai';
    if (u.status_jadwal === 'BERLANGSUNG' || st === 'MENGERJAKAN' || st === 'TERKUNCI') return now > u.tutup && st !== 'MENGERJAKAN' && st !== 'TERKUNCI' ? 'selesai' : 'berlangsung';
    if (now < u.buka) return 'datang';
    return 'selesai';
  };
  async function dataSiswa(fresh) {
    if (fresh) { NX.drop('sw_'); }
    const [ujian, hasil] = await Promise.all([NX.load('sw_ujian', 'exam.daftar', {}, 20000, true), NX.load('sw_hasil', 'hasil.saya', {}, 30000, true)]);
    if (S.boot) S.boot.ujian = ujian;
    hasil.hasil.forEach((x) => { if (x.kkm === undefined || x.kkm === null || x.kkm === '') x.kkm = hasil.kkm; });
    return { ujian, hasil: hasil.hasil, kkm: hasil.kkm };
  }
  SW.data = dataSiswa;
  async function fotoSaya() {
    const id = S.me && S.me.foto;
    if (!id) return '';
    if (S.fotoSaya) return S.fotoSaya;
    const c = NX.LS.get('nx_foto_' + id, '');
    if (c) { S.fotoSaya = c; return c; }
    try { const r = await NX.api('siswa.foto', { ids: [id] }); S.fotoSaya = r[id] || ''; if (S.fotoSaya) NX.LS.set('nx_foto_' + id, S.fotoSaya); } catch (e) { /* abaikan */ }
    return S.fotoSaya;
  }
  SW.foto = fotoSaya;

  // =================================================================== DASHBOARD
  NX.route('s/home', {
    role: 'SISWA', title: 'Dashboard Siswa', nav: 's/home',
    async render() {
      const d = await dataSiswa();
      const me = S.me, kkm = d.kkm || 75;
      const aktif = d.ujian.filter((u) => SW.klas(u) === 'berlangsung');
      const datang = d.ujian.filter((u) => SW.klas(u) === 'datang');
      const dilihat = d.hasil.filter((h) => h.tampilkan_nilai && h.nilai !== null && h.nilai !== undefined);
      const nil = dilihat.map((h) => h.nilai);
      const rata = nil.length ? nil.reduce((a, b) => a + b, 0) / nil.length : null;
      const tuntas = dilihat.filter((h) => h.nilai >= h.kkm).length;
      const last = nil.length >= 2 ? nil[nil.length - 1] - nil[nil.length - 2] : null;
      const perMapel = {};
      dilihat.forEach((h) => { (perMapel[h.mapel] || (perMapel[h.mapel] = [])).push(h.nilai); });
      const mapelItems = Object.keys(perMapel).map((m) => ({ label: m, value: Math.round(perMapel[m].reduce((a, b) => a + b, 0) / perMapel[m].length * 10) / 10 }));
      const a0 = aktif[0];
      const foto = await fotoSaya();
      const nextUj = aktif.concat(datang).slice(0, 4);
      const peng = (S.boot && S.boot.pengumuman) || [];
      const cntDown = a0 ? (a0.sesi && a0.sesi.status === 'MENGERJAKAN' && a0.sesi.batas ? a0.sesi.batas : a0.tutup) : (datang[0] ? datang[0].buka : 0);
      return '<div class="split stagger">' +
        '<div class="col g24" style="min-width:0">' +
          '<section class="hero"><span class="orb" style="width:220px;height:220px;right:-40px;top:-60px"></span><span class="orb" style="width:120px;height:120px;left:40%;bottom:-50px;animation-delay:-5s"></span>' +
            '<div style="max-width:560px;position:relative;z-index:2"><div class="sub small b6">' + esc(NX.salam()) + ', selamat datang kembali</div><h1 class="mt8">' + esc(me.nama) + '!</h1>' +
            '<p class="sub mt12">' + (aktif.length ? 'Ada <b>' + aktif.length + ' ujian berlangsung</b> yang menunggu Anda. Siapkan diri dan kerjakan dengan jujur.' : datang.length ? 'Ujian berikutnya: <b>' + esc(datang[0].judul) + '</b> pada ' + F.tglJam(datang[0].buka) + '.' : 'Belum ada ujian aktif. Tetap semangat belajar!') + '</p>' +
            '<div class="flex g12 mt20 wrap"><button class="btn btn-w btn-lg" onclick="' + (a0 ? 'NX.go(\'s/konfirmasi/' + a0.id_ujian + '\')' : 'NX.go(\'s/ujian\')') + '">' + ic('play', 'sm') + (a0 ? (a0.sesi && a0.sesi.status !== 'BELUM' ? 'Lanjutkan Ujian' : 'Mulai Ujian') : 'Lihat Ujian') + ' ' + ic('arrowR', 'sm') + '</button><button class="btn btn-glass btn-lg" onclick="NX.go(\'s/ujian?tab=datang\')">' + ic('calendar', 'sm') + 'Lihat Jadwal</button></div></div>' +
            NX.art('study') +
            (a0 ? '<div class="float-card hide-sm" style="right:250px;top:28px;z-index:3"><div class="flex ic g8"><span class="pill pill-ok live">Sedang berjalan</span></div><div class="b7 mt4 clamp1" style="max-width:190px">' + esc(a0.mapel) + '</div></div>' : '') +
            (cntDown ? '<div class="float-card glass hide-sm" style="right:26px;bottom:22px;z-index:3;animation-delay:-3s"><div class="xs" style="opacity:.85">' + (a0 ? 'Sisa waktu sesi' : 'Dibuka dalam') + '</div><div class="num b8" style="font-size:18px" data-cd="' + cntDown + '">' + F.hms(cntDown - NX.now()) + '</div></div>' : '') +
          '</section>' +
          '<div class="grid gc4 keep2 stagger">' +
            qa('qa-p', 'play', 'Mulai Ujian', 'Masuk ujian aktif dengan token dari pengawas.', 'btn-p', 'Mulai Sekarang', a0 ? 's/konfirmasi/' + a0.id_ujian : 's/ujian') +
            qa('qa-ok', 'radio', 'Ujian Berlangsung', aktif.length + ' sesi aktif dapat dikerjakan sekarang.', 'btn-ok', 'Masuk', 's/ujian') +
            qa('qa-pu', 'award', 'Hasil & Nilai', 'Lihat rekap nilai dan ketuntasan KKM.', 'btn-pu', 'Lihat Hasil', 's/hasil') +
            qa('qa-acc', 'trend', 'Analitik Saya', 'Pantau tren nilai & performa per mapel.', 'btn-or', 'Lihat Analitik', 's/hasil') +
          '</div>' +
          '<section class="card card-p"><div class="flex jb ic wrap g12"><div><h3>Ringkasan Performa</h3><p class="small muted mt4">Statistik dari ujian yang nilainya sudah diumumkan</p></div>' + NX.pill('KKM ' + kkm, 'p') + '</div>' +
            '<div class="grid gc4 keep2 mt16">' +
              NX.stat({ label: 'Ujian diikuti', value: d.hasil.length, unit: 'sesi', icon: 'clipboard', sub: d.ujian.length + ' ujian terjadwal' }) +
              NX.stat({ label: 'Rata-rata nilai', value: rata, dec: 1, unit: '/100', icon: 'star', color: 'pu', trend: last === null ? null : (last >= 0 ? '+' : '') + F.num(last, 1) + ' vs sebelumnya', trendCls: last === null ? '' : last >= 0 ? '' : 'down' }) +
              NX.stat({ label: 'Ujian tuntas', value: tuntas, unit: '/ ' + dilihat.length, icon: 'checkCircle', color: 'ok', sub: dilihat.length ? F.num(tuntas / dilihat.length * 100, 0) + '% kelulusan' : 'Belum ada nilai' }) +
              NX.stat({ label: 'Total nilai', value: nil.reduce((a, b) => a + b, 0), dec: 0, unit: 'poin', icon: 'award', color: 'acc', sub: 'Akumulasi semua ujian' }) +
            '</div></section>' +
          '<div class="grid gc2">' +
            '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('trend', 'ink-p') + ' Tren Nilai Ujian</h3><span class="xs muted">' + dilihat.length + ' ujian terakhir</span></div><p class="xs muted mt4">Garis putus-putus = KKM ' + kkm + '</p><div class="mt12">' + (dilihat.length ? NX.chart.line({ labels: dilihat.slice(-8).map((h) => NX.jenisPendek(h.jenis) + ' ' + h.mapel.split(' ')[0]), series: [{ name: 'Nilai', values: dilihat.slice(-8).map((h) => h.nilai) }], min: 0, max: 100, ref: { v: kkm, label: 'KKM ' + kkm }, h: 230 }) : NX.empty('trend', 'Belum ada nilai', 'Grafik muncul setelah nilai diumumkan.')) + '</div></section>' +
            '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('pie', 'ink-p') + ' Performa per Mapel</h3><span class="xs muted">' + mapelItems.length + ' mapel</span></div>' + (mapelItems.length ? '<div class="flex ic g20 mt16 wrap jc">' + NX.chart.donut({ items: mapelItems, size: 170, center: { v: F.num(rata, 0) + '%', l: 'Rata-rata' } }) + '<div class="f1" style="min-width:160px">' + NX.chart.legend(mapelItems.map((m) => ({ label: m.label, value: m.value, vtext: F.num(m.value, 1) }))) + '</div></div>' : NX.empty('pie', 'Belum ada data', '')) + '</section>' +
          '</div>' +
        '</div>' +
        '<aside class="col g20">' +
          '<section class="card card-p"><div class="flex jb ic"><h3>Profil Siswa</h3>' + NX.pill('Aktif', 'ok') + '</div><div class="flex ic g16 mt16">' + NX.avatar(me.nama, foto, 'lg') + '<div class="f1"><div class="b7 lg">' + esc(me.nama) + '</div><div class="small muted mono">NIS ' + esc(me.nis || '-') + '</div><div class="small mt4 flex ic g6">' + ic('school', 'sm') + esc(me.kelas || '-') + '</div></div></div></section>' +
          '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('calendar', 'ink-p') + ' Jadwal Ujian</h3><a href="#/s/ujian" class="small b6">Semua</a></div><div class="mt8">' +
            (nextUj.length ? nextUj.map((u) => { const on = SW.klas(u) === 'berlangsung'; return '<div class="row-item click" style="cursor:pointer" onclick="NX.go(\'' + (on ? 's/konfirmasi/' + u.id_ujian : 's/ujian?tab=datang') + '\')"><div class="date-tile ' + (on ? 'on' : '') + '"><b>' + F.hari(u.buka) + '</b><span>' + F.bln(u.buka) + '</span></div><div class="f1"><div class="b6 clamp1">' + esc(u.judul) + '</div><div class="xs muted flex ic g4">' + ic('clock', 'sm') + F.jam(u.buka) + '–' + F.jam(u.tutup) + ' WIB</div><div class="mt4">' + (on ? NX.pill('Berlangsung', 'ok', 'live') : NX.pill('Akan datang', '')) + '</div></div></div>'; }).join('') : NX.empty('calendar', 'Tidak ada jadwal', 'Belum ada ujian terjadwal.')) +
          '</div></section>' +
          '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('megaphone', 'ink-acc') + ' Pengumuman</h3>' + (peng.length ? NX.pill(peng.length + ' baru', 'acc') : '') + '</div>' +
            (peng.length ? '<div id="pgCar" class="mt12"></div><div class="flex jc g6 mt12" id="pgDots">' + peng.map((p, i) => '<button class="chip" style="height:10px;width:' + (i ? 10 : 22) + 'px;padding:0;border-radius:5px;' + (i ? '' : 'background:var(--p);border-color:var(--p)') + '" data-i="' + i + '" aria-label="Pengumuman ' + (i + 1) + '"></button>').join('') + '</div>' : '<p class="small muted mt12">Belum ada pengumuman.</p>') +
          '</section>' +
        '</aside></div>';
      function qa(cls, icn, t, p, b, bl, go) { return '<div class="qa ' + cls + '"><span class="tile">' + ic(icn) + '</span><h4>' + esc(t) + '</h4><p>' + esc(p) + '</p><button class="btn ' + b + ' btn-sm btn-block" onclick="NX.go(\'' + go + '\')">' + esc(bl) + ' ' + ic('arrowR', 'sm') + '</button></div>'; }
    },
    mount(p, root) {
      const peng = (S.boot && S.boot.pengumuman) || [];
      const car = root.querySelector('#pgCar');
      if (car) {
        let i = 0;
        const show = (k) => { i = k; const x = peng[k]; car.innerHTML = '<div class="banner neu" style="display:block;animation:fadeUp .4s var(--ease)"><div class="b7" style="color:var(--tx)">' + esc(x.judul) + '</div><div class="small mt4" style="white-space:pre-wrap">' + esc(x.isi) + '</div></div>'; root.querySelectorAll('#pgDots button').forEach((b, j) => { b.style.width = j === k ? '22px' : '10px'; b.style.background = j === k ? 'var(--p)' : ''; b.style.borderColor = j === k ? 'var(--p)' : ''; }); };
        show(0);
        root.querySelector('#pgDots').onclick = (e) => { const b = e.target.closest('button[data-i]'); if (b) show(+b.dataset.i); };
        if (peng.length > 1) SW._car = setInterval(() => { if (!document.body.contains(car)) { clearInterval(SW._car); return; } show((i + 1) % peng.length); }, 7000);
      }
      startCountdowns(root);
      SW.poll(root);
    }
  });
  function startCountdowns(root) {
    clearInterval(SW._cd);
    const path = S.cur && S.cur.path;
    SW._cd = setInterval(() => {
      const els = root.querySelectorAll('[data-cd]');
      if (!els.length || !S.cur || S.cur.path !== path) { clearInterval(SW._cd); return; }
      els.forEach((el) => { el.textContent = F.hms(+el.dataset.cd - NX.now()); });
    }, 1000);
  }
  /** Segarkan daftar ujian berkala bila halaman terlihat (pengumuman token/ujian baru). */
  SW.poll = function (root) {
    clearInterval(SW._poll);
    const path = S.cur && S.cur.path;
    SW._poll = setInterval(() => {
      if (!S.cur || S.cur.path !== path || (window.EX && EX.active)) { clearInterval(SW._poll); return; }
      if (NX.Activity.due('sw', 60000, 180000)) NX.load('sw_ujian', 'exam.daftar', {}, 1).catch(() => {});
    }, 15000);
  };

  // =================================================================== UJIAN SAYA
  NX.route('s/ujian', {
    role: 'SISWA', title: 'Ujian Saya', nav: 's/ujian',
    async render(p) {
      const d = await dataSiswa();
      const tab = p.q.tab || 'berlangsung';
      const g = { berlangsung: [], datang: [], selesai: [] };
      d.ujian.forEach((u) => g[SW.klas(u)].push(u));
      g.selesai.sort((a, b) => b.buka - a.buka);
      const kkm = d.kkm || 75;
      const tabs = [['berlangsung', 'Berlangsung'], ['datang', 'Akan Datang'], ['selesai', 'Selesai']];
      return '<div class="page-hd"><div><h1>Ujian Saya</h1><p>Daftar ujian terjadwal, berlangsung, dan riwayat hasil ujian Anda.</p></div><div class="card flex ic g12" style="padding:10px 16px"><span class="pill pill-ok live">Pengawasan aktif</span><span class="small muted">Satu akun · satu perangkat</span></div></div>' +
        '<div class="card"><div class="tabs" style="padding:0 16px">' + tabs.map((t) => '<button class="tab ' + (t[0] === tab ? 'on' : '') + '" onclick="NX.go(\'s/ujian?tab=' + t[0] + '\')">' + t[1] + '<span class="badge">' + g[t[0]].length + '</span></button>').join('') + '</div>' +
        '<div class="tbar"><div class="input-ic">' + ic('search') + '<input class="input input-sm" id="ujQ" placeholder="Cari ujian atau mata pelajaran…"></div></div>' +
        '<div class="card-bd"><div class="grid gc2 stagger" id="ujList">' + (g[tab].length ? g[tab].map((u) => kartu(u, kkm)).join('') : '<div style="grid-column:1/-1">' + NX.empty(tab === 'selesai' ? 'award' : 'calendar', tab === 'berlangsung' ? 'Tidak ada ujian berlangsung' : tab === 'datang' ? 'Belum ada ujian terjadwal' : 'Belum ada ujian selesai', 'Ujian akan muncul di sini sesuai jadwal dari sekolah.') + '</div>') + '</div></div></div>';
    },
    mount(p, root) {
      const q = root.querySelector('#ujQ');
      q.oninput = () => { const v = q.value.toLowerCase(); root.querySelectorAll('[data-uj]').forEach((c) => { c.style.display = c.dataset.uj.indexOf(v) > -1 ? '' : 'none'; }); };
      SW.poll(root);
    }
  });
  function kartu(u, kkm) {
    const k = SW.klas(u), st = u.sesi && u.sesi.status;
    const head = '<div class="flex g12">' + NX.mapelTile(u.mapel, 'lg') + '<div class="f1"><div class="xs b7 up muted">' + esc(u.mapel) + ' · ' + esc(NX.jenisPendek(u.jenis)) + '</div><h3 class="mt4">' + esc(u.judul) + '</h3></div><div>' +
      (k === 'berlangsung' ? (st === 'TERKUNCI' ? NX.pill('Terkunci', 'err') : st === 'MENGERJAKAN' ? NX.pill('Sedang dikerjakan', 'p', 'live') : NX.pill('Berlangsung', 'ok', 'live')) : k === 'datang' ? NX.pill('Akan datang', '') : st === 'SELESAI' ? NX.pill('Selesai', 'ok') : NX.pill('Tidak diikuti', 'err')) + '</div></div>';
    const meta = '<div class="grid gc4 keep2 mt16" style="gap:12px">' + [['calendar', 'Tanggal', F.tgl(u.buka)], ['clock', 'Waktu', F.jam(u.buka) + '–' + F.jam(u.tutup)], ['list', 'Soal', u.jumlah_soal + ' butir'], ['timer', 'Durasi', u.durasi + ' menit']].map((m) => '<div><div class="xs muted flex ic g4 up b6">' + ic(m[0], 'sm') + m[1] + '</div><div class="b7 mt4">' + esc(m[2]) + '</div></div>').join('') + '</div>';
    let body = '', foot = '';
    if (k === 'berlangsung') {
      body = '<div class="banner mt16">' + ic('shieldCheck') + '<div><b>Proteksi anti-contek aktif.</b> Layar penuh, deteksi pindah tab & jendela lain. Batas ' + u.batas_pelanggaran + ' pelanggaran sebelum ujian ' + (u.aksi_batas === 'KUMPUL' ? 'dikumpulkan otomatis' : 'terkunci') + '.</div></div>';
      foot = '<div class="flex jb ic mt16 g12 wrap"><span class="small muted">' + (u.pakai_token ? ic('key', 'sm') + ' Token dari pengawas ruang' : 'Tanpa token') + '</span><button class="btn btn-p" onclick="NX.go(\'s/konfirmasi/' + u.id_ujian + '\')">' + (st === 'MENGERJAKAN' || st === 'TERKUNCI' ? 'Lanjutkan Ujian' : 'Mulai Ujian') + ' ' + ic('arrowR', 'sm') + '</button></div>';
    } else if (k === 'datang') {
      body = '<div class="banner neu mt16">' + ic('info') + '<div>Sesi ujian dibuka otomatis sesuai jadwal. Pastikan perangkat siap dan baterai cukup.</div></div>';
      foot = '<div class="flex jb ic mt16"><span class="small muted">Dibuka ' + F.tglJam(u.buka) + '</span><button class="btn btn-s" disabled>' + ic('lock', 'sm') + 'Belum dibuka</button></div>';
    } else if (st === 'SELESAI') {
      const s = u.sesi;
      if (u.tampilkan_nilai && s.nilai !== null && s.nilai !== undefined) {
        kkm = s.kkm || u.kkm || kkm;
        const tun = s.nilai >= kkm;
        body = '<div class="flex ic g16 mt16">' + NX.chart.ring(s.nilai, 100, 84, tun ? 'var(--ok)' : 'var(--warn)', '') + '<div class="f1"><div class="flex ic g8 wrap"><span class="num b8" style="font-size:22px">' + F.num(s.nilai) + '</span>' + (s.status_nilai === 'MENUNGGU_KOREKSI' ? NX.pill('Menunggu koreksi esai', 'pu') : NX.pill(tun ? 'Tuntas (KKM ' + kkm + ')' : 'Belum tuntas', tun ? 'ok' : 'warn')) + '</div><div class="small muted mt4">Dikerjakan ' + F.tglJam(s.mulai) + '</div>' + (s.info ? '<div class="small mt4">Benar <b class="ink-ok">' + (s.info.b || 0) + '</b> · Salah <b class="ink-err">' + (s.info.s || 0) + '</b> · Kosong <b>' + (s.info.k || 0) + '</b></div>' : '') + '</div></div>' +
          '<div class="grid gc2 mt16" style="gap:12px"><div class="banner ' + (s.pelanggaran ? 'warn' : 'ok') + '" style="padding:10px 12px">' + ic('shieldCheck', 'sm') + '<div class="small"><b>Integritas</b><br>' + (s.pelanggaran ? s.pelanggaran + ' pelanggaran tercatat' : '100% bersih') + '</div></div><div class="banner neu" style="padding:10px 12px">' + ic('timer', 'sm') + '<div class="small"><b>Durasi</b><br>' + F.dur(s.info && s.info.d) + '</div></div></div>';
      } else body = '<div class="banner neu mt16">' + ic('hourglass') + '<div>Jawaban sudah dikumpulkan. Nilai akan diumumkan oleh guru.</div></div>';
      foot = '<div class="flex je mt16"><button class="btn btn-s" onclick="NX.go(\'s/hasil\')">Lihat Hasil & Rincian ' + ic('arrowR', 'sm') + '</button></div>';
    } else body = '<div class="banner err mt16">' + ic('xCircle') + '<div>Anda tidak mengikuti ujian ini sampai waktu ditutup.</div></div>';
    return '<div class="card card-p hov" data-uj="' + esc((u.judul + ' ' + u.mapel).toLowerCase()) + '">' + head + meta + body + foot + '</div>';
  }

  // =================================================================== KONFIRMASI & TOKEN
  NX.route('s/konfirmasi/:id', {
    role: 'SISWA', layout: 'bare',
    async render(p) {
      const d = await dataSiswa(true);
      const u = d.ujian.find((x) => x.id_ujian === p.id);
      if (!u) return wrap(NX.empty('xCircle', 'Ujian tidak ditemukan', 'Ujian ini tidak tersedia untuk kelas Anda.', '<button class="btn btn-p mt16" onclick="NX.go(\'s/ujian\')">Kembali</button>'));
      const st = u.sesi && u.sesi.status, lanjut = st === 'MENGERJAKAN' || st === 'TERKUNCI';
      if (st === 'SELESAI') return wrap(NX.empty('checkCircle', 'Ujian sudah dikumpulkan', 'Anda sudah menyelesaikan ujian ini.', '<button class="btn btn-p mt16" onclick="NX.go(\'s/hasil\')">Lihat Hasil</button>'));
      const now = NX.now();
      const belum = now < u.buka, tutup = now > u.tutup && !lanjut;
      const ios = /iPhone|iPod/.test(navigator.userAgent);
      const fsOk = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
      const perluToken = u.pakai_token && (!lanjut || !NX.LS.get('nx_ex_dev_' + u.id_ujian, false));
      return wrap(
        '<div class="flex g16 ic wrap">' + NX.mapelTile(u.mapel, 'lg') + '<div class="f1"><div class="flex g8 wrap">' + NX.pill(NX.jenisLabel(u.jenis), 'p', 'nodot') + '<span class="xs muted b6 mono">' + esc(u.id_ujian) + '</span></div><h1 class="mt8" style="font-size:28px">' + esc(u.judul) + '</h1><div class="small muted mt4">' + esc(u.mapel) + ' · ' + esc(S.me.kelas || '') + '</div></div>' +
          '<div class="card tc" style="padding:10px 16px;background:var(--p-50);border-color:var(--p-100)"><div class="xs muted">Peserta</div><div class="b7 clamp1" style="max-width:180px">' + esc(S.me.nama) + '</div><div class="xs mono muted">' + esc(S.me.nis) + '</div></div></div>' +
        '<div class="grid gc3 mt24" style="gap:12px">' + [['calendar', 'Tanggal pelaksanaan', F.tglPanjang(u.buka)], ['timer', 'Alokasi waktu', u.durasi + ' menit'], ['list', 'Jumlah soal', u.jumlah_soal + ' butir'], ['clock', 'Jendela ujian', F.jam(u.buka) + ' – ' + F.jam(u.tutup) + ' WIB'], ['shieldAlert', 'Batas pelanggaran', u.batas_pelanggaran + ' kali'], ['award', 'KKM', String(u.kkm || d.kkm || 75)]].map((m) => '<div class="flex ic g12" style="padding:12px 14px;border-radius:12px;background:var(--p-50)"><span class="tile sm white">' + ic(m[0], 'sm') + '</span><div class="f1"><div class="xs muted">' + m[1] + '</div><div class="b7 small">' + esc(m[2]) + '</div></div></div>').join('') + '</div>' +
        (u.catatan ? '<div class="banner neu mt16">' + ic('info') + '<div style="white-space:pre-wrap">' + esc(u.catatan) + '</div></div>' : '') +
        '<div class="banner acc mt20" style="display:block"><div class="flex ic g8 b7" style="font-family:var(--f-h)">' + ic('shieldCheck') + 'Aturan & Protokol Integritas Ujian</div><div class="col g8 mt12 small">' +
          ['Ujian wajib dikerjakan dalam mode <b>Layar Penuh</b> selama sesi berlangsung.', 'Dilarang pindah tab, membuka aplikasi/jendela lain, atau membagi layar. ' + (u.aksi_batas === 'KUMPUL' ? '<b>' + u.batas_pelanggaran + ' pelanggaran = jawaban dikumpulkan otomatis</b> dan ujian berakhir.' : '<b>' + u.batas_pelanggaran + ' pelanggaran = ujian terkunci</b> dan hanya dapat dibuka pengawas.'), 'Salin–tempel, klik kanan, tangkapan layar, dan pintasan keyboard dinonaktifkan & dicatat.', 'Jawaban tersimpan otomatis di perangkat dan tersinkron berkala ke server sekolah, aman meski internet putus.'].map((t) => '<div class="flex g8">' + ic('checkCircle', 'sm') + '<span>' + t + '</span></div>').join('') + '</div></div>' +
        (!fsOk || ios ? '<div class="banner err mt16">' + ic('alert') + '<div><b>Perangkat ini tidak mendukung layar penuh.</b> Gunakan laptop/PC atau HP Android dengan Chrome terbaru. Mengerjakan dari perangkat ini berisiko tercatat pelanggaran.</div></div>' : '') +
        (belum ? '<div class="banner mt20">' + ic('clock') + '<div>Ujian dibuka <b>' + F.tglJam(u.buka) + ' WIB</b>. Halaman ini akan siap saat waktunya tiba.</div></div>'
          : tutup ? '<div class="banner err mt20">' + ic('xCircle') + '<div>Waktu ujian sudah ditutup.</div></div>'
          : (perluToken ? '<div class="tc mt24"><h3>Masukkan Token Ujian</h3><p class="small muted mt4">Ketik 6 karakter token yang diumumkan pengawas ruang</p><div class="flex jc g8 mt16" id="tkBox">' + [0, 1, 2, 3, 4, 5].map((i) => '<input class="input tc num b8" maxlength="1" data-t="' + i + '" style="width:52px;height:60px;font-size:24px;padding:0;text-transform:uppercase" autocomplete="off" ' + (i === 0 ? 'autofocus' : '') + '>').join('') + '</div><div class="xs muted mt8" id="tkMsg">Menunggu token dimasukkan lengkap</div></div>' : '<div class="banner ok mt20">' + ic('refresh') + '<div><b>Lanjutkan sesi Anda.</b> Jawaban sebelumnya tersimpan; sisa waktu tetap berjalan sejak ujian dimulai.</div></div>') +
            '<label class="check mt20 card card-ps" style="display:flex"><input type="checkbox" id="setuju"><span class="small">Saya telah membaca, memahami, dan menyetujui tata tertib ujian serta sanksi pelanggaran integritas yang berlaku.</span></label>') +
        '<div class="flex g12 mt20 wrap"><button class="btn btn-s btn-lg" onclick="NX.go(\'s/ujian\')">' + ic('arrowL', 'sm') + 'Kembali</button><button class="btn btn-p btn-lg f1" id="btnMasuk" ' + (belum || tutup ? 'disabled' : 'disabled') + '>' + ic('maximize') + (lanjut ? 'Lanjutkan dalam Mode Layar Penuh' : 'Masuk Mode Ujian (Layar Penuh)') + '</button></div>' +
        '<div class="banner neu mt16 xs">' + ic('monitor', 'sm') + '<div>Perangkat: <b>' + esc(NX.browserName()) + '</b> · ' + (fsOk ? 'Layar penuh didukung' : 'Layar penuh TIDAK didukung') + '. Pengguna HP disarankan mengaktifkan <b>Sematkan Aplikasi (Pin Layar)</b>.</div></div>', u);
      function wrap(inner) {
        return '<div style="min-height:100vh;background:var(--bg)"><header class="flex ic jb" style="padding:16px 28px;background:#fff;border-bottom:1px solid var(--line)"><div class="flex ic g12"><div class="brand" style="padding:0"><div class="logo" style="width:38px;height:38px">' + NX.logoHtml(128) + '</div></div><b style="font-family:var(--f-h);color:var(--p-d)">' + esc(NX.appName()) + '</b></div><span class="pill pill-p live">Sistem pengawasan aktif</span></header>' +
          '<main style="max-width:880px;margin:32px auto;padding:0 16px 40px"><div class="card card-p" style="animation:slideUp .5s var(--ease)">' + inner + '</div></main></div>';
      }
    },
    mount(p, root) {
      const btn = root.querySelector('#btnMasuk'); if (!btn) return;
      const ag = root.querySelector('#setuju'), boxes = root.querySelectorAll('[data-t]');
      const token = () => Array.from(boxes).map((b) => b.value.trim().toUpperCase()).join('');
      const valid = () => { const ok = (!ag || ag.checked) && (!boxes.length || token().length === 6) && !btn.dataset.lock; btn.disabled = !ok; const m = root.querySelector('#tkMsg'); if (m) m.textContent = token().length === 6 ? 'Token lengkap — siap masuk' : 'Menunggu token dimasukkan lengkap'; };
      boxes.forEach((b, i) => {
        b.addEventListener('input', () => { b.value = b.value.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase(); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); valid(); });
        b.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); if (e.key === 'Enter' && !btn.disabled) btn.click(); });
        b.addEventListener('paste', (e) => { e.preventDefault(); const t = (e.clipboardData.getData('text') || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 6); t.split('').forEach((c, j) => { if (boxes[j]) boxes[j].value = c; }); valid(); });
      });
      if (ag) ag.onchange = valid;
      valid();
      btn.onclick = async () => {
        await EX.masuk(p.id, token(), btn, (e) => {
          if (e.kode === 'TOKEN') { const tb = root.querySelector('#tkBox'); if (tb) { tb.style.animation = 'shake .45s'; setTimeout(() => { tb.style.animation = ''; }, 500); boxes.forEach((b) => { b.value = ''; }); boxes[0] && boxes[0].focus(); } }
          if (e.kode === 'TOKEN' && !boxes.length) NX.render();
          valid();
        });
      };
    }
  });

  // =================================================================== HASIL & NILAI
  NX.route('s/hasil', {
    role: 'SISWA', title: 'Hasil & Nilai', nav: 's/hasil',
    async render() {
      const d = await dataSiswa();
      const kkm = d.kkm || 75;
      const h = d.hasil.slice().sort((a, b) => b.selesai - a.selesai);
      const vis = h.filter((x) => x.tampilkan_nilai && x.nilai !== null && x.nilai !== undefined);
      const nil = vis.map((x) => x.nilai);
      const rata = nil.length ? nil.reduce((a, b) => a + b, 0) / nil.length : null;
      const tun = vis.filter((x) => x.nilai >= x.kkm).length;
      const perMapel = {};
      vis.forEach((x) => { (perMapel[x.mapel] || (perMapel[x.mapel] = [])).push(x.nilai); });
      const asc = vis.slice().reverse().slice(-10);
      return '<div class="page-hd"><div><div class="crumb">Portal Siswa ' + ic('chevR', 'sm') + ' Hasil & Nilai</div><h1>Hasil dan Nilai Evaluasi</h1><p>Rekapitulasi riwayat ujian, tren nilai, dan ketuntasan kompetensi.</p></div><button class="btn btn-s" onclick="SW.unduhHasil()">' + ic('download', 'sm') + 'Unduh (Excel)</button></div>' +
        '<div class="grid gc4 keep2 stagger">' +
          NX.stat({ label: 'Total ujian selesai', value: h.length, unit: 'ujian', icon: 'checkCircle' }) +
          NX.stat({ label: 'Rata-rata nilai', value: rata, dec: 1, unit: '/100', icon: 'calc', color: 'pu', sub: 'Batas lulus ' + kkm }) +
          NX.stat({ label: 'Tingkat ketuntasan', value: tun, unit: '/' + vis.length, icon: 'award', color: 'ok', sub: vis.length ? F.num(tun / vis.length * 100, 1) + '% tuntas KKM' : '-' }) +
          NX.stat({ label: 'Nilai tertinggi', value: nil.length ? Math.max.apply(null, nil) : null, dec: 1, icon: 'star', color: 'acc', sub: nil.length ? 'Terendah ' + F.num(Math.min.apply(null, nil)) : '-' }) +
        '</div>' +
        '<div class="split-6 mt24"><section class="card card-p"><div class="flex jb ic"><h3>Tren Nilai Ujian</h3>' + NX.pill(asc.length + ' ujian terakhir', 'p', 'nodot') + '</div><p class="xs muted mt4">Pantauan skor terhadap garis batas kelulusan (KKM)</p><div class="mt12">' + (asc.length ? NX.chart.line({ labels: asc.map((x) => NX.jenisPendek(x.jenis) + ' ' + F.tgl(x.selesai).slice(0, 6)), series: [{ name: 'Nilai', values: asc.map((x) => x.nilai) }], min: 0, max: 100, ref: { v: kkm, label: 'KKM ' + kkm }, h: 240 }) : NX.empty('trend', 'Belum ada nilai', '')) + '</div></section>' +
          '<section class="card card-p"><h3>Ketuntasan per Mapel</h3><p class="xs muted mt4">Rerata nilai per mata pelajaran</p><div class="mt16">' + (Object.keys(perMapel).length ? NX.chart.hbars({ items: Object.keys(perMapel).map((m) => { const a = perMapel[m].reduce((x, y) => x + y, 0) / perMapel[m].length; return { label: m, value: Math.round(a * 10) / 10, color: a >= kkm ? 'var(--p)' : 'var(--warn)', sub: a >= kkm ? 'Tuntas' : 'Perlu fokus' }; }), max: 100 }) : NX.empty('pie', 'Belum ada data', '')) + '</div></section></div>' +
        '<section class="card mt24"><div class="card-hd"><h3>Riwayat Hasil Ujian</h3>' + NX.pill(h.length + ' catatan', 'p', 'nodot') + '</div><div id="hsTbl"></div></section>';
    },
    mount(p, root) {
      const d = S.cache.sw_hasil.d, kkm = d.kkm || 75;
      const mapel = Array.from(new Set(d.hasil.map((x) => x.mapel)));
      NX.Table(root.querySelector('#hsTbl'), {
        rows: d.hasil.slice().sort((a, b) => b.selesai - a.selesai), search: ['judul', 'mapel'], searchPh: 'Cari nama ujian atau mapel…',
        filters: [{ k: 'mapel', label: 'Semua mapel', options: mapel.map((m) => [m, m]) }, { label: 'Semua status', options: [['t', 'Tuntas'], ['b', 'Belum tuntas'], ['h', 'Nilai belum diumumkan']], fn: (x, v) => v === 'h' ? !x.tampilkan_nilai : v === 't' ? x.tampilkan_nilai && x.nilai >= x.kkm : x.tampilkan_nilai && x.nilai < x.kkm }],
        rowClass: (x) => (x.tampilkan_nilai && x.nilai < x.kkm && x.status_nilai === 'FINAL' ? 'row-err' : ''),
        columns: [
          { k: 'selesai', label: 'Tanggal', desc: true, render: (x) => '<div class="flex ic g8">' + ic('calendar', 'sm muted') + '<div><div class="b6">' + F.tgl(x.selesai) + '</div><div class="xs muted">' + F.jam(x.mulai) + '–' + F.jam(x.selesai) + ' WIB</div></div></div>' },
          { k: 'judul', label: 'Nama ujian', render: (x) => '<div class="b6">' + esc(x.judul) + '</div><div class="xs muted">' + esc(NX.jenisLabel(x.jenis)) + '</div>' },
          { k: 'mapel', label: 'Mata pelajaran', render: (x) => '<span class="chip static">' + esc(x.mapel) + '</span>' },
          { label: 'B / S / K', sort: false, render: (x) => x.info ? '<span class="num small"><span class="ink-ok b7">' + (x.info.b || 0) + '</span> / <span class="ink-err b7">' + (x.info.s || 0) + '</span> / ' + (x.info.k || 0) + '</span>' : '<span class="muted">—</span>' },
          { k: 'nilai', label: 'Nilai akhir', cls: 'n', desc: true, render: (x) => x.tampilkan_nilai && x.nilai !== null && x.nilai !== undefined ? '<span class="num b8" style="font-size:18px;color:' + (x.nilai >= x.kkm ? 'var(--p-d)' : 'var(--err-s)') + '">' + F.num(x.nilai) + '</span>' : '<span class="muted">—</span>' },
          { label: 'Status', sort: false, render: (x) => !x.tampilkan_nilai ? NX.pill('Diumumkan guru', '') : x.status_nilai === 'MENUNGGU_KOREKSI' ? NX.pill('Menunggu koreksi', 'pu') : x.nilai >= x.kkm ? NX.pill('Tuntas (KKM ' + x.kkm + ')', 'ok') : NX.pill('Belum tuntas', 'err') },
          { k: 'pelanggaran', label: 'Integritas', render: (x) => x.pelanggaran ? NX.pill(x.pelanggaran + ' pelanggaran', 'warn') : NX.pill('Bersih', 'ok') }
        ], empty: { icon: 'award', title: 'Belum ada riwayat', text: 'Riwayat muncul setelah Anda menyelesaikan ujian.' }
      });
    }
  });
  SW.unduhHasil = function () {
    const d = S.cache.sw_hasil && S.cache.sw_hasil.d; if (!d) return;
    NX.exportXlsx('Hasil_' + S.me.nama, [{ name: 'Hasil', cols: [12, 36, 20, 8, 8, 8, 10, 16, 12], rows: [['Tanggal', 'Ujian', 'Mapel', 'Benar', 'Salah', 'Kosong', 'Nilai', 'Status', 'Pelanggaran']].concat(d.hasil.map((x) => [F.tgl(x.selesai), x.judul, x.mapel, x.info ? x.info.b : '', x.info ? x.info.s : '', x.info ? x.info.k : '', x.tampilkan_nilai ? x.nilai : '', x.tampilkan_nilai ? (x.status_nilai === 'MENUNGGU_KOREKSI' ? 'Menunggu koreksi' : x.nilai >= x.kkm ? 'Tuntas' : 'Belum tuntas') : 'Diumumkan guru', x.pelanggaran])) }]);
  };

  // =================================================================== PROFIL
  NX.route('s/profil', {
    role: 'SISWA', title: 'Profil Saya', nav: 's/profil',
    async render() {
      const me = S.me, foto = await fotoSaya(), c = S.cfg || {};
      const jk = me.jk === 'L' ? 'Laki-laki' : me.jk === 'P' ? 'Perempuan' : '-';
      return '<div class="page-hd"><div><div class="crumb">Portal Siswa ' + ic('chevR', 'sm') + ' Profil Saya</div><h1>Profil & Keamanan Akun</h1></div></div>' +
        '<div class="split-6 stagger" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)">' +
        '<section class="card" style="overflow:hidden"><div style="height:120px;background:var(--hero);position:relative"><div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.18) 1px,transparent 1px);background-size:16px 16px"></div><span class="pill" style="position:absolute;right:16px;bottom:14px;background:rgba(15,23,42,.35);color:#fff">AKUN CBT TERVERIFIKASI</span></div>' +
          '<div class="card-bd" style="margin-top:-60px"><div class="flex jb" style="align-items:flex-end">' + NX.avatar(me.nama, foto, 'lg') + NX.pill('Siswa aktif', 'ok') + '</div><h2 class="mt12">' + esc(me.nama) + '</h2><div class="small muted">' + esc(c.nama_sekolah || NX.appName()) + '</div>' +
          '<div class="grid gc2 mt16" style="gap:12px">' + [['NIS', me.nis], ['NISN', me.nisn]].map((x) => '<div class="card card-ps" style="background:var(--muted-bg)"><div class="xs muted">' + x[0] + '</div><div class="flex ic jb"><span class="num b7 lg">' + esc(x[1] || '-') + '</span>' + (x[1] ? '<button class="icon-btn sm" onclick="NX.copy(\'' + esc(x[1]) + '\')" aria-label="Salin">' + ic('copy', 'sm') + '</button>' : '') + '</div></div>').join('') + '</div>' +
          '<div class="mt16">' + [['school', 'Rombel / Kelas', me.kelas], ['user', 'Jenis kelamin', jk], ['award', 'KKM kelas', String((S.boot && S.boot.kkm) || 75)]].map((x) => '<div class="row-item"><span class="muted">' + ic(x[0], 'sm') + '</span><span class="small tx2 f1">' + x[1] + '</span><span class="b7">' + esc(x[2] || '-') + '</span></div>').join('') + '</div>' +
          '<div class="banner neu mt16 xs">' + ic('info', 'sm') + '<div>Data profil dikelola admin sekolah. Bila ada kesalahan nama, NIS/NISN, atau kelas, hubungi admin/wali kelas.</div></div></div></section>' +
        '<div class="col g20"><section class="card card-p"><div class="flex ic g12"><span class="tile">' + ic('shieldCheck') + '</span><div><h3>Keamanan Akun</h3><p class="small muted">Cara masuk & aturan perangkat</p></div></div>' +
          '<div class="banner mt16">' + ic('key') + '<div class="small">Anda masuk menggunakan <b>NIS atau NISN</b>. Jangan pinjamkan perangkat yang sedang login kepada teman, dan selalu <b>Keluar</b> setelah selesai di komputer lab.</div></div>' +
          '<div class="card card-ps mt16 flex ic g12" style="background:var(--muted-bg)"><span class="tile sm">' + ic('monitor', 'sm') + '</span><div class="f1"><div class="b6">' + esc(NX.browserName()) + ' ' + NX.pill('Sesi ini', 'p') + '</div><div class="xs muted">ID perangkat ' + esc(NX.DV.slice(-8)) + '</div></div><button class="btn btn-do btn-sm" onclick="NX.askLogout()">' + ic('logout', 'sm') + 'Keluar</button></div>' +
          '<div class="banner pu mt16" style="background:var(--pu-50);color:var(--pu-s)">' + ic('shield') + '<div class="small"><b>Kebijakan integritas: satu akun, satu perangkat.</b> Saat ujian berlangsung, akun yang sama tidak bisa dipakai di perangkat lain. Bila perangkat Anda rusak, minta pengawas melakukan <b>Reset Login</b>.</div></div></section>' +
          '<section class="card card-p"><h3>Tips Ujian Lancar</h3><div class="col g12 mt12 small">' + [['wifi', 'Jaringan putus tidak menghapus jawaban — semua tersimpan di perangkat dan dikirim saat tersambung.'], ['maximize', 'Tetap di layar penuh. Keluar layar penuh atau pindah aplikasi dihitung pelanggaran.'], ['phone', 'Pengguna HP: aktifkan Pin Layar dan matikan notifikasi sebelum mulai.']].map((t) => '<div class="flex g12"><span class="tile sm">' + ic(t[0], 'sm') + '</span><span class="tx2">' + t[1] + '</span></div>').join('') + '</div></section></div></div>';
    }
  });
})();
