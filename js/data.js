'use strict';
/* NEXTEST — data.js : data siswa (+impor), kelas & mapel, pengumuman, pengaturan (identitas, ujian, admin, akun, log, arsip) */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt, AD = window.AD;

  // =================================================================== DATA SISWA
  NX.route('a/siswa', {
    role: 'ADMIN', title: 'Data Siswa', nav: 'a/siswa', searchable: true,
    async render() {
      const list = await NX.load('a_siswa', 'siswa.list', {}, 30000, true);
      const aktif = list.filter((s) => s.status === 'AKTIF');
      const L = aktif.filter((s) => s.jenis_kelamin === 'L').length, P = aktif.filter((s) => s.jenis_kelamin === 'P').length;
      const pernah = aktif.filter((s) => s.login_terakhir).length;
      return '<div class="page-hd"><div><h1>Data Siswa</h1><p>Siswa masuk cukup dengan <b>NIS atau NISN</b>. Kelola data, impor massal, dan reset login perangkat.</p></div>' +
        '<div class="flex g8 wrap"><a class="btn btn-s" href="templates/template-siswa.xlsx" download>' + ic('download', 'sm') + 'Template</a><button class="btn btn-s" id="swImp">' + ic('upload', 'sm') + 'Impor Excel/CSV</button><button class="btn btn-p" id="swAdd">' + ic('plus', 'sm') + 'Tambah Siswa</button></div></div>' +
        '<div class="grid gc4 keep2 stagger">' +
          NX.stat({ label: 'Siswa aktif', value: aktif.length, icon: 'users', sub: list.length - aktif.length + ' nonaktif' }) +
          NX.stat({ label: 'Laki-laki', value: L, icon: 'user', color: 'cy', sub: aktif.length ? F.num(L / aktif.length * 100, 0) + '%' : '-' }) +
          NX.stat({ label: 'Perempuan', value: P, icon: 'user', color: 'pu', sub: aktif.length ? F.num(P / aktif.length * 100, 0) + '%' : '-' }) +
          NX.stat({ label: 'Pernah login', value: pernah, icon: 'login', color: 'ok', sub: (aktif.length - pernah) + ' belum pernah' }) +
        '</div><section class="card mt20"><div id="swTbl"></div></section>';
    },
    mount(p, root) {
      const list = S.cache.a_siswa.d;
      NX.Table(root.querySelector('#swTbl'), {
        rows: list, search: ['nama', 'nis', 'nisn', 'kelas'], searchPh: 'Cari nama, NIS, NISN…', pageSize: 25,
        filters: [{ k: 'id_kelas', label: 'Semua kelas', options: AD.kelas().map((k) => [k.id_kelas, k.nama_kelas]) }, { k: 'status', label: 'Semua status', options: [['AKTIF', 'Aktif'], ['NONAKTIF', 'Nonaktif']] }, { k: 'jenis_kelamin', label: 'L/P', options: [['L', 'Laki-laki'], ['P', 'Perempuan']] }],
        tools: '<button class="btn btn-s btn-sm" id="swExp">' + ic('download', 'sm') + 'Ekspor</button>',
        onRow: (s) => formSiswa(s),
        columns: [
          { k: 'nama', label: 'Nama siswa', render: (s) => '<div class="flex ic g12">' + NX.avatar(s.nama, '', 'sm') + '<div><div class="b6">' + esc(s.nama) + '</div><div class="xs muted">' + esc(s.id_siswa) + '</div></div></div>' },
          { k: 'nis', label: 'NIS', render: (s) => '<span class="mono">' + esc(s.nis || '-') + '</span>' },
          { k: 'nisn', label: 'NISN', render: (s) => '<span class="mono">' + esc(s.nisn || '-') + '</span>' },
          { k: 'kelas', label: 'Kelas' },
          { k: 'jenis_kelamin', label: 'L/P', render: (s) => esc(s.jenis_kelamin || '-') },
          { k: 'status', label: 'Status', render: (s) => s.status === 'AKTIF' ? NX.pill('Aktif', 'ok') : NX.pill('Nonaktif', '') },
          { k: 'login_terakhir', label: 'Login terakhir', desc: true, render: (s) => s.login_terakhir ? '<span class="xs">' + F.tglJam(new Date(s.login_terakhir).getTime()) + '</span>' : '<span class="xs muted">Belum pernah</span>' },
          { label: '', sort: false, w: '56px', render: (s) => '<button class="icon-btn sm" data-sm="' + esc(s.id_siswa) + '" aria-label="Tindakan">' + ic('more', 'sm') + '</button>' }
        ],
        empty: { icon: 'users', title: 'Belum ada siswa', text: 'Tambahkan siswa satu per satu atau impor dari Excel.' }
      });
      root.querySelector('#swAdd').onclick = () => formSiswa(null);
      root.querySelector('#swImp').onclick = imporSiswa;
      root.querySelector('#swExp').onclick = () => NX.exportXlsx('Data_Siswa', [{ name: 'Siswa', cols: [14, 14, 32, 12, 6, 10], rows: [['NIS', 'NISN', 'Nama', 'Kelas', 'L/P', 'Status']].concat(list.map((s) => [s.nis, s.nisn, s.nama, s.kelas, s.jenis_kelamin, s.status])) }]);
      root.querySelector('#swTbl').addEventListener('click', (e) => {
        const b = e.target.closest('[data-sm]'); if (!b) return;
        e.stopPropagation();
        const s = list.find((x) => x.id_siswa === b.dataset.sm);
        NX.menu(b, [
          { icon: 'edit', label: 'Ubah data', run: () => formSiswa(s) },
          { icon: 'monitor', label: 'Reset login (ganti perangkat)', run: () => NX.confirm('Reset login <b>' + esc(s.nama) + '</b>? Sesi di perangkat lama berakhir dan ikatan perangkat ujian aktif dilepas.', { title: 'Reset login', yes: 'Reset' }).then(async (y) => { if (!y) return; try { const r = await NX.api('siswa.resetLogin', { id_siswa: s.id_siswa }); NX.toast('Login direset' + (r.sesiDilepas ? ' · ' + r.sesiDilepas + ' sesi ujian dilepas' : '') + '.', 'ok'); } catch (er) { NX.fail(er); } }) },
          { icon: s.status === 'AKTIF' ? 'userX' : 'userCheck', label: s.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan', run: () => simpanSiswa(Object.assign({}, s, { status: s.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF' }), s.status === 'AKTIF' ? 'Siswa dinonaktifkan.' : 'Siswa diaktifkan.') },
          { sep: 1 },
          { icon: 'trash', label: 'Hapus', danger: true, run: () => NX.confirm('Hapus <b>' + esc(s.nama) + '</b>? Riwayat nilai tetap tersimpan.', { title: 'Hapus siswa', yes: 'Hapus', danger: true }).then((y) => y && simpanSiswa(Object.assign({}, s, { status: 'DIHAPUS' }), 'Siswa dihapus.')) }
        ]);
      });
    }
  });
  async function simpanSiswa(s, msg) {
    try { await NX.api('siswa.simpan', s); AD.ok(msg, ['a_siswa', 'a_kelas', 'a_dash']); return true; } catch (e) { NX.fail(e); return false; }
  }
  function formSiswa(s) {
    s = s || { nis: '', nisn: '', nama: '', id_kelas: '', jenis_kelamin: '', foto_file_id: '', status: 'AKTIF' };
    let foto = s.foto_file_id || '';
    const m = NX.modal({ title: s.id_siswa ? 'Ubah Data Siswa' : 'Tambah Siswa', icon: 'user', size: 'wide',
      body: '<div class="flex g20 wrap"><div class="tc" style="width:140px"><div id="fsAv">' + NX.avatar(s.nama || '?', '', 'lg') + '</div><label class="btn btn-s btn-sm mt12">' + ic('image', 'sm') + 'Foto<input type="file" accept="image/*" id="fsFile" hidden></label><p class="xs muted mt8">Opsional · dipotong persegi</p></div>' +
        '<div class="form-grid f1" style="min-width:260px"><div class="field"><label class="label">NIS</label><input class="input mono" name="nis" value="' + esc(s.nis) + '" inputmode="numeric" maxlength="20"></div><div class="field"><label class="label">NISN</label><input class="input mono" name="nisn" value="' + esc(s.nisn) + '" inputmode="numeric" maxlength="20"></div>' +
        '<div class="field full"><label class="label">Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + esc(s.nama) + '" maxlength="80"></div>' +
        '<div class="field"><label class="label">Kelas <span class="req">*</span></label><select class="select" name="id_kelas">' + AD.optKelas(s.id_kelas, '— pilih —') + '</select></div><div class="field"><label class="label">Jenis kelamin</label><select class="select" name="jenis_kelamin"><option value="">-</option><option value="L" ' + (s.jenis_kelamin === 'L' ? 'selected' : '') + '>Laki-laki</option><option value="P" ' + (s.jenis_kelamin === 'P' ? 'selected' : '') + '>Perempuan</option></select></div>' +
        '<div class="full banner">' + ic('key', 'sm') + '<div class="small">Siswa masuk dengan <b>NIS atau NISN</b> (salah satu wajib diisi). Angka nol di depan tetap disimpan.</div></div></div></div>',
      foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="fsOk">' + ic('check', 'sm') + 'Simpan</button>' });
    if (foto) NX.api('siswa.foto', { ids: [foto] }).then((r) => { if (r[foto]) m.$('#fsAv').innerHTML = NX.avatar(s.nama, r[foto], 'lg'); }).catch(() => {});
    m.$('#fsFile').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const out = await NX.cropper(f, [320]); if (!out) return;
      m.$('#fsAv').innerHTML = NX.avatar('', out[0], 'lg');
      try { const jpg = await NX.resizeImg(out[0], 320, 'image/jpeg', 0.85); const r = await NX.upload('foto', jpg, 'foto_' + (s.nis || s.nisn || 'siswa') + '.jpg'); foto = r.id; NX.toast('Foto terunggah.', 'ok'); } catch (er) { NX.fail(er); }
    };
    m.$('#fsOk').onclick = async (e) => {
      const d = { id_siswa: s.id_siswa || '', nis: AD.v(m.el, 'nis'), nisn: AD.v(m.el, 'nisn'), nama: AD.v(m.el, 'nama'), id_kelas: AD.v(m.el, 'id_kelas'), jenis_kelamin: AD.v(m.el, 'jenis_kelamin'), foto_file_id: foto, status: s.status || 'AKTIF' };
      if (!d.nis && !d.nisn) { NX.toast('Isi NIS atau NISN.', 'warn'); return; }
      if (!d.nama || !d.id_kelas) { NX.toast('Nama dan kelas wajib diisi.', 'warn'); return; }
      NX.btnBusy(e.currentTarget, true);
      try { await NX.api('siswa.simpan', d); m.close(true); AD.ok(s.id_siswa ? 'Data siswa diperbarui.' : 'Siswa ditambahkan.', ['a_siswa', 'a_kelas', 'a_dash']); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); }
    };
  }
  /** Ubah nama kolom bebas → kunci baku */
  function kunciKolom(h) {
    const k = String(h || '').toLowerCase().replace(/[^a-z]/g, '');
    if (k === 'nisn') return 'nisn';
    if (k === 'nis' || k === 'nomorinduk' || k === 'noinduk' || k === 'nipd') return 'nis';
    if (k.indexOf('nama') === 0) return 'nama';
    if (k === 'kelas' || k === 'rombel' || k === 'rombonganbelajar') return 'kelas';
    if (k === 'jk' || k === 'lp' || k.indexOf('jenis') === 0 || k === 'gender' || k === 'kelamin') return 'jenis_kelamin';
    return '';
  }
  function imporSiswa() {
    let rows = [];
    const m = NX.modal({ title: 'Impor Data Siswa', icon: 'upload', size: 'wide',
      body: '<div class="stepper"><div class="st on" id="is1"><span class="n">1</span><div><b class="small">Pilih berkas</b><div class="xs muted">Excel atau CSV</div></div></div><div class="st" id="is2"><span class="n">2</span><div><b class="small">Pindai</b><div class="xs muted">Cek tanpa menyimpan</div></div></div><div class="st" id="is3"><span class="n">3</span><div><b class="small">Impor</b><div class="xs muted">Simpan ke database</div></div></div></div>' +
        '<label class="dropzone mt16" style="display:block" id="isDz"><input type="file" accept=".xlsx,.xls,.csv" hidden id="isFile"><div class="tile lg" style="margin:0 auto">' + ic('table', 'lg') + '</div><div class="b7 mt12">Seret berkas ke sini atau klik untuk memilih</div><div class="small muted mt4">Kolom: NIS, NISN, Nama, Kelas, JK (L/P). Baris pertama = judul kolom.</div></label>' +
        '<div id="isInfo" class="mt16"></div>' +
        '<div class="mt16 col g8"><label class="check"><input type="checkbox" id="isBuat" checked><span>Buat kelas baru otomatis bila nama kelas belum ada</span></label><label class="check"><input type="checkbox" id="isAkt"><span>Aktifkan kembali siswa nonaktif yang ada di berkas</span></label></div>' +
        '<div id="isRes" class="mt16"></div>',
      foot: '<a class="btn btn-g" href="templates/template-siswa.xlsx" download>' + ic('download', 'sm') + 'Unduh template</a><span class="f1"></span><button class="btn btn-s" id="isScan" disabled>' + ic('search', 'sm') + 'Pindai</button><button class="btn btn-p" id="isRun" disabled>' + ic('upload', 'sm') + 'Jalankan Impor</button>' });
    const dz = m.$('#isDz'), fi = m.$('#isFile');
    const load = async (f) => {
      if (!f) return;
      m.$('#isInfo').innerHTML = NX.skel(60);
      try {
        const aoa = await NX.readSheet(f);
        const hi = aoa.findIndex((r) => r.some((c) => kunciKolom(c) === 'nama'));
        if (hi < 0) throw new Error('Kolom "Nama" tidak ditemukan. Gunakan template.');
        const keys = aoa[hi].map(kunciKolom);
        rows = aoa.slice(hi + 1).filter((r) => r.some((c) => String(c).trim())).map((r) => { const o = {}; keys.forEach((k, i) => { if (k) o[k] = String(r[i] === undefined ? '' : r[i]).trim(); }); if (o.jenis_kelamin) o.jenis_kelamin = /^p|^w|perem|wanita/i.test(o.jenis_kelamin) ? 'P' : /^l|laki|pria/i.test(o.jenis_kelamin) ? 'L' : ''; return o; });
        m.$('#isInfo').innerHTML = '<div class="banner ok">' + ic('checkCircle', 'sm') + '<div><b>' + esc(f.name) + '</b> · ' + rows.length + ' baris terbaca. Kolom dikenali: ' + keys.filter(Boolean).join(', ') + '</div></div>' +
          '<div class="tbl-wrap mt12" style="max-height:200px;overflow:auto"><table class="tbl compact"><thead><tr><th>NIS</th><th>NISN</th><th>Nama</th><th>Kelas</th><th>JK</th></tr></thead><tbody>' + rows.slice(0, 8).map((r) => '<tr><td class="mono">' + esc(r.nis || '') + '</td><td class="mono">' + esc(r.nisn || '') + '</td><td>' + esc(r.nama || '') + '</td><td>' + esc(r.kelas || '') + '</td><td>' + esc(r.jenis_kelamin || '') + '</td></tr>').join('') + '</tbody></table></div>' + (rows.length > 8 ? '<p class="xs muted mt4">… dan ' + (rows.length - 8) + ' baris lagi</p>' : '');
        m.$('#isScan').disabled = !rows.length; m.$('#isRun').disabled = true;
        m.$('#is1').classList.add('done'); m.$('#is2').classList.add('on');
      } catch (e) { m.$('#isInfo').innerHTML = '<div class="banner err">' + ic('alert', 'sm') + '<div>' + esc(e.message) + '</div></div>'; }
    };
    fi.onchange = () => load(fi.files[0]);
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); load(e.dataTransfer.files[0]); });
    const report = (r) => '<div class="grid gc4 keep2" style="gap:10px">' + [['Ditambah', r.ditambah, 'ok'], ['Diperbarui', r.diperbarui, 'p'], ['Dilewati', r.dilewati, ''], ['Kelas baru', r.kelasBaru.length, 'pu']].map((x) => '<div class="card card-ps tc"><div class="num b8 ink-' + x[2] + '" style="font-size:24px">' + x[1] + '</div><div class="xs muted">' + x[0] + '</div></div>').join('') + '</div>' +
      (r.kelasBaru.length ? '<p class="small mt12">Kelas baru: <b>' + esc(r.kelasBaru.join(', ')) + '</b></p>' : '') +
      (r.peringatan.length ? '<div class="banner warn mt12" style="display:block"><b class="small">Peringatan</b><ul class="small mt4" style="padding-left:18px;max-height:140px;overflow:auto">' + r.peringatan.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '');
    const kirim = async (dry, btn) => {
      NX.btnBusy(btn, true);
      try {
        const r = await NX.api('siswa.impor', { rows, dryRun: dry, buatKelas: m.$('#isBuat').checked, aktifkan: m.$('#isAkt').checked }, { timeout: 120000 });
        m.$('#isRes').innerHTML = (dry ? '<div class="banner neu mb12">' + ic('info', 'sm') + '<div class="small">Hasil pindai (belum disimpan). Data aman diimpor ulang — siswa yang sudah ada diperbarui, bukan digandakan.</div></div>' : '<div class="banner ok mb12">' + ic('checkCircle', 'sm') + '<div class="small"><b>Impor selesai.</b></div></div>') + report(r);
        if (dry) { m.$('#isRun').disabled = false; m.$('#is2').classList.add('done'); m.$('#is3').classList.add('on'); }
        else { m.$('#is3').classList.add('done'); m.$('#isRun').disabled = true; await AD.segarMaster(); NX.drop('a_siswa'); NX.drop('a_dash'); m.el.querySelector('.modal-ft').innerHTML = '<button class="btn btn-p" data-x>Selesai</button>'; m.el.querySelector('.modal-ft [data-x]').onclick = () => { m.close(); NX.rerender(); }; }
      } catch (e) { NX.fail(e); }
      NX.btnBusy(btn, false);
    };
    m.$('#isScan').onclick = (e) => kirim(true, e.currentTarget);
    m.$('#isRun').onclick = (e) => kirim(false, e.currentTarget);
  }

  // =================================================================== KELAS & MAPEL
  NX.route('a/kelas', {
    role: 'ADMIN', title: 'Kelas & Mata Pelajaran', nav: 'a/kelas',
    async render() {
      const [kelas, mapel] = await Promise.all([NX.load('a_kelas', 'kelas.list', {}, 30000, true), NX.load('a_mapel', 'mapel.list', {}, 30000, true)]);
      if (S.boot) { S.boot.kelas = kelas; S.boot.mapel = mapel; }
      const kkm = (S.cfg && S.cfg.kkm) || 75;
      return '<div class="page-hd"><div><h1>Kelas & Mata Pelajaran</h1><p>Rombongan belajar dengan KKM per kelas, serta daftar mata pelajaran untuk bank soal dan ujian.</p></div></div>' +
        '<div class="grid gc2 stagger" style="align-items:start">' +
          '<section class="card"><div class="card-hd"><h3 class="flex ic g8">' + ic('school', 'ink-p') + 'Kelas <span class="badge">' + kelas.length + '</span></h3><button class="btn btn-p btn-sm" id="kAdd">' + ic('plus', 'sm') + 'Kelas</button></div>' +
            '<div class="tbl-wrap"><table class="tbl auto-stack"><thead><tr><th>Nama kelas</th><th>Tingkat</th><th class="n">KKM</th><th class="n">Siswa</th><th></th></tr></thead><tbody>' + (kelas.length ? kelas.map((k) => '<tr><td class="b6">' + esc(k.nama_kelas) + (k.status === 'NONAKTIF' ? ' ' + NX.pill('Nonaktif', '') : '') + '</td><td>' + esc(k.tingkat || '-') + '</td><td class="n">' + (k.kkm === '' ? '<span class="muted" data-tip="Mengikuti KKM bawaan">' + kkm + '*</span>' : '<b>' + k.kkm + '</b>') + '</td><td class="n">' + k.jumlah_siswa + '</td><td class="tr nowrap"><button class="icon-btn sm" data-ke="' + esc(k.id_kelas) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button> <button class="icon-btn sm" data-kd="' + esc(k.id_kelas) + '" aria-label="Hapus">' + ic('trash', 'sm') + '</button></td></tr>').join('') : '<tr><td colspan="5">' + NX.empty('school', 'Belum ada kelas', 'Tambahkan kelas atau impor siswa (kelas dibuat otomatis).') + '</td></tr>') + '</tbody></table></div><p class="xs muted" style="padding:12px 20px">* KKM kosong mengikuti KKM bawaan di Pengaturan → Ujian.</p></section>' +
          '<section class="card"><div class="card-hd"><h3 class="flex ic g8">' + ic('book', 'ink-p') + 'Mata Pelajaran <span class="badge">' + mapel.length + '</span></h3><button class="btn btn-p btn-sm" id="mAdd">' + ic('plus', 'sm') + 'Mapel</button></div>' +
            '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mata pelajaran</th><th>Kode</th><th></th></tr></thead><tbody>' + (mapel.length ? mapel.map((x) => '<tr><td><div class="flex ic g12">' + NX.mapelTile(x.nama_mapel, 'sm') + '<span class="b6">' + esc(x.nama_mapel) + '</span></div></td><td class="mono">' + esc(x.kode || '-') + '</td><td class="tr nowrap"><button class="icon-btn sm" data-me="' + esc(x.id_mapel) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button> <button class="icon-btn sm" data-md="' + esc(x.id_mapel) + '" aria-label="Hapus">' + ic('trash', 'sm') + '</button></td></tr>').join('') : '<tr><td colspan="3">' + NX.empty('book', 'Belum ada mapel', '') + '</td></tr>') + '</tbody></table></div></section>' +
        '</div>';
    },
    mount(p, root) {
      const kelas = S.cache.a_kelas.d, mapel = S.cache.a_mapel.d;
      const simpan = async (act, d, msg) => { try { await NX.api(act, d); await AD.segarMaster(); AD.ok(msg, ['a_kelas', 'a_mapel']); return true; } catch (e) { NX.fail(e); return false; } };
      const fKelas = (k) => {
        k = k || { nama_kelas: '', tingkat: '', kkm: '' };
        const m = NX.modal({ title: k.id_kelas ? 'Ubah Kelas' : 'Tambah Kelas', icon: 'school', size: 'narrow', body: '<div class="col g16"><div class="field"><label class="label">Nama kelas <span class="req">*</span></label><input class="input" name="nama_kelas" value="' + esc(k.nama_kelas) + '" placeholder="mis. X IPA 1" maxlength="40" autofocus></div><div class="form-grid"><div class="field"><label class="label">Tingkat</label><input class="input" name="tingkat" value="' + esc(k.tingkat) + '" placeholder="X / 10" maxlength="10"></div><div class="field"><label class="label">KKM kelas</label><input class="input" type="number" min="0" max="100" name="kkm" value="' + esc(k.kkm) + '" placeholder="bawaan"></div></div>' + (k.id_kelas ? '<label class="check"><input type="checkbox" name="nonaktif" ' + (k.status === 'NONAKTIF' ? 'checked' : '') + '><span>Nonaktifkan kelas</span></label>' : '') + '</div>',
          foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="kOk">Simpan</button>' });
        m.$('#kOk').onclick = async () => { const ok = await simpan('kelas.simpan', { id_kelas: k.id_kelas || '', nama_kelas: AD.v(m.el, 'nama_kelas'), tingkat: AD.v(m.el, 'tingkat'), kkm: AD.v(m.el, 'kkm'), status: AD.v(m.el, 'nonaktif') ? 'NONAKTIF' : 'AKTIF' }, 'Kelas tersimpan.'); if (ok) m.close(true); };
      };
      const fMapel = (x) => {
        x = x || { nama_mapel: '', kode: '' };
        const m = NX.modal({ title: x.id_mapel ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran', icon: 'book', size: 'narrow', body: '<div class="col g16"><div class="field"><label class="label">Nama mata pelajaran <span class="req">*</span></label><input class="input" name="nama_mapel" value="' + esc(x.nama_mapel) + '" maxlength="60" autofocus></div><div class="field"><label class="label">Kode</label><input class="input mono" name="kode" value="' + esc(x.kode) + '" placeholder="mis. MTK" maxlength="12"></div></div>',
          foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="mOk">Simpan</button>' });
        m.$('#mOk').onclick = async () => { const ok = await simpan('mapel.simpan', { id_mapel: x.id_mapel || '', nama_mapel: AD.v(m.el, 'nama_mapel'), kode: AD.v(m.el, 'kode') }, 'Mata pelajaran tersimpan.'); if (ok) m.close(true); };
      };
      root.querySelector('#kAdd').onclick = () => fKelas(null);
      root.querySelector('#mAdd').onclick = () => fMapel(null);
      root.querySelectorAll('[data-ke]').forEach((b) => b.onclick = () => fKelas(kelas.find((k) => k.id_kelas === b.dataset.ke)));
      root.querySelectorAll('[data-me]').forEach((b) => b.onclick = () => fMapel(mapel.find((k) => k.id_mapel === b.dataset.me)));
      root.querySelectorAll('[data-kd]').forEach((b) => b.onclick = () => { const k = kelas.find((z) => z.id_kelas === b.dataset.kd); NX.confirm('Hapus kelas <b>' + esc(k.nama_kelas) + '</b>?', { title: 'Hapus kelas', yes: 'Hapus', danger: true }).then((y) => y && simpan('kelas.simpan', Object.assign({}, k, { status: 'DIHAPUS' }), 'Kelas dihapus.')); });
      root.querySelectorAll('[data-md]').forEach((b) => b.onclick = () => { const k = mapel.find((z) => z.id_mapel === b.dataset.md); NX.confirm('Hapus mata pelajaran <b>' + esc(k.nama_mapel) + '</b>?', { title: 'Hapus mapel', yes: 'Hapus', danger: true }).then((y) => y && simpan('mapel.simpan', Object.assign({}, k, { status: 'DIHAPUS' }), 'Mapel dihapus.')); });
    }
  });

  // =================================================================== PENGUMUMAN
  NX.route('a/pengumuman', {
    role: 'ADMIN', title: 'Pengumuman', nav: 'a/pengumuman',
    async render() {
      const list = await NX.load('a_peng', 'pengumuman.list', {}, 30000, true);
      const now = NX.now();
      return '<div class="page-hd"><div><h1>Pengumuman</h1><p>Tampil di dashboard siswa (maksimal 5 pengumuman aktif terbaru).</p></div><button class="btn btn-p" id="pgAdd">' + ic('plus', 'sm') + 'Buat Pengumuman</button></div>' +
        (list.length ? '<div class="grid gc2 stagger">' + list.map((x) => { const tampil = x.status === 'AKTIF' && (!x.tampil_mulai || x.tampil_mulai <= now) && (!x.tampil_sampai || x.tampil_sampai >= now); return '<section class="card card-p"><div class="flex jb ic g8"><div class="flex ic g12"><span class="tile ' + (tampil ? 'acc' : 'neu') + '">' + ic('megaphone') + '</span><div><h3>' + esc(x.judul) + '</h3><div class="xs muted">' + (x.tampil_mulai ? F.tglJam(x.tampil_mulai) : 'Segera') + ' → ' + (x.tampil_sampai ? F.tglJam(x.tampil_sampai) : 'tanpa batas') + '</div></div></div>' + (tampil ? NX.pill('Tayang', 'ok', 'live') : x.status === 'AKTIF' ? NX.pill('Terjadwal', 'p') : NX.pill('Nonaktif', '')) + '</div><p class="small tx2 mt12" style="white-space:pre-wrap">' + esc(x.isi) + '</p><div class="flex je g8 mt16"><button class="btn btn-s btn-sm" data-pe="' + esc(x.id) + '">' + ic('edit', 'sm') + 'Ubah</button><button class="btn btn-do btn-sm" data-pd="' + esc(x.id) + '">' + ic('trash', 'sm') + 'Hapus</button></div></section>'; }).join('') + '</div>'
          : '<div class="card">' + NX.empty('megaphone', 'Belum ada pengumuman', 'Buat pengumuman jadwal ujian, tata tertib, atau informasi penting.') + '</div>');
    },
    mount(p, root) {
      const list = S.cache.a_peng.d;
      const form = (x) => {
        x = x || { judul: '', isi: '', tampil_mulai: 0, tampil_sampai: 0, status: 'AKTIF' };
        const m = NX.modal({ title: x.id ? 'Ubah Pengumuman' : 'Buat Pengumuman', icon: 'megaphone',
          body: '<div class="col g16"><div class="field"><label class="label">Judul <span class="req">*</span></label><input class="input" name="judul" value="' + esc(x.judul) + '" maxlength="120" autofocus></div><div class="field"><label class="label">Isi <span class="req">*</span></label><textarea class="textarea" name="isi" rows="6" maxlength="2000">' + esc(x.isi) + '</textarea></div><div class="form-grid"><div class="field"><label class="label">Tampil mulai</label><input class="input" type="datetime-local" name="tampil_mulai" value="' + F.toLocalInput(x.tampil_mulai) + '"><span class="help">Kosong = segera</span></div><div class="field"><label class="label">Tampil sampai</label><input class="input" type="datetime-local" name="tampil_sampai" value="' + F.toLocalInput(x.tampil_sampai) + '"><span class="help">Kosong = tanpa batas</span></div></div>' + AD.sw('aktif', x.status === 'AKTIF', 'Aktif', 'Matikan untuk menyembunyikan tanpa menghapus.') + '</div>',
          foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="pOk">Simpan</button>' });
        m.$('#pOk').onclick = async (e) => {
          NX.btnBusy(e.currentTarget, true);
          try { await NX.api('pengumuman.simpan', { id: x.id || '', judul: AD.v(m.el, 'judul'), isi: AD.v(m.el, 'isi'), tampil_mulai: F.fromLocalInput(AD.v(m.el, 'tampil_mulai')), tampil_sampai: F.fromLocalInput(AD.v(m.el, 'tampil_sampai')), status: AD.v(m.el, 'aktif') ? 'AKTIF' : 'NONAKTIF' }); m.close(true); AD.ok('Pengumuman tersimpan.', ['a_peng', 'a_dash']); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); }
        };
      };
      root.querySelector('#pgAdd').onclick = () => form(null);
      root.querySelectorAll('[data-pe]').forEach((b) => b.onclick = () => form(list.find((x) => String(x.id) === b.dataset.pe)));
      root.querySelectorAll('[data-pd]').forEach((b) => b.onclick = () => NX.confirm('Hapus pengumuman ini?', { title: 'Hapus', yes: 'Hapus', danger: true }).then(async (y) => { if (!y) return; try { await NX.api('pengumuman.simpan', { id: b.dataset.pd, status: 'DIHAPUS' }); AD.ok('Pengumuman dihapus.', ['a_peng']); } catch (er) { NX.fail(er); } }));
    }
  });

  // =================================================================== PENGATURAN
  const VDESK = {
    PINDAH_TAB: 'Meninggalkan halaman ujian (tab/aplikasi lain, tombol Home).', KELUAR_LAYAR_PENUH: 'Keluar dari mode layar penuh.', JENDELA_MENGAMBANG: 'Fokus berpindah > 2 detik (jendela mengambang, notifikasi, aplikasi lain).',
    LAYAR_TERBAGI: 'Jendela diperkecil atau layar terbagi.', TANGKAP_LAYAR: 'Tombol Print Screen / pintasan tangkapan layar.', LOGIN_GANDA: 'Akun yang sama dipakai di perangkat lain. Hati-hati: bila dihitung, orang lain yang tahu NIS bisa menambah pelanggaran siswa.',
    SALIN_TEMPEL: 'Salin, tempel, potong, klik kanan (selalu diblokir).', PINTASAN: 'Pintasan keyboard (F12, Ctrl+U, dll — selalu diblokir).', MUAT_ULANG: 'Halaman ujian dimuat ulang.'
  };
  const PRESET = ['#2251E0', '#4F46E5', '#7C3AED', '#0891B2', '#059669', '#16A34A', '#DC2626', '#E11D48', '#F97316', '#D97706', '#0F172A', '#475569'];
  NX.route('a/pengaturan', {
    role: 'ADMIN', title: 'Pengaturan', nav: 'a/pengaturan',
    async render(p) {
      const tab = p.q.tab || 'identitas';
      const set = await NX.api('pengaturan.ambil', {});
      AD._set = set;
      const tabs = [['identitas', 'palette', 'Identitas Aplikasi'], ['ujian', 'sliders', 'Aturan Ujian'], ['admin', 'shield', 'Akun Admin'], ['akun', 'key', 'Akun Saya'], ['log', 'history', 'Log Aktivitas'], ['arsip', 'archive', 'Arsip Semester']];
      let body = '';
      if (tab === 'identitas') body = tabIdentitas(set);
      else if (tab === 'ujian') body = tabUjian(set);
      else if (tab === 'admin') body = '<div id="admBox">' + NX.skel(200) + '</div>';
      else if (tab === 'akun') body = '<section class="card card-p" style="max-width:520px"><h3>Ganti Kata Sandi</h3><p class="small muted mt4">Masuk sebagai <b>' + esc(S.me.username || S.me.nama) + '</b>. Setelah diganti, sesi di perangkat lain berakhir.</p><div class="col g16 mt16"><div class="field"><label class="label">Kata sandi lama</label><input class="input" type="password" name="lama" autocomplete="current-password"></div><div class="field"><label class="label">Kata sandi baru</label><input class="input" type="password" name="baru" autocomplete="new-password"><span class="help">Minimal 8 karakter, memuat huruf dan angka.</span></div><div class="field"><label class="label">Ulangi kata sandi baru</label><input class="input" type="password" name="ulang" autocomplete="new-password"></div><button class="btn btn-p" id="akOk">' + ic('key', 'sm') + 'Simpan Kata Sandi</button></div></section>';
      else if (tab === 'log') body = '<section class="card"><div id="logTbl">' + NX.skel(300) + '</div></section>';
      else if (tab === 'arsip') body = '<section class="card card-p" style="max-width:640px"><h3 class="flex ic g8">' + ic('archive', 'ink-p') + 'Arsip Semester</h3><p class="small tx2 mt8">Pindahkan jawaban & log peserta dari ujian yang sudah ditutup sebelum tanggal tertentu ke spreadsheet arsip terpisah. Database utama tetap ringan dan cepat untuk semester berikutnya.</p><div class="banner warn mt16">' + ic('alert', 'sm') + '<div class="small">Ujian yang diarsipkan tidak tampil lagi di Hasil & Analisis. Ekspor nilai yang diperlukan terlebih dahulu.</div></div><div class="flex g12 mt16 wrap" style="align-items:flex-end"><div class="field f1"><label class="label">Arsipkan ujian yang ditutup sebelum</label><input class="input" type="date" name="sebelum"></div><button class="btn btn-s" id="arScan">' + ic('search', 'sm') + 'Pindai</button><button class="btn btn-d" id="arRun" disabled>' + ic('archive', 'sm') + 'Arsipkan</button></div><div id="arRes" class="mt16"></div></section>';
      return '<div class="page-hd"><div><h1>Pengaturan</h1><p>Identitas aplikasi, aturan ujian global, akun admin, dan pemeliharaan data.</p></div></div>' +
        '<div class="card"><div class="tabs" style="padding:0 16px">' + tabs.map((t) => '<button class="tab ' + (t[0] === tab ? 'on' : '') + '" onclick="NX.go(\'a/pengaturan?tab=' + t[0] + '\')">' + ic(t[1], 'sm') + t[2] + '</button>').join('') + '</div></div><div class="mt20" id="setBody">' + body + '</div>';
    },
    mount(p, root) {
      const tab = p.q.tab || 'identitas';
      if (tab === 'identitas') mountIdentitas(root);
      else if (tab === 'ujian') mountUjianSet(root);
      else if (tab === 'admin') mountAdmin(root);
      else if (tab === 'akun') {
        root.querySelector('#akOk').onclick = async (e) => {
          const lama = AD.v(root, 'lama'), baru = AD.v(root, 'baru');
          if (baru !== AD.v(root, 'ulang')) { NX.toast('Ulangi kata sandi baru tidak sama.', 'warn'); return; }
          NX.btnBusy(e.currentTarget, true);
          try { const r = await NX.api('auth.gantiSandi', { lama, baru }); NX.setSession(r.token, S.me); NX.toast('Kata sandi diganti.', 'ok'); root.querySelectorAll('input[type=password]').forEach((i) => { i.value = ''; }); } catch (er) { NX.fail(er); }
          NX.btnBusy(e.currentTarget, false);
        };
      } else if (tab === 'log') {
        NX.api('log.list', {}).then((rows) => {
          NX.Table(root.querySelector('#logTbl'), { rows, search: ['nama', 'aksi', 'target', 'detail'], searchPh: 'Cari aktivitas…', pageSize: 25, columns: [
            { k: 'waktu', label: 'Waktu', desc: true, render: (r) => '<span class="xs nowrap">' + F.tglJam(new Date(r.waktu).getTime()) + '</span>' },
            { k: 'nama', label: 'Admin', render: (r) => '<b class="small">' + esc(r.nama) + '</b>' },
            { k: 'aksi', label: 'Aksi', render: (r) => '<span class="chip static mono">' + esc(r.aksi) + '</span>' },
            { k: 'target', label: 'Target', render: (r) => '<span class="small mono">' + esc(r.target) + '</span>' },
            { k: 'detail', label: 'Detail', render: (r) => '<span class="xs tx2">' + esc(r.detail) + '</span>' }
          ], empty: { icon: 'history', title: 'Belum ada aktivitas' } });
        }).catch((e) => { root.querySelector('#logTbl').innerHTML = NX.errorBox(e); });
      } else if (tab === 'arsip') {
        const run = async (dry, btn) => {
          const t = AD.v(root, 'sebelum'); if (!t) { NX.toast('Pilih tanggal.', 'warn'); return; }
          if (!dry && !(await NX.confirm('Arsipkan data peserta ujian yang ditutup sebelum <b>' + esc(t) + '</b>?', { title: 'Arsip semester', yes: 'Arsipkan', danger: true }))) return;
          NX.btnBusy(btn, true);
          try {
            const r = await NX.api('arsip.jalankan', { sebelum: new Date(t + 'T00:00:00+07:00').getTime(), dryRun: dry }, { timeout: 120000 });
            root.querySelector('#arRes').innerHTML = '<div class="banner ' + (dry ? 'neu' : 'ok') + '">' + ic(dry ? 'info' : 'checkCircle', 'sm') + '<div class="small">' + (dry ? 'Akan diarsipkan: ' : 'Diarsipkan: ') + '<b>' + r.ujian + ' ujian</b>, <b>' + r.baris + ' baris peserta</b>.' + (r.arsipUrl ? ' <a href="' + esc(r.arsipUrl) + '" target="_blank" rel="noopener">Buka spreadsheet arsip</a>' : '') + '</div></div>';
            root.querySelector('#arRun').disabled = !dry || !r.ujian;
            if (!dry) NX.drop('a_');
          } catch (er) { NX.fail(er); }
          NX.btnBusy(btn, false);
        };
        root.querySelector('#arScan').onclick = (e) => run(true, e.currentTarget);
        root.querySelector('#arRun').onclick = (e) => run(false, e.currentTarget);
      }
    }
  });

  function tabIdentitas(s) {
    return '<div class="split-6"><section class="card card-p"><h3 class="flex ic g8">' + ic('palette', 'ink-p') + 'Identitas & Tampilan</h3><div class="col g16 mt16">' +
      '<div class="field"><label class="label">Logo aplikasi</label><div class="flex ic g16"><div class="brand" style="padding:0"><div class="logo" id="idLogo" style="width:72px;height:72px;font-size:28px">' + NX.logoHtml(256) + '</div></div><div class="col g8"><label class="btn btn-s btn-sm">' + ic('upload', 'sm') + 'Unggah & potong<input type="file" accept="image/png,image/jpeg,image/webp" id="idFile" hidden></label>' + (s.logo_file_id ? '<button class="btn btn-g btn-xs" id="idHapusLogo">' + ic('trash', 'sm') + 'Hapus logo</button>' : '') + '</div></div><span class="help">PNG/JPG persegi. Otomatis dibuat 2 ukuran: 512 px (login) dan 128 px (sidebar & ikon tab).</span></div>' +
      '<div class="form-grid"><div class="field"><label class="label">Nama aplikasi <span class="req">*</span></label><input class="input" name="nama_aplikasi" maxlength="30" value="' + esc(s.nama_aplikasi) + '"></div><div class="field"><label class="label">Tagline</label><input class="input" name="tagline" maxlength="60" value="' + esc(s.tagline) + '"></div><div class="field full"><label class="label">Nama sekolah</label><input class="input" name="nama_sekolah" maxlength="120" value="' + esc(s.nama_sekolah) + '"></div></div>' +
      ['warna_primer', 'warna_aksen'].map((k) => '<div class="field"><label class="label">' + (k === 'warna_primer' ? 'Warna utama' : 'Warna aksen') + '</label><div class="flex ic g12 wrap"><input type="color" class="color-swatch" name="' + k + '" value="' + esc(s[k]) + '"><input class="input mono" data-hex="' + k + '" value="' + esc(s[k]) + '" style="width:120px" maxlength="7"><div class="flex g6 wrap">' + PRESET.map((c) => '<button type="button" class="color-swatch" data-pre="' + k + '" data-c="' + c + '" style="width:26px;height:26px;border-radius:7px;background:' + c + '" aria-label="' + c + '"></button>').join('') + '</div></div><span class="help" data-ct="' + k + '"></span></div>').join('') +
      '<div class="flex g8 wrap"><button class="btn btn-p" id="idOk">' + ic('check', 'sm') + 'Simpan Identitas</button><button class="btn btn-g" id="idReset">Kembalikan warna bawaan</button></div></div></section>' +
      '<section class="card card-p"><div class="flex jb ic"><h3>Pratinjau Langsung</h3>' + NX.pill('Belum disimpan', 'warn', 'nodot') + '</div><div id="idPrev" class="mt16"></div></section></div>';
  }
  function mountIdentitas(root) {
    const s = AD._set, st = { logo_file_id: s.logo_file_id, logo_kecil_id: s.logo_kecil_id, logoData: '' };
    const val = (k) => AD.v(root, k);
    const prev = () => {
      const p = val('warna_primer'), a = val('warna_aksen');
      const pd = NX.shade(p, '#000000', 0.32), p50 = NX.shade(p, '#ffffff', 0.92);
      const logo = st.logoData ? '<img src="' + st.logoData + '">' : (st.logo_kecil_id || st.logo_file_id ? '<img src="' + NX.driveImg(st.logo_kecil_id || st.logo_file_id, 128) + '">' : esc((val('nama_aplikasi') || 'N').charAt(0)));
      root.querySelector('#idPrev').innerHTML = '<div class="prev-mock" style="--p:' + p + ';--p-d:' + pd + ';--p-50:' + p50 + ';--acc:' + a + '"><div class="ps"><div class="flex ic g6"><div class="logo" style="width:24px;height:24px;border-radius:7px;background:' + p + ';color:#fff;display:grid;place-items:center;overflow:hidden;font-weight:800;font-size:12px">' + logo + '</div><b class="clamp1" style="font-size:11px;color:' + pd + '">' + esc(val('nama_aplikasi')) + '</b></div><div class="it on mt12">Dashboard</div><div class="it">Ujian</div><div class="it">Hasil</div></div>' +
        '<div style="padding:14px"><div style="border-radius:12px;padding:14px;color:#fff;background:linear-gradient(135deg,' + p + ',' + NX.shade(p, '#000000', 0.25) + ')"><div style="font-size:10px;opacity:.85">Selamat pagi</div><div style="font-weight:800;font-family:var(--f-h)">Nama Siswa</div><div style="margin-top:8px;display:inline-block;background:#fff;color:' + pd + ';font-size:10px;font-weight:700;padding:4px 10px;border-radius:7px">Mulai Ujian</div></div>' +
        '<div class="flex g8 mt12"><span style="flex:1;height:44px;border-radius:10px;background:' + p50 + '"></span><span style="flex:1;height:44px;border-radius:10px;background:' + NX.shade(a, '#ffffff', 0.9) + ';border:1px solid ' + a + '"></span></div><div class="flex g6 mt12"><span style="padding:3px 10px;border-radius:99px;background:' + p + ';color:#fff;font-size:10px;font-weight:700">Utama</span><span style="padding:3px 10px;border-radius:99px;background:' + a + ';color:#fff;font-size:10px;font-weight:700">Aksen</span></div></div></div>' +
        '<div class="card card-p mt16 tc" style="max-width:280px;margin-left:auto;margin-right:auto"><div style="width:56px;height:56px;margin:0 auto;border-radius:14px;overflow:hidden;background:' + p + ';color:#fff;display:grid;place-items:center;font-weight:800;font-size:22px">' + logo + '</div><b class="mt8" style="display:block;font-family:var(--f-h);color:' + pd + '">' + esc(val('nama_aplikasi')) + '</b><div class="xs muted">' + esc(val('tagline')) + '</div><div style="margin-top:10px;height:34px;border-radius:9px;background:' + p + ';color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center">Masuk</div></div>';
      ['warna_primer', 'warna_aksen'].forEach((k) => { const c = NX.contrast(val(k), '#ffffff'); const el = root.querySelector('[data-ct="' + k + '"]'); el.innerHTML = 'Kontras teks putih: <b class="' + (c >= 4.5 ? 'ink-ok' : 'ink-warn') + '">' + c.toFixed(1) + ':1</b> ' + (c >= 4.5 ? '(memenuhi WCAG AA)' : '— terlalu terang untuk teks putih, pilih warna lebih gelap'); });
    };
    root.querySelectorAll('input[type=color]').forEach((i) => i.addEventListener('input', () => { root.querySelector('[data-hex="' + i.name + '"]').value = i.value.toUpperCase(); prev(); }));
    root.querySelectorAll('[data-hex]').forEach((i) => i.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(i.value)) { root.querySelector('[name="' + i.dataset.hex + '"]').value = i.value; prev(); } }));
    root.querySelectorAll('[data-pre]').forEach((b) => b.onclick = () => { root.querySelector('[name="' + b.dataset.pre + '"]').value = b.dataset.c; root.querySelector('[data-hex="' + b.dataset.pre + '"]').value = b.dataset.c; prev(); });
    root.querySelectorAll('[name=nama_aplikasi],[name=tagline]').forEach((i) => i.addEventListener('input', prev));
    root.querySelector('#idReset').onclick = () => { [['warna_primer', '#2251E0'], ['warna_aksen', '#F97316']].forEach((x) => { root.querySelector('[name="' + x[0] + '"]').value = x[1]; root.querySelector('[data-hex="' + x[0] + '"]').value = x[1]; }); prev(); };
    root.querySelector('#idFile').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const out = await NX.cropper(f, [512, 128]); if (!out) return;
      st.logoData = out[1];
      root.querySelector('#idLogo').innerHTML = '<img src="' + out[0] + '">';
      prev();
      NX.toast('Mengunggah logo…');
      try { const [a, b] = await Promise.all([NX.upload('logo', out[0], 'logo_512.png'), NX.upload('logo', out[1], 'logo_128.png')]); st.logo_file_id = a.id; st.logo_kecil_id = b.id; NX.toast('Logo terunggah. Klik Simpan Identitas.', 'ok'); } catch (er) { NX.fail(er); }
    };
    const hl = root.querySelector('#idHapusLogo'); if (hl) hl.onclick = () => { st.logo_file_id = ''; st.logo_kecil_id = ''; st.logoData = ''; root.querySelector('#idLogo').textContent = (val('nama_aplikasi') || 'N').charAt(0); prev(); };
    root.querySelector('#idOk').onclick = async (e) => {
      const nilai = { nama_aplikasi: val('nama_aplikasi'), tagline: val('tagline'), nama_sekolah: val('nama_sekolah'), warna_primer: val('warna_primer').toUpperCase(), warna_aksen: val('warna_aksen').toUpperCase(), logo_file_id: st.logo_file_id || '', logo_kecil_id: st.logo_kecil_id || '' };
      if (!nilai.nama_aplikasi) { NX.toast('Nama aplikasi wajib diisi.', 'warn'); return; }
      NX.btnBusy(e.currentTarget, true);
      try { const r = await NX.api('pengaturan.simpan', { nilai }); NX.applyTheme(r); if (S.boot) S.boot.cfg = r; S.chrome = ''; NX.toast('Identitas aplikasi tersimpan.', 'ok'); NX.render(); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); }
    };
    prev();
  }
  function tabUjian(s) {
    const dh = String(s.viol_dihitung || '').split(',');
    const num = (k, label, help, attr) => '<div class="field"><label class="label">' + label + '</label><input class="input" type="number" name="' + k + '" value="' + esc(s[k]) + '" ' + (attr || '') + '>' + (help ? '<span class="help">' + help + '</span>' : '') + '</div>';
    return '<div class="split-6"><section class="card card-p"><h3 class="flex ic g8">' + ic('sliders', 'ink-p') + 'Aturan Ujian Global</h3><div class="form-grid mt16">' +
      '<div class="field"><label class="label">Batas pelanggaran bawaan</label><select class="select" name="batas_pelanggaran">' + [1, 2, 3, 4, 5, 10].map((n) => '<option ' + (String(n) === String(s.batas_pelanggaran) ? 'selected' : '') + '>' + n + '</option>').join('') + '</select><span class="help">Ujian terkunci saat jumlah ini tercapai (bisa diubah per ujian).</span></div>' +
      '<div class="field"><label class="label">Saat batas tercapai (bawaan)</label><select class="select" name="aksi_batas"><option value="KUNCI" ' + (s.aksi_batas !== 'KUMPUL' ? 'selected' : '') + '>Kunci ujian — dibuka pengawas</option><option value="KUMPUL" ' + (s.aksi_batas === 'KUMPUL' ? 'selected' : '') + '>Kumpulkan otomatis & dinilai</option></select><span class="help">Bisa diubah per ujian.</span></div>' +
      num('toleransi_selesai', 'Tombol "Selesai" aktif (menit sebelum habis)', '0 = siswa boleh mengumpulkan kapan saja.', 'min="0" max="600"') +
      num('kkm', 'KKM / KKTP bawaan', 'KKM per kelas diatur di menu Kelas & Mapel.', 'min="0" max="100"') +
      num('masa_tenggang', 'Masa tenggang pengumpulan (menit)', 'Jawaban terlambat (sinyal putus) masih diterima selama ini.', 'min="0" max="60"') +
      '<div class="field"><label class="label">Jam buka bawaan</label><input class="input" type="time" name="jam_buka_default" value="' + esc(s.jam_buka_default) + '"></div>' +
      '<div class="field"><label class="label">Jam tutup bawaan</label><input class="input" type="time" name="jam_tutup_default" value="' + esc(s.jam_tutup_default) + '"></div>' +
      num('interval_sinkron', 'Interval sinkron jawaban (detik)', 'Bawaan 120. Lebih kecil = beban server lebih besar (400 siswa → 120–180 dtk).', 'min="30" max="600"') +
      num('ambang_d_terima', 'Daya beda minimal "Diterima"', 'Analisis butir (bawaan 0,30).', 'step="0.01" min="0" max="1"') +
      num('ambang_d_revisi', 'Daya beda minimal "Direvisi"', 'Di bawah ini soal "Dibuang" (bawaan 0,20).', 'step="0.01" min="0" max="1"') +
      '</div><button class="btn btn-p mt20" id="ujOk">' + ic('check', 'sm') + 'Simpan Aturan</button></section>' +
      '<section class="card card-p"><h3 class="flex ic g8">' + ic('shieldAlert', 'ink-err') + 'Jenis Pelanggaran yang Dihitung</h3><p class="small muted mt4">Kejadian yang tidak dicentang tetap dicatat di log, tetapi tidak menambah hitungan.</p><div class="mt12">' +
      ['PINDAH_TAB', 'KELUAR_LAYAR_PENUH', 'JENDELA_MENGAMBANG', 'LAYAR_TERBAGI', 'TANGKAP_LAYAR', 'LOGIN_GANDA', 'MUAT_ULANG'].map((j) => '<label class="toggle-row" style="cursor:pointer;align-items:flex-start"><span class="switch"><input type="checkbox" data-viol="' + j + '" ' + (dh.indexOf(j) > -1 ? 'checked' : '') + '><span></span></span><span class="f1"><span class="b6">' + esc(EX.VLABEL[j]) + '</span><br><span class="small muted">' + esc(VDESK[j]) + '</span></span></label>').join('') +
      '<div class="toggle-row"><span class="tile sm ok">' + ic('shield', 'sm') + '</span><span class="f1"><span class="b6">Salin-tempel & pintasan</span><br><span class="small muted">Selalu diblokir dan dicatat.</span></span>' + NX.pill('Diblokir', 'ok') + '</div></div></section></div>';
  }
  function mountUjianSet(root) {
    root.querySelector('#ujOk').onclick = async (e) => {
      const keys = ['batas_pelanggaran', 'aksi_batas', 'toleransi_selesai', 'kkm', 'masa_tenggang', 'jam_buka_default', 'jam_tutup_default', 'interval_sinkron', 'ambang_d_terima', 'ambang_d_revisi'];
      const nilai = {}; keys.forEach((k) => { nilai[k] = AD.v(root, k); });
      nilai.viol_dihitung = Array.from(root.querySelectorAll('[data-viol]:checked')).map((c) => c.dataset.viol).join(',');
      NX.btnBusy(e.currentTarget, true);
      try { const r = await NX.api('pengaturan.simpan', { nilai }); S.cfg = Object.assign({}, S.cfg, r); if (S.boot) S.boot.cfg = r; NX.toast('Aturan ujian tersimpan.', 'ok'); } catch (er) { NX.fail(er); }
      NX.btnBusy(e.currentTarget, false);
    };
  }
  function mountAdmin(root) {
    const box = root.querySelector('#admBox');
    const tampilSandi = (judul, user, pass) => NX.modal({ title: judul, icon: 'key', size: 'narrow', dismiss: false, body: '<p class="tx2">Catat kata sandi berikut sekarang — <b>hanya ditampilkan sekali</b>.</p><div class="card card-ps mt12" style="background:var(--muted-bg)"><div class="xs muted">Username</div><div class="b7 mono">' + esc(user) + '</div><div class="xs muted mt8">Kata sandi</div><div class="flex ic jb"><span class="b8 mono" style="font-size:20px">' + esc(pass) + '</span><button class="icon-btn sm" onclick="NX.copy(\'' + NX.escA(pass) + '\')">' + ic('copy', 'sm') + '</button></div></div><p class="xs muted mt12">Minta admin tersebut mengganti kata sandi setelah masuk (Pengaturan → Akun Saya).</p>', foot: '<button class="btn btn-p" data-ok>Sudah saya catat</button>', onMount: (m) => { m.$('[data-ok]').onclick = () => m.close(true); } });
    const load = async () => {
      let list;
      try { list = await NX.api('admin.list', {}); } catch (e) { box.innerHTML = NX.errorBox(e); return; }
      box.innerHTML = '<section class="card"><div class="card-hd"><h3>Akun Admin & Guru</h3><button class="btn btn-p btn-sm" id="adAdd">' + ic('plus', 'sm') + 'Tambah Admin</button></div><div class="tbl-wrap"><table class="tbl auto-stack"><thead><tr><th>Nama</th><th>Username</th><th>Status</th><th>Login terakhir</th><th></th></tr></thead><tbody>' +
        list.map((a) => '<tr><td><div class="flex ic g12">' + NX.avatar(a.nama, '', 'sm') + '<b>' + esc(a.nama) + '</b>' + (a.id_admin === S.me.id ? ' ' + NX.pill('Anda', 'p') : '') + '</div></td><td class="mono">' + esc(a.username) + '</td><td>' + (a.status === 'AKTIF' ? NX.pill('Aktif', 'ok') : NX.pill('Nonaktif', '')) + '</td><td class="xs">' + (a.login_terakhir ? F.tglJam(new Date(a.login_terakhir).getTime()) : '<span class="muted">Belum pernah</span>') + '</td><td class="tr nowrap"><button class="btn btn-s btn-xs" data-ae="' + esc(a.id_admin) + '">' + ic('edit', 'sm') + 'Ubah</button> ' + (a.id_admin !== S.me.id ? '<button class="btn btn-s btn-xs" data-ar="' + esc(a.id_admin) + '">' + ic('key', 'sm') + 'Reset sandi</button>' : '') + '</td></tr>').join('') +
        '</tbody></table></div><div class="banner neu" style="margin:16px 20px">' + ic('info', 'sm') + '<div class="small">Semua admin memiliki akses penuh (termasuk guru). Kata sandi disimpan sebagai hash; tidak ada yang bisa melihat kata sandi lama.</div></div></section>';
      const form = (a) => {
        a = a || { nama: '', username: '', status: 'AKTIF' };
        const m = NX.modal({ title: a.id_admin ? 'Ubah Admin' : 'Tambah Admin', icon: 'shield', size: 'narrow', body: '<div class="col g16"><div class="field"><label class="label">Nama</label><input class="input" name="nama" value="' + esc(a.nama) + '" maxlength="60" autofocus></div><div class="field"><label class="label">Username</label><input class="input mono" name="username" value="' + esc(a.username) + '" maxlength="40" autocomplete="off"><span class="help">Huruf kecil, angka, titik, garis bawah (3–40).</span></div>' + (a.id_admin ? (a.id_admin !== S.me.id ? AD.sw('aktif', a.status === 'AKTIF', 'Akun aktif', 'Nonaktifkan untuk mencabut akses.') : '') : '<div class="field"><label class="label">Kata sandi awal</label><input class="input" type="password" name="password" autocomplete="new-password"><span class="help">Kosongkan untuk dibuatkan otomatis (ditampilkan sekali).</span></div>') + '</div>',
          foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="aOk">Simpan</button>' });
        m.$('#aOk').onclick = async (e) => {
          const d = { id_admin: a.id_admin || '', nama: AD.v(m.el, 'nama'), username: AD.v(m.el, 'username'), status: a.id_admin && a.id_admin !== S.me.id ? (AD.v(m.el, 'aktif') ? 'AKTIF' : 'NONAKTIF') : 'AKTIF' };
          if (!a.id_admin) d.password = AD.v(m.el, 'password');
          NX.btnBusy(e.currentTarget, true);
          try { const r = await NX.api('admin.simpan', d); m.close(true); NX.toast('Akun admin tersimpan.', 'ok'); load(); if (r.sandiAwal) tampilSandi('Admin baru dibuat', r.username, r.sandiAwal); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); }
        };
      };
      NX.stackify(box);
      box.querySelector('#adAdd').onclick = () => form(null);
      box.querySelectorAll('[data-ae]').forEach((b) => b.onclick = () => form(list.find((a) => a.id_admin === b.dataset.ae)));
      box.querySelectorAll('[data-ar]').forEach((b) => b.onclick = async () => {
        const a = list.find((x) => x.id_admin === b.dataset.ar);
        if (!(await NX.confirm('Buat kata sandi baru untuk <b>' + esc(a.nama) + '</b>? Sesi admin tersebut akan berakhir.', { title: 'Reset kata sandi', yes: 'Reset' }))) return;
        try { const r = await NX.api('admin.resetSandi', { id_admin: a.id_admin }); tampilSandi('Kata sandi baru', a.username, r.sandiBaru); } catch (er) { NX.fail(er); }
      });
    };
    load();
  }
})();
