// pages/api/testdb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const db = client.db("chatapp2");
        const collections = await db.listCollections().toArray();
        res.status(200).json({ ok: true, collections });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
}
