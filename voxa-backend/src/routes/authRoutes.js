import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TITANIUM AUTH — Backend (authRoutes.js)
// ═══════════════════════════════════════════════════════════════════════════════

// 🌟 SPRINT 2 FIX: Externalize hardcoded URLs to environment variables.
// Add CLIENT_URL and BACKEND_URL to your .env / Render dashboard.
const CLIENT_URL = process.env.CLIENT_URL || 'https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://voxa-ai-zh5o.onrender.com';

// 🛠️ SURGICAL FIX: [V-02] Fail hard at boot if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
    console.error('🚨 FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ============================================================================
// 🧠 PASSPORT STRATEGY CONFIGURATION
// ============================================================================

if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI || `${BACKEND_URL}/api/auth/google/callback`,
        proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (!user) {
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    gmailAccessToken: accessToken,
                    gmailRefreshToken: refreshToken,
                });
            } else {
                user.googleId = profile.id;
                user.gmailAccessToken = accessToken;
                if (refreshToken) user.gmailRefreshToken = refreshToken;
                await user.save();
            }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

if (process.env.GITHUB_CLIENT_ID) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails ? profile.emails[0].value : `${profile.username}@github.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({ name: profile.displayName || profile.username, email, githubId: profile.id });
            } else { user.githubId = profile.id; await user.save(); }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

if (process.env.FACEBOOK_CLIENT_ID) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails'],
        proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({ name: profile.displayName, email, facebookId: profile.id });
            } else { user.facebookId = profile.id; await user.save(); }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

// ============================================================================
// 🚀 OAUTH CALLBACK HANDLER (Sessionless JWT)
// ============================================================================

const processManualLogin = (req, res, next, provider) => {
    passport.authenticate(provider, { session: false }, (err, user, info) => {
        if (err) {
            console.error(`🚨 ${provider} Auth Error:`, err);
            return res.redirect(`${CLIENT_URL}/?error=server_auth_error`);
        }
        if (!user) {
            console.error(`🚨 ${provider} Auth Failed: No user returned.`);
            return res.redirect(`${CLIENT_URL}/?error=user_not_found_or_rejected`);
        }
        const token = generateToken(user._id);
        const userObj = { _id: user._id, name: user.name, email: user.email };
        const userEncoded = encodeURIComponent(Buffer.from(JSON.stringify(userObj)).toString('base64'));
        return res.redirect(`${CLIENT_URL}/?token=${token}&user=${userEncoded}`);
    })(req, res, next);
};

// ============================================================================
// 🔗 OAUTH ROUTE DEFINITIONS
// ============================================================================

// ── Google ─────────────────────────────────────────────────────────────────────
// 🌟 SPRINT 2: Added calendar scope to Google OAuth.
//
// BEFORE: scope = ['profile', 'email', 'gmail.send']
//   → Calendar API calls returned HTTP 403 "Insufficient Permission"
//
// AFTER: scope now includes 'calendar' — enables read/write access to the
//   user's primary Google Calendar for the manage_calendar tool.
//
// ⚠️  EXISTING USERS must sign out and sign back in with Google to grant
//   the new calendar permission. Their existing gmail tokens stay valid.
//
// prompt:'consent' + accessType:'offline' guarantees Google always issues a
// refresh_token — required for long-lived calendar access between sessions.
router.get('/google', passport.authenticate('google', {
    scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar', // 🌟 SPRINT 2
    ],
    accessType: 'offline',
    prompt: 'consent',
    session: false,
}));
router.get('/google/callback', (req, res, next) => processManualLogin(req, res, next, 'google'));

// ── GitHub ──────────────────────────────────────────────────────────────────────
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', (req, res, next) => processManualLogin(req, res, next, 'github'));

// ── Facebook ────────────────────────────────────────────────────────────────────
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get('/facebook/callback', (req, res, next) => processManualLogin(req, res, next, 'facebook'));

// ============================================================================
// 🔒 STANDARD EMAIL/PASSWORD ROUTES
// ============================================================================

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'User already exists' });
        const user = await User.create({ name, email, password });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && user.password && (await user.matchPassword(password))) {
            res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

export default router;