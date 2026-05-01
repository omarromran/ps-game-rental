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

function initCheckout() {
    loadCurrentUser();
    const savedCart = localStorage.getItem('pshub_cart');
    const savedInv = localStorage.getItem('pshub_inventory');

    if (!savedCart || JSON.parse(savedCart).length === 0) {
        alert("Your cart is empty!");
        window.location.href = 'Browse_Games.html';
        return;
    }

    cart = JSON.parse(savedCart);
    inventory = JSON.parse(savedInv);

    renderCheckoutList();
}

function renderCheckoutList() {
    const listDiv = document.getElementById('checkout-list');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('final-total');

    let total = 0;

    listDiv.innerHTML = cart.map(item => {
        total += item.price;
        return `
            <div class="horizontal-item">
                <img src="${item.img}" alt="${item.title}">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-store">${item.storeID.toUpperCase()}</div>
                </div>
                <div class="item-price">${item.price.toFixed(2)} EGP</div>
            </div>
        `;
    }).join('');

    subtotalEl.innerText = total.toFixed(2);
    totalEl.innerText = total.toFixed(2);
}

function processOrder() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }

    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');

    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    const egPhoneRegex = /^01[0125][0-9]{8}$/;

    if (!egPhoneRegex.test(phone)) {
        alert("Please enter a valid Egyptian phone number (11 digits starting with 01).");
        phoneInput.style.borderColor = "#ff4444";
        return;
    }

    if (!address) {
        alert("Please provide a delivery address.");
        addressInput.style.borderColor = "#ff4444";
        return;
    }

    phoneInput.style.borderColor = "#333";
    addressInput.style.borderColor = "#333";

    cart.forEach(cartItem => {
        const itemIdx = inventory.findIndex(invItem => invItem.gameID === cartItem.gameID);
        if (itemIdx !== -1) {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));

            inventory[itemIdx].status = "rented";

inventory[itemIdx].rental = {
    status: "active",
    start: new Date().toLocaleDateString(),
    end: "—",
    owner: inventory[itemIdx].storeID
};

inventory[itemIdx].customerID = currentUser.userID;
inventory[itemIdx].customerPhone = phone;
inventory[itemIdx].customerAddress = address;
        }
    });

    localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
    localStorage.removeItem('pshub_cart');

    
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const userName = currentUser ? (currentUser.name || currentUser.username || 'User') : 'User';
    const successMsg = document.getElementById('success-message');
    if (successMsg) {
        successMsg.textContent = `${userName}, your rental is ready.`;
    }

    const overlay = document.getElementById('success-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    } else {
        alert("Order Confirmed!");
    }

    setTimeout(() => {
        window.location.href = 'Browse_Games.html';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    initCheckout();
});