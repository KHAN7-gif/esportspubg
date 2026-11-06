# Aktifkan pubg.esukan.app

Kod ada pada PR #4, branch `feature/cloudflare-tournament-portal`. Belum live. Admin: apengtakahashi@gmail.com. Semua laluan memerlukan login admin.

## 1. Sambungkan domain

Log masuk https://dash.cloudflare.com/ dan pilih tambah domain sedia ada `esukan.app`. Pilih pelan yang sesuai. Semak rekod DNS yang diimport dengan rekod di penyedia semasa, termasuk rekod laman dan e-mel (MX, TXT, SPF, DKIM). Cloudflare akan memberi dua nameserver khusus akaun anda.

Di tempat esukan.app dibeli, tukar nameserver kepada dua nilai yang diberikan Cloudflare. Jika DNSSEC lama aktif, ikut aliran pemindahan Cloudflare untuk mengelakkan DS lama tidak sepadan. Tunggu status domain **Active**. Nilai nameserver tidak boleh direka atau disalin daripada akaun lain.

## 2. Database dan login

Pada komputer dengan repositori branch di atas:

```sh
npm ci
npx wrangler login
npx wrangler d1 create maida-tournaments
```

Salin database_id yang dipulangkan ke binding DB dalam wrangler.jsonc. Di Zero Trust, aktifkan login One-time PIN dan cipta aplikasi self-hosted untuk SELURUH `pubg.esukan.app`. Polisi Allow: hanya apengtakahashi@gmail.com. Salin team domain dan AUD ke ACCESS_TEAM_DOMAIN dan ACCESS_AUD. Jangan gunakan Bypass atau Everyone.

## 3. Uji dan deploy

```sh
npm run check:deployment
npm test
npx wrangler d1 migrations apply maida-tournaments --remote
npm run deploy:cloudflare
```

Custom domain sudah ditetapkan dalam wrangler.jsonc; Wrangler mengurus sambungan Worker dan domain semasa deploy apabila zone aktif dan akaun mempunyai akses. Jangan tambah rekod A dengan IP rekaan. Semak sebarang rekod pubg sedia ada sebelum mengubahnya.

Alternatif Workers Builds: pilih repo dan branch yang betul, build `npm run build:cloudflare`, deploy `npm run deploy:cloudflare`. Migrations tetap perlu dijalankan. Selepas PR digabungkan, gunakan main sebagai branch deployment.

## 4. Pengesahan sebelum tamatkan Firebase

Uji incognito: URL utama dan pautan terus semuanya memerlukan login; e-mel luar ditolak. Admin boleh mencipta dua tournament, simpan mata, reload dan semak data kekal berasingan. Portal D1 baharu bermula kosong. Uji juga peranti lain.

Eksport sandaran Firebase dahulu. Modul legacy dan OBS masih menggunakan Firebase: pemindahan modul serta import data perlu disiapkan dan disemak sebelum menutup akses Firebase. Jangan padam database lama ketika portal baharu belum disahkan. Tutup deployment admin GitHub Pages yang terbuka selepas penggantian disahkan.

Jangan hantar kata laluan, OTP atau API token dalam chat. Akses akaun Cloudflare dan penukaran nameserver perlu dilakukan melalui akaun pemilik.
