export default function handler(req, res) {
    if (req.method === "GET") {
        return res.status(200).json([]); // no history yet
    }

    if (req.method === "POST") {
        return res.status(200).json({ message: "Message ignored (no DB yet)" });
    }

    res.status(405).json({ message: "Method not allowed" });
}
