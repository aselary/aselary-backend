// models/signalNodeModel.js
import mongoose from 'mongoose';

const signalNodeSchema = new mongoose.Schema({
  nodeName: {
    type: String,
    required: true,
  },
  nodeLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  signalType: {
    type: String,
    enum: ['Pulse', 'Wave', 'Code', 'Beacon'],
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const SignalNode = mongoose.model('SignalNode', signalNodeSchema);

export default SignalNode;
