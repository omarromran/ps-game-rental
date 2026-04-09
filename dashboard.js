let userRegistry = [];
let gameInventory = [];

// --- DATA PERSISTENCE ---

function persistUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(userRegistry));
}

function persistGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(gameInventory));
}

// --- NAVIGATION & UI ---

function navigateToSection(sectionId, triggeringButton) {
    hideAllSections();
    displayActiveSection(sectionId);
    updateSidebarActiveState(triggeringButton);
}

function hideAllSections() {
    document.querySelectorAll("main > section").forEach(section => section.style.display = "none");
}

function displayActiveSection(sectionId) {
    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.style.display = "block";
}

function updateSidebarActiveState(activeButton) {
    document.querySelectorAll(".sidebar nav button").forEach(btn => btn.classList.remove("active"));
    if (activeButton) activeButton.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
}

function handleDataReset() {
    if (confirm("Are you sure you want to reset all data to defaults?")) {
        localStorage.removeItem("users");
        localStorage.removeItem("games");
        initializeApplicationData();
    }
}

// --- INITIALIZATION ---

async function initializeApplicationData() {
    try {
        await loadUsersFromSource();
        await loadGamesFromSource();
        updateDashboardDisplay();
    } catch (error) {
        console.error("Data Initialization Error:", error);
        alert("Failed to load data. Check console for details.");
    }
}

async function loadUsersFromSource() {
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
        userRegistry = JSON.parse(storedUsers);
    } else {
        const response = await fetch("users.json");
        const data = await response.json();
        userRegistry = data.users || [];
        persistUsersToStorage();
    }
}

async function loadGamesFromSource() {
    const storedGames = localStorage.getItem("games");
    if (storedGames) {
        gameInventory = JSON.parse(storedGames);
    } else {
        const response = await fetch("games.json");
        const data = await response.json();
        gameInventory = data.games || [];
        persistGamesToStorage();
    }
}

function updateDashboardDisplay() {
    displaySystemStatistics();
    displayUsersTable();
    displayGamesTable();
}

// --- DASHBOARD STATISTICS ---

function displaySystemStatistics() {
    const container = document.getElementById("dashboard-cards");
    if (!container) return;

    const statsData = calculateSystemStatistics();
    container.innerHTML = statsData.map(createStatCardHtml).join('');
}

function calculateSystemStatistics() {
    const totalUsersCount = userRegistry.length;
    const pendingUsersCount = userRegistry.filter(u => u.status === "pending").length;
    const totalGamesCount = gameInventory.length;
    const availableForRentCount = gameInventory.filter(g => (g.Availability || "").toLowerCase() === "rent").length;
    const totalInventoryValue = gameInventory.reduce((sum, g) => sum + (Number(g.price) || 0), 0);

    return [
        { title: "Total Users", value: totalUsersCount },
        { title: "Pending Users", value: pendingUsersCount, link: "approveLenders.html" },
        { title: "Total Games", value: totalGamesCount },
        { title: "Available for Rent", value: availableForRentCount },
        { title: "Total Price Value", value: totalInventoryValue + " EGP" }
    ];
}

function createStatCardHtml(stat) {
    const cursorType = stat.link ? "pointer" : "default";
    const clickHandler = stat.link ? `onclick="window.location.href='${stat.link}'"` : "";

    return `
        <div class="card" ${clickHandler} style="cursor:${cursorType}">
            <h3>${stat.title}</h3>
            <p>${stat.value}</p>
        </div>
    `;
}

// --- USER MANAGEMENT ---

function displayUsersTable() {
    const tableContainer = document.getElementById("users-table");
    if (!tableContainer) return;

    const filterType = document.getElementById("user-type-filter")?.value || "all";
    const filteredUsers = getUsersForDisplay(filterType);

    tableContainer.innerHTML = `
        <thead>
            <tr>
                <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${filteredUsers.map(createUserRowHtml).join('')}
        </tbody>`;
}

