require("dotenv").config(); // Load environment variables
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    hashed_password: { type: String, required: true },
    public_key: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema({
    fromUsername: String,
    toUsername: String,
    message: String,
    timestamp: { type: String, required: true }
});
const Message = mongoose.model("Message", messageSchema);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/signup", async (req, res) => {
    const { username, password, publicKey } = req.body;
    if (!username || !password || !publicKey) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, hashed_password: hashedPassword, public_key: publicKey });
        await user.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Signup error:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Username already exists" });
        } else {
            res.status(500).json({ message: "Server error" });
        }
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: "Invalid username or password" });

        const isMatch = await bcrypt.compare(password, user.hashed_password);
        if (isMatch) {
            res.json({ message: "Login successful", publicKey: user.public_key });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

let onlineUsers = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (username) => {
        onlineUsers[socket.id] = username;
        socket.username = username;
        io.emit("updatedUserList", Object.values(onlineUsers));
    });

    socket.on("privateMessage", async ({ toUsername, fromUsername, message }) => {
        await Message.create({ fromUsername, toUsername, message });

        const recipientSocketId = Object.keys(onlineUsers).find(
            key => onlineUsers[key] === toUsername
        );
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("privateMessage", {
                fromUsername,
                toUsername,
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
