/* ── MODAL ── */
function openModal(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('show'));
    const el = document.getElementById('ov-' + id);
    if (el) { el.classList.add('show'); lucide.createIcons(); }
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
    btn.closest('.prio-row').querySelectorAll('.prio-btn').forEach(b => b.classList.remove('sel-high', 'sel-med', 'sel-low'));
    btn.classList.add('sel-' + type);
}

/* ── IMPORT ── */
function selImport(el) {
    document.querySelectorAll('.import-src').forEach(s => s.classList.remove('sel'));
    el.classList.add('sel');
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

/* ── ACTIVITY FILTER ── */
function actFilter(el) {
    document.querySelectorAll('.act-fpill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    toast('Filtering: ' + el.textContent.trim());
}

/* ── CALENDAR ── */
let calYear = 2026, calMonth = 2;
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const taskDays = { 12: 1, 13: 1, 14: 1, 15: 1, 17: 1, 18: 1, 19: 1, 20: 1, 22: 1 };
function renderCal() {
    const grid = document.getElementById('cal-grid');
    document.getElementById('cal-month-label').textContent = `${months[calMonth]} ${calYear}`;
    const heads = Array.from(grid.querySelectorAll('.cal-head'));
    grid.innerHTML = '';
    heads.forEach(h => grid.appendChild(h));
    const first = new Date(calYear, calMonth, 1).getDay();
    const days = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    for (let i = 0; i < first; i++) { const d = document.createElement('div'); d.className = 'cal-day other-month'; d.textContent = prevDays - first + i + 1; grid.appendChild(d); }
    const today = new Date();
    for (let i = 1; i <= days; i++) {
        const d = document.createElement('div'); d.className = 'cal-day'; d.textContent = i;
        if (calYear === today.getFullYear() && calMonth === today.getMonth() && i === today.getDate()) d.classList.add('today');
        if (calMonth === 2 && taskDays[i]) d.classList.add('has-task');
        d.onclick = () => toast(`${months[calMonth]} ${i}, ${calYear}`);
        grid.appendChild(d);
    }
    const rem = (first + days) % 7;
    if (rem > 0) for (let i = 1; i <= 7 - rem; i++) { const d = document.createElement('div'); d.className = 'cal-day other-month'; d.textContent = i; grid.appendChild(d); }
}
function changeMonth(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } else if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }
renderCal();

/* ── HEATMAP (My Activity) ── */
(function buildHeatmap() {
    const grid = document.getElementById('act-heatmap');
    if (!grid) return;
    const levels = ['', 'h1', 'h2', 'h3', 'h4'];
    for (let w = 0; w < 12; w++) {
        const col = document.createElement('div'); col.className = 'heatmap-col';
        for (let d = 0; d < 7; d++) {
            const cell = document.createElement('div');
            const r = Math.random();
            let lv = 0;
            if (r < .35) lv = 0; else if (r < .55) lv = 1; else if (r < .72) lv = 2; else if (r < .88) lv = 3; else lv = 4;
            if (w < 4 && lv > 2) lv = Math.floor(lv * .6);
            cell.className = 'hm-cell ' + (levels[lv] || '');
            cell.title = `${lv} contribution${lv !== 1 ? 's' : ''}`;
            cell.onclick = () => toast(`${lv} contribution${lv !== 1 ? 's' : ''} this day`);
            col.appendChild(cell);
        }
        grid.appendChild(col);
    }
})();

/* ── TOAST ── */
let _t;
function toast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-icon').textContent = 'ℹ️';
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(_t); _t = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── INIT ── */
lucide.createIcons();