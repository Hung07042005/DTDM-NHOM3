/* ═══════════════════════════════════════════════════
   TASKFLOW — index.js
   Chức năng cho toàn bộ giao diện (Document 4)
═══════════════════════════════════════════════════ */

/* ════════════════════════════
   1. MODAL SYSTEM
════════════════════════════ */
function openModal(id) {
    // Đóng tất cả overlay đang mở
    document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
    const el = document.getElementById('ov-' + id);
    if (el) {
        el.classList.add('show');
        lucide.createIcons();         // render icon mới trong modal
        _trapFocus(el);               // giữ focus trong modal
    }
}

function closeModal(id) {
    const el = document.getElementById('ov-' + id);
    if (el) el.classList.remove('show');
}

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : `${window.location.protocol}//${window.location.hostname}:8000/api`;
const AUTH_USER_KEY = 'taskflow-user';

function getCurrentUser() {
    try {
        const rawUser = localStorage.getItem(AUTH_USER_KEY);
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
}

function getUserInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');
}

function applyCurrentUserToUI() {
    const user = getCurrentUser();
    if (!user) return;

    const displayName = user.name || 'User';
    const role = user.role || 'User';
    const email = user.email || '';
    const initials = getUserInitials(displayName);

    const textMap = {
        'current-user-name-sidebar': displayName,
        'current-user-role-sidebar': role,
        'current-user-name-settings': displayName,
        'current-user-role-settings': role,
        'current-user-name-menu': displayName,
        'current-user-role-menu': role,
        'current-user-email-menu': email,
        'current-user-name-public': displayName,
        'current-user-email-public': email,
    };

    Object.entries(textMap).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) element.textContent = value;
    });

    const publicRole = document.getElementById('current-user-role-public');
    if (publicRole) {
        publicRole.innerHTML = `<i data-lucide="briefcase" style="width:13px;height:13px;color:var(--sky)"></i>${role} · TaskFlow`;
    }

    const settingsEmail = document.getElementById('current-user-email-settings');
    if (settingsEmail) settingsEmail.value = email;

    [
        'current-user-avatar-nav',
        'current-user-avatar-sidebar',
        'current-user-avatar-settings',
        'current-user-avatar-menu',
        'current-user-avatar-public',
    ].forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) element.textContent = initials;
    });
}

function ensureAuthenticated() {
    const user = getCurrentUser();
    if (user) return true;

    const loginPath = '../../index.html';
    window.location.href = loginPath;
    return false;
}

function _statusLabelToApiStatus(statusLabel) {
    const map = {
        'To Do': 'todo',
        'In Progress': 'in-progress',
        'In Review': 'review',
        'Done': 'done',
    };
    return map[statusLabel] || 'todo';
}

function _apiStatusToColumnTitle(status) {
    const map = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'review': 'In Review',
        'done': 'Done',
    };
    return map[status] || 'To Do';
}

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

function _ensureBackendTaskContainers() {
    document.querySelectorAll('.kanban-col').forEach(col => {
        const colBody = col.querySelector('.col-body');
        if (!colBody) return;

        let container = colBody.querySelector('.backend-task-list');
        if (!container) {
            container = document.createElement('div');
            container.className = 'backend-task-list';
            colBody.prepend(container);
        }
        container.innerHTML = '';
    });
}

function _renderBackendTasks(tasks) {
    _ensureBackendTaskContainers();

    tasks.forEach(task => {
        const targetTitle = _apiStatusToColumnTitle(task.status);
        const targetCol = Array.from(document.querySelectorAll('.kanban-col')).find(col => {
            const title = col.querySelector('.col-title')?.textContent?.trim();
            return title === targetTitle;
        });

        const colBody = targetCol?.querySelector('.col-body');
        const container = colBody?.querySelector('.backend-task-list');
        if (!container) return;

        const card = document.createElement('div');
        card.className = 'card';
        const due = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        const desc = task.description || 'No description';
        const statusText = STATUS_LABELS[task.status] || 'To Do';
        const priorityText = task.priority === 1 ? 'High' : task.priority === 3 ? 'Low' : 'Medium';

        card.innerHTML = `
            <div class="card-top"><span class="priority-tag medium">${priorityText}</span></div>
            <div class="card-title">${task.title}</div>
            <div class="card-desc">${desc}</div>
            <div class="card-footer">
                <div class="due-date"><i data-lucide="calendar"></i>${due}</div>
                <div class="card-footer-sep"></div>
                <div class="card-tags"><span class="tag">${statusText}</span></div>
            </div>
        `;

        card.onclick = () => openCardDetail(task.title, `Backend Task · ${statusText}`, desc);

        container.appendChild(card);
    });

    lucide.createIcons();
}

