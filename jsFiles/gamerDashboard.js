let users = [];
let games = [];

const currentUsername =
    sessionStorage.getItem("loggedInUsername") ||
    JSON.parse(localStorage.getItem("currentUser"))?.username ||
    null;

function getCurrentUser() {
    const stored = localStorage.getItem("users");
    if (!stored) return null;
    const fresh = JSON.parse(stored);
    return fresh.find(u => u.username === currentUsername) || null;
}

function getWishlist() {
    const user = getCurrentUser();
    return user?.wishlist || [];
}

function saveWishlist(list) {
    const stored = localStorage.getItem("users");
    if (!stored) return;
    const fresh = JSON.parse(stored);
    const idx = fresh.findIndex(u => u.username === currentUsername);
    if (idx === -1) return;
    fresh[idx].wishlist = list;
    localStorage.setItem("users", JSON.stringify(fresh));
    users = fresh;
}

function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("pshub_inventory", JSON.stringify(games));
}

async function loadData() {
    const savedUsers = localStorage.getItem("users");
    if (savedUsers) {
        try { users = JSON.parse(savedUsers) || []; }
        catch { users = []; }
    } else {
        const res = await fetch("users.json");
        const data = await res.json();
        users = data.users || data;
        saveUsersToStorage();
    }

    const savedGames = localStorage.getItem("pshub_inventory");
    if (savedGames) {
        try { games = JSON.parse(savedGames) || []; }
        catch { games = []; }
    } else {
        const res = await fetch("browseGames.json");
        const data = await res.json();
        games = data.games || data;
        saveGamesToStorage();
    }

    games.forEach(g => {
        g.inWishlist = false;
        g.rental = g.rental || null;
        g.review = g.review || null;
    });


    if (!localStorage.getItem("backup_users")) {
        localStorage.setItem("backup_users", JSON.stringify(users));
    }

    if (!localStorage.getItem("backup_games")) {
        localStorage.setItem("backup_games", JSON.stringify(games));
    }

    refreshUI();
}


async function resetDatabase() {
    if (!confirm("Reset data to original JSON?")) return;

    try {
        const usersRes = await fetch("users.json");
        const gamesRes = await fetch("browseGames.json");

        const usersData = await usersRes.json();
        const gamesData = await gamesRes.json();

        const freshUsers = usersData.users || usersData;
        const freshGames = gamesData.games || gamesData;

        localStorage.setItem("users", JSON.stringify(freshUsers));
        localStorage.setItem("pshub_inventory", JSON.stringify(freshGames));

        location.reload();
    } catch (e) {
        alert("Reset failed: JSON files not loading");
        console.error(e);
    }
}

function showSection(sectionId, btn) {
    document.querySelectorAll("main > section")
        .forEach(s => s.style.display = "none");

    const sec = document.getElementById(sectionId);
    if (sec) sec.style.display = "block";

    document.querySelectorAll(".sidebar nav button")
        .forEach(b => b.classList.remove("active"));

    if (btn) btn.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("loggedInUsername");
        window.location.href = "login.html";
    }
}

function refreshUI() {
    renderDashboard();
    renderWishlist();
    renderRentals();
    renderProfile();
}

function gameName(game) {
    return game.title || "Unknown Game";
}

function gameCategory(game) {
    return game.category || "Unknown";
}


function renderDashboard() {
    const user = getCurrentUser();
    if (!user) return;


    const activeRentals = games.filter(g =>
        g.rental?.status === "active" && g.customerID === user.userID
    );

    const wishlistIds = getWishlist();
    const availableWishlist = games.filter(g =>
        wishlistIds.includes(g.gameID) && g.status === "available"
    );


    const cards = document.getElementById("dashboard-cards");
    if (cards) {
        cards.innerHTML = `
            <div class="card"><h3>Active Rentals</h3><p>${activeRentals.length}</p></div>
            <div class="card"><h3>Wishlist</h3><p>${availableWishlist.length}</p></div>
        `;
    }


    const tbody = document.getElementById("activity-body");
    if (!tbody) return;

    let activityHtml = "";


    activeRentals.forEach(game => {
        activityHtml += `<tr><td>🎮 Rented: **${game.title}**</td></tr>`;
    });


    availableWishlist.forEach(game => {
        activityHtml += `<tr><td>❤️ Wishlist: **${game.title}**</td></tr>`;
    });


    games.forEach(game => {
        if (game.review && game.customerID === user.userID) {
            activityHtml += `<tr><td>⭐ Reviewed: **${game.title}**</td></tr>`;
        }
    });

    tbody.innerHTML = activityHtml || "<tr><td>No recent activity found.</td></tr>";
}


