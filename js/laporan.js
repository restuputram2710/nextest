'use strict';
/* NEXTEST — laporan.js : hasil & nilai, koreksi esai, analisis butir soal, laporan pelanggaran */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt, AD = window.AD;
  const BINS = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
  const ALASAN = { MANUAL: 'Dikumpulkan', WAKTU: 'Waktu habis', PAKSA: 'Paksa kumpul', PELANGGARAN: 'Batas pelanggaran' };
  const pilihUjian = (judul, sub, go, filter) => async function () {
    const list = (await NX.load('a_ujian', 'ujian.list', {}, 20000, true)).filter((u) => u.status !== 'DRAF' && u.buka <= NX.now() && (!filter || filter(u)));
    return '<div class="page-hd"><div><h1>' + judul + '</h1><p>' + sub + '</p></div></div><section class="card"><div id="puTbl"></div></section>';
  };
  const mountPilih = (go) => function (p, root) {
    const list = S.cache.a_ujian.d.filter((u) => u.status !== 'DRAF' && u.buka <= NX.now());
    NX.Table(root.querySelector('#puTbl'), {
      rows: list, search: ['judul', 'mapel'], searchPh: 'Cari ujian…', sort: 2, dir: -1, onRow: (u) => NX.go(go + u.id_ujian),
      filters: [{ k: 'jenis', label: 'Semua jenis', options: [['UH', 'UH'], ['PTS', 'PTS'], ['PAS', 'PAS'], ['LATIHAN', 'Latihan'], ['UMUM', 'Umum']] }],
      columns: [
        { k: 'judul', label: 'Ujian', render: (u) => '<div class="flex ic g12">' + NX.mapelTile(u.mapel, 'sm') + '<div><div class="b6">' + esc(u.judul) + '</div><div class="xs muted">' + esc(u.mapel) + ' · ' + esc(u.kelas.map(AD.namaKelas).join(', ')) + '</div></div></div>' },
        { k: 'jenis', label: 'Jenis', render: (u) => AD.jenisPill(u.jenis) },
        { k: 'buka', label: 'Tanggal', desc: true, render: (u) => '<span class="small">' + F.tgl(u.buka) + '</span>' },
        { k: 'status_jadwal', label: 'Status', render: (u) => AD.statusUjian(u) },
        { label: '', sort: false, render: () => '<span class="ink-p small b6 nowrap">Buka ' + ic('arrowR', 'sm') + '</span>' }
      ], empty: { icon: 'chart', title: 'Belum ada ujian', text: 'Ujian yang sudah dibuka akan tampil di sini.' }
    });
  };

  // =================================================================== HASIL UJIAN
  NX.route('a/hasil', { role: 'ADMIN', title: 'Hasil Ujian', nav: 'a/hasil', searchable: true, render: pilihUjian('Hasil & Nilai', 'Pilih ujian untuk melihat nilai, ketuntasan, remedial, dan rincian jawaban.'), mount: mountPilih('a/hasil/') });

  NX.route('a/hasil/:id', {
    role: 'ADMIN', title: 'Hasil Ujian', nav: 'a/hasil', searchable: true,
    async render(p) {
      const d = await NX.load('a_has_' + p.id, 'hasil.ujian', { id_ujian: p.id }, 20000);
      const u = d.ujian, st = d.stat, tab = p.q.tab || 'semua';
      const kkmUmum = d.rows.length ? d.rows[0].kkm : +((S.cfg && S.cfg.kkm) || 75);
      AD._has = d;
      return '<div class="page-hd"><div><div class="crumb"><a href="#/a/hasil">Hasil Ujian</a> ' + ic('chevR', 'sm') + ' ' + esc(u.judul) + '</div><h1 class="flex ic g12 wrap">' + esc(u.judul) + ' ' + AD.statusUjian(u) + '</h1><p>' + esc(u.mapel) + ' · ' + F.tglPanjang(u.buka) + ' · ' + esc(u.kelas.map(AD.namaKelas).join(', ')) + '</p></div>' +
        '<div class="flex g8 wrap"><button class="btn btn-s" id="hsRef">' + ic('refresh', 'sm') + 'Segarkan</button><button class="btn btn-s" onclick="NX.go(\'a/analisis/' + u.id_ujian + '\')">' + ic('trend', 'sm') + 'Analisis Butir</button><button class="btn ' + (st.menungguKoreksi ? 'btn-pu' : 'btn-s') + '" onclick="NX.go(\'a/koreksi/' + u.id_ujian + '\')">' + ic('pen', 'sm') + 'Koreksi Esai' + (st.menungguKoreksi ? ' (' + st.menungguKoreksi + ')' : '') + '</button><button class="btn btn-p" id="hsExp">' + ic('download', 'sm') + 'Ekspor Excel</button></div></div>' +
        (st.menungguKoreksi ? '<div class="banner mb16" style="background:var(--pu-50);color:var(--pu-s)">' + ic('pen') + '<div><b>' + st.menungguKoreksi + ' siswa</b> masih menunggu koreksi esai — nilainya sementara. <a href="#/a/koreksi/' + u.id_ujian + '" class="b7">Koreksi sekarang</a></div></div>' : '') +
        '<div class="grid gc4 keep2 stagger">' +
          NX.stat({ label: 'Peserta selesai', value: st.selesai, unit: '/ ' + st.peserta, icon: 'users', sub: st.belum + ' belum mengerjakan' }) +
          NX.stat({ label: 'Rata-rata kelas', value: st.rata, dec: 1, icon: 'calc', color: 'pu', sub: 'SD ' + F.num(st.sd) + ' · ' + F.num(st.terendah) + '–' + F.num(st.tertinggi) }) +
          NX.stat({ label: 'Ketuntasan klasikal', value: st.persenTuntas, dec: 1, unit: '%', icon: 'award', color: st.persenTuntas >= 85 ? 'ok' : 'warn', sub: st.tuntas + ' tuntas · ' + (st.persenTuntas >= 85 ? 'Kelas tuntas (≥85%)' : 'Belum tuntas klasikal (<85%)') }) +
          NX.stat({ label: 'Perlu remedial', value: st.remedial, icon: 'refresh', color: st.remedial ? 'acc' : 'ok', sub: 'Nilai di bawah KKM' }) +
        '</div>' +
        '<div class="grid gc2 mt20"><section class="card card-p"><div class="flex jb ic"><h3>' + ic('chart', 'ink-p') + ' Sebaran Nilai</h3><span class="xs muted">batang biru = di atas KKM ' + kkmUmum + '</span></div><div class="mt12">' + (st.selesai ? NX.chart.bars({ labels: BINS, values: d.bins, colors: d.bins.map((_, i) => (i * 10 + 9 >= kkmUmum ? 'var(--p)' : '#CBD5E1')), h: 220, unit: ' siswa' }) : NX.empty('chart', 'Belum ada nilai', '')) + '</div></section>' +
          '<section class="card card-p"><h3>' + ic('school', 'ink-p') + ' Rata-rata per Kelas</h3><div class="mt16">' + (d.perKelas.length ? NX.chart.hbars({ items: d.perKelas.map((k) => ({ label: k.kelas + ' (' + k.n + ')', value: k.rata, color: k.rata >= kkmUmum ? 'var(--p)' : 'var(--warn)' })), max: 100 }) : NX.empty('school', 'Belum ada data', '')) + '</div></section></div>' +
        '<section class="card mt20"><div class="tabs" style="padding:0 16px">' + [['semua', 'Semua peserta', d.rows.length], ['remedial', 'Remedial', st.remedial], ['belum', 'Belum mengerjakan', d.rows.filter((r) => r.status !== 'SELESAI').length]].map((t) => '<button class="tab ' + (t[0] === tab ? 'on' : '') + '" onclick="NX.go(\'a/hasil/' + u.id_ujian + '?tab=' + t[0] + '\')">' + t[1] + '<span class="badge">' + t[2] + '</span></button>').join('') + '</div><div id="hsTbl"></div></section>';
    },
    mount(p, root) {
      const d = AD._has, u = d.ujian, tab = p.q.tab || 'semua';
      const rows = tab === 'remedial' ? d.rows.filter((r) => r.status === 'SELESAI' && r.nilai !== null && r.nilai < r.kkm) : tab === 'belum' ? d.rows.filter((r) => r.status !== 'SELESAI') : d.rows;
      const kelas = Array.from(new Set(d.rows.map((r) => r.kelas))).sort();
      NX.Table(root.querySelector('#hsTbl'), {
        rows, search: ['nama', 'nis', 'nisn', 'kelas'], searchPh: 'Cari nama / NIS…', pageSize: 50, sizes: [25, 50, 100, 500], sort: tab === 'belum' ? 1 : 0,
        filters: [{ k: 'kelas', label: 'Semua kelas', options: kelas.map((k) => [k, k]) }, { label: 'Semua nilai', options: [['t', 'Tuntas'], ['r', 'Remedial'], ['90', 'Nilai ≥ 90'], ['75', 'Nilai 75–89'], ['60', 'Nilai 60–74'], ['0', 'Nilai < 60']], fn: (r, v) => { if (r.status !== 'SELESAI' || r.nilai === null) return false; const n = r.nilai; return v === 't' ? n >= r.kkm : v === 'r' ? n < r.kkm : v === '90' ? n >= 90 : v === '75' ? n >= 75 && n < 90 : v === '60' ? n >= 60 && n < 75 : n < 60; } }],
        rowClass: (r) => (r.status === 'SELESAI' && r.nilai !== null && r.nilai < r.kkm ? 'row-err' : ''),
        onRow: (r) => r.status !== 'BELUM' && detailSesi(r, u),
        columns: [
          { k: 'peringkat', label: '#', cls: 'n', w: '50px', render: (r) => r.peringkat ? '<b class="num ' + (r.peringkat <= 3 ? 'ink-acc' : '') + '">' + r.peringkat + '</b>' : '<span class="muted">—</span>' },
          { k: 'nama', label: 'Nama', render: (r) => '<div class="b6">' + esc(r.nama) + '</div><div class="xs muted mono">' + esc(r.nis || r.nisn) + '</div>' },
          { k: 'kelas', label: 'Kelas' },
          { label: 'B / S / K', sort: false, render: (r) => r.status === 'SELESAI' ? '<span class="num small"><span class="ink-ok b7">' + r.benar + '</span> / <span class="ink-err b7">' + r.salah + '</span> / ' + r.kosong + (r.menunggu ? ' <span class="ink-pu xs">+' + r.menunggu + ' esai</span>' : '') + '</span>' : '<span class="muted">—</span>' },
          { k: 'nilai', label: 'Nilai', cls: 'n', desc: true, render: (r) => r.status === 'SELESAI' && r.nilai !== null ? '<b class="num" style="font-size:16px;color:' + (r.nilai >= r.kkm ? 'var(--p-d)' : 'var(--err-s)') + '">' + F.num(r.nilai) + '</b>' : '<span class="muted">—</span>' },
          { label: 'Keterangan', sort: false, render: (r) => r.status !== 'SELESAI' ? NX.pill(r.status === 'BELUM' ? 'Belum mengerjakan' : r.status === 'TERKUNCI' ? 'Terkunci' : 'Sedang mengerjakan', r.status === 'TERKUNCI' ? 'err' : '') : r.status_nilai === 'MENUNGGU_KOREKSI' ? NX.pill('Menunggu koreksi', 'pu') : r.nilai >= r.kkm ? NX.pill('Tuntas', 'ok') : NX.pill('Remedial', 'err') },
          { k: 'pelanggaran', label: 'Pelanggaran', desc: true, render: (r) => r.pelanggaran ? NX.pill(r.pelanggaran + 'x', 'warn', 'nodot') : '<span class="xs muted">0</span>' },
          { k: 'durasi', label: 'Durasi', render: (r) => r.status === 'SELESAI' ? '<span class="xs">' + F.dur(r.durasi) + '</span><div class="xs muted">' + esc(ALASAN[r.alasan] || r.alasan) + '</div>' : '<span class="muted">—</span>' }
        ], empty: { icon: 'award', title: tab === 'remedial' ? 'Tidak ada siswa remedial' : 'Tidak ada data' }
      });
      root.querySelector('#hsRef').onclick = async (e) => { NX.btnBusy(e.currentTarget, true); try { const r = await NX.api('hasil.ujian', { id_ujian: u.id_ujian, _fresh: true }); S.cache['a_has_' + u.id_ujian] = { t: Date.now(), d: r }; NX.rerender(); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); } };
      root.querySelector('#hsExp').onclick = () => {
        const done = d.rows.filter((r) => r.status === 'SELESAI').sort((a, b) => (a.peringkat || 999) - (b.peringkat || 999));
        const head = ['Peringkat', 'NIS', 'NISN', 'Nama', 'Kelas', 'Benar', 'Salah', 'Kosong', 'Nilai', 'KKM', 'Keterangan', 'Pelanggaran', 'Durasi (menit)', 'Status kumpul'];
        const row = (r) => [r.peringkat || '', r.nis, r.nisn, r.nama, r.kelas, r.benar, r.salah, r.kosong, r.nilai, r.kkm, r.status_nilai === 'MENUNGGU_KOREKSI' ? 'Menunggu koreksi' : r.nilai >= r.kkm ? 'Tuntas' : 'Remedial', r.pelanggaran, Math.round(r.durasi / 60), ALASAN[r.alasan] || r.alasan];
        NX.exportXlsx('Nilai_' + u.judul, [
          { name: 'Nilai', cols: [9, 12, 13, 30, 10, 7, 7, 7, 8, 6, 16, 11, 12, 14], rows: [[u.judul + ' — ' + u.mapel], ['Tanggal: ' + F.tglPanjang(u.buka) + ' · Rata-rata ' + F.num(d.stat.rata) + ' · Ketuntasan ' + d.stat.persenTuntas + '%'], [], head].concat(done.map(row)) },
          { name: 'Remedial', cols: [9, 12, 13, 30, 10, 7, 7, 7, 8, 6, 16, 11, 12, 14], rows: [head].concat(done.filter((r) => r.nilai < r.kkm).map(row)) },
          { name: 'Belum Mengerjakan', cols: [12, 13, 30, 10, 16], rows: [['NIS', 'NISN', 'Nama', 'Kelas', 'Status']].concat(d.rows.filter((r) => r.status !== 'SELESAI').map((r) => [r.nis, r.nisn, r.nama, r.kelas, r.status])) }
        ]);
      };
    }
  });
  async function detailSesi(r, u) {
    const m = NX.drawer({ title: r.nama, icon: 'fileText', size: 'wide', body: NX.skel(320) });
    try {
      const d = await NX.api('hasil.detail', { id_sesi: r.id_sesi });
      const lbl = Object.assign({}, EX.VLABEL, { KUMPUL_OTOMATIS: 'Dikumpulkan otomatis (batas pelanggaran)', TERKUNCI: 'Ujian terkunci', DIBUKA: 'Kunci dibuka', RESET_LOGIN: 'Reset login', TAMBAH_WAKTU: 'Tambah waktu', PAKSA_KUMPUL: 'Paksa kumpul', RESET: 'Direset' });
      const fmtJ = (it, v) => { if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.some(Boolean))) return '<span class="muted">(kosong)</span>'; if (it.tipe === 'KATEGORI') return (it.pernyataan || []).map((pp, i) => '<div class="xs">' + (i + 1) + '. ' + esc(NX.plain(pp).slice(0, 60)) + ' → <b>' + esc(v[i] || '-') + '</b></div>').join(''); if (it.tipe === 'ESAI') return '<div class="small" style="white-space:pre-wrap">' + esc(v) + '</div>'; return '<b>' + esc([].concat(v).join(', ')) + '</b>'; };
      m.$('.modal-bd').innerHTML = '<div class="grid gc4 keep2" style="gap:10px">' + [['Nilai', d.nilai === null ? '-' : F.num(d.nilai)], ['Benar', (d.info.b || 0)], ['Salah', (d.info.s || 0)], ['Pelanggaran', d.pelanggaran]].map((k) => '<div class="card card-ps tc"><div class="num b8" style="font-size:22px">' + esc(k[1]) + '</div><div class="xs muted">' + k[0] + '</div></div>').join('') + '</div>' +
        '<p class="xs muted mt12">' + esc(d.siswa.kelas) + ' · NIS ' + esc(d.siswa.nis) + ' · mulai ' + F.tglJam(d.mulai) + (d.selesai ? ' · selesai ' + F.jam(d.selesai) : '') + '</p>' +
        '<h4 class="mt20">Jawaban per butir</h4><div class="tbl-wrap mt8"><table class="tbl compact"><thead><tr><th>No</th><th>Soal</th><th>Jawaban</th><th>Kunci</th><th class="n">Skor</th></tr></thead><tbody>' +
        d.items.map((it) => '<tr class="' + (it.kosong ? '' : it.benar ? '' : 'row-err') + '"><td class="num b7">' + it.no + '</td><td><div class="xs muted">' + esc(BK.TL[it.tipe] || it.tipe) + '</div><div class="small clamp2" style="max-width:260px">' + esc(it.teks) + '</div></td><td>' + fmtJ(it, it.jawaban) + '</td><td class="small">' + (it.tipe === 'ESAI' ? '<span class="muted">rubrik</span>' : esc([].concat(it.kunci || []).join(it.tipe === 'KATEGORI' ? ' | ' : ', '))) + '</td><td class="n num">' + (it.skor === null || it.skor === undefined ? '<span class="ink-pu xs">koreksi</span>' : F.num(it.skor)) + '<span class="xs muted">/' + F.num(it.bobot) + '</span></td></tr>').join('') + '</tbody></table></div>' +
        '<h4 class="mt20">Log integritas</h4><div class="mt8">' + (d.log.length ? d.log.map((e) => '<div class="row-item"><span class="tile sm ' + (e.h ? 'err' : 'neu') + '">' + ic(e.h ? 'alert' : 'info', 'sm') + '</span><div class="f1"><div class="small b6">' + esc(lbl[e.j] || e.j) + '</div><div class="xs muted">' + F.tglJam(e.t) + ' · ' + esc(e.k || '') + '</div></div></div>').join('') : '<p class="small muted">Tidak ada kejadian tercatat.</p>') + '</div>';
    } catch (e) { m.$('.modal-bd').innerHTML = NX.errorBox(e); }
  }

  // =================================================================== KOREKSI ESAI
  NX.route('a/koreksi/:id', {
    role: 'ADMIN', title: 'Koreksi Esai', nav: 'a/hasil',
    async render(p) {
      const d = await NX.api('koreksi.list', { id_ujian: p.id });
      AD._kor = { d, si: 0, wi: 0, hide: NX.LS.get('nx_kor_hide', true), filter: 'belum' };
      return '<div id="kor"></div>';
    },
    mount(p, page) {
      const K = AD._kor, d = K.d, root = page.querySelector('#kor');
      if (!d.soal.length) { root.innerHTML = '<div class="page-hd"><div><div class="crumb"><a href="#/a/hasil/' + esc(p.id) + '">Hasil</a> ' + ic('chevR', 'sm') + ' Koreksi</div><h1>Koreksi Esai</h1></div></div><div class="card">' + NX.empty('pen', 'Tidak ada soal esai', 'Ujian ini tidak memiliki soal esai.') + '</div>'; return; }
      const nama = (j, i) => (K.hide ? 'Peserta #' + (i + 1) : j.nama);
      const daftar = () => d.jawaban.map((j, i) => ({ j, i })).filter((x) => { const it = x.j.items[d.soal[K.si].id]; return it && (K.filter === 'semua' || it.skor === null || !it.manual); });
      const progress = (sid) => { const all = d.jawaban.filter((j) => j.items[sid]); const done = all.filter((j) => j.items[sid].skor !== null && (j.items[sid].manual || !String(j.items[sid].jawab).trim())); return [done.length, all.length]; };
      const draw = () => {
        const so = d.soal[K.si], list = daftar();
        if (K.wi >= list.length) K.wi = Math.max(0, list.length - 1);
        const cur = list[K.wi], it = cur && cur.j.items[so.id];
        const pr = progress(so.id);
        const q = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(so.bobot * f * 2) / 2);
        root.innerHTML = '<div class="page-hd"><div><div class="crumb"><a href="#/a/hasil/' + esc(d.ujian.id_ujian) + '">Hasil</a> ' + ic('chevR', 'sm') + ' Koreksi Esai</div><h1>Koreksi Esai</h1><p>' + esc(d.ujian.judul) + ' · ' + esc(d.ujian.mapel) + '</p></div><div class="flex g8 ic wrap"><label class="check small"><input type="checkbox" id="kHide" ' + (K.hide ? 'checked' : '') + '><span>Sembunyikan nama (koreksi objektif)</span></label><button class="btn btn-s" onclick="NX.go(\'a/hasil/' + esc(d.ujian.id_ujian) + '\')">Selesai</button></div></div>' +
          '<div class="chips mb16">' + d.soal.map((s, i) => { const pp = progress(s.id); return '<button class="chip ' + (i === K.si ? 'on' : '') + '" data-si="' + i + '">Esai ' + (i + 1) + ' <b>' + pp[0] + '/' + pp[1] + '</b></button>'; }).join('') + '</div>' +
          '<div class="split" style="grid-template-columns:280px minmax(0,1fr)"><aside class="card" style="position:sticky;top:90px"><div class="card-hd"><div class="seg" id="kFil"><button data-v="belum" class="' + (K.filter === 'belum' ? 'on' : '') + '">Belum</button><button data-v="semua" class="' + (K.filter === 'semua' ? 'on' : '') + '">Semua</button></div><span class="xs muted">' + pr[0] + '/' + pr[1] + '</span></div><div class="meter" style="margin:0 20px"><i style="width:' + (pr[1] ? Math.round(pr[0] / pr[1] * 100) : 0) + '%"></i></div><div style="max-height:60vh;overflow:auto;padding:8px 12px">' +
            (list.length ? list.map((x, k) => { const z = x.j.items[so.id]; const done = z.skor !== null && z.manual; return '<button class="row-item" data-wi="' + k + '" style="width:100%;border:0;background:' + (k === K.wi ? 'var(--p-50)' : 'transparent') + ';border-radius:10px;padding:10px;cursor:pointer;text-align:left"><span class="avatar sm">' + (K.hide ? '#' : esc(x.j.nama.charAt(0))) + '</span><span class="f1" style="min-width:0"><span class="b6 small clamp1" style="display:block">' + esc(nama(x.j, x.i)) + '</span><span class="xs muted">' + (K.hide ? '' : esc(x.j.kelas)) + '</span></span>' + (done ? '<b class="num small ink-ok">' + F.num(z.skor) + '</b>' : !String(z.jawab).trim() ? '<span class="xs muted">kosong</span>' : '<span class="xs ink-pu">belum</span>') + '</button>'; }).join('') : NX.empty('checkCircle', 'Semua sudah dikoreksi', 'Pilih "Semua" untuk meninjau ulang.')) + '</div></aside>' +
          '<div class="col g16" style="min-width:0"><section class="card card-p"><div class="flex jb ic"><span class="xs b7 up muted">Soal esai ' + (K.si + 1) + ' · bobot ' + F.num(so.bobot) + '</span><button class="btn btn-g btn-xs" id="kRub">' + ic('book', 'sm') + 'Rubrik & acuan</button></div><div class="rendered qtext mt8" style="font-size:15px">' + NX.rich(so.teks) + '</div>' + (so.gambar ? '<div class="figure mt12" style="max-width:360px"><img src="' + NX.driveImg(so.gambar, 800) + '"></div>' : '') +
            '<div id="kRubBox" ' + (NX.LS.get('nx_kor_rub', true) ? '' : 'hidden') + '>' + (so.rubrik ? '<div class="banner neu mt12" style="display:block"><b class="xs up">Rubrik</b><div class="small mt4" style="white-space:pre-wrap">' + esc(so.rubrik) + '</div></div>' : '') + (so.acuan ? '<div class="banner ok mt8" style="display:block"><b class="xs up">Jawaban acuan</b><div class="small mt4" style="white-space:pre-wrap">' + esc(so.acuan) + '</div></div>' : '') + '</div></section>' +
            (cur ? '<section class="card card-p"><div class="flex jb ic"><h3>' + esc(nama(cur.j, cur.i)) + '</h3><span class="xs muted">' + (K.wi + 1) + ' dari ' + list.length + '</span></div><div class="card card-ps mt12" style="background:var(--muted-bg);box-shadow:none;white-space:pre-wrap;font-size:15px;line-height:1.7;min-height:120px">' + (String(it.jawab).trim() ? esc(it.jawab) : '<span class="muted">(Tidak dijawab — otomatis skor 0)</span>') + '</div>' +
              '<div class="field mt16"><span class="label">Skor (0–' + F.num(so.bobot) + ')</span><div class="flex g8 wrap ic">' + q.map((v) => '<button class="btn btn-s btn-sm" data-q="' + v + '">' + F.num(v) + '</button>').join('') + '<input class="input num tc b7" type="number" id="kSkor" min="0" max="' + so.bobot + '" step="0.5" value="' + (it.skor === null ? '' : it.skor) + '" style="width:100px;font-size:18px"></div></div>' +
              '<div class="field mt16"><label class="label">Catatan untuk siswa (opsional)</label><textarea class="textarea" id="kCat" rows="2" maxlength="1000">' + esc(it.catatan || '') + '</textarea></div>' +
              '<div class="flex jb ic mt16 wrap g8"><div class="flex g8"><button class="btn btn-s" id="kPrev" ' + (K.wi ? '' : 'disabled') + '>' + ic('arrowL', 'sm') + '</button><button class="btn btn-s" id="kNext" ' + (K.wi < list.length - 1 ? '' : 'disabled') + '>' + ic('arrowR', 'sm') + '</button></div><span class="xs muted">' + NX.esc('Ctrl+Enter') + ' = simpan & berikutnya</span><button class="btn btn-p" id="kSave">' + ic('check', 'sm') + 'Simpan & Berikutnya</button></div></section>' : '') + '</div></div>';
        root.querySelectorAll('[data-si]').forEach((b) => b.onclick = () => { K.si = +b.dataset.si; K.wi = 0; draw(); });
        root.querySelectorAll('[data-wi]').forEach((b) => b.onclick = () => { K.wi = +b.dataset.wi; draw(); });
        root.querySelector('#kFil').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; K.filter = b.dataset.v; K.wi = 0; draw(); };
        root.querySelector('#kHide').onchange = (e) => { K.hide = e.target.checked; NX.LS.set('nx_kor_hide', K.hide); draw(); };
        root.querySelector('#kRub').onclick = () => { const b = root.querySelector('#kRubBox'); b.hidden = !b.hidden; NX.LS.set('nx_kor_rub', !b.hidden); };
        if (!cur) return;
        const inp = root.querySelector('#kSkor');
        root.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { inp.value = b.dataset.q; root.querySelectorAll('[data-q]').forEach((z) => z.classList.toggle('btn-p', z === b)); });
        root.querySelector('#kPrev').onclick = () => { K.wi--; draw(); };
        root.querySelector('#kNext').onclick = () => { K.wi++; draw(); };
        const save = async () => {
          const v = inp.value === '' ? null : +inp.value;
          if (v === null) { NX.toast('Isi skor terlebih dahulu.', 'warn'); inp.focus(); return; }
          if (v < 0 || v > so.bobot) { NX.toast('Skor harus 0–' + so.bobot + '.', 'warn'); return; }
          const btn = root.querySelector('#kSave'); NX.btnBusy(btn, true);
          try {
            const r = await NX.api('koreksi.simpan', { id_sesi: cur.j.id_sesi, id_soal: so.id, skor: v, catatan: root.querySelector('#kCat').value });
            Object.assign(it, { skor: v, catatan: root.querySelector('#kCat').value, manual: true });
            cur.j.nilai = r.nilai; cur.j.status_nilai = r.status_nilai;
            NX.drop('a_has_' + d.ujian.id_ujian);
            NX.toast('Tersimpan · nilai ' + F.num(r.nilai) + (r.menunggu ? ' (sementara)' : ''), 'ok', 1800);
            if (K.filter === 'semua') K.wi = Math.min(K.wi + 1, daftar().length - 1);
            draw();
            const ni = root.querySelector('#kSkor'); if (ni) ni.focus();
          } catch (e) { NX.fail(e); NX.btnBusy(btn, false); }
        };
        root.querySelector('#kSave').onclick = save;
        root.querySelector('#kCat').onkeydown = inp.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target === inp)) { e.preventDefault(); save(); } };
        setTimeout(() => inp.focus(), 50);
      };
      draw();
    }
  });

  // =================================================================== ANALISIS BUTIR
  NX.route('a/analisis', { role: 'ADMIN', title: 'Analisis Butir Soal', nav: 'a/analisis', searchable: true, render: pilihUjian('Analisis Butir Soal', 'Tingkat kesukaran (p), daya beda (D), efektivitas pengecoh, dan reliabilitas tes — dihitung dari jawaban peserta.'), mount: mountPilih('a/analisis/') });
  const KC = { Diterima: 'ok', Direvisi: 'warn', Dibuang: 'err' };
  const KCOL = { Diterima: '#16A34A', Direvisi: '#F59E0B', Dibuang: '#DC2626' };
  NX.route('a/analisis/:id', {
    role: 'ADMIN', title: 'Analisis Butir Soal', nav: 'a/analisis',
    skeleton: () => '<div class="card card-p tc" style="padding:60px"><div class="loader-full" style="position:static;background:none"><div style="width:48px;height:48px;border-radius:50%;border:5px solid var(--p-100);border-top-color:var(--p);animation:spin .8s linear infinite;margin:0 auto"></div></div><h3 class="mt16">Menghitung analisis butir…</h3><p class="small muted mt4">Membaca jawaban seluruh peserta. Mohon tunggu.</p></div>',
    async render(p) {
      const key = 'a_an_' + p.id;
      const c = S.cache[key];
      const fresh = c && (p.q.ulang ? c.u === p.q.ulang : Date.now() - c.t < 600000);
      const d = fresh ? c.d : await NX.api('analisis.hitung', { id_ujian: p.id }, { timeout: 120000 });
      if (!fresh) S.cache[key] = { t: Date.now(), d, u: p.q.ulang || '' };
      AD._an = d;
      const r = d.ringkas, u = d.ujian;
      const dn = [{ label: 'Diterima', value: r.diterima, color: KCOL.Diterima }, { label: 'Direvisi', value: r.direvisi, color: KCOL.Direvisi }, { label: 'Dibuang', value: r.dibuang, color: KCOL.Dibuang }];
      const pts = d.butir.filter((b) => b.p !== null && b.d !== null).map((b) => ({ x: b.p, y: b.d, color: KCOL[b.keputusan] || '#94A3B8', label: '<b>Soal ' + b.nomor + '</b> (' + esc(b.tipe) + ')<br>p = ' + b.p.toFixed(2) + ' · D = ' + b.d.toFixed(2) + '<br>' + esc(b.keputusan), attr: 'data-bt="' + b.nomor + '"' }));
      return '<div class="page-hd"><div><div class="crumb"><a href="#/a/analisis">Analisis Butir</a> ' + ic('chevR', 'sm') + ' ' + esc(u.judul) + '</div><h1>' + esc(u.judul) + '</h1><p>' + esc(u.mapel) + ' · dihitung ' + F.tglJam(d.dihitung) + ' · hasil tersimpan di sheet AnalisisButir & tanda soal di Bank Soal diperbarui.</p></div><div class="flex g8 wrap"><button class="btn btn-s" onclick="NX.go(\'a/hasil/' + u.id_ujian + '\')">' + ic('chart', 'sm') + 'Hasil</button><button class="btn btn-s" onclick="NX.go(\'a/analisis/' + u.id_ujian + '?ulang=' + Date.now() + '\')">' + ic('refresh', 'sm') + 'Hitung Ulang</button><button class="btn btn-p" id="anExp">' + ic('download', 'sm') + 'Ekspor Excel</button></div></div>' +
        d.peringatan.map((w) => '<div class="banner warn mb12">' + ic('alert', 'sm') + '<div class="small">' + esc(w) + '</div></div>').join('') +
        '<div class="grid gc4 keep2 stagger">' +
          NX.stat({ label: 'Peserta dianalisis', value: r.peserta, icon: 'users', sub: 'Rata-rata ' + F.num(r.rata) + ' · SD ' + F.num(r.sd) }) +
          NX.stat({ label: 'Reliabilitas (α / KR-20)', value: r.reliabilitas, dec: 2, icon: 'target', color: r.reliabilitas === null ? '' : r.reliabilitas >= 0.7 ? 'ok' : 'warn', text: '-', sub: r.tafsir + (r.reliabilitas !== null ? ' (≥ 0,70 = reliabel)' : '') }) +
          NX.stat({ label: 'Ketuntasan', value: r.persenTuntas, dec: 1, unit: '%', icon: 'award', color: 'pu', sub: F.num(r.terendah) + '–' + F.num(r.tertinggi) }) +
          NX.stat({ label: 'Soal layak pakai', value: r.diterima, unit: '/ ' + d.butir.length, icon: 'checkCircle', color: 'ok', sub: r.direvisi + ' direvisi · ' + r.dibuang + ' dibuang' }) +
        '</div>' +
        '<div class="split mt20" style="grid-template-columns:minmax(0,1fr) 340px"><section class="card card-p"><div class="flex jb ic wrap g8"><h3>Peta Kesukaran × Daya Beda</h3><div class="flex g12 xs">' + dn.map((x) => '<span class="flex ic g4"><i style="width:10px;height:10px;border-radius:50%;background:' + x.color + ';display:inline-block"></i>' + x.label + '</span>').join('') + '</div></div><p class="xs muted mt4">Zona hijau D ≥ 0,30 · kuning 0,20–0,29 · merah < 0,20. Klik titik untuk rincian.</p><div class="mt12">' + (pts.length ? NX.chart.scatter({ points: pts, h: 320 }) : NX.empty('trend', 'Belum ada data', 'Butuh peserta yang sudah selesai.')) + '</div></section>' +
          '<aside class="col g20"><section class="card card-p"><h3>Keputusan Soal</h3><div class="flex ic g16 mt16 jc wrap">' + NX.chart.donut({ items: dn, size: 150, center: { v: String(d.butir.length), l: 'butir' } }) + '<div class="f1" style="min-width:120px">' + NX.chart.legend(dn) + '</div></div></section>' +
          '<section class="card card-p"><h3>Tingkat Kesukaran</h3><div class="mt12">' + NX.chart.hbars({ items: [{ label: 'Mudah (p > 0,70)', value: r.mudah, color: '#16A34A' }, { label: 'Sedang (0,30–0,70)', value: r.sedang, color: 'var(--p)' }, { label: 'Sukar (p < 0,30)', value: r.sukar, color: '#DC2626' }], max: Math.max(1, d.butir.length), unit: ' soal' }) + '</div><p class="xs muted mt12">Komposisi ideal: ±25% mudah, 50% sedang, 25% sukar.</p></section></aside></div>' +
        '<section class="card mt20"><div class="card-hd"><h3>Rincian per Butir</h3><span class="xs muted">Kelompok atas/bawah 27% (atau 50% bila peserta < 30)</span></div><div id="anTbl"></div></section>';
    },
    mount(p, root) {
      const d = AD._an, u = d.ujian;
      const mini = (b) => {
        if (!b.distribusi || b.tipe === 'ESAI') return '<span class="xs muted">—</span>';
        const keys = Object.keys(b.distribusi);
        if (b.tipe === 'KATEGORI') return '<div class="mini-bars">' + keys.map((k) => '<span><i class="key" style="height:' + Math.max(2, b.distribusi[k] * 0.4) + 'px" title="' + k + ': ' + b.distribusi[k] + '% benar"></i>' + k + '</span>').join('') + '</div>';
        const n = b.n || 1, key = [].concat(b.kunci || []);
        return '<div class="mini-bars">' + keys.map((k) => '<span><i class="' + (key.indexOf(k) > -1 ? 'key' : (b.pengecoh_lemah || []).indexOf(k) > -1 ? 'weak' : '') + '" style="height:' + Math.max(2, Math.round(b.distribusi[k] / n * 40)) + 'px" title="' + k + ': ' + b.distribusi[k] + ' siswa"></i>' + k + '</span>').join('') + '</div>';
      };
      NX.Table(root.querySelector('#anTbl'), {
        rows: d.butir, search: ['cuplikan', 'tipe'], searchPh: 'Cari soal…', pageSize: 50, globalSearch: false,
        filters: [{ k: 'keputusan', label: 'Semua keputusan', options: [['Diterima', 'Diterima'], ['Direvisi', 'Direvisi'], ['Dibuang', 'Dibuang']] }, { k: 'tipe', label: 'Semua tipe', options: [['PG', 'PG'], ['MCMA', 'PG Kompleks'], ['KATEGORI', 'Kategori'], ['ESAI', 'Esai']] }],
        onRow: (b) => detailButir(b),
        columns: [
          { k: 'nomor', label: 'No', cls: 'n', w: '50px', render: (b) => '<b class="num">' + b.nomor + '</b>' },
          { k: 'cuplikan', label: 'Soal', render: (b) => '<div class="xs muted">' + esc(BK.TL[b.tipe]) + ' · n=' + b.n + '</div><div class="small clamp2" style="max-width:320px">' + esc(b.cuplikan) + '</div>' },
          { k: 'p', label: 'Kesukaran (p)', cls: 'n', render: (b) => b.p === null ? '<span class="muted">—</span>' : '<b class="num">' + b.p.toFixed(2) + '</b><div class="xs muted">' + esc(b.kategori_p) + '</div>' },
          { k: 'd', label: 'Daya beda (D)', cls: 'n', desc: true, render: (b) => b.d === null ? '<span class="muted">—</span>' : '<b class="num ' + (b.d >= 0.3 ? 'ink-ok' : b.d >= 0.2 ? 'ink-warn' : 'ink-err') + '">' + b.d.toFixed(2) + '</b><div class="xs muted">' + esc(b.kategori_d) + '</div>' },
          { label: 'Sebaran jawaban', sort: false, render: mini },
          { k: 'keputusan', label: 'Keputusan', render: (b) => NX.pill(b.keputusan, KC[b.keputusan] || '') },
          { label: 'Rekomendasi', sort: false, render: (b) => '<span class="xs tx2" style="display:block;max-width:260px">' + esc(b.rekomendasi || '') + '</span>' }
        ]
      });
      root.querySelectorAll('[data-bt]').forEach((c) => c.addEventListener('click', () => detailButir(d.butir.find((b) => b.nomor === +c.dataset.bt))));
      root.querySelector('#anExp').onclick = () => NX.exportXlsx('Analisis_' + u.judul, [
        { name: 'Analisis Butir', cols: [6, 10, 50, 6, 8, 12, 8, 14, 22, 12, 50], rows: [['No', 'Tipe', 'Cuplikan soal', 'n', 'p', 'Kesukaran', 'D', 'Daya beda', 'Sebaran', 'Keputusan', 'Rekomendasi']].concat(d.butir.map((b) => [b.nomor, b.tipe, b.cuplikan, b.n, b.p, b.kategori_p || '', b.d, b.kategori_d || '', b.distribusi ? Object.keys(b.distribusi).map((k) => k + ':' + b.distribusi[k]).join(' ') : '', b.keputusan, b.rekomendasi || ''])) },
        { name: 'Ringkasan', cols: [28, 16], rows: [['Ujian', u.judul], ['Mapel', u.mapel], ['Peserta', d.ringkas.peserta], ['Rata-rata', d.ringkas.rata], ['Simpangan baku', d.ringkas.sd], ['Reliabilitas', d.ringkas.reliabilitas === null ? '-' : d.ringkas.reliabilitas], ['Tafsiran', d.ringkas.tafsir], ['% Tuntas', d.ringkas.persenTuntas], ['Diterima', d.ringkas.diterima], ['Direvisi', d.ringkas.direvisi], ['Dibuang', d.ringkas.dibuang], ['Mudah / Sedang / Sukar', d.ringkas.mudah + ' / ' + d.ringkas.sedang + ' / ' + d.ringkas.sukar]] }
      ]);
    }
  });
  function detailButir(b) {
    if (!b) return;
    const key = [].concat(b.kunci || []);
    let tbl = '';
    if (b.distribusi && (b.tipe === 'PG' || b.tipe === 'MCMA')) {
      tbl = '<table class="tbl compact mt12"><thead><tr><th>Pilihan</th><th class="n">Semua</th><th class="n">Kelompok atas</th><th class="n">Kelompok bawah</th><th>Fungsi</th></tr></thead><tbody>' + Object.keys(b.distribusi).map((k) => { const isK = key.indexOf(k) > -1, lemah = (b.pengecoh_lemah || []).indexOf(k) > -1; return '<tr><td><b>' + (k === '-' ? 'Kosong' : k) + '</b>' + (isK ? ' ' + NX.pill('Kunci', 'ok') : '') + '</td><td class="n">' + b.distribusi[k] + ' <span class="xs muted">(' + F.num(b.distribusi[k] / (b.n || 1) * 100, 0) + '%)</span></td><td class="n">' + (b.atas[k] || 0) + '</td><td class="n">' + (b.bawah[k] || 0) + '</td><td class="xs">' + (k === '-' ? '' : isK ? ((b.atas[k] || 0) >= (b.bawah[k] || 0) ? '<span class="ink-ok">Baik — lebih banyak dipilih kelompok atas</span>' : '<span class="ink-err">Periksa kunci</span>') : lemah ? '<span class="ink-err">Pengecoh tidak berfungsi (&lt;5%)</span>' : (b.bawah[k] || 0) >= (b.atas[k] || 0) ? '<span class="ink-ok">Pengecoh berfungsi</span>' : '<span class="ink-warn">Lebih menarik kelompok atas</span>') + '</td></tr>'; }).join('') + '</tbody></table>';
    } else if (b.distribusi && b.tipe === 'KATEGORI') tbl = '<table class="tbl compact mt12"><thead><tr><th>Pernyataan</th><th>Kunci</th><th class="n">% benar</th></tr></thead><tbody>' + Object.keys(b.distribusi).map((k, i) => '<tr><td>' + k + '</td><td>' + esc(key[i] || '') + '</td><td class="n">' + b.distribusi[k] + '%</td></tr>').join('') + '</tbody></table>';
    NX.modal({ title: 'Soal No. ' + b.nomor, icon: 'target', size: 'wide', body: '<div class="flex g6 wrap">' + BK.tipePill(b.tipe) + NX.pill(b.keputusan, KC[b.keputusan] || '') + '</div><p class="small tx2 mt12">' + esc(b.cuplikan) + '</p>' +
      '<div class="grid gc3 mt16" style="gap:10px"><div class="card card-ps tc"><div class="num b8" style="font-size:24px">' + (b.p === null ? '-' : b.p.toFixed(2)) + '</div><div class="xs muted">Kesukaran · ' + esc(b.kategori_p || '-') + '</div></div><div class="card card-ps tc"><div class="num b8" style="font-size:24px">' + (b.d === null ? '-' : b.d.toFixed(2)) + '</div><div class="xs muted">Daya beda · ' + esc(b.kategori_d || '-') + '</div></div><div class="card card-ps tc"><div class="num b8" style="font-size:24px">' + b.n + '</div><div class="xs muted">Peserta · kelompok ' + (b.kelompok || 0) + '</div></div></div>' + tbl +
      '<div class="banner ' + (KC[b.keputusan] === 'ok' ? 'ok' : KC[b.keputusan] === 'warn' ? 'warn' : 'err') + ' mt16">' + ic('info', 'sm') + '<div class="small"><b>Rekomendasi:</b> ' + esc(b.rekomendasi || '-') + '</div></div>' });
  }

  // =================================================================== PELANGGARAN
  NX.route('a/pelanggaran', {
    role: 'ADMIN', title: 'Laporan Pelanggaran', nav: 'a/pelanggaran', searchable: true,
    async render(p) {
      const hari = +(p.q.hari || 7), now = NX.now();
      const q = p.q.ujian ? { id_ujian: p.q.ujian } : { dari: now - hari * 864e5, sampai: now + 3600e3 };
      const d = await NX.load('a_pel_' + (p.q.ujian || hari), 'pelanggaran.list', q, 30000);
      AD._pel = d;
      const rows = d.rows, dihitung = rows.filter((r) => r.dihitung).length;
      const siswa = new Set(rows.map((r) => r.id_sesi.split('|')[1])).size;
      const per = {}; rows.forEach((r) => { per[r.jenis] = (per[r.jenis] || 0) + 1; });
      const perKelas = {}; rows.forEach((r) => { perKelas[r.kelas] = (perKelas[r.kelas] || 0) + 1; });
      const hk = Object.keys(perKelas).sort();
      const jn = Object.keys(per).sort((a, b) => per[b] - per[a]).map((k) => ({ label: EX.VLABEL[k] || k, value: per[k] }));
      const top = {}; rows.filter((r) => r.dihitung).forEach((r) => { const k = r.nama + '|' + r.kelas; top[k] = (top[k] || 0) + 1; });
      const topL = Object.keys(top).sort((a, b) => top[b] - top[a]).slice(0, 6);
      return '<div class="page-hd"><div><h1>Laporan Pelanggaran</h1><p>Semua kejadian integritas yang terekam selama ujian. Kejadian "dihitung" menambah jumlah pelanggaran siswa.</p></div><div class="flex g8 wrap"><select class="select" id="plU" style="width:auto;max-width:280px"><option value="">Rentang waktu</option>' + d.ujian.map((u) => '<option value="' + esc(u.id_ujian) + '" ' + (u.id_ujian === p.q.ujian ? 'selected' : '') + '>' + esc(u.judul) + '</option>').join('') + '</select>' + (p.q.ujian ? '' : '<div class="seg" id="plH">' + [1, 7, 30].map((h) => '<button data-v="' + h + '" class="' + (h === hari ? 'on' : '') + '">' + (h === 1 ? 'Hari ini' : h + ' hari') + '</button>').join('') + '</div>') + '<button class="btn btn-p" id="plExp">' + ic('download', 'sm') + 'Ekspor</button></div></div>' +
        '<div class="grid gc4 keep2 stagger">' + NX.stat({ label: 'Total kejadian', value: rows.length, icon: 'activity' }) + NX.stat({ label: 'Dihitung pelanggaran', value: dihitung, icon: 'shieldAlert', color: 'err' }) + NX.stat({ label: 'Siswa terlibat', value: siswa, icon: 'users', color: 'acc' }) + NX.stat({ label: 'Ujian', value: new Set(rows.map((r) => r.id_ujian)).size, icon: 'clipboard', color: 'pu' }) + '</div>' +
        '<div class="grid gc3 mt20"><section class="card card-p"><h3>Per Jenis</h3>' + (rows.length ? '<div class="flex ic g16 mt16 wrap jc">' + NX.chart.donut({ items: jn, size: 150, center: { v: String(rows.length), l: 'kejadian' } }) + '<div class="f1" style="min-width:140px">' + NX.chart.legend(jn) + '</div></div>' : NX.empty('shieldCheck', 'Bersih', 'Tidak ada kejadian.')) + '</section>' +
          '<section class="card card-p"><h3>Per Kelas</h3><div class="mt16">' + (hk.length ? NX.chart.hbars({ items: hk.map((k) => ({ label: k, value: perKelas[k], color: 'var(--err)' })), unit: '' }) : NX.empty('school', 'Tidak ada data', '')) + '</div></section>' +
          '<section class="card card-p"><h3>Siswa Terbanyak (dihitung)</h3><div class="mt8">' + (topL.length ? topL.map((k) => '<div class="row-item">' + NX.avatar(k.split('|')[0], '', 'sm') + '<div class="f1"><div class="small b6">' + esc(k.split('|')[0]) + '</div><div class="xs muted">' + esc(k.split('|')[1]) + '</div></div>' + NX.pill(top[k] + 'x', 'err', 'nodot') + '</div>').join('') : '<p class="small muted mt8">Tidak ada.</p>') + '</div></section></div>' +
        '<section class="card mt20"><div id="plTbl"></div></section>';
    },
    mount(p, root) {
      const d = AD._pel;
      NX.Table(root.querySelector('#plTbl'), {
        rows: d.rows, search: ['nama', 'nis', 'kelas', 'ujian', 'keterangan'], searchPh: 'Cari siswa / ujian…', pageSize: 50, sizes: [25, 50, 100, 500],
        filters: [{ k: 'jenis', label: 'Semua jenis', options: Object.keys(EX.VLABEL).map((k) => [k, EX.VLABEL[k]]) }, { label: 'Semua', options: [['1', 'Dihitung saja'], ['0', 'Tercatat saja']], fn: (r, v) => (v === '1' ? r.dihitung : !r.dihitung) }],
        columns: [
          { k: 't', label: 'Waktu', desc: true, render: (r) => '<span class="xs nowrap">' + F.tglJam(r.t) + '</span>' },
          { k: 'nama', label: 'Siswa', render: (r) => '<div class="b6">' + esc(r.nama) + '</div><div class="xs muted">' + esc(r.kelas) + ' · ' + esc(r.nis) + '</div>' },
          { k: 'ujian', label: 'Ujian', render: (r) => '<span class="small clamp1" style="max-width:220px;display:block">' + esc(r.ujian) + '</span>' },
          { k: 'jenis', label: 'Jenis', render: (r) => NX.pill(EX.VLABEL[r.jenis] || r.jenis, r.dihitung ? 'err' : '', 'nodot') },
          { k: 'keterangan', label: 'Keterangan', render: (r) => '<span class="xs tx2">' + esc(r.keterangan) + '</span>' },
          { k: 'dihitung', label: 'Dihitung', render: (r) => (r.dihitung ? '<span class="ink-err">' + ic('checkCircle', 'sm') + '</span>' : '<span class="muted">—</span>') },
          { label: '', sort: false, render: (r) => '<button class="btn btn-g btn-xs" onclick="NX.go(\'a/monitor/' + esc(r.id_ujian) + '\')">Monitor</button>' }
        ], empty: { icon: 'shieldCheck', title: 'Tidak ada pelanggaran', text: 'Semua peserta mengerjakan dengan bersih.' }
      });
      root.querySelector('#plU').onchange = (e) => NX.go('a/pelanggaran' + (e.target.value ? '?ujian=' + e.target.value : ''));
      const h = root.querySelector('#plH'); if (h) h.onclick = (e) => { const b = e.target.closest('button'); if (b) NX.go('a/pelanggaran?hari=' + b.dataset.v); };
      root.querySelector('#plExp').onclick = () => NX.exportXlsx('Pelanggaran', [{ name: 'Pelanggaran', cols: [18, 30, 12, 10, 34, 24, 40, 9], rows: [['Waktu', 'Nama', 'NIS', 'Kelas', 'Ujian', 'Jenis', 'Keterangan', 'Dihitung']].concat(d.rows.map((r) => [F.tglJam(r.t), r.nama, r.nis, r.kelas, r.ujian, EX.VLABEL[r.jenis] || r.jenis, r.keterangan, r.dihitung ? 'Ya' : 'Tidak'])) }]);
    }
  });
})();
