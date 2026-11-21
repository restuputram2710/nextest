# PANDUAN INSTALASI NEXTEST
### CBT Anti-Contek Sekolah · Google Apps Script (backend) + GitHub Pages (frontend)

Panduan ini ditulis untuk orang yang **belum pernah** memasang aplikasi web. Ikuti urutannya dari atas ke bawah. Total waktu ±45 menit.

---

## 0. Isi paket

| Berkas | Untuk apa | Ke mana |
|---|---|---|
| `Kode.gs`, `Keamanan.gs`, `Master.gs`, `Soal.gs`, `Ujian.gs`, `Laporan.gs`, `Setup.gs` | Server (backend) | Ditempel ke proyek **Google Apps Script** |
| `appsscript.json` | Pengaturan proyek (zona waktu, Drive API, web app) | Ditempel ke proyek Apps Script |
| `nextest-frontend.zip` | Tampilan aplikasi (frontend) | Diunggah ke **GitHub Pages** |
| `PANDUAN-INSTALASI.md` | Panduan ini | Dibaca 🙂 |

Di dalam ZIP frontend sudah ada **template impor**: `templates/template-soal-cbt.docx`, `templates/template-soal-cbt.xlsx`, dan `templates/template-siswa.xlsx`.

> **Tidak ada data yang dipindahkan dari aplikasi lain.** NEXTEST memakai database baru yang dibuat otomatis. Data siswa dan soal Anda masukkan lewat menu Impor (Excel/Word/Google Sheets). Impor **aman diulang**: siswa dengan NIS/NISN yang sama diperbarui, tidak digandakan.

---

## 1. Persiapan

1. **Akun Google khusus NEXTEST** (sangat disarankan akun Google Workspace sekolah, mis. `cbt@sekolah.sch.id`).
   Semua permintaan 400 siswa dihitung atas akun pemilik ini (batas Google: 30 proses bersamaan per akun), jadi **jangan** jalankan skrip lain di akun ini saat ujian.
2. **Akun GitHub** (gratis) — untuk menyimpan tampilan. Nama pengguna GitHub akan menjadi alamat situs: `https://namaanda.github.io/...`
3. Laptop dengan **Git** terpasang (Tahap B menjelaskan caranya).

---

## 2. Tahap A — Backend (Google Apps Script)

### A1. Buat proyek
1. Masuk ke akun Google NEXTEST → buka **https://script.google.com** → **Proyek baru**.
2. Klik judul "Proyek tanpa judul" → beri nama **NEXTEST API**.

### A2. Tampilkan & isi `appsscript.json`
1. Klik ikon ⚙️ **Setelan proyek** (kiri) → centang **"Tampilkan file manifes 'appsscript.json' di editor"**.
2. Kembali ke **Editor** (ikon `< >`) → klik `appsscript.json` → hapus isinya → tempel isi berkas `appsscript.json` dari paket → **Simpan** (Ctrl+S).
   Ini otomatis menyalakan **Drive API** (dipakai untuk mengubah Word → PDF) dan zona waktu **Asia/Jakarta**.

### A3. Tempel 7 berkas kode
1. File `Kode.gs` sudah ada → hapus isinya → tempel isi `Kode.gs` dari paket.
2. Untuk berkas lain: klik **＋** di samping "File" → **Skrip** → beri nama **persis** `Keamanan` (tanpa `.gs`) → tempel isinya. Ulangi untuk `Master`, `Soal`, `Ujian`, `Laporan`, `Setup`.
3. **Simpan** (Ctrl+S). Pastikan tidak ada tanda merah. Urutan berkas di daftar kiri tidak berpengaruh.

