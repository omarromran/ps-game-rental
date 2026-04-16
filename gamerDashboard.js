let users = [];
let games = [];


const currentUsername = JSON.parse(localStorage.getItem("currentUser"))?.username || null;
if (!currentUsername) window.location.href = "login.html";


function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}


async function loadData() {
    const savedUsers = localStorage.getItem("users");
    const savedGames = localStorage.getItem("games");

    if (savedUsers) {
        try { users = JSON.parse(savedUsers) || []; } catch { users = []; }
    } else {
        try {
            const res = await fetch("users.json");
            if (!res.ok) throw new Error("users.json not found");
            const data = await res.json();
            users = data.users || [];
            saveUsersToStorage();
        } catch (err) {
            console.error("Failed to load users:", err);
            showToast("Could not load user data.");
            users = [];
        }
    }

    if (savedGames) {
        try { games = JSON.parse(savedGames) || []; } catch { games = []; }
    } else {
        try {
            const res = await fetch("games.json");
            if (!res.ok) throw new Error("games.json not found");
            const data = await res.json();
            games = data.games || [];
            saveGamesToStorage();
        } catch (err) {
            console.error("Failed to load games:", err);
            showToast("Could not load game data.");
            games = [];
        }
    }

    games.forEach(g => {
        if (g.inWishlist && g.Availability !== "rent") {
            g.inWishlist = false;
        }
    });
    saveGamesToStorage();

    refreshUI();
}


async function resetDatabase() {
    if (confirm("Are you sure you want to reset all data to default? This will delete your current profile changes and rental history.")) {
        localStorage.removeItem("users");
        localStorage.removeItem("games");
        showToast("Data reset! Reloading...");
        setTimeout(() => location.reload(), 500);
    }
}

function getCurrentUser() {
    return users.find(u => u.username === currentUsername) || null;
}


function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");
    const sec = document.getElementById(sectionId);
    if (sec) sec.style.display = "block";
    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
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


function renderDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    const activeCount = games.filter(g =>
        g.rental?.status === "active" && g.customerID === user.userID
    ).length;

    const wishlistCount = games.filter(g =>
        g.inWishlist && g.Availability === "rent"
    ).length;

    const cards = document.getElementById("dashboard-cards");
    if (cards) {
        cards.innerHTML = `
            <div class="card"><h3>Active Rentals</h3><p>${activeCount}</p></div>
            <div class="card"><h3>Wishlist</h3><p>${wishlistCount}</p></div>
        `;
    }

    const tbody = document.getElementById("activity-body");
    if (tbody) {
        let rows = "";

        games.forEach(game => {
            if (game.rental?.status && game.customerID === user.userID) {
                rows += `<tr><td>🎮 Rental: ${game.name}</td></tr>`;
            }
            if (game.review && game.customerID === user.userID) {
                rows += `<tr><td>⭐ Reviewed: ${game.name}</td></tr>`;
            }
            if (game.inWishlist) {
                rows += `<tr><td>❤️ Wishlist: ${game.name}</td></tr>`;
            }
        });

        tbody.innerHTML = rows || "<tr><td>No activity</td></tr>";
    }
}


function renderWishlist() {
    const container = document.getElementById("wishlist-container");
    if (!container) return;

    const list = games.filter(g => g.inWishlist && g.Availability === "rent");
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
                <button onclick="openRent('${game.gameID}')">Rent</button>
            </div>
        `;
    });
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

        if (game.rental.status === "active") {
            active.innerHTML += `
                <div class="game-card">
                    <h3>${game.name}</h3>
                    <p>${game.rental.owner}</p>
                    <p>${game.rental.start} - ${game.rental.end}</p>
                    <span>active</span>
                    <button onclick="returnGame('${game.gameID}')" style="margin-top:10px; width:100%; background-color:#c0392b;">
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
                    <button onclick="openReview('${game.gameID}')" style="margin-top:10px; width:100%;">
                        ⭐ Leave Review
                    </button>
                </div>
            `;
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


let currentGameID = null;

function openReview(gameID) {
    currentGameID = gameID;
    const game = games.find(g => g.gameID === gameID);
    document.getElementById("review-game-name").innerText = game ? game.name : "";
    resetReviewModal();
    document.getElementById("review-modal").style.display = "flex";
}

function openRent(gameID) {
    currentGameID = gameID;
    const game = games.find(g => g.gameID === gameID);
    document.getElementById("rent-game-title").innerText = game ? game.name : "";
    document.getElementById("rent-start").value = "";
    document.getElementById("rent-end").value = "";
    document.getElementById("rent-modal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}


function submitReview() {
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value.trim();

    if (!rating) {
        showToast("Please select a star rating.");
        return;
    }


    const game = games.find(g => g.gameID === currentGameID);
    if (game) {
        game.review = { rating: Number(rating), comment };
        saveGamesToStorage();
        refreshUI();
        showToast("Review submitted!");
    }

    resetReviewModal();
    closeModal("review-modal");
}

function resetReviewModal() {
    document.getElementById("comment").value = "";
    document.getElementById("rating").value = "";
    document.querySelectorAll(".star-rating span").forEach(s => s.classList.remove("active"));
}


function submitRent() {
    const start = document.getElementById("rent-start").value;
    const end = document.getElementById("rent-end").value;

    if (!start || !end) {
        showToast("Please select both start and end dates.");
        return;
    }
    if (new Date(end) <= new Date(start)) {
        showToast("End date must be after start date.");
        return;
    }

    const user = getCurrentUser();
    const game = games.find(g => g.gameID === currentGameID);

    if (game && user) {
        game.rental = { owner: user.name, start, end, status: "active" };
        game.customerID = user.userID;
        game.inWishlist = false;
        saveGamesToStorage();
        refreshUI();
        showToast(`${game.name} rented successfully!`);
    }

    closeModal("rent-modal");
}

function returnGame(gameID) {
    const game = games.find(g => g.gameID === gameID);
    if (game && game.rental) {
        game.rental.status = "completed";
        saveGamesToStorage();
        refreshUI();
        showToast(`${game.name} returned successfully!`);
    }
}


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


function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2000);
}


function setRating(value) {
    document.getElementById("rating").value = value;
    const stars = document.querySelectorAll(".star-rating span");
    stars.forEach((star, i) => star.classList.toggle("active", i < value));
}




document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    showSection("dashboard", document.querySelector(".sidebar nav button"));
});