// ============================================================
//  E-SEHAT — API Service Layer
//  File: js/api.js
//  Yahan sab backend calls hain — ek jagah sab manage
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ── Helper: get token from sessionStorage ────────────────────
const getToken = () => sessionStorage.getItem('esehat_token') || '';

// ── Core fetch wrapper ───────────────────────────────────────
const request = async (method, endpoint, body = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);

  // Token expired → logout
  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = 'pages/auth.html';
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Shorthand helpers
const get    = (ep)        => request('GET',    ep);
const post   = (ep, body)  => request('POST',   ep, body);
const put    = (ep, body)  => request('PUT',    ep, body);
const del    = (ep)        => request('DELETE', ep);

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
const AuthAPI = {
  login:    (body) => post('/auth/login',    body),
  register: (body) => post('/auth/register', body),
  me:       ()     => get('/auth/me')
};

// ════════════════════════════════════════════════════════════
//  PATIENTS
// ════════════════════════════════════════════════════════════
const PatientAPI = {
  getAll:   (params = '') => get(`/patients${params}`),
  getById:  (id)          => get(`/patients/${id}`),
  search:   (q)           => get(`/patients/search?q=${encodeURIComponent(q)}`),
  stats:    ()            => get('/patients/stats'),
  create:   (body)        => post('/patients',   body),
  update:   (id, body)    => put(`/patients/${id}`, body),
  delete:   (id)          => del(`/patients/${id}`)
};

// ════════════════════════════════════════════════════════════
//  MEDICINES
// ════════════════════════════════════════════════════════════
const MedicineAPI = {
  getAll:   ()         => get('/medicines'),
  getById:  (id)       => get(`/medicines/${id}`),
  create:   (body)     => post('/medicines',    body),
  update:   (id, body) => put(`/medicines/${id}`, body),
  delete:   (id)       => del(`/medicines/${id}`)
};

// ════════════════════════════════════════════════════════════
//  INVENTORY
// ════════════════════════════════════════════════════════════
const InventoryAPI = {
  getAll:         ()     => get('/medicines/inventory'),
  getAlerts:      ()     => get('/medicines/inventory/alerts'),
  restock:        (body) => post('/medicines/inventory/restock',     body),
  updateThreshold:(body) => put('/medicines/inventory/threshold',    body)
};

// ════════════════════════════════════════════════════════════
//  PRESCRIPTIONS
// ════════════════════════════════════════════════════════════
const PrescriptionAPI = {
  getAll:      (params = '') => get(`/prescriptions${params}`),
  getById:     (id)          => get(`/prescriptions/${id}`),
  getByPatient:(pid)         => get(`/prescriptions/patient/${pid}`),
  create:      (body)        => post('/prescriptions',      body),
  update:      (id, body)    => put(`/prescriptions/${id}`, body),
  delete:      (id)          => del(`/prescriptions/${id}`)
};
