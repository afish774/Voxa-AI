import mongoose from 'mongoose';

// 🌟 NEW FEATURE: Personal Finance Logger
// Stores every income/expense transaction logged by the user via voice.
// Used by createFinanceTool for both logging and monthly summary queries.

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Indexed for fast per-user aggregation queries
    },

    // 'expense' or 'income'
    type: {
        type: String,
        enum: ['expense', 'income'],
        required: true,
    },

    // Amount in the user's local currency (raw number, no symbol stored)
    amount: {
        type: Number,
        required: true,
        min: 0,
    },

    // LLM-classified category: Food, Transport, Entertainment, Health,
    // Shopping, Utilities, Rent, Salary, Freelance, Other
    category: {
        type: String,
        required: true,
        default: 'Other',
    },

    // Human-readable description as spoken by the user ("lunch at Cafe Coffee Day")
    description: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500,
    },

    // Stored in UTC; displayed in IST via the card renderer
    date: {
        type: Date,
        default: Date.now,
        index: true, // Indexed for date-range aggregation queries
    },
});

// Compound index for the most common query: user's transactions in a date range
transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);