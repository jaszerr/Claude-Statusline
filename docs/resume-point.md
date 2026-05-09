# Resume Point (May 9, 2026)

## What happened
Patched `statusline.js` to read OAuth credentials from the **macOS Keychain** when the file `~/.claude/.credentials.json` is missing. On a fresh Mac install, Weekly + 5hr segments were silently dropping out because Claude Code on macOS stores creds in the login keychain (service `Claude Code-credentials`), not on disk.

## Fix
- Added `getOAuthToken()` in `statusline.js`. Order: file → macOS Keychain via `security find-generic-password -s "Claude Code-credentials" -w` → null.
- `fetchUsage()` now calls `getOAuthToken()` instead of reading the file directly.
- Synchronous `execFileSync`, 2s timeout, stderr suppressed (avoids stray prompts in stdout).
- First keychain hit may pop a permission dialog; subsequent calls are silent after "Always Allow".

## Verified
- `node statusline.js` with empty cache fetched fresh data and wrote `usage-cache.json` — no prompt (already authorized).
- All 4 segments rendered cleanly: `Context: 35% | Weekly: 5% R:Sat 3PM | 5hr: 3% R:4h37m (2:00AM) | Opus 4.7:xhigh`.
- Source + installed copy in sync via `node install.js`.

## Updated docs
- `CLAUDE.md` — Weekly Usage segment now mentions keychain fallback
- `docs/wiki/usage-api.md` — new "Credential lookup" section with both code paths
- This resume-point

## Cross-platform notes
- **Windows**: `~/.claude/.credentials.json` exists, file path used. Unchanged.
- **macOS**: file does NOT exist by default. Keychain fallback kicks in.
- **Linux**: not tested but file path should work; if Linux Claude Code ever moves to libsecret, add a third branch.

## Next session should
- Consider adding cost segment (`cost.total_cost_usd` in stdin) — still on the list from April
- Consider showing `vim.mode` when enabled
- If `/effort` skill output format ever changes, update the regex in `readEffortFromTranscript`
- If user complains about a Mac keychain permission popup on a different Mac, document the "Always Allow" step
