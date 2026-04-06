import mongoose from 'mongoose';
import dns from 'node:dns';

// 💡 THIS IS THE MAGIC LINE: 
// It forces Node.js to prefer IPv4 (what MongoDB uses) over IPv6.
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // If it still fails, let's see the full stack trace for a deep dive
        console.debug(error);
        process.exit(1);
    }
};

export default connectDB;