import { reconcilePaystack } from "./reconcile.service.js";
import isDev from "../../../features/utils/isDev.js";

export async function reconcilePaystackController(req, res) {
  try {
    const result = await reconcilePaystack();

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
        if (isDev) {
    console.error("RECONCILIATION ERROR:", error);
        }

    res.status(500).json({
      success: false,
      message: "Reconciliation failed",
      error: error.message,
    });
  }
}