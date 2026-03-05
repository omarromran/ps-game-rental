// ================= Sidebar Navigation =================
function showSection(sectionId, btn) {
    // Hide all sections
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "block";

    // Remove 'active' from all sidebar buttons
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));

    // Add 'active' to clicked button
    if (btn) btn.classList.add("active");
}

// ================= Logout =================
function logout() {
    window.location.href = "login.html"; // redirect to login page
}

// ================= Global Data =================
let users = [];
let games = [];

// ================= Fetch JSON Data =================
async function loadData() {
    try {
        const usersRes = await fetch("users.json");
        const usersData = await usersRes.json();
        // some of our JSON files wrap the array under a property
        users = Array.isArray(usersData) ? usersData : (usersData.users || []);

        const gamesRes = await fetch("games.json");
        const gamesData = await gamesRes.json();
        games = Array.isArray(gamesData) ? gamesData : (gamesData.games || []);

        renderUsersTable();
        renderGamesTable();
        renderDashboardCards();
    } catch (err) {
        console.error("Error loading JSON files:", err);
    }
}

// ================= Dashboard Cards =================
function renderDashboardCards() {
    const container = document.getElementById("dashboard-cards");
    container.innerHTML = "";

    const cards = [
        { title: "Total Users", value: users.length },
        { title: "Total Games", value: games.length },
        { title: "Revenue", value: "$2,000" } // placeholder
    ];

    cards.forEach(card => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h3>${card.title}</h3><p>${card.value}</p>`;
        container.appendChild(div);
    });
}

// ================= Users Table =================
function renderUsersTable() {
    const table = document.getElementById("users-table");
    table.innerHTML = `<thead>
        <tr>
            <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th><th>Actions</th>
        </tr>
    </thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");

    users.forEach((user, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.userID}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.type}</td>
            <td class="users-action">
                <button onclick="editUser(${index})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteUser(${index})"><i class="fas fa-trash"></i></button>
            </td>`;
        tbody.appendChild(row);
    });
}

function editUser(index) {
    const user = users[index];
    const name = prompt("Edit Name:", user.name);
    const username = prompt("Edit Username:", user.username);
    const email = prompt("Edit Email:", user.email);
    const type = prompt("Edit Type (admin/customer/business):", user.type);

    if (name && username && email && type) {
        users[index] = { ...user, name, username, email, type };
        renderUsersTable();
        renderDashboardCards();
    }
}

function deleteUser(index) {
    if (confirm("Are you sure you want to delete this user?")) {
        users.splice(index, 1);
        renderUsersTable();
        renderDashboardCards();
    }
}

// ================= Games Table =================
function renderGamesTable() {
    const table = document.getElementById("games-table");
    table.innerHTML = `<thead>
        <tr>
            <th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Description</th><th>Vendor</th><th>Actions</th>
        </tr>
    </thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");

    games.forEach((game, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${game.gameID}</td>
            <td>${game.name}</td>
            <td>${game.platform}</td>
            <td>${game.platform}</td>
            <td>${game.genre}</td>
            <td>${game.description}</td>
            <td>${game.vendor || game.gamevendor || ""}</td>
            <td class="games-action">
                <button onclick="editGame(${index})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteGame(${index})"><i class="fas fa-trash"></i></button>
            </td>`;
        tbody.appendChild(row);
    });
}

function editGame(index) {
    const game = games[index];
    const name = prompt("Edit Name:", game.name);
    const platform = prompt("Edit Platform:", game.platform);
    const genre = prompt("Edit Genre:", game.genre);
    const description = prompt("Edit Description:", game.description);
    const vendor = prompt("Edit Vendor:", game.vendor || game.gamevendor);

    if (name && platform && genre && description && vendor) {
        games[index] = { ...game, name, platform, genre, description, vendor };
        renderGamesTable();
        renderDashboardCards();
    }
}

function deleteGame(index) {
    if (confirm("Are you sure you want to delete this game?")) {
        games.splice(index, 1);
        renderGamesTable();
        renderDashboardCards();
    }
}

// ================= Add Admin Form =================
const addAdminForm = document.getElementById("add-admin-form");
if (addAdminForm) {
    addAdminForm.addEventListener("submit", function(e){
        e.preventDefault();
        const form = e.target;
        if(form.password.value !== form.confirmPassword.value){
            alert("Passwords do not match!");
            return;
        }

        const newAdmin = {
            userID: users.length + 1,
            name: form.name.value,
            username: form.username.value.trim() || form.email.value.split("@")[0],
            email: form.email.value,
            password: form.password.value,
            type: "admin"
        };
        users.push(newAdmin);
        renderUsersTable();
        renderDashboardCards();
        alert(`New admin ${newAdmin.name} created successfully!`);
        form.reset();
    });
}

// ================= Add Game Modal =================
function showAddGameForm() {
    document.getElementById("add-game-form-container").style.display = "block";
}
function closeAddGameForm() {
    document.getElementById("add-game-form-container").style.display = "none";
}

const addGameForm = document.getElementById("add-game-form");
if (addGameForm) {
    addGameForm.addEventListener("submit", function(e){
        e.preventDefault();
        const form = e.target;

        const newGame = {
            // preserve string IDs from JSON by converting number to string
            gameID: String(games.length + 1),
            name: form.name.value,
            platform: form.platform.value,
            genre: form.genre ? form.genre.value : "N/A",
            description: form.description ? form.description.value : "",
            vendor: form.gamevendor ? form.gamevendor.value : "Unknown"
        };

        games.push(newGame);
        renderGamesTable();
        renderDashboardCards();
        closeAddGameForm();
        form.reset();
    });
}

// ================= Initialize =================
document.addEventListener("DOMContentLoaded", function(){
    loadData();
    // Show dashboard section by default
    showSection('dashboard', document.querySelector(".sidebar nav button"));
});