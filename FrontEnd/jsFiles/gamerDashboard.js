let users = [];
let games = [];
let rentals = [];

// ==========================================
// 👤 CURRENT USER
// ==========================================
function getCurrentUsername() {
    return (
        sessionStorage.getItem("loggedInUsername") ||
        JSON.parse(localStorage.getItem("currentUser") || "null")?.username ||
        null
    );
}

// ==========================================
// 👤 GET CURRENT USER
// ==========================================
function getCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) return null;

    const stored = localStorage.getItem("users");
    if (!stored) return currentUser;

    let fresh = [];
    try {
        fresh = JSON.parse(stored);
    } catch {
        fresh = [];
    }

    const matched = fresh.find(u => u.username === currentUser.username || u.email === currentUser.email);
    if (!matched) return currentUser;

    return { ...matched, ...currentUser };
}

// ==========================================
// ❤️ WISHLIST
// ==========================================
function getWishlist() {
    const currentUser = getCurrentUser();
    if (Array.isArray(currentUser?.wishlist) && currentUser.wishlist.length > 0) {
        return currentUser.wishlist.map(id => String(id));
    }

    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            const stored = localStorage.getItem("users");
            if (stored) {
                const fresh = JSON.parse(stored);
                const matched = fresh.find(u => u.username === parsedUser.username || u.email === parsedUser.email);
                if (matched && Array.isArray(matched.wishlist) && matched.wishlist.length > 0) {
                    return matched.wishlist.map(id => String(id));
                }
            }
        } catch {
            // ignore parse errors
        }
    }

    const storedWishlist = localStorage.getItem("pshub_wishlist");
    if (storedWishlist) {
        try {
            const raw = JSON.parse(storedWishlist) || [];
            return raw.map(w => String(
                typeof w === "string" ? w : (w.gameID || w.id || w._id || "")
            )).filter(Boolean);
        } catch {
            return [];
        }
    }

    return [];
}

function saveWishlist(list) {
    const normalized = Array.isArray(list)
        ? list.map(id => String(id))
        : [];

    const currentUser = getCurrentUser();
    if (currentUser) {
        const updatedUser = { ...currentUser, wishlist: normalized };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        const stored = localStorage.getItem("users");
        if (stored) {
            let fresh = [];
            try {
                fresh = JSON.parse(stored);
            } catch {
                fresh = [];
            }

            const idx = fresh.findIndex(u => u.username === updatedUser.username || u.email === updatedUser.email);
            if (idx !== -1) {
                fresh[idx] = { ...fresh[idx], ...updatedUser };
            } else {
                fresh.push(updatedUser);
            }
            localStorage.setItem("users", JSON.stringify(fresh));
            users = fresh;
        }
    }

    localStorage.setItem("pshub_wishlist", JSON.stringify(normalized));
}

// ==========================================
// 💾 SAVE HELPERS
// ==========================================
function saveUsersToStorage() {

    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );
}

function saveGamesToStorage() {

    localStorage.setItem(
        "pshub_inventory",
        JSON.stringify(games)
    );
}

// ==========================================
// 📦 LOAD DATA
// ==========================================
async function loadData() {

    // USERS
    const savedUsers = localStorage.getItem("users");

    if (savedUsers) {

        try {
            users = JSON.parse(savedUsers) || [];
        } catch {
            users = [];
        }

    } else {

        try {

            const res = await fetch("/users.json");

            const data = await res.json();

            users = data.users || data;

            saveUsersToStorage();

        } catch (err) {

            console.error("Users JSON failed:", err);

            users = [];
        }
    }

    // GAMES
    const savedGames = localStorage.getItem("pshub_inventory");

    if (savedGames) {

        try {
            games = JSON.parse(savedGames) || [];
        } catch {
            games = [];
        }

    } else {

        try {

            const res = await fetch("/browseGames.json");

            const data = await res.json();

            games = data.games || data;

            saveGamesToStorage();

        } catch (err) {

            console.error("Games JSON failed:", err);

            games = [];
        }
    }

    // DEFAULT VALUES
    games.forEach(g => {

        g.inWishlist = g.inWishlist || false;

        g.rental = g.rental || null;

        g.review = g.review || null;
    });

    // BACKUP
    if (!localStorage.getItem("backup_users")) {

        localStorage.setItem(
            "backup_users",
            JSON.stringify(users)
        );
    }

    if (!localStorage.getItem("backup_games")) {

        localStorage.setItem(
            "backup_games",
            JSON.stringify(games)
        );
    }

    await loadRentals();
    refreshUI();
}

