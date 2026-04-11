let users = [], games = [], chartObj;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// --- NAVIGATION & UI ---
const navigateToSection = (id, btn) => {
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");
    if (document.getElementById(id)) document.getElementById(id).style.display = "block";
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
};
const logout = () => confirm("Log out?") && (window.location.href = "login.html");
const handleDataReset = () => confirm("Reset data?") && (localStorage.clear(), init());

// --- INITIALIZATION ---
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

// --- DASHBOARD STATISTICS ---
const updateDashboard = () => {
    const cont = document.getElementById("dashboard-cards");
    if (!cont) return;
    const totalVal = games.reduce((s, g) => s + (Number(g.price) || 0), 0);
    const stats = [
        { t: "Total Users", v: users.length },
        { t: "Pending Users", v: users.filter(u => u.status === "pending").length, l: "approveLenders.html" },
        { t: "Total Games", v: games.length },
        { t: "Available for Rent", v: games.filter(g => (g.Availability || "").toLowerCase() === "rent").length },
        { t: "Total Price Value", v: totalVal + " EGP" }
    ];
    cont.innerHTML = stats.map(s => `<div class="card" ${s.l ? `onclick="window.location.href='${s.l}'" style="cursor:pointer"` : ""}><h3>${s.t}</h3><p>${s.v}</p></div>`).join('');
};

const renderChart = () => {
    const ctx = document.getElementById('gamesBarChart');
    if (!ctx) return;
    const biz = users.filter(u => u.type === 'business');
    const labels = [...biz.map(u => u.name), "System/Others"];
    const data = biz.map(b => games.filter(g => +g.vendorID === +b.userID).length)
        .concat(games.filter(g => !biz.some(b => +b.userID === +g.vendorID)).length);

    if (chartObj) chartObj.destroy();
    chartObj = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Number of Games', data, borderColor: '#36a2eb', backgroundColor: 'rgba(54, 162, 235, 0.6)', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#fff', stepSize: 1 } }, x: { ticks: { color: '#fff' } } }, plugins: { legend: { labels: { color: '#fff' } }, title: { display: true, text: 'Games Distribution Trend', color: '#fff' } } }
    });
};

// --- USER MANAGEMENT ---
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

// --- GAME MANAGEMENT ---
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

// --- FORMS ---
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

// --- BOOTSTRAP ---
document.addEventListener("DOMContentLoaded", () => {
    init();
    navigateToSection('dashboard', document.querySelector(".sidebar nav button"));
    document.getElementById("user-type-filter")?.addEventListener("change", renderUsers);
    document.getElementById("add-admin-form")?.addEventListener("submit", handleAdmin);
    document.getElementById("add-game-form")?.addEventListener("submit", handleGame);
});

// --- MODERATION ---
const setupModeration = () => showModTab('mod-games');

const showModTab = (id) => {
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.getElementById(id).style.display = "block";
    if (id === 'mod-games') renderModGames();
    if (id === 'mod-reviews') renderModReviews();
    if (id === 'mod-lenders') renderModLenders();
};

const renderModGames = () => {
    const inv = JSON.parse(localStorage.getItem('browseGames_db') || '[]');
    const flagged = inv.filter(g => g.flagged);
    const tbl = document.getElementById("mod-games-table");
    if (!tbl) return;
    if (!flagged.length) return tbl.innerHTML = '<tr><td style="color:#888;padding:20px;">No reported games found.</td></tr>';
    tbl.innerHTML = `<thead><tr><th>ID</th><th>Game</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead><tbody>` +
        flagged.map(g => `<tr><td>${g.gameID}</td><td>${g.title}</td><td>${g.category}</td><td>$${g.price}</td><td>
        <button class="action-btn" onclick="modDeleteGame('${g.gameID}')" style="background:#e74c3c"><i class="fas fa-trash"></i> Delete</button>
        <button class="action-btn" onclick="modDismissGame('${g.gameID}')" style="background:#2ecc71"><i class="fas fa-check"></i> Dismiss</button>
        </td></tr>`).join('') + `</tbody>`;
};

