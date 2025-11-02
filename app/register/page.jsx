"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "./register.css";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");

    const handleRegister = () => {
        if (!username.trim()) {
            alert("Please enter a username");
            return;
        }

        // Show popup
        alert(`New user "${username}" registered`);

        // Redirect to Home
        router.push("/");
    };

    return (
        <div className="page">
            <div className="card">
                <h1 className="title">Register</h1>

                <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                />

                <button onClick={handleRegister} className="button">
                    Register
                </button>

                <p onClick={() => router.push("/")} className="link">
                    Back to Home
                </p>
            </div>
        </div>
    );
}
