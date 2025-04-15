document.addEventListener("DOMContentLoaded", () => {
    const sendButton = document.getElementById("sendButton");
    const messageInput = document.getElementById("messageInput");
    const chatWindow = document.getElementById("messages");
    const logoutButton = document.getElementById("logoutButton");

    const username = localStorage.getItem("username");

    if (!username)
        window.location.href = "login.html";

    const socket = io();

    const recipientSelect = document.createElement("select");
    recipientSelect.id = "recipientSelect";
    recipientSelect.innerHTML = '<option disabled selected>Who would you like to message?</option>';
    document.querySelector(".input-container").prepend(recipientSelect);

    socket.emit("join", username);

    socket.on("updatedUserList", (users) => {
        recipientSelect.innerHTML = '<option disabled selected>Who would you like to message?</option>';
        users.forEach(user => {
            if (user !== username) {
                const option = document.createElement("option");
                option.value = user;
                option.textContent = user;
                recipientSelect.appendChild(option);
            }
        });
    });

    socket.on("privateMessage", ({ fromUsername, message }) => {
        addMessage(fromUsername, message);
    });

    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        const recipient = recipientSelect.value;

        if (message && recipient) {
            addMessage(username, message);
            socket.emit("privateMessage", {
                toUsername: recipient,
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
});
