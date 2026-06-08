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


    if (!/^[a-zA-Z][a-zA-Z0-9]{2,19}$/.test(username)) {
        errorMsg.textContent = "Username must be 3-20 characters long, start with a letter, and contain no spaces.";
        errorMsg.style.display = "block";
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMsg.textContent = "Please enter a valid email address.";
        errorMsg.style.display = "block";
        return;
    }

    if (password.length < 6 || password.length > 20) {
        errorMsg.textContent = "Password must be between 6 and 20 characters.";
        errorMsg.style.display = "block";
        return;
    }

    if (password !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match.";
        errorMsg.style.display = "block";
        return;
    }
    
    try {
        const res = await fetch("/api/auth/register", {
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