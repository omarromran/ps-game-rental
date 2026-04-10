let users = [];
let games = [];

const currentUserID = 4;

/* ================= SAVE ================= */
function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}

/* ================= LOAD DATA ================= */
async function loadData() {
    const savedUsers = localStorage.getItem("users");
    const savedGames = localStorage.getItem("games");

    // USERS
    if (savedUsers) {
        try {
            users = JSON.parse(savedUsers) || [];
        } catch {
            users = [];
        }
    } else {
        const res = await fetch("users.json");
        const data = await res.json();
        users = data.users || [];
        saveUsersToStorage();
    }

    // GAMES
    if (savedGames) {
        try {
            games = JSON.parse(savedGames) || [];
        } catch {
            games = [];
        }
    } else {
        const res = await fetch("games.json");
        const data = await res.json();
        games = data.games || [];
        saveGamesToStorage();
    }

    refreshUI();
}

/* ================= RESET SYSTEM ================= */
/* ================= RESET SYSTEM ================= */
async function resetDatabase() {
    if (confirm("Are you sure you want to reset all data to default? This will delete your current profile changes and rental history.")) {
        // 1. Clear the storage
        localStorage.removeItem("users");
        localStorage.removeItem("games");

        // 2. Show a toast or alert (Optional)
        showToast("Data reset! Reloading...");

        // 3. Reload the page to trigger a fresh loadData() call
        // This is the cleanest way to ensure all variables and UI elements reset
        setTimeout(() => {
            location.reload();
        }, 500); 
    }
}

/* ================= HELPERS ================= */
function getCurrentUser() {
    return users.find(u => u.userID === currentUserID) || null;
}

/* ================= NAV ================= */
function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");

    const sec = document.getElementById(sectionId);
    if (sec) sec.style.display = "block";

    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
}

/* ================= UI REFRESH ================= */
function refreshUI() {
    renderDashboard();
    renderWishlist();
    renderRentals();
    renderProfile();
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
    const activeCount = games.filter(g => g.rental?.status === "active").length;
    const pendingCount = games.filter(g => g.rental?.status === "pending").length;
    const wishlistCount = games.filter(g => g.inWishlist).length;

    const cards = document.getElementById("dashboard-cards");
    if (cards) {
        cards.innerHTML = `
            <div class="card"><h3>Active Rentals</h3><p>${activeCount}</p></div>
            
            <div class="card"><h3>Wishlist</h3><p>${wishlistCount}</p></div>
        `;
    }

    const table = document.getElementById("activity-table");
    if (table) {
        let rows = "";

        games.forEach(game => {
            const name = game.name;

            if (game.rental?.status) {
                rows += `<tr><td>🎮 Rental: ${name}</td></tr>`;
            }
            if (game.review) {
                rows += `<tr><td>⭐ Reviewed: ${name}</td></tr>`;
            }
            if (game.inWishlist) {
                rows += `<tr><td>❤️ Wishlist: ${name}</td></tr>`;
            }
        });

        table.innerHTML = rows || "<tr><td>No activity</td></tr>";
    }
}

/* ================= WISHLIST ================= */
function renderWishlist() {
    const container = document.getElementById("wishlist-container");
    if (!container) return;

    const list = games.filter(g => g.inWishlist);

    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p>No wishlist items.</p>";
        return;
    }

    list.forEach(game => {
        container.innerHTML += `
            <div class="wishlist-card">
                <div>${game.icon || "🎮"}</div>
                <h3>${game.name}</h3>
                <p>${game.genre}</p>
                <button onclick="openRent('${game.name}')">Rent</button>
            </div>
        `;
    });
}

/* ================= RENTALS ================= */
function renderRentals() {
    const active = document.getElementById("active-rentals");
    const completed = document.getElementById("completed-rentals");

    if (!active || !completed) return;

    active.innerHTML = "";
    completed.innerHTML = "";

    games.forEach(game => {
        if (!game.rental) return;

        if (game.rental.status === "active") {
            active.innerHTML += `
                <div class="game-card">
                    <h3>${game.name}</h3>
                    <p>${game.rental.owner}</p>
                    <p>${game.rental.start} - ${game.rental.end}</p>
                    <span>active</span>
                    <button onclick="returnGame('${game.name}')" style="margin-top:10px; width:100%; background-color:#c0392b;">
                        Return Game
                    </button>
                </div>
            `;
        } else if (game.rental.status === "completed") {
            completed.innerHTML += `
                <div class="game-card">
                    <h3>${game.name}</h3>
                    <p>${game.rental.owner}</p>
                    <p>${game.rental.start} - ${game.rental.end}</p>
                    <span>completed</span>
                    <button onclick="openReview('${game.name}')" style="margin-top:10px; width:100%;">
                        ⭐ Leave Review
                    </button>
                </div>
            `;
        }
    });
}
/* ================= PROFILE ================= */
function renderProfile() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById("nameText").innerText = user.name;
    document.getElementById("emailText").innerText = user.email;
    document.getElementById("usernameText").innerText = user.username;
    document.getElementById("phoneText").innerText = user.phone || "N/A";
    document.getElementById("memberSince").innerText = user.memberSince || "-";

    const count = games.filter(g => g.rental).length;
    document.getElementById("totalRentals").innerText = `${count} Games`;
}

/* ================= MODALS ================= */
let currentGame = "";

function openReview(game) {
    currentGame = game;
    document.getElementById("review-game-name").innerText = game;
    document.getElementById("review-modal").style.display = "flex";
}

function openRent(game) {
    currentGame = game;
    document.getElementById("rent-game-title").innerText = game;
    document.getElementById("rent-modal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

/* ================= REVIEW ================= */
function submitReview() {
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value;

    const game = games.find(g => g.name === currentGame);
    if (game) {
        game.review = { rating, comment };
        saveGamesToStorage();
        refreshUI();
    }

    closeModal("review-modal");
}

/* ================= RENT ================= */
function submitRent() {
    const start = document.getElementById("rent-start").value;
    const end = document.getElementById("rent-end").value;

    const user = getCurrentUser();
    const game = games.find(g => g.name === currentGame);

    if (game) {
        game.rental = {
            owner: user.name,
            start,
            end,
            status: "active"
        };

        game.inWishlist = false;

        saveGamesToStorage();
        refreshUI();
    }

    closeModal("rent-modal");
}

function returnGame(gameName) {
    const game = games.find(g => g.name === gameName);
    if (game && game.rental) {
        game.rental.status = "completed";
        saveGamesToStorage();
        refreshUI();
        showToast(`${gameName} returned successfully!`);
    }
}


/* ================= PROFILE EDIT ================= */
function editProfile() {
    toggleEdit(true);
}

function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;

    user.name = document.getElementById("nameInput").value;
    user.email = document.getElementById("emailInput").value;
    user.username = document.getElementById("usernameInput").value;
    user.phone = document.getElementById("phoneInput").value;

    saveUsersToStorage();
    renderProfile();

    toggleEdit(false);
}

function toggleEdit(editing) {
    ["name", "email", "username", "phone"].forEach(id => {
        document.getElementById(id + "Text").style.display = editing ? "none" : "block";
        document.getElementById(id + "Input").style.display = editing ? "block" : "none";
    });
}

/* ================= TOAST ================= */
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2000);
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    showSection("dashboard", document.querySelector(".sidebar nav button"));
});

function setRating(value) {
    document.getElementById("rating").value = value;
    const stars = document.querySelectorAll(".star-rating span");
    stars.forEach((star, i) => {
        star.classList.toggle("active", i < value);
    });
}