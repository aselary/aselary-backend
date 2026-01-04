// models/obscuraLogic.js

import mongoose from 'mongoose';

const ObscuraLogicSchema = new mongoose.Schema({
  logicName: {
    type: String,
    required: true,
    trim: true,
  },
  mode: {
    type: String,
    required: true,
    enum: ['Manual', 'Automated', 'AI-Driven'], // optional: for controlled modes
  },
  powerLevel: {
    type: Number,
    required: true,
    default: 0.0,
  },
  status: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const ObscuraLogic = mongoose.model('ObscuraLogic', ObscuraLogicSchema);

export default ObscuraLogic;
