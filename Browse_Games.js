let inventory = [];
let cart = [];
let activeStoreFilter = null;

// 1. LOAD DATABASE
async function loadDB() {
    let storedGames = localStorage.getItem('games_db');
    // Load existing cart if available
    let storedCart = localStorage.getItem('pshub_cart');
    if (storedCart) cart = JSON.parse(storedCart);
    
    if (!storedGames || JSON.parse(storedGames).length === 0) {
        try {
            const response = await fetch('games.json');
            const data = await response.json();
            
            inventory = data; 
            localStorage.setItem('games_db', JSON.stringify(inventory));
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    } else {
        inventory = JSON.parse(storedGames);
    }
    // Force a filter run to show the games immediately
    applyFilters(); 
}

// Make sure this runs when the page opens!
window.onload = loadDB;

// 2. CORE FILTER LOGIC
function applyFilters() {
    const search = document.getElementById('mainSearch').value.toLowerCase();
    const minP = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxP = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    
    // Platform Checkboxes
    const platforms = Array.from(document.querySelectorAll('#platform-filters input:checked')).map(i => i.value);
    
    // Genre Checkboxes (The new part)
    const categories = Array.from(document.querySelectorAll('#category-filters input:checked')).map(i => i.value);

    const filtered = inventory.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(search) || g.gameID.toLowerCase().includes(search);
        const matchesPlatform = platforms.length === 0 || platforms.includes(g.platform);
        
        // Match category (if none selected, show all)
        const matchesCategory = categories.length === 0 || categories.includes(g.category);
        
        const matchesPrice = g.price >= minP && g.price <= maxP;
        const matchesStore = !activeStoreFilter || g.storeID === activeStoreFilter;
        const isAvailable = g.status === 'available';

        return matchesSearch && matchesPlatform && matchesCategory && matchesPrice && matchesStore && isAvailable;
    });
    
    const itemCount = document.getElementById('item-count');
    if (itemCount) itemCount.innerText = `${filtered.length} games found`;

    renderInventory(filtered);
    renderCart(); // Keep your cart display updated
}

// ... Keep your renderInventory, addToCart, removeFromCart, renderCart, toggleCart, saveDB, resetDatabase, and checkout functions below ...

function renderInventory(data) {
    const gallery = document.getElementById('game-grid');
    if (!gallery) return;
    
    gallery.innerHTML = ''; 

    if (data.length === 0) {
        gallery.innerHTML = `<div style="color:white; grid-column: 1/-1; text-align:center; padding: 50px;">No games available.</div>`;
        return;
    }

    data.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        // 1. Check if the game is already in the cart
        const isInCart = cart.some(item => item.gameID === game.gameID);

        // 2. Set the text and class based on the result
        const buttonText = isInCart ? "In Cart" : "Add to Cart";
        const buttonClass = isInCart ? "add-btn in-cart" : "add-btn";

        card.innerHTML = `
            <img src="${game.img}" alt="${game.title}">
            <div class="game-info"> 
                <h3>${game.title}</h3>
                <p style="font-size: 0.8rem; color: #888; margin: 0;">${game.platform}</p>
                <div class="price" style="font-weight: bold; margin: 5px 0;">$${game.price}</div>
                <button class="${buttonClass}" onclick="addToCart('${game.gameID}')">
                    ${buttonText}
                </button>
            </div>
        `;
        gallery.appendChild(card);
    });
}
// 4. CART LOGIC
function addToCart(id) {
    const item = inventory.find(g => g.gameID === id);
    if (item && !cart.some(c => c.gameID === id)) {
        cart.push(item);
        saveDB();
        applyFilters(); 
    }
}

function removeFromCart(id) {
    cart = cart.filter(c => c.gameID !== id);
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
            total += item.price;
            return `
                <div class="cart-item">
                    <img src="${item.img}" style="width:40px; height:60px; object-fit:cover; border-radius:4px;">
                    <div style="flex:1; font-size:0.85rem; color:white; margin-left:10px;">${item.title}<br>$${item.price}</div>
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

// 5. UTILITIES
function saveDB() {
    localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
    localStorage.setItem('pshub_cart', JSON.stringify(cart));
}

function resetDatabase() {
    localStorage.clear();
    location.reload();
}

function checkout() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    saveDB(); 
    window.location.href = 'Checkout.html';
}

// 6. EVENT LISTENERS
document.getElementById('mainSearch').addEventListener('input', applyFilters);
document.getElementById('minPrice').addEventListener('input', applyFilters);
document.getElementById('maxPrice').addEventListener('input', applyFilters);

// Initial start
loadDB();