// ============================================================
//  E-SEHAT — Patients Module (Real API)
//  File: js/patients.js
// ============================================================

// ── LOAD & RENDER ─────────────────────────────────────────────
async function loadPatients(status = '', q = '') {
  const tbody = document.getElementById('patients-tbody');
  tbody.innerHTML = loadingRow(7);

  try {
    let data;
    if (q.trim()) {
      data = await PatientAPI.search(q);
      renderPatients(data.patients);
    } else {
      const qs = status ? `?status=${status}` : '';
      data = await PatientAPI.getAll(qs);
      renderPatients(data.patients);
    }
  } catch (err) {
    tbody.innerHTML = emptyRow(7, `❌ ${err.message}`);
  }
}

function renderPatients(list) {
  const tbody = document.getElementById('patients-tbody');
  if (!list || !list.length) {
    tbody.innerHTML = emptyRow(7, 'No patients found.');
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td><span class="td-mono">#${p.patient_code}</span></td>
      <td class="td-primary">${p.first_name} ${p.last_name}</td>
      <td>${p.age} / ${p.gender}</td>
      <td>${p.condition_desc || '—'}</td>
      <td style="font-size:12px;color:var(--text3)">${fmtDate(p.last_visit)}</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn-esehat outline sm" onclick="openRxForPatient(${p.id},'${p.first_name} ${p.last_name}')">📋 Rx</button>
          <button class="btn-esehat outline sm" onclick="openEditPatient(${p.id})">Edit</button>
          <button class="btn-esehat danger  sm" onclick="confirmDeletePatient(${p.id},'${p.first_name} ${p.last_name}')">Del</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── ADD PATIENT ───────────────────────────────────────────────
async function addPatient(e) {
  e.preventDefault();
  const btn  = document.getElementById('add-patient-btn');
  const body = {
    first_name:    document.getElementById('p-fname').value.trim(),
    last_name:     document.getElementById('p-lname').value.trim(),
    age:           document.getElementById('p-age').value,
    gender:        document.getElementById('p-gender').value,
    phone:         document.getElementById('p-phone').value.trim(),
    blood_group:   document.getElementById('p-blood').value,
    condition_desc:document.getElementById('p-condition').value.trim(),
    medical_notes: document.getElementById('p-notes').value.trim(),
    status:        document.getElementById('p-status').value
  };

  if (!body.first_name || !body.last_name || !body.age || !body.condition_desc) {
    showToast('❌ Required fields missing.', true); return;
  }

  btnLoading(btn, true);
  try {
    const data = await PatientAPI.create(body);
    showToast(`✅ ${data.message}`);
    closeBsModal('addPatientModal');
    document.getElementById('add-patient-form').reset();
    loadPatients();
    loadDashboardStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── EDIT PATIENT ──────────────────────────────────────────────
let editingPatientId = null;

async function openEditPatient(id) {
  editingPatientId = id;
  try {
    const { patient } = await PatientAPI.getById(id);
    document.getElementById('ep-fname').value     = patient.first_name;
    document.getElementById('ep-lname').value     = patient.last_name;
    document.getElementById('ep-age').value       = patient.age;
    document.getElementById('ep-gender').value    = patient.gender;
    document.getElementById('ep-phone').value     = patient.phone || '';
    document.getElementById('ep-blood').value     = patient.blood_group || 'A+';
    document.getElementById('ep-condition').value = patient.condition_desc;
    document.getElementById('ep-notes').value     = patient.medical_notes || '';
    document.getElementById('ep-status').value    = patient.status;
    openBsModal('editPatientModal');
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

async function saveEditPatient(e) {
  e.preventDefault();
  if (!editingPatientId) return;
  const btn  = document.getElementById('edit-patient-btn');
  const body = {
    first_name:    document.getElementById('ep-fname').value.trim(),
    last_name:     document.getElementById('ep-lname').value.trim(),
    age:           document.getElementById('ep-age').value,
    gender:        document.getElementById('ep-gender').value,
    phone:         document.getElementById('ep-phone').value.trim(),
    blood_group:   document.getElementById('ep-blood').value,
    condition_desc:document.getElementById('ep-condition').value.trim(),
    medical_notes: document.getElementById('ep-notes').value.trim(),
    status:        document.getElementById('ep-status').value
  };

  btnLoading(btn, true);
  try {
    const data = await PatientAPI.update(editingPatientId, body);
    showToast(`✅ ${data.message}`);
    closeBsModal('editPatientModal');
    loadPatients();
    loadDashboardStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── DELETE ────────────────────────────────────────────────────
function confirmDeletePatient(id, name) {
  if (!confirm(`Delete patient "${name}"? This action cannot be undone.`)) return;
  deletePatient(id, name);
}

async function deletePatient(id, name) {
  try {
    const data = await PatientAPI.delete(id);
    showToast(`🗑️ ${data.message}`);
    loadPatients();
    loadDashboardStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

// ── FILTER HANDLER ────────────────────────────────────────────
let searchTimeout;
function onPatientSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q      = document.getElementById('patient-search').value;
    const status = document.getElementById('status-filter').value;
    loadPatients(status, q);
  }, 400);
}

// ── Open Rx modal pre-filled for this patient ─────────────────
function openRxForPatient(patientId, patientName) {
  showPage('prescriptions');
  setTimeout(() => {
    const sel = document.getElementById('rx-patient-id');
    if (sel) { sel.value = patientId; }
    openBsModal('addRxModal');
  }, 300);
}
