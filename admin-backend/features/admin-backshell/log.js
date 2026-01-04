// features/admin-backshell/log.js
import fs from "fs";
import path from "path";
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "backup.log");

export function logEvent(action, data = {}) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const line = `[${new Date().toISOString()}] ${action.toUpperCase()} ${JSON.stringify(data)}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch {}
}