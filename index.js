const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

const port = process.env.PORT || 3005;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users
const users = {};

// Get current user count
const getUserCount = () => Object.keys(users).length;

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.on("new_user_joined", (data) => {
        console.log("New user:", data.name);

        // Owner login
        if (
            data.name === "VP185" &&
            data.password === "9693490785"
        ) {
            users[socket.id] = "VP_OWNER";
            socket.emit("owner", "Dinesh Verma");
            return;
        }

        // Wrong password
        if (data.password !== "busy.com") {
            socket.broadcast.emit("stranger", {
                name: data.name,
                password: data.password
            });

            socket.disconnect();
            return;
        }

        // Valid user
        users[socket.id] = data.name;

        // Notify others only when another user exists
        if (getUserCount() > 1) {
            socket.broadcast.emit("user_joined", data.name);
        }
    });

    socket.on("send", (data) => {
        if (getUserCount() > 1) {
            socket.broadcast.emit("receive", {
                message: data.mess,
                position: "left",
                name: users[socket.id],
                hours: data.hours,
                minutes: data.minutes,
                pm_or_am: data.pm_or_am
            });
        } else {
            socket.emit("receive", {
                message: "Waiting for another user to join...",
                position: "left",
                name: "System",
                hours: data.hours,
                minutes: data.minutes,
                pm_or_am: data.pm_or_am
            });
        }
    });

    socket.on("user_typeing", () => {
        if (getUserCount() > 1) {
            socket.broadcast.emit("type", users[socket.id]);
        }
    });

    socket.on("disconnect", () => {
        const name = users[socket.id];

        if (name) {
            socket.broadcast.emit("left", name);
            delete users[socket.id];
        }

        console.log("Users connected:", getUserCount());
    });
});

// Static files
app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
    res.sendFile(path.resolve("./public/index2.html"));
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});