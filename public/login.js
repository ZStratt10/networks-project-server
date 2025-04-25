document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupButton = document.getElementById("signupButton");

    async function deriveAESKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem("username", username);
                localStorage.setItem("publicKey", result.publicKey);

                const encryptedPrivateKey = localStorage.getItem("encryptedPrivateKey");
                const iv = Uint8Array.from(atob(localStorage.getItem("iv")), c => c.charCodeAt(0));
                const salt = Uint8Array.from(atob(localStorage.getItem("salt")), c => c.charCodeAt(0));

                const aesKey = await deriveAESKey(password, salt);
                const encryptedBytes = Uint8Array.from(atob(encryptedPrivateKey), c => c.charCodeAt(0));

                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv },
                    aesKey,
                    encryptedBytes
                );

                const decryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(decryptedBuffer)));
                localStorage.setItem("privateKey", decryptedBase64);

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
