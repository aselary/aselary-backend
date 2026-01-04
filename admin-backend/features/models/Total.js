import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  savingsBalance: {
    type: Number,
    default: 0, // very important for total-sum logic
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  // You can add more fields like password, phone, etc.
});

const User = mongoose.model("Total", userSchema);

export default User;
