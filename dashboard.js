let users = [];
let games = [];
let rentals = [];


/* =========================
   LOAD DATA
========================= */

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderDashboardCards();
    renderGamesTable();
    renderUsersTable();

});


async function loadData() {

    // USERS
    users = JSON.parse(localStorage.getItem("users_db")) || [];

    // GAMES
    const savedGames = localStorage.getItem("games_db");

    if (savedGames) {

        games = JSON.parse(savedGames);

    } else {

        const res = await fetch("games.json");
        const data = await res.json();

        games = data.games;

        localStorage.setItem("games_db", JSON.stringify(games));

    }


    // RENTALS
    rentals = JSON.parse(localStorage.getItem("rentals_db")) || [];

}



/* =========================
   DASHBOARD STATS
========================= */

function renderDashboardCards() {

    const container = document.getElementById("dashboard-cards");

    const activeRentals = rentals.filter(r => r.status === "active").length;

    const totalRevenue = rentals
        .filter(r => r.status === "active")
        .reduce((sum, r) => sum + r.price, 0);


    const stats = [

        {
            title: "Total Users",
            value: users.length,
            icon: "fa-users"
        },

        {
            title: "Total Games",
            value: games.length,
            icon: "fa-gamepad"
        },

        {
            title: "Active Rentals",
            value: activeRentals,
            icon: "fa-cart-shopping"
        },

        {
            title: "Revenue (EGP)",
            value: totalRevenue,
            icon: "fa-money-bill"
        }

    ];


    container.innerHTML = "";

    stats.forEach(stat => {

        container.innerHTML += `
        
        <div class="card">
            <i class="fas ${stat.icon}"></i>
            <h3>${stat.value}</h3>
            <p>${stat.title}</p>
        </div>
        
        `;

    });

}



/* =========================
   GAMES TABLE
========================= */

function renderGamesTable() {

    const table = document.getElementById("games-table");

    table.innerHTML = `
    
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Platform</th>
        <th>Genre</th>
        <th>Vendor</th>
        <th>Price (EGP)</th>
        <th>Status</th>
        <th>Actions</th>
    </tr>
    
    `;


    games.forEach(game => {

        table.innerHTML += `

        <tr>

            <td>${game.gameID}</td>
            <td>${game.name}</td>
            <td>${game.platform}</td>
            <td>${game.genre}</td>
            <td>${game.vendor}</td>
            <td>${game.price}</td>
            <td>${game.availability}</td>

            <td>

                <button onclick="deleteGame(${game.gameID})">
                    Delete
                </button>

            </td>

        </tr>

        `;

    });

}



/* =========================
   ADD GAME
========================= */

function showAddGameForm() {

    document.getElementById("add-game-modal").style.display = "flex";

}

function closeAddGameForm() {

    document.getElementById("add-game-modal").style.display = "none";

}



document.getElementById("add-game-form").addEventListener("submit", function(e) {

    e.preventDefault();

    const form = new FormData(this);

    const price = Number(form.get("price"));

    if (price < 250 || price > 1000) {

        alert("Price must be between 250 and 1000 EGP");
        return;

    }


    const newGame = {

        gameID: games.length + 1,
        name: form.get("name"),
        platform: form.get("platform"),
        genre: form.get("genre"),
        vendor: form.get("vendor"),
        price: price,
        availability: "available"

    };


    games.push(newGame);

    localStorage.setItem("games_db", JSON.stringify(games));

    renderGamesTable();
    renderDashboardCards();

    closeAddGameForm();

    this.reset();

});



/* =========================
   DELETE GAME
========================= */

function deleteGame(id) {

    games = games.filter(g => g.gameID !== id);

    localStorage.setItem("games_db", JSON.stringify(games));

    renderGamesTable();
    renderDashboardCards();

}



/* =========================
   USERS TABLE
========================= */

function renderUsersTable() {

    const table = document.getElementById("users-table");

    const filter = document.getElementById("user-type-filter").value;

    let filteredUsers = users;

    if (filter !== "all") {

        filteredUsers = users.filter(u => u.type === filter);

    }


    table.innerHTML = `
    
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Username</th>
        <th>Email</th>
        <th>Type</th>
    </tr>
    
    `;


    filteredUsers.forEach(user => {

        table.innerHTML += `

        <tr>

            <td>${user.userID}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.type}</td>

        </tr>

        `;

    });

}



/* =========================
   ADD ADMIN
========================= */

document.getElementById("add-admin-form").addEventListener("submit", function(e){

    e.preventDefault();

    const form = new FormData(this);

    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");

    if(password !== confirmPassword){

        alert("Passwords do not match");
        return;

    }


    const newAdmin = {

        userID: users.length + 1,
        name: form.get("name"),
        username: form.get("username"),
        email: form.get("email"),
        password: password,
        type: "admin"

    };


    users.push(newAdmin);

    localStorage.setItem("users_db", JSON.stringify(users));

    renderUsersTable();
    renderDashboardCards();

    alert("Admin created successfully");

    this.reset();

});



/* =========================
   NAVIGATION
========================= */

function showSection(sectionId, button){

    document.querySelectorAll(".section").forEach(sec => {

        sec.classList.remove("active-section");

    });

    document.getElementById(sectionId).classList.add("active-section");


    document.querySelectorAll(".nav-btn").forEach(btn => {

        btn.classList.remove("active");

    });

    button.classList.add("active");

}



/* =========================
   LOGOUT
========================= */

function logout(){

    localStorage.removeItem("loggedUser");

    window.location.href = "login.html";

}