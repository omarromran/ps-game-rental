let gameInventory = [];


document.addEventListener("DOMContentLoaded", () => {
    initializeData();

    const form = document.getElementById("addGameForm");
    if (form) {
        form.addEventListener("submit", addGame);
    }


    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem("currentUser");
                window.location.href = "login.html";
            }
        });
    }
});


function initializeData() {
    const storedGames = localStorage.getItem("games");

    if (storedGames) {
        gameInventory = JSON.parse(storedGames);
        loadGamesTable();
        updateDashboardStats();
        fetchActivityOnly();
    } else {
        loadGamesFromJSON();
    }
}

function loadGamesFromJSON() {
    fetch("bussiness.json")
        .then(response => {
            if (!response.ok) throw new Error("JSON file not found");
            return response.json();
        })
        .then(data => {

            gameInventory = data.games || (Array.isArray(data) ? data : []);
            localStorage.setItem("games", JSON.stringify(gameInventory));

            loadGamesTable();
            updateDashboardStats();


            if (data.activity) {
                renderActivityTable(data.activity);
            }
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
        });
}


function fetchActivityOnly() {
    fetch("bussiness.json")
        .then(response => response.json())
        .then(data => {
            if (data.activity) renderActivityTable(data.activity);
        })
        .catch(e => console.log("Activity data not available."));
}


function renderActivityTable(activities) {
    const activityBody = document.getElementById("activityLog");
    if (!activityBody) return;

    activityBody.innerHTML = activities.map(act => `
        <tr>
            <td>${act.game}</td>
            <td>${act.customer}</td>
            <td><span class="status-badge ${act.status.toLowerCase()}">${act.status}</span></td>
            <td>${act.date}</td>
        </tr>
    `).join('');
}

function loadGamesTable() {
    const tableBody = document.getElementById("gamesList");
    const noGamesMessage = document.getElementById("noGamesMessage");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (gameInventory.length === 0) {
        if (noGamesMessage) noGamesMessage.style.display = "block";
        return;
    }

    if (noGamesMessage) noGamesMessage.style.display = "none";

    gameInventory.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${game.title}</td>
            <td>${game.platform || "-"}</td>
            <td>${game.genre || "-"}</td>
            <td>${Number(game.price).toLocaleString()} EGP</td>
            <td><span class="status-badge">${game.status}</span></td>
            <td>
                <button onclick="deleteGame(${game.id})" style="background:none; border:none; color:#ff4444; cursor:pointer;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateDashboardStats() {
    const totalGamesEl = document.getElementById("totalGames");
    const activeRentalsEl = document.getElementById("activeRentals");
    const totalEarningsEl = document.getElementById("totalEarnings");

    if (totalGamesEl) totalGamesEl.textContent = gameInventory.length;

    if (activeRentalsEl) {
        const activeCount = gameInventory.filter(g => g.status === "Rented").length;
        activeRentalsEl.textContent = activeCount;
    }

    if (totalEarningsEl) {
        const total = gameInventory.reduce((sum, g) => sum + (Number(g.price) || 0), 0);
        totalEarningsEl.textContent = total.toLocaleString() + ".00 EGP";
    }
}


function addGame(e) {
    e.preventDefault();

    const title = document.getElementById("gameTitle").value;
    const platform = document.getElementById("platform").value;
    const genre = document.getElementById("genre").value;
    const price = document.getElementById("dailyPrice").value;
    const description = document.getElementById("description").value;

    const newGame = {
        id: Date.now(),
        title,
        platform,
        genre,
        status: "Available",
        price: parseFloat(price),
        description
    };

    gameInventory.push(newGame);
    localStorage.setItem("games", JSON.stringify(gameInventory));

    e.target.reset();
    loadGamesTable();
    updateDashboardStats();
    alert("Game added successfully!");
}

function deleteGame(id) {
    if (confirm("Delete this game?")) {
        gameInventory = gameInventory.filter(game => game.id !== id);
        localStorage.setItem("games", JSON.stringify(gameInventory));
        loadGamesTable();
        updateDashboardStats();
    }
}

function resetData() {
    if (confirm("Reset all data and reload from defaults?")) {
        localStorage.removeItem("games");
        loadGamesFromJSON();
        alert("Data reset successfully.");
    }
}

function showSection(sectionId, button) {
    const sections = document.querySelectorAll("main section");
    sections.forEach(section => section.style.display = "none");

    const active = document.getElementById(sectionId);
    if (active) active.style.display = "block";

    const buttons = document.querySelectorAll(".sidebar nav button");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (button) button.classList.add("active");
}