async function loadTasksFromBackend() {
    try {
        const data = await apiRequest('/tasks');
        _renderBackendTasks(data.tasks || []);
    } catch (error) {
        toast(`Load tasks failed: ${error.message}`);
    }
}

async function createTaskFromModal() {
    const titleInput = document.getElementById('new-task-title');
    const descInput = document.getElementById('new-task-desc');
    const statusSelect = document.getElementById('new-task-status');
    const dueDateInput = document.getElementById('new-task-due-date');

    const title = titleInput?.value?.trim();
    const description = descInput?.value?.trim();
    const status = _statusLabelToApiStatus(statusSelect?.value);
    const dueDate = dueDateInput?.value;
    const selectedPriorityButton = document.querySelector('.prio-row .prio-btn.sel-high, .prio-row .prio-btn.sel-med, .prio-row .prio-btn.sel-low');

    let priority = 2;
    if (selectedPriorityButton?.classList.contains('sel-high')) priority = 1;
    if (selectedPriorityButton?.classList.contains('sel-low')) priority = 3;

    if (!title) {
        toast('Task title is required');
        return;
    }

    try {
        await apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title,
                description: description || null,
                status,
                priority,
                due_date: dueDate ? `${dueDate}T00:00:00` : null,
            }),
        });

        titleInput.value = '';
        if (descInput) descInput.value = '';
        if (dueDateInput) dueDateInput.value = '';

        closeModal('new-task');
        toast('Task created!');
        await loadTasksFromBackend();
    } catch (error) {
        toast(error.message);
    }
}

async function loadContainerId() {
    const sub = document.querySelector('.page-sub');
    if (!sub) return;

    try {
        const data = await apiRequest('/container');
        sub.textContent = `${sub.textContent} · Container: ${data.container_id}`;
    } catch (error) {
        console.error(error);
    }
}

// Đóng khi click ngoài modal box
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    });
});

// Đóng bằng phím ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.show').forEach(o => o.classList.remove('show'));
    }
});

// Trap focus: dùng Tab trong modal không ra ngoài
function _trapFocus(modal) {
    const focusable = modal.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    setTimeout(() => first.focus && first.focus(), 80);
    modal.addEventListener('keydown', function handler(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        if (!modal.classList.contains('show')) modal.removeEventListener('keydown', handler);
    });
}

/* ════════════════════════════
   2. SIDEBAR ACTIVE STATE
════════════════════════════ */
function setActive(el) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

/* ════════════════════════════
   3. FILTER PILLS
════════════════════════════ */
function toggleFilter(el) {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}

/* ════════════════════════════
   4. VIEW SWITCH (Kanban ↔ Timeline)
════════════════════════════ */
function switchView(view) {
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));

    const content = document.getElementById('view-' + view);
    if (content) content.classList.add('active');

    // Đánh dấu nút active
    const btns = document.querySelectorAll('.view-btn');
    if (view === 'kanban' && btns[0]) btns[0].classList.add('active');
    if (view === 'timeline' && btns[1]) btns[1].classList.add('active');

    if (view === 'timeline') {
        // Render gantt khi chuyển sang timeline
        lucide.createIcons();
        render();
    }
}

/* ════════════════════════════
   4.5. THEME TOGGLE & APPEARANCE
════════════════════════════ */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.classList.toggle('dark-mode', newTheme === 'dark');
    }
    
    lucide.createIcons();
    toast(newTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

function selectAppearance(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    
    if (theme !== 'auto') {
        localStorage.setItem('theme', theme);
    } else {
        localStorage.removeItem('theme');
    }
    
    // Update active state in settings
    document.querySelectorAll('.appearance-card').forEach(card => {
        card.classList.remove('active');
    });
    const activeCard = document.querySelector(`[data-theme="${theme}"]`);
    if (activeCard) activeCard.classList.add('active');
    
    // Update theme toggle button visibility
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.style.display = theme === 'auto' ? 'none' : 'flex';
    }
    
    lucide.createIcons();
    toast(`Theme changed to ${theme}`);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn && savedTheme === 'dark') {
        themeToggleBtn.classList.add('dark-mode');
    }
    
    const activeCard = document.querySelector(`[data-theme="${savedTheme}"]`);
    if (activeCard) activeCard.classList.add('active');
});

/* ════════════════════════════
   5. CARD DETAIL MODAL
════════════════════════════ */
function openCardDetail(title, sub, desc) {
    const tEl = document.getElementById('cd-title');
    const sEl = document.getElementById('cd-sub');
    const dEl = document.getElementById('cd-desc');
    if (tEl) tEl.textContent = title;
    if (sEl) sEl.textContent = sub;
    if (dEl) dEl.value = desc;
    openModal('card-detail');
}

