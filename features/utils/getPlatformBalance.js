import PlatformBalance from "../models/PlatformBalance.js";

const getPlatformBalance = async () => {
  let platform = await PlatformBalance.findOne();

  if (!platform) {
    platform = await PlatformBalance.create({
      balance: 0,
      totalFeesCollected: 0,
      lastUpdatedReason: "auto-init",
    });
  }

  return platform;
};

export default getPlatformBalance;