import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';
import learnRoutes from './routes/learnRoutes.js';

dotenv.config();

connectDB();

const app = express();

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
 * 🛠️ AUDIT FIX: [ERR-03] — Body size limit kept at 50mb for base64 image
 * uploads, but the actual payload content is validated in chatRoutes.js before
 * reaching the AI pipeline (MIME type check + 3MB decoded-size cap).
 *
 * The 50mb express limit is intentionally kept generous here so that the
 * structured validation error in chatRoutes produces a clean user-facing
 * message rather than an abrupt 413 Payload Too Large from express's parser,
 * which bypasses the SSE event stream entirely.
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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