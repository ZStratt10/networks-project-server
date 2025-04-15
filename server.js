const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const { db, initDB } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//init DB
initDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

let onlineUsers = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (username) => {
        onlineUsers[socket.id] = username;
        io.emit("updatedUserList", Object.values(onlineUsers));
    });

    socket.on("privateMessage", ({ toUsername, fromUsername, message }) => {
        const recipientSocketId = Object.keys(onlineUsers).find(
            key => onlineUsers[key] === toUsername
        );
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("privateMessage", {
                fromUsername,
                message
            });
        }
    });

    socket.on("disconnect", () => {
        delete onlineUsers[socket.id];
        io.emit("updatedUserList", Object.values(onlineUsers));
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
