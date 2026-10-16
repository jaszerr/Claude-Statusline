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

let changed = false;
if (current !== desired) {
  settings.statusLine = statusLineConfig;
  changed = true;
  console.log("Set statusLine config");
} else {
  console.log("settings.json already has correct statusLine config");
}

// Claude Code mods: every folder in ./mods that has a plugin manifest is
// copied to ~/.claude/mods/<name> and loaded in every session via
// CLAUDE_CODE_PLUGIN_DIRS in the settings env block. A new mod needs only a
// new folder here; this script picks it up.
const MODS_SRC = path.join(__dirname, "mods");
const MODS_DEST = path.join(CLAUDE_DIR, "mods");
const mods = fs.existsSync(MODS_SRC)
  ? fs
      .readdirSync(MODS_SRC, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .filter((d) => fs.existsSync(path.join(MODS_SRC, d.name, ".claude-plugin", "plugin.json")))
      .map((d) => d.name)
  : [];

settings.env = settings.env || {};
const dirs = (settings.env.CLAUDE_CODE_PLUGIN_DIRS || "")
  .split(path.delimiter)
  .filter(Boolean);

for (const name of mods) {
  const dest = path.join(MODS_DEST, name);
  fs.rmSync(dest, { recursive: true, force: true });
  // Skip macOS resource-fork files (._*) the portable exFAT drive creates
  fs.cpSync(path.join(MODS_SRC, name), dest, {
    recursive: true,
    filter: (src) => !path.basename(src).startsWith("._"),
  });
  console.log(`Copied mod ${name} -> ${dest}`);

  const entry = `~/.claude/mods/${name}`;
  if (!dirs.includes(entry)) {
    dirs.push(entry);
    changed = true;
    console.log(`Added ${entry} to env.CLAUDE_CODE_PLUGIN_DIRS`);
  } else {
    console.log(`env.CLAUDE_CODE_PLUGIN_DIRS already has ${entry}`);
  }
}
if (dirs.length > 0) settings.env.CLAUDE_CODE_PLUGIN_DIRS = dirs.join(path.delimiter);

if (changed) {
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + "\n");
  console.log("Updated settings.json");
}

console.log(
  "Done! Status line: restart the Claude Code CLI after a first install. " +
    "Mods: open a new session (desktop app or CLI) to load them."
);
