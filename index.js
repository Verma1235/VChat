const https = require("http");
const express = require("express");
const { Server } = require("socket.io");
const path = require("path");

const port = process.env.PORT || 3000;

// manage http request ,express and socket.io 
const app = express();
const server = https.createServer(app);
const io = new Server(server);

// manage socket.io and handel all task
const users = {};
let userCount = 0;

io.on("connection", (socket) => {
    console.log("new connection establish", socket.id);

    socket.on("new_user_joined", (data) => {
        console.log("new user: ", data.name);

        if (data.name == "VP185" && data.password == "9693490785") {
            var Owner = "Dinesh Verma";
            socket.emit("owner", Owner);
            users[socket.id] = "VP_OWNER";
            userCount++;
        } else {

            users[socket.id] = data.name;

            if (data.password == "185") {
                userCount++;

                // Start chatting only if more than 1 user
                if (userCount > 1) {
                    socket.broadcast.emit("user_joined", data.name);
                }

            } else {
                socket.broadcast.emit("stranger", { name: data.name, password: data.password });
                socket.disconnect();
                delete users[socket.id];
            }
        }
    });

    socket.on('send', (data) => {

        // Allow chat only if more than 1 user
        if (userCount > 1) {
            socket.broadcast.emit('receive', {
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

    socket.on("disconnect", () => {
        userCount--;
        socket.broadcast.emit("left", users[socket.id]);
        delete users[socket.id];
    });

    socket.on("user_typeing", () => {
        if (userCount > 1) {
            socket.broadcast.emit("type", users[socket.id]);
        }
    });

});

// control file 
app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
    return res.sendFile(path.resolve("./public/index.html"));
});

// port listinor 
server.listen(port, () => {
    console.log(`Server run on port:http://localhost:${port}`);
});