/* ════════════════════════════
   6. CHECKLIST (card detail)
════════════════════════════ */
function toggleCheck(el) {
    const box = el.querySelector('.check-box');
    const lbl = el.querySelector('.check-label');
    if (!box || !lbl) return;
    box.classList.toggle('checked');
    box.textContent = box.classList.contains('checked') ? '✓' : '';
    lbl.classList.toggle('done');
}

/* ════════════════════════════
   7. PRIORITY SELECTOR (new-task modal)
════════════════════════════ */
function selPrio(btn, type) {
    const wrap = btn.closest('.prio-row');
    if (!wrap) return;
    wrap.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('sel-high', 'sel-med', 'sel-low'));
    btn.classList.add('sel-' + type);
}

function initNewTaskInteractions() {
    const modal = document.getElementById('ov-new-task');
    if (!modal) return;

    modal.addEventListener('click', (event) => {
        const prioButton = event.target.closest('.prio-btn');
        if (prioButton) {
            if (prioButton.classList.contains('sel-high')) {
                selPrio(prioButton, 'high');
            } else if (prioButton.classList.contains('sel-low')) {
                selPrio(prioButton, 'low');
            } else {
                const text = (prioButton.textContent || '').toLowerCase();
                selPrio(prioButton, text.includes('high') ? 'high' : text.includes('low') ? 'low' : 'med');
            }
            return;
        }

        const tagButton = event.target.closest('.tag-chip-item');
        if (tagButton) {
            tagButton.classList.toggle('sel');
        }
    });
}

/* ════════════════════════════
   8. IMPORT SOURCE SELECT
════════════════════════════ */
function selImport(el) {
    document.querySelectorAll('.import-src').forEach(s => s.classList.remove('sel'));
    el.classList.add('sel');
}

/* ════════════════════════════
   9. SETTINGS TABS
════════════════════════════ */
function switchTab(el, id) {
    document.querySelectorAll('.stab-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.stab-pane-inner').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('sp-' + id);
    if (pane) pane.classList.add('active');
    lucide.createIcons();
}

/* ════════════════════════════
   10. ACTIVITY FILTER
════════════════════════════ */
function actFilter(el) {
    document.querySelectorAll('.act-fpill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    toast('Filtering: ' + el.textContent.trim());
}

/* ════════════════════════════
   11. CALENDAR
════════════════════════════ */
let calYear = 2026;
let calMonth = 2; // 0-indexed → March
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const TASK_DAYS = { 10: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 22: 1 };

function renderCal() {
    const grid = document.getElementById('cal-grid');
    const label = document.getElementById('cal-month-label');
    if (!grid || !label) return;

    label.textContent = `${MONTHS[calMonth]} ${calYear}`;

    // Giữ lại các tiêu đề ngày
    const heads = Array.from(grid.querySelectorAll('.cal-head'));
    grid.innerHTML = '';
    heads.forEach(h => grid.appendChild(h));

    const firstDow = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    const today = new Date();

    // Ngày tháng trước (mờ)
    for (let i = 0; i < firstDow; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day other-month';
        d.textContent = prevDays - firstDow + i + 1;
        grid.appendChild(d);
    }

    // Ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day';
        d.textContent = i;
        if (calYear === today.getFullYear() &&
            calMonth === today.getMonth() &&
            i === today.getDate()) {
            d.classList.add('today');
        }
        if (calMonth === 2 && TASK_DAYS[i]) d.classList.add('has-task');
        d.onclick = () => toast(`📅 ${MONTHS[calMonth]} ${i}, ${calYear}`);
        grid.appendChild(d);
    }

    // Ngày tháng sau (mờ)
    const remainder = (firstDow + daysInMonth) % 7;
    if (remainder > 0) {
        for (let i = 1; i <= 7 - remainder; i++) {
            const d = document.createElement('div');
            d.className = 'cal-day other-month';
            d.textContent = i;
            grid.appendChild(d);
        }
    }
}

function changeMonth(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCal();
}

/* ════════════════════════════
   12. SIGN OUT
════════════════════════════ */
function logout() {
    closeModal('profile');
    toast('👋 Signing out…');
    setTimeout(() => {
        localStorage.removeItem(AUTH_USER_KEY);
        window.location.href = '../../index.html';
    }, 1000);
}

/* ════════════════════════════
   13. TOAST NOTIFICATION
════════════════════════════ */
let _toastTimer = null;

