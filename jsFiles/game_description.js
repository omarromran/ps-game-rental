let cart = JSON.parse(localStorage.getItem('pshub_cart') || '[]');
const gameID = new URLSearchParams(window.location.search).get('id');
let selectedStars = 0;

function loadCurrentUser() {
    const userLink = document.getElementById('user-name-link');
    const loginBtn = document.querySelector('.login-btn');
    if (!userLink) return;
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

async function loadGame() {
    let inventory = JSON.parse(localStorage.getItem('pshub_inventory') || 'null');
    if (!inventory) {
        const res = await fetch('browseGames.json');
        inventory = await res.json();
        localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
    }

    const game = inventory.find(g => g.gameID === gameID);
    const page = document.getElementById('desc-page');

    if (!game) {
        page.innerHTML = `<p style="color:#888">Game not found. <a href="Browse_Games.html" style="color:#00439c">Go back</a></p>`;
        return;
    }

    document.getElementById('hero-bg').style.backgroundImage = `url('${game.img}')`;
    document.title = `PSHUB | ${game.title}`;

    renderCart();

    const inCart = cart.some(c => c.gameID === game.gameID);

    const others = inventory.filter(g => g.title === game.title && g.gameID !== game.gameID);
    const othersHtml = others.length ? `
        <div class="other-stores">
            <h3>Also available from</h3>
            <div class="store-chips">
                <span class="store-chip current">🏪 ${game.storeID} — ${game.price.toFixed(2)} EGP (current)</span>
                ${others.map(o => `<a class="store-chip" href="game_description.html?id=${o.gameID}">🏪 ${o.storeID} — ${o.price.toFixed(2)} EGP</a>`).join('')}
            </div>
        </div>` : '';

    page.innerHTML = `
        <div class="desc-cover">
            <img src="${game.img}" alt="${game.title}">
        </div>
        <div class="desc-info">
            <div class="desc-tags">
                <span class="tag tag-category">${game.category}</span>
                <span class="tag tag-platform">${game.platform}</span>
                <span class="tag tag-pegi">PEGI ${game.pegi || '?'}</span>
            </div>
            <h1 class="desc-title">${game.title}</h1>
            <div class="desc-meta">
                <span>🏢 ${game.developer || 'Unknown'}</span>
                <span>📅 ${game.releaseYear || 'N/A'}</span>
                <span>🆔 ${game.gameID}</span>
                <span class="report-game" onclick="reportGame()" title="Report inappropriate content">🚩 Report</span>
            </div>
            <p class="desc-text">${game.description || 'No description available.'}</p>

            <div class="info-grid">
                <div class="info-item"><span class="info-label">Developer</span><span class="info-val">${game.developer || '—'}</span></div>
                <div class="info-item"><span class="info-label">Release Year</span><span class="info-val">${game.releaseYear || '—'}</span></div>
                <div class="info-item"><span class="info-label">Platform</span><span class="info-val">${game.platform}</span></div>
                <div class="info-item"><span class="info-label">Age Rating</span><span class="info-val">PEGI ${game.pegi || '?'}</span></div>
            </div>

            <div class="desc-price">${game.price.toFixed(2)} EGP</div>

            <div class="btn-row">
                <button class="btn-back" onclick="window.location.href='Browse_Games.html'">← Back to Browse</button>
                <button class="btn-cart ${inCart ? 'in-cart' : ''}" id="cart-btn" onclick="addToCart()">
                    ${inCart ? '✓ In Cart' : '+ Add to Cart'}
                </button>
            </div>

            ${othersHtml}
        </div>`;

    document.getElementById('reviews-section').style.display = 'block';
    document.getElementById('similar-section').style.display = 'block';

    renderReviews();
    renderSimilar(inventory, game);
    initStars();
}

function addToCart() {
    const inventory = JSON.parse(localStorage.getItem('pshub_inventory') || '[]');
    const game = inventory.find(g => g.gameID === gameID);
    if (!game || cart.some(c => c.gameID === gameID)) return;
    cart.push(game);
    localStorage.setItem('pshub_cart', JSON.stringify(cart));
    const btn = document.getElementById('cart-btn');
    btn.textContent = '✓ In Cart';
    btn.classList.add('in-cart');
    renderCart();
}

function initStars() {
    const stars = document.querySelectorAll('#star-row span');
    stars.forEach(s => {
        s.onmouseover = () => highlightStars(+s.dataset.v);
        s.onmouseout = () => highlightStars(selectedStars);
        s.onclick = () => { selectedStars = +s.dataset.v; highlightStars(selectedStars); };
    });
}

function highlightStars(n) {
    document.querySelectorAll('#star-row span').forEach(s => {
        s.classList.toggle('lit', +s.dataset.v <= n);
    });
}

function submitReview() {
    const name = document.getElementById('reviewer-name').value.trim();
    const comment = document.getElementById('review-comment').value.trim();
    if (!name || !comment || !selectedStars) {
        alert('Please fill in your name, a comment, and select a star rating.');
        return;
    }
    const reviews = JSON.parse(localStorage.getItem('reviews_' + gameID) || '[]');
    reviews.unshift({ reviewer: name, comment, rating: selectedStars, date: new Date().toLocaleDateString() });
    localStorage.setItem('reviews_' + gameID, JSON.stringify(reviews));

    document.getElementById('reviewer-name').value = '';
    document.getElementById('review-comment').value = '';
    selectedStars = 0;
    highlightStars(0);
    renderReviews();
}

function renderReviews() {
    const reviews = JSON.parse(localStorage.getItem('reviews_' + gameID) || '[]');
    const list = document.getElementById('reviews-list');
    if (!reviews.length) {
        list.innerHTML = '<p class="no-reviews">No reviews yet — be the first!</p>';
        return;
    }
    list.innerHTML = reviews.map((r, i) => `
        <div class="review-card">
            <div class="review-top">
                <span class="reviewer-name">${r.reviewer}</span>
                <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <button class="btn-report-review ${r.flagged ? 'flagged' : ''}" onclick="reportReview(${i})" title="Report this review">
                    ${r.flagged ? 'Flagged' : '🚩'}
                </button>
            </div>
            <p class="review-comment">${r.comment}</p>
            ${r.date ? `<p style="font-size:0.75rem;color:#444;margin-top:6px">${r.date}</p>` : ''}
        </div>`).join('');
}

function renderSimilar(inventory, current) {
    const similar = inventory
        .filter(g => g.category === current.category && g.gameID !== current.gameID)
        .slice(0, 6);
    const grid = document.getElementById('similar-grid');
    if (!similar.length) {
        document.getElementById('similar-section').style.display = 'none';
        return;
    }
    grid.innerHTML = similar.map(g => `
        <div class="similar-card" onclick="window.location.href='game_description.html?id=${g.gameID}'">
            <img src="${g.img}" alt="${g.title}">
            <div class="similar-label">
                <div>${g.title}</div>
                <div class="similar-price">${g.price.toFixed(2)} EGP</div>
            </div>
        </div>`).join('');
}

function reportGame() {
    if (!confirm('Report this game as inappropriate?')) return;
    const inventory = JSON.parse(localStorage.getItem('pshub_inventory') || '[]');
    const idx = inventory.findIndex(g => g.gameID === gameID);
    if (idx > -1) {
        inventory[idx].flagged = true;
        localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
        alert('Game reported to admin.');
    }
}

function reportReview(idx) {
    if (!confirm('Report this review?')) return;
    const reviews = JSON.parse(localStorage.getItem('reviews_' + gameID) || '[]');
    if (reviews[idx]) {
        reviews[idx].flagged = true;
        localStorage.setItem('reviews_' + gameID, JSON.stringify(reviews));
        renderReviews();
        alert('Review reported.');
    }
}

loadCurrentUser();
loadGame();

function index() {
    window.location.href = 'index.html';
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
                    <div style="flex:1; font-size:0.85rem; color:white; margin-left:10px;">${item.title}<br>${item.price} EGP</div>
                    <button onclick="removeFromCart('${item.gameID}')" style="background:none; border:none; cursor:pointer; color:white;">🗑️</button>
                </div>
            `;
        }).join('');
    }
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.gameID !== id);
    localStorage.setItem('pshub_cart', JSON.stringify(cart));
    renderCart();

    if (id === gameID) {
        const btn = document.getElementById('cart-btn');
        if (btn) {
            btn.textContent = '+ Add to Cart';
            btn.classList.remove('in-cart');
        }
    }
}

function checkout() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    localStorage.setItem('pshub_cart', JSON.stringify(cart));
    window.location.href = 'Checkout.html';
}

function toggleCart(open) {
    const sidebar = document.getElementById('cart-sidebar');
    if (!sidebar) return;

    if (open === true) sidebar.classList.add('open');
    else if (open === false) sidebar.classList.remove('open');
    else sidebar.classList.toggle('open');
}