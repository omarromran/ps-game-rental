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
const sampleRequests = [
    {
        customer: "Gamer_99",
        game: "Spider-Man 2",
        startDate: "Nov 1, 2023",
        endDate: "Nov 4, 2023",
        totalPrice: "$15.00",
        status: "Pending"
    },
    {
        customer: "Alex_Pro",
        game: "God of War",
        startDate: "Nov 2, 2023",
        endDate: "Nov 5, 2023",
        totalPrice: "$12.00",
        status: "Pending"
    },
    {
        customer: "PlayKing",
        game: "Elden Ring",
        startDate: "Nov 3, 2023",
        endDate: "Nov 6, 2023",
        totalPrice: "$9.00",
        status: "Pending"
    }
];

function loadRequests() {
    const tbody = document.getElementById("requestsList");
    const noMsg = document.getElementById("noRequestsMessage");

    if (!tbody) return;

    // Read current data from localStorage (do NOT reset here)
    let requests = JSON.parse(localStorage.getItem("rentalRequests")) || [];

    tbody.innerHTML = "";

    const visible = requests.filter(r => r.status === "Pending" || r.status === "Approved");

    if (visible.length === 0) {
        noMsg.style.display = "block";
        return;
    }

    noMsg.style.display = "none";

    requests.forEach((req, index) => {
        if (req.status !== "Pending" && req.status !== "Approved") return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${req.customer}</td>
            <td>${req.game}</td>
            <td>${req.startDate} → ${req.endDate}</td>
            <td>${req.totalPrice}</td>
            <td>${req.status}</td>
            <td>
                ${req.status === "Pending" ? `
                    <button onclick="approveRequest(${index})" style="background:#5c748e; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; margin-right:5px;">Approve</button>
                    <button onclick="rejectRequest(${index})" style="background:#c0392b; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">Reject</button>
                ` : `
                    <button onclick="markReturned(${index})" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">Mark Returned</button>
                `}
            </td>
        `;

        tbody.appendChild(row);
    });
}

function approveRequest(index) {
    let requests = JSON.parse(localStorage.getItem("rentalRequests"));
    requests[index].status = "Approved";
    localStorage.setItem("rentalRequests", JSON.stringify(requests));
    loadRequests();
}

function rejectRequest(index) {
    let requests = JSON.parse(localStorage.getItem("rentalRequests"));
    requests[index].status = "Rejected";
    localStorage.setItem("rentalRequests", JSON.stringify(requests));
    loadRequests();
}

function markReturned(index) {
    let requests = JSON.parse(localStorage.getItem("rentalRequests"));
    requests[index].status = "Returned";
    localStorage.setItem("rentalRequests", JSON.stringify(requests));
    loadRequests();
}

document.addEventListener("DOMContentLoaded", () => {
    // Reset to sample data ONLY on page load
    localStorage.setItem("rentalRequests", JSON.stringify(sampleRequests));
    loadRequests();
});