function toast(msg) {
    const el = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const text = document.getElementById('toast-msg');
    if (!el || !text) return;

    // Lấy icon nếu có
    const emojiMatch = msg.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
    if (emojiMatch && icon) {
        icon.textContent = emojiMatch[0];
        text.textContent = msg.slice(emojiMatch[0].length).trim();
    } else {
        if (icon) icon.innerHTML = '<i data-lucide="circle-check"></i>';
        text.textContent = msg;
    }

    el.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);

    lucide.createIcons();
}

/* ════════════════════════════
   14. HEATMAP (My Activity)
════════════════════════════ */
function buildHeatmap() {
    const grid = document.getElementById('act-heatmap');
    if (!grid) return;
    grid.innerHTML = '';
    const levels = ['', 'h1', 'h2', 'h3', 'h4'];
    for (let w = 0; w < 12; w++) {
        const col = document.createElement('div');
        col.className = 'heatmap-col';
        for (let d = 0; d < 7; d++) {
            const cell = document.createElement('div');
            const r = Math.random();
            let lv = r < .35 ? 0 : r < .55 ? 1 : r < .72 ? 2 : r < .88 ? 3 : 4;
            if (w < 4 && lv > 2) lv = Math.floor(lv * .6);
            cell.className = 'hm-cell ' + (levels[lv] || '');
            cell.title = `${lv} contribution${lv !== 1 ? 's' : ''}`;
            cell.onclick = () => toast(`📅 ${lv} contribution${lv !== 1 ? 's' : ''} this day`);
            col.appendChild(cell);
        }
        grid.appendChild(col);
    }
}

/* ════════════════════════════
   15. GANTT / TIMELINE
════════════════════════════ */
const GANTT_GROUPS = [
    {
        id: 'g1', name: 'Website Redesign', color: '#ff6b6b',
        tasks: [
            { id: 't1', name: 'Redesign hero section', start: 1, end: 12, progress: 60, status: 'overdue', priority: 'high', color: 'linear-gradient(90deg,#ff6b6b,#fb7185)', assignees: ['JD', 'AM'], tags: ['Design', 'UX'], done: false },
            { id: 't2', name: 'Build component library', start: 4, end: 15, progress: 68, status: 'in-progress', priority: 'high', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['JD', 'SK'], tags: ['Figma'], done: false },
            { id: 't3', name: 'Homepage SEO audit', start: 10, end: 17, progress: 90, status: 'review', priority: 'medium', color: 'linear-gradient(90deg,#ffc542,#f59e0b)', assignees: ['SK'], tags: ['SEO'], done: false },
            { id: 't4', name: 'Dark mode implementation', start: 8, end: 20, progress: 40, status: 'in-progress', priority: 'high', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['AM', 'PK'], tags: ['Engineering'], done: false },
            { id: 't5', name: 'Write About Us content', start: 14, end: 22, progress: 0, status: 'todo', priority: 'medium', color: '#cbd5e1', assignees: ['SK'], tags: ['Content'], done: false },
            { id: 'm1', name: 'Design Review ★', start: 15, end: 15, progress: 0, status: 'milestone', priority: '', color: 'milestone', assignees: [], tags: [], done: false },
        ]
    },
    {
        id: 'g2', name: 'Mobile App v2', color: '#3ecf8e',
        tasks: [
            { id: 't6', name: 'Define user personas', start: 6, end: 18, progress: 30, status: 'in-progress', priority: 'medium', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['LM', 'JD'], tags: ['Research'], done: false },
            { id: 't7', name: 'Conduct usability testing', start: 12, end: 20, progress: 55, status: 'in-progress', priority: 'high', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['JD', 'AM'], tags: ['UX'], done: false },
            { id: 't8', name: 'Integrate Stripe gateway', start: 10, end: 19, progress: 40, status: 'in-progress', priority: 'medium', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['PK'], tags: ['Engineering'], done: false },
        ]
    },
    {
        id: 'g3', name: 'Brand & Marketing', color: '#ffc542',
        tasks: [
            { id: 't9', name: 'Brand color token system', start: 1, end: 6, progress: 100, status: 'done', priority: 'low', color: 'linear-gradient(90deg,#3ecf8e,#10b981)', assignees: ['JD'], tags: ['Design'], done: true },
            { id: 't10', name: 'Write onboarding emails', start: 8, end: 14, progress: 80, status: 'in-progress', priority: 'low', color: 'linear-gradient(90deg,#4eb5f7,#a78bfa)', assignees: ['SK', 'LM'], tags: ['Marketing'], done: false },
            { id: 't11', name: 'Update GDPR privacy policy', start: 18, end: 25, progress: 0, status: 'todo', priority: 'low', color: '#cbd5e1', assignees: ['LM'], tags: ['Legal'], done: false },
            { id: 'm2', name: 'Campaign Launch ★', start: 25, end: 25, progress: 0, status: 'milestone', priority: '', color: 'milestone', assignees: [], tags: [], done: false },
        ]
    },
    {
        id: 'g4', name: 'DevOps & Engineering', color: '#a78bfa',
        tasks: [
            { id: 't12', name: 'Set up CI/CD pipeline', start: 1, end: 8, progress: 100, status: 'done', priority: 'medium', color: 'linear-gradient(90deg,#3ecf8e,#10b981)', assignees: ['AM', 'PK'], tags: ['DevOps'], done: true },
            { id: 't13', name: 'Migrate to Postgres 16', start: 2, end: 7, progress: 100, status: 'done', priority: 'high', color: 'linear-gradient(90deg,#3ecf8e,#10b981)', assignees: ['AM', 'PK'], tags: ['Engineering'], done: true },
            { id: 't14', name: 'API integration setup', start: 14, end: 28, progress: 20, status: 'todo', priority: 'medium', color: '#cbd5e1', assignees: ['PK'], tags: ['API'], done: false },
        ]
    }
];

