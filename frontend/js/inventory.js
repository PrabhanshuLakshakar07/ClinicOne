
//  File: js/inventory.js
// ============================================================

// ── LOAD & RENDER ─────────────────────────────────────────────
async function loadInventory() {
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = loadingRow(7);

  try {
    const data = await InventoryAPI.getAll();
    renderInventory(data.inventory);

    // Update alert badge in sidebar
    const badge = document.getElementById('inv-alert-badge');
    if (badge) badge.textContent = data.alerts || 0;

    // Show/hide banner
    const banner = document.getElementById('inv-alert-banner');
    if (banner) banner.style.display = data.alerts > 0 ? 'flex' : 'none';

    // Update dashboard alert count
    const statEl = document.getElementById('dash-alert-count');
    if (statEl) statEl.textContent = data.alerts;
  } catch (err) {
    tbody.innerHTML = emptyRow(7, `❌ ${err.message}`);
  }
}

function renderInventory(list) {
  const tbody = document.getElementById('inventory-tbody');
  if (!list || !list.length) {
    tbody.innerHTML = emptyRow(7, 'No inventory records found.');
    return;
  }

  tbody.innerHTML = list.map(item => {
    const max       = item.threshold * 4;
    const pct       = Math.min(100, Math.round((item.quantity / max) * 100));
    const isCrit    = item.stock_status === 'Critical';
    const isLow     = item.stock_status === 'Low';
    const fillCls   = isCrit ? 'low' : isLow ? 'mid' : 'high';
    const qtyColor  = isCrit ? 'var(--accent3)' : isLow ? 'var(--accent4)' : 'var(--accent)';
    const statusHtml = isCrit
      ? `<span class="badge-esehat red">🚨 Critical</span>`
      : isLow
        ? `<span class="badge-esehat yellow">⚠️ Low</span>`
        : `<span class="badge-esehat green">✓ OK</span>`;

    return `
      <tr>
        <td class="td-primary">${item.name}</td>
        <td><span class="badge-esehat blue">${item.category}</span></td>
        <td style="min-width:150px">
          <div style="font-weight:600;color:${qtyColor}">${item.quantity} units</div>
          <div class="inv-bar"><div class="inv-fill ${fillCls}" style="width:${pct}%"></div></div>
        </td>
        <td style="color:var(--text3);font-size:13px">${item.threshold} units</td>
        <td>${statusHtml}</td>
        <td style="font-size:12px;color:var(--text3)">${fmtDate(item.last_restocked)}</td>
        <td>
          <button class="btn-esehat outline sm" onclick="quickRestock(${item.medicine_id},'${item.name}')">
            + Restock
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ── QUICK RESTOCK (+50) ───────────────────────────────────────
async function quickRestock(medicineId, name) {
  try {
    const data = await InventoryAPI.restock({ medicine_id: medicineId, quantity_to_add: 50 });
    showToast(`📦 ${data.message}`);
    loadInventory();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  }
}

// ── FULL RESTOCK MODAL ────────────────────────────────────────
async function openRestockModal() {
  // populate medicine dropdown from inventory
  try {
    const data = await InventoryAPI.getAll();
    const sel  = document.getElementById('restock-med');
    sel.innerHTML = data.inventory.map(i =>
      `<option value="${i.medicine_id}">${i.name} (${i.quantity} units)</option>`
    ).join('');
  } catch (err) { /* ignore */ }
  openBsModal('restockModal');
}

async function doRestock(e) {
  e.preventDefault();
  const btn  = document.getElementById('restock-btn');
  const body = {
    medicine_id:     parseInt(document.getElementById('restock-med').value),
    quantity_to_add: parseInt(document.getElementById('restock-qty').value)
  };

  if (!body.medicine_id || !body.quantity_to_add || body.quantity_to_add <= 0) {
    showToast('❌ Select medicine and enter valid quantity.', true); return;
  }

  btnLoading(btn, true);
  try {
    const data = await InventoryAPI.restock(body);
    showToast(`📦 ${data.message}`);
    closeBsModal('restockModal');
    document.getElementById('restock-form').reset();
    loadInventory();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── SAVE THRESHOLDS ───────────────────────────────────────────
async function saveThresholds(e) {
  e.preventDefault();
  const btn       = document.getElementById('threshold-btn');
  const threshold = parseInt(document.getElementById('thresh-default').value);

  if (!threshold || threshold < 0) { showToast('❌ Enter a valid threshold.', true); return; }

  btnLoading(btn, true);
  try {
    const data = await InventoryAPI.updateThreshold({ threshold });
    showToast(`✅ ${data.message}`);
    closeBsModal('thresholdModal');
    loadInventory();
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}
