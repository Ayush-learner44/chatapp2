// server.js
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        handler(req, res);
    });

    const io = new Server(httpServer, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        console.log("✅ Socket connected:", socket.id);

        socket.on("register-user", (username) => {
            socket.username = username;
        });

        socket.on("join", ({ from, to }) => {
            socket.emit("joined", { with: to });
        });

        socket.on("send-message", ({ from, to, text }) => {
            io.emit("receive-message", { from, to, text });
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(`🚀 Ready on http://${hostname}:${port}`);
    });
});
