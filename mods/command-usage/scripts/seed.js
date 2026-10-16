#!/usr/bin/env node
// Builds seed-counts.json for the command-usage mod from the CLI prompt
// history (~/.claude/history.jsonl): how often each slash command was run in
// the last DAYS days. The mod merges it into its counts once, so the short
// / menu works from the first session. Zero dependencies.
//
// Usage: node seed.js [modDir] [days]   (install.js runs it after copying)

const fs = require("fs");
const os = require("os");
const path = require("path");

const modDir = process.argv[2] || path.join(__dirname, "..");
const days = Number(process.argv[3] || 90);
const history = path.join(os.homedir(), ".claude", "history.jsonl");
const out = path.join(modDir, "seed-counts.json");

const counts = {};
const since = Date.now() - days * 86400000;
if (fs.existsSync(history)) {
  for (const line of fs.readFileSync(history, "utf8").split("\n")) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (!row || (row.timestamp || 0) < since) continue;
    const m = /^\/([A-Za-z0-9_:.-]+)(\s|$)/.exec(String(row.display || "").trim());
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
}

fs.writeFileSync(out, JSON.stringify({ days, builtAt: new Date().toISOString(), counts }, null, 2) + "\n");
const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`command-usage: seeded ${total} runs of ${Object.keys(counts).length} commands (last ${days} days) -> ${out}`);
