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
        
        // Load user list khi mở modal create task
        if (id === 'new-task') {
            loadUsersForAssignment('assignee-grid-create');
        }
    }
}

function closeModal(id) {
    const el = document.getElementById('ov-' + id);
    if (el) el.classList.remove('show');
}

const API_BASE = '/api';
const AUTH_USER_KEY = 'taskflow-user';
let currentDetailTask = null;
let detailDefaultsCaptured = false;
let detailChecklistDefault = '';
let detailCommentsDefault = '';
let detailCommentComposeDisplay = '';
let detailAssigneesDefault = '';
let detailAttachmentsDefault = '';
let detailAttachButtonDisplay = '';
let detailChecklistTitleDefault = '';
let detailCommentsTitleDefault = '';
let detailAttachmentsTitleDefault = '';

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

function _priorityValueToType(priority) {
    if (priority === 1) return 'high';
    if (priority === 3) return 'low';
    return 'medium';
}

function _priorityTypeToValue(priorityType) {
    if (priorityType === 'high') return 1;
    if (priorityType === 'low') return 3;
    return 2;
}

function _escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

// Load users từ backend để hiển thị trong assign modal
async function loadUsersForAssignment(gridSelector = 'assignee-grid') {
    try {
        const data = await apiRequest('/users');
        const users = data.users || [];
        renderAssigneeList(gridSelector, users);
    } catch (error) {
        console.error('Failed to load users:', error);
        toast('Failed to load users');
    }
}

// Render assignee list từ user data
function renderAssigneeList(gridSelector, users) {
    const grid = document.querySelector(`.${gridSelector}`) || document.querySelector(`.${gridSelector.replace(/-/g, '_')}`);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    users.forEach(user => {
        const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
        const bgGradients = [
            'linear-gradient(135deg,var(--coral),var(--rose))',
            'linear-gradient(135deg,var(--mint),var(--sky))',
            'linear-gradient(135deg,var(--sky),var(--violet))',
            'linear-gradient(135deg,var(--amber),var(--coral))',
            'linear-gradient(135deg,var(--violet),#ec4899)'
        ];
        const bgGradient = bgGradients[user.id % bgGradients.length];
        
        const item = document.createElement('div');
        item.className = 'assignee-item';
        item.setAttribute('data-user-id', user.id);
        item.innerHTML = `
            <div class="assignee-av" style="background:${bgGradient}">${_escapeHtml(initials)}</div>
            <span class="assignee-name">${_escapeHtml(user.name || user.email)}</span>
            <div class="assignee-check"></div>
        `;
        
        item.addEventListener('click', function(e) {
            // Bỏ select từ các item khác (chỉ select 1 user)
            grid.querySelectorAll('.assignee-item').forEach(el => {
                if (el !== this) {
                    el.classList.remove('sel');
                    el.querySelector('.assignee-check').classList.remove('checked');
                    el.querySelector('.assignee-check').textContent = '';
                }
            });
            
            // Toggle select cho item hiện tại
            this.classList.toggle('sel');
            this.querySelector('.assignee-check').classList.toggle('checked');
            this.querySelector('.assignee-check').textContent = this.classList.contains('sel') ? '✓' : '';
        });
        
        grid.appendChild(item);
    });
}

// Get selected assignee ID từ modal
function getSelectedAssigneeId(gridSelector = 'assignee-grid') {
    const selected = document.querySelector(`.${gridSelector}.sel, .${gridSelector.replace(/-/g, '_')} .assignee-item.sel`);
    if (!selected) return null;
    return selected.getAttribute('data-user-id');
}

