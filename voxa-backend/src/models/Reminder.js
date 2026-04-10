import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Reminder', reminderSchema);