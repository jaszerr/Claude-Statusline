---
title: "Deployment"
date_created: 2026-04-20
date_modified: 2026-04-20
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
After editing `statusline.js`, run `node install.js`. The **current** Claude Code session keeps using the old copy until restart; next render of a **new** session picks up the change.

## Multi-PC sync
Home PC + office PC get the same statusline by:
```
git pull && node install.js
```
Then restart Claude Code. All state (cache, credentials, settings) lives in `~/.claude/` per-machine, so no cross-device state leakage.

## What NOT to deploy
- `usage-cache.json` — machine-local, regenerated at runtime
- `docs/` — development-only
- `CLAUDE.md` — project memory, not runtime

`install.js` only copies `statusline.js` for this reason.

See also: [[architecture]] for the single-file rule.
