// === models/vibeLock.model.js ===
import mongoose from 'mongoose';

const vibeLockSchema = new mongoose.Schema({
  vibeSound: {
    type: String,
    required: true
  },
  reactionType: {
    type: String,
    required: true
  },
  emotionPhrase: {
    type: String,
    required: true
  },
  mediaMode: {
    type: String,
    enum: ['audio', 'video', 'haptic'],
    required: true
  },
 status: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const VibeLock = mongoose.model('VibeLock', vibeLockSchema);
export default VibeLock;