### A4. Jalankan `setupAplikasi` (sekali saja)
1. Di bilah atas, pilih fungsi **`setupAplikasi`** → klik **▶ Jalankan**.
2. Muncul **"Otorisasi diperlukan"** → **Tinjau izin** → pilih akun NEXTEST → bila muncul "Google belum memverifikasi aplikasi ini" klik **Lanjutan → Buka NEXTEST API (tidak aman)** → **Izinkan**. (Ini wajar untuk skrip buatan sendiri.)
3. Tunggu sampai **Log eksekusi** selesai. Contoh:
   ```
   🚀 Menyiapkan NEXTEST v1.0.0 …
   🔐 AKUN ADMIN PERTAMA (catat sekarang — hanya tampil sekali, ganti setelah login):
       Username   : admin
       Kata sandi : Xb7…………
   ✅ Setup selesai.
      Spreadsheet : https://docs.google.com/spreadsheets/d/…
      Folder Drive: https://drive.google.com/drive/folders/…
   ```
   Sekaligus terpasang 2 trigger: `tickNextest` (tiap 5 menit) dan `backupMingguan` (Minggu 01.00) — cek di menu ⏰ **Pemicu**.
4. **Catat kata sandi admin** sekarang. Setelah login pertama, segera ganti di **Pengaturan → Akun Saya**.

`setupAplikasi` aman dijalankan ulang: tidak menimpa data, kata sandi, atau kunci rahasia yang sudah ada.

> **Ingin mencoba dulu dengan data contoh?** Jalankan fungsi **`buatDataContoh`**. Ia membuat 2 kelas, 10 siswa (NIS `2026001`–`2026010`, NISN `0062841920`–…), 6 soal semua tipe, dan 1 ujian yang sedang berlangsung. Token ujian tercetak di log. Hapus/nonaktifkan data contoh sebelum dipakai sungguhan.

### A5. Rahasia & ID — semuanya otomatis di Script Properties
Anda **tidak perlu mengetik apa pun**. Buka ⚙️ **Setelan proyek → Properti skrip** untuk melihat:

| Kunci | Diisi oleh | Isi |
|---|---|---|
| `SPREADSHEET_ID` | `setupAplikasi` | ID database `NEXTEST_DB` |
| `FOLDER_ROOT_ID`, `FOLDER_LOGO_ID`, `FOLDER_FOTO_ID`, `FOLDER_GAMBAR_ID`, `FOLDER_LAMPIRAN_ID`, `FOLDER_ARSIP_ID` | `setupAplikasi` | ID folder Drive |
| `SESSION_SECRET` | `setupAplikasi` (acak 64 karakter) | Kunci tanda tangan token login. **Jangan dihapus/diubah** — bila hilang semua pengguna keluar dan perlu masuk ulang |
| `PEMANASAN` | `matikanPemanasan()` | Hanya ada bila pemanasan dimatikan |

Aturan keamanan yang dipakai: rahasia **hanya** di Script Properties — tidak ada di kode, di frontend, maupun di log. Kata sandi admin disimpan sebagai **hash + salt** (tidak bisa dibaca balik). Siapa pun yang punya akses **edit** ke proyek Apps Script dapat melihat Properti skrip, jadi **jangan menambah editor sembarangan**, dan **jangan bagikan spreadsheet `NEXTEST_DB`** ke orang lain (berisi hash sandi dan data siswa).

### A6. Deploy sebagai Web App
1. Kanan atas: **Terapkan → Deployment baru** → ikon ⚙️ → pilih **Aplikasi web**.
2. Isi:
   - Deskripsi: `NEXTEST v1.0.0`
   - **Jalankan sebagai: Saya** (akun NEXTEST)
   - **Yang memiliki akses: Siapa saja**
3. **Terapkan** → salin **URL aplikasi web** yang berakhiran **`/exec`**.
4. Uji: buka `URL…/exec?w=pub` di peramban → harus tampil `{"ok":true,"data":{"app":"NEXTEST",…}}`.

> "Siapa saja" **bukan** berarti data terbuka: setiap permintaan diperiksa token login dan perannya di server. Tanpa login, tidak ada data yang bisa diambil.

### A7. Saat memperbarui kode backend di kemudian hari
**Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.**
Jangan membuat "Deployment baru" — URL `/exec` akan berubah dan frontend harus diubah lagi.

---

## 3. Tahap B — Frontend ke GitHub Pages

