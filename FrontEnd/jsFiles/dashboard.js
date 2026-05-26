let users = [], games = [], chartObj;

// Helper to save to localStorage (optional cache)
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Fetch data from server API endpoints
const fetchData = async (endpoint) => {
  try {
    const res = await fetch(endpoint, { credentials: 'include' }); // include cookies if session used
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
    .filter(u => filter === 'all' || u.role === filter)
    .map((u, i) => `
      <tr>
        <td>${u._id}</td>
        <td>${u.username}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td class="users-action">
          <button class="action-btn" onclick="editUser(${i})"><i class="fas fa-edit"></i></button>
          <button class="action-btn" onclick="delUser(${i})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`)
    .join('');
  tbl.innerHTML = header + `<tbody>${rows}</tbody>`;
};

const editUser = (i) => {
  let u = users[i];
  let n = prompt('Full Name:', u.username);
  let un = prompt('Username:', u.username);
  let e = prompt('Email:', u.email);
  let r = prompt('Role (Admin/Store/Customer):', u.role);
  if (!n || !un || !e || !r) return alert('Invalid inputs.');
  // Basic validation
  if (['Admin', 'Store', 'Customer'].indexOf(r) === -1) return alert('Invalid role.');
  // Update locally and send patch to server (optional)
  users[i] = { ...u, username: n, email: e, role: r };
  save('/api/users', users);
  updateUI();
};

const delUser = (i) => {
  if (!confirm('Delete user?')) return;
  users.splice(i, 1);
  save('/api/users', users);
  updateUI();
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
      <td class="games-action"><button class="action-btn" onclick="delGame('${g.gameID}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('');
  tbl.innerHTML = header + `<tbody>${rows}</tbody>`;
};

const delGame = (id) => {
  if (!confirm('Delete game?')) return;
  games = games.filter(g => g.gameID !== id);
  save('/api/games', games);
  updateUI();
};

// Legacy initialization and duplicate definitions removed

const handleAdmin = (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  if (d.password !== d.confirmPassword) return alert("Password mismatch!");
  if (users.some(u => u.username === d.username || u.email === d.email)) return alert("User exists!");
  users.push({ userID: Math.max(0, ...users.map(u => +u.userID || 0)) + 1, ...d, type: "admin", status: "active" });
  save("users", users); updateUI(); e.target.reset(); alert("Admin added!");
};

const setupModeration = () => showModTab('mod-games');

function showModTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (id === 'mod-games') {
    const flagged = JSON.parse(localStorage.getItem('pshub_inventory') || '[]').filter(g => g.flagged);
    document.getElementById('mod-games-table').innerHTML = flagged.length ? `<thead><th>G-ID</th><th>Title</th><th>Actions</th></thead>` + flagged.map(g => `<tr><td>${g.gameID}</td><td>${g.title}</td><td style="display:flex;gap:8px"><button class="action-btn" onclick="handleMod('game','${g.gameID}','keep')">✅</button><button class="action-btn" onclick="handleMod('game','${g.gameID}','del')" style="background:#e74c3c">🗑️</button></td></tr>`).join('') : '<p style="padding:10px">No reports</p>';
  } else if (id === 'mod-reviews') {
    let revs = [];
    for (let i = 0; i < localStorage.length; i++) {
      let k = localStorage.key(i);
      if (k.startsWith('reviews_')) JSON.parse(localStorage.getItem(k)).forEach((r, idx) => r.flagged && revs.push({ ...r, gID: k.split('_')[1], idx }));
    }
    document.getElementById('mod-reviews').innerHTML = revs.length ? revs.map(r => `<div style="background:rgba(255,255,255,0.05);padding:15px;margin:10px 0;border-radius:8px;border-left:4px solid var(--primary-color)"><strong>${r.reviewer}</strong>: ${r.comment} <div style="margin-top:10px"><button class="action-btn" onclick="handleMod('rev','${r.gID}','keep',${r.idx})">Keep</button><button class="action-btn" onclick="handleMod('rev','${r.gID}','del',${r.idx})" style="background:#e74c3c">Delete</button></div></div>`).join('') : '<p style="padding:10px">No reported reviews</p>';
  }
}

function handleMod(type, id, act, idx) {
  if (type === 'game') {
    let inv = JSON.parse(localStorage.getItem('pshub_inventory'));
    let i = inv.findIndex(g => g.gameID === id);
    act === 'keep' ? delete inv[i].flagged : inv.splice(i, 1);
    localStorage.setItem('pshub_inventory', JSON.stringify(inv));
    showModTab('mod-games');
  } else if (type === 'rev') {
    let k = 'reviews_' + id, r = JSON.parse(localStorage.getItem(k));
    act === 'keep' ? delete r[idx].flagged : r.splice(idx, 1);
    localStorage.setItem(k, JSON.stringify(r));
    showModTab('mod-reviews');
  }
  updateUI();
}

// Added navigation helper
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