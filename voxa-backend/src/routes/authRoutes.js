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
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));

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
// 🚀 OAUTH REDIRECT (DROPS AT EXACT ROOT `/`)
// ============================================================================
const handleOAuthCallback = (req, res) => {
    try {
        const clientUrl = "https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app";
        if (!req.user) throw new Error("OAuth returned an empty user object.");

        const token = generateToken(req.user._id);
        const userData = encodeURIComponent(JSON.stringify({ _id: req.user._id, name: req.user.name, email: req.user.email }));

        // 🚀 Redirects to the root URL (/) so the App.jsx Interceptor instantly catches it
        res.redirect(`${clientUrl}/?token=${token}&user=${userData}`);
    } catch (error) {
        console.error("🚨 REDIRECT CRASH:", error);
        res.status(500).send("Internal Server Error: Could not generate token.");
    }
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'], accessType: 'offline', prompt: 'consent' }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app/?error=failed` }), handleOAuthCallback);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: `https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app/?error=failed` }), handleOAuthCallback);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: `https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app/?error=failed` }), handleOAuthCallback);

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