### B1. Ekstrak ZIP & isi alamat server
1. Ekstrak `nextest-frontend.zip` ke mis. `Dokumen\nextest-frontend`. **Folder inilah folder proyek** — di dalamnya langsung terlihat:
   ```
   nextest-frontend\
   ├── index.html        ← harus ada di sini (bukan di subfolder)
   ├── README.md
   ├── PANDUAN-INSTALASI.md
   ├── css\app.css
   ├── js\config.js  core.js  ui.js  login.js  siswa.js  exam.js  admin.js  data.js  bank.js  laporan.js
   ├── img\favicon.svg
   └── templates\template-soal-cbt.docx  template-soal-cbt.xlsx  template-siswa.xlsx
   ```
2. Buka `js\config.js` dengan Notepad → ganti `GANTI_DENGAN_ID_DEPLOYMENT` sehingga menjadi URL `/exec` Anda:
   ```js
   window.APP_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfy…panjang…/exec'
   };
   ```
   Simpan. Ini **satu-satunya** nilai di frontend (bukan rahasia).

### B2. Pasang Git & identitas (sekali seumur laptop)
- Windows: unduh dari `https://git-scm.com/download/win`, pasang dengan pilihan bawaan. Buka **PowerShell**.
- Cek: `git --version`
- Isi identitas (bebas, hanya label):
  ```
  git config --global user.name "Nama Anda"
  git config --global user.email "email-akun-github@contoh.com"
  ```

### B3. Buat repository di GitHub
github.com → **＋ → New repository** → nama mis. `nextest` → **Public** → **jangan** centang README/.gitignore/license → **Create repository**.

### B4. Kirim berkas (dari folder yang BENAR)
1. Buka folder `nextest-frontend` di File Explorer → klik address bar → ketik `powershell` → Enter.
2. Cek dulu isi folder:
   ```
   dir
   ```
   Harus terlihat **`index.html`**, `css`, `js`, `img`, `templates`. Bila yang terlihat justru folder `nextest-frontend` lagi, masuk dulu: `cd nextest-frontend`. **Jangan lanjut sebelum `index.html` terlihat.**
3. Jalankan **satu per satu**:
   ```
   git init
   git add .
   git commit -m "NEXTEST v1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/nextest.git
   git push -u origin main
   ```
   (Perhatikan titik di `git add .`.)
4. Saat diminta **Password**, yang dimasukkan adalah **Personal Access Token**, bukan sandi GitHub:
   `https://github.com/settings/tokens` → **Generate new token (classic)** → centang **repo** → **Generate** → salin `ghp_…` → tempel (layar memang terlihat kosong saat menempel — itu normal) → Enter.
   Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### B5. Aktifkan GitHub Pages
Repository → **Settings → Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save** → centang **Enforce HTTPS**.
Tunggu 1–2 menit → muncul `Your site is live at https://USERNAME.github.io/nextest/`. Buka alamat itu.

### B6. Memperbarui tampilan di kemudian hari
Dari folder yang sama:
```
git add .
git commit -m "Perbarui tampilan"
git push
```
Lalu di peramban tekan **Ctrl+Shift+R**.

---

## 4. Tahap C — Mulai memakai

### C1. Masuk pertama (admin)
1. Buka situs → pilih **Admin** → username `admin` + kata sandi dari log.
2. **Pengaturan → Akun Saya** → ganti kata sandi.
3. **Pengaturan → Identitas** → unggah logo (dipotong persegi otomatis jadi 512 px & 128 px), nama aplikasi, tagline, nama sekolah, warna utama & aksen (pratinjau langsung + peringatan kontras) → **Simpan**. Semua perangkat memakai tema baru saat dibuka berikutnya.
4. **Pengaturan → Aturan Ujian** → batas pelanggaran bawaan, tindakan saat batas tercapai (**Kunci** atau **Kumpulkan otomatis**), tombol Selesai aktif N menit sebelum habis, KKM bawaan, jenis pelanggaran yang dihitung, interval sinkron, masa tenggang.
5. **Pengaturan → Akun Admin** → tambahkan guru/panitia (semua admin setara). Kata sandi awal tampil sekali.

### C2. Data master
1. **Kelas & Mapel** → tambah kelas (boleh isi KKM per kelas) dan mata pelajaran.
2. **Data Siswa → Template** → isi `template-siswa.xlsx` (NIS, NISN, Nama, Kelas, JK) → **Impor Excel/CSV** → **Pindai** (cek tanpa menyimpan) → **Jalankan Impor**. Centang "Buat kelas baru otomatis" bila kelas belum dibuat.

