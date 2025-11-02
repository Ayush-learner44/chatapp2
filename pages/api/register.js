// Temporary in-memory store for registered users
let users = [];

export default function handler(req, res) {
    if (req.method === "POST") {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username required" });
        }

        if (users.includes(username)) {
            return res.status(400).json({ message: "Username already exists" });
        }

        users.push(username);
        return res.status(200).json({ message: "User registered", users });
    }

    if (req.method === "GET") {
        return res.status(200).json(users);
    }

    res.status(405).json({ message: "Method not allowed" });
}
