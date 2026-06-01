let inventory = [];
let cart = [];
let wishlist = [];
let activeStoreFilter = null;

// ==========================================
// 🔑 AUTH HELPERS
// ==========================================
const getToken = () => localStorage.getItem('token');

const authHeaders = () => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ==========================================
// 👤 CURRENT USER
// ==========================================
function getDashboardRoute(user) {
  if (!user || !user.role) return '/gamerDashboard';
  if (user.role === 'Admin') return '/adminDashboard';
  if (user.role === 'Store') return '/storedashboard';
  return '/gamerDashboard';
}

function loadCurrentUser() {
  const userLink = document.getElementById('user-name-link');
  const loginBtn = document.querySelector('.login-btn');
  if (!userLink) return;

  // Don't override if server already rendered a real username
  const currentText = userLink.textContent.trim();
  if (currentText && currentText !== 'Guest') {
    if (loginBtn) loginBtn.style.display = 'none';
    return;
  }

  const stored = localStorage.getItem('currentUser');
  if (stored) {
    const user = JSON.parse(stored);
    userLink.textContent = user.name || user.username || 'My Account';
    userLink.href = getDashboardRoute(user);
    if (loginBtn) loginBtn.style.display = 'none';
  } else {
    userLink.textContent = 'Guest';
    userLink.removeAttribute('href');
    if (loginBtn) loginBtn.style.display = 'inline';
  }
}

// ==========================================
// 📦 LOAD DATA
// ==========================================
async function loadDB() {
  // Load cart
  try {
    cart = JSON.parse(localStorage.getItem('pshub_cart') || '[]');
  } catch {
    cart = [];
  }

  // Load wishlist — from backend if logged in
  const token = getToken();
  if (token) {
    try {
      const res = await fetch('/api/wishlist', { headers: authHeaders() });
      if (res.ok) {
       const wishlistGames = await res.json();
       wishlist = [];
       wishlistGames.forEach(g => {
    if (g._id) wishlist.push(String(g._id));
    if (g.gameID) wishlist.push(String(g.gameID));
});
wishlist = [...new Set(wishlist)].filter(Boolean);
      }
    } catch (e) {
      wishlist = JSON.parse(localStorage.getItem('pshub_wishlist') || '[]');
    }
  } else {
    try {
      wishlist = JSON.parse(localStorage.getItem('pshub_wishlist') || '[]');
    } catch {
      wishlist = [];
    }
  }

  // Load games from backend
  try {
    const response = await fetch('/api/games?status=Available');
    const data = await response.json();
    inventory = Array.isArray(data) ? data : (data.games || []);
  } catch (error) {
    console.error('Error loading games:', error);
    inventory = [];
  }

  // Normalize
  inventory = inventory.map(g => ({
    ...g,
    gameID: String(g.gameID || g._id || g.id || ''),
    title: g.title || 'Unknown Game',
    img: g.img || g.image || (g.images && g.images.length > 0 ? g.images[0] : '/photos/placeholder.png'),
    pricePerDay: parseFloat(g.pricePerDay || g.price || 0),
    status: (g.status || 'available').toLowerCase(),
    platform: g.platform || 'PS5',
    category: g.category || 'Unknown'
  }));

  applyFilters();
}

window.onload = function () {
  loadCurrentUser();
  loadDB();
};

window.addEventListener('storage', (event) => {
  if (event.key === 'currentUser' || event.key === 'token') loadCurrentUser();
  if (event.key === 'pshub_cart') {
    try { cart = JSON.parse(localStorage.getItem('pshub_cart') || '[]'); } catch { cart = []; }
    applyFilters();
  }
});

