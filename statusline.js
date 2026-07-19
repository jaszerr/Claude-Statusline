#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const USAGE_CACHE_FILE = path.join(__dirname, "usage-cache.json");
const CREDS_FILE = path.join(process.env.HOME || process.env.USERPROFILE, ".claude", ".credentials.json");
const KEYCHAIN_SERVICE = "Claude Code-credentials";

// How often to call the usage API (ms)
const USAGE_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ANSI color codes
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
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

function getOAuthToken() {
  // 1. File-based credentials (Windows/Linux, also any Mac with the legacy file)
  try {
    const creds = JSON.parse(fs.readFileSync(CREDS_FILE, "utf8"));
    const token = creds.claudeAiOauth?.accessToken;
    if (token) return token;
  } catch {
    // file missing or unreadable, fall through
  }

  // 2. macOS Keychain fallback (Claude Code on macOS stores creds here, not on disk)
  if (process.platform === "darwin") {
    try {
      const json = execFileSync(
        "security",
        ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"],
        { encoding: "utf8", timeout: 2000, stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
      const creds = JSON.parse(json);
      return creds.claudeAiOauth?.accessToken || null;
    } catch {
      // keychain access denied / item missing
    }
  }

  return null;
}

function fetchUsage() {
  const token = getOAuthToken();
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

// --- Segment functions ---
// Each segment: (data) => { text, color } | null

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

function sessionUsageSegment() {
  const usage = readUsageCache();
  if (!usage) return null;

  const session = usage.five_hour?.utilization;
  if (session == null) return null;

  const rounded = Math.round(session);
  const color = rounded < 50 ? GREEN : rounded < 75 ? YELLOW : RED;

  // Calculate reset time remaining + local clock time
  let resetLabel = "";
  const resetAt = usage.five_hour?.resets_at;
  if (resetAt) {
    const resetDate = new Date(resetAt);
    const diffMs = resetDate - new Date();
    if (diffMs > 0) {
      const totalMin = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      const remaining = hrs > 0 ? `${hrs}h${mins}m` : `${mins}m`;

      const h = resetDate.getHours();
      const m = resetDate.getMinutes();
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const clock = `${hour12}:${String(m).padStart(2, "0")}${ampm}`;

      resetLabel = ` R:${remaining} (${clock})`;
    }
  }

  // Stale indicator
  const stale = usage._fetchedAt && (Date.now() - usage._fetchedAt > 10 * 60 * 1000) ? "~" : "";

  return { text: `5hr: ${stale}${rounded}%${resetLabel}`, color };
}

function fableWeeklySegment() {
  const usage = readUsageCache();
  if (!usage || !Array.isArray(usage.limits)) return null;

  // Model-scoped weekly limit (e.g. Fable) from the limits array
  const scoped = usage.limits.find(
    (l) => l.kind === "weekly_scoped" && l.scope?.model
  );
  if (!scoped || scoped.percent == null) return null;

  const label = scoped.scope.model.display_name || "Model";
  const rounded = Math.round(scoped.percent);
  const color = rounded < 50 ? GREEN : rounded < 75 ? YELLOW : RED;

  // No reset label: same weekly reset already shown in the Weekly segment

  // Stale indicator
  const stale = usage._fetchedAt && (Date.now() - usage._fetchedAt > 10 * 60 * 1000) ? "~" : "";

  return { text: `${label}: ${stale}${rounded}%`, color };
}

function readEffortFromTranscript(transcriptPath) {
  // Effort changes go through /model, which echoes a marker line into the
  // transcript. Tail-scan for the last one so mid-session changes show
  // per-session; settings.json only has the saved default.
  if (!transcriptPath) return null;
  try {
    const fd = fs.openSync(transcriptPath, "r");
    try {
      const size = fs.fstatSync(fd).size;
      const readBytes = Math.min(size, 256 * 1024);
      const buf = Buffer.alloc(readBytes);
      fs.readSync(fd, buf, 0, readBytes, size - readBytes);
      const text = buf.toString("utf8");
      // Effort marker: /model writes a local-command-stdout entry like
      //   <local-command-stdout>Set model to ESC[1mFable 5ESC[22m and saved as
      //   your default for new sessions with ESC[1mhighESC[22m effort
      // In raw JSONL bytes ESC is the 6-char JSON escape (backslash-u001b). The leading quote
      // distinguishes real entries from copies of the marker quoted inside
      // other messages (which get extra escaping or a different prefix).
      const re = /"<local-command-stdout>Set model to [^"]{0,160}? with \\u001b\[1m([a-zA-Z]+)\\u001b\[22m effort/g;
      let m;
      let last = null;
      while ((m = re.exec(text))) last = m[1];
      if (last) return last;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // transcript missing or unreadable
  }
  return null;
}

function modelEffortSegment(data) {
  const modelId = data?.model?.id;
  const displayName = data?.model?.display_name;

  let modelName = null;
  if (modelId) {
    // Any family, one- or two-part version; (?!\d) keeps 8-digit date
    // suffixes (claude-haiku-4-5-20251001) out of the minor slot
    const m = modelId.match(/claude-([a-z]+)-(\d+)(?:-(\d{1,2})(?!\d))?/i);
    if (m) {
      const family = m[1][0].toUpperCase() + m[1].slice(1);
      modelName = m[3] ? `${family} ${m[2]}.${m[3]}` : `${family} ${m[2]}`;
    }
  }
  if (!modelName && displayName) modelName = displayName;
  if (!modelName) return null;

  let effort = readEffortFromTranscript(data?.transcript_path);
  if (!effort) {
    try {
      const settingsPath = path.join(
        process.env.HOME || process.env.USERPROFILE,
        ".claude",
        "settings.json"
      );
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      effort = settings.effortLevel;
    } catch {
      // settings not readable, skip effort
    }
  }

  const text = effort ? `${modelName}:${effort}` : modelName;
  return { text, color: DIM };
}

const SEGMENTS = [contextSegment, weeklyUsageSegment, sessionUsageSegment, fableWeeklySegment, modelEffortSegment];

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
