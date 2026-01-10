import Wallet from "../models/Wallet.js";
import { generateInternalNuban } from "../utils/generateInternalNuban.js";
import { generateAliasAccountNumber } from "../utils/generateAliasAccountNumber.js";
import {
  createPaystackCustomer,
  createDedicatedAccount,
} from "../stack/paystack.controller.js";


export async function createWalletInfrastructureOnSignup(user) {

  let wallet = await Wallet.findOne({ userId: user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,
      balance: 0,
      bankName: "Aselary Wallet",
      provider: "ASELARY SMARTSAVE",
    });
  }


  if (!user.internalNuban) {
    const internalNuban = await generateInternalNuban();
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


  let customerCode = user.paystackCustomerCode;

  if (!customerCode) {
    customerCode = await createPaystackCustomer(user);
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


  return {
    wallet,
    aliasAccountNumber: wallet.accountNumber,
    paystackDVA: user.paystackDVA,
    customerCode: user.paystackCustomerCode,
    hasRealBank: !!user.paystackDVA?.accountNumber,
  };
}