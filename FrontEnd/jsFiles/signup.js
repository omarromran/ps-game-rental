// signup.js

// account type selection remains for role assignment; storeID will be generated server-side for Store accounts

document.getElementById("signup-form").addEventListener("submit", async e => {
    e.preventDefault();

    const username = document.getElementById("username-input").value.trim();
    const email = document.getElementById("email-input").value.trim();
    const password = document.getElementById("password-input").value;
    const confirmPassword = document.getElementById("confirm-password-input").value;
    const role = document.querySelector('input[name="account-type"]:checked').value;
    const errorMsg = document.getElementById("error-msg");

    errorMsg.style.display = "none";
    errorMsg.textContent = "";

    // Frontend validation
    if (!username) {
        errorMsg.textContent = "Username is required.";
        errorMsg.style.display = "block";
        return;
    }
    if (username.length < 3) {
        errorMsg.textContent = "Username must be at least 3 characters.";
        errorMsg.style.display = "block";
        return;
    }
    if (!/^\S+$/.test(username)) {
        errorMsg.textContent = "Username must not contain spaces.";
        errorMsg.style.display = "block";
        return;
    }
    if (!email) {
        errorMsg.textContent = "Email is required.";
        errorMsg.style.display = "block";
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMsg.textContent = "Please enter a valid email address.";
        errorMsg.style.display = "block";
        return;
    }
    if (!password) {
        errorMsg.textContent = "Password is required.";
        errorMsg.style.display = "block";
        return;
    }
    if (password.length < 6) {
        errorMsg.textContent = "Password must be at least 6 characters.";
        errorMsg.style.display = "block";
        return;
    }
    if (password !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match.";
        errorMsg.style.display = "block";
        return;
    }

    try {
        const res = await fetch("http://localhost:8080/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.message || "Registration failed.";
            errorMsg.style.display = "block";
            return;
        }

      showToast("Account created successfully! Redirecting to login...", 'success');
      setTimeout(() => window.location.href = "/login", 1500);

    } catch (err) {
        errorMsg.textContent = "Cannot connect to server. Make sure the backend is running.";
        errorMsg.style.display = "block";
    }
});
