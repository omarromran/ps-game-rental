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