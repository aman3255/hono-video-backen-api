import { MongoClient } from "mongodb";

let client: MongoClient;

export default async function dbconnect(uri: string) {
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in environment variables.");
        throw new Error("❌ MONGODB_URI is not defined in environment variables.");
    }

    console.log("Connecting to MongoDB with URI:", uri); // Debug log

    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log("✅ MongoDB connected successfully...");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

export function getDb() {
    if (!client) {
        throw new Error("❌ MongoDB client is not connected.");
    }
    return client.db(); // Replace with your database name if needed
}