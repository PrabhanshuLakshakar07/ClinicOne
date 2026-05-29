// ============================================================
//  E-SEHAT — Medicines Module (Real API)
//  File: js/medicines.js
// ============================================================

let allMedicines = []; // local cache for prescription dropdown

// ── LOAD & RENDER ─────────────────────────────────────────────
async function loadMedicines(q = '') {
  const grid = document.getElementById('med-grid');
  grid.innerHTML = `<div class="col-12 text-center py-5" style="color:var(--text3)"><span class="spinner"></span> Loading medicines...</div>`;

  try {
    const data = await MedicineAPI.getAll();
    allMedicines = data.medicines;
    const filtered = q
      ? allMedicines.filter(m =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.type.toLowerCase().includes(q.toLowerCase()) ||
          (m.usage_desc || '').toLowerCase().includes(q.toLowerCase())
        )
      : allMedicines;
    renderMedicines(filtered);
    populateMedDropdowns(); // keep prescription dropdown updated
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center py-4" style="color:var(--accent3)">❌ ${err.message}</div>`;
  }
}

function renderMedicines(list) {
  const grid = document.getElementById('med-grid');
  if (!list || !list.length) {
    grid.innerHTML = `<div class="col-12 text-center py-5" style="color:var(--text3)">No medicines found.</div>`;
    return;
  }
  grid.innerHTML = list.map((m, i) => `
    <div class="col-xl-4 col-md-6">
      <div class="med-card">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="med-name">${m.name}</div>
            <div class="med-type">${m.type} · ${m.manufacturer || 'Unknown'}</div>
          </div>
          ${typeBadge(m.type, i)}
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:10px;min-height:36px">${m.usage_desc || '—'}</div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <span class="med-dosage">💊 ${m.dosage || '—'}</span>
          <div class="d-flex gap-1">
            <button class="btn-esehat outline sm" onclick="openEditMedicine(${m.id})">Edit</button>
            <button class="btn-esehat danger  sm" onclick="confirmDeleteMedicine(${m.id},'${m.name}')">Del</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── ADD MEDICINE ──────────────────────────────────────────────
async function addMedicine(e) {
  e.preventDefault();
  const btn  = document.getElementById('add-med-btn');
  const body = {
    name:         document.getElementById('m-name').value.trim(),
    type:         document.getElementById('m-type').value,
    dosage:       document.getElementById('m-dose').value.trim(),
    manufacturer: document.getElementById('m-mfr').value.trim(),
    usage_desc:   document.getElementById('m-use').value.trim(),
    initial_qty:  parseInt(document.getElementById('m-qty').value) || 0,
    threshold:    parseInt(document.getElementById('m-threshold').value) || 20
  };

  if (!body.name) { showToast('❌ Medicine name is required.', true); return; }

  btnLoading(btn, true);
  try {
    const data = await MedicineAPI.create(body);
    showToast(`✅ ${data.message}`);
    closeBsModal('addMedModal');
    document.getElementById('add-med-form').reset();
    loadMedicines();
    loadInventory();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── EDIT MEDICINE ─────────────────────────────────────────────
let editingMedId = null;

async function openEditMedicine(id) {
  editingMedId = id;
  try {
    const { medicine } = await MedicineAPI.getById(id);
    document.getElementById('em-name').value = medicine.name;
    document.getElementById('em-type').value = medicine.type;
    document.getElementById('em-dose').value = medicine.dosage || '';
    document.getElementById('em-mfr').value  = medicine.manufacturer || '';
    document.getElementById('em-use').value  = medicine.usage_desc || '';
    openBsModal('editMedModal');
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

async function saveEditMedicine(e) {
  e.preventDefault();
  if (!editingMedId) return;
  const btn  = document.getElementById('edit-med-btn');
  const body = {
    name:         document.getElementById('em-name').value.trim(),
    type:         document.getElementById('em-type').value,
    dosage:       document.getElementById('em-dose').value.trim(),
    manufacturer: document.getElementById('em-mfr').value.trim(),
    usage_desc:   document.getElementById('em-use').value.trim()
  };

  btnLoading(btn, true);
  try {
    const data = await MedicineAPI.update(editingMedId, body);
    showToast(`✅ ${data.message}`);
    closeBsModal('editMedModal');
    loadMedicines();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── DELETE ────────────────────────────────────────────────────
function confirmDeleteMedicine(id, name) {
  if (!confirm(`Delete "${name}" and its inventory? Cannot be undone.`)) return;
  deleteMedicine(id, name);
}

async function deleteMedicine(id, name) {
  try {
    const data = await MedicineAPI.delete(id);
    showToast(`🗑️ ${data.message}`);
    loadMedicines();
    loadInventory();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

// ── Populate prescription medicine dropdown ───────────────────
function populateMedDropdowns() {
  document.querySelectorAll('.med-select-rx').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = `<option value="">-- Select Medicine --</option>` +
      allMedicines.map(m => `<option value="${m.id}" data-name="${m.name}" data-dosage="${m.dosage || ''}">${m.name}</option>`).join('');
    if (current) sel.value = current;
  });
}

// search debounce
let medSearchTimeout;
function onMedSearch(q) {
  clearTimeout(medSearchTimeout);
  medSearchTimeout = setTimeout(() => loadMedicines(q), 300);
}
