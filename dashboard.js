let users = [], games = [], chartObj;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const navigateToSection = (id, btn) => {
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");
    if (document.getElementById(id)) document.getElementById(id).style.display = "block";
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
};
const logout = () => confirm("Log out?") && (window.location.href = "login.html");
const handleDataReset = () => confirm("Reset data?") && (localStorage.clear(), init());

const loadData = async (key) => {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    const data = await (await fetch(`${key}.json`)).json();
    save(key, data[key] || []);
    return data[key] || [];
};

const init = async () => {
    try {
        users = await loadData("users");
        games = await loadData("games");
        updateUI();
    } catch (e) { alert("Failed to load data."); }
};

const updateUI = () => {
    updateDashboard();
    renderUsers();
    renderGames();
    if (typeof Chart !== 'undefined') renderChart();
};

const updateDashboard = () => {
    const cont = document.getElementById("dashboard-cards");
    if (!cont) return;
    const totalVal = games.reduce((s, g) => s + (Number(g.price) || 0), 0);
    const stats = [
        { t: "Total Users", v: users.length },
        { t: "Pending Users", v: users.filter(u => u.status === "pending").length, l: "approveLenders.html" },
        { t: "Total Games", v: games.length },
        { t: "Total Price Value", v: totalVal.toFixed(2) + " EGP" }
    ];
    cont.innerHTML = stats.map(s => `<div class="card" ${s.l ? `onclick="window.location.href='${s.l}'" style="cursor:pointer"` : ""}><h3>${s.t}</h3><p>${s.v}</p></div>`).join('');
};

const renderChart = () => {
    const ctx = document.getElementById('gamesBarChart');
    if (!ctx) return;
    const biz = users.filter(u => u.type === 'business' && u.status === 'accepted');
    const labels = biz.map(u => u.name);
    const data = biz.map(b => games.filter(g => +g.vendorID === +b.userID).length);

    if (chartObj) chartObj.destroy();
    chartObj = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Number of Games', data, borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.6)', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#fff', stepSize: 1 } }, x: { ticks: { color: '#fff' } } }, plugins: { legend: { labels: { color: '#fff' } }, title: { display: true, text: 'Games Distribution Trend', color: '#fff' } } }
    });
};

const renderUsers = () => {
    const filter = document.getElementById("user-type-filter")?.value || "all";
    const tbl = document.getElementById("users-table");
    if (!tbl) return;
    tbl.innerHTML = `<thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th><th>Actions</th></tr></thead><tbody>` +
        users.map((u, i) => (u.status !== "pending" && (filter === "all" || u.type === filter)) ?
            `<tr><td>${u.userID}</td><td>${u.name}</td><td>${u.username}</td><td>${u.email}</td><td><span class="badge ${u.type}">${u.type}</span></td><td class="users-action">
        <button class="action-btn" onclick="editUser(${i})"><i class="fas fa-edit"></i></button> <button class="action-btn" onclick="delUser(${i})"><i class="fas fa-trash"></i></button></td></tr>` : "").join('') + `</tbody>`;
};

const editUser = (i) => {
    let u = users[i];
    let n = prompt("Full Name:", u.name), un = prompt("Username:", u.username), e = prompt("Email:", u.email), t = prompt("Type:", u.type);
    if (!n || !un || !e || !t || !['admin', 'business', 'customer'].includes(t.toLowerCase())) return alert("Invalid inputs.");
    if ((un !== u.username && users.some(x => x.username === un)) || (e !== u.email && users.some(x => x.email === e))) return alert("Username/Email exists!");
    users[i] = { ...u, name: n, username: un, email: e, type: t.toLowerCase() };
    save("users", users); updateUI();
};
const delUser = (i) => confirm("Delete user?") && (users.splice(i, 1), save("users", users), updateUI());

const getVendor = (g) => g.vendor || (users.find(u => +u.userID === +g.vendorID)?.name || "System");

