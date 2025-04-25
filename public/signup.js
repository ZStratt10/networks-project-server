document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

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

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const reenterPassword = document.getElementById("reenterPassword").value;

        if (password !== reenterPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ["encrypt", "decrypt"]
            );

            const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

            const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const aesKey = await deriveAESKey(password, salt);

            const encrypted = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                aesKey,
                privateKeyBuffer
            );

            const encryptedPrivateKey = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

            localStorage.setItem("username", username);
            localStorage.setItem("encryptedPrivateKey", encryptedPrivateKey);
            localStorage.setItem("iv", btoa(String.fromCharCode(...iv)));
            localStorage.setItem("salt", btoa(String.fromCharCode(...salt)));

            const response = await fetch("https://networks-project-server.onrender.com/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, publicKey: publicKeyBase64 })
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
            alert("Could not connect to server.");
        }
    });
});
