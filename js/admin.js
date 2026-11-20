'use strict';
/* NEXTEST — admin.js : dashboard admin, monitoring langsung, jadwal ujian (daftar & formulir) */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt;
  const AD = window.AD = {};

  // ------------------------------------------------------------ util bersama panel admin
  AD.kelas = () => ((S.boot && S.boot.kelas) || []).filter((k) => k.status !== 'DIHAPUS');
  AD.mapel = () => ((S.boot && S.boot.mapel) || []).filter((m) => m.status !== 'DIHAPUS');
  AD.namaKelas = (id) => { const k = AD.kelas().find((x) => x.id_kelas === id); return k ? k.nama_kelas : id; };
  AD.namaMapel = (id) => { const m = AD.mapel().find((x) => x.id_mapel === id); return m ? m.nama_mapel : '-'; };
  AD.segarMaster = async () => { const [k, m] = await Promise.all([NX.api('kelas.list', {}), NX.api('mapel.list', {})]); if (S.boot) { S.boot.kelas = k; S.boot.mapel = m; } NX.drop('a_kelas'); NX.drop('a_mapel'); return { k, m }; };
  AD.ok = (msg, drops) => { (drops || []).forEach((p) => NX.drop(p)); if (msg) NX.toast(msg, 'ok'); NX.rerender(); };
  AD.optKelas = (sel, semua) => (semua ? '<option value="">' + esc(semua) + '</option>' : '') + AD.kelas().map((k) => '<option value="' + esc(k.id_kelas) + '" ' + (k.id_kelas === sel ? 'selected' : '') + '>' + esc(k.nama_kelas) + '</option>').join('');
  AD.optMapel = (sel, semua) => (semua ? '<option value="">' + esc(semua) + '</option>' : '') + AD.mapel().map((m) => '<option value="' + esc(m.id_mapel) + '" ' + (m.id_mapel === sel ? 'selected' : '') + '>' + esc(m.nama_mapel) + '</option>').join('');
  AD.optJenis = (sel) => [['UH', 'Ulangan Harian'], ['PTS', 'PTS'], ['PAS', 'PAS'], ['LATIHAN', 'Latihan'], ['UMUM', 'Umum']].map((j) => '<option value="' + j[0] + '" ' + (j[0] === sel ? 'selected' : '') + '>' + j[1] + '</option>').join('');
  AD.chipsKelas = (name, sel) => '<div class="chips" data-chips="' + name + '">' + (AD.kelas().length ? AD.kelas().map((k) => '<button type="button" class="chip ' + ((sel || []).indexOf(k.id_kelas) > -1 ? 'on' : '') + '" data-v="' + esc(k.id_kelas) + '">' + esc(k.nama_kelas) + '</button>').join('') : '<span class="small muted">Belum ada kelas. Tambahkan di menu Kelas & Mapel.</span>') + '</div>';
  AD.bindChips = (root) => root.querySelectorAll('[data-chips] .chip').forEach((c) => { c.onclick = () => c.classList.toggle('on'); });
  AD.chipVals = (root, name) => Array.from(root.querySelectorAll('[data-chips="' + name + '"] .chip.on')).map((c) => c.dataset.v);
  AD.v = (root, name) => { const el = root.querySelector('[name="' + name + '"]'); if (!el) return undefined; return el.type === 'checkbox' ? el.checked : el.value.trim(); };
  AD.sw = (name, on, label, desc) => '<label class="toggle-row" style="cursor:pointer"><span class="switch"><input type="checkbox" name="' + name + '" ' + (on ? 'checked' : '') + '><span></span></span><span class="f1"><span class="b6">' + esc(label) + '</span>' + (desc ? '<br><span class="small muted">' + desc + '</span>' : '') + '</span></label>';
  AD.statusUjian = (u) => {
    const s = u.status === 'DRAF' ? ['Draf', ''] : u.status === 'ARSIP' ? ['Arsip', ''] : u.status_jadwal === 'BERLANGSUNG' ? ['Berlangsung', 'ok', 'live'] : u.status_jadwal === 'TERJADWAL' ? ['Terjadwal', 'p'] : ['Selesai', 'pu'];
    return NX.pill(s[0], s[1], s[2] || '');
  };
  AD.jenisPill = (j) => NX.pill(NX.jenisPendek(j), j === 'PAS' ? 'pu' : j === 'PTS' ? 'acc' : j === 'UH' ? 'p' : 'cy', 'nodot');
  AD.poll = function (key, root, fn, active, idle) {
    clearInterval(AD['_p_' + key]);
    const path = S.cur && S.cur.path;
    AD['_p_' + key] = setInterval(() => {
      if (!S.cur || S.cur.path !== path) { clearInterval(AD['_p_' + key]); return; }
      if (document.querySelector('.ov')) return;
      if (NX.Activity.due(key, active, idle)) fn();
    }, 5000);
  };

  // =================================================================== DASHBOARD
  NX.route('a/dash', {
    role: 'ADMIN', title: 'Dashboard', nav: 'a/dash',
    async render() {
      const d = await NX.load('a_dash', 'dashboard.admin', {}, 25000, true);
      const st = d.stat, c = S.cfg || {};
      const JN = Object.keys(d.perJenis || {}).map((k) => ({ label: (window.EX && EX.VLABEL && EX.VLABEL[k]) || k, value: d.perJenis[k] }));
      const aktif = d.mendatang.filter((u) => u.status_jadwal === 'BERLANGSUNG');
      return '<div class="col g24 stagger">' +
        '<section class="hero"><span class="orb" style="width:240px;height:240px;right:-60px;top:-70px"></span>' +
          '<div style="max-width:560px;position:relative;z-index:2"><div class="sub small b6">' + esc(NX.salam()) + ', ' + esc(S.me.nama) + '</div><h1 class="mt8">Panel Kendali ' + esc(NX.appName()) + '</h1>' +
          '<p class="sub mt12">' + (aktif.length ? '<b>' + aktif.length + ' ujian sedang berlangsung</b> dengan ' + st.mengerjakan + ' siswa aktif mengerjakan. Pantau integritas secara langsung.' : st.ujianHariIni ? st.ujianHariIni + ' ujian terjadwal hari ini.' : 'Tidak ada ujian berlangsung saat ini. Siapkan bank soal dan jadwal ujian berikutnya.') + '</p>' +
          '<div class="flex g12 mt20 wrap"><button class="btn btn-w btn-lg" onclick="NX.go(\'a/ujian/baru\')">' + ic('plus', 'sm') + 'Buat Ujian</button><button class="btn btn-glass btn-lg" onclick="NX.go(\'a/monitor\')">' + ic('radio', 'sm') + 'Monitoring Langsung</button></div></div>' +
          NX.art('admin') +
          '<div class="float-card hide-sm" style="right:270px;top:26px;z-index:3"><div class="xs muted">Sedang mengerjakan</div><div class="num b8" style="font-size:20px;color:var(--p-d)">' + st.mengerjakan + ' siswa</div></div>' +
          '<div class="float-card glass hide-sm" style="right:30px;bottom:20px;z-index:3;animation-delay:-3s"><div class="xs" style="opacity:.85">Pelanggaran hari ini</div><div class="num b8" style="font-size:18px">' + st.pelanggaranHariIni + '</div></div>' +
        '</section>' +
        '<div class="grid gc4 keep2">' +
          NX.stat({ label: 'Siswa aktif', value: st.siswa, icon: 'users', sub: st.kelas + ' rombel' }) +
          NX.stat({ label: 'Ujian hari ini', value: st.ujianHariIni, icon: 'calendar', color: 'pu', sub: st.ujianTotal + ' ujian terbit' }) +
          NX.stat({ label: 'Sedang mengerjakan', value: st.mengerjakan, icon: 'activity', color: 'ok', sub: '<span class="pill pill-ok live">Langsung</span>' }) +
          NX.stat({ label: 'Pelanggaran hari ini', value: st.pelanggaranHariIni, icon: 'shieldAlert', color: st.pelanggaranHariIni ? 'acc' : 'ok', sub: st.soal + ' butir di bank soal' }) +
        '</div>' +
        '<div class="grid gc4 keep2">' +
          qa('qa-p', 'plus', 'Buat Ujian', 'Jadwalkan UH/PTS/PAS dengan token & anti-contek.', 'btn-p', 'a/ujian/baru') +
          qa('qa-pu', 'layers', 'Bank Soal', 'Tulis soal atau impor dari Word / Excel.', 'btn-pu', 'a/bank') +
          qa('qa-ok', 'users', 'Data Siswa', 'Impor siswa; login cukup NIS/NISN.', 'btn-ok', 'a/siswa') +
          qa('qa-acc', 'trend', 'Analisis Butir', 'Kesukaran, daya beda, pengecoh.', 'btn-or', 'a/analisis') +
        '</div>' +
        '<div class="split">' +
          '<div class="col g24" style="min-width:0">' +
            '<div class="grid gc2">' +
              '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('trend', 'ink-p') + ' Tren Rata-rata Nilai</h3><span class="xs muted">' + d.tren.length + ' ujian terakhir</span></div><div class="mt12">' + (d.tren.length ? NX.chart.line({ labels: d.tren.map((t) => F.tgl(t.tgl).slice(0, 6)), series: [{ name: 'Rata-rata', values: d.tren.map((t) => t.rata) }], min: 0, max: 100, ref: { v: +(c.kkm || 75), label: 'KKM ' + (c.kkm || 75) }, h: 220 }) : NX.empty('trend', 'Belum ada nilai', 'Grafik muncul setelah ada ujian selesai.')) + '</div></section>' +
              '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('chart', 'ink-p') + ' Sebaran Nilai</h3><span class="xs muted clamp1" style="max-width:55%">' + esc(d.sebaran ? d.sebaran.judul : '') + '</span></div><div class="mt12">' + (d.sebaran ? NX.chart.bars({ labels: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'], values: d.sebaran.bins, colors: d.sebaran.bins.map((_, i) => (i * 10 >= +(c.kkm || 75) - 9 ? 'var(--p)' : '#CBD5E1')), h: 220, unit: ' siswa' }) : NX.empty('chart', 'Belum ada data', '')) + '</div></section>' +
            '</div>' +
            '<section class="card"><div class="card-hd"><h3>' + ic('calendar', 'ink-p') + ' Jadwal Ujian Terdekat</h3><a href="#/a/ujian" class="small b6">Kelola jadwal</a></div><div class="card-bd" style="padding-top:4px">' +
              (d.mendatang.length ? d.mendatang.map((u) => { const on = u.status_jadwal === 'BERLANGSUNG'; return '<div class="row-item"><div class="date-tile ' + (on ? 'on' : '') + '"><b>' + F.hari(u.buka) + '</b><span>' + F.bln(u.buka) + '</span></div><div class="f1" style="min-width:0"><div class="b6 clamp1">' + esc(u.judul) + '</div><div class="xs muted">' + esc(u.mapel) + ' · ' + F.jam(u.buka) + '–' + F.jam(u.tutup) + ' WIB · ' + esc(u.kelas.join(', ')) + '</div></div>' + (on ? NX.pill('Berlangsung', 'ok', 'live') : NX.pill('Terjadwal', 'p')) + '<button class="btn btn-s btn-sm" onclick="NX.go(\'' + (on ? 'a/monitor/' : 'a/ujian/edit/') + u.id_ujian + '\')">' + (on ? 'Pantau' : 'Ubah') + '</button></div>'; }).join('') : NX.empty('calendar', 'Belum ada jadwal', 'Buat ujian baru untuk mulai.', '<button class="btn btn-p mt12" onclick="NX.go(\'a/ujian/baru\')">' + ic('plus', 'sm') + 'Buat Ujian</button>')) +
            '</div></section>' +
          '</div>' +
          '<aside class="col g20">' +
            '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('shieldAlert', 'ink-err') + ' Pelanggaran Terkini</h3><span class="pill pill-err live">Langsung</span></div><div class="mt8" style="max-height:420px;overflow:auto">' +
              (d.feed.length ? d.feed.map((f) => '<div class="row-item" style="align-items:flex-start"><span class="tile sm err">' + ic('alert', 'sm') + '</span><div class="f1" style="min-width:0"><div class="small"><b>' + esc(f.nama) + '</b> <span class="muted">· ' + esc(f.kelas) + '</span></div><div class="xs tx2">' + esc((EX.VLABEL && EX.VLABEL[f.j]) || f.j) + ' — ' + esc(f.ujian) + '</div><div class="xs muted">' + F.lalu(f.t) + '</div></div></div>').join('') : NX.empty('shieldCheck', 'Bersih', 'Belum ada pelanggaran hari ini.')) +
            '</div></section>' +
            '<section class="card card-p"><div class="flex jb ic"><h3>' + ic('megaphone', 'ink-acc') + ' Pengumuman Aktif</h3><a href="#/a/pengumuman" class="small b6">Kelola</a></div><div class="mt8">' + ((d.pengumuman || []).length ? d.pengumuman.slice(0, 3).map((x) => '<div class="row-item" style="align-items:flex-start"><span class="tile sm acc">' + ic('megaphone', 'sm') + '</span><div class="f1" style="min-width:0"><div class="small b6 clamp1">' + esc(x.judul) + '</div><div class="xs muted clamp2">' + esc(x.isi) + '</div></div></div>').join('') : '<p class="small muted">Belum ada pengumuman aktif.</p>') + '</div></section>' +
            '<section class="card card-p"><h3>' + ic('pie', 'ink-p') + ' Jenis Pelanggaran Hari Ini</h3>' + (JN.length ? '<div class="flex ic g16 mt16 wrap jc">' + NX.chart.donut({ items: JN, size: 150, center: { v: String(st.pelanggaranHariIni), l: 'kejadian' } }) + '<div class="f1" style="min-width:150px">' + NX.chart.legend(JN) + '</div></div>' : '<p class="small muted mt12">Belum ada data.</p>') + '</section>' +
          '</aside>' +
        '</div></div>';
      function qa(cls, icn, t, p, b, go) { return '<div class="qa ' + cls + '"><span class="tile">' + ic(icn) + '</span><h4>' + esc(t) + '</h4><p>' + esc(p) + '</p><button class="btn ' + b + ' btn-sm btn-block" onclick="NX.go(\'' + go + '\')">Buka ' + ic('arrowR', 'sm') + '</button></div>'; }
    },
    mount(p, root) { AD.poll('dash', root, () => NX.load('a_dash', 'dashboard.admin', {}, 1).catch(() => {}), 30000, 120000); }
  });

  // =================================================================== MONITORING
  NX.route('a/monitor', {
    role: 'ADMIN', title: 'Monitoring Langsung', nav: 'a/monitor',
    async render() {
      const list = await NX.load('a_ujian', 'ujian.list', {}, 20000, true);
      const now = NX.now();
      const aktif = list.filter((u) => u.status === 'TERBIT' && u.tutup > now - 864e5 && u.buka < now + 864e5);
      return '<div class="page-hd"><div><h1>Monitoring Langsung</h1><p>Pilih ujian untuk memantau peserta, pelanggaran, dan membuka kunci.</p></div><button class="btn btn-s" onclick="NX.drop(\'a_ujian\');NX.render()">' + ic('refresh', 'sm') + 'Segarkan</button></div>' +
        (aktif.length ? '<div class="grid gc2 stagger">' + aktif.map((u) => { const r = u.ringkas || { total: 0, mengerjakan: 0, selesai: 0, terkunci: 0, belum: 0, terputus: 0 }; return '<div class="card card-p hov" style="cursor:pointer" onclick="NX.go(\'a/monitor/' + u.id_ujian + '\')"><div class="flex g12">' + NX.mapelTile(u.mapel, 'lg') + '<div class="f1" style="min-width:0"><div class="flex g8 wrap">' + AD.statusUjian(u) + AD.jenisPill(u.jenis) + '</div><h3 class="mt8 clamp1">' + esc(u.judul) + '</h3><div class="small muted">' + esc(u.mapel) + ' · ' + F.tgl(u.buka) + ' ' + F.jam(u.buka) + '–' + F.jam(u.tutup) + '</div></div></div>' +
          '<div class="grid gc4 keep2 mt16" style="gap:10px">' + [['Mengerjakan', r.mengerjakan, 'ink-p'], ['Selesai', r.selesai, 'ink-ok'], ['Terkunci', r.terkunci, 'ink-err'], ['Belum', r.belum, '']].map((x) => '<div class="card card-ps tc" style="box-shadow:none"><div class="num b8 ' + x[2] + '" style="font-size:22px">' + x[1] + '</div><div class="xs muted">' + x[0] + '</div></div>').join('') + '</div>' +
          '<div class="meter mt16"><i data-w="' + (r.total ? Math.round(r.selesai / r.total * 100) : 0) + '%" style="width:0"></i></div><div class="flex jb xs muted mt4"><span>' + r.selesai + ' dari ' + r.total + ' peserta selesai</span><span class="ink-p b6">Pantau ' + ic('arrowR', 'sm') + '</span></div></div>'; }).join('') + '</div>'
          : '<div class="card">' + NX.empty('radio', 'Tidak ada ujian aktif', 'Ujian yang terbit dan berlangsung dalam 24 jam akan tampil di sini.', '<button class="btn btn-p mt12" onclick="NX.go(\'a/ujian\')">Lihat jadwal ujian</button>') + '</div>');
    },
    mount(p, root) { AD.poll('monlist', root, () => NX.load('a_ujian', 'ujian.list', {}, 1).catch(() => {}), 20000, 90000); }
  });

  const MS = { BELUM: ['Belum mulai', ''], MENGERJAKAN: ['Mengerjakan', 'p'], TERKUNCI: ['Terkunci', 'err'], SELESAI: ['Selesai', 'ok'], TERPUTUS: ['Terputus', 'warn'] };
  NX.route('a/monitor/:id', {
    role: 'ADMIN', title: 'Monitoring Langsung', nav: 'a/monitor', searchable: true,
    async render(p) {
      const d = await NX.load('a_mon_' + p.id, 'monitor.peserta', { id_ujian: p.id }, 12000);
      const u = d.ujian, r = d.ringkas;
      AD._mon = d;
      return '<div class="page-hd"><div><div class="crumb"><a href="#/a/monitor">Monitoring</a> ' + ic('chevR', 'sm') + ' ' + esc(u.judul) + '</div><h1 class="flex ic g12 wrap">' + esc(u.judul) + ' ' + AD.statusUjian(u) + '</h1><p>' + esc(u.mapel) + ' · ' + F.tglPanjang(u.buka) + ' · ' + F.jam(u.buka) + '–' + F.jam(u.tutup) + ' WIB · durasi ' + u.durasi + ' menit · batas ' + d.limit + ' pelanggaran</p></div>' +
        '<div class="flex g8 wrap"><button class="btn btn-s" id="mnAll">' + ic('clock', 'sm') + 'Tambah Waktu Semua</button><button class="btn btn-s" onclick="NX.go(\'a/hasil/' + u.id_ujian + '\')">' + ic('chart', 'sm') + 'Hasil</button><button class="btn btn-p" id="mnRef">' + ic('refresh', 'sm') + 'Segarkan</button></div></div>' +
        '<div class="grid gc3 stagger">' +
          '<section class="card card-p"><div class="flex jb ic"><span class="small b6 muted up">Token Ujian</span>' + (u.pakai_token ? NX.pill('Wajib', 'p') : NX.pill('Tidak dipakai', '')) + '</div><div class="flex ic jb mt12 g8"><span class="num b8" style="font-size:34px;letter-spacing:.18em;color:var(--p-d)">' + esc(u.token) + '</span><div class="flex g6"><button class="icon-btn sm" data-tip="Salin" onclick="NX.copy(\'' + esc(u.token) + '\')">' + ic('copy', 'sm') + '</button><button class="icon-btn sm" data-tip="Buat token baru" id="tkNew">' + ic('refresh', 'sm') + '</button></div></div><p class="xs muted mt8">Umumkan token kepada peserta di ruang ujian.</p></section>' +
          '<section class="card card-p"><div class="flex jb ic"><span class="small b6 muted up">PIN Pengawas</span>' + NX.pill('Buka kunci di perangkat siswa', 'pu', 'nodot') + '</div><div class="flex ic jb mt12 g8"><span class="num b8" id="pinV" style="font-size:34px;letter-spacing:.18em;color:var(--pu-s)">••••••</span><div class="flex g6"><button class="icon-btn sm" data-tip="Tampilkan" id="pinShow">' + ic('eye', 'sm') + '</button><button class="icon-btn sm" data-tip="PIN baru" id="pinNew">' + ic('refresh', 'sm') + '</button></div></div><p class="xs muted mt8">Hanya untuk pengawas — jangan diumumkan ke siswa.</p></section>' +
          '<section class="card card-p"><div class="flex jb ic"><span class="small b6 muted up">Sisa Jendela Ujian</span><span class="pill pill-ok live">Langsung</span></div><div class="num b8 mt12" style="font-size:34px" data-cd="' + u.tutup + '">' + F.hms(u.tutup - NX.now()) + '</div><p class="xs muted mt8">Diperbarui ' + F.jam(d.serverNow) + ' · otomatis tiap 15 dtk</p></section>' +
        '</div>' +
        '<div class="grid gc6 keep2 mt20" style="gap:12px">' + [['Total', r.total, 'users', ''], ['Belum mulai', r.belum, 'clock', 'neu'], ['Mengerjakan', r.mengerjakan, 'activity', ''], ['Terputus', r.terputus, 'wifiOff', 'warn'], ['Terkunci', r.terkunci, 'lock', 'err'], ['Selesai', r.selesai, 'checkCircle', 'ok']].map((x) => '<div class="card card-ps flex ic g12"><span class="tile sm ' + x[3] + '">' + ic(x[2], 'sm') + '</span><div><div class="num b8" style="font-size:22px">' + x[1] + '</div><div class="xs muted">' + x[0] + '</div></div></div>').join('') + '</div>' +
        (r.terkunci ? '<div class="banner err mt20">' + ic('lock') + '<div><b>' + r.terkunci + ' peserta terkunci</b> karena mencapai batas pelanggaran. Periksa log lalu buka kunci bila perlu (dengan kompensasi waktu).</div></div>' : '') +
        '<section class="card mt20"><div id="mnTbl"></div></section>';
    },
    mount(p, root) {
      const d = AD._mon, u = d.ujian;
      const kelas = Array.from(new Set(d.peserta.map((x) => x.kelas))).sort();
      NX.Table(root.querySelector('#mnTbl'), {
        rows: d.peserta, search: ['nama', 'nis', 'nisn', 'kelas'], searchPh: 'Cari nama / NIS…', pageSize: 50, sizes: [25, 50, 100, 500],
        filters: [{ k: 'kelas', label: 'Semua kelas', options: kelas.map((k) => [k, k]) }, { k: 'tampil', label: 'Semua status', options: Object.keys(MS).map((k) => [k, MS[k][0]]) }],
        rowClass: (x) => (x.tampil === 'TERKUNCI' ? 'row-err' : ''),
        tools: '<span class="xs muted">' + ic('info', 'sm') + ' Klik baris untuk melihat log</span>',
        onRow: (x) => AD.logPeserta(x, u),
        columns: [
          { k: 'nama', label: 'Peserta', render: (x) => '<div class="flex ic g12">' + NX.avatar(x.nama, '', 'sm') + '<div><div class="b6">' + esc(x.nama) + '</div><div class="xs muted mono">' + esc(x.nis || x.nisn) + '</div></div></div>' },
          { k: 'kelas', label: 'Kelas' },
          { k: 'tampil', label: 'Status', render: (x) => NX.pill(MS[x.tampil][0], MS[x.tampil][1], x.tampil === 'MENGERJAKAN' ? 'live' : '') },
          { k: 'dijawab', label: 'Progres', render: (x) => x.total ? '<div style="min-width:120px"><div class="flex jb xs"><span>' + x.dijawab + '/' + x.total + '</span><span class="muted">' + Math.round(x.dijawab / x.total * 100) + '%</span></div><div class="meter ' + (x.status === 'SELESAI' ? 'ok' : '') + ' mt4"><i data-w="' + Math.round(x.dijawab / x.total * 100) + '%" style="width:0"></i></div></div>' : '<span class="muted">—</span>' },
          { k: 'pelanggaran', label: 'Pelanggaran', desc: true, render: (x) => '<span class="pill ' + (x.pelanggaran >= d.limit ? 'pill-err' : x.pelanggaran ? 'pill-warn' : 'pill-ok') + ' nodot">' + x.pelanggaran + ' / ' + d.limit + '</span>' },
          { k: 'batas', label: 'Sisa waktu', render: (x) => x.status === 'MENGERJAKAN' || x.status === 'TERKUNCI' ? '<span class="num b6" data-cd="' + x.batas + '">' + F.hms(x.batas - NX.now()) + '</span>' + (x.extra ? ' <span class="xs ink-p">+' + x.extra + 'm</span>' : '') : x.status === 'SELESAI' ? '<span class="xs muted">Selesai ' + F.jam(x.selesai) + '</span>' : '<span class="muted">—</span>' },
          { k: 'sinkron', label: 'Sinkron', desc: true, render: (x) => x.sinkron ? '<span class="xs ' + (x.tampil === 'TERPUTUS' ? 'ink-warn b6' : 'muted') + '">' + F.lalu(x.sinkron) + '</span>' : '<span class="muted">—</span>' },
          { k: 'nilai', label: 'Nilai', cls: 'n', render: (x) => x.nilai !== null && x.status === 'SELESAI' ? '<b class="num">' + F.num(x.nilai) + '</b>' + (x.status_nilai === 'MENUNGGU_KOREKSI' ? ' <span class="xs ink-pu">esai</span>' : '') : '<span class="muted">—</span>' },
          { label: '', sort: false, w: '56px', render: (x) => '<button class="icon-btn sm" data-act="' + esc(x.id_sesi) + '" aria-label="Tindakan">' + ic('more', 'sm') + '</button>' }
        ]
      });
      root.querySelector('#mnTbl').addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        e.stopPropagation();
        const x = d.peserta.find((y) => y.id_sesi === b.dataset.act);
        AD.menuPeserta(b, x, u);
      });
      const refresh = (fresh) => { NX.drop('a_mon_' + p.id); return NX.api('monitor.peserta', { id_ujian: p.id, _fresh: !!fresh }).then((r) => { S.cache['a_mon_' + p.id] = { t: Date.now(), d: r }; NX.rerender(); }).catch(NX.fail); };
      AD.monRefresh = refresh;
      root.querySelector('#mnRef').onclick = (e) => { NX.btnBusy(e.currentTarget, true); refresh(true); };
      root.querySelector('#mnAll').onclick = () => AD.tambahWaktu(null, u);
      root.querySelector('#tkNew').onclick = () => AD.tokenBaru(u, 'token');
      root.querySelector('#pinNew').onclick = () => AD.tokenBaru(u, 'pin');
      root.querySelector('#pinShow').onclick = () => { const v = root.querySelector('#pinV'); v.textContent = v.textContent.indexOf('•') > -1 ? (u.pin_pengawas || '-') : '••••••'; };
      clearInterval(AD._cd);
      const path = S.cur.path;
      AD._cd = setInterval(() => { if (!S.cur || S.cur.path !== path) { clearInterval(AD._cd); return; } root.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = F.hms(+el.dataset.cd - NX.now()); }); }, 1000);
      AD.poll('mon', root, () => refresh(false), 15000, 60000);
    }
  });
  AD.tokenBaru = async function (u, jenis) {
    const y = await NX.confirm(jenis === 'pin' ? 'Buat PIN pengawas baru? PIN lama tidak berlaku lagi.' : 'Buat token baru? Peserta yang belum masuk harus memakai token baru. Peserta yang sedang mengerjakan tidak terpengaruh.', { title: jenis === 'pin' ? 'PIN baru' : 'Token baru', yes: 'Buat baru' });
    if (!y) return;
    try { await NX.api('ujian.token', { id_ujian: u.id_ujian, jenis }); AD.ok(jenis === 'pin' ? 'PIN baru dibuat.' : 'Token baru dibuat.', ['a_mon_' + u.id_ujian, 'a_ujian']); } catch (e) { NX.fail(e); }
  };
  AD.aksi = async function (data, msg, ujianId) {
    try { await NX.api('monitor.aksi', data); NX.toast(msg, 'ok'); if (AD.monRefresh) AD.monRefresh(true); else AD.ok('', ['a_mon_' + ujianId]); } catch (e) { NX.fail(e); }
  };
  AD.menuPeserta = function (btn, x, u) {
    const it = [];
    it.push({ icon: 'history', label: 'Lihat log & pelanggaran', run: () => AD.logPeserta(x, u) });
    if (x.status === 'TERKUNCI') it.push({ icon: 'unlock', label: 'Buka kunci…', run: () => AD.bukaKunci(x, u) });
    if (x.status !== 'SELESAI') it.push({ icon: 'clock', label: 'Tambah waktu…', run: () => AD.tambahWaktu(x, u) });
    it.push({ icon: 'monitor', label: 'Reset login (ganti perangkat)', run: () => NX.confirm('Lepaskan ikatan perangkat <b>' + esc(x.nama) + '</b>? Siswa harus masuk ulang dan memasukkan token; jawaban tetap aman.', { title: 'Reset login', yes: 'Reset login' }).then((y) => y && AD.aksi({ aksi: 'RESET_LOGIN', id_sesi: x.id_sesi }, 'Login direset.', u.id_ujian)) });
    if (x.status === 'MENGERJAKAN' || x.status === 'TERKUNCI') it.push({ icon: 'send', label: 'Paksa kumpulkan', run: () => NX.confirm('Kumpulkan jawaban <b>' + esc(x.nama) + '</b> sekarang dan hitung nilainya?', { title: 'Paksa kumpulkan', yes: 'Kumpulkan', danger: true }).then((y) => y && AD.aksi({ aksi: 'FORCE', id_sesi: x.id_sesi }, 'Jawaban dikumpulkan.', u.id_ujian)) });
    if (x.status !== 'BELUM') { it.push({ sep: 1 }); it.push({ icon: 'refresh', label: 'Reset peserta (mulai ulang)', danger: true, run: () => NX.confirm('Semua jawaban, nilai, dan log <b>' + esc(x.nama) + '</b> untuk ujian ini akan <b>dihapus</b> dan siswa mengulang dari awal. Lanjutkan?', { title: 'Reset peserta', yes: 'Reset', danger: true }).then((y) => y && AD.aksi({ aksi: 'RESET', id_sesi: x.id_sesi }, 'Peserta direset.', u.id_ujian)) }); }
    NX.menu(btn, it);
  };
  AD.bukaKunci = function (x, u) {
    const m = NX.modal({ title: 'Buka Kunci Ujian', icon: 'unlock', size: 'narrow',
      body: '<p class="tx2">Buka kunci untuk <b>' + esc(x.nama) + '</b> (' + esc(x.kelas) + '). Pelanggaran saat ini: <b>' + x.pelanggaran + '</b>.</p><div class="field mt16"><span class="label">Kompensasi waktu</span><div class="seg" id="bkM">' + [0, 5, 10, 15].map((v, i) => '<button type="button" data-v="' + v + '" class="' + (i === 0 ? 'on' : '') + '">' + (v ? '+' + v + ' mnt' : 'Tanpa') + '</button>').join('') + '</div><span class="help">Ganti waktu yang hilang selama terkunci.</span></div>' +
        '<label class="check mt16"><input type="checkbox" id="bkR" checked><span>Reset hitungan pelanggaran ke 0</span></label>',
      foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="bkOk">' + ic('unlock', 'sm') + 'Buka Kunci</button>' });
    m.$('#bkM').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.$$('#bkM button').forEach((z) => z.classList.toggle('on', z === b)); };
    m.$('#bkOk').onclick = () => { const menit = +m.$('#bkM .on').dataset.v; const resetViol = m.$('#bkR').checked; m.close(true); AD.aksi({ aksi: 'UNLOCK', id_sesi: x.id_sesi, menit, resetViol }, 'Kunci dibuka.', u.id_ujian); };
  };
  AD.tambahWaktu = function (x, u) {
    const m = NX.modal({ title: x ? 'Tambah Waktu — ' + x.nama : 'Tambah Waktu Semua Peserta', icon: 'clock', size: 'narrow',
      body: '<p class="tx2">' + (x ? 'Tambahan waktu hanya untuk siswa ini.' : 'Berlaku untuk semua peserta yang belum selesai.') + '</p><div class="seg mt16" id="twM">' + [5, 10, 15, 30].map((v, i) => '<button type="button" data-v="' + v + '" class="' + (i === 0 ? 'on' : '') + '">+' + v + ' mnt</button>').join('') + '</div>',
      foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="twOk">' + ic('plus', 'sm') + 'Tambahkan</button>' });
    m.$('#twM').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.$$('#twM button').forEach((z) => z.classList.toggle('on', z === b)); };
    m.$('#twOk').onclick = () => { const menit = +m.$('#twM .on').dataset.v; m.close(true); AD.aksi(x ? { aksi: 'ADDTIME', id_sesi: x.id_sesi, menit } : { aksi: 'ADDTIME_ALL', id_ujian: u.id_ujian, menit }, 'Waktu ditambah ' + menit + ' menit.', u.id_ujian); };
  };
  AD.logPeserta = async function (x, u) {
    const m = NX.drawer({ title: x.nama, icon: 'history', body: NX.skel(300) });
    try {
      const r = await NX.api('monitor.log', { id_sesi: x.id_sesi });
      const lbl = Object.assign({}, EX.VLABEL, { KUMPUL_OTOMATIS: 'Dikumpulkan otomatis (batas pelanggaran)', TERKUNCI: 'Ujian terkunci', DIBUKA: 'Kunci dibuka', RESET_LOGIN: 'Reset login', TAMBAH_WAKTU: 'Tambah waktu', PAKSA_KUMPUL: 'Paksa kumpul', RESET: 'Peserta direset' });
      m.$('.modal-bd').innerHTML = '<div class="grid gc3" style="gap:10px">' + [['Status', MS[x.tampil][0]], ['Pelanggaran', r.pelanggaran + ' / ' + (AD._mon ? AD._mon.limit : '-')], ['Progres', x.dijawab + '/' + x.total]].map((k) => '<div class="card card-ps"><div class="xs muted">' + k[0] + '</div><div class="b7">' + esc(k[1]) + '</div></div>').join('') + '</div>' +
        '<h4 class="mt20">Linimasa kejadian</h4><div class="mt8">' + (r.log.length ? r.log.map((e) => { const isV = EX.VLABEL[e.j] !== undefined; return '<div class="row-item" style="align-items:flex-start"><span class="tile sm ' + (e.h ? 'err' : isV ? 'warn' : 'neu') + '">' + ic(e.h ? 'alert' : isV ? 'info' : 'check', 'sm') + '</span><div class="f1"><div class="small b6">' + esc(lbl[e.j] || e.j) + (e.h ? ' ' + NX.pill('dihitung', 'err', 'nodot') : '') + '</div><div class="xs tx2">' + esc(e.k || '') + '</div><div class="xs muted">' + F.tglJam(e.t) + '</div></div></div>'; }).join('') : NX.empty('shieldCheck', 'Tidak ada kejadian', 'Peserta ini belum memiliki catatan.')) + '</div>';
    } catch (e) { m.$('.modal-bd').innerHTML = NX.errorBox(e); }
  };

  // =================================================================== JADWAL UJIAN — DAFTAR
  NX.route('a/ujian', {
    role: 'ADMIN', title: 'Jadwal Ujian', nav: 'a/ujian', searchable: true,
    async render(p) {
      const list = await NX.load('a_ujian', 'ujian.list', {}, 20000, true);
      const tab = p.q.tab || 'semua';
      const g = { semua: list, berlangsung: list.filter((u) => u.status === 'TERBIT' && u.status_jadwal === 'BERLANGSUNG'), terjadwal: list.filter((u) => u.status === 'TERBIT' && u.status_jadwal === 'TERJADWAL'), selesai: list.filter((u) => u.status === 'TERBIT' && u.status_jadwal === 'SELESAI' || u.status === 'ARSIP'), draf: list.filter((u) => u.status === 'DRAF') };
      AD._ujTab = g[tab] || list;
      return '<div class="page-hd"><div><h1>Jadwal Ujian</h1><p>Atur ujian, token, aturan anti-contek, dan komposisi soal.</p></div><button class="btn btn-p" onclick="NX.go(\'a/ujian/baru\')">' + ic('plus', 'sm') + 'Buat Ujian</button></div>' +
        '<div class="card"><div class="tabs" style="padding:0 16px">' + [['semua', 'Semua'], ['berlangsung', 'Berlangsung'], ['terjadwal', 'Terjadwal'], ['selesai', 'Selesai'], ['draf', 'Draf']].map((t) => '<button class="tab ' + (t[0] === tab ? 'on' : '') + '" onclick="NX.go(\'a/ujian?tab=' + t[0] + '\')">' + t[1] + '<span class="badge">' + g[t[0]].length + '</span></button>').join('') + '</div><div id="ujTbl"></div></div>';
    },
    mount(p, root) {
      NX.Table(root.querySelector('#ujTbl'), {
        rows: AD._ujTab, search: ['judul', 'mapel', 'id_ujian'], searchPh: 'Cari judul / mapel…', sort: 3, dir: -1,
        filters: [{ k: 'jenis', label: 'Semua jenis', options: [['UH', 'UH'], ['PTS', 'PTS'], ['PAS', 'PAS'], ['LATIHAN', 'Latihan'], ['UMUM', 'Umum']] }, { k: 'id_mapel', label: 'Semua mapel', options: AD.mapel().map((m) => [m.id_mapel, m.nama_mapel]) }],
        onRow: (u) => NX.go('a/ujian/edit/' + u.id_ujian),
        columns: [
          { k: 'judul', label: 'Ujian', render: (u) => '<div class="flex ic g12">' + NX.mapelTile(u.mapel, 'sm') + '<div style="min-width:0"><div class="b6 clamp1">' + esc(u.judul) + '</div><div class="xs muted">' + esc(u.mapel) + ' · ' + esc(u.id_ujian) + '</div></div></div>' },
          { k: 'jenis', label: 'Jenis', render: (u) => AD.jenisPill(u.jenis) },
          { k: 'kelas', label: 'Kelas', sort: false, render: (u) => '<span class="small">' + esc(u.kelas.map(AD.namaKelas).join(', ')) + '</span>' },
          { k: 'buka', label: 'Jadwal', desc: true, render: (u) => '<div class="small b6">' + F.tgl(u.buka) + '</div><div class="xs muted">' + F.jam(u.buka) + '–' + F.jam(u.tutup) + ' · ' + u.durasi + ' mnt</div>' },
          { k: 'jumlah_soal', label: 'Soal', cls: 'n', render: (u) => u.jumlah_soal + (u.mode_soal === 'acak' ? ' <span class="xs muted">acak</span>' : '') },
          { label: 'Token', sort: false, render: (u) => u.pakai_token ? '<span class="mono b7">' + esc(u.token) + '</span>' : '<span class="xs muted">—</span>' },
          { k: 'status_jadwal', label: 'Status', render: (u) => AD.statusUjian(u) + (u.ringkas ? '<div class="xs muted mt4">' + u.ringkas.selesai + '/' + u.ringkas.total + ' selesai</div>' : '') },
          { label: '', sort: false, w: '56px', render: (u) => '<button class="icon-btn sm" data-um="' + esc(u.id_ujian) + '" aria-label="Tindakan">' + ic('more', 'sm') + '</button>' }
        ],
        empty: { icon: 'calendar', title: 'Belum ada ujian', text: 'Klik "Buat Ujian" untuk menjadwalkan ujian pertama.' }
      });
      root.querySelector('#ujTbl').addEventListener('click', (e) => {
        const b = e.target.closest('[data-um]'); if (!b) return;
        e.stopPropagation();
        const u = AD._ujTab.find((x) => x.id_ujian === b.dataset.um);
        NX.menu(b, [
          { icon: 'edit', label: 'Ubah', run: () => NX.go('a/ujian/edit/' + u.id_ujian) },
          { icon: 'radio', label: 'Monitoring', run: () => NX.go('a/monitor/' + u.id_ujian) },
          { icon: 'chart', label: 'Hasil & nilai', run: () => NX.go('a/hasil/' + u.id_ujian) },
          { icon: 'copy', label: 'Duplikat', run: () => NX.go('a/ujian/baru?dari=' + u.id_ujian) },
          { sep: 1 },
          { icon: 'trash', label: 'Hapus', danger: true, run: () => NX.confirm('Hapus ujian <b>' + esc(u.judul) + '</b>? Nilai peserta ikut tersembunyi.', { title: 'Hapus ujian', yes: 'Hapus', danger: true }).then(async (y) => { if (!y) return; try { await NX.api('ujian.hapus', { id_ujian: u.id_ujian }); AD.ok('Ujian dihapus.', ['a_ujian', 'a_dash']); } catch (er) { NX.fail(er); } }) }
        ]);
      });
    }
  });

  // =================================================================== JADWAL UJIAN — FORMULIR
  async function formUjian(p) {
    const edit = p.id ? await NX.api('ujian.detail', { id_ujian: p.id }) : p.q.dari ? await NX.api('ujian.detail', { id_ujian: p.q.dari }) : null;
    const berkas = await NX.api('berkas.list', {});
    const c = S.cfg || {};
    let u;
    if (edit && p.id) u = edit;
    else {
      const t = new Date(NX.now() + 864e5), ymd = new Date(t.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
      const buka = F.fromLocalInput(ymd + 'T' + (c.jam_buka_default || '07:00')), tutup = F.fromLocalInput(ymd + 'T' + (c.jam_tutup_default || '15:00'));
      u = edit ? Object.assign({}, edit, { id_ujian: '', judul: edit.judul + ' (salinan)', status: 'DRAF', buka, tutup, terkunci: false }) : { judul: '', jenis: 'UH', id_mapel: '', kelas: [], buka, tutup, durasi: 90, pakai_token: true, acak_soal: true, acak_opsi: true, tampilkan_nilai: false, batas_pelanggaran: '', aksi_batas: '', kkm: '', mode_soal: 'manual', acak_n: 0, soal_detail: [], catatan: '', status: 'DRAF' };
    }
    AD._uf = { u, berkas, pilih: (u.soal_detail || []).filter((x) => !x.hilang).map((x) => ({ id: x.id, bobot: x.bobot, tipe: x.tipe, cuplikan: x.cuplikan, id_berkas: x.id_berkas })) };
    const lock = !!u.terkunci;
    const bv = u.batas_pelanggaran === '' || u.batas_pelanggaran === undefined ? '' : String(u.batas_pelanggaran);
    return '<div id="uf"><div class="page-hd"><div><div class="crumb"><a href="#/a/ujian">Jadwal Ujian</a> ' + ic('chevR', 'sm') + ' ' + (p.id ? 'Ubah' : 'Baru') + '</div><h1>' + (p.id ? 'Ubah Ujian' : 'Buat Ujian Baru') + '</h1><p>' + (p.id ? esc(u.id_ujian) + ' · ' + AD.statusUjian(u) : 'Lengkapi detail, pilih soal, lalu terbitkan.') + '</p></div>' +
      '<div class="flex g8"><button class="btn btn-s" onclick="history.back()">Batal</button><button class="btn btn-o" data-save="DRAF">' + ic('fileText', 'sm') + 'Simpan Draf</button><button class="btn btn-p" data-save="TERBIT">' + ic('send', 'sm') + (u.status === 'TERBIT' ? 'Simpan & Terbitkan' : 'Terbitkan') + '</button></div></div>' +
      (lock ? '<div class="banner warn mb16">' + ic('lock') + '<div><b>Daftar soal dikunci</b> karena sudah ada siswa yang mulai mengerjakan. Anda masih dapat mengubah judul, jadwal, durasi, kelas, dan aturan.</div></div>' : '') +
      '<div class="split" style="grid-template-columns:minmax(0,1fr) 380px">' +
      '<div class="col g20" style="min-width:0">' +
        '<section class="card card-p"><h3 class="flex ic g8">' + ic('fileText', 'ink-p') + 'Detail Ujian</h3><div class="form-grid mt16">' +
          '<div class="field full"><label class="label">Judul ujian <span class="req">*</span></label><input class="input" name="judul" maxlength="120" value="' + esc(u.judul) + '" placeholder="mis. PAS Ganjil Matematika Kelas X"></div>' +
          '<div class="field"><label class="label">Jenis</label><select class="select" name="jenis">' + AD.optJenis(u.jenis) + '</select></div>' +
          '<div class="field"><label class="label">Mata pelajaran <span class="req">*</span></label><select class="select" name="id_mapel" ' + (lock ? 'disabled' : '') + '>' + AD.optMapel(u.id_mapel, '— pilih —') + '</select></div>' +
          '<div class="field full"><label class="label">Kelas target <span class="req">*</span></label>' + AD.chipsKelas('kelas', u.kelas) + '</div>' +
          '<div class="field"><label class="label">Dibuka</label><input class="input" type="datetime-local" name="buka" value="' + F.toLocalInput(u.buka) + '"></div>' +
          '<div class="field"><label class="label">Ditutup</label><input class="input" type="datetime-local" name="tutup" value="' + F.toLocalInput(u.tutup) + '"></div>' +
          '<div class="field"><label class="label">Durasi pengerjaan (menit)</label><input class="input" type="number" min="1" max="600" name="durasi" value="' + esc(u.durasi) + '"><span class="help">Waktu habis lebih awal bila jendela ujian ditutup.</span></div>' +
          '<div class="field"><label class="label">KKM ujian</label><input class="input" type="number" min="0" max="100" name="kkm" value="' + esc(u.kkm === undefined ? '' : u.kkm) + '" placeholder="kosong = KKM kelas / bawaan (' + esc(c.kkm || 75) + ')"><span class="help">Batas tuntas untuk ujian ini.</span></div>' +
          '<div class="field"><label class="label">Catatan untuk peserta</label><input class="input" name="catatan" maxlength="500" value="' + esc(u.catatan || '') + '" placeholder="opsional, tampil di halaman konfirmasi"></div>' +
        '</div></section>' +
        '<section class="card card-p"><div class="flex jb ic wrap g12"><h3 class="flex ic g8">' + ic('layers', 'ink-p') + 'Komposisi Soal</h3><div class="seg" id="ufMode"><button type="button" data-v="manual" class="' + (u.mode_soal !== 'acak' ? 'on' : '') + '" ' + (lock ? 'disabled' : '') + '>Semua soal terpilih</button><button type="button" data-v="acak" class="' + (u.mode_soal === 'acak' ? 'on' : '') + '" ' + (lock ? 'disabled' : '') + '>Acak N soal per siswa</button></div></div>' +
          '<div class="flex ic g12 mt12" id="ufAcakN" ' + (u.mode_soal === 'acak' ? '' : 'hidden') + '><span class="small">Setiap siswa mendapat</span><input class="input input-sm" type="number" min="1" name="acak_n" value="' + (u.acak_n || '') + '" style="width:90px" ' + (lock ? 'disabled' : '') + '><span class="small">soal acak dari daftar terpilih.</span></div>' +
          '<div class="grid gc2 mt16" style="gap:16px">' +
            '<div><div class="flex g8"><select class="select input-sm f1" id="ufBerkas" ' + (lock ? 'disabled' : '') + '><option value="">— pilih berkas soal —</option>' + berkas.map((b) => '<option value="' + esc(b.id_berkas) + '">' + esc(b.nama) + ' · ' + esc(b.mapel) + ' (' + b.jumlah + ')</option>').join('') + '</select><button class="btn btn-s btn-sm" id="ufAll" ' + (lock ? 'disabled' : '') + '>Pilih semua</button></div><div id="ufSoal" class="mt12" style="max-height:440px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:4px 12px">' + NX.empty('layers', 'Pilih berkas soal', 'Soal dari berkas akan tampil di sini.') + '</div></div>' +
            '<div><div class="flex jb ic"><b class="small">Soal terpilih</b><span class="xs muted" id="ufSum"></span></div><div id="ufPilih" class="mt12" style="max-height:476px;overflow:auto"></div></div>' +
          '</div></section>' +
      '</div>' +
      '<aside class="col g20">' +
        '<section class="card card-p"><h3 class="flex ic g8">' + ic('shieldCheck', 'ink-p') + 'Keamanan & Anti-Contek</h3><div class="mt8">' +
          AD.sw('pakai_token', u.pakai_token, 'Wajib token ujian', 'Siswa memasukkan token 6 karakter dari pengawas.') +
          '<div class="toggle-row"><span class="tile sm">' + ic('shieldAlert', 'sm') + '</span><span class="f1"><span class="b6">Batas pelanggaran</span><br><span class="small muted">Ujian terkunci saat batas tercapai.</span></span><select class="select input-sm" name="batas_pelanggaran" style="width:auto"><option value="">Global (' + esc(c.batas_pelanggaran || 3) + ')</option>' + [1, 2, 3, 4, 5, 10].map((n) => '<option value="' + n + '" ' + (bv === String(n) ? 'selected' : '') + '>' + n + ' kali</option>').join('') + '</select></div>' +
          '<div class="toggle-row"><span class="tile sm err">' + ic('lock', 'sm') + '</span><span class="f1"><span class="b6">Saat batas tercapai</span><br><span class="small muted">Kunci (dibuka pengawas) atau kumpulkan otomatis.</span></span><select class="select input-sm" name="aksi_batas" style="width:auto"><option value="">Global (' + (c.aksi_batas === 'KUMPUL' ? 'Kumpulkan' : 'Kunci') + ')</option><option value="KUNCI" ' + (u.aksi_batas === 'KUNCI' ? 'selected' : '') + '>Kunci ujian</option><option value="KUMPUL" ' + (u.aksi_batas === 'KUMPUL' ? 'selected' : '') + '>Kumpulkan otomatis</option></select></div>' +
          '<div class="toggle-row"><span class="tile sm ok">' + ic('maximize', 'sm') + '</span><span class="f1"><span class="b6">Layar penuh & blokir salin-tempel</span><br><span class="small muted">Selalu aktif untuk semua ujian.</span></span>' + NX.pill('Aktif', 'ok') + '</div>' +
          AD.sw('acak_soal', u.acak_soal, 'Acak urutan soal', 'Setiap siswa mendapat urutan berbeda.') +
          AD.sw('acak_opsi', u.acak_opsi, 'Acak pilihan jawaban', 'Pilihan A–E diacak per siswa.') +
          AD.sw('tampilkan_nilai', u.tampilkan_nilai, 'Tampilkan nilai ke siswa', 'Nilai muncul setelah siswa mengumpulkan.') +
        '</div></section>' +
        '<section class="card card-p"><h3>Ringkasan</h3><div class="mt12" id="ufRing"></div></section>' +
        (p.id && u.status === 'TERBIT' ? '<section class="card card-p"><div class="flex jb ic"><span class="small b6 muted up">Token</span><span class="num b8" style="font-size:22px;letter-spacing:.14em">' + esc(u.token) + '</span></div><div class="flex jb ic mt8"><span class="small b6 muted up">PIN pengawas</span><span class="num b8" style="font-size:18px;letter-spacing:.14em;color:var(--pu-s)">' + esc(u.pin_pengawas) + '</span></div></section>' : '') +
      '</aside></div></div>';
  }
  function mountUjian(p, page) {
    const root = page.querySelector('#uf');
    const st = AD._uf, lock = !!st.u.terkunci;
    AD.bindChips(root);
    const cache = {};
    const sum = () => {
      const tot = st.pilih.reduce((a, x) => a + (+x.bobot || 0), 0), per = { PG: 0, MCMA: 0, KATEGORI: 0, ESAI: 0 };
      st.pilih.forEach((x) => { per[x.tipe] = (per[x.tipe] || 0) + 1; });
      root.querySelector('#ufSum').textContent = st.pilih.length + ' soal · total bobot ' + F.num(tot);
      const mode = root.querySelector('#ufMode .on').dataset.v, n = +AD.v(root, 'acak_n') || 0;
      root.querySelector('#ufRing').innerHTML = [['Jumlah soal', mode === 'acak' ? Math.min(n, st.pilih.length) + ' dari ' + st.pilih.length + ' (acak)' : st.pilih.length + ' butir'], ['Komposisi', Object.keys(per).filter((k) => per[k]).map((k) => per[k] + ' ' + k).join(' · ') || '-'], ['Total bobot', F.num(tot)], ['Kelas', AD.chipVals(root, 'kelas').map(AD.namaKelas).join(', ') || '-']].map((r) => '<div class="row-item"><span class="small tx2 f1">' + r[0] + '</span><b class="small tr">' + esc(r[1]) + '</b></div>').join('');
    };
    const drawPilih = () => {
      const el = root.querySelector('#ufPilih');
      el.innerHTML = st.pilih.length ? st.pilih.map((x, i) => '<div class="row-item" style="gap:8px"><span class="soal-card" style="padding:0"><span class="no" style="width:30px;height:30px;font-size:13px">' + (i + 1) + '</span></span><div class="f1" style="min-width:0"><div class="small clamp2">' + esc(x.cuplikan || x.id) + '</div><div class="xs muted">' + esc(EX.TIPE_L[x.tipe] || x.tipe) + '</div></div><input class="input input-sm num tc" type="number" min="0.5" step="0.5" value="' + x.bobot + '" data-bobot="' + i + '" style="width:70px" title="Bobot" ' + (lock ? 'disabled' : '') + '>' + (lock ? '' : '<button class="icon-btn sm" data-rm="' + i + '" aria-label="Keluarkan">' + ic('x', 'sm') + '</button>') + '</div>').join('') : NX.empty('listCheck', 'Belum ada soal', 'Centang soal dari berkas di sebelah kiri.');
      sum();
    };
    const drawSoal = (id) => {
      const el = root.querySelector('#ufSoal'), list = cache[id] || [];
      const on = {}; st.pilih.forEach((x) => { on[x.id] = 1; });
      el.innerHTML = list.length ? list.map((s) => '<label class="row-item" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-s="' + esc(s.id_soal) + '" ' + (on[s.id_soal] ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--p);margin-top:3px" ' + (lock ? 'disabled' : '') + '><div class="f1" style="min-width:0"><div class="small clamp2">' + esc(NX.plain(s.teks).slice(0, 160) || '(gambar)') + '</div><div class="xs muted mt4">No. ' + s.nomor + ' · ' + esc(s.tipe) + ' · skor ' + F.num(s.skor_maks) + (s.flag ? ' · ' + esc(s.flag) : '') + '</div></div></label>').join('') : NX.empty('layers', 'Berkas kosong', 'Tambahkan soal di Bank Soal.');
    };
    const loadBerkas = async (id) => {
      if (!id) return;
      const el = root.querySelector('#ufSoal');
      if (!cache[id]) { el.innerHTML = NX.skel(200); try { cache[id] = await NX.api('soal.list', { id_berkas: id }); } catch (e) { el.innerHTML = NX.errorBox(e); return; } }
      drawSoal(id);
    };
    const bsel = root.querySelector('#ufBerkas');
    bsel.onchange = () => loadBerkas(bsel.value);
    const first = st.pilih[0] && st.pilih[0].id_berkas;
    if (first) { bsel.value = first; loadBerkas(first); }
    root.querySelector('#ufSoal').addEventListener('change', (e) => {
      const cb = e.target.closest('[data-s]'); if (!cb) return;
      const s = (cache[bsel.value] || []).find((x) => x.id_soal === cb.dataset.s);
      if (cb.checked) { if (!st.pilih.some((x) => x.id === s.id_soal)) st.pilih.push({ id: s.id_soal, bobot: s.skor_maks, tipe: s.tipe, cuplikan: NX.plain(s.teks).slice(0, 120), id_berkas: s.id_berkas }); }
      else st.pilih = st.pilih.filter((x) => x.id !== s.id_soal);
      drawPilih();
    });
    root.querySelector('#ufAll').onclick = () => { (cache[bsel.value] || []).forEach((s) => { if (!st.pilih.some((x) => x.id === s.id_soal)) st.pilih.push({ id: s.id_soal, bobot: s.skor_maks, tipe: s.tipe, cuplikan: NX.plain(s.teks).slice(0, 120), id_berkas: s.id_berkas }); }); drawSoal(bsel.value); drawPilih(); };
    root.querySelector('#ufPilih').addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; st.pilih.splice(+b.dataset.rm, 1); drawPilih(); if (bsel.value) drawSoal(bsel.value); });
    root.querySelector('#ufPilih').addEventListener('change', (e) => { const b = e.target.closest('[data-bobot]'); if (!b) return; st.pilih[+b.dataset.bobot].bobot = Math.max(0.5, +b.value || 1); sum(); });
    root.querySelector('#ufMode').onclick = (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; root.querySelectorAll('#ufMode button').forEach((z) => z.classList.toggle('on', z === b)); root.querySelector('#ufAcakN').hidden = b.dataset.v !== 'acak'; sum(); };
    root.addEventListener('input', NX.debounce(sum, 200));
    root.querySelectorAll('[data-chips] .chip').forEach((c) => c.addEventListener('click', () => setTimeout(sum, 0)));
    drawPilih();
    root.querySelectorAll('[data-save]').forEach((b) => b.onclick = async () => {
      const status = b.dataset.save;
      const data = {
        id_ujian: p.id || '', judul: AD.v(root, 'judul'), jenis: AD.v(root, 'jenis'), id_mapel: AD.v(root, 'id_mapel'), kelas: AD.chipVals(root, 'kelas'),
        buka: F.fromLocalInput(AD.v(root, 'buka')), tutup: F.fromLocalInput(AD.v(root, 'tutup')), durasi: +AD.v(root, 'durasi'), catatan: AD.v(root, 'catatan'),
        pakai_token: AD.v(root, 'pakai_token'), acak_soal: AD.v(root, 'acak_soal'), acak_opsi: AD.v(root, 'acak_opsi'), tampilkan_nilai: AD.v(root, 'tampilkan_nilai'),
        batas_pelanggaran: AD.v(root, 'batas_pelanggaran'), aksi_batas: AD.v(root, 'aksi_batas'), kkm: AD.v(root, 'kkm'), mode_soal: root.querySelector('#ufMode .on').dataset.v, acak_n: +AD.v(root, 'acak_n') || 0,
        soal: st.pilih.map((x) => ({ id: x.id, bobot: +x.bobot })), status
      };
      if (!data.judul) { NX.toast('Judul ujian wajib diisi.', 'warn'); root.querySelector('[name=judul]').focus(); return; }
      if (!data.kelas.length) { NX.toast('Pilih minimal satu kelas.', 'warn'); return; }
      if (data.tutup <= data.buka) { NX.toast('Waktu tutup harus setelah waktu buka.', 'warn'); return; }
      if (status === 'TERBIT' && !data.soal.length) { NX.toast('Pilih minimal satu soal sebelum menerbitkan.', 'warn'); return; }
      if (status === 'TERBIT' && !(await NX.confirm('Terbitkan ujian <b>' + esc(data.judul) + '</b>? Siswa di kelas terpilih akan melihatnya pada jadwal.', { title: 'Terbitkan ujian', yes: 'Terbitkan' }))) return;
      root.querySelectorAll('[data-save]').forEach((z) => { z.disabled = true; });
      NX.btnBusy(b, true, 'Menyimpan…');
      try {
        const r = await NX.api('ujian.simpan', data, { timeout: 90000 });
        NX.drop('a_ujian'); NX.drop('a_dash');
        NX.toast(status === 'TERBIT' ? 'Ujian diterbitkan. Token: ' + r.token : 'Draf tersimpan.', 'ok');
        NX.go('a/ujian/edit/' + r.id_ujian);
      } catch (e) { NX.fail(e); NX.btnBusy(b, false); root.querySelectorAll('[data-save]').forEach((z) => { z.disabled = false; }); }
    });
  }
  NX.route('a/ujian/baru', { role: 'ADMIN', title: 'Buat Ujian', nav: 'a/ujian', render: formUjian, mount: mountUjian });
  NX.route('a/ujian/edit/:id', { role: 'ADMIN', title: 'Ubah Ujian', nav: 'a/ujian', render: formUjian, mount: mountUjian });
})();
