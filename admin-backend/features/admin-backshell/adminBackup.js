import {
  listBackups,
  getBackupPath,
  createBackup,
  restoreBackup,
  deleteBackup as svcDelete,
  status as svcStatus,
  readLogs,           // 👈 add
  clearLogs           // 👈 add
} from "./service.js";

export const BackupController = {
  async create(_req, res) {
    try {
      const result = await createBackup();
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async list(_req, res) {
    try {
      const data = await listBackups();
      res.json({ ok: true, items: data.items, dir: data.dir });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async download(req, res) {
    try {
      const { file } = req.query;
      if (!file) return res.status(400).json({ error: "file is required" });
      const full = getBackupPath(file);
      res.download(full, file);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async restore(req, res) {
    try {
      const { file } = req.query;
      if (!file) return res.status(400).json({ error: "file is required" });
      const result = await restoreBackup(file);
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      const { file } = req.query;
      if (!file) return res.status(400).json({ error: "file is required" });
      const result = await svcDelete(file);
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async status(_req, res) {
    try {
      const result = await svcStatus();
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
 
    async logs(req, res) {
    try {
      const limit = Math.max(1, Math.min(1000, Number(req.query.limit) || 200));
      const data = await readLogs(limit);
      if (!data.ok) return res.status(500).json({ error: data.error || "log error" });
      res.json({ ok: true, lines: data.lines });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async clearLogs(_req, res) {
    try {
      const data = await clearLogs();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

};
