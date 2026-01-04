import mongoose from 'mongoose';

const threatTrapSchema = new mongoose.Schema({
  trapName: {
    type: String,
    required: true,
  },
  trapType: {
    type: String,
    required: true,
  },
  severityLevel: {
    type: String,
    required: true,
  },
  triggerMessage: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const ThreatTrap = mongoose.model('ThreatTrap', threatTrapSchema);

export default ThreatTrap;
