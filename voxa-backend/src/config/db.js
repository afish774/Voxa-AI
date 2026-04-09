import mongoose from 'mongoose';
import dns from 'node:dns';

// 💡 Forces Node.js to prefer IPv4 (what MongoDB uses) over IPv6.
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is undefined! Please add it to your Render Environment Variables.");
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // We removed process.exit(1) here so the logs have time to flush to the console!
    }
};

export default connectDB;