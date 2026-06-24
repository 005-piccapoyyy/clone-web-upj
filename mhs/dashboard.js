// === DATA ===

/** Menyimpan riwayat pengajuan selama sesi berlangsung */
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
});

// === KALENDER & TANGGAL ===

/**
 * Mengambil tanggal hari ini dan menampilkannya
 * di kalender mini serta status server.
 */
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

/**
 * Menampilkan section yang dipilih dan menyembunyikan yang lain.
 * @param {string} name  - ID section (tanpa prefix 'section-')
 * @param {Element} el   - Elemen nav-item yang diklik
 */
function showSection(name, el) {
  // Tampilkan/sembunyikan section
  SECTIONS.forEach(function (s) {
    const sec = document.getElementById('section-' + s);
    if (sec) {
      sec.style.display = (s === name) ? 'block' : 'none';
    }
  });

  // Update kelas active pada sidebar
  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });
  if (el) {
    el.classList.add('active');
  }
}

// === FILE UPLOAD ===

/**
 * Membuka dialog pilih file saat area upload diklik.
 */
function triggerFileInput() {
  document.getElementById('file-input').click();
}

/**
 * Memperbarui tampilan nama file setelah pengguna memilih file.
 * @param {HTMLInputElement} input - Elemen input file
 */
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

// === PENGAJUAN TOPIK ===

/**
 * Memvalidasi form, menyimpan data pengajuan ke array riwayat,
 * mereset form, lalu menampilkan notifikasi sukses.
 */
function kirimPengajuan() {
  const judulInput    = document.getElementById('input-judul');
  const jenisInput    = document.getElementById('input-jenis');
  const deskripsiInput = document.getElementById('input-deskripsi');
  const fileInput     = document.getElementById('file-input');

  const judul    = judulInput.value.trim();
  const jenis    = jenisInput.value;

  // Validasi: judul wajib diisi
  if (!judul) {
    showToast('Judul topik wajib diisi!', false);
    judulInput.focus();
    return;
  }

  // Format tanggal DD/MM/YYYY
  const now    = new Date();
  const dd     = String(now.getDate()).padStart(2, '0');
  const mm     = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy   = now.getFullYear();
  const tanggal = `${dd}/${mm}/${yyyy}`;

  // Simpan ke array riwayat (terbaru di atas)
  riwayat.unshift({
    judul   : judul,
    jenis   : jenis,
    tanggal : tanggal,
    status  : 'Menunggu Review'
  });

  // Render ulang tabel
  renderRiwayat();

  // Reset semua field form
  judulInput.value      = '';
  deskripsiInput.value  = '';
  fileInput.value       = '';
  document.getElementById('file-name-display').textContent = 'Belum ada file dipilih';
  document.getElementById('file-name-display').style.color = '#94a3b8';

  showToast('Pengajuan berhasil dikirim!', true);
}

// === RENDER TABEL RIWAYAT ===

/**
 * Merender ulang isi tabel riwayat pengajuan
 * berdasarkan data di array `riwayat`.
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
    return `
      <tr>
        <td>
          <div class="judul-cell">${escapeHtml(r.judul)}</div>
          <div class="jenis-cell">${escapeHtml(r.jenis)}</div>
        </td>
        <td>${r.tanggal}</td>
        <td>
          <span class="badge-status">${r.status}</span>
        </td>
      </tr>`;
  }).join('');
}

// ============================================
//  TOAST NOTIFIKASI
// ============================================

/** Timeout ID untuk auto-hide toast */
let toastTimer = null;

/**
 * Menampilkan notifikasi toast di pojok kanan bawah.
 * @param {string}  msg     - Pesan yang ditampilkan
 * @param {boolean} success - true = hijau (sukses), false = merah (error)
 */
function showToast(msg, success) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;

  toast.style.background = success ? '#166534' : '#991b1b';
  toast.classList.add('show');

  // Reset timer jika toast sebelumnya belum hilang
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

// === UTILITAS ===

/**
 * Mencegah XSS dengan meng-escape karakter HTML berbahaya
 * sebelum dimasukkan ke innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}