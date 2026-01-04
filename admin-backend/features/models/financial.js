import mongoose from 'mongoose';

const financialSchema = new mongoose.Schema({
  type: { type: String, enum: ['transaction', 'deposit', 'withdrawal', 'transfer'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  reference: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FinancialActivity', financialSchema);