function getUsersForDisplay(filterType) {
    const approvedUsers = userRegistry.filter(u => u.status !== "pending");

    if (filterType === "all") return approvedUsers;
    return approvedUsers.filter(u => u.type === filterType);
}

function createUserRowHtml(user) {
    const globalIndex = userRegistry.findIndex(u => u.userID === user.userID);
    return `
        <tr>
            <td>${user.userID}</td>
            <td>${user.name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.type}">${user.type}</span></td>
            <td class="users-action">
                <button class="action-btn" onclick="startUserEditing(${globalIndex})"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="confirmUserDeletion(${globalIndex})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
}

function startUserEditing(index) {
    const user = userRegistry[index];
    const newName = prompt("Full Name:", user.name);
    if (newName === null) return;
    const newUsername = prompt("Username:", user.username);
    if (newUsername === null) return;
    const newEmail = prompt("Email:", user.email);
    if (newEmail === null) return;
    const newType = prompt("Type (admin / business / customer):", user.type);
    if (newType === null) return;

    // FIX: Add validation for editing to prevent duplicates
    if (newUsername !== user.username && userRegistry.some(u => u.username === newUsername)) {
        alert("Username already exists!");
        return;
    }
    if (newEmail !== user.email && userRegistry.some(u => u.email === newEmail)) {
        alert("Email already exists!");
        return;
    }
    const validTypes = ['admin', 'business', 'customer'];
    if (!validTypes.includes(newType.toLowerCase())) {
        alert("Invalid user type!");
        return;
    }

    userRegistry[index] = { ...user, name: newName, username: newUsername, email: newEmail, type: newType.toLowerCase() };
    persistUsersToStorage();
    updateDashboardDisplay();
}

function confirmUserDeletion(index) {
    if (confirm("Delete this user?")) {
        userRegistry.splice(index, 1);
        persistUsersToStorage();
        updateDashboardDisplay();
    }
}

// --- GAME MANAGEMENT ---

function displayGamesTable() {
    const tableContainer = document.getElementById("games-table");
    if (!tableContainer) return;

    tableContainer.innerHTML = `
        <thead>
            <tr>
                <th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Status</th><th>Vendor</th><th>Price (EGP)</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${gameInventory.map(game => createGameRowHtml(game)).join('')}
        </tbody>`;
}

function createGameRowHtml(game) {
    const vendorName = getVendorDisplayName(game);
    // FIX: Use accurate gameID instead of array index for safer edits/deletes
    return `
        <tr>
            <td>${game.gameID}</td>
            <td>${game.name}</td>
            <td>${game.platform}</td>
            <td>${game.genre}</td>
            <td>${game.Availability || "N/A"}</td>
            <td>${vendorName}</td>
            <td>${game.price || "-"}</td>
            <td class="games-action">
                <button class="action-btn" onclick="startGameEditing('${game.gameID}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="confirmGameDeletion('${game.gameID}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
}

function getVendorDisplayName(game) {
    if (game.vendor) return game.vendor;
    if (!game.vendorID) return "System";

    const vendor = userRegistry.find(u => Number(u.userID) === Number(game.vendorID));
    return vendor ? vendor.name : "System";
}

function startGameEditing(gameID) {
    // FIX: find index dynamically
    const index = gameInventory.findIndex(g => g.gameID === gameID);
    if (index === -1) return;
    const game = gameInventory[index];

    const name = prompt("Game Name:", game.name);
    if (name === null) return;
    const platform = prompt("Platform:", game.platform);
    if (platform === null) return;
    const genre = prompt("Genre:", game.genre);
    if (genre === null) return;

    let availability = prompt("Status (buy/rent):", game.Availability);
    if (availability === null) return;
    availability = availability.toLowerCase() === "rent" ? "rent" : "buy";

    const vendorDisplayName = getVendorDisplayName(game);
    const vendorInput = prompt("Vendor:", vendorDisplayName);
    if (vendorInput === null) return;

    // FIX: Link vendor to actual user if possible to maintain vendorID relationships
    const vendorUser = userRegistry.find(u => u.name.toLowerCase() === vendorInput.toLowerCase() || u.username.toLowerCase() === vendorInput.toLowerCase());

    const price = prompt("Price (EGP):", game.price);
    if (price === null) return;

    gameInventory[index] = {
        ...game,
        name,
        platform,
        genre,
        Availability: availability,
        vendorID: vendorUser ? vendorUser.userID : null,
        vendor: vendorUser ? undefined : vendorInput,
        price: Number(price)
    };
    persistGamesToStorage();
    updateDashboardDisplay();
}

function confirmGameDeletion(gameID) {
    if (confirm("Delete this game?")) {
        // FIX: Find the correct index in case array was filtered or sorted
        const index = gameInventory.findIndex(g => g.gameID === gameID);
        if (index > -1) {
            gameInventory.splice(index, 1);
            persistGamesToStorage();
            updateDashboardDisplay();
        }
    }
}

// --- ADMIN FORM HANDLING ---

function handleAdminCreation(event) {
    event.preventDefault();
    const adminForm = event.target;
    const formData = new FormData(adminForm);

    if (!validateAdminForm(formData)) return;

    const newAdmin = {
        userID: userRegistry.length > 0 ? Math.max(...userRegistry.map(u => Number(u.userID) || 0)) + 1 : 1,
        name: formData.get("name"),
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
        type: "admin",
        status: "active" // FIX: added default status
    };

    userRegistry.push(newAdmin);
    persistUsersToStorage();
    updateDashboardDisplay();
    adminForm.reset();
    alert("Admin added!");
}

function validateAdminForm(formData) {
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const username = formData.get("username");
    const email = formData.get("email");

    if (password.length < 6) {
        alert("Password must be at least 6 characters!");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return false;
    }

    if (userRegistry.some(u => u.username === username)) {
        alert("Username already exists!");
        return false;
    }

    if (userRegistry.some(u => u.email === email)) {
        alert("Email already exists!");
        return false;
    }

    return true;
}

// --- GAME FORM HANDLING ---

function openAddGameModal() { document.getElementById("add-game-form-container").style.display = "block"; }
function closeAddGameModal() { document.getElementById("add-game-form-container").style.display = "none"; }

function handleGameCreation(event) {
    event.preventDefault();
    const gameForm = event.target;
    const formData = new FormData(gameForm);

    const vendorInput = formData.get("gamevendor");
    // FIX: Map text input to an actual business vendorID if exists
    const vendorUser = userRegistry.find(u => u.name.toLowerCase() === vendorInput.toLowerCase() || u.username.toLowerCase() === vendorInput.toLowerCase());

    const nextId = gameInventory.length > 0 ? Math.max(...gameInventory.map(g => Number(g.gameID) || 0)) + 1 : 1;
    const newGame = {
        gameID: String(nextId).padStart(3, '0'),
        name: formData.get("name"),
        platform: formData.get("platform"),
        genre: formData.get("genre"),
        Availability: formData.get("availability") || "buy",
        vendor: vendorUser ? undefined : vendorInput,
        vendorID: vendorUser ? vendorUser.userID : null,
        description: formData.get("description"),
        price: Number(formData.get("price"))
    };

    gameInventory.push(newGame)
    persistGamesToStorage();
    updateDashboardDisplay();
    gameForm.reset();
    closeAddGameModal();
}

// --- BOOTSTRAP ---

document.addEventListener("DOMContentLoaded", () => {
    initializeApplicationData();
    navigateToSection('dashboard', document.querySelector(".sidebar nav button"));

    const userTypeFilter = document.getElementById("user-type-filter");
    if (userTypeFilter) {
        userTypeFilter.addEventListener("change", displayUsersTable);
    }

    const adminForm = document.getElementById("add-admin-form");
    if (adminForm) {
        adminForm.addEventListener("submit", handleAdminCreation);
    }

    const gameForm = document.getElementById("add-game-form");
    if (gameForm) {
        gameForm.addEventListener("submit", handleGameCreation);
    }
});