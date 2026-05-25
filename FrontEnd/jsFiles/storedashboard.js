let gameInventory = [];
let currentEditGameId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeData();

    const form = document.getElementById("addGameForm");
    if (form) {
        form.addEventListener("submit", handleGameFormSubmit);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to logout?")) return;

            try {
                await fetch("/api/auth/logout", { method: "POST" });
            } catch (err) {
                console.warn("Logout request failed, continuing to clear client session.", err);
            }

            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            window.location.href = "/login";
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

function startGameEdit(gameId) {
    const game = gameInventory.find(g => g._id === gameId);
    if (!game) return;

    currentEditGameId = gameId;
    const formTitle = document.getElementById('gameFormTitle');
    const submitButton = document.getElementById('submitGameButton');
    const cancelButton = document.getElementById('cancelEditButton');
    const imageInput = document.getElementById('images');
    const editGameId = document.getElementById('editGameId');

    if (formTitle) formTitle.textContent = 'Edit Game';
    if (submitButton) submitButton.textContent = 'Save Changes';
    if (cancelButton) cancelButton.style.display = 'inline-block';
    if (imageInput) imageInput.required = false;
    if (editGameId) editGameId.value = gameId;

    document.getElementById('gameTitle').value = game.title || '';
    document.getElementById('platform').value = game.platform || '';
    document.getElementById('genre').value = game.category || '';
    document.getElementById('dailyPrice').value = game.pricePerDay || '';
    document.getElementById('description').value = game.description || '';

    showSection('addGame');
}

async function initializeData() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No auth token found for current user");
        return;
    }

    try {
        const response = await fetch("/api/games/my/games", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("Failed to load games:", error.message || response.statusText);
            return;
        }

        const data = await response.json();
        gameInventory = Array.isArray(data.data?.games ? data.data.games : data) ? (data.data?.games || data) : [];
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
                <button onclick="startGameEdit('${game._id}')" style="background:none; border:none; color:#007bff; cursor:pointer; margin-right:8px;">
                    <i class="fas fa-edit"></i> Edit
                </button>
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

async function handleGameFormSubmit(e) {
    e.preventDefault();
    hideFormError();

    const storeID = getCurrentStoreID();
    if (!storeID) {
        showFormError("You must be logged in as a store owner to save games.");
        return;
    }

    const title = document.getElementById("gameTitle").value.trim();
    const platform = document.getElementById("platform").value;
    const category = document.getElementById("genre").value;
    const pricePerDay = document.getElementById("dailyPrice").value;
    const description = document.getElementById("description").value.trim();
    const imageInput = document.getElementById('images');
    const files = imageInput?.files || [];

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

    const formData = new FormData();
    if (!currentEditGameId) {
        formData.append('gameID', 'G' + Date.now());
        if (storeID) formData.append('storeID', storeID);
    }
    formData.append('title', title);
    formData.append('platform', platform);
    formData.append('category', category);
    formData.append('pricePerDay', parseFloat(pricePerDay));
    formData.append('description', description);

    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    try {
        const token = localStorage.getItem('token');
        const url = currentEditGameId ? `/api/games/${currentEditGameId}` : "/api/games";
        const method = currentEditGameId ? "PUT" : "POST";
        const response = await fetch(url, {
            method,
            headers: {
                Authorization: token ? `Bearer ${token}` : undefined
            },
            body: formData
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            console.log("FULL SERVER RESPONSE:");
            console.log(text);

            throw new Error(`Server error (${response.status}): ${text}`);
        }

        if (response.ok) {
            if (currentEditGameId) {
                const updatedGame = data.data || data;

                gameInventory = gameInventory.map(game =>
                    game._id === updatedGame._id
                        ? updatedGame
                        : game
                );
                cancelGameEdit();
            } else {
                gameInventory.push(data.data || data);
                e.target.reset();
            }
            hideFormError();
            loadGamesTable();
            updateDashboardStats();
            alert(currentEditGameId ? "Game updated successfully!" : "Game added successfully!");
        } else {
            showFormError(data.error || data.message || `Failed to add game (status ${response.status}).`);
        }
    } catch (error) {
        console.error("Error adding game:", error);
        showFormError(error.message || "Error connecting to server. Make sure the backend is running.");
    }
}

async function deleteGame(id) {
    if (confirm("Delete this game?")) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/games/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined
                }
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