function _renderBackendTasks(tasks) {
    const columns = Array.from(document.querySelectorAll('.kanban-col')).map(col => {
        const title = col.querySelector('.col-title')?.textContent?.trim();
        return {
            title,
            body: col.querySelector('.col-body'),
            count: col.querySelector('.col-count'),
        };
    });

    const grouped = {
        'To Do': [],
        'In Progress': [],
        'In Review': [],
        'Done': [],
    };

    tasks.forEach(task => {
        const columnTitle = _apiStatusToColumnTitle(task.status);
        if (!grouped[columnTitle]) grouped[columnTitle] = [];
        grouped[columnTitle].push(task);
    });

    columns.forEach((column) => {
        if (!column.body) return;
        column.body.innerHTML = '';

        const columnTasks = grouped[column.title] || [];
        columnTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'card';

            const dueLabel = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
            const description = task.description || 'No description';
            const priorityType = _priorityValueToType(task.priority);
            const priorityText = priorityType === 'high' ? '🔴 High' : priorityType === 'low' ? '🟢 Low' : '🟡 Medium';
            const tags = Array.isArray(task.tags) ? task.tags : [];

            const tagsHtml = tags.length
                ? tags.map(tag => `<span class="tag">${_escapeHtml(tag)}</span>`).join('')
                : `<span class="tag">${_escapeHtml(STATUS_LABELS[task.status] || 'Task')}</span>`;

            card.innerHTML = `
                <div class="card-top"><span class="priority-tag ${priorityType}">${priorityText}</span></div>
                <div class="card-title">${_escapeHtml(task.title)}</div>
                <div class="card-desc">${_escapeHtml(description)}</div>
                <div class="card-tags">${tagsHtml}</div>
                <div class="card-footer">
                    <div class="due-date"><i data-lucide="calendar"></i>${_escapeHtml(dueLabel)}</div>
                </div>
            `;

            card.onclick = async () => openCardDetail(task.title, `${STATUS_LABELS[task.status] || 'Task'} · Backend`, description, task);
            column.body.appendChild(card);
        });

        if (column.count) {
            column.count.textContent = String(columnTasks.length);
        }
    });

    const totalTasks = tasks.length;
    const inProgressCount = tasks.filter(task => task.status === 'in-progress').length;
    const completedCount = tasks.filter(task => task.status === 'done' || task.completed).length;
    const overdueCount = tasks.filter(task => {
        if (!task.due_date || task.status === 'done' || task.completed) return false;
        return new Date(task.due_date) < new Date();
    }).length;

    const statTotal = document.getElementById('stat-total-tasks');
    const statInProgress = document.getElementById('stat-in-progress-tasks');
    const statCompleted = document.getElementById('stat-completed-tasks');
    const statOverdue = document.getElementById('stat-overdue-tasks');

    if (statTotal) statTotal.textContent = String(totalTasks);
    if (statInProgress) statInProgress.textContent = String(inProgressCount);
    if (statCompleted) statCompleted.textContent = String(completedCount);
    if (statOverdue) statOverdue.textContent = String(overdueCount);

    lucide.createIcons();
}

function _renderProfileRecentTasks(tasks) {
    const container = document.getElementById('profile-recent-tasks');
    if (!container) return;

    const sortedTasks = [...tasks].sort((left, right) => {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightTime - leftTime;
    });

    const recentTasks = sortedTasks.slice(0, 4);
    if (!recentTasks.length) {
        container.innerHTML = '<div class="ptask-row"><span class="ptask-title">No tasks yet</span></div>';
        return;
    }

    container.innerHTML = recentTasks.map(task => {
        const priorityType = _priorityValueToType(task.priority);
        const priorityLabel = priorityType === 'high' ? 'High' : priorityType === 'low' ? 'Low' : 'Medium';
        const dotColor = priorityType === 'high' ? 'var(--coral)' : priorityType === 'low' ? 'var(--mint)' : 'var(--sky)';
        const statusLabel = STATUS_LABELS[task.status] || 'Task';
        const statusColor = STATUS_COLORS[task.status] || 'var(--sky)';

        return `
            <div class="ptask-row">
                <div class="ptask-dot" style="background:${dotColor}"></div>
                <span class="ptask-title">${_escapeHtml(task.title)}</span>
                <span class="ptask-badge" style="background:rgba(78,181,247,.1);color:${statusColor}">${_escapeHtml(statusLabel)} · ${priorityLabel}</span>
            </div>
        `;
    }).join('');
}

