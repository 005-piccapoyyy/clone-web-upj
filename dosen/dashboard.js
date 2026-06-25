// ═══════════════════════════════════════
//  SITA UPJ — dashboard.js (Dosen)
// ═══════════════════════════════════════

// === DATA MAHASISWA BIMBINGAN ===
const mahasiswaData = [
  {
    nama  : "Rio Anggara",
    nim   : "12345",
    judul : "Implementasi Machine Learning pada Sistem Rekomendasi",
    status: "Revisi",
    log   : [
      { tanggal: "10 Des 2025", catatan: "Bab 1 dan 2 sudah baik, lanjutkan ke Bab 3.", status: "Disetujui" },
      { tanggal: "18 Des 2025", catatan: "Metodologi perlu diperjelas pada bagian analisis data.", status: "Revisi" },
      { tanggal: "24 Des 2025", catatan: "Revisi Bab 3 diterima, silakan mulai Bab 4.", status: "Disetujui" }
    ]
  },
  {
    nama  : "Siti Rahayu",
    nim   : "12346",
    judul : "Analisis Sentimen Media Sosial menggunakan Deep Learning",
    status: "Berjalan",
    log   : [
      { tanggal: "5 Des 2025",  catatan: "Pengajuan judul disetujui.", status: "Disetujui" },
      { tanggal: "15 Des 2025", catatan: "Bab 1 selesai, Bab 2 perlu referensi tambahan.", status: "Revisi" }
    ]
  },
  {
    nama  : "Budi Santoso",
    nim   : "12347",
    judul : "Sistem Monitoring IoT untuk Smart Home",
    status: "Selesai",
    log   : [
      { tanggal: "1 Nov 2025",  catatan: "Semua bab selesai direvisi dengan baik.", status: "Disetujui" },
      { tanggal: "20 Nov 2025", catatan: "Siap untuk sidang akhir.", status: "Disetujui" }
    ]
  },
  {
    nama  : "Dewi Lestari",
    nim   : "12348",
    judul : "Rancang Bangun Aplikasi E-Commerce berbasis Mobile",
    status: "Berjalan",
    log   : [
      { tanggal: "20 Des 2025", catatan: "Bab 1 masuk, perlu perbaikan pada rumusan masalah.", status: "Revisi" }
    ]
  }
];

/** Nama section yang tersedia */
const SECTIONS = ['dashboard', 'bimbingan'];

/** Nama bulan bahasa Inggris */
const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

// ═══════════════════════════════════════
//  INISIALISASI
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
  updateDate();
  renderTable(mahasiswaData);
  showSection('bimbingan', document.querySelector('.nav-item.active'));
});

// ═══════════════════════════════════════
//  KALENDER & TANGGAL
// ═══════════════════════════════════════
function updateDate() {
  const now = new Date();

  document.getElementById('cal-day').textContent   = now.getDate();
  document.getElementById('cal-month').textContent = MONTHS[now.getMonth()];
  document.getElementById('cal-year').textContent  = now.getFullYear();

  const shortMonth = MONTHS[now.getMonth()].substring(0, 3);
  document.getElementById('server-date').textContent =
    `${now.getDate()} ${shortMonth} ${now.getFullYear()}`;
}

// ═══════════════════════════════════════
//  NAVIGASI SIDEBAR
// ═══════════════════════════════════════
function showSection(name, el) {
  SECTIONS.forEach(function (s) {
    const sec = document.getElementById('section-' + s);
    if (sec) sec.style.display = (s === name) ? 'block' : 'none';
  });

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.remove('active');
  });

  if (el) el.classList.add('active');
}

// ═══════════════════════════════════════
//  RENDER TABEL
// ═══════════════════════════════════════
function renderTable(data) {
  const tbody = document.getElementById('table-body');

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Tidak ada mahasiswa yang ditemukan.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data.map(function (m, i) {
    const badgeClass = m.status === 'Selesai'  ? 'badge-selesai'
                     : m.status === 'Revisi'   ? 'badge-revisi'
                     : 'badge-berjalan';

    return `
      <tr>
        <td style="text-align:center; color:#94a3b8;">${i + 1}</td>
        <td>
          <div class="nama-cell">${escapeHtml(m.nama)}</div>
          <div class="nim-cell">${escapeHtml(m.nim)}</div>
        </td>
        <td style="max-width: 260px; font-size: 13px;">${escapeHtml(m.judul)}</td>
        <td><span class="badge-status ${badgeClass}">${escapeHtml(m.status)}</span></td>
        <td style="text-align:center;">
          <button class="btn-log" onclick="bukaLog(${i})">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Buka Log
          </button>
        </td>
      </tr>`;
  }).join('');
}

// ═══════════════════════════════════════
//  FILTER / CARI MAHASISWA
// ═══════════════════════════════════════
function filterTable() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();

  if (!q) {
    renderTable(mahasiswaData);
    return;
  }

  const filtered = mahasiswaData.filter(function (m) {
    return m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q);
  });

  renderTable(filtered);
}

// ═══════════════════════════════════════
//  MODAL LOG BIMBINGAN
// ═══════════════════════════════════════

/** Indeks mahasiswa yang sedang dilihat (untuk renderTable setelah close) */
let currentIdx = null;

/**
 * Membuka modal dan menampilkan log bimbingan mahasiswa.
 * @param {number} idx - Index mahasiswa di array mahasiswaData
 */
function bukaLog(idx) {
  currentIdx = idx;
  const m = mahasiswaData[idx];

  // Judul modal
  document.getElementById('modal-title').textContent =
    `Log Bimbingan — ${m.nama} (${m.nim})`;

  // Isi log
  let html = '';

  if (m.log.length === 0) {
    html = `<div class="log-empty">Belum ada log bimbingan untuk mahasiswa ini.</div>`;
  } else {
    html = m.log.map(function (l) {
      const badgeClass = l.status === 'Disetujui' ? 'badge-selesai' : 'badge-revisi';
      return `
        <div class="log-item">
          <div class="log-tanggal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${escapeHtml(l.tanggal)}
          </div>
          <div class="log-catatan">${escapeHtml(l.catatan)}</div>
          <div class="log-status">
            <span class="badge-status ${badgeClass}">${escapeHtml(l.status)}</span>
          </div>
        </div>`;
    }).join('');
  }

  document.getElementById('modal-body').innerHTML = html;

  // Tampilkan modal
  document.getElementById('modal-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

/** Menutup modal */
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

/**
 * Menutup modal jika user klik di luar box (pada overlay).
 * @param {MouseEvent} e
 */
function tutupModal(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    closeModal();
  }
}

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

// ═══════════════════════════════════════
//  UTILITAS
// ═══════════════════════════════════════

/**
 * Mencegah XSS dengan meng-escape karakter HTML berbahaya.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}