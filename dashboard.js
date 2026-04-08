let users = [];
let games = [];

function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}

function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(section => section.style.display = "none");

    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.style.display = "block";

    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
}

function resetAllData() {
    if (confirm("Are you sure you want to reset all data to defaults?")) {
        localStorage.removeItem("users");
        localStorage.removeItem("games");
        loadData();
    }
}

async function loadData() {
    try {
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            const res = await fetch("users.json");
            const data = await res.json();
            users = data.users || [];
            saveUsersToStorage();
        }

        const storedGames = localStorage.getItem("games");
        if (storedGames) {
            games = JSON.parse(storedGames);
        } else {
            const res = await fetch("games.json");
            const data = await res.json();
            games = data.games || [];
            saveGamesToStorage();
        }

        refreshUI();
    } catch (err) {
        console.error("Data Load Error:", err);
        alert("Failed to load data. Check console for details.");
    }
}

function refreshUI() {
    renderDashboardCards();
    renderUsersTable();
    renderGamesTable();
}

function renderDashboardCards() {
    const container = document.getElementById("dashboard-cards");
    if (!container) return;

    const totalUsers = users.length;
    const pendingUsers = users.filter(u => u.status === "pending").length;
    const totalGames = games.length;
    const availableForRentCount = games.filter(g => (g.Availability || "").toLowerCase() === "rent").length;
    const totalRevenue = games.reduce((sum, g) => sum + (Number(g.price) || 0), 0);

    const stats = [
        { title: "Total Users", value: totalUsers },
        { title: "Pending Users", value: pendingUsers, link: "approveLenders.html" },
        { title: "Total Games", value: totalGames },
        { title: "Available for Rent", value: availableForRentCount },
        { title: "Total Price Value", value: totalRevenue + " EGP" }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="card" ${stat.link ? `onclick="window.location.href='${stat.link}'"` : ""} style="cursor:${stat.link ? "pointer" : "default"}">
            <h3>${stat.title}</h3>
            <p>${stat.value}</p>
        </div>
    `).join('');
}

// USERS
function renderUsersTable() {
    const table = document.getElementById("users-table");
    if (!table) return;

    const filterValue = document.getElementById("user-type-filter")?.value || "all";

    // Only approved users
    const approvedUsers = users.filter(u => u.status !== "pending");

    const filteredUsers = filterValue === "all"
        ? approvedUsers
        : approvedUsers.filter(u => u.type === filterValue);

    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${filteredUsers.map(u => {
        const idx = users.findIndex(user => user.userID === u.userID);
        return `
                    <tr>
                        <td>${u.userID}</td>
                        <td>${u.name}</td>
                        <td>${u.username}</td>
                        <td>${u.email}</td>
                        <td><span class="badge ${u.type}">${u.type}</span></td>
                        <td class="users-action">
                            <button class="action-btn" onclick="editUser(${idx})"><i class="fas fa-edit"></i></button>
                            <button class="action-btn" onclick="deleteUser(${idx})"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`;
    }).join('')}
        </tbody>`;
}

function editUser(index) {
    const user = users[index];
    const name = prompt("Full Name:", user.name);
    if (name === null) return;
    const username = prompt("Username:", user.username);
    if (username === null) return;
    const email = prompt("Email:", user.email);
    if (email === null) return;
    const type = prompt("Type (admin / business / customer):", user.type);
    if (type === null) return;

    users[index] = { ...user, name, username, email, type };
    saveUsersToStorage();
    refreshUI();
}

function deleteUser(index) {
    if (confirm("Delete this user?")) {
        users.splice(index, 1);
        saveUsersToStorage();
        refreshUI();
    }
}

// GAMES
function renderGamesTable() {
    const table = document.getElementById("games-table");
    if (!table) return;

    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Status</th><th>Vendor</th><th>Price (EGP)</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${games.map((g, i) => `
                <tr>
                    <td>${g.gameID}</td>
                    <td>${g.name}</td>
                    <td>${g.platform}</td>
                    <td>${g.genre}</td>
                    <td>${g.Availability || "N/A"}</td>
                    <td>${g.vendor || "System"}</td>
                    <td>${g.price || "-"}</td>
                    <td class="games-action">
                        <button class="action-btn" onclick="editGame(${i})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn" onclick="deleteGame(${i})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('')}
        </tbody>`;
}

function editGame(index) {
    const game = games[index];

    const name = prompt("Game Name:", game.name);
    if (name === null) return;
    const platform = prompt("Platform:", game.platform);
    if (platform === null) return;
    const genre = prompt("Genre:", game.genre);
    if (genre === null) return;

    let availability = prompt("Status (buy/rent):", game.Availability);
    if (availability === null) return;
    availability = availability.toLowerCase() === "rent" ? "rent" : "buy";

    const vendor = prompt("Vendor:", game.vendor);
    if (vendor === null) return;

    const price = prompt("Price (EGP):", game.price);
    if (price === null) return;

    games[index] = { ...game, name, platform, genre, Availability: availability, vendor, price: Number(price) };
    saveGamesToStorage();
    refreshUI();
}

function deleteGame(index) {
    if (confirm("Delete this game?")) {
        games.splice(index, 1);
        saveGamesToStorage();
        refreshUI();
    }
}

// ADD ADMIN FORM
const adminForm = document.getElementById("add-admin-form");
if (adminForm) {
    adminForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(adminForm);
        if (fd.get("password") !== fd.get("confirmPassword")) {
            alert("Passwords do not match!");
            return;
        }

        users.push({
            userID: users.length > 0 ? Math.max(...users.map(u => Number(u.userID) || 0)) + 1 : 1,
            name: fd.get("name"),
            username: fd.get("username"),
            email: fd.get("email"),
            password: fd.get("password"),
            type: "admin"
        });

        saveUsersToStorage();
        refreshUI();
        adminForm.reset();
        alert("Admin added!");
    });
}

// ADD GAME FORM
function showAddGameForm() { document.getElementById("add-game-form-container").style.display = "block"; }
function closeAddGameForm() { document.getElementById("add-game-form-container").style.display = "none"; }

const gameForm = document.getElementById("add-game-form");
if (gameForm) {
    gameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(gameForm);
        const nextId = games.length > 0 ? Math.max(...games.map(g => Number(g.gameID) || 0)) + 1 : 1;
        games.push({
            gameID: String(nextId).padStart(3, '0'),
            name: fd.get("name"),
            platform: fd.get("platform"),
            genre: fd.get("genre"),
            Availability: "buy",
            vendor: fd.get("gamevendor"),
            description: fd.get("description"),
            price: Number(fd.get("price"))
        });
        saveGamesToStorage();
        refreshUI();
        gameForm.reset();
        closeAddGameForm();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    showSection('dashboard', document.querySelector(".sidebar nav button"));

    // Add event listener to update user table when type filter changes
    const userFilter = document.getElementById("user-type-filter");
    if (userFilter) {
        userFilter.addEventListener("change", renderUsersTable);
    }
});