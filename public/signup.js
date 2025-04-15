document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    
    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const reenterPassword = document.getElementById("reenterPassword").value

        let users = JSON.parse(localStorage.getItem("users")) || {};

        if (users[username]) {
            alert("User already exists. Please sign in or select a different username.");
            return;
        }

        if (password !== reenterPassword) {
            alert("Passwords do not match.");
        } else {
            users[username] = {password: password};
            localStorage.setItem("users", JSON.stringify(users));
            alert("Account successfully created. You can now sign into your account.");
            window.location.href = "login.html";
        }
    });
});
