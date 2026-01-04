import { previewPlatformSettlement } from "../../../features/services/platformSettlement.service.js";
import isDev from "../../../features/utils/isDev.js";

export const previewSettlementController = async (req, res) => {
  try {
    const preview = await previewPlatformSettlement();

    return res.status(200).json({
      success: true,
      message: "Settlement preview fetched successfully",
      data: preview,
    });
  } catch (error) {
        if (isDev) {
    console.error("SETTLEMENT PREVIEW ERROR:", error.message);
        }

    return res.status(500).json({
      success: false,
      message: "Unable to fetch settlement preview",
      error: error.message,
    });
  }
};