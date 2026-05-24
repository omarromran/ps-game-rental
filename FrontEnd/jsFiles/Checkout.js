let cart = [];

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

function initCheckout() {
    loadCurrentUser();
    const savedCart = localStorage.getItem('pshub_cart');

    if (!savedCart || JSON.parse(savedCart).length === 0) {
        alert("Your cart is empty!");
        window.location.href = 'Browse_Games.html';
        return;
    }

    cart = JSON.parse(savedCart);
    renderCheckoutList();
}

function renderCheckoutList() {
    const listDiv = document.getElementById('checkout-list');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('final-total');

    let total = 0;

    listDiv.innerHTML = cart.map(item => {
        total += item.pricePerDay;
        return `
            <div class="horizontal-item">
                <img src="${item.img}" alt="${item.title}">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-store">${item.storeID ? item.storeID.toUpperCase() : ''}</div>
                    <div class="item-days">
                        <label style="color:#aaa; font-size:0.85rem;">Rental days:</label>
                        <input 
                            type="number" 
                            id="days-${item._id}" 
                            value="1" 
                            min="1" 
                            max="30" 
                            style="width:60px; margin-left:8px; padding:4px; border-radius:4px; border:1px solid #444; background:#1a1a2e; color:white;"
                            onchange="updateTotal()"
                        >
                    </div>
                </div>
                <div class="item-price" id="price-${item._id}">${item.pricePerDay.toFixed(2)} EGP/day</div>
            </div>
        `;
    }).join('');

    subtotalEl.innerText = total.toFixed(2);
    totalEl.innerText = total.toFixed(2);
}

function updateTotal() {
    let total = 0;
    cart.forEach(item => {
        const daysInput = document.getElementById(`days-${item._id}`);
        const days = parseInt(daysInput ? daysInput.value : 1) || 1;
        total += item.pricePerDay * days;
    });
    document.getElementById('subtotal').innerText = total.toFixed(2);
    document.getElementById('final-total').innerText = total.toFixed(2);
}

function showError(message) {
    let errorEl = document.getElementById('checkout-error');
    if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.id = 'checkout-error';
        errorEl.style.color = 'red';
        errorEl.style.fontSize = '0.85rem';
        errorEl.style.marginBottom = '10px';
        const confirmBtn = document.querySelector('.confirm-btn');
        confirmBtn.parentNode.insertBefore(errorEl, confirmBtn);
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    const errorEl = document.getElementById('checkout-error');
    if (errorEl) errorEl.style.display = 'none';
}

async function processOrder() {
    hideError();

    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }

    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');

    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    // Frontend validation
    const egPhoneRegex = /^01[0125][0-9]{8}$/;

    if (!phone) {
        showError("Phone number is required.");
        phoneInput.style.borderColor = "#ff4444";
        return;
    }

    if (!egPhoneRegex.test(phone)) {
        showError("Please enter a valid Egyptian phone number (e.g. 01xxxxxxxxx).");
        phoneInput.style.borderColor = "#ff4444";
        return;
    }

    if (!address) {
        showError("Delivery address is required.");
        addressInput.style.borderColor = "#ff4444";
        return;
    }

    if (address.length < 10) {
        showError("Please enter a complete delivery address.");
        addressInput.style.borderColor = "#ff4444";
        return;
    }

    phoneInput.style.borderColor = "#333";
    addressInput.style.borderColor = "#333";

    const token = localStorage.getItem('token');

    // Process each cart item as a rental
    try {
        for (const item of cart) {
            const daysInput = document.getElementById(`days-${item._id}`);
            const days = parseInt(daysInput ? daysInput.value : 1) || 1;

            if (days < 1 || days > 30) {
                showError(`Rental days must be between 1 and 30 for "${item.title}".`);
                return;
            }

            const response = await fetch("http://localhost:8080/api/rentals/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    gameId: item._id,
                    days,
                    phone,
                    address
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.error || `Failed to rent "${item.title}".`);
                return;
            }
        }

        // All rentals successful
        localStorage.removeItem('pshub_cart');

        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const userName = currentUser ? (currentUser.username || 'User') : 'User';
        const successMsg = document.getElementById('success-message');
        if (successMsg) {
            successMsg.textContent = `${userName}, your rental is confirmed!`;
        }

        const overlay = document.getElementById('success-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        setTimeout(() => {
            window.location.href = 'Browse_Games.html';
        }, 3000);

    } catch (error) {
        console.error("Checkout error:", error);
        showError("Error connecting to server. Make sure the backend is running.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    initCheckout();
});