### C3. Bank soal
- **Bank Soal → Berkas Baru** (per mapel & jenis: UH/PTS/PAS/Latihan/Umum) → **Tambah Soal** pilih tipe:
  - **Pilihan Ganda**, **PG Kompleks** (lebih dari satu jawaban benar; nilai proporsional atau harus benar semua), **Kategori** (Benar/Salah, Fakta/Opini, dst.), **Esai** (rubrik + acuan, dikoreksi guru).
  - Teks bisa tebal/miring/pangkat/indeks/daftar/tabel, tempel dari Word, sisip gambar; gambar soal; gambar per pilihan; **lampiran PDF/Word** (dipecah per halaman jadi gambar, maks. 12).
- **Impor Soal** (3 langkah): Unduh Template → Unggah **Word (.docx)**, **Excel (.xlsx/.csv)**, atau **tautan Google Sheets** → Pratinjau & Simpan. Gambar yang ditempel di Word/Excel ikut terimpor. Format ringkas Word:
  ```
  1. Teks soal…
  A. pilihan   B. …   (satu pilihan per baris)
  KUNCI: B
  2. [MCMA] …            KUNCI: A, C
  3. [KATEGORI] …  - pernyataan 1  - pernyataan 2   KATEGORI: Benar | Salah   KUNCI: Benar | Salah
  4. [ESAI] …      RUBRIK: …   ACUAN: …   SKOR: 20
  ```
- Berkas bisa **Ekspor Excel** (format sama, bisa diimpor ulang) dan soal bisa diduplikat/diurutkan.

### C4. Jadwal ujian
**Jadwal Ujian → Buat Ujian** → judul, jenis, mapel, kelas, waktu buka/tutup, durasi, KKM ujian (opsional) → pilih soal dari berkas (atur bobot) atau **acak N soal per siswa** → keamanan: wajib token, batas pelanggaran, tindakan saat batas, acak soal, acak pilihan, tampilkan nilai → **Terbitkan**.
Saat terbit, server menyiapkan 1 baris per siswa (kunci kecepatan untuk 400 siswa). **Token** (untuk siswa) tampil di halaman ujian & Monitoring. Tidak ada PIN/kode pengawas — semua tindakan pengawas dilakukan admin dari menu **Monitoring Langsung**. Setelah ada siswa mulai, daftar soal terkunci.

### C5. Hari ujian
- [ ] Ujian sudah **Terbit** minimal H-1.
- [ ] Laptop/PC: Chrome/Edge terbaru. HP Android: aktifkan **Sematkan aplikasi / Pin layar**, matikan notifikasi.
- [ ] Token **dibacakan saat ujian dimulai**.
- [ ] Minimal satu admin membuka **Monitoring Langsung** (diperbarui otomatis tiap 15 detik).
- [ ] Siswa terkunci → admin buka **Monitoring Langsung → pilih ujian** → tombol **Buka kunci** di baris siswa (+ kompensasi waktu 0/5/10/15 menit, reset hitungan). Layar siswa **terbuka sendiri ±10 detik kemudian**, tanpa kode apa pun. Banyak yang terkunci sekaligus → **Buka Semua yang Terkunci**.
- [ ] Siswa perlu dihentikan (mis. ketahuan menyontek, waktu sesi habis) → tombol **Selesaikan** di baris siswa. Jawaban yang sudah diisi dikumpulkan dan langsung dinilai; layar siswa berpindah ke halaman hasil dengan keterangan *"diselesaikan oleh pengawas"*.
- [ ] Mengakhiri sesi untuk semua → kartu **Aksi Cepat → Selesaikan** (Selesaikan Semua). Centang **Tutup ujian sekarang** agar siswa yang belum mulai tidak bisa masuk lagi. Jawaban terakhir yang belum sempat terkirim dari perangkat siswa tetap diterima bila tersambung dalam 3 menit.
- [ ] Perangkat siswa rusak → **Reset login** → siswa masuk di perangkat lain, jawaban & sisa waktu tetap.
- [ ] Setelah selesai: **Hasil Ujian** (ketuntasan klasikal, remedial, ekspor Excel) → **Koreksi Esai** → **Analisis Butir**.

