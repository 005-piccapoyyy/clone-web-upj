// ═══════════════════════════════════════
//  SITA UPJ — dashboard.js (Admin)
// ═══════════════════════════════════════

// === DATA ===
const SECTIONS = ['dashboard', 'kelola', 'validasi', 'jadwal', 'laporan', 'pengaturan'];
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

let riwayatValidasi = [];
let statApproved    = 0;
let statRejected    = 0;
let statPending     = 0; 
let pendingRow      = null;
let pendingType     = null;
let toastTimer      = null;

// === INIT (SUDAH DISATUKAN DAN RAPI) ===
document.addEventListener('DOMContentLoaded', function () {
  updateDate();
  showSection('validasi', document.querySelector('.nav-item.active'));

  // Otomatis ambil data proposal asli dari MySQL saat panel dibuka
  loadProposalsFromDatabase();

  const namaDariStorage = localStorage.getItem('nama');
  
  // Mencari berdasarkan class atau ID yang umum digunakan
  const elNama = document.querySelector('.navbar-user-name') || document.getElementById('admin-name');
  const elAvatar = document.querySelector('.user-avatar') || document.getElementById('admin-avatar');

  console.log("=== DEBUG ADMIN ===");
  console.log("Nama dari Storage:", namaDariStorage);
  console.log("Elemen Nama Ditemukan:", elNama);
  console.log("Elemen Avatar Ditemukan:", elAvatar);

  if (elNama && namaDariStorage) {
    elNama.textContent = `Halo, ${namaDariStorage}`;
  }
  
  if (elAvatar && namaDariStorage) {
    elAvatar.textContent = namaDariStorage.charAt(0).toUpperCase();
  }
  // ════════════════════════════════════════════════════════════

  // Tutup modal saat klik overlay
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }

  // Tombol konfirmasi modal
  const btnConfirm = document.getElementById('btn-modal-confirm');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', confirmValidasi);
  }

  // Tombol Logout Admin
  const tombolLogout = document.getElementById('btn-logout');
  if (tombolLogout) {
    tombolLogout.addEventListener('click', function (e) {
      e.preventDefault(); 
      handleLogout();     
    });
  }
});

// === KALENDER & TANGGAL ===
function updateDate() {
  const now = new Date();
  document.getElementById('cal-day').textContent   = now.getDate();
  document.getElementById('cal-month').textContent = MONTHS[now.getMonth()].toUpperCase();
  document.getElementById('cal-year').textContent  = now.getFullYear();

  const shortMonth = MONTHS[now.getMonth()].substring(0, 3);
  const el = document.getElementById('server-date');
  if (el) el.textContent = `${now.getDate()} ${shortMonth} ${now.getFullYear()}`;
}

// === NAVIGASI SIDEBAR ===
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

// === TAB SWITCHING ===
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(function (tc) {
    tc.style.display = 'none';
    tc.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.remove('active');
  });

  const target = document.getElementById('tab-' + name);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }

  btn.classList.add('active');
}

