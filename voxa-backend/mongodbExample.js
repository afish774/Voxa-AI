import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load variables from your .env file
dotenv.config();

// Read the connection string securely from .env
const uri = process.env.MONGO_URI;

if (!uri || uri === "") {
    console.error("❌ ERROR: MONGO_URI is missing from your .env file.");
    process.exit(1);
}

const client = new MongoClient(uri);

async function runDatabaseTest() {
    try {
        console.log("⏳ Attempting to connect to MongoDB Atlas...");

        await client.connect();
        console.log("✅ Successfully connected to MongoDB Atlas!");

        const db = client.db("voxa_db");
        const chatCollection = db.collection("chat_history");

        await chatCollection.deleteMany({});
        console.log("🧹 Cleared old chat history for a fresh test.");

        const now = Date.now();
        const chatLogs = [
            { role: "user", text: "Hello Voxa, are you online?", timestamp: new Date(now - 100000) },
            { role: "ai", text: "I am online and ready, Afish.", timestamp: new Date(now - 90000) }
        ];

        const insertResult = await chatCollection.insertMany(chatLogs);
        console.log(`📝 Inserted ${insertResult.insertedCount} chat messages.`);

    } catch (error) {
        console.error("\n❌ Database Operation Failed!");
        console.error("Error Details:", error.message);
    } finally {
        await client.close();
        console.log("\n🔌 MongoDB connection safely closed.");
    }
}

runDatabaseTest();