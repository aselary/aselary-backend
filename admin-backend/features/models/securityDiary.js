import mongoose from 'mongoose';

const securityDiarySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  loggedBy: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
 status: {
    type: Boolean,
    default: false,
  },
});

const SecurityDiary = mongoose.model('SecurityDiary', securityDiarySchema);

export default SecurityDiary;
