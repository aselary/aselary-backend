import mongoose from 'mongoose';

const smartLogicSchema = new mongoose.Schema({
  title: String,
  type: {
    type: String,
    enum: ['manual', 'auto', 'ai'],
  },
  status: {
    type: Boolean,
    default: false,
  },
  rules: String,
  source: String,
}, { timestamps: true });

export default mongoose.models.SmartLogic || mongoose.model('SmartLogic', smartLogicSchema);
