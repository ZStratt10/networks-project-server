document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    
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
            console.log("Generating key pair...");
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

            console.log("Exporting public and private keys...");
            const exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.public);
            const exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.private);

            const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)));
            const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPrivateKey)));

            localStorage.setItem("privateKey", privateKeyBase64);
            localStorage.setItem("username", username);

            console.log("Sending signup request...");
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
                console.error("Signup failed:", result);
                alert(result.message || "Signup failed.");
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Could not connect to server.");
        }
    });
});
