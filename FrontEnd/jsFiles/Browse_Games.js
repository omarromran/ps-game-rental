let inventory = [];
let cart = [];
let wishlist = [];
let activeStoreFilter = null;

async function loadDB() {

    // =========================
    // LOAD CART
    // =========================
    let storedCart =
        localStorage.getItem("pshub_cart");

    let storedWishlist;

    const currentUserStr =
        localStorage.getItem("currentUser");

    if (currentUserStr) {

        const currentUser =
            JSON.parse(currentUserStr);

        const users =
            JSON.parse(
                localStorage.getItem("users") || "[]"
            );

        const userObj = users.find(
            u => u.username === currentUser.username
        );

        if (userObj && userObj.wishlist) {

            storedWishlist =
                JSON.stringify(userObj.wishlist);
        }
    }

    if (!storedWishlist) {

        storedWishlist =
            localStorage.getItem("pshub_wishlist");
    }

    // =========================
    // CART
    // =========================
    if (storedCart) {

        try {

            cart = JSON.parse(storedCart) || [];

        } catch (e) {

            cart = [];
        }
    }

    // =========================
    // WISHLIST
    // =========================
    if (storedWishlist) {

        try {

            let raw =
                JSON.parse(storedWishlist) || [];

            wishlist = raw.map(w =>
                typeof w === "string"
                    ? w
                    : (
                        w.gameID ||
                        w.id ||
                        w._id ||
                        ""
                    )
            ).filter(Boolean);

        } catch (e) {

            wishlist = [];
        }
    }

    // =========================
    // LOAD GAMES FROM BACKEND
    // =========================
    try {

        const response =
            await fetch("/api/games?status=Available");

        const data =
            await response.json();

        console.log("Games from backend:", data);

        inventory =
            Array.isArray(data)
            ? data
            : (data.games || []);

    } catch (error) {

        console.error(
            "Error loading games:",
            error
        );

        inventory = [];
    }

    // =========================
    // NORMALIZE DATABASE FIELDS
    // =========================
    inventory = inventory.map(g => ({

        ...g,

        // universal ID
        gameID:
            String(
                g.gameID ||
                g._id ||
                g.id ||
                ""
            ),

        // title
        title:
            g.title || "Unknown Game",

        // image
        img:
            g.img ||
            g.image ||
            (
                g.images &&
                g.images.length > 0
            ? g.images[0]
            : "/photos/placeholder.png"
            ),

        // price
        pricePerDay:
            parseFloat(
                g.pricePerDay ||
                g.price ||
                0
            ),

        // normalize status
        status:
            (
                g.status ||
                "available"
            ).toLowerCase(),

        // platform/category fallback
        platform:
            g.platform || "PS5",

        category:
            g.category || "Unknown"
    }));

    console.log("Normalized inventory:", inventory);

    applyFilters();
}
window.onload = function () {
    loadCurrentUser();
    loadDB();
};

function loadCurrentUser() {
    const userLink = document.getElementById('user-name-link');
    const loginBtn = document.querySelector('.login-btn');
    if (!userLink) return;
    
    // If server already rendered a username (not 'Guest'), don't override it
    const currentText = userLink.textContent.trim();
    if (currentText && currentText !== 'Guest') {
        if (loginBtn) loginBtn.style.display = 'none';
        return;
    }
    
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        const user = JSON.parse(stored);
        userLink.textContent = user.name || user.username || 'My Account';
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        userLink.textContent = 'Guest';
        userLink.removeAttribute('href');
        if (loginBtn) loginBtn.style.display = 'inline';
    }
}

window.addEventListener('storage', (event) => {
    if (event.key === 'currentUser' || event.key === 'token') {
        loadCurrentUser();
    }
    if (event.key === 'pshub_cart') {
        const storedCart = localStorage.getItem('pshub_cart');
        try {
            cart = JSON.parse(storedCart) || [];
        } catch {
            cart = [];
        }
        applyFilters();
    }
});

function applyFilters() {

    const searchEl =
        document.getElementById("mainSearch");

    const minEl =
        document.getElementById("minPrice");

    const maxEl =
        document.getElementById("maxPrice");

    const search =
        (
            searchEl &&
            searchEl.value
        )
        ? String(searchEl.value).toLowerCase()
        : "";

    const minP =
        minEl
        ? (
            parseFloat(minEl.value) || 0
        )
        : 0;

    const maxP =
        maxEl
        ? (
            parseFloat(maxEl.value) || Infinity
        )
        : Infinity;

    const platforms =
        Array.from(
            document.querySelectorAll(
                "#platform-filters input:checked"
            )
        ).map(i => i.value);

    const categories =
        Array.from(
            document.querySelectorAll(
                "#category-filters input:checked"
            )
        ).map(i => i.value);

    const filtered = inventory.filter(g => {

        const matchesSearch =
            !search ||
            (
                g.title.toLowerCase().includes(search)
                ||
                g.gameID.toLowerCase().includes(search)
            );

        const matchesPlatform =
            platforms.length === 0
            ||
            platforms.includes(g.platform);

        const matchesCategory =
            categories.length === 0
            ||
            categories.includes(g.category);

        const matchesPrice =
            g.pricePerDay >= minP &&
            g.pricePerDay <= maxP;

        const matchesStore =
            !activeStoreFilter ||
            g.storeID === activeStoreFilter;

        // FIXED STATUS CHECK
        const isAvailable =
            g.status === "available" ||
            g.status === "";

        return (
            matchesSearch &&
            matchesPlatform &&
            matchesCategory &&
            matchesPrice &&
            matchesStore &&
            isAvailable
        );
    });

    const itemCount =
        document.getElementById("item-count");

    if (itemCount) {

        itemCount.innerText =
            `${filtered.length} games found`;
    }

    renderInventory(filtered);

    renderCart();
}

