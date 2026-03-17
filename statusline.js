#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const USAGE_CACHE_FILE = path.join(__dirname, "usage-cache.json");
const CREDS_FILE = path.join(process.env.HOME || process.env.USERPROFILE, ".claude", ".credentials.json");

// How often to call the usage API (ms)
const USAGE_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ANSI color codes
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const WHITE = "\x1b[37m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// --- Usage API ---

function readUsageCache() {
  try {
    return JSON.parse(fs.readFileSync(USAGE_CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeUsageCache(data) {
  try {
    fs.writeFileSync(USAGE_CACHE_FILE, JSON.stringify({ ...data, _fetchedAt: Date.now() }));
  } catch {
    // silent
  }
}

function shouldFetchUsage() {
  const cached = readUsageCache();
  if (!cached || !cached._fetchedAt) return true;
  return Date.now() - cached._fetchedAt > USAGE_FETCH_INTERVAL;
}

function fetchUsage() {
  let token;
  try {
    const creds = JSON.parse(fs.readFileSync(CREDS_FILE, "utf8"));
    token = creds.claudeAiOauth?.accessToken;
  } catch {
    return; // no credentials, skip silently
  }
  if (!token) return;

  const req = https.get("https://api.anthropic.com/api/oauth/usage", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "anthropic-beta": "oauth-2025-04-20",
    },
    timeout: 3000,
  }, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        try {
          writeUsageCache(JSON.parse(body));
        } catch {
          // bad JSON, skip
        }
      }
      // On 429 or other errors, keep stale cache (do nothing)
    });
  });
  req.on("error", () => {}); // silent
  req.on("timeout", () => req.destroy());
}

const HOME_DIR = (process.env.HOME || process.env.USERPROFILE || "").replace(/[\\/]+$/, "");
const CLAUDE_JSON = path.join(HOME_DIR, ".claude.json");
const COMMANDS_DIR = path.join(HOME_DIR, ".claude", "commands");

// --- Launcher detection (session-isolated) ---

