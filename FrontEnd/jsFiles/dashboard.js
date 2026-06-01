// dashboard.js (Admin) — token-only auth

let users = [];
let games = [];
let chartObj = null;

// ==========================================
// 🔑 AUTH HELPERS
// ==========================================
const getToken = () => localStorage.getItem('token');

const getHeaders = (json = false) => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
};

const saveCache = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const getCache = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};

function navigateToSection(sectionId, btn) {
  document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
  const sec = document.getElementById(sectionId);
  if (sec) sec.style.display = 'block';
  document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function showModTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = 'block';
}

// ==========================================
// 📡 FETCH HELPER
// ==========================================
async function fetchData(endpoint) {
  try {
    const res = await fetch(endpoint, { headers: getHeaders() });

    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);

    const data = await res.json();
    saveCache(endpoint, data);
    return data;
  } catch (err) {
    console.error(err);
    return getCache(endpoint) || [];
  }
}

// ==========================================
// 📦 LOAD DATA
// ==========================================
async function loadData() {
  try {
    users = await fetchData('/api/users');
   games = await fetchData('/api/games');
    updateUI();
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// 🖥️ UI
// ==========================================
function updateUI() {
  updateDashboard();
  renderUsers();
  renderGames();
  if (typeof Chart !== 'undefined') renderChart();
  renderModeration();
}

function updateDashboard() {
  const container = document.getElementById('dashboard-cards');
  if (!container) return;

  const totalValue = games.reduce((sum, game) => sum + (Number(game.pricePerDay) || 0), 0);

  const cards = [
    { title: 'Total Users', value: users.length },
    { title: 'Pending Stores', value: users.filter(u => u.role === 'Store' && !u.approved).length, link: '/approve-lenders' },
    { title: 'Total Games', value: games.length },
    { title: 'Inventory Value', value: `${totalValue.toFixed(2)} EGP` }
  ];

  container.innerHTML = cards.map(card => `
    <div class="card" ${card.link ? `onclick="window.location.href='${card.link}'" style="cursor:pointer"` : ''}>
      <h3>${card.title}</h3>
      <p>${card.value}</p>
    </div>
  `).join('');
}

function renderChart() {
  const canvas = document.getElementById('gamesBarChart');
  if (!canvas) return;

  const stores = users.filter(u => u.role === 'Store' && u.approved);
  const labels = stores.map(s => s.username);
  const counts = stores.map(store => games.filter(g => String(g.storeID) === String(store.storeID)).length);

  if (chartObj) chartObj.destroy();

  chartObj = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Games', data: counts, borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// ==========================================
// 👥 USERS
// ==========================================
function renderUsers() {
  const table = document.getElementById('users-table');
  if (!table) return;

  const filter = document.getElementById('user-type-filter')?.value || 'all';

  const filtered = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'admin') return user.role === 'Admin';
    if (filter === 'business') return user.role === 'Store';
    if (filter === 'customer') return user.role === 'Gamer';
    return true;
  });

  table.innerHTML = `
    <thead>
      <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
    </thead>
    <tbody>
      ${filtered.map(user => `
        <tr>
          <td>${user._id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>
            <button onclick="editUser('${user._id}')">Edit</button>
            <button onclick="deleteUser('${user._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

let editingUserId = null;

function editUser(id) {
  const user = users.find(u => u._id === id);
  if (!user) return;

  editingUserId = id;

  const table = document.getElementById('users-table');

  document.getElementById('edit-user-row')?.remove();

  const row = document.createElement('tr');
  row.id = 'edit-user-row';
  row.innerHTML = `
    <td colspan="5">
      <div style="padding:10px; background:#111; color:white; border-radius:10px;">
        <h4>Edit User</h4>

        <input id="edit-username" value="${user.username}" />
        <input id="edit-email" value="${user.email}" />
        <input id="edit-role" value="${user.role}" />

        <div style="margin-top:10px;">
          <button onclick="saveUserEdit()">Save</button>
          <button onclick="cancelUserEdit()">Cancel</button>
        </div>
      </div>
    </td>
  `;

  table.querySelector('tbody').prepend(row);
}

async function saveUserEdit() {
  const username = document.getElementById('edit-username').value;
  const email = document.getElementById('edit-email').value;
  const role = document.getElementById('edit-role').value;

  try {
    const res = await fetch(`/api/users/${editingUserId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ username, email, role })
    });

    if (!res.ok) throw new Error('Failed');

    showToast('User updated', 'success');

    editingUserId = null;
    document.getElementById('edit-user-row')?.remove();
    await loadData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function cancelUserEdit() {
  editingUserId = null;
  document.getElementById('edit-user-row')?.remove();
}

async function deleteUser(id) {
  if (!confirm('Delete user?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    alert('User deleted');
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// 🎮 GAMES
// ==========================================
function getVendor(game) {
  const store = users.find(u => String(u.storeID) === String(game.storeID));
  return store ? store.username : 'Unknown';
}

function renderGames() {
  const table = document.getElementById('games-table');
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr><th>ID</th><th>Title</th><th>Platform</th><th>Category</th><th>Status</th><th>Vendor</th><th>Price/Day</th><th>Actions</th></tr>
    </thead>
    <tbody>
      ${games.map(game => `
        <tr>
          <td>${game.gameID}</td>
          <td>${game.title}</td>
          <td>${game.platform}</td>
          <td>${game.category}</td>
          <td>${game.status}</td>
          <td>${getVendor(game)}</td>
          <td>${game.pricePerDay}</td>
          <td>
            <button onclick="editGameBtn('${game._id}')">Edit</button>
            <button onclick="deleteGame('${game._id}')">Delete</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

let editingGameId = null;

function editGameBtn(id) {
  const game = games.find(g => g._id === id);
  if (!game) return;

  editingGameId = id;

  const table = document.getElementById('games-table');

  document.getElementById('edit-game-row')?.remove();

  const row = document.createElement('tr');
  row.id = 'edit-game-row';
  row.innerHTML = `
    <td colspan="8">
      <div style="padding:10px; background:#111; color:white; border-radius:10px;">
        <h4>Edit Game</h4>

        <input id="edit-title" value="${game.title}" />
        <input id="edit-price" value="${game.pricePerDay}" />

        <div style="margin-top:10px;">
          <button onclick="saveGameEdit()">Save</button>
          <button onclick="cancelGameEdit()">Cancel</button>
        </div>
      </div>
    </td>
  `;

  table.querySelector('tbody').prepend(row);
}

async function saveGameEdit() {
  const title = document.getElementById('edit-title').value;
  const pricePerDay = document.getElementById('edit-price').value;

  try {
    const res = await fetch(`/api/games/${editingGameId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ title, pricePerDay })
    });

    if (!res.ok) throw new Error('Failed');

    showToast('Game updated', 'success');

    editingGameId = null;
    document.getElementById('edit-game-row')?.remove();
    await loadData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function cancelGameEdit() {
  editingGameId = null;
  document.getElementById('edit-game-row')?.remove();
}

async function deleteGame(id) {
  if (!confirm('Delete game?')) return;
  try {
    const res = await fetch(`/api/games/${id}`, { method: 'DELETE', headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    alert('Game deleted');
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// 👤 CREATE ADMIN
// ==========================================
async function handleAdmin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  if (data.password !== data.confirmPassword) {
    return alert('Passwords do not match');
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: data.username, email: data.email, password: data.password, role: 'Admin' })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error);
    alert('Admin created');
    e.target.reset();
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// 🚪 LOGOUT
// ==========================================
async function logout() {
  const confirmed = await showConfirm('Are you sure you want to log out?');
  if (!confirmed) return;

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getHeaders()
    });
  } catch (err) {}

  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('pshub_wishlist');

  window.location.href = '/login';
}


function renderModeration() {
  const table = document.getElementById('mod-games-table');
  if (!table) return;

  const reported = games.filter(g => g.status === 'Reported');

  table.innerHTML = `
    <thead>
      <tr>
        <th>Title</th>
        <th>Store</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${reported.length ? reported.map(g => `
        <tr>
          <td>${g.title}</td>
          <td>${getVendor(g)}</td>
          <td>${g.status}</td>
          <td>
            <button onclick="unreportGame('${g._id}')">Approve</button>
          </td>
        </tr>
      `).join('') : `
        <tr><td colspan="4">No reported games</td></tr>
      `}
    </tbody>
  `;
}
// ==========================================
// 🚀 INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  window.addEventListener('pageshow', loadData);

  loadData();

  document.getElementById('user-type-filter')?.addEventListener('change', renderUsers);
  document.getElementById('add-admin-form')?.addEventListener('submit', handleAdmin);
});