function renderInventory(data) {
    const gallery = document.getElementById('game-grid');
    if (!gallery) return;

    gallery.innerHTML = '';

    if (data.length === 0) {
        gallery.innerHTML = `<div style="color:white; grid-column: 1/-1; text-align:center; padding: 50px;">No games available.</div>`;
        return;
    }

    data.forEach(game => {
        const gid = String(game.gameID || game._id || game.id || '');
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cursor = 'pointer';
        card.onclick = () => window.location.href = `/game_description?id=${gid}`;

        const isInCart = cart.some(item => item.gameID === gid);
        const buttonText = isInCart ? "In Cart" : "Add to Cart";
        const buttonClass = isInCart ? "add-btn in-cart" : "add-btn";

        const isInWishlist = wishlist.includes(gid);
        const heartIcon = isInWishlist ? "❤️" : "🤍";

        card.innerHTML = `
            <img src="${game.img}" alt="${game.title}" style="width: 100%; height: auto; object-fit: cover;">
            <div class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${gid}')">${heartIcon}</div>
            <div class="game-info"> 
                <h3>${game.title}</h3>
                <p style="font-size: 0.8rem; color: #888; margin: 0;">${game.platform}</p>
                <p style="font-size: 0.75rem; color: #666; margin: 3px 0;">${game.category || ''}</p>
                <div class="price" style="font-weight: bold; margin: 5px 0;">${(game.pricePerDay || 0)} EGP/day</div>
                <button class="${buttonClass}" onclick="event.stopPropagation(); addToCart('${gid}')">
                    ${buttonText}
                </button>
            </div>
        `;
        gallery.appendChild(card);
    });
}

function addToCart(id) {
    const item = inventory.find(g => String(g.gameID || g._id || g.id || '') === String(id));
    if (item && !cart.some(c => String(c.gameID || c._id || c.id || '') === String(id))) {
        cart.push(item);
        saveDB();
        applyFilters();
    }
}

function removeFromCart(id) {
    cart = cart.filter(c => String(c.gameID || c._id || c.id || '') !== String(id));
    saveDB();
    applyFilters();
}

function renderCart() {
    const cartList = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (cartCount) cartCount.innerText = cart.length;

    let total = 0;
    if (cartList) {
        cartList.innerHTML = cart.map(item => {
            total += parseFloat(item.pricePerDay) || 0;
            return `
                <div class="cart-item">
                    <img src="${item.img}" style="width:40px; height:60px; object-fit:cover; border-radius:4px;">
                    <div style="flex:1; font-size:0.85rem; color:white; margin-left:10px;">${item.title}<br>${item.pricePerDay} EGP</div>
                    <button onclick="removeFromCart('${item.gameID}')" style="background:none; border:none; cursor:pointer; color:white;">🗑️</button>
                </div>
            `;
        }).join('');
    }
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
}

function toggleCart(open) {
    const sidebar = document.getElementById('cart-sidebar');
    if (!sidebar) return;

    if (open === true) sidebar.classList.add('open');
    else if (open === false) sidebar.classList.remove('open');
    else sidebar.classList.toggle('open');
}

function saveDB() {
    localStorage.setItem('pshub_cart', JSON.stringify(cart));

    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.username === currentUser.username);
        if (idx !== -1) {
            users[idx].wishlist = wishlist;
            localStorage.setItem('users', JSON.stringify(users));
        }
    } else {
        localStorage.setItem('pshub_wishlist', JSON.stringify(wishlist));
    }
}

function toggleWishlist(id) {
    const normalizedId = String(id || '');
    if (wishlist.includes(normalizedId)) {
        wishlist = wishlist.filter(wId => wId !== normalizedId);
    } else {
        wishlist.push(normalizedId);
    }
    saveDB();
    applyFilters();
}

function resetDatabase() {
    localStorage.clear();
    location.reload();
}

function checkout() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    saveDB();
    window.location.href = '/Checkout';
}

document.addEventListener('DOMContentLoaded', () => {
    const ms = document.getElementById('mainSearch');
    const min = document.getElementById('minPrice');
    const max = document.getElementById('maxPrice');
    if (ms) ms.addEventListener('input', applyFilters);
    if (min) min.addEventListener('input', applyFilters);
    if (max) max.addEventListener('input', applyFilters);
});

function index() {
    window.location.href = '/index';
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