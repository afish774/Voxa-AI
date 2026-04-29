import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import hpp from 'hpp';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';
import learnRoutes from './routes/learnRoutes.js';

dotenv.config();

// ============================================================================
// 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-03] Global Process Safety Net
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [PROCESS] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('🚨 [PROCESS] Uncaught Exception — shutting down gracefully:', err);
    setTimeout(() => process.exit(1), 1000);
});

connectDB();

const app = express();

app.set('trust proxy', 1);

// 🛠️ AUDIT FIX: Harden Helmet defaults for API servers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Required for cross-origin API serving
}));

// ============================================================================
// 🛡️ CORS CONFIGURATION
// ============================================================================

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        'https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'https://voxa-ai-chi.vercel.app',
    ];

console.log(`🌐 [CORS] Allowed origins (${ALLOWED_ORIGINS.length}):`, ALLOWED_ORIGINS);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🛡️ [CORS] Blocked request from unlisted origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ============================================================================
// 📦 BODY PARSERS
// ============================================================================

// 🛠️ AUDIT FIX: Dropped limit from 10mb to 3mb globally. 
// A massive payload passed into express.json() will synchronously block the Node 
// thread. A 3mb limit secures the event loop while still accommodating base64 images.
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ limit: '3mb', extended: true }));

app.use(hpp());

// ============================================================================
// 🔐 PASSPORT (Sessionless OAuth)
// ============================================================================

app.use(passport.initialize());

// ============================================================================
// 🛣️ API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/learn', learnRoutes);

// ============================================================================
// 💚 HEALTH CHECK
// ============================================================================

app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely with sessionless OAuth.');
});

// ============================================================================
// 🛡️ OMNI-AUDIT FIX: [SEC-ERR-01] Global Error Boundary
// ============================================================================

app.use((err, req, res, next) => {
    console.error('🚨 [EXPRESS] Unhandled Error:', err.message);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: true, message: 'Malformed JSON payload' });
    }
    res.status(500).json({ error: true, message: 'Internal Server Error' });
});

// ============================================================================
// 🚀 SERVER BOOT
// ============================================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});