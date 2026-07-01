// === DATA ===

/** NIM contoh Andi yang sudah terdaftar di database */
// === CEK SESI & PROTEKSI HALAMAN ===
const nimMahasiswa = localStorage.getItem('nim_nidn');
const namaUser = localStorage.getItem('nama');
const roleUser = localStorage.getItem('role');

// Jika tidak ada data login atau role-nya bukan mahasiswa, tendang ke halaman login
if (!nimMahasiswa || roleUser !== 'mahasiswa') {
    alert("Anda belum login! Silakan login terlebih dahulu.");
    window.location.href = '../login.html'; // Sesuaikan arah jalan ke folder login-mu
}

// === DATA ===
/** Menyimpan riwayat pengajuan dari database */
// ... (sisa kode SECTIONS dan MONTHS di bawahnya tetap sama)

/** Menyimpan riwayat pengajuan dari database */
let riwayat = [];

/** Daftar nama section yang tersedia */
const SECTIONS = ['dashboard', 'pengajuan', 'bimbingan', 'sidang'];

/** Nama bulan dalam bahasa Inggris untuk kalender */
const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

// === INISIALISASI (dijalankan saat halaman siap) ===

document.addEventListener('DOMContentLoaded', function () {
  updateDate();
  showSection('pengajuan', document.querySelector('.nav-item.active'));
  
  // KONEKSI BARU: Ambil riwayat dari MySQL saat halaman terbuka
  loadRiwayatData(nimMahasiswa);
});

// === KALENDER & TANGGAL ===

function updateDate() {
  const now = new Date();

  document.getElementById('cal-day').textContent   = now.getDate();
  document.getElementById('cal-month').textContent = MONTHS[now.getMonth()];
  document.getElementById('cal-year').textContent  = now.getFullYear();

  const shortMonth = MONTHS[now.getMonth()].substring(0, 3);
  document.getElementById('server-date').textContent =
    `${now.getDate()} ${shortMonth} ${now.getFullYear()}`;
}

// === NAVIGASI SIDEBAR ===

function showSection(name, el) {
  SECTIONS.forEach(function (s) {
    const sec = document.getElementById('section-' + s);
    if (sec) {
      sec.style.display = (s === name) ? 'block' : 'none';
    }
  });

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  if (el) {
    el.classList.add('active');
  }
}



// === FILE UPLOAD ===

function triggerFileInput() {
  document.getElementById('file-input').click();
}

function updateFileName(input) {
  const label = document.getElementById('file-name-display');

  if (input.files.length > 0) {
    label.textContent  = input.files[0].name;
    label.style.color  = '#374151';
  } else {
    label.textContent  = 'Belum ada file dipilih';
    label.style.color  = '#94a3b8';
  }
}

// === AMBIL DATA RIWAYAT DARI DATABASE (BARU) ===

/**
 * Mengambil data pengajuan khusus milik NIM mahasiswa dari MySQL
 * dan memasukkannya ke dalam array `riwayat`.
 */
