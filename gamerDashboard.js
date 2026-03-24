document.addEventListener("DOMContentLoaded", function () {

     const active = document.getElementById("active-rentals");
     const pending = document.getElementById("pending-bookings");
     const completed = document.getElementById("completed-rentals");

     const navActive = document.getElementById("active");
     const navPending = document.getElementById("pending");
     const navCompleted = document.getElementById("completed");

     function hideAll() {
          active.classList.add("hidden");
          pending.classList.add("hidden");
          completed.classList.add("hidden");
     }

     navActive.onclick = function () {
          hideAll();
          active.classList.remove("hidden");
     };

     navPending.onclick = function () {
          hideAll();
          pending.classList.remove("hidden");
     };

     navCompleted.onclick = function () {
          hideAll();
          completed.classList.remove("hidden");
     };

});