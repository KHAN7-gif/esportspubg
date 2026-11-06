# Portal tournament Cloudflare D1

Portal baharu: `/` atau `/tournaments.html` (awam), `/admin.html` (admin). Halaman legacy kekal dan masih menggunakan Firebase; data legacy tidak dipindahkan secara automatik. Gunakan portal baharu untuk D1. Mata adalah jumlah terkumpul yang dimasukkan admin, bukan pengiraan per perlawanan. Jika mata sama, kills tertinggi kemudian nama menentukan urutan; tambah peraturan rasmi jika diperlukan. Penyuntingan serentak menggunakan simpanan terakhir.

## Aktifkan dalam akaun Cloudflare

1. `npm ci` dan `npm test`.
2. `npx wrangler login` pada komputer yang mempunyai akses akaun Cloudflare.
3. `npx wrangler d1 create maida-tournaments`. Salin database ID ke `d1_databases[0].database_id` dalam `wrangler.jsonc`.
4. Isi `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` dan `ADMIN_EMAILS` (senarai e-mel admin dipisahkan koma) dalam `vars`. E-mel admin disemak daripada JWT Access yang disahkan, bukan input pengguna.
5. Tambah custom domain ke `routes`, contoh `[{"pattern":"pubg.example.com","custom_domain":true}]`. Gantikan dengan domain sebenar. workers.dev dan preview kekal dimatikan.
6. Dalam Zero Trust, cipta aplikasi Access pada `/admin.html` dan `/api/admin/*`. Gunakan polisi Allow untuk e-mel admin. Lindungi halaman legacy, `/api/auth/*` dan aset legacy mengikut CLOUDFLARE_LOGIN.md. Jangan lindungi seluruh domain dengan login jika portal awam perlu terbuka. Worker tetap mengesahkan JWT untuk semua laluan kecuali empat aset portal awam dan GET API awam. Jangan gunakan polisi Bypass pada API admin.
7. `npx wrangler d1 migrations apply maida-tournaments --remote` kemudian `npm run deploy:cloudflare`.
8. Uji incognito: portal awam dibuka tanpa login; draf tersembunyi; halaman admin meminta login; e-mel yang tiada dalam ADMIN_EMAILS ditolak API; cipta dua tournament dan pastikan mata tidak bercampur; reload dan semak data kekal.

Worker hanya mendedahkan nama/status tournament yang diterbitkan dan nama/mata pasukan melalui API awam. Semua perubahan menggunakan API admin, semakan Origin dan D1 prepared statements. Simpanan pasukan dan metadata dilakukan dalam satu transaksi D1 batch. Portal tidak menyimpan token di localStorage.

## Sambungan GitHub

Dalam Workers & Pages, import repositori ini melalui Workers Builds. Build: `npm run build:cloudflare`. Deploy: `npx wrangler deploy`. Pastikan binding D1, migrations dan tetapan Access di atas lengkap sebelum mengaktifkan deployment. Jangan letakkan token Cloudflare dalam kod atau chat.

Arahan ini memerlukan konfigurasi akaun sebenar. Kod sahaja tidak mencipta database, DNS atau polisi Access. Database baru bermula kosong. Eksport dan semak data Firebase sebelum merancang migrasi berasingan. Halaman OBS dan modul legacy belum disambungkan ke D1.
