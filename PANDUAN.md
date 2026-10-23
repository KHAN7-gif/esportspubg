# 🏆 MAIDA ESPORTS — Tournament Management System

Sistem pengurusan tournament **PUBG Mobile** berasaskan web. Satu platform untuk urus data perlawanan, kira mata (standing), dan hasilkan **overlay siaran langsung (OBS)** secara automatik.

- **Teknologi:** HTML · CSS · JavaScript (tiada backend)
- **Hosting:** GitHub Pages (statik)
- **Sync:** localStorage + Firebase Realtime Database
- **Resolusi overlay:** 1920 × 1080 (OBS ready)

---

## 📋 Ringkasan

**Standing Point** ialah *master data* (sumber kebenaran tunggal). Semua placement & kill dimasukkan di sini, kemudian di-**LOCK** setiap map. Data yang disahkan mengalir automatik ke **Leaderboard** dan semua **overlay OBS**. Penonton lihat keputusan melalui **Public Results**.

> **Konsep:** 1 sumber (Standing Point) → banyak paparan (Leaderboard + Overlay + Public). Kemas kini sekali, semua ikut.

---

## 🧩 Modul Utama

| Modul | Jenis | Fail | Fungsi |
|---|---|---|---|
| Standing Point | MASTER | `Standing_Point_v2.html` | Master data · Map · Overall · Stats · Overlay |
| Leaderboard | LIVE | `leaderboard_FINAL.html` | Dashboard kawalan match langsung |
| Popup Kill | OBS | `popup_kill_FINAL.html` | Popup auto kill/eliminated/WWCD (green-screen) |
| OBS Live Leaderboard | OBS | `leaderboard_FINAL.html#obs` | Ranking langsung (Browser Source ~500×900) |
| Overall / Map Standing | OBS | `Standing_Point_v2.html#medsos` | Overlay landscape 1920×1080 (featured #1 + senarai) |
| WWCD | LIVE | `wwcd_overlay.html` | Overlay Winner Winner Chicken Dinner |
| Public Results | PUBLIC | `public_results.html` | Keputusan view-only untuk peminat |
| Home / Login | HUB | `index.html` | Landing hub + login + pengurusan crew |

---

## 📊 Tab Standing Point

- **STANDING** — Map Standing (susun placement, isi kill, **LOCK/UNLOCK**) & Overall Standing (kumulatif map locked). **PRINT SEMUA** = cetak map + overall sekali gus.
- **HAVOR** — Statistik: teams, maps locked, total kills, WWCD, top score, best kill, Kill MVP, avg/map + Kill Leaderboard + WWCD & Placement.
- **MEDSOS** — Overlay OBS (Overall / Map Standing) 1920×1080. Pilih **PAPAR: OVERALL / map tertentu** → **BUKA TAB BARU**.
- **SETTING** — Map Config, Team Management (logo & banner via URL, kad bernombor), Data Management (Save/Export/Import/Reset).

---

## 🎮 Aliran Kerja Crew

| Fasa | Crew | Tindakan |
|---|---|---|
| Sebelum event | Crew 1 | SETTING → daftar pasukan (nama, logo, banner) & setup Map Config |
| Semasa game | **Crew 2** | Leaderboard → kemas kini ELIMS (1 kill = +1 ELIMS & +1 PTS) & status alive |
| Selepas game | **Crew 1** | STANDING → susun placement, isi kill, **LOCK** → auto-sync semua |
| Game baharu | **Crew 2** | Leaderboard → **RESET** (ELIMS = 0, PTS kekal). Ulang. |
| Siaran | — | Overlay auto-update setiap 2 saat |

---

## 🖥 Cara Setup OBS

1. Buka modul overlay dari Home → tekan **BUKA TAB BARU**.
2. OBS → **Add** → **Window Capture** (atau Browser Source) → pilih tetingkap.
3. Overlay standing = **1920×1080**. Popup Kill = green-screen → guna filter **Chroma Key**.
4. Semua auto-update **2 saat**.

---

## 🏆 Sistem Mata

| Istilah | Maksud |
|---|---|
| **RANK** (Place) | Mata kedudukan: `10·6·5·4·3·2·1·1` (#1–#8), 0 selepas itu |
| **ELIM** (Kill) | Jumlah bunuh |
| **TOTAL** | RANK + ELIM |
| **WWCD** | Bilangan #1 (Chicken Dinner) |

---

## 🔗 Data & Sync (localStorage / Firebase)

| Kunci | Fungsi |
|---|---|
| `hswp_2026_pro` | Master Standing Point (teams, maps, kill, currentMap, title) |
| `maida_v5` | State Leaderboard live |
| `medsos_view` | Pilihan overlay MEDSOS (`overall` / nama map) |
| `maida_crew_v1` | Senarai profil crew (Home) |
| `maida_login_user` | Username sesi tab; kata laluan tidak disimpan |
| Firebase `maida/spData` | Standing Point → modul lain |
| Firebase `maida/liveData` | Leaderboard → overlay |

**Model data team:** `{ name, fullName, logo, banner }`
**Model map:** `{ locked, order:[...nama ikut placement], kill:{nama:jumlah} }`

---

## 🚀 Deployment

1. Letak semua fail dalam satu folder repo GitHub.
2. Aktifkan **GitHub Pages** (Settings → Pages → branch `main`).
3. Bila kemas kini: muat naik / ganti fail → refresh sumber OBS.
4. 100% statik — tiada pelayan/backend.

**Cadangan saiz imej:**
- Logo team: **256 × 256** (PNG latar telus)
- Banner / foto team: **600 × 800** (potret) — untuk kad #1 featured overlay

---

## 👥 Login Crew (username & kata laluan)

Home kini responsif untuk desktop, tablet dan telefon. Grid modul menggunakan empat, dua atau satu lajur mengikut ruang yang tersedia.

- Login di Home memerlukan username dan kata laluan Firebase Authentication. Kata laluan tidak disimpan dalam localStorage atau sessionStorage.
- Aktifkan kaedah **Email/Password** di Firebase Authentication. Dalam `firebase_auth.js`, isi `FIREBASE_AUTH_API_KEY` menggunakan Web API Key Firebase projek. Setiap username dipetakan kepada alamat `username@maidaesports.com`; cipta akaun Firebase dengan alamat itu dan tetapkan kata laluan melalui Firebase Console.
- Username hanya boleh mengandungi huruf, nombor, titik, sempang atau garis bawah. Nama profil crew yang sepadan digunakan sebagai label paparan; akaun Auth perlu diwujudkan secara berasingan.
- `login.html` menghala ke borang login Home yang sama. Sesi login dipegang untuk tab semasa dan perlu login semula selepas muat semula.
- **Tambah** profil label tugasan menggunakan nama unik (1–48 aksara) dan peranan Admin/Crew. Senarai dikongsi melalui Firebase `maida/crewProfiles`, dengan semakan setiap lima saat. Buat akaun Firebase Authentication berasingan untuk setiap pengguna.
- Gunakan **Log Keluar** untuk menamatkan sesi tab semasa.
- Tambah, buang dan reset memerlukan akses Firebase. Jika simpanan gagal, mesej ralat dipaparkan dan perubahan tidak dianggap berjaya. Semakan ETag mengulang perubahan apabila pengguna lain menyimpan serentak, tanpa menimpa senarai lama secara senyap.
- Profil admin utama `c1` dilindungi daripada butang buang. **Reset default** membuang semua profil tambahan pada semua peranti dan meminta pengesahan.
- Senarai profil crew hanya untuk label paparan; ia tidak mencipta akaun atau kata laluan Firebase.

**Batasan keselamatan:** login mengesahkan akaun dengan Firebase Authentication, tetapi Admin/Crew masih label tugasan dan bukan kebenaran keselamatan. Login Home sahaja tidak menyekat akses terus ke halaman modul atau melindungi database; tetapkan Firebase Realtime Database rules berasaskan `auth` sebelum menggunakannya untuk data rasmi. Jangan buka public write. Rules dan akaun sebenar belum diuji pada database live.


---

## 🗂 Senarai Fail

| Fail | Keterangan |
|---|---|
| `index.html` | Home hub + login + crew |
| `Standing_Point_v2.html` | Master (4 tab) |
| `leaderboard_FINAL.html` | Leaderboard live (+ `#obs`) |
| `popup_kill_FINAL.html` | Overlay popup kill |
| `wwcd_overlay.html` | Overlay WWCD |
| `public_results.html` | Keputusan awam |
| `firebase_sync.js` | Sync Firebase |
| `about.html` | Halaman rujukan (About/Panduan) |
| `icon-192.png` / `icon-512.png` | Ikon app |

---

© 2026 **MAIDA ESPORTS** — Tournament Management System · PUBG Mobile
