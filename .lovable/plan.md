# Formulir pendaftaran bisa langsung diisi

Tujuan: tombol "Mulai Pendaftaran" di halaman utama langsung membuka formulir yang bisa diisi siapa saja, tanpa harus masuk lebih dulu. Akun baru diminta saat pendaftar menekan tombol kirim.

## Yang berubah untuk pendaftar

1. Dari halaman utama, tombol "Mulai Pendaftaran" membuka halaman formulir yang terbuka untuk umum (tidak lagi dilempar ke halaman masuk).
2. Pendaftar mengisi langkah 1-4 (data calon murid, alamat, sekolah asal & orang tua, pilihan jurusan) tanpa akun. Isian tersimpan otomatis di perangkat, jadi tidak hilang kalau halaman tertutup.
3. Di ujung langkah 4 muncul tombol "Lanjut & Simpan". Jika belum punya akun, tampil ajakan daftar/masuk (email-kata sandi atau Google) di halaman yang sama alurnya; setelah berhasil, pendaftar kembali ke formulir dan seluruh isian tadi otomatis dipindahkan ke data pendaftaran miliknya.
4. Setelah punya akun, langkah 5 (unggah dokumen: KK, akta, rapor, pas foto) dan langkah 6 (ringkasan + kirim) berjalan seperti sekarang. Dokumen tetap wajib sebelum pendaftaran bisa dikirim.
5. Kalau pendaftar sudah masuk sejak awal, alurnya persis seperti sekarang: langsung tersimpan ke data pendaftarannya, tanpa perubahan.
6. Peringatan kecil di atas formulir saat belum masuk: "Isian tersimpan sementara di perangkat ini. Buat akun saat menyimpan agar tidak hilang."

## Catatan teknis

- Pindahkan `src/routes/_authenticated/pendaftaran.tsx` menjadi rute publik `src/routes/pendaftaran.tsx` (`ssr: false`) dengan judul/deskripsi halaman yang sama; hapus berkas lama agar tidak ada dua rute `/pendaftaran`.
- Komponen membaca sesi lewat `useAuth`. Tanpa sesi: state formulir disimpan/dibaca dari `localStorage` (kunci `spmb-draft`), tidak ada query/insert ke `registrations`; query `my-registration` tetap `enabled: !!user`.
- Validasi per langkah (zod/manual seperti sekarang) tetap jalan tanpa akun; langkah Dokumen & Ringkasan terkunci dan menampilkan ajakan masuk bila belum ada sesi.
- Saat sesi muncul (setelah daftar/masuk) dan ada draft lokal: ambil/buat baris `registrations` milik pengguna, `update` dengan isian draft hanya jika status masih `draft`, lalu hapus draft lokal dan lanjut ke langkah Dokumen.
- Ajakan masuk memakai halaman `/auth` yang ada, dengan parameter tujuan kembali ke `/pendaftaran` (validasi bahwa tujuan adalah path internal). Google memakai pemanggilan yang sudah dipakai proyek.
- Tautan `<Link to="/pendaftaran">` di beranda dan komponen lain tetap valid karena path tidak berubah; `AppHeader` tidak perlu diubah.
- Tidak ada perubahan basis data, kebijakan akses, maupun bucket dokumen.
