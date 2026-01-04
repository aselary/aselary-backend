// backend/models/cipherKey.js
import mongoose from 'mongoose';

const cipherKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
});

const CipherKeyModel = mongoose.model('CipherKey', cipherKeySchema);
export default CipherKeyModel;
