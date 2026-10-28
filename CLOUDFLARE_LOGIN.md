# Login rasmi melalui Cloudflare Access

Kod sedia untuk Cloudflare Workers + Static Assets. Ia belum dideploy atau diaktifkan dalam akaun Cloudflare. GitHub Pages kekal menggunakan profil kolaborasi sehingga aplikasi dipindahkan ke domain Cloudflare.

## Hasil selepas pengaktifan

Pengguna membuka domain aplikasi → Cloudflare Access meminta login e-mel/OTP atau identity provider yang dipilih → Worker mengesahkan signature JWT, issuer, audience dan expiry → Home terus memaparkan e-mel yang disahkan. Tiada pemilih profil untuk menyamar sebagai admin. Logout menggunakan `/cdn-cgi/access/logout`.

Semua halaman dan aset pada deployment Worker ini memerlukan sesi Access, termasuk Public Results dan OBS. Ini bermakna sumber OBS perlu mempunyai sesi login yang sah dan mungkin perlu login semula selepas tamat sesi. Uji aliran ini sebelum siaran. Jika Public Results mesti terbuka kepada penonton, gunakan deployment awam berasingan yang hanya mempunyai paparan baca dan jangan gunakan polisi Bypass pada aplikasi crew.

## Tetapan yang diperlukan

| Tetapan | Contoh (bukan nilai sebenar) | Tempat |
|---|---|---|
| Domain aplikasi | `pubg.example.com` | Domain dalam akaun Cloudflare |
| Team domain | `https://nama-team.cloudflareaccess.com` | Cloudflare Zero Trust |
| Application AUD | Audience tag aplikasi Access | Konfigurasi aplikasi Access |
| E-mel dibenarkan | E-mel admin dan crew sebenar | Polisi Allow dalam Access |

Team domain dan AUD bukan kata laluan. Jangan letakkan Cloudflare API token atau kata laluan dalam repositori/chat.

## Pengaktifan

1. Dalam Cloudflare, aktifkan Zero Trust. Tambah kaedah login **One-time PIN** atau identity provider yang dikehendaki.
2. Di **Access controls → Applications**, tambah aplikasi self-hosted untuk domain aplikasi. Lindungi seluruh hostname, bukan Home sahaja. Tambah polisi Allow untuk e-mel admin/crew yang diluluskan; jangan gunakan Everyone/Bypass.
3. Salin Team domain dan Application Audience (AUD) ke `vars.ACCESS_TEAM_DOMAIN` dan `vars.ACCESS_AUD` dalam `wrangler.jsonc`.
4. Tambah route custom domain ke `wrangler.jsonc`, contohnya:

   ```json
   "routes": [{ "pattern": "pubg.example.com", "custom_domain": true }]
   ```

   Gantikan contoh dengan domain sebenar yang berada dalam akaun Cloudflare anda. `workers_dev` dan preview URLs dimatikan supaya tidak menyediakan hostname alternatif yang tidak dilindungi.
5. Pada komputer yang mempunyai akses akaun Cloudflare, jalankan:

   ```sh
   npm ci
   npm test
   npx wrangler login
   npm run deploy:cloudflare
   ```

   Untuk Workers Builds melalui GitHub: pilih repo ini, build command `npm run build:cloudflare`, deploy command `npx wrangler deploy`, dan tetapkan konfigurasi/domain Access seperti di atas. Tiada konfigurasi akaun, DNS atau polisi dibuat secara automatik oleh kod ini.
6. Uji menggunakan incognito: e-mel yang dibenarkan boleh masuk, e-mel lain ditolak, pautan terus Standing Point juga meminta login, Home memaparkan e-mel yang betul, logout menamatkan sesi. Semak akses pada telefon dan mesin OBS.

## Batas keselamatan dan migrasi

- Worker menolak akses dengan 503 jika Team domain/AUD belum diisi, dan 401 jika JWT tidak sah. Header e-mel sahaja tidak dipercayai. `run_worker_first: true` memastikan aset tidak dipulangkan sebelum verifikasi.
- Cloudflare Access mengawal akses laman pada domain Worker. Ia **tidak** menukar Firebase rules. Semua modul masih mengakses Firebase secara terus. Jika rules membenarkan public write, orang luar masih boleh menulis terus walaupun laman crew mempunyai login. Perlu migrasi rules/auth atau gateway data tersendiri sebelum mendakwa database dilindungi oleh login ini.
- Salinan admin di GitHub Pages masih boleh dibuka. Selepas deployment disahkan, tutup GitHub Pages atau gantikannya dengan halaman awam/redirect yang tidak memuatkan kawalan admin. Jangan anggap custom domain melindungi URL GitHub asal.
- Menambah nama crew dalam aplikasi lama tidak memberi akses Cloudflare. Pengguna rasmi ditambah/dibuang dalam polisi Access. Integrasi ini tidak mewujudkan peranan Admin/Crew berasingan; semua pengguna yang dibenarkan mempunyai akses ke aplikasi crew.
- Kod tidak menyimpan JWT dalam localStorage atau mendedahkannya melalui endpoint sesi. `/api/auth/session` hanya memulangkan e-mel dan masa tamat sesi, dengan cache dimatikan.
- Logout Cloudflare boleh menamatkan sesi Access pengguna merentas aplikasi, seperti tingkah laku Cloudflare yang didokumenkan.

## Pengesahan pembangunan

Ujian Node mengesahkan token bertandatangan RSA, penolakan token hilang/rosak/tamat, issuer/audience salah, akses terus aset ditolak dan cache sesi dimatikan. Build static assets dan Wrangler dry-run lulus. Tiada deployment, polisi Access, OTP sebenar atau Firebase rules live diuji/diubah.

## Rujukan rasmi

- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
