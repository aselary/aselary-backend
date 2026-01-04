import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple likely locations to avoid path issues
const candidates = [
  path.resolve(process.cwd(), ".env"),                         // run folder
  path.resolve(__dirname, "../../.env"),                      // project root
  path.resolve(__dirname, "../.env"),                         // one up
];

let loadedFrom = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedFrom = p;
    break;
  }
}

// Export env values
export const ENV = {
  MONGODB_URI: process.env.MONGODB_URI || "",
  BACKUP_DIR: process.env.MONGO_BACKUP_DIR || "D:\\backups",
  PORT: Number(process.env.PORT || 5000),
  _ENV_PATH: loadedFrom,
};