function _applyTaskInsights(tasks) {
    const completedTasks = tasks.filter(task => task.status === 'done' || task.completed);
    const uniqueProjects = new Set(tasks.map(task => task.list_id).filter(Boolean));

    const profileTasks = document.getElementById('profile-stat-tasks');
    const profileCompleted = document.getElementById('profile-stat-completed');
    const profileProjects = document.getElementById('profile-stat-projects');
    const profileContributions = document.getElementById('profile-stat-contributions');

    if (profileTasks) profileTasks.textContent = String(tasks.length);
    if (profileCompleted) profileCompleted.textContent = String(completedTasks.length);
    if (profileProjects) profileProjects.textContent = String(uniqueProjects.size || 1);
    if (profileContributions) profileContributions.textContent = String(tasks.length + completedTasks.length);

    const activityCompleted = document.getElementById('activity-summary-completed');
    const activityStreak = document.getElementById('activity-summary-streak');
    const activityComments = document.getElementById('activity-summary-comments');
    const activityHours = document.getElementById('activity-summary-hours');

    if (activityCompleted) activityCompleted.textContent = String(completedTasks.length);
    if (activityStreak) activityStreak.textContent = String(Math.min(30, Math.max(1, completedTasks.length)));
    if (activityComments) activityComments.textContent = String(tasks.length * 2);
    if (activityHours) activityHours.textContent = `${tasks.length * 2}h`;

    _renderProfileRecentTasks(tasks);
}

