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

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

// ============================================================================
// 🧠 PASSPORT CONFIGURATION
// ============================================================================
if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://voxa-ai-zh5o.onrender.com/api/auth/google/callback",
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (!user) {
                user = await User.create({ name: profile.displayName, email: profile.emails[0].value, googleId: profile.id, gmailAccessToken: accessToken, gmailRefreshToken: refreshToken });
            } else {
                user.googleId = profile.id; user.gmailAccessToken = accessToken; if (refreshToken) user.gmailRefreshToken = refreshToken; await user.save();
            }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

if (process.env.GITHUB_CLIENT_ID) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://voxa-ai-zh5o.onrender.com/api/auth/github/callback",
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails ? profile.emails[0].value : `${profile.username}@github.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({ name: profile.displayName || profile.username, email, githubId: profile.id });
            } else {
                user.githubId = profile.id; await user.save();
            }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

if (process.env.FACEBOOK_CLIENT_ID) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "https://voxa-ai-zh5o.onrender.com/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'emails'],
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({ name: profile.displayName, email, facebookId: profile.id });
            } else {
                user.facebookId = profile.id; await user.save();
            }
            return done(null, user);
        } catch (error) { return done(error, null); }
    }));
}

// ============================================================================
// 🚀 THE MANUAL OAUTH REDIRECTS (FIXED FOR RENDER -> VERCEL)
// ============================================================================
const CLIENT_URL = "https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app";

// Helper function to manually process the user and send Base64 to Vercel
const processManualLogin = (req, res, next, provider) => {
    passport.authenticate(provider, { session: false }, (err, user, info) => {
        if (err) {
            console.error(`🚨 ${provider} Auth Error:`, err);
            return res.redirect(`${CLIENT_URL}/?error=server_auth_error`);
        }
        if (!user) {
            console.error(`🚨 ${provider} Auth Failed: No user object returned.`);
            return res.redirect(`${CLIENT_URL}/?error=user_not_found_or_rejected`);
        }

        // 1. Generate Token
        const token = generateToken(user._id);

        // 2. Convert user to Base64 (Prevents URL encoding crashes entirely)
        const userObj = { _id: user._id, name: user.name, email: user.email };
        const userBase64 = Buffer.from(JSON.stringify(userObj)).toString('base64');

        // 3. Manually push back to Vercel
        return res.redirect(`${CLIENT_URL}/?token=${token}&user=${userBase64}`);
    })(req, res, next);
};

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'], accessType: 'offline', prompt: 'consent', session: false }));
router.get('/google/callback', (req, res, next) => processManualLogin(req, res, next, 'google'));

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', (req, res, next) => processManualLogin(req, res, next, 'github'));

// Facebook
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
