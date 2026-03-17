# Resume Point (March 17, 2026)

## What happened
Fixed multi-tab project name contamination in the Directory segment. When 5-10 Claude Code sessions ran simultaneously, launching a new project in one tab would overwrite the project name shown in all other tabs.

## Root causes found (3 bugs)
1. **Shared `cache.json`** - Single file written/read by all sessions. One tab's cached stdin data leaked to others on stdin timeout.
2. **Global launcher detection** - Read `~/.claude.json` `skillUsage` (shared across all sessions) and picked the MOST RECENT launcher, which grabbed other tabs' launchers.
3. **`project_dir` masked `cwd`** - The `??` chain picked `project_dir` (always home dir for launcher sessions) over `cwd` (actual project dir), forcing unnecessary launcher detection.

## What was fixed
- Removed shared `cache.json` entirely (no cross-session stdin leakage)
- Rewrote launcher detection: "closest to session start" heuristic instead of "most recent"
- Per-session cache files (`.launcher-{session_id}`) so detection result is locked per tab
- Only cache positive results (first render happens before launcher runs, must not lock in null)
- Added `workspace.current_dir` as additional candidate in directory resolution
- `.gitignore` updated: removed `cache.json`, added `.launcher-*`

## Decisions
- **Kept launcher detection** (can't remove it -- `workspace.project_dir` and `cwd` both stay as home dir even after launcher's `## Open` changes the working directory)
- **Removed shared stdin cache** (acceptable trade-off: brief "Context: --%" on rare stdin timeouts vs cross-tab data leakage)
- **"Closest to session start" heuristic** chosen over "most recent" because it correctly identifies which launcher belongs to which session when multiple tabs exist

## Status
- User confirmed "looks like working well" but wants to test more across multiple tabs
- If the heuristic fails (e.g., two launchers fired within seconds), may need to explore transcript-based detection as fallback

## Next session should
- Check if the user reported any issues with the fix
- If issues persist, consider reading the session transcript (first few lines) to detect which launcher was used (more reliable than skillUsage timing)
- Consider whether `total_duration_ms` accurately reflects wall-clock session age (affects sessionStart estimation)
