import PlatformWallet from "../models/PlatformWallet.js";
import PlatformLedger from "../models/PlatformLedger.js";

export async function creditPlatform({
  amount,
  source,
  reference,
  session,
  meta = {},
}) {
  let wallet = await PlatformWallet.findOne().session(session);

  if (!wallet) {
    wallet = new PlatformWallet({ balance: 0 });
    await wallet.save({ session });
  }

  const before = wallet.balance;
  wallet.balance += amount;

  await wallet.save({ session });

  await PlatformLedger.create(
    [
      {
        source,
        reference,
        amount,
        balanceBefore: before,
        balanceAfter: wallet.balance,
        meta,
      },
    ],
    { session }
  );
}