const AV_COLORS = {
    JD: 'linear-gradient(135deg,#ff6b6b,#fb7185)',
    SK: 'linear-gradient(135deg,#3ecf8e,#4eb5f7)',
    AM: 'linear-gradient(135deg,#4eb5f7,#a78bfa)',
    PK: 'linear-gradient(135deg,#ffc542,#ff6b6b)',
    LM: 'linear-gradient(135deg,#a78bfa,#ec4899)',
};
const STATUS_LABELS = {
    'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'In Review',
    'done': 'Done', 'overdue': 'Overdue', 'milestone': 'Milestone'
};
const STATUS_COLORS = {
    'todo': '#94a3b8', 'in-progress': '#4eb5f7', 'review': '#f59e0b',
    'done': '#3ecf8e', 'overdue': '#ff6b6b', 'milestone': '#ffc542'
};
const PRIO_COLORS = { high: '#ff6b6b', medium: '#f59e0b', low: '#3ecf8e' };

let ganttZoom = 'week';
let ganttStartDay = 1;
let ganttTotalDays = 31;
let ganttColW = 28;
let ganttCollapsed = {};

function setZoom(z) {
    ganttZoom = z;
    document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
    const zBtn = document.getElementById('z-' + z);
    if (zBtn) zBtn.classList.add('active');
    if (z === 'day') { ganttColW = 60; ganttTotalDays = 14; }
    if (z === 'week') { ganttColW = 28; ganttTotalDays = 31; }
    if (z === 'month') { ganttColW = 14; ganttTotalDays = 62; }
    render();
}

function shiftWeek(dir) {
    ganttStartDay = Math.max(1, Math.min(ganttStartDay + dir * (ganttZoom === 'day' ? 3 : ganttZoom === 'week' ? 7 : 14), 28));
    render();
}

function jumpToday() {
    ganttStartDay = 11;
    render();
    toast('📅 Jumped to today (Mar 15)');
}

function toggleChip(el) {
    el.classList.toggle('on');
    toast('Filter applied');
}

function render() {
    _renderLeft();
    _renderRight();
    _renderMinimap();
    lucide.createIcons();
}

function _renderLeft() {
    const lb = document.getElementById('leftBody');
    if (!lb) return;
    lb.innerHTML = '';

    GANTT_GROUPS.forEach(g => {
        // Group header row
        const gh = document.createElement('div');
        gh.className = 'group-row';
        gh.innerHTML = `
      <span class="group-arrow ${ganttCollapsed[g.id] ? '' : 'open'}">
        <i data-lucide="chevron-right" style="width:13px;height:13px"></i>
      </span>
      <div class="group-dot" style="background:${g.color}"></div>
      <span class="group-name">${g.name}</span>
      <span class="group-count">${g.tasks.filter(t => t.status !== 'milestone').length}</span>
    `;
        gh.onclick = () => { ganttCollapsed[g.id] = !ganttCollapsed[g.id]; render(); };
        lb.appendChild(gh);

        if (ganttCollapsed[g.id]) return;

        g.tasks.forEach(t => {
            if (t.status === 'milestone') return;
            const row = document.createElement('div');
            row.className = 'task-row-left';
            row.dataset.tid = t.id;
            row.innerHTML = `
        <div class="trl-check ${t.done ? 'done' : ''}"
             onclick="event.stopPropagation();_toggleDone('${t.id}')"
        >${t.done ? '✓' : ''}</div>
        <div class="prio-dot" style="background:${PRIO_COLORS[t.priority] || '#94a3b8'}"></div>
        <span class="trl-name ${t.done ? 'done-text' : ''}">${t.name}</span>
        ${t.assignees.length
                    ? `<div class="trl-av" style="background:${AV_COLORS[t.assignees[0]] || '#999'}">${t.assignees[0]}</div>`
                    : ''}
      `;
            row.onclick = () => _openGanttDetail(t);
            lb.appendChild(row);
        });
    });
}

