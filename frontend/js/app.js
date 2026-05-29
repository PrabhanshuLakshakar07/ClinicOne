// ============================================================
//  E-SEHAT — Main App Controller
//  File: js/app.js
// ============================================================

const PAGE_META = {
  dashboard:     { title:'Good Morning, <span>Doctor</span> 👋', sub:'Al-Shifa Clinic — Live Data' },
  patients:      { title:'<span>Patient</span> Management',       sub:'Add, search, and manage all patient records' },
  medicines:     { title:'Medicine <span>Directory</span>',       sub:'Manage your clinic formulary' },
  inventory:     { title:'<span>Inventory</span> Management',     sub:'Live stock levels and low-stock alerts' },
  prescriptions: { title:'<span>Prescription</span> Manager',     sub:'Create, view and manage patient prescriptions' }
};

// ── Navigate to page ─────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  const meta = PAGE_META[pageId];
  if (meta) {
    document.getElementById('page-heading').innerHTML = meta.title;
    document.getElementById('page-sub').textContent   = meta.sub;
  }

  // Load data for the active page
  switch (pageId) {
    case 'dashboard':     loadDashboardData();  break;
    case 'patients':      loadPatients();        break;
    case 'medicines':     loadMedicines();       break;
    case 'inventory':     loadInventory();       break;
    case 'prescriptions': loadPrescriptions();   break;
  }

  document.getElementById('sidebar')?.classList.remove('open');
}

// ── Dashboard Data ────────────────────────────────────────────
async function loadDashboardData() {
  loadDashboardStats();
  loadDashboardPatients();
  loadDashboardAlerts();
}

async function loadDashboardStats() {
  try {
    const [ptStats, inv] = await Promise.all([
      PatientAPI.stats(),
      InventoryAPI.getAll()
    ]);
    document.getElementById('dash-total-patients').textContent  = ptStats.stats.total;
    document.getElementById('dash-today-patients').textContent  = ptStats.stats.today;
    document.getElementById('dash-alert-count').textContent     = inv.alerts;
    document.getElementById('inv-alert-badge').textContent      = inv.alerts;

    const banner = document.getElementById('inv-alert-banner');
    if (banner) banner.style.display = inv.alerts > 0 ? 'flex' : 'none';
  } catch (e) { console.error('Stats error:', e); }
}

async function loadDashboardPatients() {
  const tbody = document.getElementById('dash-patients-tbody');
  tbody.innerHTML = loadingRow(4);
  try {
    const data = await PatientAPI.getAll('?limit=5');
    if (!data.patients.length) {
      tbody.innerHTML = emptyRow(4, 'No patients yet.'); return;
    }
    tbody.innerHTML = data.patients.map(p => `
      <tr>
        <td>
          <div class="td-primary">${p.first_name} ${p.last_name}</div>
          <div class="td-mono">#${p.patient_code}</div>
        </td>
        <td>${p.age}</td>
        <td>${p.condition_desc || '—'}</td>
        <td>${statusBadge(p.status)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = emptyRow(4, '❌ Could not load patients.');
  }
}

async function loadDashboardAlerts() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  try {
    const data = await InventoryAPI.getAlerts();
    if (!data.alerts.length) {
      feed.innerHTML = `<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">✅ All stock levels are OK!</div>`;
      return;
    }
    feed.innerHTML = data.alerts.map(a => `
      <div class="activity-item">
        <div class="act-dot ${a.severity === 'Critical' ? 'red' : 'yellow'}">${a.severity === 'Critical' ? '🚨' : '⚠️'}</div>
        <div>
          <div class="act-text"><strong>${a.name}</strong> — ${a.quantity} / ${a.threshold} units</div>
          <div class="act-time">${a.severity} stock level</div>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

// ── Sidebar mobile toggle ─────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ── Doctor name in sidebar ────────────────────────────────────
function populateDoctorInfo(user) {
  const nameEl = document.getElementById('sidebar-doctor-name');
  const clinicEl = document.getElementById('sidebar-clinic');
  if (nameEl) nameEl.textContent = `Dr. ${user.first_name} ${user.last_name}`;
  if (clinicEl) clinicEl.textContent = user.clinic_name || 'Clinic';
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard — redirect if not logged in
  const user = authGuard();
  if (!user) return;

  populateDoctorInfo(user);

  // Bind nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', doLogout);

  // Global search
  document.getElementById('global-search')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    if (q.length > 1 && document.getElementById('page-patients').classList.contains('active')) {
      loadPatients('', q);
    }
  });

  // Start on dashboard
  showPage('dashboard');
});

// ── doLogout (called from auth.js too) ────────────────────────
function doLogout() {
  sessionStorage.clear();
  window.location.href = 'pages/auth.html';
}
