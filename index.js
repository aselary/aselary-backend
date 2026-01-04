import { ENV } from "./admin-backend/config/env.js";
import "./loadENV.js";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";           // For security
import rateLimit from "express-rate-limit"; // Rate limiter  
import isDev from "./features/utils/isDev.js"; 
import paystackWebhookRoute from "./features/stack/paystackWebhook.route.js";     
import signupRoutes from "./features/signup/signup.routes.js"; // Signup feature
import signinRoutes from "./features/signin/signin.routes.js"; //Signin feature
import generateResetOTPRoutes from './features/generateResetOTP/generateResetOTP.route.js';
import resendOTPRoutes from "./features/resend-otp/resendOTPRoute.js";
import verifyResetOTPRoutes from './features/verifyResetOTP/verifyResetOTP.route.js';
import verifyOTPRoutes from './features/verify-otp/verifyOTP.route.js';
import resetPasswordRoutes from './features/reset-password/resetPassword.route.js';
import updatePhoneRoutes from './features/updatePhone/updatePhone.routes.js';
import meRoutes from "./features/me/me.routes.js";
import phoneOtpRoutes from "./features/phone-otp/phoneOtp.routes.js";
import verifyPhoneOTPRoutes from "./features/verify-phone-otp/verifyPhoneOTP.routes.js";
import resendPhoneRoutes from "./features/resend-phone-otp/resendPhone.route.js";
import resetOtpRoutes from "./features/resetOTP/resetOTP.route.js";
import userInterestRoutes from "./features/interestCounter/user.routes.js";
import budgetRadarRoutes from './features/budgetRadar/budgetRadar.routes.js';
import financialScoreRoutes from "./features/financialScoreController/financialScoreRoute.js";
import smartPlanRoutes from "./features/smartPlan/smartPlan.routes.js";
import logoutRoute from './features/logout/route.js';
import savingRoutes from "./features/Savings/savingRoutes.js";
import depositRoutes from "./features/card-deposit/deposit.routes.js";
import toBankRoutes from './features/to-bank/toBank.route.js';
import uploadRoutes from "./features/upload/uploadRoute.js";
import userRoutes from "./features/user/userRoutes.js";
import txRoutes from "./features/transaction/txRoutes.js";
import dashboardRoutes from "./features/dashboard/dashboard.routes.js";
import walletRoutes from "./features/wallet/walletRoutes.js";
import { securityGuard } from "./features/middleware/securityGuard.js";
import paystackRoutes from "./features/paystack/paystack.route.js";
import ussdRoutes from "./features/ussd/ussd.route.js";
import { ussdWebhook } from "./features/ussd/ussd.controller.js";
import { transferWebhook } from "./features/transfer/transferWebhook.controller.js";
import a2aTransferRoutes from "./features/A2A/a2aTransfer.route.js";
import withdrawalRoutes from "./features/withdraw/withdrawal.routes.js";
import bankRoutes from "./features/bank/bank.routes.js";
import activityLogRoutes from "./features/activity-log/activityLog.routes.js";
import { expirePendingTransactions } from "./src/jobs/expirePendingTransactions.js";
import { expirePendingToBank } from "./src/jobs/expirePendingToBank.js";
import profileRoutes from "./features/profile/profile.route.js";

 /* <============================  ADMIN IMPORT ================================> */
