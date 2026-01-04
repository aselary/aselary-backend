import fs from "fs/promises";
import path from "path";
import { logEvent } from "./log.js";
import { spawn } from "child_process";

const BACKUP_DIR   = path.resolve(process.env.BACKUP_DIR   || "D:\\backups");
const RESTORE_DIR  = path.resolve(process.env.RESTORE_DIR  || "D:\\restore_test");
const BACKUP_SCRIPT = process.env.BACKUP_SCRIPT; // PowerShell .ps1
const SEVEN_ZIP    = process.env.SEVEN_ZIP_EXE || "7z";
const MONGO_RESTORE= process.env.MONGO_RESTORE_EXE || "mongorestore";
const RESTORE_URI  = process.env.MONGO_RESTORE_URI || "mongodb://127.0.0.1:27018";

const ALLOWED = /\.(7z|gz|zip)$/i;

export async function listBackups() {
  const all = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
  const items = all
    .filter(d => d.isFile() && ALLOWED.test(d.name))
    .map(d => d.name)
    .sort()
    .reverse(); // newest first by name
  return { dir: BACKUP_DIR, items };
}

export function getBackupPath(file) {
  if (!file || file.includes("..") || !ALLOWED.test(file)) {
    throw new Error("Bad file parameter");
  }
  return path.join(BACKUP_DIR, file);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { shell: false, windowsHide: true, ...opts });
    let out = "", err = "";
    p.stdout.on("data", d => out += d.toString());
    p.stderr.on("data", d => err += d.toString());
    p.on("close", code => {
      (code === 0) ? resolve({ code, out }) : reject(new Error(err || `exit ${code}`));
    });
  });
}

// Where logs live (adjust if you used a different folder)
const LOG_DIR = path.join(process.env.BACKUP_DIR ?? "D:\\admin-backup", "logs");

// make sure logs dir exists
async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

// small helpers
async function listByMtime(dir, prefix) {
  const names = await fs.readdir(dir);
  const picks = names.filter(n => n.startsWith(prefix));
  const withStat = await Promise.all(
    picks.map(async n => ({ n, s: await fs.stat(path.join(dir, n)) }))
  );
  withStat.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs); // newest first
  return withStat.map(x => x.n);
}

// --- add/replace these exports in service.js ---

export async function readLogs(limit = 300) {
  await ensureLogDir();

  // pick newest run_.log and mirror_.log if present
  const runFiles = await listByMtime(LOG_DIR, "run_");
  const mirrorFiles = await listByMtime(LOG_DIR, "mirror_");

  const pick = async (arr) => {
    if (arr.length === 0) return "";
    return fs.readFile(path.join(LOG_DIR, arr[0]), "utf8");
  };

  const runText = await pick(runFiles);
  const mirText = await pick(mirrorFiles);

  // combine and tail last limit lines
  const combined = (runText + "\n" + mirText)
    .split(/\r?\n/)
    .slice(-limit);

  return {
    ok: true,
    dir: LOG_DIR,
    files: {
      run: runFiles,
      mirror: mirrorFiles,
    },
    lines: combined,
  };
}

export async function clearLogs() {
  await ensureLogDir();
  const names = await fs.readdir(LOG_DIR);
  let removed = 0;
  for (const n of names) {
    if (n.startsWith("run_") || n.startsWith("mirror_") || n.endsWith(".log")) {
      try { await fs.unlink(path.join(LOG_DIR, n)); removed++; } catch {}
    }
  }
  return { ok: true, removed };
}


// === CREATE BACKUP ===
export async function createBackup() {
  if (!BACKUP_SCRIPT) throw new Error("BACKUP_SCRIPT env not set");

  try {
    // Run backup script
    await run("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      BACKUP_SCRIPT
    ]);

    // Get latest backup file
    const { items } = await listBackups();
    const latest = items[0] || null;

    // ✅ Log success
    logEvent("backup_created", { latest });

    return { latest };
  } catch (e) {
    // ✅ Log failure
    logEvent("backup_failed", { error: e.message });
    throw e;
  }
}

// === RESTORE BACKUP ===
export async function restoreBackup(file) {
  const full = getBackupPath(file);
  try {
    // Step 1: Prepare restore directory
    await fs.rm(RESTORE_DIR, { recursive: true, force: true });
    await fs.mkdir(RESTORE_DIR, { recursive: true });

    // Step 2: Unzip archive
    await run(SEVEN_ZIP, ["x", "-y", full, `-o${RESTORE_DIR}`]);

    // Step 3: Restore MongoDB
    await run(MONGO_RESTORE, [
      `--uri=${RESTORE_URI}`,
      "--drop",
      "--dir",
      RESTORE_DIR
    ]);

    // ✅ Log restore success
    logEvent("restore_completed", { file, restored: true });

    return { restored: true, dir: RESTORE_DIR };
  } catch (e) {
    // ✅ Log restore error
    logEvent("restore_failed", { file, error: e.message });
    throw e;
  }
}

// === DELETE BACKUP ===
export async function deleteBackup(file) {
  const full = getBackupPath(file);
  try {
    await fs.unlink(full);
    // ✅ Log deletion success
    logEvent("backup_deleted", { file });
    return { deleted: file };
  } catch (e) {
    // ✅ Log deletion failure
    logEvent("delete_failed", { file, error: e.message });
    throw e;
  }
}

// === STATUS ===
export async function status() {
  try {
    const { items } = await listBackups();
    const latest = items[0] || null;
    const result = {
      ok: true,
      dir: BACKUP_DIR,
      count: items.length,
      latest,
      now: new Date().toISOString()
    };

    // ✅ Log status check
    logEvent("status_checked", result);

    return result;
  } catch (e) {
    logEvent("status_failed", { error: e.message });
    throw e;
  }
}
