'use strict';
/* NEXTEST — login.js : halaman masuk beranimasi (Siswa: NIS/NISN · Admin: username + sandi) */
(function () {
  const NX = window.NX, esc = NX.esc, ic = NX.ic, S = NX.S;
  let role = 'SISWA', typingTimer = null, tickTimer = null;

  NX.route('login', {
    layout: 'bare',
    render() {
      const c = S.cfg || {};
      const nm = c.nama_aplikasi || 'NEXTEST';
      return '<div class="login">' +
        '<section class="login-art" id="lgArt">' +
          '<div class="flex ic g12"><div class="brand" style="padding:0"><div class="logo" style="background:rgba(255,255,255,.18);box-shadow:none">' + NX.logoHtml(128) + '</div></div><div><div class="b8" style="font-size:18px;font-family:var(--f-h)" id="lgNm1">' + esc(nm) + '</div><div class="xs" style="opacity:.8" id="lgSch">' + esc(c.nama_sekolah || c.tagline || 'CBT Anti-Contek Sekolah') + '</div></div></div>' +
          '<div class="stage hide-sm">' +
            '<div class="shape" style="left:4%;top:8%" data-par="18">' + ic('checkCircle', 'lg') + '</div>' +
            '<div class="shape" style="left:46%;top:-2%;animation-delay:-2s" data-par="-12">' + ic('clock', 'lg') + '</div>' +
            '<div class="shape" style="right:6%;top:30%;animation-delay:-4s" data-par="24">' + ic('fileText', 'lg') + '</div>' +
            '<div class="shape" style="left:16%;bottom:2%;animation-delay:-1s" data-par="-20">' + ic('shieldCheck', 'lg') + '</div>' +
            '<div class="mini" style="left:10%;top:34%;min-width:200px" data-par="10"><div class="flex ic g12"><span class="tile sm">' + ic('timer') + '</span><div><div class="xs muted b6 up">Waktu tersisa</div><div class="num b8" style="font-size:22px" id="lgTimer">01:29:45</div></div></div><div class="meter mt8" style="height:5px"><i style="width:62%"></i></div></div>' +
            '<div class="mini" style="right:12%;bottom:6%;min-width:210px;animation-delay:-3s" data-par="-14"><div class="flex jb ic"><div><div class="xs muted b6 up">Nilai Anda</div><div class="num b8" style="font-size:24px">85%</div></div>' + NX.pill('Tuntas', 'ok') + '</div><svg viewBox="0 0 120 30" style="width:100%;height:32px;margin-top:6px"><path d="M2 26 L22 20 L42 22 L62 12 L82 15 L102 6 L118 4" fill="none" stroke="var(--p)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '</div>' +
          '<div><h1>Ujian Jujur,<br>Hasil Terukur.</h1><div class="typing mt12" id="lgType"></div>' +
          '<div class="flex g16 wrap mt24 small hide-sm" style="opacity:.92">' +
            '<span class="flex ic g6">' + ic('maximize', 'sm') + 'Layar penuh</span><span class="flex ic g6">' + ic('shieldAlert', 'sm') + 'Deteksi pindah tab</span><span class="flex ic g6">' + ic('phone', 'sm') + 'Satu akun satu perangkat</span></div></div>' +
        '</section>' +
        '<section class="login-form"><div class="login-card" id="lgCard">' +
          '<div class="flex ic g12"><div class="brand" style="padding:0"><div class="logo">' + NX.logoHtml(128) + '</div></div><div><div class="b8" style="font-family:var(--f-h);font-size:20px;color:var(--p-d)" id="lgNm2">' + esc(nm) + '</div><div class="xs muted" id="lgTag">' + esc(c.tagline || 'CBT Anti-Contek Sekolah') + '</div></div></div>' +
          '<h1 class="mt24" style="font-size:30px">Selamat Datang</h1><p class="tx2 mt4" id="lgSub">Masuk dengan NIS atau NISN untuk memulai ujian.</p>' +
          '<div class="seg role mt20" id="lgRole"><span class="ind"></span><button type="button" class="on" data-r="SISWA">' + ic('school', 'sm') + 'Siswa</button><button type="button" data-r="ADMIN">' + ic('shield', 'sm') + 'Admin</button></div>' +
          '<form id="lgForm" class="col g16 mt20" autocomplete="off" novalidate>' +
            '<div id="lgFields"></div>' +
            '<div id="lgErr" class="banner err" hidden></div>' +
            '<button class="btn btn-p btn-lg btn-block" id="lgBtn" type="submit">Masuk ' + ic('arrowR') + '</button>' +
          '</form>' +
          '<p class="small muted tc mt16" id="lgHelp">Lupa NIS/NISN? Hubungi admin atau wali kelas.</p>' +
          '<p class="xs muted tc mt24">© ' + new Date().getFullYear() + ' ' + esc(nm) + (c.nama_sekolah ? ' · ' + esc(c.nama_sekolah) : '') + '</p>' +
        '</div></section></div>';
    },
    mount() {
      role = NX.LS.get('nx_role', 'SISWA');
      setRole(role, true);
      document.getElementById('lgRole').addEventListener('click', (e) => { const b = e.target.closest('button[data-r]'); if (b) setRole(b.dataset.r); });
      document.getElementById('lgForm').addEventListener('submit', submit);
      // efek parallax mengikuti kursor
      const art = document.getElementById('lgArt');
      art.addEventListener('mousemove', (e) => {
        const r = art.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        art.querySelectorAll('[data-par]').forEach((el) => { const k = +el.dataset.par; el.style.translate = (dx * k) + 'px ' + (dy * k) + 'px'; });
      });
      typing(['Platform CBT Anti-Contek Sekolah', 'Token ujian, soal acak, pengawasan otomatis', 'Nilai & analisis butir soal instan', 'Jawaban aman meski internet putus']);
      let t = 89 * 60 + 45;
      clearInterval(tickTimer);
      tickTimer = setInterval(() => { const el = document.getElementById('lgTimer'); if (!el) { clearInterval(tickTimer); return; } t = t > 0 ? t - 1 : 5400; el.textContent = NX.fmt.hms(t * 1000); }, 1000);
      NX.warm('pub');
      NX.api('app.config', {}, { retry: 1 }).then((d) => {
        NX.applyTheme(d.cfg);
        const c = d.cfg;
        ['lgNm1', 'lgNm2'].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = c.nama_aplikasi || 'NEXTEST'; });
        const tg = document.getElementById('lgTag'); if (tg) tg.textContent = c.tagline || '';
        const sc = document.getElementById('lgSch'); if (sc) sc.textContent = c.nama_sekolah || c.tagline || '';
        document.querySelectorAll('.login .logo').forEach((l) => { l.innerHTML = NX.logoHtml(128); });
      }).catch(() => {});
    }
  });

  function typing(list) {
    clearTimeout(typingTimer);
    let i = 0, j = 0, del = false;
    const step = () => {
      const el = document.getElementById('lgType'); if (!el) return;
      const s = list[i];
      el.textContent = s.slice(0, j);
      if (!del && j < s.length) { j++; typingTimer = setTimeout(step, 55); }
      else if (!del) { del = true; typingTimer = setTimeout(step, 1800); }
      else if (j > 0) { j--; typingTimer = setTimeout(step, 25); }
      else { del = false; i = (i + 1) % list.length; typingTimer = setTimeout(step, 300); }
    };
    step();
  }

  function setRole(r, first) {
    role = r;
    NX.LS.set('nx_role', r);
    const seg = document.getElementById('lgRole');
    seg.classList.toggle('adm', r === 'ADMIN');
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.r === r));
    document.getElementById('lgSub').textContent = r === 'ADMIN' ? 'Masuk sebagai admin untuk mengelola ujian.' : 'Masuk dengan NIS atau NISN untuk memulai ujian.';
    document.getElementById('lgHelp').textContent = r === 'ADMIN' ? 'Lupa kata sandi? Minta admin lain melakukan reset.' : 'Lupa NIS/NISN? Hubungi admin atau wali kelas.';
    document.getElementById('lgErr').hidden = true;
    const f = document.getElementById('lgFields');
    f.innerHTML = r === 'ADMIN'
      ? '<div class="fl">' + ic('user') + '<input class="input" id="lgUser" placeholder=" " autocomplete="username" autocapitalize="off"><label for="lgUser">Username</label></div>' +
        '<div class="fl mt16" style="position:relative">' + ic('lock') + '<input class="input" id="lgPass" type="password" placeholder=" " autocomplete="current-password" style="padding-right:46px"><label for="lgPass">Kata sandi</label><button type="button" class="icon-btn sm" id="lgEye" style="position:absolute;right:8px;top:11px;border:0" aria-label="Lihat kata sandi">' + ic('eye', 'sm') + '</button></div><div class="xs ink-warn mt4" id="lgCaps" hidden>' + ic('alert', 'sm') + ' Caps Lock aktif</div>'
      : '<div class="fl">' + ic('hash') + '<input class="input" id="lgNis" placeholder=" " inputmode="numeric" autocomplete="off"><label for="lgNis">NIS / NISN</label></div>';
    const eye = document.getElementById('lgEye');
    if (eye) eye.onclick = () => { const p = document.getElementById('lgPass'); p.type = p.type === 'password' ? 'text' : 'password'; eye.innerHTML = ic(p.type === 'password' ? 'eye' : 'eyeOff', 'sm'); };
    const pass = document.getElementById('lgPass');
    if (pass) pass.addEventListener('keyup', (e) => { document.getElementById('lgCaps').hidden = !(e.getModifierState && e.getModifierState('CapsLock')); });
    if (!first || innerWidth > 1024) setTimeout(() => { const x = document.getElementById(r === 'ADMIN' ? 'lgUser' : 'lgNis'); if (x) x.focus(); }, 60);
  }

  async function submit(e) {
    e.preventDefault();
    const btn = document.getElementById('lgBtn'), err = document.getElementById('lgErr'), card = document.getElementById('lgCard');
    err.hidden = true;
    const data = { peran: role, ua: (navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || '') + ' · ' + browserName() };
    if (role === 'ADMIN') { data.username = document.getElementById('lgUser').value.trim(); data.password = document.getElementById('lgPass').value; if (!data.username || !data.password) return showErr('Isi username dan kata sandi.'); }
    else { data.nis = document.getElementById('lgNis').value.trim(); if (!data.nis) return showErr('Masukkan NIS atau NISN Anda.'); }
    NX.btnBusy(btn, true, 'Memeriksa…');
    try {
      const r = await NX.api('auth.login', data, { retry: 1 });
      NX.setSession(r.token, r.me);
      card.classList.add('leave');
      S.boot = null; S.me = null;
      await NX.boot(true);
      await NX.sleep(250);
      NX.go(NX.home());
    } catch (x) {
      NX.btnBusy(btn, false);
      showErr(x.message);
    }
    function showErr(m) {
      err.innerHTML = ic('alert', 'sm') + '<span>' + esc(m) + '</span>'; err.hidden = false;
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    }
  }
  function browserName() {
    const u = navigator.userAgent;
    const b = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Peramban';
    const os = /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Windows/.test(u) ? 'Windows' : /Mac OS/.test(u) ? 'macOS' : /CrOS/.test(u) ? 'ChromeOS' : /Linux/.test(u) ? 'Linux' : '';
    return b + (os ? ' · ' + os : '');
  }
  NX.browserName = browserName;
})();