const renderGames = () => {
    const tbl = document.getElementById("games-table");
    if (!tbl) return;
    tbl.innerHTML = `<thead><tr><th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Status</th><th>Vendor</th><th>Price</th><th>Actions</th></tr></thead><tbody>` +
        games.map(g => `<tr><td>${g.gameID}</td><td>${g.name}</td><td>${g.platform}</td><td>${g.genre}</td><td>${g.Availability || "N/A"}</td><td>${getVendor(g)}</td><td>${g.price || "-"}</td><td class="games-action">
        <button class="action-btn" onclick="editGame('${g.gameID}')"><i class="fas fa-edit"></i></button> <button class="action-btn" onclick="delGame('${g.gameID}')"><i class="fas fa-trash"></i></button></td></tr>`).join('') + `</tbody>`;
};

const editGame = (id) => {
    const i = games.findIndex(g => g.gameID === id);
    if (i < 0) return;
    let g = games[i], n = prompt("Name:", g.name), pl = prompt("Platform:", g.platform), ge = prompt("Genre:", g.genre), a = prompt("Status:", g.Availability), v = prompt("Vendor:", getVendor(g)), pr = prompt("Price:", g.price);
    if (!n || !pl || !ge || !a || !v || !pr) return;
    let vu = users.find(u => u.name.toLowerCase() === v.toLowerCase());
    games[i] = { ...g, name: n, platform: pl, genre: ge, Availability: a.toLowerCase() === 'rent' ? 'rent' : 'buy', vendorID: vu?.userID || null, vendor: vu ? undefined : v, price: +pr };
    save("games", games); updateUI();
};
const delGame = (id) => confirm("Delete game?") && (games = games.filter(g => g.gameID !== id), save("games", games), updateUI());

const handleAdmin = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (d.password.length < 6 || d.password !== d.confirmPassword) return alert("Password issue!");
    if (users.some(u => u.username === d.username || u.email === d.email)) return alert("User exists!");
    users.push({ userID: Math.max(0, ...users.map(u => +u.userID || 0)) + 1, ...d, type: "admin", status: "active" });
    save("users", users); updateUI(); e.target.reset(); alert("Admin added!");
};

const openAddGameModal = () => document.getElementById("add-game-form-container").style.display = "block";
const closeAddGameModal = () => document.getElementById("add-game-form-container").style.display = "none";

const handleGame = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let vu = users.find(u => u.name.toLowerCase() === d.gamevendor.toLowerCase());
    games.push({ gameID: String(Math.max(0, ...games.map(g => +g.gameID || 0)) + 1).padStart(3, '0'), ...d, Availability: d.availability || "buy", vendorID: vu?.userID || null, vendor: vu ? undefined : d.gamevendor, price: +d.price });
    save("games", games); updateUI(); e.target.reset(); closeAddGameModal();
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
    } else if (id === 'mod-lenders') {
        const pending = users.filter(u => u.type === 'business' && u.status === 'pending');
        document.getElementById('mod-lenders-table').innerHTML = pending.length ? `<thead><th>Store</th><th>Actions</th></thead>` + pending.map(u => `<tr><td>${u.username}</td><td style="display:flex;gap:8px"><button class="action-btn" onclick="handleMod('len',${u.userID},'ok')">Approve</button><button class="action-btn" onclick="handleMod('len',${u.userID},'no')" style="background:#e74c3c">Reject</button></td></tr>`).join('') : '<p style="padding:10px">No pending lenders</p>';
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
    } else if (type === 'len') {
        let i = users.findIndex(u => u.userID === id);
        users[i].status = (act === 'ok' ? 'active' : 'rejected');
        save('users', users);
        showModTab('mod-lenders');
    }
    updateUI();
}

document.addEventListener("DOMContentLoaded", () => {
    init();
    navigateToSection('dashboard', document.querySelector(".sidebar nav button"));
    document.getElementById("user-type-filter")?.addEventListener("change", renderUsers);
    document.getElementById("add-admin-form")?.addEventListener("submit", handleAdmin);
    document.getElementById("add-game-form")?.addEventListener("submit", handleGame);
});