
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

