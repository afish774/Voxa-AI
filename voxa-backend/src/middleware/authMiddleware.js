import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ============================================================================
// 🛡️ AUTH MIDDLEWARE — protect()
//
// Guards every authenticated route. Verifies the Bearer JWT and attaches
// the resolved User document to `req.user` before calling next().
// ============================================================================

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 🛠️ SURGICAL FIX: [V-02] Removed 'fallback_secret' — JWT_SECRET is
            // boot-validated in authRoutes.js so if we reach this line it is set.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Resolve the user document from the decoded MongoDB ObjectId.
            // Password hash is excluded via .select('-password').
            req.user = await User.findById(decoded.id).select('-password');

            // 🛠️ AUDIT FIX: [SEC-03] — Null-guard for deleted accounts
            //
            // BEFORE: `req.user` was passed to `next()` even when `findById`
            // returned null (i.e., the account was deleted from MongoDB while
            // the 30-day JWT was still valid). Every downstream route accessing
            // `req.user._id` or `req.user.name` would throw:
            //   TypeError: Cannot read properties of null (reading '_id')
            // crashing the request handler with an unhandled 500.
            //
            // AFTER: If the DB returns null, we immediately reject the request
            // with a 401 and a clear message, so the frontend can redirect to
            // the login page rather than receiving a confusing 500.
            if (!req.user) {
                return res.status(401).json({
                    message: 'Not authorized — account no longer exists. Please log in again.',
                });
            }

            return next(); // 🛠️ SURGICAL FIX: [V-02] Added return to prevent fall-through after next()
        } catch (error) {
            // Covers: JsonWebTokenError (tampered token), TokenExpiredError,
            // NotBeforeError, and any unexpected DB errors from findById.
            return res.status(401).json({ message: 'Not authorized, invalid token' }); // 🛠️ SURGICAL FIX: [V-02] Added return to prevent double-response crash
        }
    }

    // Reachable only when no Bearer Authorization header is present at all.
    return res.status(401).json({ message: 'Not authorized, no token provided' });
};