import getPlatformBalance from "./getPlatformBalance.js";

const addPlatformFee = async ({ amount, reason }) => {
  const platform = await getPlatformBalance();

  platform.balance += amount;
  platform.totalFeesCollected += amount;
  platform.lastUpdatedReason = reason;

  await platform.save();

  return platform;
};

export default addPlatformFee;