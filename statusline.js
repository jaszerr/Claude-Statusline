#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "cache.json");

// ANSI color codes
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

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

// Add new segments here, then push to SEGMENTS array
const SEGMENTS = [contextSegment];

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