function _renderRight() {
    const chart = document.getElementById('ganttChart');
    if (!chart) return;
    const visibleDays = Math.min(ganttTotalDays, 32 - ganttStartDay);
    const chartW = visibleDays * ganttColW;
    chart.style.width = chartW + 'px';
    chart.innerHTML = '';

    /* ── Date header ── */
    const dh = document.createElement('div');
    dh.className = 'date-header';
    dh.style.width = chartW + 'px';

    const mc = document.createElement('div');
    mc.className = 'month-cell';
    mc.style.width = chartW + 'px';

    const ml = document.createElement('div');
    ml.className = 'month-label';
    ml.textContent = 'March 2026';
    mc.appendChild(ml);

    const dr = document.createElement('div');
    dr.className = 'days-row';
    for (let d = ganttStartDay; d < ganttStartDay + visibleDays; d++) {
        const dc = document.createElement('div');
        dc.className = 'day-cell';
        dc.style.width = ganttColW + 'px';
        const date = new Date(2026, 2, d);
        const dow = date.getDay();
        if (dow === 0 || dow === 6) dc.classList.add('weekend');
        if (d === 15) dc.classList.add('today-hd');
        if (ganttZoom === 'month') {
            dc.textContent = (d % 7 === 1 || d === ganttStartDay) ? d : '';
        } else if (ganttZoom === 'day') {
            const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            dc.innerHTML = `<span style="display:flex;flex-direction:column;align-items:center;gap:1px">
        <span style="font-size:9px;opacity:.7">${days[dow]}</span>
        <span>${d}</span></span>`;
        } else {
            dc.textContent = d;
        }
        dr.appendChild(dc);
    }
    mc.appendChild(dr);
    dh.appendChild(mc);
    chart.appendChild(dh);

    /* ── Chart body ── */
    const cb = document.createElement('div');
    cb.className = 'chart-body';
    cb.style.width = chartW + 'px';

    // Grid lines
    for (let d = ganttStartDay; d < ganttStartDay + visibleDays; d++) {
        const gl = document.createElement('div');
        gl.className = 'grid-line';
        const dow = new Date(2026, 2, d).getDay();
        if (dow === 0 || dow === 6) gl.classList.add('weekend');
        if (d === 15) {
            gl.classList.add('today-line');
            const tb = document.createElement('div');
            tb.className = 'today-badge';
            tb.textContent = 'Today';
            gl.appendChild(tb);
        }
        gl.style.left = ((d - ganttStartDay) * ganttColW) + 'px';
        cb.appendChild(gl);
    }

    // Today indicator
    const ti = document.createElement('div');
    ti.className = 'today-indicator';
    ti.style.left = ((15 - ganttStartDay) * ganttColW) + 'px';
    cb.appendChild(ti);

    // Rows
    GANTT_GROUPS.forEach(g => {
        // Group spacer row
        const gr = document.createElement('div');
        gr.className = 'chart-row group-spacer';
        gr.style.width = chartW + 'px';

        g.tasks.forEach(t => {
            if (t.status === 'milestone') {
                // Place milestone diamond on group spacer
                const mleft = Math.max(0, (t.start - ganttStartDay) * ganttColW + ganttColW / 2 - 8);
                const ms = document.createElement('div');
                ms.className = 'milestone';
                ms.style.left = mleft + 'px';
                ms.style.top = '8px';
                ms.title = t.name;
                ms.onclick = () => toast('★ ' + t.name);
                _addTooltip(ms, t);
                gr.appendChild(ms);
            }
        });
        cb.appendChild(gr);

        if (ganttCollapsed[g.id]) return;

        g.tasks.forEach(t => {
            if (t.status === 'milestone') return;

            const row = document.createElement('div');
            row.className = 'chart-row';
            row.style.width = chartW + 'px';
            row.dataset.tid = t.id;

            const barLeft = Math.max(0, (t.start - ganttStartDay) * ganttColW);
            const barRight = Math.min(chartW, (t.end - ganttStartDay + 1) * ganttColW);
            const barW = Math.max(ganttColW, barRight - barLeft);

            if (t.start >= ganttStartDay - 2 && t.start <= ganttStartDay + visibleDays) {
                const bar = document.createElement('div');
                bar.className = 'gbar' + (t.done ? ' done-bar' : '');
                bar.style.left = barLeft + 'px';
                bar.style.width = barW + 'px';
                bar.style.background = t.color;

                // Progress fill
                if (t.progress > 0 && t.progress < 100) {
                    const pf = document.createElement('div');
                    pf.className = 'gbar-progress';
                    pf.style.width = t.progress + '%';
                    bar.appendChild(pf);
                }

                // Label
                const lbl = document.createElement('span');
                lbl.className = 'gbar-label';
                lbl.style.maxWidth = (barW - 16) + 'px';
                lbl.textContent = barW > 60 ? t.name : '';
                bar.appendChild(lbl);

                // Resize handles
                ['left', 'right'].forEach(side => {
                    const h = document.createElement('div');
                    h.className = `gbar-handle ${side}`;
                    const hi = document.createElement('div');
                    hi.className = 'gbar-handle-inner';
                    h.appendChild(hi);
                    bar.appendChild(h);
                });

                bar.onclick = () => _openGanttDetail(t);
                _addTooltip(bar, t);
                row.appendChild(bar);
            }
            cb.appendChild(row);
        });
    });

    chart.appendChild(cb);
}

