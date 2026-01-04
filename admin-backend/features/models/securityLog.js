import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  affectedUser: { type: String, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
export default SecurityLog;
