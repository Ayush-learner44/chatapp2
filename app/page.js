"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "./home.css"; // classic CSS import

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    router.push(`/chat?user=${encodeURIComponent(username)}`);
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Welcome</h1>

        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleContinue} className="button">
          Continue
        </button>

        <p onClick={() => router.push("/register")} className="link">
          Sign Up
        </p>
      </div>
    </div>
  );
}
