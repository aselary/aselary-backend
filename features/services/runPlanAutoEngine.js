import Plan from "../models/Plan.js";
import Wallet from "../models/Wallet.js";
import Ledger from "../models/Ledger.js";
import isDev from "../utils/isDev.js"; 
import User from "../models/User.js";

export default async function runPlanAutoEngine() {
 if (isDev) {
  console.log("🚀🚀 ENGINE FUNCTION ENTERED");
 }

  const now = new Date();

const plans = await Plan.find({
  status: "active",
  nextRunAt: { $lte: now },
});

if (isDev) {
console.log("📦 Plans found:", plans.length);
console.log("📦 Plans data:", plans);
}

  for (const plan of plans) {

    if (isDev) {
    console.log("------ PLAN ENGINE DEBUG ------");
    console.log("Plan ID:", plan._id);
    console.log("Plan status:", plan.status);
    console.log("Plan balance:", plan.balance);
    console.log("Plan amount:", plan.amount);
    console.log("Plan start:", plan.startDate);
    console.log("Plan end:", plan.endDate);
    console.log("Plan nextRunAt:", plan.nextRunAt);
    console.log("Withdrawal Account:", plan.withdrawalAccount);
    console.log("Now time:", now);
    }

    if (now < plan.startDate || now > plan.endDate) continue;

    const wallet = await Wallet.findOne({ userId: plan.userId });
    if (isDev) {
    console.log("Wallet found:", wallet);
    console.log("Wallet balance:", wallet?.balance);
    }
    if (!wallet) continue;

    const user = await User.findById(plan.userId).select("selectedFundingPlans");
    if (!user) continue;

// 🧠 GET ALL ACTIVE USER PLANS
const userPlans = await Plan.find({
  userId: plan.userId,
  status: "active"
});

const activePlansCount = userPlans.length;

// 🥇 CASE 1: Only ONE plan → auto fund
if (activePlansCount === 1) {
  if (isDev) console.log("✅ Only one plan → auto funding");
}

// 🥈 CASE 2: More than one plan
if (activePlansCount > 1) {

   const hasSelection =
      user.selectedFundingPlans &&
      user.selectedFundingPlans.length > 0;

   // 🧠 If NO selection yet → fund oldest only
   if (!hasSelection) {

      const oldestPlan = userPlans
         .sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))[0];

      if (plan._id.toString() !== oldestPlan._id.toString()) {
         if (isDev) console.log("⛔ Waiting for user selection → funding oldest only");
         continue;
      }

      if (isDev) console.log("✅ Funding oldest plan until user chooses");
   }

   // 🧠 If user HAS selected plans
   if (hasSelection) {

      const isSelected = user.selectedFundingPlans.some(
         id => id.toString() === plan._id.toString()
      );

      if (!isSelected) {
         if (isDev) console.log("⛔ Plan not chosen by user → skipped");
         continue;
      }

      if (isDev) console.log("✅ Selected plan → funding allowed");
   }
}
      
    if (isDev) {
        console.log("Checking balance vs amount...");
    console.log("Wallet:", wallet.balance);
    console.log("Plan amount:", plan.amount);
    }


    // 🚫 If insufficient balance → skip (DO NOT move nextRunAt)
   if (wallet.balance < plan.amount) {
    plan.missedCount = (plan.missedCount || 0) + 1;
    await plan.save();
    continue;
   }

    const balanceBefore = wallet.balance;
      
     if (isDev) {
    console.log(">>> DEDUCTING MONEY NOW");
     }

   // Deduct
    wallet.balance -= plan.amount;
    plan.balance += plan.amount;

   // 🔐 LOCK withdrawal account on first funding
   if (
     plan.withdrawalAccount &&
     !plan.withdrawalAccount.locked &&
     plan.balance > 0
    ) {
     plan.withdrawalAccount.locked = true;
    }

    // ✅ Complete if reached
    if (plan.balance >= plan.totalTarget) {
      plan.status = "completed";
    }

    // ✅ NOW move nextRunAt
    const nextDate = new Date(plan.nextRunAt);

    if (plan.frequency === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    if (plan.frequency === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    if (plan.frequency === "monthly") {
      const day = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);

      if (nextDate.getDate() < day) {
        nextDate.setDate(0);
      }
    }

    plan.nextRunAt = nextDate;

    await wallet.save();
    await plan.save();

    await Ledger.create({
      userId: plan.userId,
      walletId: wallet._id,
      type: "PLAN_AUTO_IN",
      source: "PLAN_AUTO_IN",
      amount: plan.amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      reference: `PLAN-${plan._id}-${Date.now()}`,
      narration: "Scheduled plan deduction"
    });
     
    if (isDev) {
    console.log(">>> PLAN AUTO SUCCESS");
    }
  }
}