async function loadTasksFromBackend() {
    try {
        const data = await apiRequest('/tasks');
        const tasks = data.tasks || [];
        _renderBackendTasks(tasks);
        _applyTaskInsights(tasks);
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
    const selectedTagButtons = Array.from(document.querySelectorAll('.tag-chip-item.sel'));
    const selectedPriorityButton = document.querySelector('.prio-row .prio-btn.sel-high, .prio-row .prio-btn.sel-med, .prio-row .prio-btn.sel-low');
    const tags = selectedTagButtons.map(button => button.textContent?.trim()).filter(Boolean);

    // Get selected assignee ID
    const selectedAssigneeEl = document.querySelector('.assignee-grid-create .assignee-item.sel');
    const assignedToId = selectedAssigneeEl ? parseInt(selectedAssigneeEl.getAttribute('data-user-id')) : null;

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
                tags,
                due_date: dueDate ? `${dueDate}T00:00:00` : null,
                assigned_to: assignedToId,
            }),
        });

        titleInput.value = '';
        if (descInput) descInput.value = '';
        if (dueDateInput) dueDateInput.value = '';
        document.querySelectorAll('.tag-chip-item.sel').forEach(button => button.classList.remove('sel'));
        document.querySelectorAll('.prio-row .prio-btn').forEach(button => button.classList.remove('sel-high', 'sel-med', 'sel-low'));
        document.querySelectorAll('.assignee-grid-create .assignee-item.sel').forEach(item => item.classList.remove('sel'));
        const defaultHigh = document.querySelector('.prio-row .prio-btn');
        if (defaultHigh) defaultHigh.classList.add('sel-high');

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
async function openCardDetail(title, sub, desc, task = null) {
    const tEl = document.getElementById('cd-title');
    const sEl = document.getElementById('cd-sub');
    const dEl = document.getElementById('cd-desc');
    const stEl = document.getElementById('cd-status');
    const pEl = document.getElementById('cd-priority');
    const dueEl = document.getElementById('cd-due-date');
    const projectEl = document.getElementById('cd-project');
    const checklistEl = document.getElementById('cd-checklist-content');
    const commentsEl = document.getElementById('cd-comments-list');
    const commentComposeEl = document.getElementById('cd-comment-compose');
    const assigneesEl = document.getElementById('cd-assignees-content');
    const attachmentsEl = document.getElementById('cd-attachments-content');
    const attachButtonEl = document.getElementById('cd-attach-btn');
    const checklistTitleEl = document.getElementById('cd-checklist-title');
    const commentsTitleEl = document.getElementById('cd-comments-title');
    const attachmentsTitleEl = document.getElementById('cd-attachments-title');
    const commentInputEl = document.getElementById('cd-comment-input');
    const commentAvatarEl = commentComposeEl?.querySelector('.act-av');
    currentDetailTask = task;

    if (!detailDefaultsCaptured) {
        detailChecklistDefault = checklistEl?.innerHTML || '';
        detailCommentsDefault = commentsEl?.innerHTML || '';
        detailCommentComposeDisplay = commentComposeEl?.style?.display || '';
        detailAssigneesDefault = assigneesEl?.innerHTML || '';
        detailAttachmentsDefault = attachmentsEl?.innerHTML || '';
        detailAttachButtonDisplay = attachButtonEl?.style?.display || '';
        detailChecklistTitleDefault = checklistTitleEl?.innerHTML || '';
        detailCommentsTitleDefault = commentsTitleEl?.textContent || '';
        detailAttachmentsTitleDefault = attachmentsTitleEl?.textContent || '';
        detailDefaultsCaptured = true;
    }

    if (tEl) tEl.textContent = title || 'Task Detail';
    if (sEl) sEl.textContent = sub || '';
    if (dEl) dEl.value = desc || '';

    if (task) {
        if (stEl) stEl.textContent = STATUS_LABELS[task.status] || 'To Do';

        const priorityType = _priorityValueToType(task.priority);
        const priorityText = priorityType === 'high' ? '🔴 High' : priorityType === 'low' ? '🟢 Low' : '🟡 Medium';
        if (pEl) pEl.textContent = priorityText;

        const dueLabel = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        if (dueEl) dueEl.innerHTML = `<i data-lucide="calendar"></i>${_escapeHtml(dueLabel)}`;
        if (projectEl) projectEl.textContent = task.list_id ? `List #${task.list_id}` : 'General';

        if (checklistEl) {
            checklistEl.innerHTML = '<div style="padding:10px 6px;color:var(--text-secondary);font-size:12px">Checklist chưa được lưu trên backend cho task này.</div>';
        }
        if (checklistTitleEl) checklistTitleEl.innerHTML = 'Checklist <span style="color:var(--text-tertiary);font-weight:400;font-size:11px;text-transform:none;letter-spacing:0">Not connected</span>';
        if (commentsEl) {
            commentsEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">Loading comments...</div>';
        }
        if (commentsTitleEl) commentsTitleEl.textContent = 'Comments (0)';
        if (commentComposeEl) {
            commentComposeEl.style.display = 'flex';
        }
        if (commentInputEl) commentInputEl.value = '';

        const currentUser = getCurrentUser();
        if (commentAvatarEl) {
            commentAvatarEl.textContent = getUserInitials(currentUser?.name || 'U');
        }

        // Load and display assignee from database
        if (assigneesEl) {
            assigneesEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">Loading assignee...</div>';
            try {
                const usersData = await apiRequest('/users');
                const users = usersData.users || [];
                
                if (task.assigned_to) {
                    // Show assigned user
                    const assignedUser = users.find(u => u.id === task.assigned_to);
                    if (assignedUser) {
                        const initials = assignedUser.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
                        assigneesEl.innerHTML = `
                            <div style="display:flex;align-items:center;gap:9px;padding:7px;background:var(--bg);border-radius:9px">
                                <div class="act-av" style="background:linear-gradient(135deg,var(--sky),var(--violet));width:28px;height:28px;font-size:10px">${_escapeHtml(initials)}</div>
                                <div>
                                    <div style="font-size:13px;font-weight:600">${_escapeHtml(assignedUser.name || assignedUser.email)}</div>
                                    <div style="font-size:11px;color:var(--text-tertiary)">${_escapeHtml(assignedUser.role || 'Member')}</div>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    assigneesEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">No assignee</div>';
                }
            } catch (error) {
                console.error('Failed to load assignee:', error);
                assigneesEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">Error loading assignee</div>';
            }
        }

        if (attachmentsEl) {
            attachmentsEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">No attachments for this task.</div>';
        }
        if (attachmentsTitleEl) attachmentsTitleEl.textContent = 'Attachments (0)';
        if (attachButtonEl) {
            attachButtonEl.style.display = 'none';
        }

        loadCurrentTaskComments();
    } else {
        if (stEl) stEl.textContent = 'In Progress';
        if (pEl) pEl.textContent = '🟡 Medium';
        if (dueEl) dueEl.innerHTML = '<i data-lucide="calendar"></i>No due date';
        if (projectEl) projectEl.textContent = 'Website Redesign';

        if (checklistEl) checklistEl.innerHTML = detailChecklistDefault;
        if (checklistTitleEl) checklistTitleEl.innerHTML = detailChecklistTitleDefault;
        if (commentsEl) commentsEl.innerHTML = detailCommentsDefault;
        if (commentsTitleEl) commentsTitleEl.textContent = detailCommentsTitleDefault;
        if (commentComposeEl) commentComposeEl.style.display = detailCommentComposeDisplay;
        if (assigneesEl) assigneesEl.innerHTML = detailAssigneesDefault;
        if (attachmentsEl) attachmentsEl.innerHTML = detailAttachmentsDefault;
        if (attachmentsTitleEl) attachmentsTitleEl.textContent = detailAttachmentsTitleDefault;
        if (attachButtonEl) attachButtonEl.style.display = detailAttachButtonDisplay;
    }

    openModal('card-detail');
}

function _formatCommentTime(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleString();
}

async function loadCurrentTaskComments() {
    const commentsEl = document.getElementById('cd-comments-list');
    const commentsTitleEl = document.getElementById('cd-comments-title');
    if (!commentsEl || !commentsTitleEl || !currentDetailTask?.id) return;

    try {
        const data = await apiRequest(`/tasks/${currentDetailTask.id}/comments`);
        const comments = data.comments || [];
        commentsTitleEl.textContent = `Comments (${comments.length})`;

        if (!comments.length) {
            commentsEl.innerHTML = '<div style="padding:4px 0;color:var(--text-secondary);font-size:12px">No comments yet.</div>';
            return;
        }

        commentsEl.innerHTML = comments.map(comment => {
            const initials = getUserInitials(comment.user_name || 'U');
            return `
                <div class="act-item">
                    <div class="act-av" style="background:linear-gradient(135deg,var(--sky),var(--violet))">${_escapeHtml(initials)}</div>
                    <div>
                        <div class="act-text"><b>${_escapeHtml(comment.user_name || 'Unknown user')}</b> — ${_escapeHtml(comment.content || '')}</div>
                        <div class="act-time">${_escapeHtml(_formatCommentTime(comment.created_at))}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        commentsEl.innerHTML = '<div style="padding:4px 0;color:var(--coral);font-size:12px">Không thể tải comments.</div>';
        commentsTitleEl.textContent = 'Comments';
    }
}

async function postCurrentTaskComment() {
    if (!currentDetailTask?.id) {
        toast('Demo task - chưa có dữ liệu backend để comment');
        return;
    }

    const input = document.getElementById('cd-comment-input');
    const content = input?.value?.trim() || '';
    if (!content) {
        toast('Vui lòng nhập comment');
        return;
    }

    const currentUser = getCurrentUser();
    try {
        await apiRequest(`/tasks/${currentDetailTask.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                user_id: currentUser?.id || null,
            }),
        });
        if (input) input.value = '';
        await loadCurrentTaskComments();
        toast('Đã đăng comment');
    } catch (error) {
        toast(error.message || 'Không thể đăng comment');
    }
}

async function saveCurrentTaskDetails() {
    if (!currentDetailTask?.id) {
        toast('Demo task - chưa có dữ liệu backend để lưu');
        return;
    }

    const desc = document.getElementById('cd-desc')?.value?.trim() || null;
    try {
        await apiRequest(`/tasks/${currentDetailTask.id}`, {
            method: 'PUT',
            body: JSON.stringify({ description: desc }),
        });
        toast('Đã lưu mô tả task');
        closeModal('card-detail');
        await loadTasksFromBackend();
    } catch (error) {
        toast(error.message || 'Không thể lưu task');
    }
}

async function markCurrentTaskDone() {
    if (!currentDetailTask?.id) {
        toast('Demo task - chưa có dữ liệu backend để cập nhật');
        return;
    }

    try {
        await apiRequest(`/tasks/${currentDetailTask.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'done' }),
        });
        toast('Đã đánh dấu hoàn thành');
        closeModal('card-detail');
        await loadTasksFromBackend();
    } catch (error) {
        toast(error.message || 'Không thể cập nhật task');
    }
}

async function deleteCurrentTask() {
    if (!currentDetailTask?.id) {
        toast('Demo task - chưa có dữ liệu backend để xóa');
        return;
    }
    if (!confirm('Bạn có chắc muốn xóa task này?')) {
        return;
    }

    try {
        await apiRequest(`/tasks/${currentDetailTask.id}`, {
            method: 'DELETE',
        });
        toast('Đã xóa task');
        closeModal('card-detail');
        await loadTasksFromBackend();
    } catch (error) {
        toast(error.message || 'Không thể xóa task');
    }
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

function selectPriority(button, type, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    selPrio(button, type);
    return false;
}

function toggleTag(button, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    button.classList.toggle('sel');
    return false;
}

function initNewTaskInteractions() {
    const modal = document.getElementById('ov-new-task');
    if (!modal) return;

    modal.addEventListener('pointerdown', (event) => {
        const prioButton = event.target.closest('.prio-btn');
        if (prioButton) {
            event.preventDefault();
            const text = (prioButton.textContent || '').toLowerCase();
            const type = text.includes('high') ? 'high' : text.includes('low') ? 'low' : 'med';
            selPrio(prioButton, type);
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