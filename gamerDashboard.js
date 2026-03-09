<<<<<<< HEAD
<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function () {

     // ================= Section Navigation =================
     const sections = document.querySelectorAll("main section");
     const buttons = document.querySelectorAll(".sidebar nav button");

     function showSection(sectionId, clickedButton) {
          // Hide all sections
          sections.forEach(section => section.style.display = "none");

          // Remove active class from all buttons
          buttons.forEach(button => button.classList.remove("active"));

          // Show selected section
          const selectedSection = document.getElementById(sectionId);
          if (selectedSection) selectedSection.style.display = "block";

          // Highlight active button
          if (clickedButton) clickedButton.classList.add("active");
     }

     // Expose function to HTML
     window.showSection = showSection;

     // Show first section by default
=======

=======
>>>>>>> d6a4f75 (fixed gamer dashboard html and js)
document.addEventListener("DOMContentLoaded", function () {

     // ================= Section Navigation =================
     const sections = document.querySelectorAll("main section");
     const buttons = document.querySelectorAll(".sidebar nav button");

     function showSection(sectionId, clickedButton) {
          // Hide all sections
          sections.forEach(section => section.style.display = "none");

          // Remove active class from all buttons
          buttons.forEach(button => button.classList.remove("active"));

          // Show selected section
          const selectedSection = document.getElementById(sectionId);
          if (selectedSection) selectedSection.style.display = "block";

          // Highlight active button
          if (clickedButton) clickedButton.classList.add("active");
     }

     // Expose function to HTML
     window.showSection = showSection;

<<<<<<< HEAD
     // Show first section on page load
>>>>>>> 11fdb1d (fixed gaming dashboard html and js and matching it to be with the same css file as the admin dashboard)
=======
     // Show first section by default
>>>>>>> d6a4f75 (fixed gamer dashboard html and js)
     if (sections.length > 0) {
          sections.forEach(section => section.style.display = "none");
          sections[0].style.display = "block";
     }

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> d6a4f75 (fixed gamer dashboard html and js)
     // ================= Leave Review Modal =================
     const reviewModal = document.getElementById("review-modal");
     const reviewGameName = document.getElementById("review-game-name");
     const reviewForm = document.getElementById("review-form");
<<<<<<< HEAD

     // Open modal and set game name
     window.openReviewModal = function (gameName) {
          reviewGameName.textContent = gameName;
          reviewForm.reset(); // clear previous inputs
          reviewModal.style.display = "block";
     };

     // Close modal
     window.closeReviewModal = function () {
          reviewModal.style.display = "none";
     };

     // Close modal when clicking outside content
     window.onclick = function (event) {
          if (event.target === reviewModal) {
               reviewModal.style.display = "none";
          }
     };
     document.addEventListener("DOMContentLoaded", function () {

          const sections = document.querySelectorAll("main section");
          const buttons = document.querySelectorAll(".sidebar nav button");

          function showSection(sectionId, clickedButton) {

               // Hide all sections
               sections.forEach(function (section) {
                    section.style.display = "none";
               });

               // Remove active class from all buttons
               buttons.forEach(function (button) {
                    button.classList.remove("active");
               });

               // Show selected section
               const selectedSection = document.getElementById(sectionId);
               if (selectedSection) {
                    selectedSection.style.display = "block";
               }

               // Highlight active button
               if (clickedButton) {
                    clickedButton.classList.add("active");
               }
          }

          // Make function available to HTML buttons
          window.showSection = showSection;

          // Show first section on page load
          if (sections.length > 0) {
               sections.forEach(section => section.style.display = "none");
               sections[0].style.display = "block";
          }

     });



     // Handle review form submission
     reviewForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const rating = reviewForm.rating.value;
          const comment = reviewForm.comment.value;
          const game = reviewGameName.textContent;

          // For now, just log the review
          console.log(`Review for ${game}: Rating ${rating}, Comment: ${comment}`);

          // Close modal after submit
          reviewModal.style.display = "none";

          // Optionally, show a confirmation or save review to backend here
          alert(`Thank you for reviewing ${game}!`);
     });
=======
});
>>>>>>> 11fdb1d (fixed gaming dashboard html and js and matching it to be with the same css file as the admin dashboard)
=======
>>>>>>> d6a4f75 (fixed gamer dashboard html and js)

     // Open modal and set game name
     window.openReviewModal = function (gameName) {
          reviewGameName.textContent = gameName;
          reviewForm.reset(); // clear previous inputs
          reviewModal.style.display = "block";
     };

     // Close modal
     window.closeReviewModal = function () {
          reviewModal.style.display = "none";
     };

     // Close modal when clicking outside content
     window.onclick = function (event) {
          if (event.target === reviewModal) {
               reviewModal.style.display = "none";
          }
     };

     // Handle review form submission
     reviewForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const rating = reviewForm.rating.value;
          const comment = reviewForm.comment.value;
          const game = reviewGameName.textContent;

          // For now, just log the review
          console.log(`Review for ${game}: Rating ${rating}, Comment: ${comment}`);

          // Close modal after submit
          reviewModal.style.display = "none";

          // Optionally, show a confirmation or save review to backend here
          alert(`Thank you for reviewing ${game}!`);
     });

});