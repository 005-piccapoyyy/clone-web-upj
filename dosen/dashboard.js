// ═══════════════════════════════════════
//  SITA UPJ — dashboard.js (Dosen)
// ═══════════════════════════════════════

const nidnDosen = localStorage.getItem('nim_nidn') || '04260001'; 
const namaDosen = localStorage.getItem('nama') || 'Yunus Widjaja, S.Kom, MM';
const roleUser  = localStorage.getItem('role');

let mahasiswaData = [];
const SECTIONS = ['dashboard', 'bimbingan'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

document.addEventListener('DOMContentLoaded', function () {
  updateDate();
  // ════════════════════════════════════════════════════════════
  const elNama = document.querySelector('.navbar-user-name');
  const elAvatar = document.querySelector('.user-avatar');

  // Jika elemennya ada di HTML Dosen dan data nama dosen tersimpan di memori browser
  if (elNama && namaDosen) {
    elNama.textContent = `Halo, ${namaDosen}`; // Mengganti menjadi "Halo, Yunus Widjaja, S.Kom, MM"
  }
  
  if (elAvatar && namaDosen) {
    elAvatar.textContent = namaDosen.charAt(0).toUpperCase(); // Mengganti menjadi huruf "Y"
  }
  // ════════════════════════════════════════════════════════════
  const tombolLogout = document.getElementById('btn-logout');
  if (tombolLogout) {
    tombolLogout.addEventListener('click', function (e) {
      e.preventDefault(); 
      handleLogout();     
    });
  }
});

// === AMBIL DATA DARI MYSQL ===
async function loadMahasiswaBimbingan() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px;">Memuat data...</td></tr>`;

  try {
    const response = await fetch(`http://localhost:3000/api/dosen/bimbingan/${nidnDosen}`);
    const data = await response.json();

    mahasiswaData = data.map(item => {
      return {
        id: item.id, // Menyimpan ID Database
        nama: item.nama,
        nim: item.nim_mahasiswa,
        judul: item.judul,
        status_bimbingan: item.status_bimbingan || 'Berjalan',
        status_final: item.status, // 'diteruskan', 'disetujui', 'ditolak'
        log: item.log || []
      };
    });

    renderTable(mahasiswaData);

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:15px;">Gagal terhubung ke server backend!</td></tr>`;
  }
}

// === RENDER TABEL (DENGAN TOMBOL AKSI BARU) ===
function renderTable(data) {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Tidak ada mahasiswa yang ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(function (m, i) {
    const badgeClass = m.status_bimbingan === 'Selesai' ? 'badge-selesai' : m.status_bimbingan === 'Revisi' ? 'badge-revisi' : 'badge-berjalan';

    // LOGIKA TOMBOL AKSI: Jika statusnya masih 'diteruskan', munculkan opsi Setuju & Tolak
    let aksiHtml = `
      <button class="btn-log" onclick="bukaLog(${i})" style="margin-bottom: 4px;">
        📋 Log
      </button>
    `;

    if (m.status_final === 'diteruskan') {
      aksiHtml += `
        <br>
        <button onclick="eksekusiKeputusanDosen(${m.id}, 'disetujui')" style="background:#22c55e; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold; margin-right:2px;">✓ Setuju</button>
        <button onclick="eksekusiKeputusanDosen(${m.id}, 'ditolak')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✕ Tolak</button>
      `;
    } else {
      // Jika sudah diputuskan oleh dosen, tampilkan status keputusannya
      let teksStatus = m.status_final === 'disetujui' 
        ? '<span style="color:#16a34a; font-weight:700; font-size:12px; display:block; margin-top:4px;">🟢 Disetujui</span>' 
        : '<span style="color:#dc2626; font-weight:700; font-size:12px; display:block; margin-top:4px;">🔴 Ditolak</span>';
      aksiHtml += teksStatus;
    }

    return `
      <tr>
        <td style="text-align:center; color:#94a3b8;">${i + 1}</td>
        <td>
          <div class="nama-cell">${escapeHtml(m.nama)}</div>
          <div class="nim-cell">${escapeHtml(m.nim)}</div>
        </td>
        <td style="max-width: 260px; font-size: 13px;">${escapeHtml(m.judul)}</td>
        <td><span class="badge-status ${badgeClass}">${escapeHtml(m.status_bimbingan)}</span></td>
        <td style="text-align:center;">${aksiHtml}</td>
      </tr>`;
  }).join('');
}

// === FUNGSI PROSES KEPUTUSAN DOSEN (BARU) ===
async function eksekusiKeputusanDosen(idPengajuan, keputusan) {
  const konfirmasi = confirm(`Apakah Anda yakin ingin memberikan status [${keputusan.toUpperCase()}] pada judul ini?`);
  if (!konfirmasi) return;

  try {
    const response = await fetch('http://localhost:3000/api/dosen/keputusan-judul', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pengajuan: idPengajuan, keputusan: keputusan })
    });

    const hasil = await response.json();
    if (hasil.status === 'sukses') {
      alert(hasil.message);
      loadMahasiswaBimbingan(); // Refresh tabel dosen otomatis
    } else {
      alert("Gagal memproses keputusan: " + hasil.error);
    }
  } catch (error) {
    alert("Terjadi kesalahan sistem saat menghubungi backend.");
  }
}

// === FILTER / CARI MAHASISWA ===
function filterTable() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if (!q) { renderTable(mahasiswaData); return; }
  const filtered = mahasiswaData.filter(function (m) {
    return m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q);
  });
  renderTable(filtered);
}

// === MODAL LOG BIMBINGAN ===
let currentIdx = null;
function bukaLog(idx) {
  currentIdx = idx;
  const m = mahasiswaData[idx];
  document.getElementById('modal-title').textContent = `Log Bimbingan — ${m.nama} (${m.nim})`;
  let html = '';

  if (!m.log || m.log.length === 0) {
    html = `<div class="log-empty" style="text-align:center; padding:15px; color:#94a3b8;">Belum ada catatan log bimbingan.</div>`;
  } else {
    html = m.log.map(function (l) {
      const badgeClass = l.status === 'Disetujui' ? 'badge-selesai' : 'badge-revisi';
      return `
        <div class="log-item">
          <div class="log-tanggal">${escapeHtml(l.tanggal)}</div>
          <div class="log-catatan">${escapeHtml(l.catatan)}</div>
          <div class="log-status"><span class="badge-status ${badgeClass}">${escapeHtml(l.status)}</span></div>
        </div>`;
    }).join('');
  }
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); document.body.style.overflow = ''; }
function tutupModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
function updateDate() { const now = new Date(); document.getElementById('cal-day').textContent = now.getDate(); document.getElementById('cal-month').textContent = MONTHS[now.getMonth()]; document.getElementById('cal-year').textContent = now.getFullYear(); const shortMonth = MONTHS[now.getMonth()].substring(0, 3); const el = document.getElementById('server-date'); if (el) el.textContent = `${now.getDate()} ${shortMonth} ${now.getFullYear()}`; }
function showSection(name, el) { SECTIONS.forEach(function (s) { const sec = document.getElementById('section-' + s); if (sec) sec.style.display = (s === name) ? 'block' : 'none'; }); document.querySelectorAll('.nav-item').forEach(function (item) { item.classList.remove('active'); }); if (el) el.classList.add('active'); }
function handleLogout() { if (confirm('Apakah Anda yakin ingin logout?')) { localStorage.clear(); window.location.href = '../login-page/index.html'; } }
function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }