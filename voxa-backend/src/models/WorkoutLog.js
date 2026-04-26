import mongoose from 'mongoose';

// 🌟 NEW FEATURE: Voice Fitness & Calorie Coach
// Stores every workout session logged by the user via voice.
// Used by createFitnessTool for logging, streak calculation, and weekly summaries.

const workoutLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Exercise name as understood by the LLM ("Running", "Push-ups", "Cycling")
    exercise: {
        type: String,
        required: true,
        trim: true,
    },

    // Duration in minutes (null for rep-based exercises like push-ups)
    duration: {
        type: Number,
        min: 0,
        default: null,
    },

    // Estimated calories burned (calculated server-side by the tool)
    caloriesBurned: {
        type: Number,
        min: 0,
        default: 0,
    },

    // For rep-based exercises (sit-ups, push-ups, pull-ups)
    sets: { type: Number, min: 1, default: null },
    reps: { type: Number, min: 1, default: null },

    // Stored in UTC; IST conversion handled at display time
    date: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Compound index for streak and weekly summary queries
workoutLogSchema.index({ user: 1, date: -1 });

export default mongoose.model('WorkoutLog', workoutLogSchema);