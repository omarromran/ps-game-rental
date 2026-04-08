// storedashboard.js

let games = [];

// STORAGE
function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}

// NAVIGATION
function showSection(sectionId) {

    document.querySelectorAll("main section").forEach(section => {
        section.style.display = "none";
    });

    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
        targetSection.style.display = "block";
    }
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "login.html";
    }
}

// LOAD DATA
function loadData() {

    const storedGames = localStorage.getItem("games");

    if (storedGames) {
        games = JSON.parse(storedGames);
    } else {
        games = [];
    }

    refreshUI();
}

// REFRESH UI
function refreshUI() {
    renderDashboardCards();
    renderGamesTable();
}

// DASHBOARD STATS
function renderDashboardCards() {

    const totalGamesEl = document.getElementById("totalGames");
    const activeRentalsEl = document.getElementById("activeRentals");
    const totalEarningsEl = document.getElementById("totalEarnings");


    const totalGames = games.length;
    const activeRentals = games.filter(g => g.status === "Rented").length;
    const totalEarnings = games.reduce((sum, g) => sum + (Number(g.price) || 0), 0);
  

    if (totalGamesEl) totalGamesEl.textContent = totalGames;
    if (activeRentalsEl) activeRentalsEl.textContent = activeRentals;
    if (totalEarningsEl) totalEarningsEl.textContent = `${totalEarnings.toFixed(2)} EGP`;
    
}

// MANAGE GAMES TABLE
function renderGamesTable() {

    const tableBody = document.getElementById("gamesList");
    const noGamesMessage = document.getElementById("noGamesMessage");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (games.length === 0) {

        if (noGamesMessage) {
            noGamesMessage.style.display = "block";
        }

        return;
    }

    if (noGamesMessage) {
        noGamesMessage.style.display = "none";
    }

    games.forEach((game, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${game.title}</td>
            <td>${game.platform}</td>
            <td>${game.genre}</td>
            <td>$${game.price}</td>
            <td>${game.status}</td>
            <td>
                <button onclick="deleteGame(${index})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// DELETE GAME
function deleteGame(index) {

    if (confirm("Delete this game?")) {

        games.splice(index, 1);

        saveGamesToStorage();

        refreshUI();
    }
}

// ADD GAME FORM
const addGameForm = document.getElementById("addGameForm");

if (addGameForm) {

    addGameForm.addEventListener("submit", (e) => {

        e.preventDefault();

        const title = document.getElementById("gameTitle").value;
        const platform = document.getElementById("platform").value;
        const genre = document.getElementById("genre").value;
        const price = document.getElementById("dailyPrice").value;
        const description = document.getElementById("description").value;

        games.push({
            title,
            platform,
            genre,
            price,
            description,
            status: "Available"
        });

        saveGamesToStorage();

        refreshUI();

        addGameForm.reset();

        alert("Game added successfully!");
    });
}

// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {

    loadData();

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

});