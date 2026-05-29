// ============================================================
//  E-SEHAT — Prescriptions Module (Real API)
//  File: js/prescriptions.js
// ============================================================

let rxMedItems = []; // medicine rows being added

// ── LOAD & RENDER ─────────────────────────────────────────────
async function loadPrescriptions() {
  const tbody = document.getElementById('rx-tbody');
  tbody.innerHTML = loadingRow(6);

  try {
    const data = await PrescriptionAPI.getAll();
    renderPrescriptions(data.prescriptions);

    // Update dashboard stat
    const el = document.getElementById('dash-rx-count');
    if (el) el.textContent = data.total || 0;
  } catch (err) {
    tbody.innerHTML = emptyRow(6, `❌ ${err.message}`);
  }
}

function renderPrescriptions(list) {
  const tbody = document.getElementById('rx-tbody');
  if (!list || !list.length) {
    tbody.innerHTML = emptyRow(6, 'No prescriptions yet. Create one from a patient record.');
    return;
  }
  tbody.innerHTML = list.map(rx => `
    <tr>
      <td><span class="rx-code">${rx.rx_code}</span></td>
      <td>
        <div class="td-primary">${rx.patient_name}</div>
        <div class="td-mono">#${rx.patient_code}</div>
      </td>
      <td style="max-width:200px;font-size:13px">${rx.diagnosis}</td>
      <td><span class="badge-esehat blue">💊 ${rx.medicine_count} item${rx.medicine_count !== 1 ? 's' : ''}</span></td>
      <td>${statusBadge(rx.status)}</td>
      <td style="font-size:12px;color:var(--text3)">${fmtDate(rx.created_at)}</td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn-esehat outline sm" onclick="viewRx(${rx.id})">View</button>
          <button class="btn-esehat danger  sm" onclick="confirmDeleteRx(${rx.id},'${rx.rx_code}')">Del</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── VIEW PRESCRIPTION ─────────────────────────────────────────
async function viewRx(id) {
  try {
    const { prescription: rx } = await PrescriptionAPI.getById(id);

    document.getElementById('view-rx-code').textContent    = rx.rx_code;
    document.getElementById('view-rx-patient').textContent = `${rx.patient_name} (#${rx.patient_code})`;
    document.getElementById('view-rx-age').textContent     = `${rx.age} yrs / ${rx.gender}  ·  Blood: ${rx.blood_group || '—'}`;
    document.getElementById('view-rx-phone').textContent   = rx.phone || '—';
    document.getElementById('view-rx-diag').textContent    = rx.diagnosis;
    document.getElementById('view-rx-notes').textContent   = rx.notes || '—';
    document.getElementById('view-rx-followup').textContent= fmtDate(rx.follow_up_date);
    document.getElementById('view-rx-date').textContent    = fmtDate(rx.created_at);
    document.getElementById('view-rx-status').innerHTML    = statusBadge(rx.status);

    // Medicine items
    document.getElementById('view-rx-items').innerHTML = (rx.items || []).map(item => `
      <div class="rx-item-row">
        <div>
          <strong style="color:var(--text)">${item.medicine_name}</strong>
          <span class="ms-2" style="color:var(--text3);font-size:11px">${item.dosage || ''}</span>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--text2)">
          <div>${item.frequency || '—'}</div>
          <div>${item.duration || '—'} · Qty: ${item.quantity}</div>
          ${item.instructions ? `<div style="color:var(--accent4)">${item.instructions}</div>` : ''}
        </div>
      </div>
    `).join('') || '<div style="color:var(--text3)">No medicines listed.</div>';

    // Status update select
    document.getElementById('view-rx-status-sel').value = rx.status;
    document.getElementById('view-rx-id-hidden').value  = rx.id;

    openBsModal('viewRxModal');
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

// ── UPDATE STATUS from view modal ─────────────────────────────
async function updateRxStatus() {
  const id     = document.getElementById('view-rx-id-hidden').value;
  const status = document.getElementById('view-rx-status-sel').value;
  try {
    const data = await PrescriptionAPI.update(id, { status });
    showToast(`✅ Status updated to "${status}"`);
    closeBsModal('viewRxModal');
    loadPrescriptions();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

// ── ADD PRESCRIPTION MODAL ────────────────────────────────────
async function openAddRxModal() {
  // Load patients into dropdown
  try {
    const data = await PatientAPI.getAll('?limit=200');
    const sel  = document.getElementById('rx-patient-id');
    sel.innerHTML = `<option value="">-- Select Patient --</option>` +
      data.patients.map(p =>
        `<option value="${p.id}">${p.first_name} ${p.last_name} (#${p.patient_code})</option>`
      ).join('');
  } catch (err) { /* ignore */ }

  // Reset medicine rows
  rxMedItems = [];
  document.getElementById('rx-med-rows').innerHTML = '';
  addRxMedRow(); // start with 1 empty row

  openBsModal('addRxModal');
}

// ── ADD MEDICINE ROW ──────────────────────────────────────────
function addRxMedRow() {
  const idx     = rxMedItems.length;
  rxMedItems.push({ medicine_id: '', medicine_name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' });

  const medOptions = allMedicines.map(m =>
    `<option value="${m.id}" data-name="${m.name}" data-dosage="${m.dosage || ''}">${m.name}</option>`
  ).join('');

  const row = document.createElement('div');
  row.className  = 'med-item-row';
  row.id         = `med-row-${idx}`;
  row.innerHTML  = `
    <button type="button" class="remove-med-btn" onclick="removeRxMedRow(${idx})">✕</button>
    <div class="row g-2">
      <div class="col-md-5">
        <label class="form-label-esehat">Medicine *</label>
        <select class="form-control-esehat med-select-rx" onchange="onRxMedSelect(this,${idx})">
          <option value="">-- Select --</option>
          ${medOptions}
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label-esehat">Dosage</label>
        <input type="text" class="form-control-esehat" id="rx-dosage-${idx}" placeholder="e.g. 500mg">
      </div>
      <div class="col-md-2">
        <label class="form-label-esehat">Qty</label>
        <input type="number" class="form-control-esehat" id="rx-qty-${idx}" value="1" min="1">
      </div>
      <div class="col-md-2">
        <label class="form-label-esehat">Duration</label>
        <input type="text" class="form-control-esehat" id="rx-dur-${idx}" placeholder="5 days">
      </div>
      <div class="col-md-6">
        <label class="form-label-esehat">Frequency</label>
        <input type="text" class="form-control-esehat" id="rx-freq-${idx}" placeholder="2x daily after meals">
      </div>
      <div class="col-md-6">
        <label class="form-label-esehat">Special Instructions</label>
        <input type="text" class="form-control-esehat" id="rx-inst-${idx}" placeholder="Take with water">
      </div>
    </div>
  `;
  document.getElementById('rx-med-rows').appendChild(row);
}

function onRxMedSelect(sel, idx) {
  const opt = sel.options[sel.selectedIndex];
  rxMedItems[idx].medicine_id   = sel.value;
  rxMedItems[idx].medicine_name = opt.dataset.name || '';
  // Auto-fill dosage
  const dosageEl = document.getElementById(`rx-dosage-${idx}`);
  if (dosageEl && opt.dataset.dosage) dosageEl.value = opt.dataset.dosage;
}

function removeRxMedRow(idx) {
  const row = document.getElementById(`med-row-${idx}`);
  if (row) row.remove();
  rxMedItems[idx] = null; // mark as removed
}

// ── SAVE PRESCRIPTION ─────────────────────────────────────────
async function savePrescription(e) {
  e.preventDefault();
  const btn = document.getElementById('save-rx-btn');

  const patientId   = document.getElementById('rx-patient-id').value;
  const diagnosis   = document.getElementById('rx-diagnosis').value.trim();
  const notes       = document.getElementById('rx-notes').value.trim();
  const followUpDate= document.getElementById('rx-followup').value;

  if (!patientId)  { showToast('❌ Select a patient.', true);   return; }
  if (!diagnosis)  { showToast('❌ Enter a diagnosis.', true);   return; }

  // Collect medicine items from DOM
  const items = [];
  rxMedItems.forEach((item, idx) => {
    if (!item) return; // removed
    const medSel = document.querySelector(`#med-row-${idx} .med-select-rx`);
    if (!medSel || !medSel.value) return;
    items.push({
      medicine_id:   parseInt(medSel.value),
      medicine_name: medSel.options[medSel.selectedIndex].dataset.name || medSel.options[medSel.selectedIndex].text,
      dosage:        document.getElementById(`rx-dosage-${idx}`)?.value.trim() || '',
      frequency:     document.getElementById(`rx-freq-${idx}`)?.value.trim()   || '',
      duration:      document.getElementById(`rx-dur-${idx}`)?.value.trim()    || '',
      quantity:      parseInt(document.getElementById(`rx-qty-${idx}`)?.value) || 1,
      instructions:  document.getElementById(`rx-inst-${idx}`)?.value.trim()   || ''
    });
  });

  if (!items.length) { showToast('❌ Add at least one medicine.', true); return; }

  btnLoading(btn, true);
  try {
    const data = await PrescriptionAPI.create({
      patient_id: parseInt(patientId), diagnosis, notes,
      follow_up_date: followUpDate || null, items
    });
    showToast(`✅ ${data.message}`);
    closeBsModal('addRxModal');
    document.getElementById('add-rx-form').reset();
    loadPrescriptions();
    loadInventory(); // qty deducted
    loadDashboardStats();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── DELETE ────────────────────────────────────────────────────
function confirmDeleteRx(id, code) {
  if (!confirm(`Delete prescription ${code}? This cannot be undone.`)) return;
  PrescriptionAPI.delete(id)
    .then(d => { showToast(`🗑️ ${d.message}`); loadPrescriptions(); })
    .catch(e => showToast(`❌ ${e.message}`, true));
}