import adminLoginRoute from "./admin-backend/features/adminLogin/adminLoginRoute.js";
import verifyTokenRoute from "./admin-backend/features/verifyToken/verifyToken.routes.js"
import smartLogicRoutes from './admin-backend/features/smart-logic/smartLogicRoutes.js';
import obscuraLogicRoutes from './admin-backend/features/obscura-logic/obscura-logicRoutes.js';
import sentinelRoutes from './admin-backend/features/sentinel/sentinelRoutes.js';
import vibesRoutes from './admin-backend/features/vibeslock/videsRoutes.js';
import decoyRoutes from './admin-backend/features/decoy-layer/decoyRoutes.js';
import threatRoutes from './admin-backend/features/threattrap/threatRoutes.js';
import logicRoutes from './admin-backend/features/logicFirewall/logicRoutes.js';
import securityRoutes from './admin-backend/features/securityDiary/securityRoutes.js';
import cipherkeyRoute from './admin-backend/features/cipherKey/cipherkeyRoute.js';
import signalRoutes from "./admin-backend/features/signalmode/signalRoutes.js";
import voidskinRoutes from './admin-backend/features/voidskin/voidskinRoutes.js';
import modePolarityRoutes from "./admin-backend/features/mode-polarity/route.js";
import signalFeedRoutes from "./admin-backend/features/signal-feed/route.js";
import vibeshieldRoutes from './admin-backend/features/vibeshield/routes/vibeshield.js';
import aethersealRoutes from './admin-backend/features/seal/route.js';
import logoutRoutes from './admin-backend/features/logout/route.js';
import totalSavingsRoute from "./admin-backend/features/treasury/route.js";
import currentBalanceRoute from "./admin-backend/features/treasury/route.js";
import platformGainRoute from "./admin-backend/features/profitgain/route.js";
import sterlingBalanceRoute from './admin-backend/features/sterling/route.js';
import sendSterlingRoute from './admin-backend/features/sendSterling/route.js';
import revenueSummaryRoute from './admin-backend/features/revenueSummary/route.js';
import securityLogRoute from './admin-backend/features/securityLogs/route.js';
import adminBackupRoute  from './admin-backend/features/admin-backshell/adminBackupRoute.js';
import adminTransactionRoutes from './admin-backend/features/transaction/admin.transaction.routes.js';
import platformRoutes from './admin-backend/features/platform/platform.routes.js';
import reconcileRoutes from './admin-backend/features/reconciliation/reconcile.route.js';
import platformSettlementRoutes from "./admin-backend/features/platfomSettlement/platformSettlement.route.js";
import adminSettlementRoutes from "./admin-backend/features/settlement/settlement.routes.js";
import treasuryRecipientRoutes from "./admin-backend/features/treasuryRecipient/treasuryRecipient.routes.js" ;
import treasuryPayoutRoutes from "./admin-backend/features/treasuryPayout/treasuryPayout.routes.js";
import createPayoutRoutes from "./admin-backend/features/createPayout/createPayout.routes.js";
 /* <============================  ADMIN IMPORT ================================> */


const app = express();

const isProd = process.env.NODE_ENV === "production";

// ✅ Health check that your mobile will call
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), msg: "Aselary API alive" });
});

app.use((req, res, next) => {
  if (req.headers["x-paystack-signature"]) {
    req.rawBody = req.body;
  }
  next();
});

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(helmet());

// CORS (safe for web + mobile)
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow mobile (no Origin), localhost web, and any ngrok domain
      const ngrok = /^https?:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/i;
      if (!origin) return cb(null, true);
      if (origin === "http://localhost:3000" || ngrok.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-admin-key", "asenix-admin-token",],
  })
);
// ⚠️ Paystack webhook MUST come BEFORE express.json()
app.use("/api/webhook", express.raw({ type: "application/json" }), paystackWebhookRoute);
app.post("/webhook", express.raw({ type: "application/json" }), ussdWebhook);
app.post("/transfer/webhook", express.raw({ type: "*/*" }), transferWebhook);

app.use(express.json());
app.use(morgan("dev"));

app.use('/api/admin', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 requests/min
  standardHeaders: true,
  legacyHeaders: false
}));


// 🧠 Rate limiter
const limiter = rateLimit({
  windowMs: isProd ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 min prod | 1 min dev
  max: isProd ? 5 : 100, // 5 attempts prod | 100 dev
  standardHeaders: true,
  legacyHeaders: false,
   message: { 
    success: false,
    msg: "Too many requests. Please try again later."
   },
skip: (req) => {
  const path = req.originalUrl.toLowerCase();
  if (path.startsWith("/api/health")) return true;
  if (path.startsWith("/api/ussd")) return true;
  return false;
}
});
app.use(limiter);

const ussdLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds window
  max: 20,             // Allow up to 20 USSD hits in 10 seconds
  message: { msg: "USSD blocked: too many attempts." },
  standardHeaders: true,
  legacyHeaders: false
});


// Run every 1 minute
setInterval(async () => {
  try {
    await expirePendingTransactions();
    await expirePendingToBank();
  } catch (err) {
    console.error("Auto-expire job failed:", err);
  }
}, 60 * 1000);


// 🛡️ MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    if (isDev) {
      console.log("✅ MongoDB connected");
    }
  })
  .catch((error) => {
    if (isDev) {
      console.error("❌ MongoDB connection error:", error.message);
    } else {
      console.error("❌ MongoDB failed. Shutting down.");
      process.exit(1);
    }
  });
           





