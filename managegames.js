// manage-games.js
document.addEventListener('DOMContentLoaded', () => {
    renderGames();
});

function renderGames() {
    const gamesList = document.getElementById('gamesList');
    const noGamesMessage = document.getElementById('noGamesMessage');
    
    // Get games from local storage
    let games = JSON.parse(localStorage.getItem('myGames')) || [];

    if (games.length === 0) {
        gamesList.innerHTML = '';
        noGamesMessage.style.display = 'block';
        return;
    }

    noGamesMessage.style.display = 'none';
    gamesList.innerHTML = '';

    games.forEach((game, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${game.title}</td>
            <td>${game.platform}</td>
            <td>${game.genre}</td>
            <td>$${game.price}</td>
            <td><span style="color: #2ecc71;">${game.status}</span></td>
            <td>
                <button class="action-btn" onclick="deleteGame(${game.id})" style="background-color: var(--accent-red);">Delete</button>
            </td>
        `;
        gamesList.appendChild(row);
    });
}

function deleteGame(id) {
    if (confirm("Are you sure you want to remove this game?")) {
        let games = JSON.parse(localStorage.getItem('myGames')) || [];
        games = games.filter(game => game.id !== id);
        localStorage.setItem('myGames', JSON.stringify(games));
        renderGames(); // Refresh the table
    }
}