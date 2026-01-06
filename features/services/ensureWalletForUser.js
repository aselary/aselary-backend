import Wallet from "../models/Wallet.js";
import { generateInternalNuban } from "../utils/generateInternalNuban.js";
import { generateAliasAccountNumber } from "../utils/generateAliasAccountNumber.js";
import {
  createPaystackCustomer,
  createDedicatedAccount,
} from "../stack/paystack.controller.js";


export async function ensureWalletForUser(user) {
  let walletChanged = false;
  let userChanged = false;

  // 1. Ensure wallet exists
  let wallet = await Wallet.findOne({ userId: user._id });

  if (!wallet) {
    wallet = new Wallet({
      userId: user._id,
      balance: 0,
      provider: "ASELARY SMARTSAVE",
    });
    await wallet.save();
  }

  // 2. Internal NUBAN (WALLET ONLY)
  if (!wallet.internalNuban) {
    wallet.internalNuban = generateInternalNuban();
    walletChanged = true;
  }

  // 3. Alias account number (wallet + user)
  if (!wallet.accountNumber) {
    const seed = user.phoneNumber || user._id.toString();
    const alias = generateAliasAccountNumber(seed);

    wallet.accountNumber = alias;
    user.accountNumber = alias;

    walletChanged = true;
    userChanged = true;
  }

  // 4. Paystack customer (USER)
  let customerCode = user.paystackCustomerCode;
  if (!customerCode) {
    customerCode = await createPaystackCustomer(user);
    user.paystackCustomerCode = customerCode;
    userChanged = true;
  }

  // 5. Paystack DVA (USER)
  const hasValidDVA =
    user.paystackDVA &&
    user.paystackDVA.accountNumber &&
    user.paystackDVA.provider === "paystack";

  if (!hasValidDVA) {
    const dva = await createDedicatedAccount(customerCode);

    user.paystackDVA = {
      accountNumber: dva.accountNumber,
      bankName: dva.bankName,
      accountName: dva.accountName,
      provider: "paystack",
    };

    userChanged = true;
  }

  // 6. Save
  if (walletChanged) await wallet.save();
  if (userChanged) await user.save();

  return {
    wallet,
    aliasAccountNumber: wallet.accountNumber,
    paystackDVA: user.paystackDVA,
    customerCode: user.paystackCustomerCode,
    hasRealBank: !!user.paystackDVA?.accountNumber,
  };
}