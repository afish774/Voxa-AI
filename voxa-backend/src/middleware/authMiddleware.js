import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

            // Attach the logged-in user to the request
            req.user = await User.findById(decoded.id).select('-password');
            return next(); // 🛠️ SURGICAL FIX: Added return to prevent fall-through after next()
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, invalid token' }); // 🛠️ SURGICAL FIX: Added return to prevent double-response crash
        }
    }

    // 🛠️ SURGICAL FIX: Now only reachable when no Bearer header exists at all
    return res.status(401).json({ message: 'Not authorized, no token provided' });
};