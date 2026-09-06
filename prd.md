PRODUCT REQUIREMENTS DOCUMENT (PRD)

Nama Proyek: Sistem Manajemen Transaksi Internal Photography & Videography

Project Lead: Firman

Versi Dokumen: 1.0 (Final)

Tanggal: 6 September 2026

1. Latar Belakang & Tujuan

Perusahaan membutuhkan sistem pencatatan transaksi terpusat dan tertutup (hanya untuk internal) berbentuk Single Page Application (SPA). Sistem ini bertujuan untuk mendigitalisasi pencatatan pesanan Wedding dan Studio, memisahkan data secara otomatis, memantau pergerakan bisnis melalui dashboard visual, dan merapikan alur kas (cash flow) serta operasional vendor.

2. Target Pengguna

Admin Operasional: Melakukan input pesanan, memperbarui status pekerjaan, dan mengelola pembayaran.

Manajemen / Pemilik: Memantau performa penjualan, mengevaluasi tren melalui grafik, dan menarik data laporan harian/mingguan.

3. Arsitektur Teknologi (Tech Stack)

Frontend: React.js dikonfigurasi menggunakan Vite.js untuk performa aplikasi dan loading halaman yang sangat cepat.

Backend: Node.js dipadukan dengan Express.js untuk melayani RESTful API.

Database: PostgreSQL atau MySQL (Relasional), agar integritas relasi antara data klien, master produk, dan log transaksi tetap solid.

Autentikasi: JWT (JSON Web Tokens) untuk menjaga keamanan rute internal aplikasi.

4. Ruang Lingkup Sistem & Navigasi (Sitemap)

Login Page (Gerbang akses internal)

Dashboard (Analitik & Ringkasan)

Input Transaksi (Form pembuatan data pesanan baru)

Data Wedding (Tabel khusus klien Wedding)

Data Studio (Tabel khusus klien Studio)

Master Data (Pengaturan Harga & Produk - Akses Terbatas)

5. Kebutuhan Fungsional Utama

5.1. Dashboard Analitik

Summary Cards: Menampilkan angka Total Transaksi, Total Pendapatan, dan Piutang Berjalan.

Pie Chart: Memvisualisasikan perbandingan persentase antara kategori Wedding dan Studio.

Kurva Penjualan: Grafik garis (Line Chart) untuk melihat tren fluktuasi pesanan berdasar bulan atau minggu.

5.2. Form Input Transaksi

Admin mengisi formulir dengan rincian berikut:

Kategori: Dropdown (Wedding atau Studio - Menentukan masuk ke sub-page mana data ini nantinya).

Nama Klien: Teks input.

Tanggal Booking: Date picker.

Tanggal Hari H: Date picker.

Nama Vendor: Teks input (atau dropdown list tim fotografer/videografer).

Pilihan Produk: Dropdown list (Terhubung ke Master Data).

Harga Produk: Auto-fill (Terisi otomatis saat produk dipilih).

Status Pembayaran: Dropdown (Belum Bayar, DP, Lunas).

Status Pekerjaan: Dropdown (Menunggu Hari H, Proses Editing, Selesai).

5.3. Sub-Page Data (Wedding & Studio)

Pemisahan Otomatis: Data yang masuk akan langsung di-routing ke halaman tabel Wedding atau Studio sesuai input kategori.

Fitur Tabel: Pencarian (Search) berdasarkan Nama Klien, dan Pengurutan (Sort) berdasarkan Tanggal Hari H terdekat.

Fitur Ekspor & Pelaporan: Ekspor baris data ke format CSV/Excel untuk memfasilitasi pembuatan laporan End of Day (EOD) secara berkala. Struktur kolom hasil ekspor akan disesuaikan agar mudah diintegrasikan ke tabel database di Lark Base maupun sinkronisasi Google Docs, khususnya untuk mendukung manajemen tugas mingguan dengan format seperti TAL LIST.

5.4. Master Data (Admin Only)

Antarmuka tersembunyi (Settings/Master Data) untuk menambah, mengubah, atau menghapus Pilihan Produk beserta harganya tanpa perlu mengubah kode sumber.

6. Struktur Database (Entity Relationship Draft)

Users: id, username, password_hash, role (Admin/Manajemen).

Products: id, category (Wedding/Studio), product_name, price, is_active.

Transactions: id, category, client_name, booking_date, d_day_date, vendor_name, product_id (Relasi ke Products), total_price, payment_status, work_status, created_at.

7. Kebutuhan Non-Fungsional

Keamanan: Menerapkan otorisasi pada route API di Express.js agar titik akhir (endpoints) tidak bisa ditembus oleh pihak eksternal.

Performa SPA: React Router menangani transisi halaman klien secara seamless tanpa reload halaman, memberikan pengalaman seperti aplikasi desktop.

Responsivitas: UI harus fleksibel (mobile-friendly) menggunakan framework CSS (seperti Tailwind) agar nyaman diakses via ponsel pintar, tablet, maupun layar studio.