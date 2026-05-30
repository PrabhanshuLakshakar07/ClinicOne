
//  File: js/auth.js
// ============================================================

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('.auth-panel').forEach(p =>
    p.classList.toggle('active', p.id === tab + '-panel')
  );
}

// ── LOGIN ─────────────────────────────────────────────────────
async function doLogin(e) {
  e.preventDefault();
  const btn   = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) { showToast('❌ Enter email and password.', true); return; }

  btnLoading(btn, true);
  try {
    const data = await AuthAPI.login({ email, password: pass });

    // Save token + user to sessionStorage
    sessionStorage.setItem('esehat_token', data.token);
    sessionStorage.setItem('esehat_user',  JSON.stringify(data.doctor));

    showToast(`✅ ${data.message}`);
    setTimeout(() => { window.location.href = '../index.html'; }, 600);
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
    btnLoading(btn, false);
  }
}

// ── REGISTER ──────────────────────────────────────────────────
async function doRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const body = {
    first_name:  document.getElementById('reg-fname').value.trim(),
    last_name:   document.getElementById('reg-lname').value.trim(),
    email:       document.getElementById('reg-email').value.trim(),
    clinic_name: document.getElementById('reg-clinic').value.trim(),
    password:    document.getElementById('reg-pass').value
  };

  if (!body.first_name || !body.last_name || !body.email || !body.clinic_name || !body.password) {
    showToast('❌ All fields are required.', true); return;
  }

  btnLoading(btn, true);
  try {
    await AuthAPI.register(body);
    showToast('✅ Account created! Please login.');
    document.getElementById('register-form').reset();
    switchAuthTab('login');
  } catch (err) {
    showToast(`❌ ${err.message}`, true);
  } finally {
    btnLoading(btn, false);
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
function doLogout() {
  sessionStorage.clear();
  window.location.href = 'pages/auth.html';
}

// ── Guard: redirect if already logged in (auth page) ─────────
if (sessionStorage.getItem('esehat_token')) {
  window.location.href = '../index.html';
}
