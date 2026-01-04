import mongoose from 'mongoose';

const logicFirewallSchema = new mongoose.Schema({
  firewallName: {
    type: String,
    required: true,
  },
  detectionLevel: {
    type: String,
    required: true,
  },
  blockMessage: {
    type: String,
  },
  rulePattern: {
    type: String,
  },
   status: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const LogicFirewall = mongoose.model('LogicFirewall', logicFirewallSchema);

export default LogicFirewall;
