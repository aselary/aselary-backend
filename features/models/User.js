import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      unique: true,  // ALIAS (what user sees)
      sparse: true,   
      index: true
    },
    


    internalNuban: {
      type: String,     // REAL system account
      unique: true,
      sparse: true,     // 🔥 THIS IS THE FIX
      select: false,
      index: true
    },


  // ✅ PAYSTACK (REQUIRED)
    paystackCustomerCode: {
      type: String,
      default: null,
    },

    paystackDVA: {
      accountNumber: String,
      bankName: String,
      accountName: String,
      provider: String,
    },

    phoneNumber: {
      type: String, // Make sure it's here
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },


    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },


    avatar: {
      type: String,
      default: "",
    },
    
    // 🔐 OTP for password reset
    resetOTP: {
      type: String,
      default: null,
    },

    resetOTPExpiry: {
      type: Date,
      default: null,
    },

    // 🪪 Optional token-based password reset (if you later add a token link method)
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailOTP: {
      type: String,
      default: null,
    },

    emailOTPExpiry: {
      type: Date,
      default: null,
    },

      phoneOTP: {
      type: String,
       default: null,
      },

  phoneOTPExpiry: {
    type: Date,
     default: null,
  },

  phoneVerified: { type: Boolean, default: false },
  phoneOtpTries: { type: Number, default: 0 },        // attempts counter (rate limiting)

  tempUser: { type: Boolean, default: true }, // becomes false when fully activated
  status: { type: String, default: "pending" }, // pending | active | blocked
  },

  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
