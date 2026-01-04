import mongoose from 'mongoose';
import isDev from '../../features/utils/isDev';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/asenix', {
    });
        if (isDev) {
    console.log('✅ MongoDB connected successfully');
        }
  } catch (error) {
        if (isDev) {
    console.error('❌ MongoDB connection error:', error.message);
        }
  }
};

export default connectDB;
