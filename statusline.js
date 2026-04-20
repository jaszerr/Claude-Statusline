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

function modelEffortSegment(data) {
  const modelId = data?.model?.id;
  const displayName = data?.model?.display_name;

  let modelName = null;
  if (modelId) {
    const m = modelId.match(/claude-(opus|sonnet|haiku)-(\d+)-(\d+)/i);
    if (m) {
      const family = m[1][0].toUpperCase() + m[1].slice(1);
      modelName = `${family} ${m[2]}.${m[3]}`;
    }
  }
  if (!modelName && displayName) modelName = displayName;
  if (!modelName) return null;

  let effort = null;
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

  const text = effort ? `${modelName}:${effort}` : modelName;
  return { text, color: DIM };
}

const SEGMENTS = [contextSegment, weeklyUsageSegment, sessionUsageSegment, modelEffortSegment];

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
