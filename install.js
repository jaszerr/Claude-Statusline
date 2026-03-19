#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const SOURCE = path.join(__dirname, "statusline.js");
const DEST = path.join(CLAUDE_DIR, "statusline.js");
const SETTINGS = path.join(CLAUDE_DIR, "settings.json");

// Ensure ~/.claude/ exists
if (!fs.existsSync(CLAUDE_DIR)) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
}

// Copy statusline.js
fs.copyFileSync(SOURCE, DEST);
console.log(`Copied statusline.js -> ${DEST}`);

// Update settings.json
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(SETTINGS, "utf8"));
} catch {
  // No settings file or invalid JSON
}

const statusLineConfig = {
  type: "command",
  command: "node ~/.claude/statusline.js",
};

const current = JSON.stringify(settings.statusLine || {});
const desired = JSON.stringify(statusLineConfig);

if (current !== desired) {
  settings.statusLine = statusLineConfig;
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + "\n");
  console.log("Updated settings.json with statusLine config");
} else {
  console.log("settings.json already has correct statusLine config");
}

console.log("Done! Restart Claude Code to apply.");
