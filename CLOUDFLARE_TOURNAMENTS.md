# Sistem tournament untuk admin sahaja

Semua halaman, aset, API dan keputusan memerlukan JWT Cloudflare Access yang sah DAN e-mel dalam ADMIN_EMAILS. Tiada laluan awam. `/` menghala ke `/admin.html` selepas pengesahan. `/tournaments.html` ialah paparan keputusan dalaman admin. Penanda published hanya metadata dalaman dan tidak memberikan akses awam.

## Pengaktifan

1. Jalankan `npm ci` dan `npm test`.
2. Pada komputer dengan akses akaun Cloudflare: `npx wrangler login`.
3. Jalankan `npx wrangler d1 create maida-tournaments`. Isi database ID sebenar pada binding DB dalam wrangler.jsonc.
4. Isi ACCESS_TEAM_DOMAIN, ACCESS_AUD dan ADMIN_EMAILS (e-mel admin dipisahkan koma). Senarai kosong menolak semua pengguna.
5. Tambah custom domain sebenar pada routes. workers.dev dan preview URLs kekal dimatikan.
6. Dalam Zero Trust, lindungi SELURUH hostname dengan aplikasi Access dan polisi Allow untuk e-mel admin sahaja. Jangan gunakan Everyone atau Bypass.
7. Jalankan `npx wrangler d1 migrations apply maida-tournaments --remote`, kemudian `npm run deploy:cloudflare`.
8. Uji incognito: semua pautan meminta login, e-mel luar ditolak, admin boleh mencipta dua tournament dan reload data tanpa bercampur.

Workers Builds: import repositori GitHub, build `npm run build:cloudflare`, deploy `npx wrangler deploy`. Siapkan D1, migrations, domain dan Access dahulu. Jangan letakkan token dalam kod atau chat.

## Data dan batas semasa

Portal baharu menggunakan D1. Halaman legacy dan OBS masih menggunakan Firebase dan tidak dimigrasikan. Mata dimasukkan sebagai jumlah terkumpul; kedudukan mengikut total, kills kemudian nama. Penyuntingan serentak menggunakan simpanan terakhir. Simpanan metadata dan pasukan menggunakan transaksi D1 batch.

Cloudflare Access tidak mengubah Firebase rules. Semak rules Firebase secara berasingan; tutup GitHub Pages atau sebarang deployment admin lama yang terbuka selepas migrasi disahkan. Pengesahan admin pada Worker ini hanya melindungi deployment Cloudflare ini.

Kod tidak mencipta akaun, DNS, polisi Access atau database live secara automatik. Pengaktifan memerlukan akaun Cloudflare sebenar. CLOUDFLARE_LOGIN.md menerangkan JWT dan login legacy; panduan ini menetapkan skop admin sahaja bagi portal baharu.