// 🛠️ ADMIN Existing routes  
app.use("/api/admin", adminLoginRoute);
app.use("/api/verify-token", verifyTokenRoute);
app.use('/api', dashboardRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/admin", adminTransactionRoutes);
app.use("/api/admin", adminSettlementRoutes);
app.use("/api/admin/platform", platformRoutes);
app.use("/api/reconcile", reconcileRoutes);
app.use("/api/admin/treasury", treasuryPayoutRoutes);
app.use("/api/admin/treasury", createPayoutRoutes);
app.use("/api/admin/treasury/recipient", treasuryRecipientRoutes);
app.use("/api/admin/settlement", platformSettlementRoutes);
app.use('/api/admin/withdrawals', withdrawalRoutes);
app.use('/api/smart-logic', smartLogicRoutes);
app.use('/api/obscura', obscuraLogicRoutes);
app.use('/api/sentinel', sentinelRoutes);
app.use('/api/vibes', vibesRoutes);
app.use('/api/decoy-layer', decoyRoutes);
app.use('/api/threat', threatRoutes);
app.use('/api/logic', logicRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/cipher', cipherkeyRoute);
app.use('/api/signal', signalRoutes);
app.use('/api/void', voidskinRoutes);
app.use("/api/mode-polarity", modePolarityRoutes);
app.use("/api/signal-feed", signalFeedRoutes);
app.use('/api/vibeshield', vibeshieldRoutes);
app.use('/api/aetherseal', aethersealRoutes);
app.use('/api/logout', logoutRoutes);
app.use("/api/admin", totalSavingsRoute);
app.use("/api/admin", currentBalanceRoute);
app.use("/api/admin", platformGainRoute);
app.use('/api/admin/sterling-balance', sterlingBalanceRoute);
app.use('/api/admin/send-sterling', sendSterlingRoute);
app.use('/api/admin/revenue-summary', revenueSummaryRoute);
app.use('/api/admin/security-logs', securityLogRoute);
app.use("/api/admin", adminBackupRoute );



// 🛠️ Existing routes     
app.use("/api/ussd", ussdLimiter, ussdRoutes);           
app.use("/api/auth", signupRoutes); // ✅ Signup feature
app.use("/api/auth", signinRoutes); // ✅ Signin feature
app.use('/api/auth', generateResetOTPRoutes);
app.use('/api/auth', verifyResetOTPRoutes);
app.use('/api/auth', verifyOTPRoutes);
app.use('/api/auth', resetPasswordRoutes);
app.use("/api/auth", resendOTPRoutes);
app.use("/api/auth", resetOtpRoutes);
app.use("/api/auth", updatePhoneRoutes);
app.use("/api/auth", phoneOtpRoutes);
app.use("/api/auth", verifyPhoneOTPRoutes);
app.use("/api/auth", resendPhoneRoutes);
app.use("/api/transfer", a2aTransferRoutes);
app.use("/api", bankRoutes);
app.use("/api/activity", activityLogRoutes);
app.use("/api/transfer", toBankRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/me", meRoutes, securityGuard);
app.use("/api/dashboard", dashboardRoutes, securityGuard);
app.use("/api/wallet", walletRoutes, securityGuard);
app.use('/api/budget', budgetRadarRoutes, securityGuard);
app.use("/api/financial", financialScoreRoutes, securityGuard);
app.use("/api/v1", smartPlanRoutes, securityGuard);
app.use('/api/logout', logoutRoute, securityGuard);
app.use("/api/user", userInterestRoutes, securityGuard);
app.use("/api/deposit", depositRoutes, securityGuard);
app.use("/api", savingRoutes, securityGuard);
app.use("/api", uploadRoutes, securityGuard);
app.use("/api/user", userRoutes, securityGuard);
app.use("/api/tx", txRoutes, securityGuard);
app.use("/api/paystack", paystackRoutes, securityGuard);
app.use("/api/withdraw", withdrawalRoutes);







app.get("/api/admin/env-check", (_req, res) => {
  res.json({
    MONGODB_URI_SET: !!ENV.MONGODB_URI,
    BACKUP_DIR: process.env.MONGO_BACKUP_DIR || (process.platform === "win32" ? "D:\\backups" : path.join(process.cwd(), "backups")),
    MONGODUMP_PATH: process.env.MONGODUMP_PATH || "mongodump",
    MONGORESTORE_PATH: process.env.MONGORESTORE_PATH || "mongorestore",
    ENV_PATH: ENV._ENV_PATH,
    cwd: process.cwd(),
  });
});

app.get("/paystack", (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    return res.send("No reference supplied.");
  }

  // Redirect back to your mobile app
  return res.redirect(`aselarymobile://?reference=${reference}`);
});


// (Optional) Keep root helpful too
app.get("/", (_req, res) => {
  res.json({ ok: true, msg: "Root alive. Use /api/health" });
});



// 🏃‍♂️ Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
      if (isDev) {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
      }
}
);
