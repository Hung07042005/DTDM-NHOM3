/* ── PAGE ROUTING ── */
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : `${window.location.protocol}//${window.location.hostname}:8000/api`;

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || 'Request failed');
    }
    return data;
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
}
function goToRegister() {
    showPage('register');
    setRegStep(1);
}
function goToLogin() { showPage('login'); }

/* ── LOGIN TAB ── */
function showTab(t) {
    document.querySelectorAll('.auth-tab').forEach((b, i) => {
        b.classList.toggle('active', (i === 0 && t === 'login') || (i === 1 && t !== 'login'));
    });
    if (t !== 'login') goToRegister();
}

/* ── SOCIAL LOGIN ── */
function socialLogin(provider) {
    if (provider === 'Google') {
        window.location.href = 'http://localhost:8000/login/google';
    }
    if (provider === 'GitHub') {
        window.location.href = 'http://localhost:8000/login/github';
    }
}

/* ── LOGIN ── */
async function doLogin() {
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-pw').value;
    if (!email || !pw) { showToast('Please fill in all fields'); return; }

    btn.classList.add('loading');
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password: pw,
            }),
        });
        localStorage.setItem('taskflow-user', JSON.stringify(data.user));
        btn.classList.remove('loading');
        showToast(`Welcome back, ${data.user.name || 'User'}!`);
        setTimeout(() => goToApp(), 800);
    } catch (error) {
        btn.classList.remove('loading');
        showToast(error.message);
    }
}

/* ── REGISTER STEPS ── */
let currentStep = 1;
function setRegStep(n) {
    currentStep = n;
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById('step-' + i);
        const panel = document.getElementById('reg-step-' + i);
        step.classList.remove('active', 'done');
        if (i < n) { step.classList.add('done'); step.querySelector('.step-num').textContent = '✓'; }
        if (i === n) { step.classList.add('active'); step.querySelector('.step-num').textContent = i; }
        if (i > n) { step.querySelector('.step-num').textContent = i; }
        panel.classList.toggle('active', i === n);
        if (i < 3) {
            const line = document.getElementById('line-' + i);
            if (line) line.classList.toggle('done', i < n);
        }
    }
    const titles = ['Create your account', 'Set up your profile'];
    const subs = [
        'Already have an account? <a onclick="goToLogin()">Sign in</a>',
        'Tell us a bit about yourself',
        'Choose how you want to work'
    ];
    document.getElementById('reg-title').textContent = titles[n - 1];
    document.getElementById('reg-sub').innerHTML = subs[n - 1];
}

function nextStep(n) {
    if (n === 2) {
        const email = document.getElementById('reg-email').value.trim();
        const pw = document.getElementById('reg-pw').value;
        const fname = document.getElementById('reg-fname').value.trim();
        if (!fname || !email || !pw) { showToast('Please complete all fields'); return; }
        if (!document.getElementById('agree').checked) { showToast('Please accept the terms'); return; }
    }
    setRegStep(n);
    document.querySelector('.auth-right').scrollTop = 0;
}

async function doRegister() {
    const btn = document.getElementById('reg-submit-btn');
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-pw').value;
    const fname = document.getElementById('reg-fname').value.trim();
    const lname = document.getElementById('reg-lname').value.trim();

    if (!fname || !email || !pw) { showToast('Please complete all fields'); return; }
    if (!document.getElementById('agree').checked) { showToast('Please accept the terms'); return; }

    btn.classList.add('loading');

    try {
        const fullName = `${fname} ${lname}`.trim();
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: fullName,
                email,
                password: pw,
            }),
        });
        localStorage.setItem('taskflow-user', JSON.stringify(data.user));
        btn.classList.remove('loading');
        showToast('Account created! Welcome to TaskFlow!');
        setTimeout(() => goToApp(), 1000);
    } catch (error) {
        btn.classList.remove('loading');
        showToast(error.message);
    }
}

