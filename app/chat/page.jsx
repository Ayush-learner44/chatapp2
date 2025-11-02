"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import "./chat.css";

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const socketRef = useRef(null);

    const [username, setUsername] = useState("");
    const [recipient, setRecipient] = useState("");
    const [connected, setConnected] = useState(false);
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);

    // Get username from query param (?user=alice)
    useEffect(() => {
        const u = searchParams.get("user");
        if (u) setUsername(u);
    }, [searchParams]);

    // Initialize socket once
    useEffect(() => {
        socketRef.current = io();

        socketRef.current.on("connect", () => {
            if (username) socketRef.current.emit("register-user", username);
        });
        socketRef.current.on("joined", (data) => {
            setChat((prev) => [...prev, { from: "system", text: `Connected with ${data.with}` }]);
            setConnected(true);
        });


        socketRef.current.on("receive-message", (data) => {
            if (
                (data.from === recipient && data.to === username) ||
                (data.from === username && data.to === recipient)
            ) {
                setChat((prev) => [...prev, { from: data.from, text: data.text }]);
            }
        });

        // ✅ Listen for server-side errors
        socketRef.current.on("error-message", (data) => {
            alert(data.text);
            setConnected(false); // ✅ lock state if error
        });

        return () => {
            socketRef.current && socketRef.current.disconnect();
        };
    }, [username, recipient]);

    const connect = async () => {
        if (!recipient.trim()) {
            alert("Enter a recipient username");
            return;
        }

        // Fetch history from MongoDB
        const res = await fetch(
            `/api/message?user1=${encodeURIComponent(username)}&user2=${encodeURIComponent(recipient)}`
        );
        if (res.ok) {
            const history = await res.json();
            setChat(history.map((m) => ({ from: m.from, text: m.text })));
        } else {
            const data = await res.json();
            alert(data.message || "Could not load history");
            return;
        }

        socketRef.current.emit("join", { from: username, to: recipient });
    };

    const disconnect = () => {
        setConnected(false);
        setRecipient("");
        setChat([]);
    };

    const sendMessage = async () => {
        if (!connected || !message.trim()) return;
        const msg = { from: username, to: recipient, text: message };

        // Save to MongoDB first
        const res = await fetch("/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });

        if (res.ok) {
            // ✅ Only emit real-time if DB insert succeeded
            socketRef.current.emit("send-message", msg);
            setMessage("");
        } else {
            const data = await res.json();
            alert(data.message || "Message failed to send");
        }
    };

    return (
        <div className="chat-page">
            <div className="top-bar">
                <button onClick={() => router.push("/")} className="home-button">
                    🏠 Home
                </button>
                {username && <span className="profile-label">You: {username}</span>}
            </div>

            <div className="chat-center">
                <div className="chat-card">
                    <div className="recipient-row">
                        <input
                            type="text"
                            placeholder="Recipient"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="recipient-input"
                        />
                        <button onClick={connect} className="connect-button">Connect</button>
                        <button onClick={() => setChat([])} className="refresh-button">Clear</button>
                        <button
                            onClick={async () => {
                                const res = await fetch("/api/deleteMessages", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ user1: username, user2: recipient }),
                                });
                                if (res.ok) {
                                    alert("Messages deleted");
                                    setChat([]);
                                } else {
                                    const data = await res.json();
                                    alert(data.message || "Failed to delete messages");
                                }
                            }}
                            className="delete-button"
                        >
                            Delete Chat
                        </button>

                        <button onClick={disconnect} className="disconnect-button">Disconnect</button>
                    </div>

                    <div className="chat-window">
                        <div className="messages">
                            {chat.map((c, i) => {
                                const label = c.from === username ? "me" : c.from;
                                return (
                                    <div
                                        key={i}
                                        className={`message ${c.from === username
                                            ? "me"
                                            : c.from === "system"
                                                ? "system"
                                                : "them"
                                            }`}
                                    >
                                        <span className="from">{label}:</span> {c.text}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="input-row">
                            <input
                                type="text"
                                placeholder="Type a message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="message-input"
                                disabled={!connected} // ✅ lock input if not connected
                            />
                            <button
                                onClick={sendMessage}
                                className="send-button"
                                disabled={!connected} // ✅ lock button if not connected
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
