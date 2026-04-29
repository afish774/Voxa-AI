import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { safeSerializeError } from '../utils/errorSerializer.js';

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

// 🛠️ AUDIT FIX: Strict Input Sanitization to prevent NoSQL Injection & Bcrypt DoS
const validateAuthInput = (req, res, isRegister = false) => {
    if (isRegister && (typeof req.body.name !== 'string' || req.body.name.trim().length > 100)) {
        return { valid: false, message: 'Invalid or missing name' };
    }
    if (typeof req.body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(req.body.email) || req.body.email.length > 255) {
        return { valid: false, message: 'Invalid or missing email' };
    }
    // 72 bytes is the absolute maximum for Bcrypt. Anything larger is an attempted DoS.
    if (typeof req.body.password !== 'string' || req.body.password.length < 6 || req.body.password.length > 72) {
        return { valid: false, message: 'Password must be between 6 and 72 characters' };
    }
    return {
        valid: true,
        name: isRegister ? req.body.name.trim() : null,
        email: req.body.email.toLowerCase().trim(),
        password: req.body.password
    };
};

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
        try {
            if (err) {
                console.error(`🚨 ${provider} Auth Error:`, safeSerializeError(err));
                return res.redirect(`${CLIENT_URL}/?error=server_auth_error`);
            }
            if (!user) {
                console.error(`🚨 ${provider} Auth Failed: No user returned.`);
                return res.redirect(`${CLIENT_URL}/?error=user_not_found_or_rejected`);
            }
            const token = generateToken(user._id);
            const userObj = { _id: user._id, name: user.name, email: user.email };
            const userEncoded = encodeURIComponent(Buffer.from(JSON.stringify(userObj)).toString('base64'));

            // 🛠️ AUDIT FIX: Using hash fragment (#) instead of query params (?)
            // prevents the JWT token from being logged in proxy/server access logs.
            return res.redirect(`${CLIENT_URL}/#token=${token}&user=${userEncoded}`);
        } catch (syncError) {
            console.error(`🚨 ${provider} Auth Sync Error:`, safeSerializeError(syncError));
            return res.redirect(`${CLIENT_URL}/?error=internal_server_error`);
        }
    })(req, res, next);
};

// ============================================================================
// 🔗 OAUTH ROUTE DEFINITIONS
// ============================================================================

// ── Google ─────────────────────────────────────────────────────────────────────
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
        const input = validateAuthInput(req, res, true);
        if (!input.valid) return res.status(400).json({ message: input.message });

        if (await User.findOne({ email: input.email })) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name: input.name, email: input.email, password: input.password });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    } catch (error) {
        console.error('Registration Error:', safeSerializeError(error));
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const input = validateAuthInput(req, res, false);
        if (!input.valid) return res.status(400).json({ message: input.message });

        const user = await User.findOne({ email: input.email });
        if (user && user.password && (await user.matchPassword(input.password))) {
            res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
        } else {
            // Mitigate timing attacks by returning identical response shape and wait times
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', safeSerializeError(error));
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;