/* ── GO TO APP ── */
function goToApp() {
    // Redirect to the main app (Home.html)
    window.location.href = 'Home.html';
}

/* ── VALIDATE EMAIL ── */
function validateEmail(input) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    const iconId = input.id === 'login-email' ? 'login-email-icon' : 'reg-email-icon';
    const icon = document.getElementById(iconId);
    if (input.value.length === 0) {
        input.className = 'form-input'; icon.textContent = 'email'; return;
    }
    input.className = 'form-input ' + (valid ? 'success' : 'error');
    icon.textContent = valid ? '' : 'x';
}

/* ── PASSWORD STRENGTH ── */
function checkStrength(val) {
    const bars = ['pb1', 'pb2', 'pb3', 'pb4'];
    bars.forEach(id => { document.getElementById(id).className = 'pw-bar'; });
    const lbl = document.getElementById('pw-label');
    if (!val) { lbl.className = 'pw-label'; lbl.textContent = 'Enter a password'; return; }
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        { bars: 1, cls: 'weak', text: 'Too weak' },
        { bars: 2, cls: 'fair', text: 'Fair' },
        { bars: 3, cls: 'strong', text: 'Good' },
        { bars: 4, cls: 'strong', text: 'Strong' },
    ];
    const lvl = levels[Math.max(0, score - 1)];
    for (let i = 0; i < lvl.bars; i++) document.getElementById(bars[i]).classList.add(lvl.cls);
    lbl.className = 'pw-label ' + lvl.cls;
    lbl.textContent = lvl.text;
}

/* ── TOGGLE PASSWORD VISIBILITY ── */
function togglePw(inputId, iconId) {
    const input = document.getElementById(inputId);
    const iconSpan = document.getElementById(iconId);
    const icon = iconSpan.querySelector('i');
    const shown = input.type === 'text';
    input.type = shown ? 'password' : 'text';
    icon.setAttribute('data-lucide', shown ? 'eye' : 'eye-off');
}

/* ── AVATAR SELECTOR ── */
function selectAv(el) {
    el.closest('.avatar-grid').querySelectorAll('.av-option').forEach(a => a.classList.remove('sel'));
    el.classList.add('sel');
}

/* ── PLAN SELECTOR ── */
function selectPlan(el) {
    el.closest('.plan-grid').querySelectorAll('.plan-card').forEach(p => p.classList.remove('sel'));
    el.classList.add('sel');
}

/* ── FORGOT PASSWORD ── */
function showForgot() {
    document.getElementById('forgot-overlay').classList.add('show');
    document.getElementById('forgot-success').style.display = 'none';
}
function hideForgot() { document.getElementById('forgot-overlay').classList.remove('show'); }
function sendReset() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showToast('Enter your email first'); return; }
    const btn = document.querySelector('.forgot-card .btn-submit');
    btn.classList.add('loading');
    setTimeout(() => {
        btn.classList.remove('loading');
        const el = document.getElementById('forgot-success');
        el.style.display = 'flex';
        showToast('Reset link sent to ' + email);
        setTimeout(hideForgot, 2000);
    }, 1500);
}

/* ── TOAST ── */
let _tt;
function showToast(msg) {
    const toast = document.getElementById('toast');
    const emoji = msg.match(/^([\u{1F000}-\u{1FFFF}][\uFE0F\u20E3]?|[\u2600-\u27BF][\uFE0F]?|\S+\s)/u);
    document.getElementById('toast-icon').textContent = emoji ? emoji[0] : 'ℹ';
    document.getElementById('toast-msg').textContent = msg.replace(/^([\u{1F000}-\u{1FFFF}][\uFE0F\u20E3]?|[\u2600-\u27BF][\uFE0F]?|\S+\s)/u, '').trim();
    toast.classList.add('show');
    clearTimeout(_tt);
    _tt = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── KEYBOARD ── */
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const page = document.querySelector('.page.active');
        if (page.id === 'page-login') doLogin();
    }
    if (e.key === 'Escape') hideForgot();
});