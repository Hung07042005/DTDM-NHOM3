const API_BASE = '/api';

let users = [];
let editingId = null;
let deletingId = null;

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

async function loadUsers() {
    try {
        const data = await apiRequest('/users');
        users = data.users || [];
        renderTable();
    } catch (error) {
        showToast(`Load users failed: ${error.message}`);
    }
}

function renderTable() {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td class="name">${u.name}</td>
      <td class="email">${u.email}</td>
      <td><span class="role-badge ${u.role === 'Admin' ? 'role-admin' : 'role-user'}">${u.role}</span></td>
      <td><span class="status-dot">${u.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="act-btn act-edit" onclick="openEdit(${u.id})">Edit</button>
          <button class="act-btn act-delete" onclick="openDelete(${u.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
    lucide.createIcons();
}

function openModal(name) {
    document.getElementById('ov-' + name)?.classList.add('open');
}
function closeModal(name) {
    document.getElementById('ov-' + name)?.classList.remove('open');
}
document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

function openEdit(id) {
    editingId = id;
    const u = users.find(u => u.id === id);
    document.getElementById('user-modal-title').textContent = 'Edit User';
    document.getElementById('um-name').value = u.name;
    document.getElementById('um-email').value = u.email;
    document.getElementById('um-role').value = u.role;
    document.getElementById('um-status').value = u.status;
    document.getElementById('um-save-btn').textContent = 'Save Changes';
    openModal('add-user');
}

function openAddUser() {
    editingId = null;
    document.getElementById('user-modal-title').textContent = 'Add User';
    document.getElementById('um-name').value = '';
    document.getElementById('um-email').value = '';
    document.getElementById('um-role').value = 'User';
    document.getElementById('um-status').value = 'Active';
    document.getElementById('um-save-btn').textContent = 'Save User';
    openModal('add-user');
}

async function saveUser() {
    const name = document.getElementById('um-name').value.trim();
    const email = document.getElementById('um-email').value.trim();
    const role = document.getElementById('um-role').value;
    const status = document.getElementById('um-status').value;
    if (!name || !email) { showToast('Please fill all required fields'); return; }

    try {
        const payload = { name, email, role, status };
        if (editingId) {
            await apiRequest(`/users/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            showToast('User updated!');
        } else {
            await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            showToast('User added!');
        }
        await loadUsers();
        closeModal('add-user');
    } catch (error) {
        showToast(error.message);
    }
}

function openDelete(id) {
    deletingId = id;
    const u = users.find(u => u.id === id);
    document.getElementById('del-name').textContent = u.name;
    openModal('delete-user');
}
async function confirmDelete() {
    try {
        await apiRequest(`/users/${deletingId}`, { method: 'DELETE' });
        await loadUsers();
        showToast('User deleted');
        closeModal('delete-user');
    } catch (error) {
        showToast(error.message);
    }
}

let toastTimer;
function showToast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    lucide.createIcons();
}

function setActive(el) {
    document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// ── CHARTS ──
Chart.defaults.font.family = "'Instrument Sans', sans-serif";
Chart.defaults.color = '#8a9ab5';

new Chart(document.getElementById('taskChart'), {
    type: 'bar',
    data: {
        labels: ['Completed', 'Pending', 'Overdue'],
        datasets: [{
            data: [605, 387, 257],
            backgroundColor: ['rgba(78,181,247,.8)', 'rgba(255,197,66,.8)', 'rgba(239,68,68,.8)'],
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 36,
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8a9ab5', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,.05)' }, border: { display: false }, ticks: { color: '#8a9ab5', font: { size: 11 } } }
        }
    }
});

new Chart(document.getElementById('activityChart'), {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            data: [60, 80, 140, 100, 130, 150, 120],
            backgroundColor: 'rgba(78,181,247,.75)',
            borderRadius: 5,
            borderSkipped: false,
            barThickness: 22,
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8a9ab5', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,.05)' }, border: { display: false }, ticks: { color: '#8a9ab5', font: { size: 11 } } }
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await loadUsers();
});