function _renderMinimap() {
    const mb = document.getElementById('minimapBars');
    if (!mb) return;
    mb.innerHTML = '';
    const allTasks = GANTT_GROUPS.flatMap(g => g.tasks.filter(t => t.status !== 'milestone'));
    allTasks.slice(0, 8).forEach(t => {
        const b = document.createElement('div');
        b.className = 'mm-bar';
        b.style.cssText = 'width:120px;background:#e8eaf2;position:relative;border-radius:2px;height:4px;margin:2px 0';
        const fill = document.createElement('div');
        fill.style.cssText = `position:absolute;top:0;left:0;bottom:0;border-radius:2px;background:${t.color};width:${t.progress}%`;
        b.appendChild(fill);
        mb.appendChild(b);
    });
}

/* Tooltip */
function _addTooltip(el, task) {
    const tt = document.getElementById('tooltip');
    if (!tt) return;
    el.addEventListener('mouseenter', e => {
        tt.innerHTML = `
      <div class="tt-title">${task.name}</div>
      <div class="tt-row"><span style="width:60px;opacity:.6">Status</span>
        <span style="color:${STATUS_COLORS[task.status]};font-weight:700">${STATUS_LABELS[task.status]}</span>
      </div>
      ${task.priority ? `<div class="tt-row"><span style="width:60px;opacity:.6">Priority</span><span>${task.priority}</span></div>` : ''}
      <div class="tt-row"><span style="width:60px;opacity:.6">Duration</span><span>Mar ${task.start}–${task.end}</span></div>
      ${task.status !== 'milestone' ? `<div class="tt-row"><span style="width:60px;opacity:.6">Progress</span><span>${task.progress}%</span></div>` : ''}
      ${task.assignees.length ? `<div class="tt-row"><span style="width:60px;opacity:.6">Assigned</span><span>${task.assignees.join(', ')}</span></div>` : ''}
    `;
        tt.classList.add('show');
        _positionTooltip(e);
    });
    el.addEventListener('mousemove', _positionTooltip);
    el.addEventListener('mouseleave', () => tt.classList.remove('show'));
}

function _positionTooltip(e) {
    const tt = document.getElementById('tooltip');
    if (!tt) return;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + 250 > window.innerWidth) x = e.clientX - 260;
    if (y + 180 > window.innerHeight) y = e.clientY - 190;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
}

