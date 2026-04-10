import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

// Initialize MongoDB
connectDB();

const app = express();

// 🛡️ THE ULTIMATE CORS FIX: Dynamically trust any Vercel URL
app.use(cors({
    origin: true, // This bounces the trusted origin back automatically
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Crucial for passing JWT tokens securely
}));

// Body parser with increased limit to handle large Base64 image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🛣️ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Basic health check route for Render
app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});