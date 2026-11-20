'use strict';
/* =====================================================================
   NEXTEST — ui.js
   Ikon SVG, kerangka (sidebar/topbar), toast, modal, drawer, menu, tabel,
   grafik SVG beranimasi, alat gambar (resize & potong), ekspor Excel.
   ===================================================================== */
(function () {
  const NX = window.NX, esc = NX.esc, S = NX.S;

  // ------------------------------------------------------------ ikon
  const SH = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>';
  const FILE = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>';
  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', trendDown: '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    pie: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.5a4 4 0 0 1 0 7"/><path d="M22 21a7 7 0 0 0-4-6.3"/>',
    userCheck: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="m16 11 2 2 4-4"/>',
    userX: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="m17 8 5 5M22 8l-5 5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2"/><path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.3"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8"/><path d="m17 6 3 3"/><path d="m15 8 2 2"/>',
    shield: SH, shieldCheck: SH + '<path d="m9 12 2 2 4-4"/>', shieldAlert: SH + '<path d="M12 8v4M12 16h.01"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', timer: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    file: FILE, fileText: FILE + '<path d="M16 13H8M16 17H8M10 9H8"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>', chevU: '<path d="m18 15-6-6-6 6"/>',
    arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>', arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    wifi: '<path d="M5 12.6a10 10 0 0 1 14 0"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 20 0"/><path d="M12 20h.01"/>',
    wifiOff: '<path d="m2 2 20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7"/><path d="M10.7 5.1A15 15 0 0 1 22 8.8"/><path d="M5 12.6a10 10 0 0 1 5.2-2.6"/><path d="M12 20h.01"/>',
    cloudCheck: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9z"/><path d="m9 14 2 2 4-4"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2A5.6 5.6 0 0 0 22 11c0-5-4.5-9-10-9z"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    listCheck: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    beaker: '<path d="M9 3h6M10 3v6L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7 15h10"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h4"/>'
  };
  NX.ic = (name, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[name] || I.info) + '</svg>';
  NX.icons = I;
  const ic = NX.ic;

  // ------------------------------------------------------------ elemen kecil
  NX.pill = (t, c, opt) => '<span class="pill ' + (c ? 'pill-' + c : '') + ' ' + (opt || '') + '">' + esc(t) + '</span>';
  NX.avatar = (nama, foto, cls) => '<span class="avatar ' + (cls || '') + '">' + (foto ? '<img src="' + esc(foto) + '" alt="">' : esc(String(nama || '?').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase())) + '</span>';
  NX.stat = (o) => '<div class="card stat">' +
    '<div class="flex jb ic"><span class="lbl">' + esc(o.label) + '</span>' + (o.icon ? '<span class="tile sm ' + (o.color || '') + '">' + ic(o.icon) + '</span>' : '') + '</div>' +
    '<div class="val"><span data-count="' + (o.value === null || o.value === undefined || isNaN(o.value) ? '' : o.value) + '" data-dec="' + (o.dec || 0) + '">' + (o.value === null || o.value === undefined || isNaN(o.value) ? esc(o.text || '-') : NX.fmt.num(o.value, o.dec || 0)) + '</span>' + (o.unit ? '<small>' + esc(o.unit) + '</small>' : '') + '</div>' +
    (o.trend !== undefined && o.trend !== null ? '<span class="trend ' + (o.trendCls || '') + '">' + ic(o.trendCls === 'down' ? 'trendDown' : o.trendCls === 'neu' ? 'minus' : 'trend', 'sm') + esc(o.trend) + '</span>' : (o.sub ? '<span class="small muted">' + o.sub + '</span>' : '')) + '</div>';
  NX.empty = (icon, title, text, action) => '<div class="empty"><div class="tile lg neu">' + ic(icon || 'info', 'lg') + '</div><h3>' + esc(title) + '</h3><p>' + (text || '') + '</p>' + (action || '') + '</div>';
  NX.skel = (h, w) => '<div class="skel" style="height:' + (h || 20) + 'px;' + (w ? 'width:' + w : '') + '"></div>';
  NX.skelPage = () => '<div class="col g20">' + NX.skel(36, '40%') + '<div class="grid gc4">' + [1, 2, 3, 4].map(() => NX.skel(120)).join('') + '</div><div class="grid gc2">' + NX.skel(280) + NX.skel(280) + '</div></div>';
  NX.btnBusy = (btn, busy, label) => {
    if (!btn) return;
    if (busy) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (label ? esc(label) : ''); }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
  };
  NX.copy = (txt) => { const done = () => NX.toast('Disalin: ' + txt, 'ok'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done); else { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* abaikan */ } t.remove(); done(); } };

  // ------------------------------------------------------------ toast
  NX.toast = function (msg, type, ms) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    const icn = type === 'ok' ? 'checkCircle' : type === 'err' ? 'xCircle' : type === 'warn' ? 'alert' : 'info';
    t.innerHTML = '<span class="' + (type === 'ok' ? 'ink-ok' : type === 'err' ? 'ink-err' : type === 'warn' ? 'ink-warn' : 'ink-p') + '">' + ic(icn) + '</span><div class="f1">' + esc(msg) + '</div>';
    t.onclick = () => close();
    box.appendChild(t);
    const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    setTimeout(close, ms || (type === 'err' ? 6000 : 3500));
  };
  NX.fail = (e) => NX.toast((e && e.message) || String(e), 'err');

  // ------------------------------------------------------------ modal, drawer, confirm, menu
  const stack = [];
  NX.modal = function (o) {
    const ov = document.createElement('div');
    ov.className = 'ov' + (o.drawer ? ' drawer-ov' : '');
    ov.innerHTML = (o.drawer ? '<div class="drawer ' + (o.size || '') + '">' : '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">') +
      (o.title !== false ? '<div class="modal-hd">' + (o.icon ? '<span class="tile sm ' + (o.iconCls || '') + '">' + ic(o.icon) + '</span>' : '') + '<h3>' + (o.titleHtml || esc(o.title || '')) + '</h3>' + (o.dismiss === false ? '' : '<button class="icon-btn sm" data-x aria-label="Tutup">' + ic('x', 'sm') + '</button>') + '</div>' : '') +
      '<div class="modal-bd" style="' + (o.drawer ? 'flex:1' : '') + '">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-ft">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(ov);
    const api = { el: ov, $: (s) => ov.querySelector(s), $$: (s) => Array.from(ov.querySelectorAll(s)), close: (v) => { if (api.closed) return; api.closed = true; ov.remove(); stack.splice(stack.indexOf(api), 1); if (o.onClose) o.onClose(v); } };
    stack.push(api);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov && o.dismiss !== false) api.close(); });
    ov.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => api.close()));
    if (o.onMount) o.onMount(api);
    NX.afterRender(ov);
    const f = ov.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 50);
    return api;
  };
  NX.drawer = (o) => NX.modal(Object.assign({}, o, { drawer: true }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stack.length && !(window.EX && EX.active)) { const t = stack[stack.length - 1]; if (t && t.el.querySelector('[data-x]')) t.close(); } });
  NX.confirm = function (msg, o) {
    o = o || {};
    return new Promise((res) => {
      const m = NX.modal({ title: o.title || 'Konfirmasi', icon: o.icon || (o.danger ? 'alert' : 'help'), iconCls: o.danger ? 'err' : '', size: 'narrow', body: '<div class="tx2">' + msg + '</div>' + (o.extra || ''),
        foot: '<button class="btn btn-s" data-no>' + esc(o.no || 'Batal') + '</button><button class="btn ' + (o.danger ? 'btn-d' : 'btn-p') + '" data-yes>' + esc(o.yes || 'Ya, lanjutkan') + '</button>',
        onClose: (v) => res(v === true ? (o.collect ? o.collect(m) : true) : false) });
      m.$('[data-no]').onclick = () => m.close(false);
      m.$('[data-yes]').onclick = () => { const v = o.collect ? o.collect(m) : true; m.close(true); res(v); };
    });
  };
  NX.closeMenus = () => document.querySelectorAll('.menu').forEach((m) => m.remove());
  NX.menu = function (anchor, items) {
    NX.closeMenus();
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = items.map((it, i) => it.sep ? '<div class="sep"></div>' : '<button data-i="' + i + '" class="' + (it.danger ? 'danger' : '') + '">' + ic(it.icon || 'chevR', 'sm') + esc(it.label) + '</button>').join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
    m.style.top = (r.bottom + h + 8 > innerHeight ? r.top - h - 6 : r.bottom + 6) + 'px';
    m.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; NX.closeMenus(); items[+b.dataset.i].run(); });
    setTimeout(() => document.addEventListener('click', NX.closeMenus, { once: true }), 0);
  };

  // ------------------------------------------------------------ sesudah render: angka berjalan, donat, tooltip
  NX.afterRender = function (root) {
    root = root || document;
    root.querySelectorAll('[data-count]').forEach((el) => {
      const v = parseFloat(el.dataset.count); if (isNaN(v)) return;
      const dec = +el.dataset.dec || 0, t0 = performance.now(), dur = 1100;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = NX.fmt.num(v, dec); return; }
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = NX.fmt.num(v * (1 - Math.pow(1 - k, 3)), dec); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    root.querySelectorAll('[data-off]').forEach((el) => { requestAnimationFrame(() => requestAnimationFrame(() => { el.style.strokeDashoffset = el.dataset.off; })); });
    root.querySelectorAll('.meter > i[data-w]').forEach((el) => requestAnimationFrame(() => { el.style.width = el.dataset.w; }));
  };
  let tip;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { if (tip) tip.remove(); tip = null; return; }
    if (!tip) { tip = document.createElement('div'); tip.className = 'ctip'; document.body.appendChild(tip); }
    tip.innerHTML = t.dataset.tip;
  });
  document.addEventListener('mousemove', (e) => { if (tip) { tip.style.left = Math.min(innerWidth - 250, e.clientX + 14) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; } });
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn-p,.btn-ok,.btn-pu,.btn-or,.btn-d');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height);
    s.className = 'ripple'; s.style.width = s.style.height = d + 'px'; s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });

  // ------------------------------------------------------------ kerangka aplikasi
  const NAV = {
    SISWA: [{ items: [
      { r: 's/home', ic: 'grid', l: 'Dashboard' }, { r: 's/ujian', ic: 'clipboard', l: 'Ujian Saya', badge: () => ((S.boot && S.boot.ujian) || []).filter((u) => u.status_jadwal === 'BERLANGSUNG' && (!u.sesi || u.sesi.status !== 'SELESAI')).length },
      { r: 's/hasil', ic: 'chart', l: 'Hasil & Nilai' }, { r: 's/profil', ic: 'user', l: 'Profil Saya' }] }],
    ADMIN: [
      { g: 'Utama', items: [{ r: 'a/dash', ic: 'grid', l: 'Dashboard' }, { r: 'a/monitor', ic: 'radio', l: 'Monitoring Langsung', live: true }] },
      { g: 'Ujian', items: [{ r: 'a/ujian', ic: 'calendar', l: 'Jadwal Ujian' }, { r: 'a/bank', ic: 'layers', l: 'Bank Soal' }] },
      { g: 'Data', items: [{ r: 'a/siswa', ic: 'users', l: 'Data Siswa' }, { r: 'a/kelas', ic: 'school', l: 'Kelas & Mapel' }] },
      { g: 'Laporan', items: [{ r: 'a/hasil', ic: 'chart', l: 'Hasil Ujian' }, { r: 'a/analisis', ic: 'trend', l: 'Analisis Butir' }, { r: 'a/pelanggaran', ic: 'shieldAlert', l: 'Pelanggaran' }] },
      { g: 'Lainnya', items: [{ r: 'a/pengumuman', ic: 'megaphone', l: 'Pengumuman' }, { r: 'a/pengaturan', ic: 'settings', l: 'Pengaturan' }] }
    ]
  };
  NX.chrome = function () {
    const role = S.me.role, c = S.cfg || {};
    const nav = NAV[role].map((g) => (g.g ? '<div class="grp">' + esc(g.g) + '</div>' : '') + g.items.map((it) => '<a href="#/' + it.r + '" data-nav="' + it.r + '">' + ic(it.ic) + '<span>' + esc(it.l) + '</span>' + (it.live ? '<span class="live-tag">LIVE</span>' : '') + (it.badge ? '<span class="badge" data-badge="' + it.r + '" hidden></span>' : '') + '</a>').join('')).join('');
    const foot = role === 'SISWA'
      ? '<div class="side-card"><div class="flex ic g8 b7">' + ic('shield', 'sm') + 'Integritas Ujian</div><p class="xs mt8" style="color:var(--tx2)">“Kejujuran adalah fondasi prestasi sejati. Kerjakan dengan mandiri dan teliti.”</p><div class="xs mt8 flex ic g6 ink-ok b6"><span class="pill pill-ok nodot" style="padding:0 6px">●</span>Sistem pengawas aktif</div></div>'
      : '<div class="side-card flex ic g8"><span class="pill pill-ok live">Sistem aktif</span><span class="xs muted ml-a">v' + NX.VERSION + '</span></div>';
    const botnav = role === 'SISWA' ? '<nav class="botnav">' + NAV.SISWA[0].items.map((it) => '<a href="#/' + it.r + '" data-nav="' + it.r + '">' + ic(it.ic) + '<span>' + esc(it.l.split(' ')[0]) + '</span></a>').join('') + '</nav>' : '';
    return '<div class="layout"><aside class="sidebar"><div class="brand"><div class="logo">' + NX.logoHtml(128) + '</div><div class="f1"><div class="nm clamp1">' + esc(c.nama_aplikasi || 'NEXTEST') + '</div><div class="tg clamp1">' + esc(c.tagline || 'CBT Anti-Contek Sekolah') + '</div></div></div>' +
      '<nav class="nav">' + nav + '</nav><div class="side-foot">' + foot + '<a href="javascript:void(0)" onclick="NX.askLogout()" class="flex ic g12 mt12" style="padding:10px 12px;color:var(--tx2);font-weight:500">' + ic('logout') + 'Keluar</a></div></aside>' +
      '<div class="scrim" onclick="document.body.classList.remove(\'nav-open\',\'qnav-open\')"></div>' +
      '<div class="main"><header class="topbar"><button class="icon-btn burger" onclick="document.body.classList.add(\'nav-open\')" aria-label="Menu">' + ic('menu') + '</button>' +
      '<div class="ttl f1"><div class="crumb" id="tbCrumb"></div><h2 id="tbTitle"></h2></div>' +
      (role === 'ADMIN' ? '<div class="search input-ic">' + ic('search') + '<input class="input" id="tbSearch" placeholder="Cari di halaman ini…" autocomplete="off"></div>' : '') +
      '<button class="icon-btn" id="tbBell" aria-label="Notifikasi">' + ic('bell') + '<span class="dot-badge" id="tbBellN" hidden></span></button>' +
      '<button class="user-chip" id="tbUser">' + NX.avatar(S.me.nama, S.fotoSaya || '', 'sm') + '<span><div class="nm clamp1" style="max-width:180px">' + esc(S.me.nama) + '</div><div class="rl">' + (role === 'ADMIN' ? 'Admin' : 'Siswa · ' + esc(S.me.kelas || '')) + '</div></span>' + ic('chevD', 'sm') + '</button></header>' +
      '<div id="page" class="page"></div></div></div>' + botnav;
  };
  NX.updateChrome = function (def, params) {
    const navKey = typeof def.nav === 'function' ? def.nav(params) : def.nav;
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === navKey));
    const t = typeof def.title === 'function' ? def.title(params) : def.title;
    const tt = document.getElementById('tbTitle'); if (tt) tt.textContent = t || '';
    const cr = document.getElementById('tbCrumb'); if (cr) cr.textContent = def.crumb || (S.me.role === 'ADMIN' ? 'Panel Admin' : 'Portal Siswa');
    if (!(window.EX && EX.active)) document.title = (t ? t + ' · ' : '') + NX.appName();
    NAV[S.me.role].forEach((g) => g.items.forEach((it) => { if (!it.badge) return; const b = document.querySelector('[data-badge="' + it.r + '"]'); if (!b) return; const n = it.badge(); b.hidden = !n; b.textContent = n; }));
    const s = document.getElementById('tbSearch');
    if (s) { s.value = ''; s.oninput = NX.debounce(() => { if (NX.onSearch) NX.onSearch(s.value); }, 200); s.parentElement.style.visibility = def.searchable ? 'visible' : 'hidden'; }
    NX.onSearch = null;
    const bell = document.getElementById('tbBell'); if (bell) bell.onclick = NX.bell;
    const u = document.getElementById('tbUser');
    if (u) u.onclick = () => NX.menu(u, S.me.role === 'ADMIN'
      ? [{ icon: 'user', label: 'Akun saya', run: () => NX.go('a/pengaturan?tab=akun') }, { icon: 'settings', label: 'Pengaturan', run: () => NX.go('a/pengaturan') }, { sep: 1 }, { icon: 'logout', label: 'Keluar', danger: true, run: NX.askLogout }]
      : [{ icon: 'user', label: 'Profil saya', run: () => NX.go('s/profil') }, { sep: 1 }, { icon: 'logout', label: 'Keluar', danger: true, run: NX.askLogout }]);
    const n = document.getElementById('tbBellN');
    if (n && S.me.role === 'SISWA') { const k = ((S.boot && S.boot.pengumuman) || []).length; n.hidden = !k; n.textContent = k; }
  };
  NX.askLogout = () => NX.confirm('Keluar dari ' + esc(NX.appName()) + '?', { title: 'Keluar', icon: 'logout', yes: 'Keluar' }).then((y) => { if (y) NX.logout(); });
  NX.bell = function () {
    if (S.me.role === 'ADMIN') { NX.go('a/pelanggaran'); return; }
    const list = (S.boot && S.boot.pengumuman) || [];
    NX.modal({ title: 'Pengumuman', icon: 'megaphone', body: list.length ? list.map((p) => '<div class="row-item" style="align-items:flex-start"><span class="tile sm">' + ic('megaphone', 'sm') + '</span><div><div class="b7">' + esc(p.judul) + '</div><div class="small tx2 mt4" style="white-space:pre-wrap">' + esc(p.isi) + '</div></div></div>').join('') : NX.empty('megaphone', 'Belum ada pengumuman', '') });
  };

  // ------------------------------------------------------------ tabel data
  /** Tabel dengan pencarian, filter, urut, paginasi (semua di peramban). */
  NX.Table = function (el, o) {
    const st = { q: '', f: {}, sort: o.sort || null, dir: o.dir || 1, page: 1, size: o.pageSize || 25 };
    let rows = o.rows || [];
    el.innerHTML = '<div class="tbar">' + (o.search ? '<div class="input-ic">' + ic('search') + '<input class="input input-sm" data-q placeholder="' + esc(o.searchPh || 'Cari…') + '"></div>' : '') +
      (o.filters || []).map((f, i) => '<select class="select input-sm" data-f="' + i + '" style="width:auto;min-width:150px"><option value="">' + esc(f.label) + '</option>' + f.options.map((op) => '<option value="' + esc(op[0]) + '">' + esc(op[1]) + '</option>').join('') + '</select>').join('') +
      '<span class="small muted" data-count></span><div class="ml-a flex g8 wrap">' + (o.tools || '') + '</div></div><div class="tbl-wrap"><table class="tbl ' + (o.compact ? 'compact' : '') + '"><thead><tr>' +
      o.columns.map((c, i) => '<th class="' + (c.sort !== false && c.k ? 'sort ' : '') + (c.cls || '') + '" data-c="' + i + '" style="' + (c.w ? 'width:' + c.w : '') + '">' + esc(c.label) + (c.sort !== false && c.k ? '<span class="arr"></span>' : '') + '</th>').join('') + '</tr></thead><tbody></tbody></table></div><div class="pager"></div>';
    const tb = el.querySelector('tbody'), pg = el.querySelector('.pager'), cnt = el.querySelector('[data-count]');
    function filtered() {
      const q = st.q.toLowerCase().trim();
      let r = rows.filter((x) => {
        if (q && !(o.search || []).some((k) => String(typeof k === 'function' ? k(x) : x[k] || '').toLowerCase().indexOf(q) > -1)) return false;
        return (o.filters || []).every((f, i) => { const v = st.f[i]; if (!v) return true; return f.fn ? f.fn(x, v) : String(x[f.k]) === v; });
      });
      if (st.sort !== null) {
        const c = o.columns[st.sort], k = c.sortKey || c.k;
        r = r.slice().sort((a, b) => { const x = typeof k === 'function' ? k(a) : a[k], y = typeof k === 'function' ? k(b) : b[k]; if (x === y) return 0; if (x === null || x === undefined || x === '') return 1; if (y === null || y === undefined || y === '') return -1; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'id', { numeric: true })) * st.dir; });
      }
      return r;
    }
    function draw() {
      const r = filtered(), n = r.length, pages = Math.max(1, Math.ceil(n / st.size));
      st.page = Math.min(st.page, pages);
      const slice = r.slice((st.page - 1) * st.size, st.page * st.size);
      tb.innerHTML = slice.length ? slice.map((x, i) => '<tr class="' + (o.onRow ? 'click ' : '') + (o.rowClass ? o.rowClass(x) : '') + '" data-i="' + i + '">' + o.columns.map((c) => '<td class="' + (c.cls || '') + '">' + (c.render ? c.render(x) : esc(x[c.k] === null || x[c.k] === undefined ? '-' : x[c.k])) + '</td>').join('') + '</tr>').join('')
        : '<tr><td colspan="' + o.columns.length + '">' + NX.empty(o.empty && o.empty.icon || 'search', o.empty && o.empty.title || 'Tidak ada data', o.empty && o.empty.text || (rows.length ? 'Ubah kata kunci atau saringan.' : '')) + '</td></tr>';
      tb._rows = slice;
      if (cnt) cnt.textContent = rows.length ? n + ' dari ' + rows.length : '';
      const btns = [];
      const add = (p, l, dis, on) => btns.push('<button data-p="' + p + '" ' + (dis ? 'disabled' : '') + ' class="' + (on ? 'on' : '') + '">' + l + '</button>');
      add(st.page - 1, '‹', st.page <= 1);
      const span = [];
      for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - st.page) <= 1) span.push(p); else if (span[span.length - 1] !== '…') span.push('…');
      span.forEach((p) => p === '…' ? btns.push('<span class="muted">…</span>') : add(p, p, false, p === st.page));
      add(st.page + 1, '›', st.page >= pages);
      pg.innerHTML = '<span>Menampilkan ' + (n ? ((st.page - 1) * st.size + 1) + '–' + Math.min(n, st.page * st.size) : 0) + ' dari ' + n + '</span><div class="flex ic g8"><select class="select input-sm" data-size style="width:auto">' + (o.sizes || [10, 25, 50, 100]).map((s) => '<option ' + (s === st.size ? 'selected' : '') + '>' + s + '</option>').join('') + '</select><div class="pg">' + btns.join('') + '</div></div>';
      el.querySelectorAll('th[data-c]').forEach((th) => { const a = th.querySelector('.arr'); if (a) a.textContent = +th.dataset.c === st.sort ? (st.dir > 0 ? '▲' : '▼') : '↕'; });
      if (o.onDraw) o.onDraw(el);
      NX.afterRender(tb);
    }
    const qi = el.querySelector('[data-q]');
    if (qi) qi.addEventListener('input', NX.debounce(() => { st.q = qi.value; st.page = 1; draw(); }, 150));
    el.querySelectorAll('[data-f]').forEach((s) => s.addEventListener('change', () => { st.f[s.dataset.f] = s.value; st.page = 1; draw(); }));
    el.querySelectorAll('th.sort').forEach((th) => th.addEventListener('click', () => { const c = +th.dataset.c; if (st.sort === c) st.dir = -st.dir; else { st.sort = c; st.dir = o.columns[c].desc ? -1 : 1; } draw(); }));
    pg.addEventListener('click', (e) => { const b = e.target.closest('button[data-p]'); if (b && !b.disabled) { st.page = +b.dataset.p; draw(); } });
    pg.addEventListener('change', (e) => { if (e.target.matches('[data-size]')) { st.size = +e.target.value; st.page = 1; draw(); } });
    if (o.onRow) tb.addEventListener('click', (e) => { if (e.target.closest('button,a,input,select,label')) return; const tr = e.target.closest('tr[data-i]'); if (tr) o.onRow(tb._rows[+tr.dataset.i]); });
    draw();
    const api = { setRows(r) { rows = r || []; draw(); }, search(q) { st.q = q || ''; if (qi) qi.value = q; st.page = 1; draw(); }, filtered, draw, state: st, setFilter(i, v) { st.f[i] = v; const s = el.querySelector('[data-f="' + i + '"]'); if (s) s.value = v; draw(); } };
    if (o.globalSearch !== false) NX.onSearch = (q) => api.search(q);
    return api;
  };

  // ------------------------------------------------------------ grafik SVG
  const PAL = ['var(--p)', '#7C3AED', '#16A34A', '#F97316', '#0891B2', '#E11D48'];
  NX.PAL = PAL;
  const chart = NX.chart = {};
  function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  /** Grafik garis/area. o: {labels, series:[{name, values, color}], h, min, max, ref:{v,label}, fmt} */
  chart.line = function (o) {
    const W = 640, H = o.h || 240, L = 36, R = 14, T = 16, B = 30;
    const all = o.series.reduce((a, s) => a.concat(s.values.filter((v) => v !== null && v !== undefined)), []);
    const min = o.min !== undefined ? o.min : 0, max = o.max !== undefined ? o.max : niceMax(Math.max(1, ...all));
    const n = o.labels.length, x = (i) => L + (n <= 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = (v) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img"><defs>' + o.series.map((se, k) => '<linearGradient id="lg' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (se.color || PAL[k]) + '" stop-opacity=".22"/><stop offset="1" stop-color="' + (se.color || PAL[k]) + '" stop-opacity="0"/></linearGradient>').join('') + '</defs>';
    for (let i = 0; i <= 4; i++) { const v = min + (max - min) * i / 4, yy = y(v); s += '<line class="grid-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + NX.fmt.num(v, 0) + '</text>'; }
    const step = Math.ceil(n / 8);
    o.labels.forEach((lb, i) => { if (i % step === 0 || i === n - 1) s += '<text class="ax" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(String(lb).slice(0, 12)) + '</text>'; });
    if (o.ref) s += '<line class="ref" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.ref.v) + '" y2="' + y(o.ref.v) + '"/><text class="ref-t" x="' + (W - R) + '" y="' + (y(o.ref.v) - 6) + '" text-anchor="end">' + esc(o.ref.label) + '</text>';
    o.series.forEach((se, k) => {
      const col = se.color || PAL[k];
      const pts = se.values.map((v, i) => (v === null || v === undefined ? null : [x(i), y(v)])).filter(Boolean);
      if (!pts.length) return;
      let d = 'M' + pts[0][0] + ',' + pts[0][1];
      for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i], cx = (p0[0] + p1[0]) / 2; d += ' C' + cx + ',' + p0[1] + ' ' + cx + ',' + p1[1] + ' ' + p1[0] + ',' + p1[1]; }
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) * 1.15;
      s += '<path class="area" d="' + d + ' L' + pts[pts.length - 1][0] + ',' + (H - B) + ' L' + pts[0][0] + ',' + (H - B) + 'Z" fill="url(#lg' + k + ')"/>';
      s += '<path class="line" d="' + d + '" stroke="' + col + '" style="--len:' + Math.ceil(len + 10) + '"/>';
      se.values.forEach((v, i) => { if (v === null || v === undefined) return; s += '<circle class="pt" cx="' + x(i) + '" cy="' + y(v) + '" r="5" fill="#fff" stroke="' + col + '" stroke-width="2.5" style="animation-delay:' + (0.4 + i * 0.06) + 's" data-tip="<b>' + esc(o.labels[i]) + '</b><br>' + esc(se.name) + ': ' + NX.fmt.num(v) + '"/>'; });
    });
    return s + '</svg>';
  };
  /** Grafik batang vertikal. o: {labels, values|series, colors, h, max, fmt} */
  chart.bars = function (o) {
    const W = 640, H = o.h || 240, L = 36, R = 10, T = 16, B = 32;
    const series = o.series || [{ name: o.name || '', values: o.values, color: o.color }];
    const all = series.reduce((a, s) => a.concat(s.values), []);
    const max = o.max || niceMax(Math.max(1, ...all));
    const n = o.labels.length, gw = (W - L - R) / Math.max(1, n), bw = Math.min(42, gw * 0.7 / series.length);
    const y = (v) => T + (1 - v / max) * (H - T - B);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img">';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4, yy = y(v); s += '<line class="grid-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text class="ax" x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + NX.fmt.num(v, 0) + '</text>'; }
    if (o.ref) s += '<line class="ref" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.ref.v) + '" y2="' + y(o.ref.v) + '"/><text class="ref-t" x="' + (W - R) + '" y="' + (y(o.ref.v) - 6) + '" text-anchor="end">' + esc(o.ref.label) + '</text>';
    o.labels.forEach((lb, i) => {
      const cx = L + gw * i + gw / 2;
      series.forEach((se, k) => {
        const v = se.values[i] || 0, x0 = cx - (bw * series.length) / 2 + k * bw + 2, col = (o.colors && o.colors[i]) || se.color || PAL[k];
        s += '<rect class="bar" x="' + x0 + '" y="' + y(v) + '" width="' + (bw - 4) + '" height="' + Math.max(0, H - B - y(v)) + '" rx="6" fill="' + col + '" style="animation-delay:' + (i * 0.05) + 's" data-tip="<b>' + esc(lb) + '</b><br>' + (se.name ? esc(se.name) + ': ' : '') + NX.fmt.num(v) + (o.unit || '') + '"/>';
      });
      s += '<text class="ax" x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(String(lb).slice(0, 14)) + '</text>';
    });
    return s + '</svg>';
  };
  /** Batang horizontal dengan label kiri. o: {items:[{label, value, color, sub}], max, unit} */
  chart.hbars = function (o) {
    const max = o.max || Math.max(1, ...o.items.map((i) => i.value));
    return '<div class="col g12">' + o.items.map((it, i) => '<div><div class="flex jb small"><span class="b6 clamp1">' + esc(it.label) + '</span><span class="b7 num">' + NX.fmt.num(it.value) + (o.unit || '') + (it.sub ? ' <span class="muted xs">' + esc(it.sub) + '</span>' : '') + '</span></div><div class="meter mt4" style="height:10px"><i data-w="' + Math.round(it.value / max * 100) + '%" style="width:0;background:' + (it.color || PAL[i % PAL.length]) + '"></i></div></div>').join('') + '</div>';
  };
  /** Donat. o: {items:[{label,value,color}], size, thick, center:{v,l}} */
  chart.donut = function (o) {
    const size = o.size || 180, th = o.thick || 22, r = (size - th) / 2, C = 2 * Math.PI * r;
    const total = o.items.reduce((a, b) => a + (b.value || 0), 0);
    let acc = 0, arcs = '';
    o.items.forEach((it, i) => {
      if (!it.value) return;
      const frac = it.value / (total || 1), len = Math.max(0, frac * C - (o.items.length > 1 ? 2 : 0));
      arcs += '<circle class="donut-arc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (it.color || PAL[i % PAL.length]) + '" stroke-width="' + th + '" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + C + '" data-off="' + (-acc * C) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" data-tip="<b>' + esc(it.label) + '</b>: ' + NX.fmt.num(it.value) + ' (' + NX.fmt.num(frac * 100, 1) + '%)"/>';
      acc += frac;
    });
    const ctr = o.center ? '<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="num b8" style="font-size:' + Math.round(size / 6.2) + 'px">' + esc(o.center.v) + '</div><div class="xs muted">' + esc(o.center.l || '') + '</div></div></div>' : '';
    return '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;flex:none"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--div)" stroke-width="' + th + '"/>' + arcs + '</svg>' + ctr + '</div>';
  };
  chart.legend = (items, row) => '<div class="legend ' + (row ? 'row' : '') + '">' + items.map((it, i) => '<div class="li"><span class="sw" style="background:' + (it.color || PAL[i % PAL.length]) + '"></span><span class="clamp1">' + esc(it.label) + '</span>' + (it.value !== undefined ? '<span class="v">' + esc(it.vtext || NX.fmt.num(it.value)) + '</span>' : '') + '</div>').join('') + '</div>';
  /** Peta sebar p vs D. o: {points:[{x,y,color,label}], h} */
  chart.scatter = function (o) {
    const W = 640, H = o.h || 300, L = 40, R = 12, T = 12, B = 34;
    const xr = [0, 1], yr = [-0.4, 1];
    const x = (v) => L + (v - xr[0]) / (xr[1] - xr[0]) * (W - L - R), y = (v) => T + (1 - (Math.max(yr[0], Math.min(yr[1], v)) - yr[0]) / (yr[1] - yr[0])) * (H - T - B);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<rect x="' + L + '" y="' + y(1) + '" width="' + (W - L - R) + '" height="' + (y(0.3) - y(1)) + '" fill="#F0FDF4"/><rect x="' + L + '" y="' + y(0.3) + '" width="' + (W - L - R) + '" height="' + (y(0.2) - y(0.3)) + '" fill="#FFFBEB"/><rect x="' + L + '" y="' + y(0.2) + '" width="' + (W - L - R) + '" height="' + (y(yr[0]) - y(0.2)) + '" fill="#FEF2F2"/>';
    [0.3, 0.7].forEach((p) => { s += '<line x1="' + x(p) + '" x2="' + x(p) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#CBD5E1" stroke-dasharray="4 4"/>'; });
    [-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1].forEach((v) => { s += '<text class="ax" x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v.toFixed(1).replace('.', ',') + '</text>'; });
    [0, 0.3, 0.5, 0.7, 1].forEach((v) => { s += '<text class="ax" x="' + x(v) + '" y="' + (H - 16) + '" text-anchor="middle">' + v.toFixed(1).replace('.', ',') + '</text>'; });
    s += '<text class="ax" x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end">Tingkat kesukaran (p) →</text><text class="ax" x="' + (L + 4) + '" y="' + (T + 12) + '">Daya beda (D) ↑</text>';
    s += '<text class="ax" x="' + (x(0.15)) + '" y="' + (T + 26) + '" text-anchor="middle">Sukar</text><text class="ax" x="' + x(0.5) + '" y="' + (T + 26) + '" text-anchor="middle">Sedang</text><text class="ax" x="' + x(0.85) + '" y="' + (T + 26) + '" text-anchor="middle">Mudah</text>';
    o.points.forEach((p, i) => { s += '<circle class="pt" cx="' + x(p.x) + '" cy="' + y(p.y) + '" r="7" fill="' + p.color + '" stroke="#fff" stroke-width="2" style="animation-delay:' + (0.2 + i * 0.03) + 's;cursor:pointer" data-tip="' + esc(p.label) + '" ' + (p.attr || '') + '/>'; });
    return s + '</svg>';
  };
  /** Cincin skor. */
  chart.ring = function (val, max, size, color, label) {
    size = size || 160; const th = 14, r = (size - th) / 2, C = 2 * Math.PI * r, frac = Math.max(0, Math.min(1, (val || 0) / (max || 100)));
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--p-50)" stroke-width="' + th + '"/><circle class="arc" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || 'var(--p)') + '" stroke-width="' + th + '" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" data-off="' + (C * (1 - frac)) + '"/></svg><div class="val"><div class="num b8" style="font-size:' + Math.round(size / 3.6) + 'px;line-height:1"><span data-count="' + (val || 0) + '" data-dec="' + (val % 1 ? 2 : 0) + '">0</span></div><div class="xs muted">' + esc(label || '/ ' + max) + '</div></div></div>';
  };

  // ------------------------------------------------------------ HTML soal (sanitasi di peramban)
  const OK_TAGS = ['B', 'STRONG', 'I', 'EM', 'U', 'SUP', 'SUB', 'BR', 'P', 'DIV', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'SPAN', 'IMG', 'HR', 'CODE', 'PRE', 'BLOCKQUOTE', 'S'];
  NX.sanitize = function (html) {
    const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    const walk = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 1) {
          if (OK_TAGS.indexOf(c.tagName) === -1) { if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].indexOf(c.tagName) > -1) { c.remove(); return; } walk(c); c.replaceWith(...c.childNodes); return; }
          Array.from(c.attributes).forEach((a) => { const n = a.name.toLowerCase(); const keep = (c.tagName === 'IMG' && n === 'src' && /^(https:\/\/|data:image\/)/i.test(a.value)) || ((c.tagName === 'TD' || c.tagName === 'TH') && (n === 'colspan' || n === 'rowspan')); if (!keep) c.removeAttribute(a.name); });
          walk(c);
        } else if (c.nodeType !== 3) c.remove();
      });
    };
    const root = doc.body.firstChild; walk(root);
    return root.innerHTML;
  };
  NX.rich = (html) => NX.sanitize(html);
  NX.plain = (html) => { const d = document.createElement('div'); d.innerHTML = NX.sanitize(html); return d.textContent.replace(/\s+/g, ' ').trim(); };

  // ------------------------------------------------------------ skrip eksternal (lazy)
  const scripts = {};
  NX.loadScript = (url, globalName) => {
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
    if (scripts[url]) return scripts[url];
    scripts[url] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = url; s.async = true;
      const to = setTimeout(() => { delete scripts[url]; rej(new Error('Gagal memuat pustaka (' + url.split('/')[2] + '). Periksa koneksi internet.')); }, 20000);
      s.onload = () => { clearTimeout(to); res(globalName ? window[globalName] : true); };
      s.onerror = () => { clearTimeout(to); delete scripts[url]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
    return scripts[url];
  };
  NX.LIB = {
    xlsx: 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
    mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
    jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  };
  /** Ekspor Excel (SheetJS); jika pustaka gagal dimuat, unduh CSV lembar pertama. */
  NX.exportXlsx = async function (name, sheets) {
    try {
      const X = await NX.loadScript(NX.LIB.xlsx, 'XLSX');
      const wb = X.utils.book_new();
      sheets.forEach((s) => { const ws = X.utils.aoa_to_sheet(s.rows); if (s.cols) ws['!cols'] = s.cols.map((w) => ({ wch: w })); X.utils.book_append_sheet(wb, ws, String(s.name).slice(0, 31)); });
      X.writeFile(wb, name.replace(/[^\w.-]+/g, '_') + '.xlsx');
    } catch (e) {
      const csv = sheets[0].rows.map((r) => r.map((v) => { const s = String(v === null || v === undefined ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
      NX.download(name.replace(/[^\w.-]+/g, '_') + '.csv', new Blob(['﻿' + csv], { type: 'text/csv' }));
      NX.toast('Pustaka Excel tidak termuat, diunduh sebagai CSV.', 'warn');
    }
  };
  NX.download = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
  /** Baca berkas Excel/CSV → array baris (array of array). */
  NX.readSheet = async function (file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) { const txt = await file.text(); return parseCsv(txt); }
    const X = await NX.loadScript(NX.LIB.xlsx, 'XLSX');
    const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, blankrows: true });
  };
  function parseCsv(txt) {
    const sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r' && ch !== '﻿') cur += ch;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  NX.parseCsv = parseCsv;

  // ------------------------------------------------------------ gambar: baca, kecilkan, potong, unggah
  NX.readDataUrl = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Berkas tidak bisa dibaca.')); r.readAsDataURL(file); });
  NX.loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Gambar tidak valid.')); im.src = src; });
  NX.resizeImg = async function (src, maxDim, mime, q) {
    const im = await NX.loadImg(typeof src === 'string' ? src : await NX.readDataUrl(src));
    const k = Math.min(1, (maxDim || 1200) / Math.max(im.width, im.height));
    const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; if ((mime || 'image/jpeg') === 'image/jpeg') g.fillRect(0, 0, c.width, c.height);
    g.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL(mime || 'image/jpeg', q || 0.85);
  };
  /** Alat potong persegi (seret untuk menggeser, geser slider untuk memperbesar). */
  NX.cropper = function (file, out) {
    out = out || [512];
    return new Promise(async (resolve) => {
      let src;
      try { src = await NX.readDataUrl(file); await NX.loadImg(src); } catch (e) { NX.fail(e); resolve(null); return; }
      const m = NX.modal({ title: 'Potong Gambar (persegi)', icon: 'crop', body: '<div class="cropper" id="cr"><img id="crImg" src="' + src + '"><div class="mask"></div></div><div class="flex ic g12 mt16">' + NX.ic('minus', 'sm') + '<input type="range" id="crZoom" min="1" max="4" step="0.01" value="1" class="f1">' + NX.ic('plus', 'sm') + '</div><p class="xs muted tc mt8">Seret gambar untuk mengatur posisi.</p>',
        foot: '<button class="btn btn-s" data-x>Batal</button><button class="btn btn-p" id="crOk">' + NX.ic('check') + 'Gunakan</button>', onClose: (v) => { if (v === undefined) resolve(null); } });
      const box = m.$('#cr'), img = m.$('#crImg'), Z = m.$('#crZoom');
      const im = await NX.loadImg(src);
      const B = 300, base = B / Math.min(im.width, im.height);
      let z = 1, ox = 0, oy = 0;
      const lay = () => { const w = im.width * base * z, h = im.height * base * z; ox = NX.clamp(ox, B - w, 0); oy = NX.clamp(oy, B - h, 0); img.style.width = w + 'px'; img.style.height = h + 'px'; img.style.left = ox + 'px'; img.style.top = oy + 'px'; };
      ox = (B - im.width * base) / 2; oy = (B - im.height * base) / 2; lay();
      Z.oninput = () => { const cx = (B / 2 - ox) / z, cy = (B / 2 - oy) / z; z = +Z.value; ox = B / 2 - cx * z; oy = B / 2 - cy * z; lay(); };
      let drag = null;
      box.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY, ox, oy }; box.setPointerCapture(e.pointerId); };
      box.onpointermove = (e) => { if (!drag) return; ox = drag.ox + e.clientX - drag.x; oy = drag.oy + e.clientY - drag.y; lay(); };
      box.onpointerup = () => { drag = null; };
      m.$('#crOk').onclick = () => {
        const sx = -ox / (base * z), sy = -oy / (base * z), sw = B / (base * z);
        const res = out.map((size) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.drawImage(im, sx, sy, sw, sw, 0, 0, size, size); return c.toDataURL('image/png'); });
        m.close(true); resolve(res);
      };
    });
  };
  NX.upload = (jenis, dataUrl, nama) => {
    const mime = (/^data:([^;]+);/.exec(dataUrl) || [])[1] || 'image/png';
    return NX.api('file.upload', { jenis, nama: nama || jenis + '.' + (mime.split('/')[1] || 'bin'), mime, base64: dataUrl }, { retry: 2, timeout: 90000 });
  };
  NX.zoomImg = (src) => NX.modal({ title: 'Gambar', size: 'xl', body: '<div class="tc"><img src="' + esc(src) + '" style="max-height:75vh;border-radius:12px"></div>' });

  // ------------------------------------------------------------ ilustrasi (vektor, mengikuti warna utama)
  NX.art = function (kind) {
    if (kind === 'study') return '<svg viewBox="0 0 360 260" class="art" aria-hidden="true"><ellipse cx="190" cy="240" rx="150" ry="14" fill="rgba(255,255,255,.18)"/><rect x="70" y="150" width="230" height="14" rx="7" fill="rgba(255,255,255,.85)"/><rect x="110" y="70" width="150" height="86" rx="10" fill="#fff"/><rect x="120" y="80" width="130" height="64" rx="6" fill="var(--p-50)"/><rect x="132" y="92" width="70" height="8" rx="4" fill="var(--p)"/><rect x="132" y="108" width="96" height="6" rx="3" fill="var(--p-100)"/><rect x="132" y="120" width="80" height="6" rx="3" fill="var(--p-100)"/><circle cx="236" cy="126" r="9" fill="#16A34A"/><path d="m232 126 3 3 5-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="185" cy="40" r="22" fill="#FDE68A"/><path d="M163 38c0-14 10-22 22-22s22 8 22 20c-8-6-20-8-30-4z" fill="#1E293B"/><path d="M150 150c4-34 18-50 35-50s31 16 35 50z" fill="var(--acc)"/><rect x="296" y="96" width="34" height="60" rx="6" fill="rgba(255,255,255,.9)"/><path d="M304 110h18M304 120h18M304 130h12" stroke="var(--p)" stroke-width="3" stroke-linecap="round"/><circle cx="56" cy="96" r="20" fill="rgba(255,255,255,.9)"/><path d="M56 84v12l8 5" stroke="var(--p)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
    if (kind === 'admin') return '<svg viewBox="0 0 360 260" class="art" aria-hidden="true"><ellipse cx="190" cy="240" rx="150" ry="14" fill="rgba(255,255,255,.18)"/><rect x="60" y="60" width="240" height="150" rx="14" fill="#fff"/><rect x="60" y="60" width="240" height="30" rx="14" fill="var(--p-50)"/><circle cx="80" cy="75" r="5" fill="#F87171"/><circle cx="96" cy="75" r="5" fill="#FBBF24"/><circle cx="112" cy="75" r="5" fill="#34D399"/><rect x="80" y="160" width="22" height="34" rx="4" fill="var(--p-100)"/><rect x="110" y="140" width="22" height="54" rx="4" fill="var(--p)"/><rect x="140" y="120" width="22" height="74" rx="4" fill="var(--p-100)"/><rect x="170" y="104" width="22" height="90" rx="4" fill="var(--acc)"/><circle cx="250" cy="146" r="34" fill="none" stroke="var(--p-50)" stroke-width="14"/><circle cx="250" cy="146" r="34" fill="none" stroke="var(--p)" stroke-width="14" stroke-dasharray="150 214" transform="rotate(-90 250 146)"/><rect x="300" y="30" width="44" height="54" rx="10" fill="rgba(255,255,255,.92)"/><path d="M322 44v14M322 64h.01" stroke="#DC2626" stroke-width="4" stroke-linecap="round"/></svg>';
    return '';
  };
})();