// ==========================================
// 🧾 LOAD RENTALS
// ==========================================
async function loadRentals() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        rentals = [];
        return;
    }

    try {
        const res = await fetch("/api/rentals/my", {
            credentials: "include"
        });
        if (!res.ok) {
            rentals = [];
            return;
        }

        const data = await res.json();
        rentals = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("Failed to load rentals:", err);
        rentals = [];
    }
}

// ==========================================
// 🔄 RESET DATABASE
// ==========================================
async function resetDatabase() {

    if (!confirm("Reset data to original JSON?"))
        return;

    try {

        const usersRes = await fetch("/users.json");

        const gamesRes = await fetch("/browseGames.json");

        const usersData = await usersRes.json();

        const gamesData = await gamesRes.json();

        const freshUsers =
            usersData.users || usersData;

        const freshGames =
            gamesData.games || gamesData;

        localStorage.setItem(
            "users",
            JSON.stringify(freshUsers)
        );

        localStorage.setItem(
            "pshub_inventory",
            JSON.stringify(freshGames)
        );

        location.reload();

    } catch (e) {

        alert("Reset failed.");

        console.error(e);
    }
}

// ==========================================
// 📑 SHOW SECTIONS
// ==========================================
function showSection(sectionId, btn) {

    document
        .querySelectorAll("main > section")
        .forEach(s => {
            s.style.display = "none";
        });

    const sec = document.getElementById(sectionId);

    if (sec) {
        sec.style.display = "block";
    }

    document
        .querySelectorAll(".sidebar nav button")
        .forEach(b => {
            b.classList.remove("active");
        });

    if (btn) {
        btn.classList.add("active");
    }
}

// ==========================================
// 🚪 LOGOUT
// ==========================================
function logout() {

    if (!confirm("Are you sure you want to log out?"))
        return;

    // frontend session
    sessionStorage.removeItem("loggedInUsername");

    // jwt session
    localStorage.removeItem("token");

    localStorage.removeItem("currentUser");

    window.location.href = "/login";
}

// ==========================================
// 🔄 REFRESH UI
// ==========================================
function refreshUI() {

    renderDashboard();

    renderWishlist();

    renderRentals();

    renderProfile();
}

// ==========================================
// 🎮 HELPERS
// ==========================================
function gameName(game) {

    return game?.title || "Unknown Game";
}

function gameCategory(game) {

    return game?.category || "Unknown";
}

// ==========================================
// 📊 DASHBOARD
// ==========================================
function renderDashboard() {

    const user = getCurrentUser();
    if (!user) return;

    const activeRentals = rentals.filter(r => r.status === "active");
    const wishlistIds = getWishlist();
    const availableWishlist = games.filter(g => wishlistIds.includes(g.gameID));

    const cards = document.getElementById("dashboard-cards");
    if (cards) {
        cards.innerHTML = `
            <div class="card">
                <h3>Active Rentals</h3>
                <p>${activeRentals.length}</p>
            </div>
            <div class="card">
                <h3>Wishlist</h3>
                <p>${wishlistIds.length}</p>
            </div>
        `;
    }

    const tbody = document.getElementById("activity-body");
    if (!tbody) return;

    const activityRows = [];

    activeRentals.forEach(rental => {
        const date = rental.startDate ? new Date(rental.startDate).toLocaleDateString() : "-";
        activityRows.push(`
            <tr>
                <td>${rental.game?.title || "Unknown Game"}</td>
                <td>Active Rental</td>
                <td>${date}</td>
            </tr>
        `);
    });

    availableWishlist.forEach(game => {
        activityRows.push(`
            <tr>
                <td>${game.title || "Unknown Game"}</td>
                <td>Wishlist</td>
                <td>${game.status === "available" ? "Available" : "Unavailable"}</td>
            </tr>
        `);
    });

    if (activityRows.length === 0) {
        tbody.innerHTML = "<tr><td colspan=3>No recent activity found.</td></tr>";
    } else {
        tbody.innerHTML = activityRows.join("");
    }
}

// ==========================================
// ❤️ ADD TO WISHLIST
// ==========================================
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

