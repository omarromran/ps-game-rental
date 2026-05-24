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
                window.location.href = "/login";
            }
        });
    }
});

function getCurrentStoreID() {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.storeID || user._id || null;
    }
    return null;
}

async function initializeData() {
    const storeID = getCurrentStoreID();
    if (!storeID) {
        console.error("No store ID found for current user");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/games/my/${storeID}`);
        const data = await response.json();
        gameInventory = data;
        loadGamesTable();
        updateDashboardStats();
        fetchActivityLog();
    } catch (error) {
        console.error("Error loading games from backend:", error);
    }
}

async function fetchActivityLog() {
    try {
        const response = await fetch("bussiness.json");
        const data = await response.json();
        if (data.activity) renderActivityTable(data.activity);
    } catch (e) {
        console.log("Activity data not available.");
    }
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
            <td>${game.category || "-"}</td>
            <td>${Number(game.pricePerDay).toLocaleString()} EGP</td>
            <td><span class="status-badge">${game.status}</span></td>
            <td>
                <button onclick="deleteGame('${game._id}')" style="background:none; border:none; color:#ff4444; cursor:pointer;">
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
        const total = gameInventory.reduce((sum, g) => sum + (Number(g.pricePerDay) || 0), 0);
        totalEarningsEl.textContent = total.toLocaleString() + ".00 EGP";
    }
}

function showFormError(message) {
    let errorEl = document.getElementById("form-error-msg");
    if (!errorEl) {
        errorEl = document.createElement("p");
        errorEl.id = "form-error-msg";
        errorEl.style.color = "red";
        errorEl.style.fontSize = "0.85rem";
        errorEl.style.marginBottom = "10px";
        const form = document.getElementById("addGameForm");
        form.insertBefore(errorEl, form.querySelector("button[type='submit']"));
    }
    errorEl.textContent = message;
    errorEl.style.display = "block";
}

function hideFormError() {
    const errorEl = document.getElementById("form-error-msg");
    if (errorEl) errorEl.style.display = "none";
}

async function addGame(e) {
    e.preventDefault();
    hideFormError();

    const storeID = getCurrentStoreID();
    if (!storeID) {
        showFormError("You must be logged in as a store owner to add games.");
        return;
    }

    const title = document.getElementById("gameTitle").value.trim();
    const platform = document.getElementById("platform").value;
    const category = document.getElementById("genre").value;
    const pricePerDay = document.getElementById("dailyPrice").value;
    const description = document.getElementById("description").value.trim();

    // Frontend validation
    if (!title) {
        showFormError("Game title is required.");
        return;
    }
    if (title.length < 2) {
        showFormError("Game title must be at least 2 characters.");
        return;
    }
    if (!platform) {
        showFormError("Please select a platform.");
        return;
    }
    if (!category) {
        showFormError("Please select a genre.");
        return;
    }
    if (!pricePerDay) {
        showFormError("Daily price is required.");
        return;
    }
    if (isNaN(pricePerDay) || parseFloat(pricePerDay) <= 0) {
        showFormError("Price must be a positive number.");
        return;
    }
    if (parseFloat(pricePerDay) > 10000) {
        showFormError("Price cannot exceed 10,000 EGP.");
        return;
    }

    const newGame = {
        gameID: "G" + Date.now(),
        storeID,
        title,
        platform,
        category,
        pricePerDay: parseFloat(pricePerDay),
        description,
        img: "photos/default.jpg"
    };

    try {
        const response = await fetch("http://localhost:8080/api/games/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGame)
        });

        const data = await response.json();

        if (response.ok) {
            gameInventory.push(data);
            e.target.reset();
            hideFormError();
            loadGamesTable();
            updateDashboardStats();
            alert("Game added successfully!");
        } else {
            showFormError(data.error || "Failed to add game.");
        }
    } catch (error) {
        console.error("Error adding game:", error);
        showFormError("Error connecting to server. Make sure the backend is running.");
    }
}

async function deleteGame(id) {
    if (confirm("Delete this game?")) {
        try {
            const response = await fetch(`http://localhost:8080/api/games/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                gameInventory = gameInventory.filter(game => game._id !== id);
                loadGamesTable();
                updateDashboardStats();
                alert("Game deleted successfully!");
            } else {
                alert("Failed to delete game.");
            }
        } catch (error) {
            console.error("Error deleting game:", error);
            alert("Error connecting to server.");
        }
    }
}

function resetData() {
    if (confirm("Reset all data and reload from defaults?")) {
        localStorage.removeItem("games");
        initializeData();
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

// ==========================================
// 🚪 UNIFIED JWT LOGOUT LOGIC
// ==========================================
// This looks for a button with id="logout-btn" on your dashboard HTML
document.getElementById("logout-btn")?.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        // 1. Tell the backend to process the logout
        await fetch("http://localhost:8080/api/auth/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.log("Network message: Server processed stateless token drop.");
    }

    // 2. Wipe the local storage clean so the middlewares block further access
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    // 3. Kick them out to the login screen
    alert("Logged out successfully!");
    window.location.href = "/login";
});