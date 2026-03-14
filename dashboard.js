
let users = [];
let games = [];

function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}

function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(section => {
        section.style.display = "none";
    });

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
async function loadData() {
    try {
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) users = JSON.parse(storedUsers);
        else if (users.length === 0) {
            const usersRes = await fetch("users.json");
            const usersData = await usersRes.json();
            users = usersData.users || [];
        }

        const storedGames = localStorage.getItem("games");
        if (storedGames) games = JSON.parse(storedGames);
        else if (games.length === 0) {
            const gamesRes = await fetch("games.json");
            const gamesData = await gamesRes.json();
            games = gamesData.games || [];
        }

        refreshUI();
    } catch (err) {
        console.error("Data Load Error: Ensure you are running on a local server.", err);
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
    const availableForRentCount = games.filter(g => g.Availability === "rent").length;
    const totalRevenue = games.reduce((sum, g) => sum + (g.price || 0), 0);

    const stats = [
        { title: "Total Users", value: totalUsers },
        { title: "Pending Users", value: pendingUsers },
        { title: "Total Games", value: totalGames },
        { title: "Available for Rent", value: availableForRentCount },
        { title: "Total Price Value", value: totalRevenue + " EGP" }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="card">
            <h3>${stat.title}</h3>
            <p>${stat.value}</p>
        </div>
    `).join('');
}

function renderUsersTable() {
    const table = document.getElementById("users-table");
    const filterValue = document.getElementById("user-type-filter")?.value || "all";
    if (!table) return;

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
            ${filteredUsers.map(user => {
        const globalIndex = users.findIndex(u => u.userID === user.userID);
        return `
                <tr>
                    <td>${user.userID}</td>
                    <td>${user.name}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${user.type}">${user.type}</span></td>
                    <td class="users-action">
                        <button class="action-btn" onclick="editUser(${globalIndex})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn" onclick="deleteUser(${globalIndex})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`}).join('')}
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
            ${games.map((game, index) => `
                <tr>
                    <td>${game.gameID}</td>
                    <td>${game.name}</td>
                    <td>${game.platform}</td>
                    <td>${game.genre}</td>
                    <td>${game.Availability || "N/A"}</td>
                    <td>${game.vendor || "System"}</td>
                    <td>${game.price || "-"}</td>
                    <td class="games-action">
                        <button class="action-btn" onclick="editGame(${index})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn" onclick="deleteGame(${index})"><i class="fas fa-trash"></i></button>
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

    games[index] = {
        ...game,
        name,
        platform,
        genre,
        Availability: availability,
        vendor,
        price: Number(price)
    };
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
            userID: users.length > 0 ? Math.max(...users.map(u => u.userID)) + 1 : 1,
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

function showAddGameForm() { document.getElementById("add-game-form-container").style.display = "block"; }
function closeAddGameForm() { document.getElementById("add-game-form-container").style.display = "none"; }

const gameForm = document.getElementById("add-game-form");
if (gameForm) {
    gameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(gameForm);
        games.push({
            gameID: String(games.length + 1).padStart(3, '0'),
            name: fd.get("name"),
            platform: fd.get("platform"),
            genre: fd.get("genre"),
            Availability: "buy",
            vendor: fd.get("gamevendor"),
            description: fd.get("description"),
            price: fd.get("price")
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
});