// ==========================================
// ❌ REMOVE WISHLIST
// ==========================================
function removeFromWishlist(gameID) {

    let list =
        getWishlist().filter(id => id !== gameID);

    saveWishlist(list);

    showToast("Removed from wishlist.");

    renderWishlist();

    renderDashboard();
}

// ==========================================
// ❤️ RENDER WISHLIST
// ==========================================
function renderWishlist() {

    const container =
        document.getElementById("wishlist-container");

    if (!container) return;

    let wishlistIds = getWishlist();

    const wishlistGames = games.filter(g =>
        wishlistIds.includes(g.gameID)
    );

    container.innerHTML = "";

    if (wishlistGames.length === 0) {
        container.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

    wishlistGames.forEach(game => {

        container.innerHTML += `
            <div class="wishlist-card">

                <img
                    src="${game.img}"
                    style="width:60px"
                    alt="${game.title}"
                >

                <h3>${gameName(game)}</h3>

                <p>${gameCategory(game)}</p>

                <p>${game.pricePerDay || game.price || 0} EGP/day</p>
                <p>Status: ${game.status || 'Unknown'}</p>
                <button onclick="goToGameDescription('${game.gameID}')">
                    Rent
                </button>
                <button onclick="removeFromWishlist('${game.gameID}')">
                    Remove
                </button>

            </div>
        `;
    });
}

// ==========================================
// 🎮 GAME DESCRIPTION
// ==========================================
function goToGameDescription(gameID) {

    window.location.href =
        `/game_description?id=${gameID}`;
}

// ==========================================
// 🎮 RENTALS
// ==========================================
function renderRentals() {

    const active =
        document.getElementById("active-rentals");

    const completed =
        document.getElementById("completed-rentals");

    if (!active || !completed) return;

    const user = getCurrentUser();
    if (!user) return;

    active.innerHTML = "";
    completed.innerHTML = "";

    rentals.forEach(rental => {
        const game = rental.game || {};
        const dateStart = rental.startDate ? new Date(rental.startDate).toLocaleDateString() : "-";
        const dateEnd = rental.dueDate ? new Date(rental.dueDate).toLocaleDateString() : "-";

        const html = `
            <div class="game-card">
                <h3>${game.title || "Unknown Game"}</h3>
                <p>${game.platform || ""}</p>
                <p>${dateStart} → ${dateEnd}</p>
                <span>${rental.status}</span>
                ${rental.status === "active" ? `<button onclick="returnGame('${rental._id}')">Return</button>` : ""}
            </div>
        `;

        if (rental.status === "active") {
            active.innerHTML += html;
        } else {
            completed.innerHTML += html;
        }
    });

    if (!active.innerHTML) {
        active.innerHTML = "<p>No active rentals.</p>";
    }

    if (!completed.innerHTML) {
        completed.innerHTML = "<p>No completed rentals.</p>";
    }
}

// ==========================================
// 👤 PROFILE
// ==========================================
function renderProfile() {
    const user = getCurrentUser();
    if (!user) return;

    const displayName = user.name || user.username || "Gamer";
    const initials = displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    document.getElementById("avatar").innerText = initials;
    document.getElementById("nameText").innerText = displayName;
    document.getElementById("emailText").innerText = user.email || "No Email";
    document.getElementById("usernameText").innerText = user.username || "Unknown";
    document.getElementById("phoneText").innerText = user.phone || "N/A";

    const joined = user.memberSince || user.joinedAt || user.createdAt || "-";
    document.getElementById("memberSince").innerText = joined;

    const activeCount = rentals.filter(r => r.status === "active").length;
    const completedCount = rentals.filter(r => r.status !== "active").length;
    document.getElementById("totalRentals").innerText = `${activeCount + completedCount} Games`;

    const wishlistIds = getWishlist();
    const profileSummary = document.getElementById("profile-summary");
    if (profileSummary) {
        profileSummary.innerText = `${activeCount} active rental${activeCount === 1 ? "" : "s"} • ${wishlistIds.length} wishlist item${wishlistIds.length === 1 ? "" : "s"}`;
    }
}

// ==========================================
// ✏️ EDIT PROFILE
// ==========================================
function editProfile() {

    toggleEdit(true);
}

function saveProfile() {

    // Collect changed fields
    const name = document.getElementById("nameInput").value;
    const email = document.getElementById("emailInput").value;
    const username = document.getElementById("usernameInput").value;
    const phone = document.getElementById("phoneInput").value;

    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!current || !current._id) {
        showToast('No logged in user.');
        return;
    }

    const payload = { username, email, phone };

    fetch(`/api/users/${current._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data.error || data.message || 'Failed to save profile');
            return;
        }

        const user = data.user || data;

        // update localStorage.currentUser
        const minimal = {
            _id: user._id || user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone || ''
        };
        localStorage.setItem('currentUser', JSON.stringify(minimal));

        // update users list
        try {
            let stored = JSON.parse(localStorage.getItem('users') || '[]');
            const idx = stored.findIndex(u => u._id === minimal._id || u.email === minimal.email || u.username === minimal.username);
            if (idx !== -1) {
                stored[idx] = { ...stored[idx], ...user };
            } else {
                stored.push(user);
            }
            localStorage.setItem('users', JSON.stringify(stored));
        } catch (e) {
            // ignore
        }

        renderProfile();
        toggleEdit(false);
        showToast('Profile saved!');
    }).catch(err => {
        console.error('Save failed', err);
        alert('Failed to save profile.');
    });
}

function toggleEdit(editing) {

    const user = getCurrentUser();

    if (editing && user) {

        document.getElementById("nameInput").value =
            user.name || "";

        document.getElementById("emailInput").value =
            user.email || "";

        document.getElementById("usernameInput").value =
            user.username || "";

        document.getElementById("phoneInput").value =
            user.phone || "";
    }

    ["name", "email", "username", "phone"]
        .forEach(id => {

            document.getElementById(id + "Text")
                .style.display =
                editing ? "none" : "block";

            document.getElementById(id + "Input")
                .style.display =
                editing ? "block" : "none";
        });

    document.getElementById("editBtn")
        .style.display =
        editing ? "none" : "block";

    document.getElementById("saveBtn")
        .style.display =
        editing ? "block" : "none";
}

// ==========================================
// 🔁 RETURN GAME
// ==========================================
async function returnGame(rentalId) {
    const rental = rentals.find(r => r._id === rentalId || r.id === rentalId);
    if (!rental) return;

    try {
        const res = await fetch(`/api/rentals/${rentalId}/return`, {
            method: 'PATCH',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || data.message || 'Failed to return game.');
            return;
        }

        await loadRentals();
        refreshUI();
        showToast('Game returned successfully!');
    } catch (err) {
        console.error('Return failed:', err);
        alert('Failed to return game.');
    }
}

// ==========================================
// 🍞 TOAST
// ==========================================
function showToast(message) {

    alert(message);
}

// ==========================================
// 🚀 START
// ==========================================
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadData();

            // Hydrate current user from server if session exists
            try {
                const meRes = await fetch('/api/auth/me', { credentials: 'include' });
                if (meRes.ok) {
                    const me = await meRes.json();
                    if (me && me._id) {
                        // fetch full profile
                        const profileRes = await fetch(`/api/users/${me._id}`, { credentials: 'include' });
                        if (profileRes.ok) {
                            const profile = await profileRes.json();
                            // persist to localStorage.currentUser and users list
                            const minimal = {
                                _id: profile._id || profile.id,
                                username: profile.username,
                                email: profile.email,
                                role: profile.role,
                                phone: profile.phone || ''
                            };

                            localStorage.setItem('currentUser', JSON.stringify(minimal));

                            // merge into `users` storage
                            try {
                                let stored = JSON.parse(localStorage.getItem('users') || '[]');
                                const idx = stored.findIndex(u => u._id === minimal._id || u.email === minimal.email || u.username === minimal.username);
                                if (idx !== -1) {
                                    stored[idx] = { ...stored[idx], ...profile };
                                } else {
                                    stored.push(profile);
                                }
                                localStorage.setItem('users', JSON.stringify(stored));
                            } catch (e) {
                                // ignore storage merge errors
                            }
                        }
                    }
                }
            } catch (e) {
                // ignore network errors — user will use localStorage fallback
            }

            showSection(
                "dashboard",
                document.querySelector(".sidebar nav button")
            );
    }
);

window.addEventListener("storage", (event) => {
    if (["currentUser", "token", "users", "pshub_cart", "pshub_wishlist"].includes(event.key)) {
        refreshUI();
    }
});