import Wallet from "../models/Wallet.js";
import { generateInternalNuban } from "../utils/generateInternalNuban.js";
import { generateAliasAccountNumber } from "../utils/generateAliasAccountNumber.js";
import {
  createPaystackCustomer,
  createDedicatedAccount,
} from "../stack/paystack.controller.js";


export async function ensureWalletForUser(user) {
  // -----------------------------
  // 1️⃣ ENSURE WALLET EXISTS
  // -----------------------------
const wallet = await Wallet.findOneAndUpdate(
  { userId: user._id },
  {
    $setOnInsert: {
      userId: user._id,
      balance: 0,
      bankName: "Aselary Wallet",
      provider: "ASELARY SMARTSAVE",
    },
  },
  { upsert: true, new: true }
);
  // -----------------------------
  // 2️⃣ ENSURE INTERNAL NUBAN
  // -----------------------------
  if (!user.internalNuban) {
    const internalNuban = await generateInternalNuban();
    user.internalNuban = internalNuban;
  }

  if (!wallet.internalNuban) {
    wallet.internalNuban = user.internalNuban;
    await wallet.save();
  }

  // -----------------------------
  // 3️⃣ ENSURE ALIAS ACCOUNT NUMBER
  // (PHONE-BASED)
  // -----------------------------
  if (!wallet.accountNumber && user.phoneNumber) {
    const accountNumber = generateAliasAccountNumber(user.phoneNumber);
    wallet.accountNumber = accountNumber;
    await wallet.save();

    // keep user document in sync
    user.accountNumber = accountNumber;
  }

  // -----------------------------
  // 4️⃣ ENSURE PAYSTACK CUSTOMER
  // -----------------------------
  let customerCode = user.paystackCustomerCode;

  if (!customerCode) {
    customerCode = await createPaystackCustomer(user);

    // 🔥 THIS SAVE IS CRITICAL
    user.paystackCustomerCode = customerCode;
    await user.save();
  }

  // -----------------------------
  // 5️⃣ ENSURE PAYSTACK DVA
  // -----------------------------
  const hasValidDVA =
    user.paystackDVA &&
    user.paystackDVA.accountNumber &&
    user.paystackDVA.bankName &&
    user.paystackDVA.accountName &&
    user.paystackDVA.provider === "paystack";

  if (!hasValidDVA) {
    const dva = await createDedicatedAccount(customerCode);

    if (!dva || !dva.accountNumber) {
      throw new Error("Failed to create Paystack DVA");
    }

    user.paystackDVA = {
      accountNumber: dva.accountNumber,
      bankName: dva.bankName,
      accountName: dva.accountName,
      provider: "paystack",
    };

    await user.save();
  }

  // -----------------------------
  // DONE
  // -----------------------------
  return {
    wallet,
    aliasAccountNumber: wallet.accountNumber,
    paystackDVA: user.paystackDVA,
    customerCode: user.paystackCustomerCode,
    hasRealBank: !!user.paystackDVA?.accountNumber,
  };
}