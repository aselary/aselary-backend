import mongoose from 'mongoose';

const decoyLayerSchema = new mongoose.Schema(
  {
    decoyName: {
      type: String,
      required: true,
    },
    decoyType: {
      type: String,
      required: true,
    },
    triggerCondition: {
      type: String,
      required: true,
    },
    responseAction: {
      type: String,
      required: true,
    },
    status: {
    type: Boolean,
    default: false,
  },
    
  },
  { timestamps: true }
);

const DecoyLayer = mongoose.models.DecoyLayer || mongoose.model('DecoyLayer', decoyLayerSchema);

export default DecoyLayer;
