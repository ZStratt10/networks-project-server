document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupButton = document.getElementById("signupButton");
    
    signupButton.addEventListener("click", () => {
        window.location.href = "signup.html";
    });
    
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("https://networks-project-server.onrender.com/login", {
                method: "POST",
                headers: { "Conetent-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem("username", username);
                localStorage.setItem("publicKey", result.publicKey);
                window.location.href = "index.html";
            } else {
                alert(result.message || "Login failed.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Could not connect to server.");
        }
    });
});

