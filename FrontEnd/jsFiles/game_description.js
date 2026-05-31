// game_description.js — token-only auth

let cart = JSON.parse(localStorage.getItem('pshub_cart') || '[]');
let currentGame = null;
let selectedStars = 0;

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('id');

// ==========================================
// 🔑 AUTH HELPERS
// ==========================================
const getToken = () => localStorage.getItem('token');

// ==========================================
// 🎮 GAME KEY HELPERS
// ==========================================
function getGameKey(game) {
  if (!game) return '';
  return String(game._id || game.gameID || game.id || '');
}

function getCurrentGameKey() {
  return getGameKey(currentGame) || String(gameId || '');
}

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

function syncCartFromStorage() {
  try {
    cart = JSON.parse(localStorage.getItem('pshub_cart') || '[]');
  } catch {
    cart = [];
  }
  renderCart();

  if (currentGame) {
    const inCart = cart.some(c => getGameKey(c) === getCurrentGameKey());
    const btn = document.getElementById('cart-btn');
    if (btn) {
      btn.textContent = inCart ? '✓ In Cart' : '+ Add to Cart';
      btn.classList.toggle('in-cart', inCart);
    }
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === 'currentUser' || event.key === 'token') loadCurrentUser();
  if (event.key === 'pshub_cart') syncCartFromStorage();
});

// ==========================================
// 📦 LOAD GAME
// ==========================================
async function loadGame() {
  const page = document.getElementById('desc-page');
  if (!gameId) {
    if (page) page.innerHTML = `<p style="color:#888">No game selected. <a href="/Browse_Games" style="color:#00439c">Go back</a></p>`;
    return;
  }

  try {
    const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
    if (!response.ok) throw new Error(`Game not found (${response.status})`);

    currentGame = await response.json();
    if (!currentGame) throw new Error('No game data returned');

    renderGamePage();
    renderCart();
  } catch (error) {
    console.error('Error loading game:', error);
    if (page) page.innerHTML = `<p style="color:#888">Game not found. <a href="/Browse_Games" style="color:#00439c">Go back</a></p>`;
  }
}

// ==========================================
// 🖥️ RENDER GAME PAGE
// ==========================================
function renderGamePage() {
  if (!currentGame) return;

  const page = document.getElementById('desc-page');
  if (!page) return;

  const displayImg = currentGame.img || (currentGame.images && currentGame.images[0]) || '/photos/placeholder.png';
  const pricePerDay = Number(currentGame.pricePerDay || currentGame.price || 0);
  const title = currentGame.title || 'Unknown Game';

  const heroBg = document.getElementById('hero-bg');
  if (heroBg) heroBg.style.backgroundImage = `url('${displayImg}')`;
  document.title = `PSHUB | ${title}`;

  const gameKey = getCurrentGameKey();
  const inCart = cart.some(c => getGameKey(c) === gameKey);

  page.innerHTML = `
    <div class="desc-cover">
      <img src="${displayImg}" alt="${title}">
    </div>
    <div class="desc-info">
      <div class="desc-tags">
        <span class="tag tag-category">${currentGame.category || 'Unknown'}</span>
        <span class="tag tag-platform">${currentGame.platform || 'N/A'}</span>
        <span class="tag tag-pegi">PEGI ${currentGame.pegi || '?'}</span>
      </div>
      <h1 class="desc-title">${title}</h1>
      <div class="desc-meta">
        <span>🏢 ${currentGame.developer || 'Unknown Developer'}</span>
        <span>📅 ${currentGame.releaseYear || 'N/A'}</span>
        <span>🆔 ${currentGame._id || currentGame.gameID}</span>
        <span class="report-game" onclick="reportGame()" title="Report inappropriate content">🚩 Report</span>
      </div>
      <p class="desc-text">${currentGame.description || 'No description available.'}</p>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Developer</span><span class="info-val">${currentGame.developer || '—'}</span></div>
        <div class="info-item"><span class="info-label">Release Year</span><span class="info-val">${currentGame.releaseYear || '—'}</span></div>
        <div class="info-item"><span class="info-label">Platform</span><span class="info-val">${currentGame.platform || '—'}</span></div>
        <div class="info-item"><span class="info-label">Age Rating</span><span class="info-val">PEGI ${currentGame.pegi || '?'}</span></div>
      </div>
      <div class="desc-price">${pricePerDay.toFixed(2)} EGP / day</div>
      <div class="btn-row">
        <button class="btn-back" onclick="window.location.href='/Browse_Games'">← Back to Browse</button>
        <button class="btn-cart ${inCart ? 'in-cart' : ''}" id="cart-btn" onclick="addToCart()">
          ${inCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  `;

  const reviewsSection = document.getElementById('reviews-section');
  if (reviewsSection) reviewsSection.style.display = 'block';
  renderReviews();
  initStars();
}

