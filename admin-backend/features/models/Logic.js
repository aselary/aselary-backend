// models/Logic.js
import mongoose from 'mongoose';

const logicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  triggerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
   type: String, // manual, automated, ai
  trigger: String,
  enabled: { type: Boolean, default: false },
});

export default mongoose.model('Logic', logicSchema);
