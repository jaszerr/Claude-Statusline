#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const CACHE_FILE = path.join(__dirname, "cache.json");
const USAGE_CACHE_FILE = path.join(__dirname, "usage-cache.json");
const CREDS_FILE = path.join(process.env.HOME || process.env.USERPROFILE, ".claude", ".credentials.json");

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
      const diffH = Math.floor(diffMs / 3600000);
      const diffD = Math.floor(diffH / 24);
      const remainH = diffH % 24;
      const dayName = resetDate.toLocaleDateString("en-US", { weekday: "short" });
      if (diffD > 0) {
        resetLabel = ` R:${dayName}`;
      } else {
        resetLabel = ` R:${remainH}h`;
      }
    }
  }

  // Stale indicator: show ~ if data is older than 10 minutes
  const stale = usage._fetchedAt && (Date.now() - usage._fetchedAt > 10 * 60 * 1000) ? "~" : "";

  return { text: `Weekly: ${stale}${rounded}%${resetLabel}`, color };
}

const SEGMENTS = [contextSegment, weeklyUsageSegment];

// --- stdin / cache helpers ---

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

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch {
    // silent - cache is optional
  }
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
      // malformed JSON - fall through to cache
    }
  }

  if (!data) {
    data = readCache();
  }

  if (!data) {
    process.stdout.write(`${DIM}Context: --%${RESET}`);
    return;
  }

  // Cache on new data (only when we got fresh stdin)
  if (raw) writeCache(data);

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
