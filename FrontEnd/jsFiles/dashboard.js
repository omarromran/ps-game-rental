let users = [], games = [], chartObj;

// Helper to save to localStorage (optional cache)
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Fetch data from server API endpoints
const fetchData = async (endpoint) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(endpoint, {
      credentials: 'include',
      headers
    });
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    const data = await res.json();
    // For consistency, store the raw array in localStorage for offline fallback
    save(endpoint, data);
    return data;
  } catch (e) {
    console.error(e);
    // Fallback to localStorage if available
    const stored = localStorage.getItem(endpoint);
    return stored ? JSON.parse(stored) : [];
  }
};

const loadData = async () => {
  // Fetch users and games from API; endpoints match server routes
  users = await fetchData('/api/users');
  games = await fetchData('/api/games');
  updateUI();
};

const updateUI = () => {
  updateDashboard();
  renderUsers();
  renderGames();
  if (typeof Chart !== 'undefined') renderChart();
};

const updateDashboard = () => {
  const cont = document.getElementById('dashboard-cards');
  if (!cont) return;
  const totalVal = games.reduce((s, g) => s + (Number(g.pricePerDay) || 0), 0);
  const stats = [
    { t: 'Total Users', v: users.length },
    { t: 'Pending Stores', v: users.filter(u => u.role === 'Store' && !u.approved).length, l: '/approveLenders' },
    { t: 'Total Games', v: games.length },
    { t: 'Total Price Value', v: totalVal.toFixed(2) + ' EGP' }
  ];
  cont.innerHTML = stats.map(s => `
    <div class="card" ${s.l ? `onclick="window.location.href='${s.l}'" style="cursor:pointer"` : ''}>
      <h3>${s.t}</h3>
      <p>${s.v}</p>
    </div>`).join('');
};

// Chart showing number of games per store (vendor)
const renderChart = () => {
  const ctx = document.getElementById('gamesBarChart');
  if (!ctx) return;
  // Map store IDs to store names using users list
  const stores = users.filter(u => u.role === 'Store' && u.approved);
  const labels = stores.map(s => s.username || s.email);
  const data = stores.map(store => games.filter(g => g.storeID === store._id.toString()).length);

  if (chartObj) chartObj.destroy();
  chartObj = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Number of Games', data, borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.6)', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#fff', stepSize: 1 } }, x: { ticks: { color: '#fff' } } }, plugins: { legend: { labels: { color: '#fff' } }, title: { display: true, text: 'Games Distribution per Store', color: '#fff' } } }
  });
};

const renderUsers = () => {
  const filter = document.getElementById('user-type-filter')?.value || 'all';
  const tbl = document.getElementById('users-table');
  if (!tbl) return;
  const header = `
    <thead><tr>
      <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th>
    </tr></thead>`;
  const rows = users
    .filter(u => {
      if (filter === 'all') return true;
      if (filter === 'admin') return u.role?.toLowerCase() === 'admin';
      if (filter === 'business') return u.role?.toLowerCase() === 'store';
      if (filter === 'customer') return u.role?.toLowerCase() === 'gamer';
      return u.role === filter;
    })
    .map((u, i) => `
      <tr>
        <td>${u._id}</td>
        <td>${u.username}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td class="users-action">
          <button class="action-btn" onclick="editUser('${u._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn" onclick="delUser('${u._id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`)
    .join('');
  tbl.innerHTML = header + `<tbody>${rows}</tbody>`;
};

