# Resume Point (March 19, 2026)

## What happened
Rewrote directory segment launcher detection from timing heuristic to transcript-based approach. Added cross-platform install script.

## Root cause found
1. `workspace.*` and `cwd` from Claude Code stdin **always report home directory** regardless of launcher `## Open`. The first part of `directorySegment` (checking workspace fields) never activates for launcher-based sessions.
2. The old `skillUsage` timing heuristic used **global** timestamps shared across all tabs. When multiple tabs opened close together, wrong launchers were attributed to wrong sessions. Proven with debug data:
   - Session using `/claude-statusline` was showing "Jolly-CLI"
   - Session using `/vedic` was showing "Claude-Statusline"

## What was fixed
- **Transcript-based detection**: Reads the session's own transcript file (`transcript_path` from stdin, first 4KB) to find `<command-name>/xxx</command-name>`. Then looks up the command's `## Open` path. Authoritative, per-session, no timing heuristics.
- **Removed `skillUsage` / `CLAUDE_JSON` dependency**: No longer reads `~/.claude.json` or uses timing windows.
- **Install script** (`install.js`): Copies `statusline.js` to `~/.claude/` and updates `settings.json`. Cross-platform (Windows + Mac).
- **Negative caching**: `__none__` cached for sessions without launchers. Transcript is immutable so result is cached permanently after first read.

## Approaches rejected
1. **skillUsage "closest to session start" heuristic** (original approach): Failed because skillUsage is global, not per-session. Multiple tabs opening within seconds caused cross-contamination regardless of time window (tried 5min, then 60s).
2. **5-second warm-up delay**: Added to let `## Open` update workspace fields, but discovered workspace fields NEVER update from home. Irrelevant.
3. **"Earliest after session start" heuristic**: Still failed because other tabs' launchers could be used after this session's start time.

## Key learnings
- `transcript_path` field in stdin is the key. It points to the session-specific JSONL transcript file.
- Transcript structure: first few entries are `progress` (hooks), `file-history-snapshot`, then `user` messages. Launcher `<command-name>` appears in the first user message.
- 4KB read is sufficient to capture the launcher command (tested).
- `fs.openSync` + `fs.readSync` partial read is fast enough for the <100ms budget.

## Status
- Fix deployed on office PC via `node install.js`
- Verified: session `e755b8ae` now correctly shows "Claude-Statusline" (was "Jolly-CLI")

## Next session should
- Validate on home PC: `git pull` then `node install.js`
- Test multi-tab scenario: open 3+ tabs with different launchers simultaneously, confirm all show correct project
- Test session without launcher: should show `__none__` (no project name)
- Consider edge case: what if transcript file doesn't exist yet on first render? (currently catches error, returns null, doesn't cache -- will retry)
