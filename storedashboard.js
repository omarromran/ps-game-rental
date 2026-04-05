// dashboard.js

document.addEventListener("DOMContentLoaded", () => {

    // Example stats (later you can fetch from database or localStorage)
    const stats = {
        totalGames: 12,
        activeRentals: 4,
        totalEarnings: 240.50,
        pendingRequests: 3
    };

    // Get elements
    const totalGames = document.getElementById("totalGames");
    const activeRentals = document.getElementById("activeRentals");
    const totalEarnings = document.getElementById("totalEarnings");
    const pendingCount = document.getElementById("pendingCount");

    // Update UI safely
    if (totalGames) {
        totalGames.textContent = stats.totalGames;
    }

    if (activeRentals) {
        activeRentals.textContent = stats.activeRentals;
    }

    if (totalEarnings) {
        totalEarnings.textContent = `$${stats.totalEarnings.toFixed(2)}`;
    }

    if (pendingCount) {
        pendingCount.textContent = stats.pendingRequests;
    }

    console.log("Dashboard stats initialized.");

});

// navigation.js

// Switch between dashboard sections
function showSection(sectionId) {

    const sections = document.querySelectorAll("main section");

    sections.forEach(section => {
        section.style.display = "none";
    });

    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
        targetSection.style.display = "block";
    }
}


// Run after page loads
document.addEventListener("DOMContentLoaded", () => {

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {

            const confirmLogout = confirm("Are you sure you want to logout?");

            if (confirmLogout) {
                window.location.href = "login.html";
            }

        });
    }

});
// add-game.js

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("addGameForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Get form values
        const title = document.getElementById("gameTitle").value;
        const platform = document.getElementById("platform").value;
        const genre = document.getElementById("genre").value;
        const price = document.getElementById("dailyPrice").value;
        const description = document.getElementById("description").value;

        const game = {
            title,
            platform,
            genre,
            price,
            description,
            status: "Available"
        };

        // Get existing games
        let games = JSON.parse(localStorage.getItem("games")) || [];

        // Add new game
        games.push(game);

        // Save again
        localStorage.setItem("games", JSON.stringify(games));

        alert("Game added successfully!");

        form.reset();
    });

});
// manage-games.js

document.addEventListener("DOMContentLoaded", loadGames);

function loadGames() {

    const games = JSON.parse(localStorage.getItem("games")) || [];

    const tableBody = document.getElementById("gamesList");
    const noGamesMessage = document.getElementById("noGamesMessage");

    tableBody.innerHTML = "";

    if (games.length === 0) {
        noGamesMessage.style.display = "block";
        return;
    }

    noGamesMessage.style.display = "none";

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

function deleteGame(index) {

    let games = JSON.parse(localStorage.getItem("games")) || [];

    games.splice(index, 1);

    localStorage.setItem("games", JSON.stringify(games));

    loadGames();
}