---

## 5. Login siswa cukup NIS / NISN — apa pengamannya?

Sesuai permintaan, siswa **tidak memakai kata sandi**. Karena NIS mudah diketahui teman, NEXTEST menambah pengaman:

1. **Token ujian** 6 karakter dari pengawas — wajib saat mulai dan saat pindah perangkat.
2. **Satu akun, satu perangkat** — saat ujian berjalan, login dari perangkat lain **ditolak** dan dicatat `LOGIN_GANDA`; hanya admin yang bisa **Reset login**.
3. `LOGIN_GANDA` **dicatat tetapi tidak dihitung** sebagai pelanggaran (bawaan), agar orang iseng yang tahu NIS teman tidak bisa membuat ujian temannya terkunci. Bisa diubah di Pengaturan → Aturan Ujian.
4. Watermark nama + NIS di layar soal.

---

## 6. Sistem anti-contek — yang dideteksi & batasannya

| Kejadian | Deteksi | Bawaan |
|---|---|---|
| Pindah tab / aplikasi / tombol Home | `visibilitychange` | Dihitung |
| Keluar layar penuh | `fullscreenchange` → soal disembunyikan sampai kembali | Dihitung |
| Jendela mengambang / notifikasi / klik aplikasi lain | hilang fokus > 2 detik | Dihitung |
| Layar terbagi / jendela diperkecil | ukuran < 70% | Dihitung |
| Tombol Print Screen / pintasan tangkapan layar | tombol | Dihitung |
| Salin, tempel, potong, klik kanan, seret | **diblokir** | Dicatat |
| F12, Ctrl+U/S/P, Ctrl+Shift+I/J/C | **diblokir** | Dicatat |
| Muat ulang halaman | penanda sesi | Dicatat |
| Login di perangkat lain | server | Dicatat |

Kejadian dalam rentang 3 detik digabung jadi satu. Sanksi bertingkat: peringatan kuning → **Peringatan Terakhir** merah → batas tercapai: **terkunci** (layar menunggu dan terbuka sendiri setelah admin menekan **Buka kunci** di Monitoring — tidak ada kode yang bisa ditebak siswa) **atau dikumpulkan otomatis** sesuai pengaturan ujian. Ada suara alarm, getar (HP), watermark, indikator luring, dan jawaban tersimpan di perangkat seketika.

**Batasan yang tidak bisa dihindari aplikasi web:** halaman web **tidak bisa memblokir** pembukaan tab/aplikasi lain (Alt+Tab, tombol Windows, Home di HP dikendalikan sistem operasi). NEXTEST **mendeteksi seketika, mencatat, dan menghukum**. HP kedua di bawah meja tidak terdeteksi — tetap butuh pengawas ruang. Untuk penguncian penuh: **Safe Exam Browser** (laptop) atau **Pin layar** (Android). iPhone tidak mendukung layar penuh untuk halaman web → tidak disarankan.

---

## 7. Kecepatan untuk 400 siswa (gas-scale-turbo)

- Soal dimuat **sekali** saat mulai; pindah soal tanpa server; jawaban disimpan di perangkat dan disinkron tiap **120 ± 30 detik**.
- Setiap siswa **hanya menulis ke barisnya sendiri** → tanpa antrean kunci global.
- Waktu habis: pengiriman diberi jeda acak 0–90 detik; server menerima sampai batas + masa tenggang 5 menit; trigger 5 menit memfinalisasi sesi yang tertinggal.
- Cache berversi (dipecah > 90 KB), batch beberapa permintaan jadi satu, pemanasan server tiap 5 menit.

**Hasil uji beban (simulator, 400 siswa):**

| Aksi | Baca Sheets | Tulis | Kunci | Gagal |
|---|---|---|---|---|
| Login | 0 | 1 | 0 | 0 |
| Mulai ujian | 1 | 2 | 0 | 0 |
| Sinkron | 1 | 1 (3 sel) | 0 | 0 |
| Sinkron + pelanggaran | 2 | 2 | 1 | 0 |
| Kumpul | 1 | 3 | 0 | 0 |