/* Open detail from Gantt */
function _openGanttDetail(task) {
    const dt = document.getElementById('dt-title');
    const ds = document.getElementById('dt-sub');
    const dpc = document.getElementById('dt-pct');
    const dpg = document.getElementById('dt-prog');
    const dst = document.getElementById('dt-status');
    const dpr = document.getElementById('dt-priority');
    const dstart = document.getElementById('dt-start');
    const dend = document.getElementById('dt-end');
    const dassign = document.getElementById('dt-assignees');
    const dtags = document.getElementById('dt-tags');

    if (dt) dt.textContent = task.name;
    if (ds) ds.textContent = STATUS_LABELS[task.status] + ' · Website Redesign';
    if (dpc) dpc.textContent = task.progress + '%';
    if (dpg) { dpg.style.width = task.progress + '%'; dpg.style.background = task.color.includes('gradient') ? task.color : 'var(--sky)'; }
    if (dst) dst.innerHTML = `<span style="color:${STATUS_COLORS[task.status]};font-weight:700">${STATUS_LABELS[task.status]}</span>`;
    if (dpr) dpr.innerHTML = task.priority
        ? `<span style="color:${PRIO_COLORS[task.priority]};font-weight:700;text-transform:capitalize">${task.priority}</span>`
        : '<span style="color:var(--text-tertiary)">—</span>';
    if (dstart) dstart.textContent = 'Mar ' + task.start + ', 2026';
    if (dend) dend.textContent = 'Mar ' + task.end + ', 2026';

    if (dassign) dassign.innerHTML = task.assignees.length
        ? task.assignees.map(a => `
        <div style="display:flex;align-items:center;gap:6px;background:var(--bg);border-radius:8px;padding:5px 10px">
          <div style="width:24px;height:24px;border-radius:50%;background:${AV_COLORS[a]};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">${a}</div>
          <span style="font-size:12.5px;font-weight:600">${{ JD: 'Jamie D.', SK: 'Sara K.', AM: 'Alex M.', PK: 'Paul K.', LM: 'Lisa M.' }[a]}</span>
        </div>
      `).join('')
        : '<span style="font-size:12.5px;color:var(--text-tertiary)">No assignees</span>';

    if (dtags) dtags.innerHTML = task.tags
        .map(t => `<span style="font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:5px;background:var(--bg);border:1px solid var(--border);color:var(--text-secondary)">${t}</span>`)
        .join('');

    openModal('detail');
}

function closeDetail() {
    closeModal('detail');
}

/* Toggle done from left panel */
function _toggleDone(tid) {
    for (const g of GANTT_GROUPS) {
        const t = g.tasks.find(x => x.id === tid);
        if (t) {
            t.done = !t.done;
            if (t.done) t.progress = 100;
            render();
            toast(t.done ? '✅ Task done!' : '↩ Reopened');
            break;
        }
    }
}

/* Sync scroll between left and right panels */
function _syncScroll() {
    const lb = document.getElementById('leftBody');
    const rp = document.getElementById('rightPanel');
    if (!lb || !rp) return;
    rp.addEventListener('scroll', () => { lb.scrollTop = rp.scrollTop; });
    lb.addEventListener('scroll', () => { rp.scrollTop = lb.scrollTop; });
}

/* ════════════════════════════
   16. INIT
════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    if (!ensureAuthenticated()) return;

    // Khởi tạo theme (sync cards sau khi DOM sẵn sàng)
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    setTheme(savedTheme, false);
    applyCurrentUserToUI();

    lucide.createIcons();
    renderCal();
    buildHeatmap();
    _syncScroll();
    initNewTaskInteractions();

    // Render gantt nếu timeline đang active
    const tlView = document.getElementById('view-timeline');
    if (tlView && tlView.classList.contains('active')) render();

    loadTasksFromBackend();
    loadContainerId();
});

/* ════════════════════════════
   17. DARK MODE
════════════════════════════ */

/**
 * Các theme hợp lệ: 'light' | 'dark' | 'auto'
 * 'auto' theo system preference (prefers-color-scheme)
 */
const THEME_KEY = 'taskflow-theme';

function _resolveTheme(pref) {
    if (pref === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return pref || 'light';
}

function setTheme(pref, fromUser = true) {
    const resolved = _resolveTheme(pref);
    document.documentElement.setAttribute('data-theme', resolved);

    // Lưu preference (không lưu 'auto-resolved')
    if (fromUser) localStorage.setItem(THEME_KEY, pref);

    // Sync toggle button ở nav
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.title = resolved === 'dark' ? 'Switch to Light' : 'Switch to Dark';

    // Sync appearance cards trong Settings
    _syncAppearanceCards(pref);

    // Cập nhật Lucide icons (vì stroke color thay đổi)
    lucide.createIcons();
}

function toggleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    toast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
}

/** Gọi từ Settings > Appearance cards */
function selectAppearance(pref) {
    setTheme(pref);
    toast({
        light: '☀️ Light theme',
        dark: '🌙 Dark theme',
        auto: '💻 Following system'
    }[pref] || 'Theme applied');
}

function _syncAppearanceCards(pref) {
    document.querySelectorAll('.appearance-card').forEach(card => {
        card.classList.toggle('active', card.dataset.theme === pref);
    });
}

/** Listen to system preference changes when pref = 'auto' */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'auto' || !saved) setTheme('auto', false);
});

/** Init theme on page load (before DOMContentLoaded to avoid flash) */
(function initThemeEarly() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    const resolved = _resolveTheme(saved);
    document.documentElement.setAttribute('data-theme', resolved);
})();
(function () {
    var t = localStorage.getItem('taskflow-theme') || 'light';
    if (t === 'auto') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
})();