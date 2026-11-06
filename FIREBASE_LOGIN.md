# Login admin Firebase

Pembaikan ini hanya mengubah kod GitHub; tiada deployment dan tiada perubahan kepada akaun atau data Firebase/Cloudflare.

Web API Key projek telah dimasukkan. Semakan langsung endpoint konfigurasi Firebase memulangkan CONFIGURATION_NOT_FOUND; selesaikan persediaan Authentication dalam konsol sebelum menguji akaun.

## Aktifkan login sebenar

1. Buka https://console.firebase.google.com/project/maida-esports-ca555/settings/general . Pastikan projek ini sepadan dengan database sedia ada.
2. Di Your apps, pilih aplikasi Web (atau daftarkan aplikasi Web jika belum ada). Salin nilai `apiKey` daripada SDK configuration ke `FIREBASE_AUTH_API_KEY` pada firebase_auth.js. Web API Key ialah konfigurasi aplikasi awam; jangan masukkan service-account private key.
3. Di Authentication → Sign-in method, aktifkan Email/Password.
4. Di Authentication → Users, pastikan akaun `apengtakahashi@gmail.com` wujud dan menggunakan Email/Password. Cipta akaun melalui konsol atau gunakan reset password jika perlu. Akaun Google Cloudflare tidak mencipta pengguna Firebase secara automatik. Jangan hantar kata laluan dalam chat atau commit.
5. Login menggunakan e-mel penuh dan kata laluan Firebase akaun itu. Username lama masih dipetakan kepada username@maidaesports.com; akaun tersebut mesti benar-benar wujud dalam Firebase.

## Tingkah laku sesi

Token disimpan dalam sessionStorage tab semasa supaya reload boleh memulihkan sesi. Kata laluan dan refresh token tidak disimpan. Token tamat selepas tempoh yang diberi Firebase; login semula diperlukan. Reload mengesahkan token melalui accounts:lookup. Jika browser menyekat storage, login masih boleh digunakan dalam memori hingga reload.

Log keluar membuang sesi tab ini. Ia tidak membatalkan semua sesi akaun pada peranti lain. Ralat sambungan atau sesi tidak sah mengunci semula Home. Mengisi nama melalui sessionStorage sahaja tidak membuka Home.

## Batas akses

Firebase Authentication mengesahkan pengguna, bukan peranan admin. Profil crew atau perkataan Admin pada UI bukan kebenaran server. Gunakan Firebase Database Rules dan admin claims/allowlist pada backend untuk mengawal data. Pembaikan Home ini tidak memasang perlindungan server pada semua fail HTML statik atau mengubah rules database. Modul data legacy masih menggunakan API Firebase sedia ada; jangan anggap data telah dilindungi hanya kerana login Home berjaya.

Panel admin D1 dalam branch Cloudflare ialah aliran berasingan yang memerlukan Worker. Pembaikan Firebase ini tidak menukar panel itu menjadi aplikasi Firebase.

## Semakan

Uji e-mel penuh dan username lama, password salah, reload, logout, sesi tamat, token ditolak, internet gagal dan storage disekat. Selepas konfigurasi sebenar lengkap, semak akses data menggunakan rules yang sesuai sebelum menerbitkan sistem admin.
