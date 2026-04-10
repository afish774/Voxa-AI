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

// 🛡️ THE CORS FIX: Whitelisting trusted frontends
app.use(cors({
    origin: [
        "http://localhost:5173", // Local Vite frontend
        "http://localhost:3000", // Local CRA frontend
        "https://voxa-jqhqd6cgi-afishmv-7650s-projects.vercel.app", // Your specific Vercel build
        /\.vercel\.app$/ // Safely allows any future Vercel deployments
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Crucial for passing JWT tokens securely
}));

// Body parser with increased limit to handle large Base64 image payloads for the Vision model
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