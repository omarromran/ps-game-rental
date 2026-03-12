function openReviewModal(gameName){

const modal = document.getElementById("review-modal");
const gameTitle = document.getElementById("review-game-name");

gameTitle.textContent = "Game: " + gameName;

modal.classList.add("active");

}

function closeReviewModal(){

document.getElementById("review-modal").classList.remove("active");

}

window.onclick = function(event){

const modal = document.getElementById("review-modal");

if(event.target === modal){
modal.classList.remove("active");
}

}