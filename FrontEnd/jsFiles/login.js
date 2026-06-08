document.getElementById("login-form").addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("email-input").value.trim();
    const password = document.getElementById("password-input").value;
    const errorMsg = document.getElementById("error-msg");

    errorMsg.style.display = "none";
    errorMsg.textContent = "";

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

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMsg.textContent = data.message || "Login failed.";
            errorMsg.style.display = "block";
            return;
        }

        // Save user to localStorage
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; path=/; max-age=86400`;

        // Show toast then redirect after 1.5s
        showToast(`Welcome back, ${data.user.username}!`, 'success');

        const role = data.user.role;
        if (role === "Admin") {
            setTimeout(() => window.location.href = "/admin-dashboard", 1500);
        } else if (role === "Store") {
            setTimeout(() => window.location.href = "/store-dashboard", 1500);
        } else if (role === "Gamer") {
            setTimeout(() => window.location.href = "/browse-games", 1500);
        } else {
            errorMsg.textContent = "User role not recognized.";
            errorMsg.style.display = "block";
        }

    } catch (err) {
        errorMsg.textContent = "Cannot connect to server. Make sure the backend is running.";
        errorMsg.style.display = "block";
    }
});
