// server.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";

const dev = process.env.NODE_ENV !== "production";
// ✅ Use Render's PORT or fallback to 3000
const port = process.env.PORT || 3000;
// ✅ Bind to 0.0.0.0 so it's accessible externally
const hostname = "0.0.0.0";

// MongoDB client reuse
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI missing. Check .env.local");
    process.exit(1);
}
let client;
let clientPromise;
if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

// Next.js app
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

        // JOIN: validate recipient exists in MongoDB before confirming
        socket.on("join", async ({ from, to }) => {
            try {
                const c = await clientPromise;
                const db = c.db("chatapp");
                const users = db.collection("users");

                const recipientExists = await users.findOne({ username: to });
                if (!recipientExists) {
                    socket.emit("error-message", { text: `Recipient ${to} is not registered` });
                    return;
                }

                socket.emit("joined", { with: to });
            } catch (err) {
                console.error("Join error:", err);
                socket.emit("error-message", { text: "Server error while joining" });
            }
        });

        // Real-time relay (DB write is handled by /api/message)
        socket.on("send-message", ({ from, to, text }) => {
            io.emit("receive-message", { from, to, text });
        });
    });

    // ✅ Listen on process.env.PORT and 0.0.0.0
    httpServer.listen(port, hostname, () => {
        console.log(`🚀 Ready on http://${hostname}:${port}`);
    });
});
