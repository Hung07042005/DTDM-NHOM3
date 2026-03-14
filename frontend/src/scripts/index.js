/* ── MODAL ── */
function openModal(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show'));
    const el = document.getElementById('ov-' + id);
    if (el) el.classList.add('show');
}
function closeModal(id) {
    const el = document.getElementById('ov-' + id);
    if (el) el.classList.remove('show');
}
document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('show') });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
});

/* ── CARD DETAIL ── */
function openCardDetail(title, sub, desc) {
    document.getElementById('cd-title').textContent = title;
    document.getElementById('cd-sub').textContent = sub;
    document.getElementById('cd-desc').value = desc;
    openModal('card-detail');
}

/* ── SIDEBAR ACTIVE ── */
function setActive(el) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

/* ── FILTER PILL ── */
function toggleFilter(el) {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}

/* ── PRIORITY ── */
function selPrio(btn, type) {
    const wrap = btn.closest('.prio-row');
    wrap.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('sel-high', 'sel-med', 'sel-low'));
    btn.classList.add('sel-' + type);
}

/* ── IMPORT SOURCE ── */
function selImport(el) {
    document.querySelectorAll('.import-src').forEach(s => {
        s.classList.remove('sel');
        Array.from(s.children).forEach(child => {
            if (child.textContent === '✓') child.remove();
        });
    });
    el.classList.add('sel');
    const tick = document.createElement('div');
    tick.style.cssText = 'margin-left:auto;width:20px;height:20px;border-radius:50%;background:var(--sky);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700';
    tick.textContent = '✓';
    el.appendChild(tick);
}

/* ── CHECKLIST ── */
function toggleCheck(el) {
    const box = el.querySelector('.check-box');
    const lbl = el.querySelector('.check-label');
    box.classList.toggle('checked');
    box.textContent = box.classList.contains('checked') ? '✓' : '';
    lbl.classList.toggle('done');
}

/* ── SETTINGS TABS ── */
function switchTab(el, id) {
    document.querySelectorAll('.stab-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.stab-pane-inner').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('sp-' + id);
    if (pane) pane.classList.add('active');
}

/* ── CALENDAR ── */
let calYear = 2026, calMonth = 2;
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const taskDays = { 12: true, 13: true, 14: true, 15: true, 17: true, 18: true, 19: true, 20: true, 22: true };
function renderCal() {
    const grid = document.getElementById('cal-grid');
    document.getElementById('cal-month-label').textContent = `${months[calMonth]} ${calYear}`;
    const heads = grid.querySelectorAll('.cal-head');
    grid.innerHTML = '';
    heads.forEach(h => grid.appendChild(h.cloneNode(true)));
    const first = new Date(calYear, calMonth, 1).getDay();
    const days = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    for (let i = 0; i < first; i++) {
        const d = document.createElement('div'); d.className = 'cal-day other-month'; d.textContent = prevDays - first + i + 1; grid.appendChild(d);
    }
    const today = new Date();
    for (let i = 1; i <= days; i++) {
        const d = document.createElement('div'); d.className = 'cal-day'; d.textContent = i;
        if (calYear === today.getFullYear() && calMonth === today.getMonth() && i === today.getDate()) d.classList.add('today');
        if (calMonth === 2 && taskDays[i]) d.classList.add('has-task');
        d.onclick = () => toast(`calendar ${months[calMonth]} ${i}, ${calYear}`);
        grid.appendChild(d);
    }
    const rem = (first + days) % 7;
    if (rem > 0) for (let i = 1; i <= 7 - rem; i++) { const d = document.createElement('div'); d.className = 'cal-day other-month'; d.textContent = i; grid.appendChild(d); }
}
function changeMonth(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } else if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }
renderCal();

/* ── TOAST ── */
let _t;
function toast(msg) {
    const t = document.getElementById('toast');
    const icons = {
        'circle-check': true,
        'x': true,
        'triangle-alert': true,
        'clipboard-minus': true,
        'link': true,
        'message-circle': true,
        'mail': true,
        'folder': true,
        'mail-open': true,      // 📨
        'bar-chart': true,      // 📊
        'inbox': true,          // 📥
        'hand': true,           // 👋
        'camera': true,         // 📸
        'folder-open': true,    // 📂
        'paperclip': true,      // 📎
        'globe': true,          // 🌐
        'smartphone': true,     // 📱
        'palette': true,        // 🎨
        'plug': true,           // 🔌
        'calendar': true,
        'arrow-up': true,       // ⬆
        'user': true,           // 👤
        'trash': true,           // 🗑
        'file-text': true,        // 📄
        'moon': true,
        'sun': true,
        'pencil': true,          // ✏️
    };
    const m = msg.match(/^([\u{1F300}-\u{1FFFF}][\uFE0F]?|[\u2600-\u27BF][\uFE0F]?|[⬆⬇])/u);
    document.getElementById('toast-icon').textContent = m ? m[0] : 'ℹ️';
    document.getElementById('toast-msg').textContent = m ? msg.slice(m[0].length).trim() : msg;
    t.classList.add('show');
    clearTimeout(_t); _t = setTimeout(() => t.classList.remove('show'), 2500);
}
const svgString = lucide.icons['bell'].toSvg({
    width: 24,
    height: 24,
    color: '#4eb5f7',
    'stroke-width': 1.5
});


document.getElementById('my-div').innerHTML = svgString;