**Kuota trigger:** `tickNextest` tiap 5 menit ±1–3 detik → ±5–15 menit/hari (batas akun Gmail ±90 menit/hari; Workspace 6 jam/hari). Libur panjang? Jalankan `matikanPemanasan()`; nyalakan lagi dengan `nyalakanPemanasan()`.

---

## 8. Fungsi yang bisa dijalankan dari editor Apps Script

| Fungsi | Kegunaan |
|---|---|
| `setupAplikasi` | Instalasi awal / perbaikan (aman diulang) |
| `buatDataContoh` | Data uji coba (kelas, siswa, soal, ujian) |
| `resetSandiAdmin` | Lupa sandi akun `admin` → sandi baru tampil di log |
| `rotasiSecretSesi` | Keluarkan **semua** pengguna (mis. token bocor) |
| `matikanPemanasan` / `nyalakanPemanasan` | Hemat kuota saat tidak ada ujian |
| `cekPerforma` | Status cache, trigger, ukuran properti |
| `backupMingguan` | Salin database ke `05_Arsip` (otomatis tiap Minggu 01.00) |

Akhir semester: **Pengaturan → Arsip Semester** memindahkan jawaban & log ujian lama ke spreadsheet arsip agar database tetap ringan.

---

## 9. Kendala umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman bertuliskan "Konfigurasi belum lengkap" | `js/config.js` masih `GANTI_DENGAN_…` | Isi URL `/exec` (B1), push ulang |
| Situs GitHub 404 | `git init` dijalankan di folder yang salah | Lihat `dir` harus ada `index.html`; push ulang dari folder itu dengan `git push -u origin main --force` |
| Tampilan polos tanpa warna | Struktur `css/` `js/` rusak (upload lewat web GitHub) | Selalu kirim lewat terminal (B4) |
| "Gagal terhubung ke server" | URL `/exec` salah, atau deployment bukan "Siapa saja" | Cek A6; buka `…/exec?w=pub` |
| Setelah update backend tidak berubah | Membuat deployment baru / belum "Versi baru" | A7 |
| "Server sedang sibuk" saat ujian | Puncak beban | Aplikasi otomatis mencoba ulang; bila sering: bagi sesi 2 × 200 siswa |
| Impor Google Sheets gagal | Sheet tidak dibagikan | Bagikan "Siapa pun yang memiliki link dapat melihat" atau pakai sheet di akun NEXTEST |
| Logo/gambar tidak tampil | Berkas Drive terhapus / izin berubah | Unggah ulang dari aplikasi |
| Siswa: "Akun ini sedang dipakai mengerjakan … di perangkat lain" | Ikatan satu perangkat | Admin → Monitoring/Data Siswa → **Reset login** |

---

## 10. Keputusan & asumsi yang dipakai

- Peran: **Admin & Siswa** (guru memakai akun admin; semua admin setara).
- Siswa login **NIS atau NISN saja** (tanpa kata sandi) + token ujian + satu perangkat.
- **Tanpa cetak PDF otomatis** (kartu, rapor). Laporan diunduh sebagai **Excel**.
- **Tanpa kamera/mikrofon/AI proctoring.** Pengawasan memakai deteksi peramban + pengawas ruang.
- Fitur CBT mengikuti web referensi: 4 tipe soal (PG, PG Kompleks, Kategori, Esai), berkas soal per jenis ujian, impor Word/Excel/Google Sheets + template, acak soal/opsi, acak N soal, token, batas pelanggaran per ujian, toleransi tombol Selesai, KKM per kelas, tambah waktu, buka kunci dengan kompensasi, reset peserta, koreksi esai (nama disembunyikan), ketuntasan klasikal, remedial, analisis butir. Ditambah dari PRD/desain: tindakan Kunci/Kumpul otomatis, KKM per ujian, **Selesaikan oleh admin** (per siswa & semua sekaligus, opsional tutup ujian), **Buka Semua yang Terkunci**, analisis daya beda & reliabilitas.
- **Kunci layar hanya dibuka admin** dari Monitoring (v1.1: PIN/kode pengawas dihapus atas permintaan sekolah).

