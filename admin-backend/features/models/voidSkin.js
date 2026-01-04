import mongoose from "mongoose";

const voidSkinSchema = new mongoose.Schema(
  {
    skinName: {
      type: String,
      required: true,
      trim: true,
    },
themeMode: {
  type: String,
  enum: [
    "Ghost",
    "Stealth",
    "Mask",
    "Invisible",
    "Shadow",
    "Hologram",
    "Aura",
    "Phantom",
    "Silencer",
    "Nebula",
    "Glitch",
    "DarkMatter",
    "VoidPulse",
    "Cipher",
    "Infrared",
    "Echo",
    "SmokeScreen",
    "Afterimage",
    "Oblivion",
    "Spectral"
  ],
  default: "Ghost",
},

    blurLevel: {
      type: Number,
      required: true,
      default: 50,
    },
     status: {
    type: Boolean,
    default: false,
  },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // optional, can link to admin/user
    },
  },
  { timestamps: true }
);

const VoidSkin = mongoose.models.VoidSkin || mongoose.model("VoidSkin", voidSkinSchema);

export default VoidSkin;