function addToWishlist(gameID) {
    let list = getWishlist();

    if (!list.includes(gameID)) {
        list.push(gameID);
        saveWishlist(list);
        showToast("Added to wishlist!");
    }

    renderWishlist();
    renderDashboard();
}

function removeFromWishlist(gameID) {
    let list = getWishlist().filter(id => id !== gameID);
    saveWishlist(list);

    showToast("Removed from wishlist.");
    renderWishlist();
    renderDashboard();
}


function renderWishlist() {
    const container = document.getElementById("wishlist-container");
    if (!container) return;

    let wishlistIds = getWishlist();

    const availableGames = games.filter(g =>
        wishlistIds.includes(g.gameID) && g.status === "available"
    );

    container.innerHTML = "";

    if (availableGames.length === 0) {
        container.innerHTML = "<p>No wishlist items available.</p>";
        return;
    }

    availableGames.forEach(game => {
        container.innerHTML += `
            <div class="wishlist-card">
                <img src="${game.img}" style="width:60px">
                <h3>${gameName(game)}</h3>
                <p>${gameCategory(game)}</p>
                <p>${game.price} EGP</p>
                <button onclick="goToGameDescription('${game.gameID}')">Rent</button>
            </div>
        `;
    });
}


function goToGameDescription(gameID) {
    window.location.href = `game_description.html?id=${gameID}`;
}


function renderRentals() {
    const active = document.getElementById("active-rentals");
    const completed = document.getElementById("completed-rentals");
    if (!active || !completed) return;

    const user = getCurrentUser();
    if (!user) return;

    active.innerHTML = "";
    completed.innerHTML = "";

    games.forEach(game => {
        if (!game.rental || game.customerID !== user.userID) return;

        const html = `
            <div class="game-card">
                <h3>${gameName(game)}</h3>
                <p>${game.rental.owner || ""}</p>
                <p>${game.rental.start} → ${game.rental.end || ""}</p>
                <span>${game.rental.status}</span>
                ${game.rental.status === "active"
                ? `<button onclick="returnGame('${game.gameID}')">Return</button>`
                : ""
            }
            </div>
        `;

        if (game.rental.status === "active") {
            active.innerHTML += html;
        } else {
            completed.innerHTML += html;
        }
    });
}

function renderProfile() {
    const user = getCurrentUser();
    if (!user) return;

    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("avatar").innerText = initials;
    document.getElementById("nameText").innerText = user.name;
    document.getElementById("emailText").innerText = user.email;
    document.getElementById("usernameText").innerText = user.username;
    document.getElementById("phoneText").innerText = user.phone || "N/A";
    document.getElementById("memberSince").innerText = user.memberSince || "-";

    const count = games.filter(g =>
        g.rental?.status === "completed" && g.customerID === user.userID
    ).length;
    document.getElementById("totalRentals").innerText = `${count} Games`;
}

function editProfile() {
    toggleEdit(true);
}

function saveProfile() {
    const stored = localStorage.getItem("users");
    if (!stored) return;
    const fresh = JSON.parse(stored);
    const idx = fresh.findIndex(u => u.username === currentUsername);
    if (idx === -1) return;
    fresh[idx].name = document.getElementById("nameInput").value;
    fresh[idx].email = document.getElementById("emailInput").value;
    fresh[idx].phone = document.getElementById("phoneInput").value;
    localStorage.setItem("users", JSON.stringify(fresh));
    users = fresh;
    renderProfile();
    toggleEdit(false);
    showToast("Profile saved!");
}

function toggleEdit(editing) {
    const user = getCurrentUser();
    if (editing && user) {
        document.getElementById("nameInput").value = user.name || "";
        document.getElementById("emailInput").value = user.email || "";
        document.getElementById("usernameInput").value = user.username || "";
        document.getElementById("phoneInput").value = user.phone || "";
    }
    ["name", "email", "username", "phone"].forEach(id => {
        document.getElementById(id + "Text").style.display = editing ? "none" : "block";
        document.getElementById(id + "Input").style.display = editing ? "block" : "none";
    });
    document.getElementById("editBtn").style.display = editing ? "none" : "block";
    document.getElementById("saveBtn").style.display = editing ? "block" : "none";
}

function returnGame(gameID) {
    const game = games.find(g => g.gameID === gameID);
    if (game?.rental) {
        game.rental.status = "completed";
        game.status = "available";
        saveGamesToStorage();


        const updatedWishlist = getWishlist().filter(id => id !== gameID);
        saveWishlist(updatedWishlist);

        refreshUI();
        showToast(`${gameName(game)} returned!`);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    showSection("dashboard", document.querySelector(".sidebar nav button"));
});