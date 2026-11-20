'use strict';
/* NEXTEST — bank.js : berkas soal, daftar soal, editor 4 tipe soal, impor Word/Excel/Google Sheets, ekspor */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S, F = NX.fmt, AD = window.AD;
  const BK = window.BK = {};
  const HUR = ['A', 'B', 'C', 'D', 'E'];
  const TIPE = [['PG', 'Pilihan Ganda', 'listCheck'], ['MCMA', 'PG Kompleks', 'layers'], ['KATEGORI', 'Kategori / Benar-Salah', 'table'], ['ESAI', 'Esai / Uraian', 'pen']];
  const TL = { PG: 'Pilihan Ganda', MCMA: 'PG Kompleks', KATEGORI: 'Kategori', ESAI: 'Esai' };
  const TC = { PG: 'p', MCMA: 'pu', KATEGORI: 'cy', ESAI: 'acc' };
  BK.TL = TL;

  // ------------------------------------------------------------ tampilan soal (dipakai daftar, editor, pratinjau impor)
  BK.render = function (s, o) {
    o = o || {};
    const op = s.opsi || {}, img = op.img || {};
    let h = '<div class="rendered qtext" style="font-size:15px">' + NX.rich(s.teks) + '</div>';
    if (s.gambar) h += '<div class="figure mt12" style="max-width:420px"><img src="' + (/^(https:|data:)/.test(s.gambar) ? esc(s.gambar) : NX.driveImg(s.gambar, 800)) + '" alt=""></div>';
    if ((s.lampiran || []).length) h += '<div class="xs muted mt8 flex ic g6">' + ic('clip', 'sm') + s.lampiran.length + ' halaman lampiran</div>';
    if (s.tipe === 'PG' || s.tipe === 'MCMA') {
      const k = s.tipe === 'PG' ? [s.kunci] : (s.kunci || []);
      h += '<div class="col g6 mt12">' + HUR.filter((x) => NX.plain(op[x] || '') || img[x]).map((x) => { const on = k.indexOf(x) > -1; return '<div class="flex g8 small" style="padding:6px 10px;border-radius:9px;' + (on && !o.noKey ? 'background:var(--ok-50);color:var(--ok-s);font-weight:600' : 'background:var(--muted-bg)') + '"><b>' + x + '.</b><span class="rendered f1">' + NX.rich(op[x]) + (img[x] ? '<img src="' + (/^(https:|data:)/.test(img[x]) ? esc(img[x]) : NX.driveImg(img[x], 400)) + '" style="max-height:90px;display:block;margin-top:4px">' : '') + '</span>' + (on && !o.noKey ? ic('checkCircle', 'sm') : '') + '</div>'; }).join('') + '</div>';
    } else if (s.tipe === 'KATEGORI') {
      const kat = op.kategori || ['Benar', 'Salah'], pr = op.pernyataan || [], k = s.kunci || [];
      h += '<table class="kat-tbl mt12" style="font-size:13px"><thead><tr><th>Pernyataan</th>' + kat.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + pr.map((p, i) => '<tr><td class="rendered">' + NX.rich(p) + '</td>' + kat.map((c) => '<td class="tc">' + (!o.noKey && k[i] === c ? '<span class="ink-ok">' + ic('checkCircle', 'sm') + '</span>' : '<span class="muted">○</span>') + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    } else if (s.tipe === 'ESAI' && !o.noKey) {
      if (op.rubrik) h += '<div class="banner neu mt12" style="display:block"><b class="xs up">Rubrik</b><div class="small mt4" style="white-space:pre-wrap">' + esc(op.rubrik) + '</div></div>';
      if (op.acuan) h += '<div class="banner ok mt8" style="display:block"><b class="xs up">Jawaban acuan</b><div class="small mt4" style="white-space:pre-wrap">' + esc(op.acuan) + '</div></div>';
    }
    return h;
  };
  BK.tipePill = (t) => NX.pill(TL[t] || t, TC[t] || '', 'nodot');
  BK.flagPill = (f) => (f ? NX.pill(f, f === 'Diterima' ? 'ok' : f === 'Direvisi' ? 'warn' : 'err') : '');

  // ------------------------------------------------------------ unggah gambar & lampiran
  BK.uploadImg = async function (src, nama) {
    const isPng = typeof src === 'string' ? /^data:image\/png/.test(src) : src.type === 'image/png';
    const data = await NX.resizeImg(src, 1400, isPng ? 'image/png' : 'image/jpeg', 0.85);
    const small = data.length > 900000 && isPng ? await NX.resizeImg(src, 1400, 'image/jpeg', 0.85) : data;
    return NX.upload('gambar', small, nama || 'gambar_soal.' + (small.indexOf('image/png') > -1 ? 'png' : 'jpg'));
  };
  /** Berkas PDF/Word/gambar → halaman gambar di Drive (maks. 12). Mengembalikan daftar ID. */
  BK.lampiran = async function (file, onProg) {
    const name = file.name.toLowerCase();
    if (/^image\//.test(file.type)) { const r = await NX.upload('lampiran', await NX.resizeImg(file, 1800, 'image/jpeg', 0.85), file.name.replace(/\.\w+$/, '') + '.jpg'); return [r.id]; }
    let bytes;
    if (name.endsWith('.pdf')) bytes = new Uint8Array(await file.arrayBuffer());
    else if (/\.docx?$/.test(name)) {
      onProg && onProg('Mengunggah dokumen Word…');
      const up = await NX.upload('lampiran', await NX.readDataUrl(file), file.name);
      onProg && onProg('Mengonversi Word ke PDF…');
      const r = await NX.api('file.pdf', { id: up.id }, { timeout: 120000 });
      const bin = atob(r.base64); bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else throw new Error('Lampiran harus PDF, Word, atau gambar.');
    const pdfjs = await NX.loadScript(NX.LIB.pdfjs, 'pdfjsLib');
    pdfjs.GlobalWorkerOptions.workerSrc = NX.LIB.pdfjsWorker;
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    const n = Math.min(12, doc.numPages), ids = [];
    for (let i = 1; i <= n; i++) {
      onProg && onProg('Memproses halaman ' + i + ' dari ' + n + '…');
      const pg = await doc.getPage(i), vp0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(2.2, 1500 / vp0.width) });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: g, viewport: vp }).promise;
      const r = await NX.upload('lampiran', c.toDataURL('image/jpeg', 0.82), file.name.replace(/\.\w+$/, '') + '_hal' + i + '.jpg');
      ids.push(r.id);
    }
    if (doc.numPages > 12) NX.toast('Hanya 12 halaman pertama yang dipakai.', 'warn');
    return ids;
  };

  // ------------------------------------------------------------ editor teks kaya
  const TOOLS = [['bold', '<b>B</b>', 'Tebal'], ['italic', '<i>I</i>', 'Miring'], ['underline', '<u>U</u>', 'Garis bawah'], ['superscript', 'x²', 'Pangkat'], ['subscript', 'x₂', 'Indeks'], ['insertUnorderedList', '•', 'Daftar'], ['insertOrderedList', '1.', 'Daftar bernomor'], ['table', ic('table', 'sm'), 'Tabel'], ['img', ic('image', 'sm'), 'Sisipkan gambar'], ['removeFormat', ic('x', 'sm'), 'Hapus format']];
  BK.rich = (key, html, ph, small) => '<div class="rich ' + (small ? 'sm' : '') + '" data-rich="' + key + '"><div class="bar">' + TOOLS.filter((t) => !small || ['bold', 'italic', 'superscript', 'subscript', 'img'].indexOf(t[0]) > -1).map((t) => '<button type="button" data-cmd="' + t[0] + '" title="' + t[2] + '">' + t[1] + '</button>').join('') + '</div><div class="ed rendered" contenteditable="true" data-ph="' + esc(ph || '') + '">' + NX.sanitize(html || '') + '</div></div>';
  BK.richVal = (root, key) => { const ed = root.querySelector('[data-rich="' + key + '"] .ed'); if (!ed) return ''; const h = NX.sanitize(ed.innerHTML); return NX.plain(h) || /<img/i.test(h) ? h.replace(/^(<br>)+|(<br>)+$/g, '') : ''; };
  BK.bindRich = function (root, onChange) {
    root.querySelectorAll('[data-rich]').forEach((box) => {
      if (box._b) return; box._b = 1;
      const ed = box.querySelector('.ed');
      const insertImg = async (file) => {
        try { NX.toast('Mengunggah gambar…'); const r = await BK.uploadImg(file); ed.focus(); document.execCommand('insertHTML', false, '<img src="' + r.url + '" alt="">'); onChange && onChange(); } catch (e) { NX.fail(e); }
      };
      box.querySelector('.bar').addEventListener('mousedown', (e) => {
        const b = e.target.closest('[data-cmd]'); if (!b) return;
        e.preventDefault();
        const c = b.dataset.cmd;
        if (c === 'img') { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => i.files[0] && insertImg(i.files[0]); i.click(); return; }
        if (c === 'table') { document.execCommand('insertHTML', false, '<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><br>'); onChange && onChange(); return; }
        document.execCommand(c, false, null); onChange && onChange();
      });
      ed.addEventListener('input', () => onChange && onChange());
      ed.addEventListener('paste', (e) => {
        const cd = e.clipboardData; if (!cd) return;
        const f = Array.from(cd.files || []).find((x) => /^image\//.test(x.type));
        e.preventDefault();
        if (f) { insertImg(f); return; }
        const html = cd.getData('text/html');
        const clean = html ? NX.sanitize(html.replace(/<img[^>]+src="(?!https:)[^"]*"[^>]*>/gi, '')) : esc(cd.getData('text/plain')).replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, clean);
        onChange && onChange();
      });
    });
  };

  // =================================================================== BANK SOAL — DAFTAR BERKAS
  NX.route('a/bank', {
    role: 'ADMIN', title: 'Bank Soal', nav: 'a/bank',
    async render(p) {
      const list = await NX.load('a_berkas', 'berkas.list', {}, 30000, true);
      const jenis = p.q.jenis || '';
      const show = list.filter((b) => !jenis || b.jenis === jenis);
      const tot = list.reduce((a, b) => a + b.jumlah, 0);
      return '<div class="page-hd"><div><h1>Bank Soal</h1><p>Kelompokkan soal dalam berkas per mapel & jenis ujian. Tulis langsung atau impor dari Word, Excel, dan Google Sheets.</p></div><div class="flex g8 wrap"><button class="btn btn-s" onclick="NX.go(\'a/impor\')">' + ic('upload', 'sm') + 'Impor Soal</button><button class="btn btn-p" id="bkNew">' + ic('plus', 'sm') + 'Berkas Baru</button></div></div>' +
        '<div class="grid gc4 keep2 stagger">' + NX.stat({ label: 'Berkas soal', value: list.length, icon: 'folder' }) + NX.stat({ label: 'Total butir', value: tot, icon: 'layers', color: 'pu' }) + NX.stat({ label: 'Pilihan ganda', value: list.reduce((a, b) => a + b.per_tipe.PG + b.per_tipe.MCMA, 0), icon: 'listCheck', color: 'ok', sub: 'PG + PG kompleks' }) + NX.stat({ label: 'Esai & kategori', value: list.reduce((a, b) => a + b.per_tipe.ESAI + b.per_tipe.KATEGORI, 0), icon: 'pen', color: 'acc' }) + '</div>' +
        '<div class="card mt20"><div class="tabs" style="padding:0 16px">' + [['', 'Semua'], ['UH', 'Ulangan Harian'], ['PTS', 'PTS'], ['PAS', 'PAS'], ['LATIHAN', 'Latihan'], ['UMUM', 'Umum']].map((t) => '<button class="tab ' + (t[0] === jenis ? 'on' : '') + '" onclick="NX.go(\'a/bank' + (t[0] ? '?jenis=' + t[0] : '') + '\')">' + t[1] + '<span class="badge">' + list.filter((b) => !t[0] || b.jenis === t[0]).length + '</span></button>').join('') + '</div>' +
        '<div class="tbar"><div class="input-ic">' + ic('search') + '<input class="input input-sm" id="bkQ" placeholder="Cari berkas…"></div><select class="select input-sm" id="bkM" style="width:auto">' + AD.optMapel('', 'Semua mapel') + '</select></div>' +
        '<div class="card-bd"><div class="grid gc3 stagger" id="bkList">' + (show.length ? show.map(kartu).join('') : '<div style="grid-column:1/-1">' + NX.empty('folder', 'Belum ada berkas soal', 'Buat berkas baru atau impor soal dari Word/Excel.') + '</div>') + '</div></div></div>';
      function kartu(b) {
        return '<div class="card card-p hov" data-bk="' + esc(b.id_berkas) + '" data-m="' + esc(b.id_mapel) + '" data-q="' + esc((b.nama + ' ' + b.mapel).toLowerCase()) + '" style="cursor:pointer"><div class="flex g12">' + NX.mapelTile(b.mapel) + '<div class="f1" style="min-width:0"><div class="flex g6 wrap">' + AD.jenisPill(b.jenis) + '</div><h3 class="mt8 clamp2" style="font-size:16px">' + esc(b.nama) + '</h3><div class="xs muted mt4">' + esc(b.mapel) + (b.kelas.length ? ' · ' + esc(b.kelas.map(AD.namaKelas).join(', ')) : '') + '</div></div><button class="icon-btn sm" data-bm="' + esc(b.id_berkas) + '" aria-label="Tindakan">' + ic('more', 'sm') + '</button></div>' +
          '<div class="flex g6 wrap mt16">' + ['PG', 'MCMA', 'KATEGORI', 'ESAI'].filter((t) => b.per_tipe[t]).map((t) => '<span class="chip static">' + b.per_tipe[t] + ' ' + TL[t] + '</span>').join('') + (b.jumlah ? '' : '<span class="xs muted">Belum ada soal</span>') + '</div>' +
          '<div class="divider" style="margin:14px 0 10px"></div><div class="flex jb xs muted"><span><b class="num" style="font-size:16px;color:var(--tx)">' + b.jumlah + '</b> butir · skor ' + F.num(b.total_skor) + '</span><span>' + esc(b.pembuat || '') + '</span></div></div>';
      }
    },
    mount(p, root) {
      const list = S.cache.a_berkas.d;
      const filt = () => { const q = root.querySelector('#bkQ').value.toLowerCase(), m = root.querySelector('#bkM').value; root.querySelectorAll('[data-bk]').forEach((c) => { c.style.display = (!q || c.dataset.q.indexOf(q) > -1) && (!m || c.dataset.m === m) ? '' : 'none'; }); };
      root.querySelector('#bkQ').oninput = filt; root.querySelector('#bkM').onchange = filt;
      root.querySelector('#bkNew').onclick = () => BK.formBerkas(null);
      root.querySelector('#bkList').addEventListener('click', (e) => {
        const mb = e.target.closest('[data-bm]');
        if (mb) { e.stopPropagation(); const b = list.find((x) => x.id_berkas === mb.dataset.bm); BK.menuBerkas(mb, b); return; }
        const c = e.target.closest('[data-bk]'); if (c) NX.go('a/bank/' + c.dataset.bk);
      });
    }
  });
  BK.menuBerkas = (btn, b) => NX.menu(btn, [
    { icon: 'folder', label: 'Buka', run: () => NX.go('a/bank/' + b.id_berkas) },
    { icon: 'edit', label: 'Ubah info berkas', run: () => BK.formBerkas(b) },
    { icon: 'upload', label: 'Impor soal ke berkas ini', run: () => NX.go('a/impor?berkas=' + b.id_berkas) },
    { icon: 'download', label: 'Ekspor Excel', run: () => BK.ekspor(b) },
    { sep: 1 },
    { icon: 'trash', label: 'Hapus berkas', danger: true, run: () => NX.confirm('Hapus berkas <b>' + esc(b.nama) + '</b> beserta ' + b.jumlah + ' soal di dalamnya?', { title: 'Hapus berkas', yes: 'Hapus', danger: true }).then(async (y) => { if (!y) return; try { await NX.api('berkas.simpan', { id_berkas: b.id_berkas, status: 'DIHAPUS' }); NX.drop('a_berkas'); NX.toast('Berkas dihapus.', 'ok'); NX.go('a/bank'); } catch (e) { NX.fail(e); } }) }
  ]);
  BK.formBerkas = function (b, onSaved) {
    b = b || { nama: '', id_mapel: '', jenis: 'UH', kelas: [] };
    const m = NX.modal({ title: b.id_berkas ? 'Ubah Berkas Soal' : 'Berkas Soal Baru', icon: 'folder',
      body: '<div class="form-grid"><div class="field full"><label class="label">Nama berkas <span class="req">*</span></label><input class="input" name="nama" maxlength="100" value="' + esc(b.nama) + '" placeholder="mis. PAS Ganjil Matematika X" autofocus></div><div class="field"><label class="label">Mata pelajaran <span class="req">*</span></label><select class="select" name="id_mapel">' + AD.optMapel(b.id_mapel, '— pilih —') + '</select></div><div class="field"><label class="label">Jenis</label><select class="select" name="jenis">' + AD.optJenis(b.jenis) + '</select></div><div class="field full"><label class="label">Kelas (opsional)</label>' + AD.chipsKelas('bk', b.kelas) + '</div></div>',
      foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="bfOk">Simpan</button>' });
    AD.bindChips(m.el);
    m.$('#bfOk').onclick = async (e) => {
      const d = { id_berkas: b.id_berkas || '', nama: AD.v(m.el, 'nama'), id_mapel: AD.v(m.el, 'id_mapel'), jenis: AD.v(m.el, 'jenis'), kelas: AD.chipVals(m.el, 'bk') };
      if (!d.nama || !d.id_mapel) { NX.toast('Nama berkas dan mapel wajib diisi.', 'warn'); return; }
      NX.btnBusy(e.currentTarget, true);
      try { const r = await NX.api('berkas.simpan', d); m.close(true); NX.drop('a_berkas'); NX.toast('Berkas tersimpan.', 'ok'); if (onSaved) onSaved(r); else if (!b.id_berkas) NX.go('a/bank/' + r.id_berkas); else NX.rerender(); } catch (er) { NX.fail(er); NX.btnBusy(e.currentTarget, false); }
    };
  };
  /** Ekspor berkas ke Excel dengan format yang sama dengan template impor (bisa diimpor ulang). */
  BK.ekspor = async function (b) {
    try {
      const list = await NX.api('soal.list', { id_berkas: b.id_berkas });
      const rows = [['tipe', 'soal', 'opsi_A', 'opsi_B', 'opsi_C', 'opsi_D', 'opsi_E', 'kunci', 'skor', 'mode_skor', 'gambar']];
      list.forEach((s) => {
        const o = s.opsi || {};
        if (s.tipe === 'PG' || s.tipe === 'MCMA') rows.push([s.tipe, NX.plain(s.teks)].concat(HUR.map((h) => NX.plain(o[h] || ''))).concat([s.tipe === 'PG' ? s.kunci : (s.kunci || []).join(', '), s.skor_maks, s.mode_skor, s.gambar]));
        else if (s.tipe === 'KATEGORI') { const kat = o.kategori || []; rows.push(['KATEGORI', [NX.plain(s.teks)].concat((o.pernyataan || []).map(NX.plain)).join(' | ')].concat(HUR.map((h, i) => kat[i] || '')).concat([(s.kunci || []).join(' | '), s.skor_maks, s.mode_skor, s.gambar])); }
        else rows.push(['ESAI', NX.plain(s.teks), o.rubrik || '', '', '', '', '', o.acuan || '', s.skor_maks, '', s.gambar]);
      });
      NX.exportXlsx('Soal_' + b.nama, [{ name: 'Soal', cols: [10, 60, 24, 24, 24, 24, 24, 16, 6, 14, 20], rows }]);
    } catch (e) { NX.fail(e); }
  };

  // =================================================================== BERKAS — DAFTAR SOAL
  NX.route('a/bank/:id', {
    role: 'ADMIN', title: 'Bank Soal', nav: 'a/bank',
    async render(p) {
      const [blist, soal] = await Promise.all([NX.load('a_berkas', 'berkas.list', {}, 30000, true), NX.load('a_soal_' + p.id, 'soal.list', { id_berkas: p.id }, 30000, true)]);
      const b = blist.find((x) => x.id_berkas === p.id);
      if (!b) return NX.empty('folder', 'Berkas tidak ditemukan', '', '<button class="btn btn-p mt12" onclick="NX.go(\'a/bank\')">Kembali</button>');
      const t = p.q.tipe || '';
      BK._cur = { b, soal };
      const show = soal.filter((s) => !t || s.tipe === t);
      return '<div class="page-hd"><div><div class="crumb"><a href="#/a/bank">Bank Soal</a> ' + ic('chevR', 'sm') + ' ' + esc(b.nama) + '</div><h1 class="flex ic g12 wrap">' + esc(b.nama) + ' ' + AD.jenisPill(b.jenis) + '</h1><p>' + esc(b.mapel) + (b.kelas.length ? ' · ' + esc(b.kelas.map(AD.namaKelas).join(', ')) : '') + ' · ' + soal.length + ' butir · total skor ' + F.num(soal.reduce((a, s) => a + s.skor_maks, 0)) + '</p></div>' +
        '<div class="flex g8 wrap"><button class="btn btn-s" id="bdMore">' + ic('more', 'sm') + 'Berkas</button><button class="btn btn-s" onclick="NX.go(\'a/impor?berkas=' + b.id_berkas + '\')">' + ic('upload', 'sm') + 'Impor</button><button class="btn btn-p" id="bdAdd">' + ic('plus', 'sm') + 'Tambah Soal</button></div></div>' +
        '<div class="card"><div class="tbar"><div class="chips">' + [['', 'Semua', soal.length]].concat(['PG', 'MCMA', 'KATEGORI', 'ESAI'].map((x) => [x, TL[x], soal.filter((s) => s.tipe === x).length])).map((c) => '<button class="chip ' + (c[0] === t ? 'on' : '') + '" onclick="NX.go(\'a/bank/' + b.id_berkas + (c[0] ? '?tipe=' + c[0] : '') + '\')">' + c[1] + ' <b>' + c[2] + '</b></button>').join('') + '</div><div class="ml-a flex ic g8"><label class="check small"><input type="checkbox" id="bdAll"><span>Pilih semua</span></label><button class="btn btn-do btn-sm" id="bdDel" disabled>' + ic('trash', 'sm') + 'Hapus terpilih</button></div></div>' +
        '<div class="col" id="bdList">' + (show.length ? show.map((s, i) => '<div class="soal-card" style="border-bottom:1px solid var(--div)" data-s="' + esc(s.id_soal) + '"><div class="col g8 ic"><input type="checkbox" data-sel="' + esc(s.id_soal) + '" style="width:18px;height:18px;accent-color:var(--p)"><span class="no">' + s.nomor + '</span></div><div class="f1" style="min-width:0"><div class="flex g6 wrap mb8">' + BK.tipePill(s.tipe) + '<span class="chip static">Skor ' + F.num(s.skor_maks) + '</span>' + (s.tipe === 'MCMA' || s.tipe === 'KATEGORI' ? '<span class="chip static">' + (s.mode_skor === 'SEMUA' ? 'Semua benar' : 'Proporsional') + '</span>' : '') + BK.flagPill(s.flag) + '</div>' + BK.render(s) + '</div>' +
          '<div class="col g6"><button class="icon-btn sm" data-ed="' + esc(s.id_soal) + '" data-tip="Ubah">' + ic('edit', 'sm') + '</button><button class="icon-btn sm" data-dup="' + esc(s.id_soal) + '" data-tip="Duplikat">' + ic('copy', 'sm') + '</button>' + (t ? '' : '<button class="icon-btn sm" data-up="' + i + '" data-tip="Naik" ' + (i ? '' : 'disabled') + '>' + ic('chevU', 'sm') + '</button><button class="icon-btn sm" data-dn="' + i + '" data-tip="Turun" ' + (i < show.length - 1 ? '' : 'disabled') + '>' + ic('chevD', 'sm') + '</button>') + '<button class="icon-btn sm" data-del="' + esc(s.id_soal) + '" data-tip="Hapus">' + ic('trash', 'sm') + '</button></div></div>').join('')
          : NX.empty('layers', 'Belum ada soal', 'Tambahkan soal atau impor dari Word/Excel.', '<div class="flex g8 jc mt12"><button class="btn btn-p" id="bdAdd2">' + ic('plus', 'sm') + 'Tambah Soal</button><button class="btn btn-s" onclick="NX.go(\'a/impor?berkas=' + b.id_berkas + '\')">' + ic('upload', 'sm') + 'Impor</button></div>')) + '</div></div>';
    },
    mount(p, root) {
      const cur = BK._cur; if (!cur) return;
      const { b, soal } = cur;
      const tambah = (btn) => NX.menu(btn, TIPE.map((t) => ({ icon: t[2], label: t[1], run: () => NX.go('a/soal/' + b.id_berkas + '/baru?tipe=' + t[0]) })));
      root.querySelector('#bdAdd').onclick = (e) => tambah(e.currentTarget);
      const a2 = root.querySelector('#bdAdd2'); if (a2) a2.onclick = (e) => tambah(e.currentTarget);
      root.querySelector('#bdMore').onclick = (e) => BK.menuBerkas(e.currentTarget, b);
      const sel = () => Array.from(root.querySelectorAll('[data-sel]:checked')).map((c) => c.dataset.sel);
      const upd = () => { const n = sel().length; const d = root.querySelector('#bdDel'); d.disabled = !n; d.innerHTML = ic('trash', 'sm') + 'Hapus terpilih' + (n ? ' (' + n + ')' : ''); };
      root.querySelector('#bdAll').onchange = (e) => { root.querySelectorAll('[data-sel]').forEach((c) => { c.checked = e.target.checked; }); upd(); };
      const hapus = async (ids) => {
        if (!(await NX.confirm('Hapus ' + ids.length + ' soal?', { title: 'Hapus soal', yes: 'Hapus', danger: true }))) return;
        try { await NX.api('soal.hapus', { ids }); AD.ok(ids.length + ' soal dihapus.', ['a_soal_' + b.id_berkas, 'a_berkas']); } catch (e) { NX.fail(e); }
      };
      root.querySelector('#bdDel').onclick = () => hapus(sel());
      const order = soal.map((s) => s.id_soal);
      root.querySelector('#bdList').addEventListener('change', upd);
      root.querySelector('#bdList').addEventListener('click', async (e) => {
        const g = (a) => e.target.closest('[' + a + ']');
        let x;
        if ((x = g('data-ed'))) NX.go('a/soal/' + b.id_berkas + '/' + x.dataset.ed);
        else if ((x = g('data-del'))) hapus([x.dataset.del]);
        else if ((x = g('data-dup'))) {
          const s = soal.find((z) => z.id_soal === x.dataset.dup);
          try { await NX.api('soal.simpan', Object.assign({}, s, { id_soal: '', id_berkas: b.id_berkas })); AD.ok('Soal diduplikat.', ['a_soal_' + b.id_berkas, 'a_berkas']); } catch (er) { NX.fail(er); }
        } else if ((x = g('data-up')) || (x = g('data-dn'))) {
          const i = +(x.dataset.up !== undefined ? x.dataset.up : x.dataset.dn), j = x.dataset.up !== undefined ? i - 1 : i + 1;
          const o = order.slice(); const t = o[i]; o[i] = o[j]; o[j] = t;
          try { await NX.api('soal.urut', { urutan: o }); AD.ok('', ['a_soal_' + b.id_berkas]); } catch (er) { NX.fail(er); }
        }
      });
    }
  });

  // =================================================================== EDITOR SOAL
  NX.route('a/soal/:berkas/:id', {
    role: 'ADMIN', title: 'Editor Soal', nav: 'a/bank',
    async render(p) {
      const [blist, soal] = await Promise.all([NX.api('berkas.list', {}), NX.api('soal.list', { id_berkas: p.berkas })]);
      const b = blist.find((x) => x.id_berkas === p.berkas);
      if (!b) return NX.empty('folder', 'Berkas tidak ditemukan', '');
      let s = p.id !== 'baru' ? soal.find((x) => x.id_soal === p.id) : null;
      if (p.id !== 'baru' && !s) return NX.empty('xCircle', 'Soal tidak ditemukan', '');
      const tipe = (s && s.tipe) || p.q.tipe || 'PG';
      s = s ? JSON.parse(JSON.stringify(s)) : { tipe, teks: '', opsi: tipe === 'KATEGORI' ? { pernyataan: ['', ''], kategori: ['Benar', 'Salah'] } : {}, kunci: tipe === 'KATEGORI' ? ['Benar', 'Salah'] : tipe === 'MCMA' ? [] : '', skor_maks: tipe === 'ESAI' ? 20 : 10, mode_skor: 'PROPORSIONAL', gambar: '', lampiran: [] };
      BK._ed = { b, s, idx: soal.findIndex((x) => x.id_soal === p.id), soal };
      return '<div id="sed"><div class="page-hd"><div><div class="crumb"><a href="#/a/bank">Bank Soal</a> ' + ic('chevR', 'sm') + ' <a href="#/a/bank/' + esc(b.id_berkas) + '">' + esc(b.nama) + '</a> ' + ic('chevR', 'sm') + ' ' + (s.id_soal ? 'Soal No. ' + s.nomor : 'Soal baru') + '</div><h1>' + (s.id_soal ? 'Ubah Soal' : 'Tulis Soal Baru') + '</h1></div>' +
        '<div class="flex g8 wrap"><button class="btn btn-s" onclick="NX.go(\'a/bank/' + esc(b.id_berkas) + '\')">Batal</button>' + (s.id_soal ? '' : '<button class="btn btn-o" data-sv="lagi">' + ic('plus', 'sm') + 'Simpan & Tambah Lagi</button>') + '<button class="btn btn-p" data-sv="ok">' + ic('check', 'sm') + 'Simpan Soal</button></div></div>' +
        '<div class="split" style="grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)">' +
          '<div class="col g20" style="min-width:0"><section class="card card-p"><div class="field"><span class="label">Tipe soal</span><div class="seg" id="edTipe" style="flex-wrap:wrap">' + TIPE.map((t) => '<button type="button" data-v="' + t[0] + '" class="' + (t[0] === s.tipe ? 'on' : '') + '">' + ic(t[2], 'sm') + t[1] + '</button>').join('') + '</div></div>' +
            '<div class="field mt20"><span class="label">Teks soal <span class="req">*</span></span>' + BK.rich('teks', s.teks, 'Tulis pertanyaan di sini. Tempel dari Word juga bisa — format dasar dipertahankan.') + '</div>' +
            '<div class="grid gc2 mt16" style="gap:16px"><div class="field"><span class="label">Gambar soal (opsional)</span><div id="edGbr"></div></div><div class="field"><span class="label">Lampiran / bacaan (opsional)</span><div id="edLamp"></div><span class="help">PDF, Word, atau gambar → dipecah per halaman (maks. 12).</span></div></div></section>' +
            '<section class="card card-p" id="edBody"></section></div>' +
          '<aside class="col g20"><section class="card card-p"><h3 class="flex ic g8">' + ic('award', 'ink-p') + 'Penilaian</h3><div class="form-grid mt16"><div class="field"><label class="label">Skor maksimal</label><input class="input" type="number" min="0.5" step="0.5" name="skor_maks" value="' + esc(s.skor_maks) + '"><span class="help">Bobot bawaan saat dipakai di ujian.</span></div><div class="field" id="edModeF"><label class="label">Cara menilai</label><select class="select" name="mode_skor"><option value="PROPORSIONAL" ' + (s.mode_skor !== 'SEMUA' ? 'selected' : '') + '>Proporsional</option><option value="SEMUA" ' + (s.mode_skor === 'SEMUA' ? 'selected' : '') + '>Harus benar semua</option></select><span class="help" id="edModeH"></span></div></div></section>' +
            '<section class="card card-p" style="position:sticky;top:90px"><div class="flex jb ic"><h3>Pratinjau</h3>' + NX.pill('Tampilan siswa + kunci', 'p', 'nodot') + '</div><div id="edPrev" class="mt16"></div></section></aside>' +
        '</div></div>';
    },
    mount(p, page) {
      const root = page.querySelector('#sed'); if (!root) return;
      const E = BK._ed, s = E.s;
      const prev = NX.debounce(() => { collect(); root.querySelector('#edPrev').innerHTML = '<div class="flex g6 mb8">' + BK.tipePill(s.tipe) + '<span class="chip static">Skor ' + F.num(s.skor_maks) + '</span></div>' + BK.render(s); }, 150);
      function collect() {
        s.teks = BK.richVal(root, 'teks');
        s.skor_maks = +AD.v(root, 'skor_maks') || 1;
        s.mode_skor = AD.v(root, 'mode_skor');
        const body = root.querySelector('#edBody');
        if (s.tipe === 'PG' || s.tipe === 'MCMA') {
          const img = (s.opsi && s.opsi.img) || {};
          s.opsi = { img };
          HUR.forEach((h) => { s.opsi[h] = BK.richVal(body, 'op' + h); });
          const k = Array.from(body.querySelectorAll('[data-key]:checked')).map((c) => c.dataset.key);
          s.kunci = s.tipe === 'PG' ? (k[0] || '') : k;
        } else if (s.tipe === 'KATEGORI') {
          const kat = Array.from(body.querySelectorAll('[data-kat]')).map((i) => i.value.trim()).filter(Boolean);
          const rows = Array.from(body.querySelectorAll('[data-pr]'));
          const isi = rows.filter((r) => r.querySelector('input').value.trim());
          s.opsi = { kategori: kat, pernyataan: isi.map((r) => esc(r.querySelector('input').value.trim())) };
          s.kunci = isi.map((r) => r.querySelector('select').value);
          s._prRaw = rows.map((r) => [r.querySelector('input').value, r.querySelector('select').value]);
        } else {
          s.opsi = { rubrik: AD.v(body, 'rubrik'), acuan: AD.v(body, 'acuan') };
          s.kunci = null;
        }
      }
      function drawBody() {
        const body = root.querySelector('#edBody');
        const o = s.opsi || {};
        root.querySelector('#edModeF').style.display = s.tipe === 'MCMA' || s.tipe === 'KATEGORI' ? '' : 'none';
        root.querySelector('#edModeH').textContent = s.tipe === 'MCMA' ? 'Proporsional: (benar − salah pilih) ÷ jumlah kunci.' : 'Proporsional: jumlah pernyataan benar ÷ total.';
        if (s.tipe === 'PG' || s.tipe === 'MCMA') {
          const img = o.img || {}, k = s.tipe === 'PG' ? [s.kunci] : (Array.isArray(s.kunci) ? s.kunci : []);
          body.innerHTML = '<div class="flex jb ic"><h3>Pilihan Jawaban</h3><span class="small muted">' + (s.tipe === 'PG' ? 'Pilih satu kunci jawaban' : 'Centang semua jawaban yang benar') + '</span></div><div class="col g12 mt16">' +
            HUR.map((h) => '<div class="opt-row ' + (k.indexOf(h) > -1 ? 'key' : '') + '" data-row="' + h + '"><span class="lt">' + h + '</span><div class="f1" style="min-width:0">' + BK.rich('op' + h, o[h] || '', 'Pilihan ' + h + (h > 'B' ? ' (opsional)' : ''), true) + '<div class="flex ic g8 mt8" data-oimg="' + h + '">' + (img[h] ? '<img src="' + (/^(https:|data:)/.test(img[h]) ? esc(img[h]) : NX.driveImg(img[h], 300)) + '" style="height:56px;border-radius:8px;border:1px solid var(--line)"><button type="button" class="btn btn-g btn-xs" data-oimgdel="' + h + '">' + ic('x', 'sm') + 'Hapus gambar</button>' : '<label class="btn btn-g btn-xs">' + ic('image', 'sm') + 'Gambar pilihan<input type="file" accept="image/*" hidden data-oimgup="' + h + '"></label>') + '</div></div>' +
              '<label class="check" style="margin-top:8px" title="Kunci jawaban"><input type="' + (s.tipe === 'PG' ? 'radio' : 'checkbox') + '" name="kunci" data-key="' + h + '" ' + (k.indexOf(h) > -1 ? 'checked' : '') + '><span class="xs b6">Kunci</span></label></div>').join('') + '</div>';
          body.onchange = (e) => { if (e.target.matches('[data-key]')) { body.querySelectorAll('.opt-row').forEach((r) => r.classList.toggle('key', !!r.querySelector('[data-key]:checked'))); prev(); } };
          body.onclick = null;
        } else if (s.tipe === 'KATEGORI') {
          const kat = o.kategori && o.kategori.length ? o.kategori : ['Benar', 'Salah'], pr = o.pernyataan && o.pernyataan.length ? o.pernyataan : ['', ''], k = Array.isArray(s.kunci) ? s.kunci : [];
          body.innerHTML = '<h3>Kategori & Pernyataan</h3><p class="small muted mt4">Contoh: Benar/Salah, Fakta/Opini, Setuju/Tidak setuju. Siswa memilih satu kategori untuk setiap pernyataan.</p>' +
            '<div class="field mt16"><span class="label">Kategori</span><div class="flex g8 wrap" id="katBox">' + kat.map((c) => '<input class="input input-sm" data-kat value="' + esc(c) + '" style="width:150px" maxlength="40">').join('') + '<button type="button" class="btn btn-s btn-sm" id="katAdd">' + ic('plus', 'sm') + '</button></div></div>' +
            '<div class="field mt16"><span class="label">Pernyataan & kunci</span><div class="col g8" id="prBox">' + pr.map((t, i) => rowPr(t, k[i], kat)).join('') + '</div><button type="button" class="btn btn-s btn-sm mt8" id="prAdd" style="align-self:flex-start">' + ic('plus', 'sm') + 'Tambah pernyataan</button></div>';
          body.querySelector('#katAdd').onclick = () => { if (body.querySelectorAll('[data-kat]').length >= 5) return; body.querySelector('#katAdd').insertAdjacentHTML('beforebegin', '<input class="input input-sm" data-kat value="" style="width:150px" maxlength="40" placeholder="Kategori baru">'); };
          body.querySelector('#prAdd').onclick = () => { collect(); body.querySelector('#prBox').insertAdjacentHTML('beforeend', rowPr('', '', s.opsi.kategori)); body.querySelector('#prBox [data-pr]:last-child input').focus(); prev(); };
          body.onclick = (e) => { const b = e.target.closest('[data-prdel]'); if (b && body.querySelectorAll('[data-pr]').length > 1) { b.closest('[data-pr]').remove(); prev(); } };
          body.onchange = (e) => { if (e.target.matches('[data-kat]')) { collect(); body.querySelectorAll('[data-pr] select').forEach((sel) => { const v = sel.value; sel.innerHTML = s.opsi.kategori.map((c) => '<option ' + (c === v ? 'selected' : '') + '>' + esc(c) + '</option>').join(''); }); } prev(); };
        } else {
          body.onchange = null; body.onclick = null;
          body.innerHTML = '<h3>Pedoman Penilaian Esai</h3><p class="small muted mt4">Dikoreksi manual oleh guru di menu Hasil → Koreksi Esai. Rubrik & acuan tidak pernah dikirim ke siswa.</p><div class="field mt16"><label class="label">Rubrik penilaian</label><textarea class="textarea" name="rubrik" rows="5" maxlength="3000" placeholder="mis. Skor 20: menjelaskan 3 faktor dengan contoh…">' + esc(o.rubrik || '') + '</textarea></div><div class="field mt16"><label class="label">Jawaban acuan</label><textarea class="textarea" name="acuan" rows="5" maxlength="3000">' + esc(o.acuan || '') + '</textarea></div>';
        }
        BK.bindRich(body, prev);
        body.oninput = prev;
        prev();
      }
      function rowPr(t, k, kat) { return '<div class="flex g8 ic" data-pr><input class="input input-sm f1" value="' + esc(NX.plain(t)) + '" placeholder="Pernyataan" maxlength="500"><select class="select input-sm" style="width:auto">' + kat.map((c) => '<option ' + (c === k ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select><button type="button" class="icon-btn sm" data-prdel aria-label="Hapus">' + ic('x', 'sm') + '</button></div>'; }
      // gambar opsi
      root.querySelector('#edBody').addEventListener('change', async (e) => {
        const up = e.target.closest('[data-oimgup]'); if (!up || !up.files[0]) return;
        const h = up.dataset.oimgup;
        try { NX.toast('Mengunggah gambar…'); const r = await BK.uploadImg(up.files[0]); collect(); s.opsi.img = s.opsi.img || {}; s.opsi.img[h] = r.id; drawBody(); } catch (er) { NX.fail(er); }
      });
      root.querySelector('#edBody').addEventListener('click', (e) => { const d = e.target.closest('[data-oimgdel]'); if (!d) return; collect(); delete s.opsi.img[d.dataset.oimgdel]; drawBody(); });
      // gambar soal
      const drawGbr = () => {
        const el = root.querySelector('#edGbr');
        el.innerHTML = s.gambar ? '<div class="figure" style="margin:0"><img src="' + NX.driveImg(s.gambar, 600) + '" alt=""></div><button type="button" class="btn btn-g btn-xs mt8" id="gbDel">' + ic('trash', 'sm') + 'Hapus gambar</button>' : '<label class="dropzone" style="display:block;padding:18px">' + ic('image') + '<div class="small b6 mt4">Unggah gambar</div><input type="file" accept="image/*" hidden id="gbUp"></label>';
        const up = el.querySelector('#gbUp'); if (up) up.onchange = async () => { if (!up.files[0]) return; el.innerHTML = '<div class="small muted">' + ic('upload', 'sm') + ' Mengunggah…</div>'; try { const r = await BK.uploadImg(up.files[0]); s.gambar = r.id; } catch (er) { NX.fail(er); } drawGbr(); prev(); };
        const del = el.querySelector('#gbDel'); if (del) del.onclick = () => { s.gambar = ''; drawGbr(); prev(); };
      };
      const drawLamp = () => {
        const el = root.querySelector('#edLamp');
        el.innerHTML = (s.lampiran.length ? '<div class="flex g6 wrap">' + s.lampiran.map((id, i) => '<div style="position:relative"><img src="' + NX.driveImg(id, 200) + '" style="height:72px;border-radius:8px;border:1px solid var(--line);cursor:zoom-in" onclick="NX.zoomImg(\'' + NX.driveImg(id, 1600) + '\')"><span class="badge" style="position:absolute;top:4px;left:4px">' + (i + 1) + '</span></div>').join('') + '</div><button type="button" class="btn btn-g btn-xs mt8" id="lpDel">' + ic('trash', 'sm') + 'Hapus lampiran</button>' : '<label class="dropzone" style="display:block;padding:18px">' + ic('clip') + '<div class="small b6 mt4">PDF / Word / gambar</div><input type="file" accept=".pdf,.doc,.docx,image/*" hidden id="lpUp"></label>');
        const up = el.querySelector('#lpUp'); if (up) up.onchange = async () => { if (!up.files[0]) return; const f = up.files[0]; try { s.lampiran = await BK.lampiran(f, (t) => { el.innerHTML = '<div class="small muted">' + ic('upload', 'sm') + ' ' + esc(t) + '</div>'; }); NX.toast(s.lampiran.length + ' halaman lampiran siap.', 'ok'); } catch (er) { NX.fail(er); } drawLamp(); prev(); };
        const del = el.querySelector('#lpDel'); if (del) del.onclick = () => { s.lampiran = []; drawLamp(); prev(); };
      };
      root.querySelector('#edTipe').onclick = (e) => {
        const b = e.target.closest('button'); if (!b || b.dataset.v === s.tipe) return;
        collect();
        const old = s.tipe; s.tipe = b.dataset.v;
        root.querySelectorAll('#edTipe button').forEach((z) => z.classList.toggle('on', z === b));
        if (s.tipe === 'KATEGORI') { s.opsi = { kategori: ['Benar', 'Salah'], pernyataan: [''] }; s.kunci = []; }
        else if (s.tipe === 'ESAI') { s.opsi = {}; s.kunci = null; }
        else if (old === 'PG' || old === 'MCMA') s.kunci = s.tipe === 'PG' ? (Array.isArray(s.kunci) ? s.kunci[0] || '' : s.kunci) : (s.kunci ? [].concat(s.kunci).filter(Boolean) : []);
        else { s.opsi = {}; s.kunci = s.tipe === 'PG' ? '' : []; }
        drawBody();
      };
      BK.bindRich(root.querySelector('[data-rich="teks"]').parentElement, prev);
      root.querySelector('[name=skor_maks]').oninput = prev;
      root.querySelector('[name=mode_skor]').onchange = prev;
      drawGbr(); drawLamp(); drawBody();
      root.querySelectorAll('[data-sv]').forEach((btn) => btn.onclick = async () => {
        collect();
        if (!s.teks && !s.gambar) { NX.toast('Teks soal wajib diisi.', 'warn'); return; }
        if (s.tipe === 'PG' && !s.kunci) { NX.toast('Pilih kunci jawaban.', 'warn'); return; }
        if (s.tipe === 'MCMA' && !s.kunci.length) { NX.toast('Centang minimal satu kunci jawaban.', 'warn'); return; }
        NX.btnBusy(btn, true, 'Menyimpan…');
        try {
          const kirim = Object.assign({}, s, { id_berkas: E.b.id_berkas, id_soal: s.id_soal || '' }); delete kirim._prRaw;
          await NX.api('soal.simpan', kirim);
          delete s._prRaw;
          NX.drop('a_soal_' + E.b.id_berkas); NX.drop('a_berkas');
          NX.toast('Soal tersimpan.', 'ok');
          if (btn.dataset.sv === 'lagi') NX.go('a/soal/' + E.b.id_berkas + '/baru?tipe=' + s.tipe + '&t=' + Date.now());
          else NX.go('a/bank/' + E.b.id_berkas);
        } catch (er) { NX.fail(er); NX.btnBusy(btn, false); }
      });
    }
  });

  // =================================================================== IMPOR SOAL (3 langkah)
  /* ---------- Parser Word (HTML dari mammoth) ---------- */
  const RX = {
    no: /^\s*(\d{1,3})\s*[.)]\s*/, opt: /^\s*([A-Ea-e])\s*[.)]\s+/, kunci: /^\s*kunci(\s*jawaban)?\s*[:=]\s*(.*)$/i, skor: /^\s*(skor|bobot|poin|nilai)\s*(maks(imal)?)?\s*[:=]\s*([\d.,]+)/i,
    mode: /^\s*mode(\s*skor)?\s*[:=]\s*(semua|proporsional)/i, tipe: /^\s*tipe(\s*soal)?\s*[:=]\s*([\w -]+)/i, kat: /^\s*kategori\s*[:=]\s*(.+)$/i,
    tag: /^\s*\[\s*(PG|MCMA|PGK|PG\s*KOMPLEKS|KOMPLEKS|KATEGORI|BS|BENAR\s*-?\s*SALAH|ESAI|ESSAY|URAIAN)\s*\]\s*/i, rubrik: /^\s*(rubrik|pedoman(\s*penskoran)?)\s*[:=]\s*(.*)$/i, acuan: /^\s*(acuan|jawaban\s*acuan|kunci\s*esai|jawaban)\s*[:=]\s*(.*)$/i, bullet: /^\s*[-•·▪*]\s+/
  };
  function normTipe(t) { t = String(t || '').toUpperCase().replace(/\s|-/g, ''); if (/^(MCMA|PGK|PGKOMPLEKS|KOMPLEKS|PILIHANGANDAKOMPLEKS)$/.test(t)) return 'MCMA'; if (/^(KATEGORI|BS|BENARSALAH)$/.test(t)) return 'KATEGORI'; if (/^(ESAI|ESSAY|URAIAN|ISIAN)$/.test(t)) return 'ESAI'; if (/^(PG|PILIHANGANDA)$/.test(t)) return 'PG'; return ''; }
  function splitBar(v) { return String(v || '').split(/\s*[|]\s*|\s*;\s*/).map((x) => x.trim()).filter(Boolean); }
  BK.parseWordHtml = function (html) {
    const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    const blocks = [];
    const pushBlock = (el, kind) => {
      const imgs = Array.from(el.querySelectorAll('img')).map((i) => i.getAttribute('src')).filter(Boolean);
      el.querySelectorAll('img').forEach((i) => i.remove());
      const inner = NX.sanitize(el.innerHTML).replace(/<p>|<\/p>/g, '');
      const text = el.textContent.replace(/ /g, ' ').trim();
      blocks.push({ html: inner, text, imgs, kind });
    };
    Array.from(doc.body.firstChild.children).forEach((el) => {
      if (el.tagName === 'OL' || el.tagName === 'UL') Array.from(el.children).forEach((li) => pushBlock(li, el.tagName === 'OL' ? 'ol' : 'ul'));
      else if (el.tagName === 'TABLE') blocks.push({ html: NX.sanitize(el.outerHTML), text: el.textContent.trim(), imgs: [], kind: 'table' });
      else pushBlock(el, 'p');
    });
    const items = []; let q = null, sect = 'stem', lastOpt = '', autoNo = 0;
    const baru = (rest, no) => { q = { no: no || ++autoNo, tipe: '', teks: '', gambar: '', imgs: [], opsi: {}, oimg: {}, kunci: '', pern: [], kat: [], rubrik: '', acuan: '', skor: '', mode: '' }; items.push(q); sect = 'stem'; lastOpt = ''; const tg = RX.tag.exec(rest.text); if (tg) { q.tipe = normTipe(tg[1]); rest.html = rest.html.replace(/\[\s*(PG|MCMA|PGK|PG\s*KOMPLEKS|KOMPLEKS|KATEGORI|BS|BENAR\s*-?\s*SALAH|ESAI|ESSAY|URAIAN)\s*\]\s*/i, ''); } if (rest.html.trim()) q.teks = rest.html.trim(); rest.imgs.forEach((s) => (q.gambar ? q.imgs.push(s) : (q.gambar = s))); };
    blocks.forEach((b) => {
      const t = b.text;
      if (!t && !b.imgs.length && b.kind !== 'table') return;
      let m;
      if (b.kind === 'p' && (m = RX.no.exec(t)) && (!q || q.kunci || +m[1] === q.no + 1)) { baru({ text: t.replace(RX.no, ''), html: b.html.replace(/^\s*(<[^>]+>)*\s*\d{1,3}\s*[.)]\s*/, '$1'), imgs: b.imgs }, +m[1]); autoNo = +m[1]; return; }
      if (b.kind === 'ol' && (!q || q.kunci)) { baru({ text: t, html: b.html, imgs: b.imgs }); return; }
      if (!q) return; // teks pengantar sebelum soal nomor 1 diabaikan
      if ((m = RX.kunci.exec(t))) { q.kunci = m[2].trim(); sect = 'done'; return; }
      if ((m = RX.skor.exec(t))) { q.skor = m[4].replace(',', '.'); return; }
      if ((m = RX.mode.exec(t))) { q.mode = m[2].toUpperCase() === 'SEMUA' ? 'SEMUA' : 'PROPORSIONAL'; return; }
      if ((m = RX.tipe.exec(t)) && normTipe(m[2])) { q.tipe = normTipe(m[2]); return; }
      if ((m = RX.kat.exec(t))) { q.kat = splitBar(m[1].replace(/,/g, '|')); if (!q.tipe) q.tipe = 'KATEGORI'; return; }
      if ((m = RX.rubrik.exec(t))) { q.rubrik = m[3]; sect = 'rubrik'; if (!q.tipe) q.tipe = 'ESAI'; return; }
      if (q.tipe === 'ESAI' || sect === 'rubrik' || sect === 'acuan') { if ((m = RX.acuan.exec(t))) { q.acuan = m[2]; sect = 'acuan'; return; } }
      if ((m = RX.opt.exec(t)) && b.kind !== 'ul') { const h = m[1].toUpperCase(); q.opsi[h] = b.html.replace(/^\s*(<[^>]+>)*\s*[A-Ea-e]\s*[.)]\s+/, '$1').trim(); if (b.imgs[0]) q.oimg[h] = b.imgs[0]; sect = 'opt'; lastOpt = h; return; }
      if (b.kind === 'ol' && (q.tipe === '' || q.tipe === 'PG' || q.tipe === 'MCMA') && sect !== 'done') { const h = HUR[Object.keys(q.opsi).length]; if (h) { q.opsi[h] = b.html; if (b.imgs[0]) q.oimg[h] = b.imgs[0]; sect = 'opt'; lastOpt = h; return; } }
      if ((b.kind === 'ul' || RX.bullet.test(t)) && sect !== 'done') { q.pern.push(b.html.replace(/^\s*[-•·▪*]\s+/, '')); if (!q.tipe) q.tipe = 'KATEGORI'; sect = 'pern'; return; }
      // lanjutan
      if (sect === 'rubrik') q.rubrik += '\n' + t;
      else if (sect === 'acuan') q.acuan += '\n' + t;
      else if (sect === 'opt' && lastOpt) { if (b.imgs[0] && !t) q.oimg[lastOpt] = b.imgs[0]; else q.opsi[lastOpt] += '<br>' + b.html; }
      else if (sect === 'stem') { if (b.html.trim()) q.teks += (q.teks ? '<br>' : '') + b.html; b.imgs.forEach((s) => (q.gambar ? q.imgs.push(s) : (q.gambar = s))); }
      else if (sect === 'done' && b.imgs.length && !t) q.imgs = q.imgs.concat(b.imgs);
    });
    return items.map(finalize);
  };
  /** Bentuk akhir butir impor (siap dikirim ke soal.impor, gambar masih data URL). */
  function finalize(q) {
    const nOpt = Object.keys(q.opsi).length;
    let tipe = q.tipe;
    const kunciHuruf = String(q.kunci || '').toUpperCase().match(/\b[A-E]\b/g) || [];
    if (!tipe) tipe = q.pern.length ? 'KATEGORI' : nOpt >= 2 ? (kunciHuruf.length > 1 ? 'MCMA' : 'PG') : 'ESAI';
    const it = { tipe, teks: q.teks + q.imgs.map((s) => '<br><img src="' + s + '">').join(''), gambar: q.gambar || '', skor_maks: +q.skor || (tipe === 'ESAI' ? 20 : 10), mode_skor: q.mode || 'PROPORSIONAL', _no: q.no };
    if (tipe === 'PG' || tipe === 'MCMA') { it.opsi = Object.assign({}, q.opsi, { img: q.oimg }); it.kunci = tipe === 'PG' ? (kunciHuruf[0] || String(q.kunci || '').trim().charAt(0).toUpperCase()) : kunciHuruf; }
    else if (tipe === 'KATEGORI') {
      const kat = q.kat.length ? q.kat : ['Benar', 'Salah'];
      const k = splitBar(String(q.kunci || '').replace(/,/g, '|')).map((x) => { const f = kat.find((c) => c.toLowerCase() === x.toLowerCase()) || kat.find((c) => c.charAt(0).toLowerCase() === x.charAt(0).toLowerCase() && x.length <= 2); return f || x; });
      it.opsi = { pernyataan: q.pern, kategori: kat }; it.kunci = k;
    } else { it.opsi = { rubrik: (q.rubrik || '').trim(), acuan: (q.acuan || q.kunci || '').trim() }; it.kunci = null; }
    return it;
  }
  /* ---------- Parser Excel / Google Sheets (array baris) ---------- */
  BK.parseRows = function (aoa, imgMap) {
    const norm = (h) => String(h || '').toLowerCase().replace(/[^a-z_]/g, '');
    const hi = aoa.findIndex((r) => r.some((c) => /^(soal|pertanyaan|teks)$/.test(norm(c))));
    if (hi < 0) throw new Error('Kolom "soal" tidak ditemukan. Gunakan template Excel NEXTEST.');
    const H = aoa[hi].map(norm), col = (names) => H.findIndex((h) => names.indexOf(h) > -1);
    const c = { tipe: col(['tipe', 'jenis', 'type']), soal: col(['soal', 'pertanyaan', 'teks']), kunci: col(['kunci', 'kuncijawaban', 'jawaban']), skor: col(['skor', 'bobot', 'poin', 'skor_maks']), mode: col(['mode_skor', 'modeskor', 'mode']), gambar: col(['gambar', 'image', 'img']) };
    const oc = HUR.map((h) => col(['opsi_' + h.toLowerCase(), 'opsi' + h.toLowerCase(), h.toLowerCase(), 'pilihan_' + h.toLowerCase(), 'pilihan' + h.toLowerCase()]));
    const out = [];
    for (let r = hi + 1; r < aoa.length; r++) {
      const row = aoa[r], g = (i) => (i > -1 && row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '');
      const soal = g(c.soal), tipeRaw = g(c.tipe), ops = oc.map(g), kunci = g(c.kunci);
      const rowImgs = (imgMap && imgMap[r]) || [];
      if (!soal && !tipeRaw && !ops.some(Boolean) && !kunci && !rowImgs.length) continue;
      if (!tipeRaw && !ops.some(Boolean) && !kunci && out.length && (soal || rowImgs.length)) { // baris lanjutan
        const last = out[out.length - 1]; if (soal) last.teks += '<br>' + esc(soal).replace(/\n/g, '<br>'); rowImgs.forEach((im) => { last.teks += '<br><img src="' + im.src + '">'; }); continue;
      }
      let tipe = normTipe(tipeRaw);
      const kh = kunci.toUpperCase().match(/\b[A-E]\b/g) || [];
      if (!tipe) tipe = ops.filter(Boolean).length >= 2 ? (kh.length > 1 ? 'MCMA' : 'PG') : 'ESAI';
      const it = { tipe, skor_maks: +(g(c.skor).replace(',', '.')) || (tipe === 'ESAI' ? 20 : 10), mode_skor: /semua/i.test(g(c.mode)) ? 'SEMUA' : 'PROPORSIONAL', gambar: '', _no: out.length + 1 };
      const gb = g(c.gambar), did = /\/d\/([\w-]{20,})|[?&]id=([\w-]{20,})|^([\w-]{25,})$/.exec(gb);
      if (did) it.gambar = did[1] || did[2] || did[3];
      if (tipe === 'KATEGORI') {
        const parts = soal.split('|').map((x) => x.trim());
        it.teks = esc(parts[0]).replace(/\n/g, '<br>');
        const kat = ops.filter(Boolean);
        it.opsi = { pernyataan: parts.slice(1).filter(Boolean).map(esc), kategori: kat.length >= 2 ? kat : ['Benar', 'Salah'] };
        it.kunci = splitBar(kunci).map((x) => it.opsi.kategori.find((k) => k.toLowerCase() === x.toLowerCase()) || it.opsi.kategori.find((k) => x.length <= 2 && k.charAt(0).toLowerCase() === x.charAt(0).toLowerCase()) || x);
      } else if (tipe === 'ESAI') {
        it.teks = esc(soal).replace(/\n/g, '<br>'); it.opsi = { rubrik: ops[0], acuan: kunci }; it.kunci = null;
      } else {
        it.teks = esc(soal).replace(/\n/g, '<br>');
        it.opsi = { img: {} }; HUR.forEach((h, i) => { it.opsi[h] = esc(ops[i]); });
        it.kunci = tipe === 'PG' ? (kh[0] || kunci.charAt(0).toUpperCase()) : kh;
      }
      if (/^https:\/\//.test(gb) && !did) it.teks += '<br><img src="' + esc(gb) + '">';
      rowImgs.forEach((im) => { const oi = oc.indexOf(im.col); if (oi > -1 && it.opsi && it.opsi.img) it.opsi.img[HUR[oi]] = im.src; else if (!it.gambar) it.gambar = im.src; else it.teks += '<br><img src="' + im.src + '">'; });
      out.push(it);
    }
    return out;
  };
  /** Gambar yang ditempel di Excel (xl/drawings) → { baris: [{col, src}] } (0-based, seperti array baris). */
  BK.excelImages = async function (file) {
    try {
      const JSZip = await NX.loadScript(NX.LIB.jszip, 'JSZip');
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const txt = async (p) => { const f = zip.file(p); return f ? f.async('string') : ''; };
      const resolve = (base, t) => { if (t.charAt(0) === '/') return t.slice(1); const parts = base.split('/'); parts.pop(); t.split('/').forEach((seg) => { if (seg === '..') parts.pop(); else if (seg && seg !== '.') parts.push(seg); }); return parts.join('/'); };
      const relsOf = async (p) => { const i = p.lastIndexOf('/'); const x = await txt(p.slice(0, i) + '/_rels/' + p.slice(i + 1) + '.rels'); const m = {}; (x.match(/<Relationship\b[^>]*>/g) || []).forEach((r) => { const id = /\bId="([^"]+)"/.exec(r), t = /\bTarget="([^"]+)"/.exec(r); if (id && t) m[id[1]] = resolve(p, t[1]); }); return m; };
      // lembar pertama menurut workbook.xml
      const wb = await txt('xl/workbook.xml'), wrel = await relsOf('xl/workbook.xml');
      const sid = /<(?:\w+:)?sheet\b[^>]*\br:id="([^"]+)"/.exec(wb);
      const sheet = (sid && wrel[sid[1]]) || 'xl/worksheets/sheet1.xml';
      const srel = await relsOf(sheet);
      const drawing = Object.keys(srel).map((k) => srel[k]).find((t) => /drawings\/[^/]+\.xml$/.test(t));
      if (!drawing) return {};
      const dx = await txt(drawing), drel = await relsOf(drawing);
      const out = {};
      const anchors = dx.split(/<(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)\b/).slice(1);
      for (const a of anchors) {
        const r = /<(?:\w+:)?from>[\s\S]*?<(?:\w+:)?col>(\d+)<\/(?:\w+:)?col>[\s\S]*?<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/.exec(a), e = /r:embed="([^"]+)"/.exec(a);
        if (!r || !e || !drel[e[1]]) continue;
        const f = zip.file(drel[e[1]]); if (!f) continue;
        const ext = drel[e[1]].split('.').pop().toLowerCase(), mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        const src = 'data:' + mime + ';base64,' + await f.async('base64');
        (out[+r[2]] || (out[+r[2]] = [])).push({ col: +r[1], src });
      }
      return out;
    } catch (e) { return {}; }
  };
  /** Unggah semua gambar data URL di butir → ID/URL Drive. */
  async function unggahGambar(items, onProg) {
    const cache = {}; let n = 0;
    const all = []; items.forEach((it) => { const add = (s) => { if (/^data:image/.test(s || '') && !cache[s] && all.indexOf(s) < 0) all.push(s); }; add(it.gambar); ((it.teks || '').match(/src="(data:image[^"]+)"/g) || []).forEach((m) => add(m.slice(5, -1))); if (it.opsi && it.opsi.img) Object.keys(it.opsi.img).forEach((h) => add(it.opsi.img[h])); HUR.forEach((h) => { ((it.opsi && it.opsi[h] || '').match(/src="(data:image[^"]+)"/g) || []).forEach((m) => add(m.slice(5, -1))); }); });
    for (const src of all) { onProg && onProg('Mengunggah gambar ' + (++n) + ' dari ' + all.length + '…'); cache[src] = await BK.uploadImg(src); }
    const rep = (h) => String(h || '').replace(/src="(data:image[^"]+)"/g, (m, s) => 'src="' + (cache[s] ? cache[s].url : '') + '"');
    return items.map((it) => {
      const c = JSON.parse(JSON.stringify(it));
      if (cache[c.gambar]) c.gambar = cache[c.gambar].id;
      c.teks = rep(c.teks);
      if (c.opsi) { HUR.forEach((h) => { if (c.opsi[h]) c.opsi[h] = rep(c.opsi[h]); }); if (c.opsi.img) Object.keys(c.opsi.img).forEach((h) => { if (cache[c.opsi.img[h]]) c.opsi.img[h] = cache[c.opsi.img[h]].id; }); }
      delete c._no; delete c._err;
      return c;
    });
  }
  const tanpaGambar = (items) => items.map((it) => { const c = JSON.parse(JSON.stringify(it)); const ph = 'https://drive.google.com/thumbnail?id=pratinjau'; if (/^data:/.test(c.gambar)) c.gambar = 'pratinjau'; c.teks = String(c.teks).replace(/src="data:image[^"]+"/g, 'src="' + ph + '"'); if (c.opsi) { HUR.forEach((h) => { if (c.opsi[h]) c.opsi[h] = String(c.opsi[h]).replace(/src="data:image[^"]+"/g, 'src="' + ph + '"'); }); if (c.opsi.img) Object.keys(c.opsi.img).forEach((h) => { if (/^data:/.test(c.opsi.img[h])) c.opsi.img[h] = 'pratinjau'; }); } delete c._no; return c; });

  NX.route('a/impor', {
    role: 'ADMIN', title: 'Impor Soal', nav: 'a/bank',
    async render(p) {
      const berkas = await NX.api('berkas.list', {});
      BK._imp = { berkas, items: [], step: 1, sumber: '' };
      return '<div id="imp"><div class="page-hd"><div><div class="crumb"><a href="#/a/bank">Bank Soal</a> ' + ic('chevR', 'sm') + ' Impor</div><h1>Impor Soal</h1><p>Dari Word (.docx), Excel (.xlsx), atau tautan Google Sheets — termasuk gambar yang ditempel.</p></div></div>' +
        '<div class="stepper"><div class="st on" data-st="1"><span class="n">1</span><div><b class="small">Unduh Template</b><div class="xs muted">Format & berkas tujuan</div></div></div><div class="st" data-st="2"><span class="n">2</span><div><b class="small">Unggah Berkas</b><div class="xs muted">Word / Excel / Sheets</div></div></div><div class="st" data-st="3"><span class="n">3</span><div><b class="small">Pratinjau & Simpan</b><div class="xs muted">Periksa sebelum disimpan</div></div></div></div>' +
        '<div class="mt20" id="impBody"></div></div>';
    },
    mount(p, page) {
      const root = page.querySelector('#imp'), st = BK._imp, body = root.querySelector('#impBody');
      st.target = p.q.berkas || '';
      const steps = (n) => { st.step = n; root.querySelectorAll('[data-st]').forEach((e) => { const k = +e.dataset.st; e.classList.toggle('on', k === n); e.classList.toggle('done', k < n); }); };
      const step1 = () => {
        steps(1);
        body.innerHTML = '<div class="grid gc2" style="align-items:start">' +
          '<section class="card card-p"><h3>Template</h3><p class="small muted mt4">Isi template lalu unggah di langkah 2. Format bisa juga diketik bebas di Word mengikuti contoh.</p><div class="col g12 mt16">' +
            '<a class="row-item" href="templates/template-soal-cbt.docx" download style="color:inherit"><span class="tile">' + ic('fileText') + '</span><div class="f1"><b>Template Word (.docx)</b><div class="xs muted">Nomor soal, pilihan A–E, baris <span class="mono">KUNCI: B</span>. Gambar cukup ditempel di bawah soal/pilihan.</div></div>' + ic('download', 'ink-p') + '</a>' +
            '<a class="row-item" href="templates/template-soal-cbt.xlsx" download style="color:inherit"><span class="tile ok">' + ic('table') + '</span><div class="f1"><b>Template Excel (.xlsx)</b><div class="xs muted">Kolom <span class="mono">tipe, soal, opsi_A…opsi_E, kunci, skor, mode_skor, gambar</span>. Juga untuk Google Sheets.</div></div>' + ic('download', 'ink-p') + '</a></div>' +
            '<div class="banner neu mt16" style="display:block"><b class="small">Ringkasan format Word</b><pre class="xs mt8 mono" style="white-space:pre-wrap;margin:0">1. Teks soal pilihan ganda…\nA. pilihan\nB. pilihan\nC. pilihan\nKUNCI: B\n\n2. [MCMA] Pilih semua yang benar…\nA. … B. … C. …\nKUNCI: A, C\n\n3. [KATEGORI] Tentukan benar/salah…\n- Pernyataan 1\n- Pernyataan 2\nKATEGORI: Benar | Salah\nKUNCI: Benar | Salah\n\n4. [ESAI] Jelaskan…\nRUBRIK: kriteria penilaian\nACUAN: jawaban acuan\nSKOR: 20</pre></div></section>' +
          '<section class="card card-p"><h3>Berkas Tujuan</h3><div class="seg mt16" id="tgMode"><button type="button" data-v="ada" class="' + (st.berkas.length ? 'on' : '') + '">Berkas yang ada</button><button type="button" data-v="baru" class="' + (st.berkas.length ? '' : 'on') + '">Berkas baru</button></div>' +
            '<div id="tgAda" class="field mt16" ' + (st.berkas.length ? '' : 'hidden') + '><label class="label">Pilih berkas</label><select class="select" id="tgSel">' + st.berkas.map((b) => '<option value="' + esc(b.id_berkas) + '" ' + (b.id_berkas === st.target ? 'selected' : '') + '>' + esc(b.nama) + ' · ' + esc(b.mapel) + ' (' + b.jumlah + ' soal)</option>').join('') + '</select></div>' +
            '<div id="tgBaru" class="form-grid mt16" ' + (st.berkas.length ? 'hidden' : '') + '><div class="field full"><label class="label">Nama berkas</label><input class="input" name="bnama" placeholder="mis. PAS Ganjil Biologi XI"></div><div class="field"><label class="label">Mapel</label><select class="select" name="bmapel">' + AD.optMapel('', '— pilih —') + '</select></div><div class="field"><label class="label">Jenis</label><select class="select" name="bjenis">' + AD.optJenis('PAS') + '</select></div><div class="field full"><label class="label">Kelas</label>' + AD.chipsKelas('bk', []) + '</div></div>' +
            '<button class="btn btn-p btn-block mt20" id="go2">Lanjut ke Unggah ' + ic('arrowR', 'sm') + '</button></section></div>';
        AD.bindChips(body);
        body.querySelector('#tgMode').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; body.querySelectorAll('#tgMode button').forEach((z) => z.classList.toggle('on', z === b)); body.querySelector('#tgAda').hidden = b.dataset.v !== 'ada'; body.querySelector('#tgBaru').hidden = b.dataset.v !== 'baru'; };
        body.querySelector('#go2').onclick = () => {
          const mode = body.querySelector('#tgMode .on').dataset.v;
          if (mode === 'ada') { st.target = body.querySelector('#tgSel').value; st.baru = null; if (!st.target) { NX.toast('Pilih berkas tujuan.', 'warn'); return; } }
          else { st.target = ''; st.baru = { nama: AD.v(body, 'bnama'), id_mapel: AD.v(body, 'bmapel'), jenis: AD.v(body, 'bjenis'), kelas: AD.chipVals(body, 'bk') }; if (!st.baru.nama || !st.baru.id_mapel) { NX.toast('Isi nama berkas dan mapel.', 'warn'); return; } }
          step2();
        };
      };
      const step2 = () => {
        steps(2);
        body.innerHTML = '<section class="card"><div class="tabs" style="padding:0 16px" id="srcTab"><button class="tab on" data-v="word">' + ic('fileText', 'sm') + 'Word (.docx)</button><button class="tab" data-v="excel">' + ic('table', 'sm') + 'Excel (.xlsx / .csv)</button><button class="tab" data-v="gs">' + ic('globe', 'sm') + 'Google Sheets</button></div><div class="card-bd" id="srcBody"></div></section><div class="flex jb mt16"><button class="btn btn-s" id="back1">' + ic('arrowL', 'sm') + 'Kembali</button></div>';
        const draw = (v) => {
          const sb = body.querySelector('#srcBody');
          if (v === 'gs') {
            sb.innerHTML = '<div class="field"><label class="label">Tautan Google Sheets</label><div class="flex g8"><input class="input f1" id="gsUrl" placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=0"><button class="btn btn-p" id="gsGo">' + ic('download', 'sm') + 'Ambil</button></div><span class="help">Format kolom sama dengan template Excel. Bagikan sheet sebagai "Siapa pun yang memiliki link dapat melihat", atau gunakan sheet di akun Google yang sama dengan server.</span></div><div id="srcMsg" class="mt16"></div>';
            sb.querySelector('#gsGo').onclick = async (e) => {
              const url = sb.querySelector('#gsUrl').value.trim(); if (!url) return;
              NX.btnBusy(e.currentTarget, true);
              try { const r = await NX.api('soal.gsheet', { url }, { timeout: 60000 }); st.items = BK.parseRows(r.rows); st.sumber = r.nama; step3(); } catch (er) { sb.querySelector('#srcMsg').innerHTML = '<div class="banner err">' + ic('alert', 'sm') + '<div>' + esc(er.message) + '</div></div>'; NX.btnBusy(e.currentTarget, false); }
            };
            return;
          }
          sb.innerHTML = '<label class="dropzone" style="display:block" id="dz"><input type="file" hidden id="fi" accept="' + (v === 'word' ? '.docx' : '.xlsx,.xls,.csv') + '"><div class="tile lg" style="margin:0 auto">' + ic(v === 'word' ? 'fileText' : 'table', 'lg') + '</div><div class="b7 mt12">Seret berkas ' + (v === 'word' ? 'Word (.docx)' : 'Excel/CSV') + ' ke sini atau klik untuk memilih</div><div class="small muted mt4">' + (v === 'word' ? 'Gambar yang ditempel di dokumen ikut terimpor.' : 'Gambar yang ditempel di sel (xlsx) ikut terimpor.') + '</div></label><div id="srcMsg" class="mt16"></div>';
          const dz = sb.querySelector('#dz'), fi = sb.querySelector('#fi');
          const go = async (f) => {
            if (!f) return;
            const msg = sb.querySelector('#srcMsg'); msg.innerHTML = '<div class="banner neu">' + '<span class="spin"></span><div>Membaca ' + esc(f.name) + '…</div></div>';
            try {
              if (v === 'word') {
                if (!/\.docx$/i.test(f.name)) throw new Error('Gunakan berkas .docx (Word 2007 ke atas).');
                const mammoth = await NX.loadScript(NX.LIB.mammoth, 'mammoth');
                const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
                st.items = BK.parseWordHtml(r.value);
              } else {
                const aoa = await NX.readSheet(f);
                const imgs = /\.xlsx$/i.test(f.name) ? await BK.excelImages(f) : {};
                st.items = BK.parseRows(aoa, imgs);
              }
              if (!st.items.length) throw new Error('Tidak ada soal yang terbaca. Periksa format (lihat template).');
              st.sumber = f.name; step3();
            } catch (er) { msg.innerHTML = '<div class="banner err">' + ic('alert', 'sm') + '<div>' + esc(er.message) + '</div></div>'; }
          };
          fi.onchange = () => go(fi.files[0]);
          dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
          dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
          dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); go(e.dataTransfer.files[0]); });
        };
        body.querySelector('#srcTab').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; body.querySelectorAll('#srcTab .tab').forEach((z) => z.classList.toggle('on', z === b)); draw(b.dataset.v); };
        body.querySelector('#back1').onclick = step1;
        draw('word');
      };
      const step3 = async () => {
        steps(3);
        body.innerHTML = '<section class="card card-p">' + NX.skel(200) + '</section>';
        let rep;
        try { rep = await NX.api('soal.impor', { items: tanpaGambar(st.items), dryRun: true }, { timeout: 60000 }); } catch (e) { body.innerHTML = NX.errorBox(e); return; }
        rep.laporan.forEach((l) => { const it = st.items[l.no - 1]; if (it) it._err = l.ok ? '' : l.pesan; });
        const draw = () => {
          const ok = st.items.filter((x) => !x._err).length, bad = st.items.length - ok;
          const per = {}; st.items.forEach((x) => { per[x.tipe] = (per[x.tipe] || 0) + 1; });
          body.innerHTML = '<div class="split" style="grid-template-columns:minmax(0,1fr) 320px"><section class="card"><div class="card-hd"><h3>Pratinjau ' + st.items.length + ' soal</h3><span class="xs muted">' + esc(st.sumber) + '</span></div>' +
            st.items.map((it, i) => '<div class="soal-card" style="border-bottom:1px solid var(--div);' + (it._err ? 'background:var(--err-50)' : '') + '"><span class="no">' + (i + 1) + '</span><div class="f1" style="min-width:0"><div class="flex g6 wrap mb8">' + BK.tipePill(it.tipe) + '<span class="chip static">Skor ' + F.num(it.skor_maks) + '</span>' + (it._err ? NX.pill(it._err, 'err', 'nodot') : NX.pill('Siap', 'ok')) + '</div>' + BK.render(it) + '</div><button class="icon-btn sm" data-rm="' + i + '" aria-label="Buang">' + ic('trash', 'sm') + '</button></div>').join('') + '</section>' +
            '<aside class="col g16"><section class="card card-p"><h3>Ringkasan</h3><div class="grid gc2 mt12" style="gap:10px"><div class="card card-ps tc"><div class="num b8 ink-ok" style="font-size:26px">' + ok + '</div><div class="xs muted">Siap disimpan</div></div><div class="card card-ps tc"><div class="num b8 ' + (bad ? 'ink-err' : '') + '" style="font-size:26px">' + bad + '</div><div class="xs muted">Bermasalah</div></div></div><div class="mt12">' + Object.keys(per).map((k) => '<div class="row-item"><span class="small f1">' + TL[k] + '</span><b>' + per[k] + '</b></div>').join('') + '</div>' +
            (bad ? '<div class="banner warn mt12">' + ic('alert', 'sm') + '<div class="small">Soal bermasalah tidak ikut disimpan. Perbaiki di berkas sumber lalu impor ulang, atau buang dari daftar.</div></div>' : '') +
            '<div class="small muted mt12">Tujuan: <b>' + esc(st.target ? (st.berkas.find((b) => b.id_berkas === st.target) || {}).nama : st.baru.nama + ' (baru)') + '</b></div>' +
            '<button class="btn btn-p btn-block mt16" id="impGo" ' + (ok ? '' : 'disabled') + '>' + ic('check', 'sm') + 'Simpan ' + ok + ' Soal</button><button class="btn btn-s btn-block mt8" id="back2">' + ic('arrowL', 'sm') + 'Ganti berkas</button><div id="impMsg" class="mt12"></div></section></aside></div>';
          body.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { st.items.splice(+b.dataset.rm, 1); draw(); });
          body.querySelector('#back2').onclick = step2;
          body.querySelector('#impGo').onclick = async (e) => {
            const btn = e.currentTarget, msg = body.querySelector('#impMsg');
            NX.btnBusy(btn, true, 'Menyimpan…');
            try {
              const siap = await unggahGambar(st.items.filter((x) => !x._err), (t) => { msg.innerHTML = '<div class="small muted">' + esc(t) + '</div>'; });
              msg.innerHTML = '<div class="small muted">Menyimpan ke bank soal…</div>';
              const r = await NX.api('soal.impor', { id_berkas: st.target, berkasBaru: st.baru, items: siap }, { timeout: 120000 });
              NX.drop('a_berkas'); NX.drop('a_soal_' + r.id_berkas);
              NX.toast(r.ditambah + ' soal diimpor ke "' + r.nama + '".', 'ok');
              NX.go('a/bank/' + r.id_berkas);
            } catch (er) { NX.fail(er); msg.innerHTML = ''; NX.btnBusy(btn, false); }
          };
        };
        draw();
      };
      step1();
    }
  });
})();
