# Resume Point (March 19, 2026)

## What happened
Fixed directory segment leaking across tabs and added cross-platform install script.

## What was fixed
- **Directory leaking**: Three root causes addressed in `detectLauncherProject`:
  1. No negative caching -- sessions without launchers kept re-probing every render, eventually picking up another tab's launcher. Now caches `__none__` on first detection.
  2. 5-minute detection window was too wide -- two tabs starting within 5 min contaminated each other. Tightened to 60 seconds.
  3. No warm-up period -- first render ran before `## Open` updated `workspace.current_dir`, causing premature detection with wrong results. Now skips detection until session is 5+ seconds old.
- **Install script**: Created `install.js` -- copies `statusline.js` to `~/.claude/` and updates `settings.json`. Works on Windows + Mac. Run `node install.js` on any new PC.

## Status
- Fix deployed on office PC via `node install.js`
- Restart Claude Code to apply

## Next session should
- Validate multi-tab behavior: open 2+ tabs with different launchers, confirm correct project names
- Test plain session (no launcher) -- should show nothing, not leak another tab's project
