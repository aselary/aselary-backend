import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
