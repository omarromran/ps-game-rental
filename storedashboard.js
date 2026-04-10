// storedashboard.js

let gameInventory = [];


/* ---------------------------
   INITIALIZATION
----------------------------*/

document.addEventListener("DOMContentLoaded", () => {

    initializeData();

    const form = document.getElementById("addGameForm");

    if (form) {
        form.addEventListener("submit", addGame);
    }

});


/* ---------------------------
   INITIAL DATA LOADING
----------------------------*/

function initializeData() {

    const storedGames = localStorage.getItem("games");

    if (storedGames) {

        gameInventory = JSON.parse(storedGames);
        loadGamesTable();
        updateDashboardStats();

    } else {

        loadGamesFromJSON();

    }

}


/* ---------------------------
   LOAD JSON FILE
----------------------------*/

function loadGamesFromJSON() {

    fetch("bussiness.json")
        .then(response => response.json())
        .then(data => {

            gameInventory = data;

            localStorage.setItem("games", JSON.stringify(gameInventory));

            loadGamesTable();
            updateDashboardStats();

        })
        .catch(error => {

            console.error("Error loading JSON:", error);

        });

}


/* ---------------------------
   RESET DATA BUTTON
----------------------------*/

function resetData() {

    if (!confirm("Reset all data and reload from JSON?")) return;

    localStorage.removeItem("games");

    loadGamesFromJSON();

}


/* ---------------------------
   NAVIGATION
----------------------------*/

function showSection(sectionId, button) {

    const sections = document.querySelectorAll("main section");

    sections.forEach(section => {
        section.style.display = "none";
    });

    const active = document.getElementById(sectionId);

    if (active) active.style.display = "block";

    const buttons = document.querySelectorAll(".sidebar nav button");

    buttons.forEach(btn => btn.classList.remove("active"));

    if (button) button.classList.add("active");

}


/* ---------------------------
   DASHBOARD STATS
----------------------------*/

function updateDashboardStats() {

    const totalGames = document.getElementById("totalGames");
    const activeRentals = document.getElementById("activeRentals");
    const totalEarnings = document.getElementById("totalEarnings");

    if (totalGames) {
        totalGames.textContent = gameInventory.length;
    }

    if (activeRentals) {
        activeRentals.textContent = 0;
    }

    if (totalEarnings) {
        totalEarnings.textContent = "0.00 EGP";
    }

}


/* ---------------------------
   ADD GAME
----------------------------*/

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
        price,
        description
    };

    gameInventory.push(newGame);

    localStorage.setItem("games", JSON.stringify(gameInventory));

    document.getElementById("addGameForm").reset();

    loadGamesTable();
    updateDashboardStats();

    alert("Game added successfully!");

}


/* ---------------------------
   LOAD GAMES TABLE
----------------------------*/

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
            <td>${game.price}</td>
            <td>${game.status}</td>
            <td>
                <button onclick="deleteGame(${game.id})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);

    });

}


/* ---------------------------
   DELETE GAME
----------------------------*/

function deleteGame(id) {

    gameInventory = gameInventory.filter(game => game.id !== id);

    localStorage.setItem("games", JSON.stringify(gameInventory));

    loadGamesTable();
    updateDashboardStats();

}