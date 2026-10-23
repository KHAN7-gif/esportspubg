# Audit webapp MAIDA ESPORTS PUBG

Tarikh: 23 Oktober 2026. Asas semakan: `main` pada `b1490c1`.

## Skop dan hasil

Semakan sumber meliputi semua 12 halaman HTML, modul Firebase dan panduan. Aplikasi mempunyai aliran yang berguna: Standing Point sebagai master, kawalan live, keputusan awam dan overlay OBS. Namun ia belum mempunyai kawalan akses sebenar untuk operasi kejohanan rasmi.

| Bahagian | Penemuan | Status |
|---|---|---|
| Firebase | Bacaan gagal memanggil callback dengan null, menyerupai database kosong | Dibaiki: kegagalan melalui callback ralat sahaja; paparan terakhir dikekalkan |
| Firebase | Polling boleh bertindih; respons lama boleh tiba selepas unlisten | Dibaiki: permintaan berurutan dan respons listener yang dihentikan diabaikan |
| Firebase | Pemeriksaan sambungan menggunakan PUT `maida_ping` | Dibaiki: GET cetek pada `maida`; status ini menguji akses baca sahaja |
| Firebase | Status sihat tidak dikosongkan apabila tulis/baca gagal | Dibaiki |
| Backup | Database null boleh memulihkan backup lama | Dibaiki: fallback hanya apabila bacaan gagal |
| Dashboard | `maidaTournamentV4`, `rows`, `teamId` tidak sepadan dengan master `hswp_2026_pro`, `order`, `kill` | Dibaiki untuk statistik, pendahulu dan stor tajuk tempatan |
| Dashboard | Nilai 0 pemain/pasukan hidup diganti dengan jumlah pasukan | Dibaiki menggunakan snapshot `_liveMatch` |
| Keputusan awam | Nama pasukan, label map dan URL logo dimasukkan terus dalam HTML | Dibaiki escaping pada medan tersebut; bukan audit XSS lengkap seluruh aplikasi |
| Hub | Pautan GitHub menuju repositori lain | Dibaiki |

## Isu yang masih perlu ditangani

| Keutamaan | Isu dan bukti sumber | Tindakan seterusnya |
|---|---|---|
| Kritikal | Login Home kini mengesahkan username/password melalui Firebase Authentication, tetapi modul masih boleh dibuka terus dan RTDB rules belum menguatkuasakan identiti/peranan. API key projek juga belum dikonfigurasi. | Isi Web API Key dan sediakan akaun Firebase Auth. Sebelum data rasmi, lindungi RTDB dengan rules auth/role dan autentikasi semua modul yang menulis data. Jangan gantikan dengan kata laluan hardcoded. |
| Kritikal | `fsSet` membuat PUT tanpa token. Rules semasa tidak boleh ditentukan daripada repositori; komen asal mencadangkan public write. | Semak rules sebenar dalam Firebase Console. Sediakan auth/token terlebih dahulu sebelum menutup akses tulis supaya operasi crew tidak terputus. Konfigurasi Firebase bukan kata laluan; rules menentukan akses. |
| Tinggi | Standing Point memuat naik data tempatan apabila cloud tiada teams; PUT menulis seluruh snapshot. Tetingkap/peranti serentak masih boleh menimpa perubahan. | Buang auto-seed untuk data kosong; tambah inisialisasi manual, versi data dan conditional write/transaction. Tetapkan pemilik perubahan bagi setiap modul. |
| Tinggi | Beberapa template di Leaderboard, Popup Kill, OBS Combo dan dashboard menggabungkan nama/logo/path terus dalam `innerHTML`. | Gunakan textContent/DOM APIs, hadkan URL kepada protokol yang dibenarkan dan audit semua atribut/event handlers. |
| Tinggi | Import Standing Point menggantikan `state` selepas JSON.parse tanpa pengesahan struktur. | Sahkan teams/maps/order/kill, nama unik, integer tidak negatif dan had saiz sebelum menyimpan; simpan backup sebelum import. |
| Sederhana | Logo data URL ditapis semasa sync dan banner tidak disertakan dalam beberapa payload. | Simpan imej dalam storan bersama dan gunakan URL yang stabil agar peranti OBS lain menerima aset yang sama. |
| Sederhana | Cache keputusan awam mengabaikan roster kosong/null; masa kemas kini ialah masa render, bukan masa data diterima. | Bezakan offline, kosong dan dikemas kini; paparkan timestamp payload dan buang cache selepas reset yang disahkan. |
| Sederhana | Halaman dan overlay menggandakan pengiraan mata/rendering; tiada CI atau konfigurasi pakej. | Ekstrak modul kiraan bersama, tambah ujian mata/tiebreak dan jalankan ujian dalam CI. |
| Sederhana | Terdapat ikon tetapi tiada manifest/service worker dalam repositori. | Jika pemasangan PWA diperlukan, tambah manifest dan strategi cache yang tidak membekukan skor live. |
| Rendah | Dua halaman hub/login dengan susunan berbeza; pautan OBS tempatan menyebut server/batch yang tidak disertakan. | Pilih satu aliran hub rasmi, sediakan panduan OBS untuk GitHub Pages dan uji ukuran Browser Source. |

## Cadangan UI dan operasi

- Kekalkan tema MAIDA dan bezakan laluan **Public Results**, **Crew Control** dan **OBS Overlay** dengan jelas.
- Paparkan status sambungan serta masa data cloud diterima, termasuk keadaan offline dan penyimpanan gagal.
- Tambah ringkasan perlawanan aktif: map, pasukan hidup, jumlah eliminasi dan status lock.
- Semak susunan mudah alih, fokus keyboard, label borang, kontras warna dan dialog reset/import.

## Pengesahan dan batasan

`node --test tests/*.test.cjs`: 10 ujian lulus. Termasuk ralat rangkaian/403, null cloud, backup, status baca sahaja, polling/unlisten, pemulihan sambungan, statistik dashboard, escaping keputusan awam dan syntax semua inline scripts. `git diff --check` lulus.

Ujian Firebase menggunakan mock dan tidak menyentuh database kejohanan sebenar. Semakan browser visual dicuba tetapi tidak dapat dilaksanakan kerana executable Chromium Playwright tiada. Tiada pengesahan visual/mobile, Firebase rules, akaun sebenar, aliran OBS atau ujian hujung ke hujung pada laman live. Pembaikan ini disediakan dalam branch/PR; ia belum diterapkan pada `main` atau laman live.

## Susulan Home dan multi-user (23 Oktober 2026)

Home kini meminta username/password dan memanggil Firebase Authentication REST API; username dipetakan kepada `username@maidaesports.com`. API key sengaja belum diisi dalam repo. `login.html` menghala ke Home. Senarai profil cloud dan semakan ETag kekal untuk label crew; profil bukan akaun Auth. Label Admin/Crew masih bukan peranan keselamatan. Semua modul dan RTDB rules belum disahkan untuk kawalan akses.

Pengesahan terkini: 18 ujian lulus termasuk pertindihan perubahan profil, nama pendua, kegagalan akses, sesi tab berasingan, keluar daripada profil yang dibuang dan zero alive. Ujian menggunakan mock. Pemasangan Chromium dicuba tetapi muat turun gagal, jadi pemeriksaan layout pada skrin sebenar dan operasi cloud live belum disahkan.
