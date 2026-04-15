import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // 🚀 Made optional so Google OAuth works seamlessly
    },
    googleId: { type: String },
    githubId: { type: String },
    facebookId: { type: String },

    // 🚀 Tokens for sending emails via Voxa
    gmailAccessToken: { type: String },
    gmailRefreshToken: { type: String },
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// 🚀 THE FIX: Pure async Promise flow, completely removed the 'next' parameter
userSchema.pre('save', async function () {
    // If the password isn't modified or doesn't exist (like in a Google Login), just exit.
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;