// ==========================================
// 🔍 FILTERS
// ==========================================
function applyFilters() {
  const searchEl = document.getElementById('mainSearch');
  const minEl = document.getElementById('minPrice');
  const maxEl = document.getElementById('maxPrice');

  const search = searchEl?.value ? String(searchEl.value).toLowerCase() : '';
  const minP = minEl ? (parseFloat(minEl.value) || 0) : 0;
  const maxP = maxEl ? (parseFloat(maxEl.value) || Infinity) : Infinity;

  const platforms = Array.from(document.querySelectorAll('#platform-filters input:checked')).map(i => i.value);
  const categories = Array.from(document.querySelectorAll('#category-filters input:checked')).map(i => i.value);

  const filtered = inventory.filter(g => {
    const matchesSearch = !search || g.title.toLowerCase().includes(search) || g.gameID.toLowerCase().includes(search);
    const gamePlatforms = String(g.platform || '').split('&').map(p => p.trim()).filter(Boolean);
    const matchesPlatform = platforms.length === 0 || platforms.some(p => gamePlatforms.includes(p));
    const matchesCategory = categories.length === 0 || categories.includes(g.category);
    const matchesPrice = g.pricePerDay >= minP && g.pricePerDay <= maxP;
    const matchesStore = !activeStoreFilter || g.storeID === activeStoreFilter;
    const isAvailable = g.status === 'available' || g.status === '';
    return matchesSearch && matchesPlatform && matchesCategory && matchesPrice && matchesStore && isAvailable;
  });

  const itemCount = document.getElementById('item-count');
  if (itemCount) itemCount.innerText = `${filtered.length} games found`;

  renderInventory(filtered);
  renderCart();
}

// ==========================================
// 🎮 RENDER GAMES
// ==========================================
function renderInventory(data) {
  const gallery = document.getElementById('game-grid');
  if (!gallery) return;

  gallery.innerHTML = '';

  if (!data.length) {
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
    const isInWishlist = wishlist.includes(gid);

    card.innerHTML = `
      <img src="${game.img}" alt="${game.title}" style="width: 100%; height: auto; object-fit: cover;">
      <div class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${gid}')">${isInWishlist ? '❤️' : '🤍'}</div>
      <div class="game-info">
        <h3>${game.title}</h3>
        <p style="font-size: 0.8rem; color: #888; margin: 0;">${game.platform}</p>
        <p style="font-size: 0.75rem; color: #666; margin: 3px 0;">${game.category || ''}</p>
        <div class="price" style="font-weight: bold; margin: 5px 0;">${game.pricePerDay || 0} EGP/day</div>
        <button class="add-btn ${isInCart ? 'in-cart' : ''}" onclick="event.stopPropagation(); addToCart('${gid}')">
          ${isInCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>
    `;
    gallery.appendChild(card);
  });
}

// ==========================================
// 🛒 CART
// ==========================================
function addToCart(id) {
  const item = inventory.find(g => String(g.gameID || g._id || g.id || '') === String(id));
  if (item && !cart.some(c => String(c.gameID || c._id || c.id || '') === String(id))) {
    cart.push(item);
    localStorage.setItem('pshub_cart', JSON.stringify(cart));
    applyFilters();
  }
}

function removeFromCart(id) {
  cart = cart.filter(c => String(c.gameID || c._id || c.id || '') !== String(id));
  localStorage.setItem('pshub_cart', JSON.stringify(cart));
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

function checkout() {
  if (!cart.length) { alert('Your cart is empty!'); return; }
  localStorage.setItem('pshub_cart', JSON.stringify(cart));
  window.location.href = '/Checkout';
}

// ==========================================
// ❤️ WISHLIST
// ==========================================
async function toggleWishlist(id) {
  const token = getToken();
  if (!token) {
    alert('Please login to use the wishlist!');
    window.location.href = '/login';
    return;
  }

  const normalizedId = String(id || '');
  try {
    if (wishlist.includes(normalizedId)) {
      await fetch(`/api/wishlist/${normalizedId}`, { method: 'DELETE', headers: authHeaders() });
      wishlist = wishlist.filter(wId => wId !== normalizedId);
    } else {
      await fetch(`/api/wishlist/${normalizedId}`, { method: 'POST', headers: authHeaders() });
      wishlist.push(normalizedId);
    }
    localStorage.setItem('pshub_wishlist', JSON.stringify(wishlist));
    applyFilters();
  } catch (err) {
    console.error('Wishlist error:', err);
  }
}

// ==========================================
// 🚪 LOGOUT
// ==========================================
document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() });
  } catch (err) { /* stateless — ignore */ }
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  window.location.href = '/login';
});

// ==========================================
// 🔍 SEARCH/FILTER EVENTS
// ==========================================
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