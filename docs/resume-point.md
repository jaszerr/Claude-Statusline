# Resume Point (April 20, 2026)

## What happened
Fixed the Model+Effort segment so it reflects the **live** effort level instead of getting stuck on the launch-time default.

**Bug**: Statusline showed `Opus 4.7:low` even after running `/effort max` — the segment was reading `~/.claude/settings.json` → `effortLevel`, which Claude Code does NOT update when `/effort` runs (it's session-scoped, kept in-memory only).

**Fix**: Added `readEffortFromTranscript()` in `statusline.js`. It tail-scans the last 64KB of the transcript (`transcript_path` from stdin) for `Set effort level to <level>` — the string the `/effort` skill echoes whenever it runs. Latest match wins. Falls back to `settings.json.effortLevel` if no marker present.

## Current state
- `statusline.js`: 4 segments unchanged (Context, Weekly, 5hr, Model+Effort)
- `modelEffortSegment` now calls `readEffortFromTranscript(data?.transcript_path)` first, then falls back to `settings.json`
- CLAUDE.md + wiki (`segments.md`, `settings-integration.md`) updated to document the new detection path
- Source and installed copy in sync (`node install.js`)

## Key decisions this session
- **Transcript tail-scan over hooks**: considered a UserPromptSubmit hook to capture `/effort <level>` invocations, but `/effort` can be interactive (empty args) so the hook would miss cases. Transcript contains the skill's echoed `Set effort level to <X>` regardless of how it was invoked — single source of truth.
- **64KB tail window**: big enough to always contain the latest `/effort` in practice, small enough to stay well under the 100ms budget. Uses `fs.readSync` with explicit position to read only the tail, not the whole transcript.
- **Fallback chain**: transcript marker → settings.json → nothing. Never crashes, never shows stale data silently — if transcript is unavailable the settings value is clearly the launch default.
- **Investigation path**: dumped `data` from stdin to confirm Claude Code does NOT pipe effort in stdin (no `effort`/`thinking`/`budget` field). Confirmed `/effort` writes nothing to `settings.json` or `sessions/*.json`. Only trace is in the transcript.

## Learnings / gotchas
- `/effort <level>` is session-scoped and in-memory only. Don't trust `settings.json.effortLevel` for live state.
- The skill reliably echoes `Set effort level to <level>` into the transcript — stable marker to regex for.
- Bash `echo '... JSON ...' | node statusline.js` on Windows git-bash doesn't reliably pipe stdin within the 100ms window; use `< file.json` redirect for manual tests, or isolate logic into a pure function for unit testing.
- `stdin.transcript_path` uses Windows backslashes — works fine with `fs.openSync` on Node for Windows.

## To update a second PC
```
git pull && node install.js
```
Then restart Claude Code.

## Next session should
- Consider adding cost segment (`cost.total_cost_usd` in stdin)
- Consider showing `vim.mode` when enabled
- If `/effort` skill output format ever changes, update the regex in `readEffortFromTranscript`
