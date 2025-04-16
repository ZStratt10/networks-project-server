document.addEventListener("DOMContentLoaded", () => {
    const sendButton = document.getElementById("sendButton");
    const messageInput = document.getElementById("messageInput");
    const chatWindow = document.getElementById("messages");
    const logoutButton = document.getElementById("logoutButton");
    const userListElement = document.getElementById("users");

    const username = localStorage.getItem("username");
    let currentRecipient = null;

    if (!username)
        window.location.href = "login.html";

    const socket = io();
    socket.emit("join", username);

    socket.on("updatedUserList", (users) => {
        userListElement.innerHTML = "";
        users.forEach(user => {
            if (user !== username) {
                const userItem = document.createElement("li");
                userItem.textContent = user;
                userItem.addEventListener("click", () => {
                    currentRecipient = user;
                    clearMessages();
                    socket.emit("loadConversation", { withUser: user });
                })
                userListElement.appendChild(userItem);
            }
        });
    });

    socket.on("privateMessage", ({ fromUsername, toUsername, message }) => {
        if (fromUsername === currentRecipient || toUsername === currentRecipient) {
            addMessage(fromUsername, message);
        }
    });

    socket.on("loadConversation", (messages) => {
        clearMessages();
        messages.forEach(({ fromUsername, message }) => {
            addMessage(fromUsername, message);
        });
    });

    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message && currentRecipient) {
            addMessage(username, message);
            socket.emit("privateMessage", {
                toUsername: currentRecipient,
                fromUsername: username,
                message
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
        window.location.href = "login.html";
    });

    let lastSender = null;

    function addMessage(username, message) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        let formattedMessage = "";

        if (lastSender !== username) {
            const timestamp = new Date().toLocaleTimeString();
            formattedMessage += `
                <div class="message-header">
                    <strong>${username}</strong> <span class="timestamp">${timestamp}</span>
                </div>
            `;
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
});
