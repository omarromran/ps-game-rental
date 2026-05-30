let cart = [];
let inventory = [];

function loadCurrentUser() {
    const userLink = document.querySelector('.user-name');
    if (!userLink) return;
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        const user = JSON.parse(stored);
        userLink.textContent = user.name || user.username || 'My Account';
    } else {
        userLink.textContent = 'Guest';
    }
}

async function loadInventory() {
    const savedInv = localStorage.getItem('pshub_inventory');
    if (savedInv) {
        try {
            inventory = JSON.parse(savedInv) || [];
        } catch {
            inventory = [];
        }
    }

    if (!inventory.length) {
        try {
            const response = await fetch('/api/games');
            if (response.ok) {
                const data = await response.json();
                inventory = Array.isArray(data) ? data : (data.games || []);
                localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
            }
        } catch (error) {
            console.error('Failed to load inventory from backend:', error);
            inventory = [];
        }
    }
}

function normalizeCartItems() {
    cart = cart.map(item => {
        const id = String(item.gameID || item._id || item.id || '');
        const match = inventory.find(g => String(g._id || g.gameID || g.id || '') === id);
        return {
            _id: id,
            gameID: id,
            title: item.title || (match && (match.title || 'Unknown Game')) || 'Unknown Game',
            img: item.img || (match && (match.img || (match.images && match.images[0]))) || '/photos/placeholder.png',
            pricePerDay: Number(item.pricePerDay || item.price || (match && (match.pricePerDay || match.price)) || 0),
            storeID: item.storeID || (match && (match.storeID || '')) || '',
            status: item.status || (match && match.status) || 'Available'
        };
    });
}

async function initCheckout() {
    loadCurrentUser();
    const savedCart = localStorage.getItem('pshub_cart');

    if (!savedCart) {
        alert('Your cart is empty!');
        window.location.href = '/Browse_Games';
        return;
    }

    try {
        cart = JSON.parse(savedCart) || [];
    } catch {
        cart = [];
    }

    if (!cart.length) {
        alert('Your cart is empty!');
        window.location.href = '/Browse_Games';
        return;
    }

    await loadInventory();
    normalizeCartItems();
    renderCheckoutList();
}

function renderCheckoutList() {
    const listDiv = document.getElementById('checkout-list');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('final-total');
    const days = Number(document.getElementById('days')?.value || 3);

    if (!listDiv || !subtotalEl || !totalEl) return;

    let total = 0;

    if (cart.length === 0) {
        listDiv.innerHTML = '<p class="empty-cart">Your cart is empty. Add games in the store first.</p>';
    } else {
        listDiv.innerHTML = cart.map(item => {
            const itemTotal = item.pricePerDay * days;
            total += itemTotal;
            return `
                <div class="horizontal-item">
                    <img src="${item.img}" alt="${item.title}">
                    <div class="item-info">
                        <div class="item-title">${item.title}</div>
                        <div class="item-store">${(item.storeID || 'Store').toUpperCase()}</div>
                        <div class="item-duration">${days} day${days === 1 ? '' : 's'} rental</div>
                    </div>
                    <div class="item-price">${itemTotal.toFixed(2)} EGP</div>
                </div>
            `;
        }).join('');
    }

    subtotalEl.innerText = total.toFixed(2);
    totalEl.innerText = total.toFixed(2);
}

function syncCartData() {
    const savedCart = localStorage.getItem('pshub_cart');
    if (!savedCart) {
        cart = [];
        renderCheckoutList();
        return;
    }

    try {
        cart = JSON.parse(savedCart) || [];
    } catch {
        cart = [];
    }
    normalizeCartItems();
    renderCheckoutList();
}

async function processOrder() {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        window.location.href = '/login';
        return;
    }

    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    const daysInput = document.getElementById('days');

    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const days = Number(daysInput.value || 3);
    const egPhoneRegex = /^01[0125][0-9]{8}$/;

    if (!egPhoneRegex.test(phone)) {
        alert('Please enter a valid Egyptian phone number (11 digits starting with 01).');
        phoneInput.style.borderColor = '#ff4444';
        return;
    }

    if (!address) {
        alert('Please provide a delivery address.');
        addressInput.style.borderColor = '#ff4444';
        return;
    }

    if (!days || isNaN(days) || days < 1 || days > 30) {
        alert('Please choose a rental duration between 1 and 30 days.');
        daysInput.style.borderColor = '#ff4444';
        return;
    }

    if (!cart.length) {
        alert('Your cart is empty. Add games before checking out.');
        window.location.href = '/Browse_Games';
        return;
    }

    phoneInput.style.borderColor = '#333';
    addressInput.style.borderColor = '#333';
    daysInput.style.borderColor = '#333';

    const items = cart.map(item => ({
        gameId: item._id || item.gameID || item.id,
        days
    }));

    try {
        const response = await fetch('/api/rentals/checkout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items, phone, address })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error || data.message || 'Checkout failed.');
            return;
        }

        localStorage.removeItem('pshub_cart');
        await loadInventory();
        localStorage.setItem('pshub_inventory', JSON.stringify(inventory));

        const currentUser = JSON.parse(storedUser);
        const userName = currentUser ? (currentUser.name || currentUser.username || 'User') : 'User';
        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            successMsg.textContent = `${userName}, your rental is confirmed!`;
        }

        const overlay = document.getElementById('success-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        setTimeout(() => {
            window.location.href = '/Browse_Games';
        }, 2000);
    } catch (err) {
        console.error('Checkout fetch failed', err);
        alert('Checkout failed. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    const daysInput = document.getElementById('days');
    if (daysInput) {
        daysInput.addEventListener('input', () => renderCheckoutList());
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'currentUser') {
            loadCurrentUser();
        }
        if (event.key === 'pshub_cart' || event.key === 'pshub_inventory') {
            syncCartData();
        }
    });

    initCheckout();
});