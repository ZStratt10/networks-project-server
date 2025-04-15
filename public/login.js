document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupButton = document.getElementById("signupButton");
    
    signupButton.addEventListener("click", () => {
        window.location.href = "signup.html";
    });
    
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        let users = JSON.parse(localStorage.getItem("users")) || {};

        if (users[username] && users[username].password === password) {
            localStorage.setItem("username", username);
            window.location.href = "index.html";
        }
        else {
            alert("Invalid username or password.");
        }
    });
});

