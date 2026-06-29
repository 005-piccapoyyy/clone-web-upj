// === DATA ===
const SECTIONS = ['dashboard', 'kelola', 'validasi', 'jadwal', 'laporan', 'pengaturan'];
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

let riwayatValidasi = [];
let statApproved    = 0;
let statRejected    = 0;
let statPending     = 1; // 1 proposal dummy di awal
let pendingRow      = null;
let pendingType     = null;
let toastTimer      = null;

// === INIT ===
document.addEventListener('DOMContentLoaded', function () {
  updateDate();
  showSection('validasi', document.querySelector('.nav-item.active'));

  // Tutup modal saat klik overlay
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  // Tombol konfirmasi modal
  document.getElementById('btn-modal-confirm').addEventListener('click', confirmValidasi);
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
  // Sembunyikan semua tab content
  document.querySelectorAll('.tab-content').forEach(function (tc) {
    tc.style.display = 'none';
    tc.classList.remove('active');
  });

  // Hapus active dari semua tab btn
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.remove('active');
  });

  // Tampilkan tab yang dipilih
  const target = document.getElementById('tab-' + name);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }

  btn.classList.add('active');
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
    title.textContent      = 'Setujui Proposal';
    desc.textContent       = `Setujui proposal "${judul}" dari ${nama}?`;
    confirmBtn.style.background = '#22c55e';
    confirmBtn.textContent = 'Ya, Setujui';
  } else {
    icon.innerHTML         = '<span style="color:#ef4444;font-size:44px;">✕</span>';
    title.textContent      = 'Tolak Proposal';
    desc.textContent       = `Tolak proposal "${judul}" dari ${nama}?`;
    confirmBtn.style.background = '#ef4444';
    confirmBtn.textContent = 'Ya, Tolak';
  }

  overlay.classList.add('show');
}

function confirmValidasi() {
  if (!pendingRow) return;

  const nama   = pendingRow.querySelector('td:first-child div:first-child')?.textContent || '-';
  const judul  = pendingRow.querySelector('.judul-cell')?.textContent || '-';
  const jenis  = pendingRow.querySelector('.jenis-cell')?.textContent || '-';
  const now    = new Date();
  const tgl    = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

  // Update badge di baris
  const statusBadge = pendingRow.querySelector('.badge-status');
  if (statusBadge) {
    if (pendingType === 'approve') {
      statusBadge.textContent  = 'Disetujui';
      statusBadge.className    = 'badge-status badge-approved';
      statApproved++;
      statPending = Math.max(0, statPending - 1);
    } else {
      statusBadge.textContent  = 'Ditolak';
      statusBadge.className    = 'badge-status badge-rejected';
      statRejected++;
      statPending = Math.max(0, statPending - 1);
    }
  }

  // Disable tombol
  pendingRow.querySelectorAll('.btn-approve, .btn-reject').forEach(function (b) {
    b.disabled = true;
  });

  // Tambah ke riwayat
  riwayatValidasi.unshift({
    nama   : nama,
    judul  : judul,
    jenis  : jenis,
    tanggal: tgl,
    status : pendingType === 'approve' ? 'Disetujui' : 'Ditolak'
  });

  renderRiwayat();
  updateStats();
  updateDashboardActivity(nama, judul, pendingType, tgl);

  const msg = pendingType === 'approve'
    ? `Proposal ${nama} berhasil disetujui!`
    : `Proposal ${nama} telah ditolak.`;

  closeModal();
  showToast(msg, pendingType === 'approve');
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
    const badgeClass = r.status === 'Disetujui' ? 'badge-approved' : 'badge-rejected';
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

  const color  = type === 'approve' ? '#065f46' : '#991b1b';
  const label  = type === 'approve' ? 'Disetujui' : 'Ditolak';
  const dot    = type === 'approve' ? '#22c55e' : '#ef4444';
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

// === LOGOUT ===
function handleLogout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    showToast('Anda telah logout.', false);
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