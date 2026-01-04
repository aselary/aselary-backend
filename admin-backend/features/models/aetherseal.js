import mongoose from 'mongoose';

const aetherSealSchema = new mongoose.Schema({
  seal: { type: Boolean, default: false },
  sync: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('AetherSeal', aetherSealSchema);
