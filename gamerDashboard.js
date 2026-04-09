let users = [];
let games = [];


function saveUsersToStorage() {
    localStorage.setItem("users", JSON.stringify(users));
}

function saveGamesToStorage() {
    localStorage.setItem("games", JSON.stringify(games));
}


async function loadData() {
    try {
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        } else {
            const res = await fetch("users.json");
            const data = await res.json();
            users = data.users || [];
            saveUsersToStorage();
        }

        const storedGames = localStorage.getItem("games");
        if (storedGames) {
            games = JSON.parse(storedGames);
        } else {
            const res = await fetch("games.json");
            const data = await res.json();
            games = data.games || [];
            saveGamesToStorage();
        }
    } catch (err) {
        console.error("Data Load Error:", err);
        alert("Failed to load data. Check console for details.");
    }
}


function showSection(id, btn) {
    document.querySelectorAll("main section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";

    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}


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

/* REVIEW */
function submitReview() {
    showToast("Review submitted for " + currentGame);
    closeModal("review-modal");
}

/* RENT */
function submitRent() {
    showToast("Rental confirmed for " + currentGame);
    closeModal("rent-modal");
}

/* PROFILE */
function editProfile() {
    toggleEdit(true);
    document.getElementById("editBtn").style.display = "none";
    document.getElementById("saveBtn").style.display = "inline-block";
}

function saveProfile() {
    document.getElementById("nameText").innerText = document.getElementById("nameInput").value;
    document.getElementById("emailText").innerText = document.getElementById("emailInput").value;
    document.getElementById("usernameText").innerText = document.getElementById("usernameInput").value;
    document.getElementById("phoneText").innerText = document.getElementById("phoneInput").value;

    toggleEdit(false);
    document.getElementById("editBtn").style.display = "inline-block";
    document.getElementById("saveBtn").style.display = "none";

    showToast("Profile updated successfully");
}

function toggleEdit(editing) {
    const ids = ["name", "email", "username", "phone"];
    ids.forEach(id => {
        document.getElementById(id + "Text").style.display = editing ? "none" : "block";
        document.getElementById(id + "Input").style.display = editing ? "block" : "none";
    });
}

function updateAvatar() {
    const name = document.getElementById("name").value;
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
    document.getElementById("avatar").innerText = initials;
}

/* LOGOUT */
function logout() {
    window.location.href = "login.html";
}

/* TOAST */
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2500);
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
    await loadData();
    showSection("dashboard");
    document.getElementById("name").addEventListener("input", updateAvatar);
});
