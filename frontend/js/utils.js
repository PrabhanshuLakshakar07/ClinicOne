// ============================================================
//  E-SEHAT — Shared Utility Functions
//  File: js/utils.js
// ============================================================

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast-esehat' + (isError ? ' error' : '');
  t.innerHTML = `<span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Status Badge HTML ─────────────────────────────────────────
function statusBadge(status) {
  const map = { 'Active':'green', 'Follow-up':'blue', 'Discharged':'red',
                'Completed':'green', 'Cancelled':'red' };
  return `<span class="badge-esehat ${map[status]||'blue'}">${status}</span>`;
}

// ── Medicine type badge ───────────────────────────────────────
function typeBadge(type, idx = 0) {
  const colors = ['green','blue','yellow','red','purple'];
  return `<span class="badge-esehat ${colors[idx % 5]}">${type}</span>`;
}

// ── Format date nicely ────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Auth guard ────────────────────────────────────────────────
function authGuard() {
  const token = sessionStorage.getItem('esehat_token');
  const user  = sessionStorage.getItem('esehat_user');
  if (!token || !user) {
    window.location.href = 'pages/auth.html';
    return null;
  }
  return JSON.parse(user);
}

// ── Loading row for tables ────────────────────────────────────
function loadingRow(cols) {
  return `<tr class="loading-row"><td colspan="${cols}">
    <span class="spinner"></span>&nbsp; Loading...
  </td></tr>`;
}

function emptyRow(cols, msg = 'No records found.') {
  return `<tr class="loading-row"><td colspan="${cols}" style="color:var(--text3)">${msg}</td></tr>`;
}

// ── Bootstrap modal helpers ───────────────────────────────────
function openBsModal(id) {
  const el = document.getElementById(id);
  if (el) bootstrap.Modal.getOrCreateInstance(el).show();
}
function closeBsModal(id) {
  const el = document.getElementById(id);
  const inst = bootstrap.Modal.getInstance(el);
  if (inst) inst.hide();
}

// ── Set button loading state ──────────────────────────────────
function btnLoading(btn, loading, label = '') {
  if (loading) {
    btn.disabled = true;
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> &nbsp;Please wait...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || label;
  }
}
