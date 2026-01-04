import mongoose from 'mongoose';

const vibeShieldSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('VibeShield', vibeShieldSchema);
