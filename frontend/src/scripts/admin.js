
// ── DATA ──
let users = [
    { id: 1, name: 'Tien Nguyen', email: 'tienn123@ut.edu.vn', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Hung Pham', email: 'hungnp1272@ut.edu.vn', role: 'User', status: 'Active' },
    { id: 3, name: 'Ngoc Anh', email: 'ngocnta4878@ut.edu.vn', role: 'User', status: 'Active' },
    { id: 4, name: 'Chi Trung', email: 'trungnc7062@ut.edu.vn', role: 'User', status: 'Active' },
    { id: 5, name: 'Lan Huong', email: 'huonglt9921@ut.edu.vn', role: 'User', status: 'Active' },
    { id: 6, name: 'Minh Duc', email: 'ducnm5543@ut.edu.vn', role: 'Admin', status: 'Active' },
    { id: 7, name: 'Thanh Thao', email: 'thaott1135@ut.edu.vn', role: 'User', status: 'Active' },
    { id: 8, name: 'Quoc Bao', email: 'baonq8872@ut.edu.vn', role: 'User', status: 'Active' },
];
let editingId = null;
let deletingId = null;
let nextId = 9;

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

function saveUser() {
    const name = document.getElementById('um-name').value.trim();
    const email = document.getElementById('um-email').value.trim();
    const role = document.getElementById('um-role').value;
    const status = document.getElementById('um-status').value;
    if (!name || !email) { showToast('Please fill all required fields'); return; }
    if (editingId) {
        const u = users.find(u => u.id === editingId);
        u.name = name; u.email = email; u.role = role; u.status = status;
        showToast('User updated!');
    } else {
        users.push({ id: nextId++, name, email, role, status });
        showToast('User added!');
    }
    renderTable();
    closeModal('add-user');
}

function openDelete(id) {
    deletingId = id;
    const u = users.find(u => u.id === id);
    document.getElementById('del-name').textContent = u.name;
    openModal('delete-user');
}
function confirmDelete() {
    users = users.filter(u => u.id !== deletingId);
    renderTable();
    showToast('User deleted');
    closeModal('delete-user');
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

renderTable();
lucide.createIcons();
