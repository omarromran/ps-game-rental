// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────

function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(s => s.style.display = "none");
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "block";

    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
}

// ─────────────────────────────────────────────
//  DASHBOARD CARDS  (fetches both JSON files)
// ─────────────────────────────────────────────

async function renderDashboardCards() {
    const container = document.getElementById("dashboard-cards");
    if (!container) return;

    try {
        const [usersRes, gamesRes] = await Promise.all([
            fetch("users.json"),
            fetch("games.json")
        ]);

        if (!usersRes.ok) throw new Error("Could not load users.json");
        if (!gamesRes.ok) throw new Error("Could not load games.json");

        const { users } = await usersRes.json();
        const { games } = await gamesRes.json();

        const totalUsers      = users.length;
        const pendingUsers    = users.filter(u => u.status === "pending").length;
        const totalGames      = games.length;
        const rentableGames   = games.filter(g => (g.Availability || "").toLowerCase() === "rent").length;
        const totalPriceValue = games.reduce((sum, g) => sum + (Number(g.price) || 0), 0);

        container.innerHTML = [
            { title: "Total Users",        value: totalUsers       },
            { title: "Pending Approvals",  value: pendingUsers,    link: "approveLenders.html" },
            { title: "Total Games",        value: totalGames       },
            { title: "Available for Rent", value: rentableGames    },
            { title: "Total Price Value",  value: totalPriceValue + " EGP" }
        ].map(stat => `
            <div class="card"
                 ${stat.link ? `onclick="window.location.href='${stat.link}'"` : ""}
                 style="cursor:${stat.link ? "pointer" : "default"}">
                <h3>${stat.title}</h3>
                <p>${stat.value}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error("Dashboard cards error:", err);
        container.innerHTML = `<p style="color:red;">Failed to load dashboard data.</p>`;
    }
}

// ─────────────────────────────────────────────
//  USERS TABLE  (fetches users.json directly)
// ─────────────────────────────────────────────

async function renderUsersTable() {
    const table = document.getElementById("users-table");
    if (!table) return;

    const filterValue = document.getElementById("user-type-filter")?.value || "all";

    try {
        const res = await fetch("users.json");
        if (!res.ok) throw new Error("Could not load users.json");
        const { users } = await res.json();

        // Exclude pending users
        const visible = users.filter(u => u.status !== "pending");
        const filtered = filterValue === "all"
            ? visible
            : visible.filter(u => u.type === filterValue);

        if (filtered.length === 0) {
            table.innerHTML = `
                <thead><tr>
                    <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th>
                </tr></thead>
                <tbody><tr>
                    <td colspan="5" style="text-align:center;padding:1.5rem;">No users found.</td>
                </tr></tbody>`;
            return;
        }

        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Type</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(u => `
                <tr>
                    <td>${u.userID}</td>
                    <td>${u.name}</td>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.type}">${u.type}</span></td>
                </tr>`).join("")}
            </tbody>`;

    } catch (err) {
        console.error("Users table error:", err);
        table.innerHTML = `<tbody><tr><td style="color:red;">Failed to load users.</td></tr></tbody>`;
    }
}

// ─────────────────────────────────────────────
//  GAMES TABLE  (fetches games.json directly)
// ─────────────────────────────────────────────

async function renderGamesTable() {
    const table = document.getElementById("games-table");
    if (!table) return;

    try {
        const res = await fetch("games.json");
        if (!res.ok) throw new Error("Could not load games.json");
        const { games } = await res.json();

        if (games.length === 0) {
            table.innerHTML = `
                <thead><tr>
                    <th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Status</th><th>Vendor</th><th>Price (EGP)</th>
                </tr></thead>
                <tbody><tr>
                    <td colspan="7" style="text-align:center;padding:1.5rem;">No games found.</td>
                </tr></tbody>`;
            return;
        }

        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th><th>Name</th><th>Platform</th><th>Genre</th><th>Status</th><th>Vendor</th><th>Price (EGP)</th>
                </tr>
            </thead>
            <tbody>
                ${games.map(g => `
                <tr>
                    <td>${g.gameID}</td>
                    <td>${g.name}</td>
                    <td>${g.platform}</td>
                    <td>${g.genre}</td>
                    <td>${g.Availability || "N/A"}</td>
                    <td>${g.vendor || "System"}</td>
                    <td>${g.price ?? "-"}</td>
                </tr>`).join("")}
            </tbody>`;

    } catch (err) {
        console.error("Games table error:", err);
        table.innerHTML = `<tbody><tr><td style="color:red;">Failed to load games.</td></tr></tbody>`;
    }
}

// ─────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // Auth guard — only logged-in admins may access this page
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        alert("You must be logged in to access this page.");
        window.location.href = "login.html";
        return;
    }
    if (currentUser.type !== "admin") {
        alert("Access denied. Admins only.");
        window.location.href = "login.html";
        return;
    }

    // Show dashboard section first
    showSection("dashboard", document.querySelector(".sidebar nav button"));

    // Render all sections from JSON files
    renderDashboardCards();
    renderUsersTable();
    renderGamesTable();

    // Re-render users table when filter changes
    const userFilter = document.getElementById("user-type-filter");
    if (userFilter) userFilter.addEventListener("change", renderUsersTable);
});