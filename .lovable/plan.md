# Bukti Pendaftaran PDF + Status di Akun Pendaftar

Setelah pendaftar masuk dan mengirim formulir, ia langsung mendapat bukti pendaftaran yang bisa diunduh sebagai PDF A4, dicetak, dan status pendaftarannya terlihat di akunnya.

## Yang akan dibuat

1. **Langsung ke bukti pendaftaran setelah kirim**
   - Setelah tombol "Kirim Pendaftaran" berhasil, pendaftar diarahkan ke halaman Kartu/Bukti Pendaftaran (bukan ke dashboard), dengan pesan sukses.
   - Di halaman itu ada tautan kembali ke dashboard.

2. **Unduh PDF A4**
   - Tombol "Unduh PDF" di halaman bukti pendaftaran, di samping tombol cetak yang sudah ada.
   - PDF dibuat dari tampilan kartu, ukuran A4 potret, nama berkas memakai nomor pendaftaran (misal `Bukti-Pendaftaran-2026-0001.pdf`).
   - Tombol cetak A4 yang sudah ada tetap dipertahankan.

3. **Isi bukti pendaftaran dilengkapi**
   - Selain data yang sudah tampil (nomor pendaftaran, nama, NISN, tempat/tanggal lahir, sekolah asal, pilihan jurusan, orang tua, waktu kirim, kode QR), ditambahkan baris status berkas terkini dan tanggal cetak.

4. **Status di akun pendaftar**
   - Kartu ringkas status di dashboard diberi tombol "Unduh Bukti (PDF)" agar bisa diambil ulang kapan saja.
   - Status mengikuti alur yang sudah ada: Menunggu Verifikasi, Terverifikasi, Perlu Perbaikan, Diterima, Tidak Diterima, Daftar Ulang Selesai.

## Catatan teknis

- Halaman: `src/routes/_authenticated/kartu.tsx` (tambah tombol unduh PDF + baris status/tanggal cetak), `src/routes/pendaftaran.tsx` (arahkan ke `/kartu` setelah kirim), `src/routes/_authenticated/dashboard.tsx` (tautan unduh bukti).
- PDF dibuat di sisi browser dengan `html2canvas` + `jspdf` (render elemen `.kartu-a4` ke satu halaman A4). Kedua paket ditambahkan sebagai dependensi.
- Tidak ada perubahan database, aturan akses, maupun penyimpanan berkas.