// ==========================================
// 🛒 CART
// ==========================================
function addToCart() {
  if (!currentGame) return;
  const gameKey = getCurrentGameKey();
  if (cart.some(c => getGameKey(c) === gameKey)) {
    alert('This game is already in your cart!');
    return;
  }
  cart.push(currentGame);
  localStorage.setItem('pshub_cart', JSON.stringify(cart));

  const btn = document.getElementById('cart-btn');
  if (btn) { btn.textContent = '✓ In Cart'; btn.classList.add('in-cart'); }

  renderCart();
  alert('Game added to cart!');
}

function removeFromCart(id) {
  cart = cart.filter(item => getGameKey(item) !== String(id));
  localStorage.setItem('pshub_cart', JSON.stringify(cart));
  renderCart();

  const btn = document.getElementById('cart-btn');
  if (btn && currentGame && String(id) === getCurrentGameKey()) {
    btn.textContent = '+ Add to Cart';
    btn.classList.remove('in-cart');
  }
}

function renderCart() {
  const cartList = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');

  if (cartCount) cartCount.innerText = cart.length;

  let total = 0;
  if (cartList) {
    cartList.innerHTML = cart.map(item => {
      const price = Number(item.pricePerDay || item.price || 0);
      total += price;
      const itemImg = item.img || (item.images && item.images[0]) || '/photos/placeholder.png';
      return `
        <div class="cart-item">
          <img src="${itemImg}" alt="${item.title}" />
          <div class="cart-item-details">${item.title}<br>${price.toFixed(2)} EGP</div>
          <button onclick="removeFromCart('${item._id || item.gameID || item.id}')" class="cart-remove">🗑️</button>
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
// ⭐ REVIEWS (localStorage-based)
// ==========================================
function initStars() {
  document.querySelectorAll('#star-row span').forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(+star.dataset.v));
    star.addEventListener('mouseout', () => highlightStars(selectedStars));
    star.addEventListener('click', () => { selectedStars = +star.dataset.v; highlightStars(selectedStars); });
  });
}

function highlightStars(value) {
  document.querySelectorAll('#star-row span').forEach(star => {
    star.classList.toggle('lit', +star.dataset.v <= value);
  });
}

function submitReview() {
  const nameInput = document.getElementById('reviewer-name');
  const commentInput = document.getElementById('review-comment');
  if (!nameInput || !commentInput) return;

  const name = nameInput.value.trim();
  const comment = commentInput.value.trim();
  if (!name || !comment || !selectedStars) {
    alert('Please fill in your name, a comment, and select a star rating.');
    return;
  }

  const reviewKey = `reviews_${currentGame._id || gameId}`;
  const reviews = JSON.parse(localStorage.getItem(reviewKey) || '[]');
  reviews.unshift({ reviewer: name, comment, rating: selectedStars, date: new Date().toLocaleDateString() });
  localStorage.setItem(reviewKey, JSON.stringify(reviews));

  nameInput.value = '';
  commentInput.value = '';
  selectedStars = 0;
  highlightStars(0);
  renderReviews();
  alert('Review posted successfully!');
}

function renderReviews() {
  const reviewKey = `reviews_${currentGame._id || gameId}`;
  const reviews = JSON.parse(localStorage.getItem(reviewKey) || '[]');
  const list = document.getElementById('reviews-list');
  if (!list) return;

  if (!reviews.length) {
    list.innerHTML = '<p class="no-reviews">No reviews yet — be the first!</p>';
    return;
  }

  list.innerHTML = reviews.map((review, index) => `
    <div class="review-card">
      <div class="review-top">
        <span class="reviewer-name">${review.reviewer}</span>
        <span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
        <button class="btn-report-review ${review.flagged ? 'flagged' : ''}" onclick="reportReview(${index})" title="Report this review">
          ${review.flagged ? 'Flagged' : '🚩'}
        </button>
      </div>
      <p class="review-comment">${review.comment}</p>
      ${review.date ? `<p class="review-date">${review.date}</p>` : ''}
    </div>
  `).join('');
}

function reportGame() {
  if (!confirm('Report this game as inappropriate?')) return;
  localStorage.setItem(`reported_games_${currentGame._id || gameId}`, 'true');
  alert('Game reported to admin.');
}

function reportReview(index) {
  if (!confirm('Report this review?')) return;
  const reviewKey = `reviews_${currentGame._id || gameId}`;
  const reviews = JSON.parse(localStorage.getItem(reviewKey) || '[]');
  if (!reviews[index]) return;
  reviews[index].flagged = true;
  localStorage.setItem(reviewKey, JSON.stringify(reviews));
  renderReviews();
  alert('Review reported.');
}

function index() {
  window.location.href = '/index';
}

// ==========================================
// 🚀 INIT
// ==========================================
loadCurrentUser();
loadGame();