const modDeleteGame = (id) => {
    if (!confirm("Permanently remove this game from the platform?")) return;
    let inv = JSON.parse(localStorage.getItem('browseGames_db') || '[]');
    inv = inv.filter(g => g.gameID !== id);
    localStorage.setItem('browseGames_db', JSON.stringify(inv));
    renderModGames();
};

const modDismissGame = (id) => {
    let inv = JSON.parse(localStorage.getItem('browseGames_db') || '[]');
    const i = inv.findIndex(g => g.gameID === id);
    if (i > -1) { delete inv[i].flagged; localStorage.setItem('browseGames_db', JSON.stringify(inv)); renderModGames(); }
};

const renderModReviews = () => {
    const cont = document.getElementById("mod-reviews");
    if (!cont) return;
    const inv = JSON.parse(localStorage.getItem('browseGames_db') || '[]');
    let html = '';
    inv.forEach(game => {
        const reviews = JSON.parse(localStorage.getItem('reviews_' + game.gameID) || '[]');
        const flagged = reviews.filter(r => r.flagged);
        if (flagged.length) {
            html += `<h3 style="margin:20px 0 10px; color:#5b9bd5;">${game.title} (ID: ${game.gameID})</h3>` +
                `<table class="mod-subtable"><thead><tr><th>User</th><th>Comment</th><th>Stars</th><th>Actions</th></tr></thead><tbody>` +
                flagged.map((r, i) => {
                    const originalIdx = reviews.indexOf(r);
                    return `<tr><td>${r.reviewer}</td><td>${r.comment}</td><td>${r.rating}★</td><td>
                    <button class="action-btn" onclick="modDeleteReview('${game.gameID}', ${originalIdx})" style="background:#e74c3c">Delete</button>
                    <button class="action-btn" onclick="modDismissReview('${game.gameID}', ${originalIdx})" style="background:#2ecc71">Dismiss</button>
                    </td></tr>`;
                }).join('') + `</tbody></table>`;
        }
    });
    cont.innerHTML = html || '<p style="color:#888;padding:20px;">No reported reviews found.</p>';
};

const modDeleteReview = (gameID, i) => {
    if (!confirm("Delete this review?")) return;
    const reviews = JSON.parse(localStorage.getItem('reviews_' + gameID) || '[]');
    reviews.splice(i, 1);
    localStorage.setItem('reviews_' + gameID, JSON.stringify(reviews));
    renderModReviews();
};

const modDismissReview = (gameID, i) => {
    const reviews = JSON.parse(localStorage.getItem('reviews_' + gameID) || '[]');
    if (reviews[i]) { delete reviews[i].flagged; localStorage.setItem('reviews_' + gameID, JSON.stringify(reviews)); renderModReviews(); }
};

const renderModLenders = () => {
    const tbl = document.getElementById("mod-lenders-table");
    if (!tbl) return;
    const biz = users.filter(u => u.type === 'business');
    tbl.innerHTML = `<thead><tr><th>User</th><th>Business Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>` +
        biz.map(u => `<tr><td>${u.username}</td><td>${u.name}</td><td>${u.suspended ? '🔴 Suspended' : '🟢 Active'}</td><td>
        <button class="action-btn" onclick="modToggleLender(${u.userID})" style="background:${u.suspended ? '#2ecc71' : '#e67e22'}">
            ${u.suspended ? 'Restore Account' : 'Suspend Account'}
        </button></td></tr>`).join('') + `</tbody>`;
};

const modToggleLender = (id) => {
    const u = users.find(x => +x.userID === +id);
    if (u && confirm(`${u.suspended ? 'Restore' : 'Suspend'} account for ${u.username}?`)) {
        u.suspended = !u.suspended;
        save("users", users); renderModLenders();
    }
};