function openReviewModal(gameName) {
    const modal = document.getElementById("review-modal");
    const gameTitle = document.getElementById("review-game-name");

    gameTitle.textContent = "Game: " + gameName;
    modal.style.display = "flex";
}

function closeReviewModal() {
    document.getElementById("review-modal").style.display = "none";
}

window.onclick = function (event) {
    const modal = document.getElementById("review-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}