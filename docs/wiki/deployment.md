---
title: "Deployment"
date_created: 2026-04-20
date_modified: 2026-04-20
updated_at: "2026-09-26 Saturday 11:43:49 +05:30 (no-restart correction; portable-drive multi-PC sync)"
summary: "install.js workflow, source-of-truth model, multi-PC sync"
type: article
---

# Deployment

## Source of truth
This project folder (`E:/Claude Code/TOOLS/Claude-Statusline/`) is the canonical source. The installed copy at `~/.claude/statusline.js` is a **deployed artifact** — never edit it directly.

## `install.js`
```
node install.js
```

Does three things:
1. Copies `statusline.js` → `~/.claude/statusline.js`
2. Verifies (or patches in) the `statusLine` key in `~/.claude/settings.json`
3. Prints "Restart Claude Code to apply"

Cross-platform (Windows + Mac). No hardcoded paths — uses `os.homedir()`.

## Updating the live statusline mid-session
After editing `statusline.js`, run `node install.js`. No restart is needed: Claude Code spawns a fresh `node ~/.claude/statusline.js` process for every render, so running sessions pick up the new copy on their next render. Only a first install needs one restart, so Claude Code picks up the new `statusLine` setting. (Corrected 2026-09-26 Saturday 11:43:49 +05:30: the old text said the current session kept the old copy until restart.)

## Multi-PC sync
- The E: drive is a portable volume (label `T7`) that moves between the home and office PCs. The repo travels with it. The installed `~/.claude/statusline.js`, the usage cache, credentials, and settings stay per machine. So every fix must be installed on each machine: `git pull --ff-only` (if behind), then `node install.js`.
- Check the code across machines with the git blob id (`git rev-parse HEAD:statusline.js`), not a file sha256: a Windows CRLF checkout changes the sha256. On one machine, compare source and installed sha256 after `node install.js`.
- On a new machine, back up `~/.claude/settings.json` before `node install.js`: `install.js` rewrites an invalid settings.json from `{}`.
- 2026-09-26: two paste-in Claude Code prompts were sent on Telegram (update a machine that has the repo; fresh setup on a machine with nothing). They pin commit `9bed89d` and blob `28b03403...`. See `docs/decisions.md` (2026-09-26 10:42:14). They live outside the repo and go stale after the next `statusline.js` change.

## What NOT to deploy
- `usage-cache.json` — machine-local, regenerated at runtime
- `docs/` — development-only
- `CLAUDE.md` — project memory, not runtime

`install.js` only copies `statusline.js` for this reason.

See also: [[architecture]] for the single-file rule.
