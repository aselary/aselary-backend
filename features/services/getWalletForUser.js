import Wallet from "../models/Wallet.js";

export async function getWalletForUser(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    throw new Error("CRITICAL: Wallet missing for user");
  }
  return wallet;
}