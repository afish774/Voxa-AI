import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet'; // 🚀 DEPLOYMENT FIX: Import helmet for standard security headers
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';
import learnRoutes from './routes/learnRoutes.js';

dotenv.config();

// ============================================================================
// 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-03] Global Process Safety Net
//
// Without these handlers, an unhandled promise rejection in a fire-and-forget
// path (e.g., background fact extraction via PQueue, a stray .catch() miss)
// crashes the entire Node.js process in Node 16+ where
// --unhandled-rejections=throw is the default. This logs the error and keeps
// the server alive for rejections, while allowing a graceful flush for truly
// fatal uncaught exceptions.
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

// 🚀 DEPLOYMENT FIX: Trust cloud proxy (Render/Railway) to correctly read client IPs
app.set('trust proxy', 1);

// 🚀 DEPLOYMENT FIX: Apply Helmet to secure HTTP headers
app.use(helmet());

// ============================================================================
// 🛡️ CORS CONFIGURATION
// ============================================================================

/**
 * 🛠️ AUDIT FIX: [QW-05] — CORS Origins Externalized from Hardcoded Array
 *
 * BEFORE: The allowed-origins list was a hardcoded array in source code.
 * Any new frontend deployment URL (Vercel preview, staging, custom domain)
 * required a code edit + redeploy of the backend.
 *
 * AFTER: Origins are read from the ALLOWED_ORIGINS environment variable as a
 * comma-separated string. The original four origins are kept as the fallback
 * so existing deployments need no .env change to stay functional.
 *
 * Usage in .env:
 *   ALLOWED_ORIGINS=https://yourdomain.com,https://preview.yourdomain.com,http://localhost:5173
 *
 * The fallback array activates automatically when ALLOWED_ORIGINS is unset
 * (e.g., local dev without a .env file).
 */
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        'https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'https://voxa-ai-chi.vercel.app',
    ];

// Log the active origins once at boot so misconfigurations are immediately visible
console.log(`🌐 [CORS] Allowed origins (${ALLOWED_ORIGINS.length}):`, ALLOWED_ORIGINS);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow server-to-server requests (no origin header) and whitelisted origins
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

/**
 * 🛡️ OMNI-AUDIT FIX: [MEM-LEAK-03] — Body limit reduced from 50MB to 10MB.
 *
 * BEFORE: 50MB limit allowed a malicious user to POST 50MB × 20 req/min
 * (per the rate limiter) = 1GB/min of body parsing memory.
 *
 * AFTER: 10MB — still 3× the 3MB image cap validated in chatRoutes.js,
 * providing ample headroom for base64 overhead and metadata, while cutting
 * the abuse surface by 80%. The structured validation error in chatRoutes
 * still produces a clean user-facing message for payloads between 3MB–10MB.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================================
// 🔐 PASSPORT (Sessionless OAuth)
// ============================================================================

// Sessions are completely removed — all auth is handled via stateless JWTs.
app.use(passport.initialize());

// ============================================================================
// 🛣️ API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/learn', learnRoutes); // 🛠️ SURGICAL FIX: Mount the knowledge ingestion API

// ============================================================================
// 💚 HEALTH CHECK
// ============================================================================

app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely with sessionless OAuth.');
});

// ============================================================================
// 🚀 SERVER BOOT
// ============================================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});