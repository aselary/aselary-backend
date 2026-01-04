import mongoose from "mongoose";

const modePolaritySchema = new mongoose.Schema({
  modePolarity: {
    type: String,
    enum: ["Yin", "Yang", "Void"],
    default: "Yin",
  },
});

export default mongoose.model("ModePolarity", modePolaritySchema);
