async function importPublicKey(base64) {
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return crypto.subtle.importKey("spki", binary, {
        name: "RSA-OAEP",
        hash: "SHA-256"
    }, true, ["encrypt"]);
}

async function importPrivateKey(base64) {
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return crypto.subtle.importKey("pkcs8", binary, {
        name: "RSA-OAEP",
        hash: "SHA-256"
    }, true, ["decrypt"]);
}

async function encryptMessage(message, publicKey) {
    const encoded = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function decryptMessage(encryptedBase64, privateKey) {
    const binary = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, binary);
    return new TextDecoder().decode(decrypted);
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i =0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

document.addEventListener("DOMContentLoaded", () => {
    (async () => {
        const sendButton = document.getElementById("sendButton");
        const messageInput = document.getElementById("messageInput");
        const chatWindow = document.getElementById("messages");
        const logoutButton = document.getElementById("logoutButton");
        const userListElement = document.getElementById("users");

        const username = localStorage.getItem("username");
        let currentRecipient = null;

        if (!username) window.location.href = "login.html";

        let publicKeys = {};
        const privateKeyBase64 = localStorage.getItem('privateKey');
        if (!privateKeyBase64) {
            alert("There was an issue fetching your account information. Please try signing up again.");
            window.location.href = "signup.html";
            return;
        }

        let privateKey;
        try {
            const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
            privateKey = await crypto.subtle.importKey(
                'pkcs8',
                privateKeyBuffer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                true,
                ['decrypt']
            );
        } catch (err) {
            console.error("Private key import failed:", err);
            alert("There was an issue fetching your account information. Please try signing up again.");
            localStorage.removeItem("privateKey");
            window.location.href = "signup.html";
            return;
        }

        const socket = io();
        socket.emit("join", username);

    socket.on("updatedUserList", (users) => {
        userListElement.innerHTML = "";
        users.forEach(user => {
            if (user !== username) {
                const userItem = document.createElement("li");
                userItem.innerHTML = user;
                if (user === currentRecipient) {
                    userItem.innerHTML += ' <span class="lock-icon" title="Encrypted Chat">🔒</span>';
                }
                userItem.addEventListener("click", () => {
                    currentRecipient = user;
                    clearMessages();
                    socket.emit("loadConversation", { withUser: user });

                    const allUsers = document.querySelectorAll("#users li");
                    allUsers.forEach(li => li.classList.remove("selected"));
                    userItem.classList.add("selected");
                })
                userListElement.appendChild(userItem);
            }
        });
    });

           // Intercept incoming encrypted messages and decrypt
           socket.on("privateMessage", async ({ fromUsername, toUsername, message }) => {
            if (fromUsername === currentRecipient || toUsername === currentRecipient) {
                try {
                    const decrypted = await decryptMessage(message, privateKey);
                    addMessage(fromUsername, decrypted);
                } catch (err) {
                    console.error("Failed to decrypt message:", err);
                }
            }
        });

        socket.on("loadConversation", async (messages) => {
            clearMessages();
            for (const { fromUsername, message } of messages) {
                const decrypted = await decryptMessage(message, privateKey);
                addMessage(fromUsername, decrypted);
                }
        });

        sendButton.addEventListener("click", async () => {
            const message = messageInput.value.trim();
            if (message && currentRecipient) {
                if (!publicKeys[currentRecipient]) {
                    const res = await fetch(`https://networks-project-server.onrender.com/publicKey/${currentRecipient}`);
                    const { publicKey } = await res.json();
                    publicKeys[currentRecipient] = await importPublicKey(publicKey);
                }

                const encryptedMessage = await encryptMessage(message, publicKeys[currentRecipient]);

                addMessage(username, message);
                socket.emit("privateMessage", {
                    toUsername: currentRecipient,
                    fromUsername: username,
                    message: encryptedMessage
                });

                messageInput.value = "";
            }
        });

        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                sendButton.click();
            }
        });

        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("username");
            localStorage.removeItem("publicKey");
            window.location.href = "login.html";
        });

        function addMessage(username, message) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");

            let formattedMessage = "";
            if (lastSender !== username) {
                const timestamp = new Date().toLocaleTimeString();
                formattedMessage += `
                    <div class="message-header">
                        <strong>${username}</strong> <span class="timestamp">${timestamp}</span>
                    </div>`;
            }

            formattedMessage += `<div class="message-content">${message}</div>`;
            messageDiv.innerHTML = formattedMessage;
            chatWindow.appendChild(messageDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            lastSender = username;
        }

        function clearMessages() {
            chatWindow.innerHTML = "";
            lastSender = null;
        }

        let lastSender = null;
    })(); 
});
