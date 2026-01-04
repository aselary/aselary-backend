// features/admin-backshell/adminBackupRoute.js
import { Router } from "express";
import { BackupController as ctrl } from "./adminBackup.js";

const router = Router();

// --- simple admin key middleware ---
router.use((req, res, next) => {
  const sent =
    req.headers["x-admin-key"] ||
    req.headers["asenix-admin-token"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  const expected = (process.env.ADMIN_API_KEY || "").trim();

  if ((sent || "").trim() !== expected) {
    return res.status(403).json({ error: "Forbidden: Invalid admin key" });
  }
  next();
});

// ---- endpoints ----
// POST /api/admin/backup -> create dump
router.post("/backup", ctrl.create);

// GET /api/admin/list -> list dumps
router.get("/list", ctrl.list);

// GET /api/admin/download?file=<filename.7z> -> download archive
router.get("/download", ctrl.download);

// POST /api/admin/restore?file=<filename.7z> -> restore from archive
router.post("/restore", ctrl.restore);

// DELETE /api/admin/delete?file=<filename.7z> -> delete archive
router.delete("/delete", ctrl.remove);

// GET /api/admin/status -> quick health/status
router.get("/status", ctrl.status);

// NEW: logs
router.get("/logs", ctrl.logs);

router.delete("/logs/clear", ctrl.clearLogs);

export default router;