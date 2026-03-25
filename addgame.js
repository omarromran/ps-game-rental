// add-game.js
document.getElementById('addGameForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get values from form
    const newGame = {
        id: Date.now(), // Unique ID based on timestamp
        title: document.getElementById('gameTitle').value,
        platform: document.getElementById('platform').value,
        genre: document.getElementById('genre').value,
        price: document.getElementById('dailyPrice').value,
        description: document.getElementById('description').value,
        status: 'Available'
    };

    // Save to LocalStorage (Simulating a database)
    let games = JSON.parse(localStorage.getItem('myGames')) || [];
    games.push(newGame);
    localStorage.setItem('myGames', JSON.stringify(games));

    // Show success and redirect
    alert('Game added successfully!');
    window.location.href = 'manage-games.html';
});