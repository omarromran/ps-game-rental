let cart = [];
let inventory = [];

function initCheckout() {
    // 1. Get Data from LocalStorage
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
                <div class="item-price">$${item.price.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    subtotalEl.innerText = total.toFixed(2);
    totalEl.innerText = total.toFixed(2);
}

function processOrder() {
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    // 1. Egyptian Phone Validation
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

    // Reset border colors if validation passes
    phoneInput.style.borderColor = "#333";
    addressInput.style.borderColor = "#333";

    // 2. THE MISSING PIECE: Update the inventory status
    // We loop through the cart and find those games in the main inventory
    cart.forEach(cartItem => {
        const itemIdx = inventory.findIndex(invItem => invItem.gameID === cartItem.gameID);
        if (itemIdx !== -1) {
            // Set status to 'rented' so the filter in Browse_Games.js hides it
            inventory[itemIdx].status = 'rented';
            inventory[itemIdx].customerID = "Alex Walker"; 
            inventory[itemIdx].customerPhone = phone;
            inventory[itemIdx].customerAddress = address;
        }
    });

    // 3. Save the updated inventory and clear the cart
    localStorage.setItem('pshub_inventory', JSON.stringify(inventory));
    localStorage.removeItem('pshub_cart');

    // 4. Trigger the Success Animation Overlay
    const overlay = document.getElementById('success-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    } else {
        // Fallback if overlay isn't in HTML yet
        alert("Order Confirmed!");
    }

    // 5. Redirect after 3 seconds
    setTimeout(() => {
        window.location.href = 'Browse_Games.html';
    }, 3000);
}

// Automatically remove any non-numeric characters as the user types
document.getElementById('phone').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); // Removes anything that isn't a number
});

// Start the page logic
document.addEventListener('DOMContentLoaded', initCheckout);