// === AMBIL DATA PROPOSAL DARI DATABASE ===
async function loadProposalsFromDatabase() {
  const tabelProposalBody = document.getElementById('tabel-proposal'); 
  if (!tabelProposalBody) return;

  tabelProposalBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:15px;">Memuat data proposal...</td></tr>`;

  statApproved = 0;
  statRejected = 0;
  statPending = 0;
  riwayatValidasi = [];

  try {
    const response = await fetch('http://localhost:3000/api/admin/pengajuan');
    const data = await response.json();

    tabelProposalBody.innerHTML = ''; 

    if (data.length === 0) {
      tabelProposalBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:15px;color:#94a3b8;">Belum ada proposal masuk dari mahasiswa.</td></tr>`;
      renderRiwayat();
      updateStats();
      return;
    }

    data.forEach(item => {
      const tglFormat = new Date(item.created_at).toLocaleDateString('id-ID');

      if (item.status === 'pending') {
        statPending++;
        
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        row.innerHTML = `
          <td>
            <div style="font-weight: 600; color: #1e293b;">${escapeHtml(item.nama)}</div>
            <div style="color: #6b7280; font-size: 12px;">${escapeHtml(item.nim_mahasiswa)}</div>
            <span class="badge-status" style="background:#fef3c7; color:#d97706; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">Menunggu</span>
          </td>
          <td>
            <div class="judul-cell" style="font-weight: 600; color: #1e293b;">${escapeHtml(item.judul)}</div>
            <div class="jenis-cell" style="color: #4b5563; font-size: 12px; font-weight: 500; margin-top: 2px;">Jenis: ${escapeHtml(item.jenis)}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">${escapeHtml(item.deskripsi || '-')}</div>
          </td>
          <td>
            ${item.file_proposal 
              ? `<a href="http://localhost:3000/uploads/${item.file_proposal}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size:13px;">👁️ Lihat File</a>` 
              : '<span style="color: #9ca3af; font-size:13px;">Tidak ada file</span>'}
          </td>
          <td>
            <button class="btn-approve" onclick="handleValidasi(this, 'approve')" style="background: #22c55e; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-weight:600; font-size:12px;">✓ Teruskan</button>
            <button class="btn-reject" onclick="handleValidasi(this, 'reject')" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight:600; font-size:12px;">✕ Tolak</button>
          </td>
        `;
        tabelProposalBody.appendChild(row);

      } else {
        // PERBARUAN LOGIKA STATUS UNTUK RIWAYAT ADMIN
        let teksStatusRiwayat = '';
        if (item.status === 'disetujui') {
          statApproved++;
          teksStatusRiwayat = 'Disetujui';
        } else if (item.status === 'diteruskan') {
          teksStatusRiwayat = 'Diteruskan'; // Status baru di tabel admin
        } else {
          statRejected++;
          teksStatusRiwayat = 'Ditolak';
        }

        riwayatValidasi.push({
          nama: item.nama,
          judul: item.judul,
          jenis: item.jenis,
          tanggal: tglFormat,
          status: teksStatusRiwayat
        });
      }
    });

    if (statPending === 0) {
      tabelProposalBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:15px;color:#94a3b8;">Semua proposal telah selesai diproses.</td></tr>`;
    }

    renderRiwayat();
    updateStats();

  } catch (error) {
    console.error("Gagal menarik data:", error);
    tabelProposalBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:15px;">Gagal terhubung ke server backend!</td></tr>`;
  }
}

// === VALIDASI PROPOSAL ===
function handleValidasi(btn, type) {
  const row  = btn.closest('tr');
  const nama = row.querySelector('td:first-child div:first-child')?.textContent || 'Mahasiswa';
  const judul = row.querySelector('.judul-cell')?.textContent || '-';

  pendingRow  = row;
  pendingType = type;

  const overlay    = document.getElementById('modal-overlay');
  const icon       = document.getElementById('modal-icon');
  const title      = document.getElementById('modal-title');
  const desc       = document.getElementById('modal-desc');
  const confirmBtn = document.getElementById('btn-modal-confirm');

  if (type === 'approve') {
    icon.innerHTML         = '<span style="color:#22c55e;font-size:44px;">✓</span>';
    title.textContent      = 'Teruskan ke Dosen';
    desc.textContent       = `Teruskan proposal "${judul}" dari ${nama} ke Dosen Pembimbing?`;
    confirmBtn.style.background = '#22c55e';
    confirmBtn.textContent = 'Ya, Teruskan';
  } else {
    icon.innerHTML         = '<span style="color:#ef4444;font-size:44px;">✕</span>';
    title.textContent      = 'Tolak Proposal';
    desc.textContent       = `Tolak secara final proposal "${judul}" dari ${nama}?`;
    confirmBtn.style.background = '#ef4444';
    confirmBtn.textContent = 'Ya, Tolak';
  }

  overlay.classList.add('show');
}

