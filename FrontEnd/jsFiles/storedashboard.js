let gameInventory = [];
let currentEditGameId = null;
let selectedImages = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeData();

    const form = document.getElementById("addGameForm");
    if (form) {
        form.addEventListener("submit", handleGameFormSubmit);
    }

    const imageInput = document.getElementById("images");
    if (imageInput) {
        imageInput.addEventListener("change", handleImageSelection);
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

function cancelGameEdit() {
    currentEditGameId = null;
    const formTitle = document.getElementById('gameFormTitle');
    const submitButton = document.getElementById('submitGameButton');
    const cancelButton = document.getElementById('cancelEditButton');
    const imageInput = document.getElementById('images');
    const editGameId = document.getElementById('editGameId');

    if (formTitle) formTitle.textContent = 'List a New Game';
    if (submitButton) submitButton.textContent = 'Add Game';
    if (cancelButton) cancelButton.style.display = 'none';
    if (imageInput) imageInput.required = true;
    if (editGameId) editGameId.value = '';

    const form = document.getElementById('addGameForm');
    if (form) form.reset();
    selectedImages = [];
    updateImagePreview();
    hideFormError();
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
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/rentals/store', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Failed to load store rental history:', error.message || response.statusText);
            renderActivityTable([]);
            return;
        }

        const data = await response.json();
        renderActivityTable(data);
    } catch (e) {
        console.error('Activity data not available.', e);
        renderActivityTable([]);
    }
}

function setSelectedImages(files) {
    selectedImages = Array.from(files);
    updateImageInputFiles();
    updateImagePreview();
}

function updateImageInputFiles() {
    const imageInput = document.getElementById('images');
    if (!imageInput) return;
    const dataTransfer = new DataTransfer();
    selectedImages.forEach(file => dataTransfer.items.add(file));
    imageInput.files = dataTransfer.files;
}

function updateImagePreview() {
    const previewContainer = document.getElementById('selectedImagesPreview');
    if (!previewContainer) return;
    previewContainer.innerHTML = selectedImages.map((file, index) => `
        <div class="selected-image-chip">
            <span>${file.name}</span>
            <button type="button" class="remove-image-btn" onclick="removeSelectedImage(${index})">×</button>
        </div>
    `).join('');
}

function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    selectedImages = selectedImages.concat(files);
    updateImageInputFiles();
    updateImagePreview();
}

function removeSelectedImage(index) {
    if (index < 0 || index >= selectedImages.length) return;
    selectedImages.splice(index, 1);
    updateImageInputFiles();
    updateImagePreview();
}

function renderActivityTable(activities) {
    const activityBody = document.getElementById("activityLog");
    if (!activityBody) return;

    if (!Array.isArray(activities) || activities.length === 0) {
        activityBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">No recent rental history</td>
            </tr>
        `;
        return;
    }

    activityBody.innerHTML = activities.slice(0, 10).map(act => {
        const gameTitle = act.game?.title || 'Unknown Game';
        const customerName = act.customer?.username || act.customer?.email || 'Unknown Customer';
        const status = act.status || 'unknown';
        const date = act.createdAt ? new Date(act.createdAt).toLocaleDateString() : (act.startDate ? new Date(act.startDate).toLocaleDateString() : 'N/A');

        return `
            <tr>
                <td>${gameTitle}</td>
                <td>${customerName}</td>
                <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
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

    if (!currentEditGameId && files.length === 0) {
        showFormError('Please upload at least one image for the game.');
        return;
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
                selectedImages = [];
                updateImagePreview();
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
                const errorData = await response.json().catch(() => null);
                const message = errorData?.error || errorData?.message || 'Failed to delete game.';
                alert(message);
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

// 🔍 RAWG API Search Functions
async function performGameSearch() {
    const searchInput = document.getElementById("gameSearchInput");
    const searchResults = document.getElementById("searchResults");
    
    if (!searchInput || !searchInput.value.trim()) {
        alert("Please enter a game title to search.");
        return;
    }

    const title = searchInput.value.trim();
    
    try {
        searchResults.innerHTML = '<p style="text-align:center; padding:1rem;">Searching...</p>';
        searchResults.style.display = 'block';

        const response = await fetch(`/api/games/search-external?title=${encodeURIComponent(title)}`);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Search failed");
        }

        const gameData = await response.json();
        displayGameSearchResult(gameData);

    } catch (error) {
        console.error("Search error:", error);
        searchResults.innerHTML = `<p style="color:red; padding:1rem; text-align:center;">❌ ${error.message || 'Failed to search. Try again.'}</p>`;
        searchResults.style.display = 'block';
    }
}

function displayGameSearchResult(gameData) {
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;

    const descriptionLines = (gameData.description || '').split('\n').map(line => `<p>${line}</p>`).join('');

    searchResults.innerHTML = `
        <div class="game-result-card">
            ${gameData.coverImage ? `<img src="${gameData.coverImage}" alt="${gameData.title}" class="result-image" onerror="this.src='https://via.placeholder.com/120x180?text=No+Image'">` : '<div class="result-image" style="background:#333; display:flex; align-items:center; justify-content:center;">No Image</div>'}
            <div class="result-header">
                <h4>${gameData.title || 'Unknown'}</h4>
                <button type="button" class="use-btn" onclick="populateFormFromSearch('${gameData.title}', '${gameData.genre}', '${(gameData.description || '').replace(/'/g, "\\'")}')">
                    ✓ Use
                </button>
            </div>
            <div class="result-info">
                ${descriptionLines}
            </div>
        </div>
    `;
    searchResults.style.display = 'block';
}

function populateFormFromSearch(title, genre, description) {
    const titleInput = document.getElementById("gameTitle");
    const genreInput = document.getElementById("genre");
    const descriptionInput = document.getElementById("description");

    if (titleInput) titleInput.value = title;
    if (genreInput) {
        // Try to match the genre from RAWG with our dropdown options
        const selectedGenre = matchGenreOption(genre);
        if (genreInput.querySelector(`option[value="${selectedGenre}"]`)) {
            genreInput.value = selectedGenre;
        }
    }
    if (descriptionInput) descriptionInput.value = description;

    // Close search results
    const searchResults = document.getElementById("searchResults");
    if (searchResults) {
        searchResults.style.display = 'none';
        document.getElementById("gameSearchInput").value = '';
    }

    alert(`✅ Form populated with "${title}" data! Please complete the remaining fields and upload images.`);
}

function matchGenreOption(rawgGenre) {
    const genreMap = {
        'Action': 'Action',
        'RPG': 'RPG',
        'Sports': 'Sports',
        'Horror': 'Horror',
        'Shooting': 'Action',
        'Adventure': 'Action',
        'Casual': 'Sports',
        'Racing': 'Sports'
    };
    
    for (const [rawg, option] of Object.entries(genreMap)) {
        if (rawgGenre && rawgGenre.includes(rawg)) return option;
    }
    
    return 'Action'; // Default fallback
}

