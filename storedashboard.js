// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // In a real app, we would fetch this from LocalStorage or an API
    const stats = {
        totalGames: 12,
        activeRentals: 4,
        totalEarnings: 240.50,
        pendingRequests: 3
    };

    // Update UI
    document.getElementById('totalGames').textContent = stats.totalGames;
    document.getElementById('activeRentals').textContent = stats.activeRentals;
    document.getElementById('totalEarnings').textContent = `$${stats.totalEarnings.toFixed(2)}`;
    document.getElementById('pendingCount').textContent = stats.pendingRequests;

    console.log("Dashboard stats initialized.");
});
// navigation.js
document.getElementById('logoutBtn').addEventListener('click', () => {
    if(confirm("Are you sure you want to logout?")) {
        window.location.href = 'login.html'; // Redirects to login (once created)
    }
});