---

## 11. Hasil pengujian sebelum diserahkan

- **Uji backend (simulator Apps Script): 194 pemeriksaan lulus, 0 gagal** — login NIS/NISN (nol di depan aman), token, kunci jawaban tidak pernah terkirim ke siswa, sinkron & dedupe pelanggaran, terkunci → hanya admin yang bisa membuka (siswa ditolak), buka semua, selesaikan per siswa & semua + tutup ujian, jawaban susulan setelah diselesaikan, kumpul otomatis, login ganda, penilaian parsial PG kompleks & kategori, koreksi esai, analisis butir, impor siswa & soal, finalisasi lewat batas waktu, pengaturan, proteksi akun admin.
- **Uji beban 400 siswa: 0 gagal, 0 antrean kunci gagal.**
- **Uji peramban (Chrome, desktop + HP 390 px): 83 pemeriksaan lulus, 0 galat JavaScript** — alur admin lengkap, impor Word & Excel termasuk gambar, ujian siswa sampai terkunci → admin **Buka kunci** → layar siswa terbuka sendiri → kumpul → hasil, admin **Selesaikan** 1 siswa (HP siswa otomatis pindah ke hasil), **Selesaikan Semua + tutup ujian**, login ganda ditolak, laporan & ekspor.
- **Audit tampilan HP (lebar 390 px): 43 halaman & keadaan** (semua halaman siswa, 4 tipe soal, peringatan, layar terkunci, hasil, dan semua halaman admin) — **0 elemen meluap keluar layar**, 0 galat JavaScript.
- Diuji di simulator; uji coba nyata (gladi bersih 1 kelas → 1 angkatan) tetap disarankan sebelum PAS.

---

## 12. Pembaruan v1.1 — cara memasang di aplikasi yang sudah berjalan

**Yang berubah**
1. **Tampilan HP dirapikan**: halaman Profil, kartu ujian, halaman konfirmasi & token, hasil ujian, semua tabel admin/siswa berubah menjadi kartu bertumpuk di HP, jendela dialog muncul dari bawah layar, tombol tidak lagi terpotong.
2. **Layar terkunci tanpa kode pengawas** — hanya bisa dibuka admin dari **Monitoring Langsung** (tombol **Buka kunci** per siswa atau **Buka Semua yang Terkunci**). Layar siswa terbuka sendiri.
3. **Selesaikan oleh admin** — per siswa (tombol **Selesaikan** di baris siswa) atau semua sekaligus (**Aksi Cepat → Selesaikan**, opsional tutup ujian).

**Data aman:** tidak ada sheet/kolom yang berubah; ujian, soal, siswa, dan nilai tetap.

**Backend (3 berkas berubah: `Kode.gs`, `Ujian.gs`, `Setup.gs`)**
1. Buka proyek Apps Script → untuk masing-masing dari 3 berkas: hapus seluruh isinya → tempel isi baru → **Simpan**.
2. **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan.** (Jangan "Deployment baru".)

**Frontend**
1. Ekstrak `nextest-frontend.zip` ke folder sementara.
2. Salin semua isinya ke folder repo Anda (folder yang berisi `index.html`) dan pilih **Ganti/Replace** — **KECUALI `js/config.js`**: jangan ditimpa, karena berkas itu berisi alamat `/exec` milik Anda. (Kalau terlanjur tertimpa, isi lagi alamat `/exec` seperti langkah B1.)
3. Di terminal, dari folder repo:
```
git add .
git commit -m "NEXTEST v1.1: tampilan HP, buka kunci & selesaikan oleh admin"
git push
```
4. Tunggu 1–2 menit → buka situs → **Ctrl+Shift+R** (di HP: tutup tab lalu buka lagi). Versi baru terlihat di kiri bawah panel: **v1.1.0**.

> Lakukan pembaruan **di luar jam ujian**. Siswa yang sedang mengerjakan saat backend diperbarui tetap aman (jawaban tersimpan di perangkat), tetapi sebaiknya tidak dilakukan bersamaan.

