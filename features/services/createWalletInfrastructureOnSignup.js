import Wallet from "../models/Wallet.js";
import { generateInternalNuban } from "../utils/generateInternalNuban.js";
import { generateAliasAccountNumber } from "../utils/generateAliasAccountNumber.js";
import {
  createPaystackCustomer,
  createDedicatedAccount,
} from "../stack/paystack.controller.js";


export async function createWalletInfrastructureOnSignup(user) {

  console.log("STEP 1: Wallet infrastructure started");
console.log("User:", user);

  console.log("STEP 2: Checking existing wallet");

let wallet = await Wallet.findOne({ userId: user._id });

console.log("Wallet found:", wallet);

  if (!wallet) {
    console.log("STEP 3: No wallet found, creating wallet...");
    wallet = await Wallet.create({
      userId: user._id,
      balance: 0,
      bankName: "Aselary Wallet",
      provider: "ASELARY SMARTSAVE",
    });
    console.log("Wallet created:", wallet)
  }


  if (!user.internalNuban) {
    console.log("STEP 4: Checking internal NUBAN");
    const internalNuban = await generateInternalNuban();
    console.log("Generated internal NUBAN:", internalNuban);
    user.internalNuban = internalNuban;
  }

  if (!wallet.internalNuban) {
    wallet.internalNuban = user.internalNuban;
    await wallet.save();
  }


 if (!wallet.accountNumber && user.phoneNumber) {
    const accountNumber = generateAliasAccountNumber(user.phoneNumber);
    wallet.accountNumber = accountNumber;
    await wallet.save();

    user.accountNumber = accountNumber;
  }

  console.log("STEP 5: Checking Paystack customer");
console.log("Existing customer code:", user.paystackCustomerCode);

  let customerCode = user.paystackCustomerCode;

  if (!customerCode) {
    customerCode = await createPaystackCustomer(user);
    console.log("Paystack customer created:", customerCode);
    user.paystackCustomerCode = customerCode;
     await user.save();
  }

  const hasValidDVA =
    user.paystackDVA &&
    user.paystackDVA.accountNumber &&
    user.paystackDVA.bankName &&
    user.paystackDVA.accountName &&
    user.paystackDVA.provider === "paystack";

  if (!hasValidDVA) {
    console.log("STEP 6: Checking dedicated virtual account");
console.log("Has valid DVA:", hasValidDVA);
    const dva = await createDedicatedAccount(customerCode);
    console.log("Paystack DVA response:", dva);

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

  console.log("STEP 7: Wallet infrastructure completed successfully");

  return {
    wallet,
    aliasAccountNumber: wallet.accountNumber,
    paystackDVA: user.paystackDVA,
    customerCode: user.paystackCustomerCode,
    hasRealBank: !!user.paystackDVA?.accountNumber,
  };
}