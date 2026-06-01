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
    games = await fetchData('/api/games?status=all');
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

async function editUser(id) {
  const user = users.find(u => u._id === id);
  if (!user) return;

  const username = prompt('Username', user.username);
  const email = prompt('Email', user.email);
  const role = prompt('Role (Admin/Store/Gamer)', user.role);
  if (!username || !email || !role) return;

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ username, email, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Update failed');
    alert('User updated');
    await loadData();
  } catch (err) {
    alert(err.message);
  }
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

async function editGameBtn(id) {
  const game = games.find(g => g._id === id);
  if (!game) return;

  const title = prompt('Title', game.title);
  const pricePerDay = prompt('Price Per Day', game.pricePerDay);
  if (!title || !pricePerDay) return;

  try {
    const res = await fetch(`/api/games/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ title, pricePerDay })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    alert('Game updated');
    await loadData();
  } catch (err) {
    alert(err.message);
  }
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
function logout() {
  fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() }).catch(() => {});
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  window.location.href = '/login';
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

  loadData();

  document.getElementById('user-type-filter')?.addEventListener('change', renderUsers);
  document.getElementById('add-admin-form')?.addEventListener('submit', handleAdmin);
});