const editUser = async (id) => {
  let u = users.find(item => item._id === id);
  if (!u) return;
  let n = prompt('Full Name:', u.username);
  let un = prompt('Username:', u.username);
  let e = prompt('Email:', u.email);
  let r = prompt('Role (Admin/Store/Gamer):', u.role);
  if (!n || !un || !e || !r) return alert('Invalid inputs.');
  // Basic validation
  if (['Admin', 'Store', 'Gamer'].indexOf(r) === -1) return alert('Invalid role. Use Admin, Store, or Gamer.');
  
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        username: un.trim(),
        email: e.trim(),
        role: r
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to update user');
    }
    alert('User updated successfully!');
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const delUser = async (id) => {
  if (!confirm('Delete user?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to delete user');
    }
    alert('User deleted successfully!');
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

// Helper to get store/vendor name for a game
const getVendor = (g) => {
  const store = users.find(u => u._id.toString() === g.storeID?.toString());
  return store ? store.username : 'System';
};

const renderGames = () => {
  const tbl = document.getElementById('games-table');
  if (!tbl) return;
  const header = `
    <thead><tr>
      <th>ID</th><th>Title</th><th>Platform</th><th>Category</th><th>Status</th><th>Vendor</th><th>Price/Day</th><th>Actions</th>
    </tr></thead>`;
  const rows = games.map(g => `
    <tr>
      <td>${g.gameID}</td>
      <td>${g.title}</td>
      <td>${g.platform}</td>
      <td>${g.category}</td>
      <td>${g.status}</td>
      <td>${getVendor(g)}</td>
      <td>${g.pricePerDay || '-'}
      <td class="games-action">
        <button class="action-btn" onclick="editGameBtn('${g._id}')"><i class="fas fa-edit"></i></button>
        <button class="action-btn" onclick="delGame('${g._id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
  tbl.innerHTML = header + `<tbody>${rows}</tbody>`;
};

const editGameBtn = async (id) => {
  let g = games.find(item => item._id === id);
  if (!g) return;
  let title = prompt('Title:', g.title);
  let platform = prompt('Platform (PS4/PS5):', g.platform);
  let category = prompt('Category:', g.category);
  let status = prompt('Status (Available/Rented/Maintenance):', g.status);
  let pricePerDay = prompt('Price Per Day:', g.pricePerDay);
  if (!title || !platform || !category || !status || !pricePerDay) return alert('Invalid inputs.');
  
  if (['PS4', 'PS5'].indexOf(platform) === -1) return alert('Platform must be PS4 or PS5.');
  if (['Available', 'Rented', 'Maintenance'].indexOf(status) === -1) return alert('Invalid status.');
  if (isNaN(pricePerDay) || Number(pricePerDay) <= 0) return alert('Price must be a positive number.');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/games/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        title: title.trim(),
        platform,
        category: category.trim(),
        status,
        pricePerDay: Number(pricePerDay)
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to update game');
    }
    alert('Game updated successfully!');
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

const delGame = async (id) => {
  if (!confirm('Delete game?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/games/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to delete game');
    }
    alert('Game deleted successfully!');
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

// Legacy initialization and duplicate definitions removed

const handleAdmin = async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  if (d.password !== d.confirmPassword) return alert("Password mismatch!");
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: d.username.trim(),
        email: d.email.trim(),
        password: d.password,
        role: 'Admin'
      })
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to create admin');
    }
    
    alert("Admin added successfully!");
    e.target.reset();
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

// ─── ADD GAME (Admin) ────────────────────────────────────────────
const handleGame = async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData  // FormData handles multipart/form-data for file uploads
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to add game');
    }
    alert('Game added successfully!');
    form.reset();
    await loadData();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

// ─── MODERATION (Database-backed) ────────────────────────────────
const setupModeration = () => showModTab('mod-games');

function showModTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (id === 'mod-games') {
    // Show games in Maintenance status (flagged for review)
    const flagged = games.filter(g => g.status === 'Maintenance');
    document.getElementById('mod-games-table').innerHTML = flagged.length
      ? `<thead><tr><th>Game ID</th><th>Title</th><th>Platform</th><th>Actions</th></tr></thead><tbody>` +
        flagged.map(g => `<tr>
          <td>${g.gameID}</td>
          <td>${g.title}</td>
          <td>${g.platform}</td>
          <td style="display:flex;gap:8px">
            <button class="action-btn" onclick="handleMod('game','${g._id}','keep')" title="Restore">✅</button>
            <button class="action-btn" onclick="handleMod('game','${g._id}','del')" style="background:#e74c3c" title="Delete">🗑️</button>
          </td>
        </tr>`).join('') + `</tbody>`
      : '<p style="padding:10px">No flagged games</p>';
  } else if (id === 'mod-reviews') {
    document.getElementById('mod-reviews').innerHTML = '<p style="padding:10px">No reported reviews</p>';
  }
}

async function handleMod(type, id, act) {
  const token = localStorage.getItem('token');
  try {
    if (type === 'game') {
      if (act === 'keep') {
        // Restore game to Available status in the database
        const res = await fetch(`/api/games/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ status: 'Available' })
        });
        if (!res.ok) throw new Error('Failed to restore game');
        alert('Game restored to Available!');
      } else {
        // Delete game from the database
        const res = await fetch(`/api/games/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (!res.ok) throw new Error('Failed to delete game');
        alert('Game deleted!');
      }
      await loadData();
      showModTab('mod-games');
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ─── NAVIGATION HELPER ──────────────────────────────────────────
function navigateToSection(sectionId, btn) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Show target section and hide others
    document.querySelectorAll('main > section').forEach(s => {
      s.style.display = s.id === sectionId ? 'block' : 'none';
    });
    // Highlight active button
    document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  navigateToSection('dashboard', document.querySelector(".sidebar nav button"));
  document.getElementById("user-type-filter")?.addEventListener("change", renderUsers);
  document.getElementById("add-admin-form")?.addEventListener("submit", handleAdmin);
  document.getElementById("add-game-form")?.addEventListener("submit", handleGame);
});