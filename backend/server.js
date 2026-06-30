const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. KONEKSI KE DATABASE MYSQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_upj'
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke database:', err.stack);
        return;
    }
    console.log('Berhasil terhubung ke database MySQL!');
});

// 2. KONFIGURASI MULTER (UNTUK UPLOAD FILE PDF)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Menyimpan file ke folder uploads
    },
    filename: (req, file, cb) => {
        // Menamai file unik berdasarkan waktu agar tidak bentrok
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Membuat folder 'uploads' bisa diakses oleh browser/frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ==================== API FITUR LOGIN (VERSI DINAMIS) ====================
app.post('/api/login', (req, res) => {
    const { nim_nidn, password } = req.body;
    const sql = "SELECT * FROM users WHERE nim_nidn = ? AND password = ?";
    db.query(sql, [nim_nidn, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.length > 0) {
            // SEKARANG KITA KIRIM JUGA NAMA DAN NIM_NIDN ASLINYA KE FRONTEND
            res.json({ 
                status: 'sukses', 
                message: 'Login Berhasil!',
                nim_nidn: result[0].nim_nidn,
                nama: result[0].nama,
                role: result[0].role 
            });
        } else {
            res.json({ status: 'gagal', message: 'NIM/NIDN atau Password salah. Silakan coba lagi.' });
        }
    });
});


// ==================== API FITUR MAHASISWA ====================

// A. Kirim Pengajuan Judul & Upload File
app.post('/api/pengajuan', upload.single('file_proposal'), (req, res) => {
    const { nim_mahasiswa, judul, jenis, deskripsi } = req.body;
    const file_proposal = req.file ? req.file.filename : null;

    const sql = "INSERT INTO pengajuan_judul (nim_mahasiswa, judul, jenis, deskripsi, file_proposal) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [nim_mahasiswa, judul, jenis, deskripsi, file_proposal], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'sukses', message: 'Pengajuan judul berhasil dikirim!' });
    });
});

// B. Ambil Riwayat Pengajuan Berdasarkan NIM
app.get('/api/pengajuan/:nim', (req, res) => {
    const nim = req.params.nim;
    const sql = "SELECT * FROM pengajuan_judul WHERE nim_mahasiswa = ? ORDER BY created_at DESC";
    db.query(sql, [nim], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// ==================== API FITUR ADMIN (SYSTEM) ====================

// A. Ambil Semua Pengajuan Masuk untuk Tabel Admin
app.get('/api/admin/pengajuan', (req, res) => {
    const sql = `SELECT p.*, u.nama FROM pengajuan_judul p 
        JOIN users u ON p.nim_mahasiswa = u.nim_nidn 
        ORDER BY p.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// B. Ubah Status Pengajuan (Setuju / Tolak)
app.put('/api/admin/status-pengajuan', (req, res) => {
    const { id_pengajuan, status_baru } = req.body;
    const sql = "UPDATE pengajuan_judul SET status = ? WHERE id = ?";
    db.query(sql, [status_baru, id_pengajuan], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'sukses', message: `Status berhasil diubah menjadi: ${status_baru}` });
    });
});


// 3. JALANKAN SERVER
app.listen(3000, () => {
    console.log('Server Backend berjalan di http://localhost:3000');
});