// === AMBIL DATA RIWAYAT DARI DATABASE ===
async function loadRiwayatData(nim) {
  const tbody = document.getElementById('riwayat-tbody');
  if (!tbody) return;

  try {
    const response = await fetch(`http://localhost:3000/api/pengajuan/${nim}`);
    const data = await response.json();
    
    // Pindahkan data dari server ke array riwayat global
    riwayat = data;
    
    // Render ke tabel HTML
    renderRiwayat();
  } catch (error) {
    console.error("Gagal memuat riwayat:", error);
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3" style="color: #991b1b;">Gagal memuat riwayat dari server.</td>
      </tr>`;
  }
}

// === RENDER TABEL RIWAYAT ===
function renderRiwayat() {
  const tbody = document.getElementById('riwayat-tbody');
  if (!tbody) return;

  if (riwayat.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">Belum ada riwayat pengajuan.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = riwayat.map(function (r) {
    const tanggalLokal = new Date(r.created_at).toLocaleDateString('id-ID');

    let badgeStyle = '';
    let statusText = '';
    
    if (r.status === 'pending') {
      badgeStyle = 'background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block;';
      statusText = 'Menunggu Review Admin';
    } else if (r.status === 'diteruskan') {
      badgeStyle = 'background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block;';
      statusText = 'Menunggu Review Dosen';
    } else if (r.status === 'disetujui') {
      badgeStyle = 'background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block;';
      statusText = 'Disetujui';
    } else {
      badgeStyle = 'background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block;';
      statusText = 'Ditolak';
    }

    return `
      <tr>
        <td>
          <div class="judul-cell">${escapeHtml(r.judul)}</div>
          <div class="jenis-cell">${escapeHtml(r.jenis)}</div>
        </td>
        <td>${tanggalLokal}</td>
        <td>
          <span class="badge-status" style="${badgeStyle}">${statusText}</span>
        </td>
      </tr>`;
  }).join('');
}
// === PENGAJUAN TOPIK (DIUBAH KE ASYNC FETCH) ===

/**
 * Memvalidasi form, mengirimkan data fisik file PDF & teks ke backend Node.js,
 * mereset form, lalu memperbarui tabel secara real-time.
 */
async function kirimPengajuan() {
  const judulInput    = document.getElementById('input-judul');
  const jenisInput    = document.getElementById('input-jenis');
  const deskripsiInput = document.getElementById('input-deskripsi');
  const fileInput     = document.getElementById('file-input');

  const judul     = judulInput.value.trim();
  const jenis     = jenisInput.value;
  const deskripsi = deskripsiInput.value.trim();
  const fileProposal = fileInput.files[0];

  // Validasi wajib isi
  if (!judul) {
    showToast('Judul topik wajib diisi!', false);
    judulInput.focus();
    return;
  }
  if (!fileProposal) {
    showToast('File Proposal PDF wajib diunggah!', false);
    return;
  }

  // Bungkus data menggunakan FormData karena ada file fisik (PDF)
  const formData = new FormData();
  formData.append('nim_mahasiswa', nimMahasiswa);
  formData.append('judul', judul);
  formData.append('jenis', jenis);
  formData.append('deskripsi', deskripsi);
  formData.append('file_proposal', fileProposal);

  try {
    // Tembak data ke backend Node.js
    const response = await fetch('http://localhost:3000/api/pengajuan', {
      method: 'POST',
      body: formData
    });

    const hasil = await response.json();

    if (hasil.status === 'sukses') {
      showToast('Pengajuan berhasil dikirim!', true);

      // Reset semua field form bawaan
      judulInput.value      = '';
      deskripsiInput.value  = '';
      fileInput.value       = '';
      document.getElementById('file-name-display').textContent = 'Belum ada file dipilih';
      document.getElementById('file-name-display').style.color = '#94a3b8';

      // Tarik data terbaru dari database agar langsung muncul di tabel riwayat
      loadRiwayatData(nimMahasiswa);
    } else {
      showToast('Gagal mengirim: ' + hasil.error, false);
    }

  } catch (error) {
    console.error("Error saat mengirim:", error);
    showToast('Terjadi kesalahan koneksi ke server backend!', false);
  }
}

// === RENDER TABEL RIWAYAT ===

/**
 * Merender isi tabel riwayat pengajuan berdasarkan array `riwayat`
 * yang datanya sudah ditarik dari database MySQL.
 */
function renderRiwayat() {
  const tbody = document.getElementById('riwayat-tbody');

  if (riwayat.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">Belum ada riwayat pengajuan.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = riwayat.map(function (r) {
    // Mengubah string tanggal dari MySQL (ISO Format) menjadi format tanggal lokal Indonesia
    const tanggalLokal = new Date(r.created_at).toLocaleDateString('id-ID');

    // Menentukan teks & warna styling badge secara dinamis berdasarkan status MySQL
    let badgeStyle = '';
    let statusText = '';
    
    if (r.status === 'pending') {
      badgeStyle = 'background: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;';
      statusText = 'Menunggu Review';
    } else if (r.status === 'disetujui') {
      badgeStyle = 'background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;';
      statusText = 'Disetujui';
    } else {
      badgeStyle = 'background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;';
      statusText = 'Ditolak';
    }

    return `
      <tr>
        <td>
          <div class="judul-cell">${escapeHtml(r.judul)}</div>
          <div class="jenis-cell">${escapeHtml(r.jenis)}</div>
        </td>
        <td>${tanggalLokal}</td>
        <td>
          <span class="badge-status" style="${badgeStyle}">${statusText}</span>
        </td>
      </tr>`;
  }).join('');
}

// ============================================
//  TOAST NOTIFIKASI
// ============================================

let toastTimer = null;

function showToast(msg, success) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;

  toast.style.background = success ? '#166534' : '#991b1b';
  toast.classList.add('show');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

// === UTILITAS ===

function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// === LOGOUT ===

// === INIT ===
document.addEventListener('DOMContentLoaded', function () {
  updateDate();

  if (typeof loadRiwayatData === 'function') {
      loadRiwayatData(nimMahasiswa);
  }

  // ════════════════════════════════════════════════════════════
  //  BARU: SINKRONISASI NAMA & AVATAR MAHASISWA DARI MYSQL
  // ════════════════════════════════════════════════════════════
  const elNama = document.querySelector('.navbar-user-name');
  const elAvatar = document.querySelector('.user-avatar');

  // Jika elemennya ada di HTML dan data nama hasil login tersimpan di memori browser
  if (elNama && namaUser) {
    elNama.textContent = `Halo, ${namaUser}`; // Mengganti tulisan "Halo, andi" menjadi nama asli
  }
  
  if (elAvatar && namaUser) {
    elAvatar.textContent = namaUser.charAt(0).toUpperCase(); // Mengganti "A" dengan inisial nama asli
  }
  // ════════════════════════════════════════════════════════════

  // Tombol logout bawaanmu (tetap utuh di paling bawah)
  const tombolLogout = document.getElementById('btn-logout');
  if (tombolLogout) {
      tombolLogout.addEventListener('click', function (e) {
          e.preventDefault(); 
          handleLogout();     
      });
  }
});

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // 1. Hapus bersih data Andi / Admin yang tersimpan di browser
        localStorage.clear();
        
        // 2. Lempar kembali ke halaman login utama
        window.location.href = '../login-page/index.html'; // Sesuaikan path menuju file login.html kamu
    }
}