document.addEventListener("DOMContentLoaded", () => {
    showSection('active-rentals', document.querySelector(".sidebar nav button"));
});

function showSection(sectionId, btn) {
    document.querySelectorAll("main > section").forEach(section => section.style.display = "none");

    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.style.display = "block";

    document.querySelectorAll(".sidebar nav button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function logout() {
    if (confirm("Are you sure you want to log out?")) {
        window.location.href = "login.html";
    }
}