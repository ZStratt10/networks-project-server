document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const reenterPassword = document.getElementById("reenterPassword").value

        let users = JSON.parse(localStorage.getItem("users")) || {};

        if (password !== reenterPassword) {
            alert("Passwords do not match.");
            return;
        }

        //generate a randome public key (placeholder for now)
        const dummyPublicKey = btoa("publicKeyPlaceholder");

        try {
            const response = await fetch("https://networks-project-server.onrender.com/signup", {
                method: "POST", 
                headers: {"Content-Type": "application/json" },
                body: JSON.stringify({ username, password, publicKey: dummyPublicKey})
            });

            const result = await response.json();
            if (response.ok) {
                alert("Account created successfully. You can now log in.");
                window.location.href = "login.html";
            } else {
                alert(result.message || "Signup failed.");
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Could not connect o server.");
        }
    });
});