function detectLauncherProject(data) {
  const sessionId = data?.session_id ?? data?.data?.session_id;
  if (!sessionId) return null;

  // Per-session cache file — prevents cross-tab contamination
  const cacheFile = path.join(__dirname, `.launcher-${sessionId}`);
  try {
    return fs.readFileSync(cacheFile, "utf8") || null;
  } catch {
    // First detection for this session
  }

  // Estimate session start time
  const durationMs = data?.cost?.total_duration_ms
    ?? data?.data?.cost?.total_duration_ms ?? 0;
  const sessionStart = Date.now() - durationMs;

  let skillUsage;
  try {
    skillUsage = JSON.parse(fs.readFileSync(CLAUDE_JSON, "utf8")).skillUsage;
  } catch { /* silent */ }

  let projectName = null;

  if (skillUsage) {
    // Find launcher whose lastUsedAt is CLOSEST to this session's start time
    // (not most recent — that would pick up other tabs' launchers)
    let bestDelta = Infinity;
    try {
      for (const file of fs.readdirSync(COMMANDS_DIR)) {
        if (!file.endsWith(".md")) continue;
        const usage = skillUsage[file.slice(0, -3)];
        if (!usage?.lastUsedAt) continue;
        // Only consider launchers used within 5 min of session start
        const delta = Math.abs(usage.lastUsedAt - sessionStart);
        if (delta > 300000 || delta >= bestDelta) continue;
        const content = fs.readFileSync(path.join(COMMANDS_DIR, file), "utf8");
        const match = content.match(/## Open\s*\n.*?:\s*(.+)/);
        if (!match) continue;
        bestDelta = delta;
        projectName = match[1].trim().replace(/[\\/]+$/, "").split(/[\\/]/).pop() || null;
      }
    } catch { /* silent */ }
  }

  // Only cache positive results — null means "not yet detected", retry next render
  if (projectName) {
    try { fs.writeFileSync(cacheFile, projectName); } catch {}
  }

  // Cleanup session cache files older than 24h
  try {
    const cutoff = Date.now() - 86400000;
    for (const f of fs.readdirSync(__dirname)) {
      if (!f.startsWith(".launcher-")) continue;
      const fp = path.join(__dirname, f);
      if (fs.statSync(fp).mtimeMs < cutoff) fs.unlinkSync(fp);
    }
  } catch { /* silent */ }

  return projectName;
}

// --- Segment functions ---
// Each segment: (data) => { text, color } | null

function directorySegment(data) {
  // Prefer worktree branch when available
  const worktree = data?.worktree?.branch
    ?? data?.data?.worktree?.branch;
  if (worktree) {
    return { text: worktree, color: WHITE };
  }

  // Check project_dir, current_dir, and cwd — use first non-home directory
  const candidates = [
    data?.workspace?.project_dir ?? data?.data?.workspace?.project_dir,
    data?.workspace?.current_dir ?? data?.data?.workspace?.current_dir,
    data?.cwd ?? data?.data?.cwd,
  ];

  for (const dir of candidates) {
    if (!dir) continue;
    const normalized = dir.replace(/[\\/]+$/, "");
    if (HOME_DIR && normalized.toLowerCase() === HOME_DIR.toLowerCase()) continue;
    const basename = normalized.split(/[\\/]/).pop();
    if (basename) return { text: basename, color: WHITE };
  }

  // Home dir — detect project from launcher usage (session-isolated)
  const project = detectLauncherProject(data);
  if (project) return { text: project, color: WHITE };

  return null;
}

function contextSegment(data) {
  const pct = data?.context_window?.used_percentage
    ?? data?.data?.context_window?.used_percentage;
  if (pct == null) return null;

  const rounded = Math.round(pct);
  const color = rounded < 50 ? GREEN : rounded < 75 ? YELLOW : RED;
  return { text: `Context: ${rounded}%`, color };
}

function weeklyUsageSegment() {
  const usage = readUsageCache();
  if (!usage) return null;

  // API returns: seven_day.utilization (0-100), seven_day.resets_at (ISO string)
  const weekly = usage.seven_day?.utilization;

  if (weekly == null) return null;

  const rounded = Math.round(weekly);
  const color = rounded < 50 ? GREEN : rounded < 75 ? YELLOW : RED;

  // Calculate reset info
  let resetLabel = "";
  const resetAt = usage.seven_day?.resets_at;
  if (resetAt) {
    const resetDate = new Date(resetAt);
    const now = new Date();
    const diffMs = resetDate - now;
    if (diffMs > 0) {
      const dayName = resetDate.toLocaleDateString("en-US", { weekday: "short" });
      const hour = resetDate.getHours();
      const timeStr = hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`;
      resetLabel = ` R:${dayName} ${timeStr}`;
    }
  }

  // Stale indicator: show ~ if data is older than 10 minutes
  const stale = usage._fetchedAt && (Date.now() - usage._fetchedAt > 10 * 60 * 1000) ? "~" : "";

  return { text: `Weekly: ${stale}${rounded}%${resetLabel}`, color };
}

const SEGMENTS = [directorySegment, contextSegment, weeklyUsageSegment];

// --- stdin helper ---

function readStdin(timeoutMs = 100) {
  return new Promise((resolve) => {
    let buf = "";
    const timer = setTimeout(() => {
      process.stdin.pause();
      process.stdin.removeAllListeners();
      resolve(buf || null);
    }, timeoutMs);

    process.stdin.setEncoding("utf8");
    process.stdin.resume();
    process.stdin.on("data", (chunk) => (buf += chunk));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(buf || null);
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

// --- main ---

async function main() {
  // Fire off usage API fetch if due (non-blocking)
  if (shouldFetchUsage()) {
    fetchUsage();
  }

  let data = null;

  const raw = await readStdin();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // malformed JSON
    }
  }

  if (!data) {
    process.stdout.write(`${DIM}Context: --%${RESET}`);
    return;
  }

  // Build output from segments
  const parts = [];
  for (const seg of SEGMENTS) {
    const result = seg(data);
    if (result) {
      parts.push(`${result.color}${result.text}${RESET}`);
    }
  }

  if (parts.length === 0) {
    process.stdout.write(`${DIM}Context: --%${RESET}`);
    return;
  }

  process.stdout.write(parts.join(`${DIM} | ${RESET}`));
}

main();