// === KONFIRMASI DARI MODAL ===
async function confirmValidasi() {
  if (!pendingRow) return;

  const idPengajuan = pendingRow.getAttribute('data-id');
  const statusBaru  = pendingType === 'approve' ? 'disetujui' : 'ditolak';

  const nama   = pendingRow.querySelector('td:first-child div:first-child')?.textContent || '-';
  const judul  = pendingRow.querySelector('.judul-cell')?.textContent || '-';
  const now    = new Date();
  const tgl    = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

  try {
    const response = await fetch('http://localhost:3000/api/admin/status-pengajuan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pengajuan: idPengajuan, status_baru: statusBaru })
    });

    const hasil = await response.json();

    if (hasil.status === 'sukses') {
      updateDashboardActivity(nama, judul, pendingType, tgl);

      const msg = pendingType === 'approve'
        ? `Proposal ${nama} berhasil diteruskan ke Dosen!`
        : `Proposal ${nama} telah ditolak.`;

      closeModal();
      showToast(msg, pendingType === 'approve');
      loadProposalsFromDatabase();
    } else {
      showToast('Gagal memproses: ' + hasil.error, false);
    }

  } catch (error) {
    console.error("Error saat mengubah status:", error);
    showToast('Terjadi kesalahan koneksi ke server backend!', false);
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  pendingRow  = null;
  pendingType = null;
}

// === RENDER RIWAYAT ===
function renderRiwayat() {
  const tbody = document.getElementById('riwayat-tbody');
  if (!tbody) return;

  if (riwayatValidasi.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Belum ada riwayat validasi.</td></tr>';
    return;
  }

  tbody.innerHTML = riwayatValidasi.map(function (r) {
    // Penyesuaian kelas badge agar status Diteruskan berwarna biru cerah
    let badgeClass = 'badge-approved';
    if (r.status === 'Ditolak') badgeClass = 'badge-rejected';
    if (r.status === 'Diteruskan') badgeClass = 'badge-berjalan'; // Warna biru pembimbing

    return `
      <tr>
        <td><div style="font-weight:600;color:#1e293b;">${escapeHtml(r.nama)}</div></td>
        <td>
          <div class="judul-cell">${escapeHtml(r.judul)}</div>
          <div class="jenis-cell">${escapeHtml(r.jenis)}</div>
        </td>
        <td>${r.tanggal}</td>
        <td><span class="badge-status ${badgeClass}">${r.status}</span></td>
      </tr>`;
  }).join('');
}

// === UPDATE STATS ===
function updateStats() {
  const elPending  = document.getElementById('stat-pending');
  const elApproved = document.getElementById('stat-approved');
  const elRejected = document.getElementById('stat-rejected');
  if (elPending)  elPending.textContent  = statPending;
  if (elApproved) elApproved.textContent = statApproved;
  if (elRejected) elRejected.textContent = statRejected;
}

// === DASHBOARD ACTIVITY ===
function updateDashboardActivity(nama, judul, type, tgl) {
  const el = document.getElementById('dashboard-activity');
  if (!el) return;

  el.style.fontStyle = 'normal';
  el.style.color     = '#475569';
  el.style.padding   = '0';

  const color  = type === 'approve' ? '#0369a1' : '#991b1b';
  const label  = type === 'approve' ? 'Diteruskan ke Dosen' : 'Ditolak';
  const dot    = type === 'approve' ? '#38bdf8' : '#ef4444';
  const newItem = `
    <div style="display:flex;gap:10px;padding:14px 20px;border-bottom:1px solid #f1f5f9;align-items:flex-start;">
      <div style="width:8px;height:8px;border-radius:50%;background:${dot};margin-top:5px;flex-shrink:0;"></div>
      <div>
        <div style="font-weight:600;color:#1e293b;font-size:13.5px;">${escapeHtml(nama)} — ${escapeHtml(judul)}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">${tgl} · <span style="color:${color};font-weight:600;">${label}</span></div>
      </div>
    </div>`;

  el.innerHTML = newItem + el.innerHTML;
}

// === TOAST ===
function showToast(msg, success) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.style.background = success ? '#166534' : '#991b1b';
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

// === FUNGSI LOGOUT ADMIN ===
function handleLogout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.clear();
    window.location.href = '../login-page/index.html'; 
  }
}

// === UTILITY ===
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}