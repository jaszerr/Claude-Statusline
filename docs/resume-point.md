# Resume Point (March 18, 2026)

## What happened
Made statusline portable across PCs. Previously, installation required hardcoded paths (`E:/Claude Code/...`, `C:/Users/jsrat/...`) and a bash wrapper script, which broke on other machines.

## What was fixed
- Removed the `run-statusline.sh` wrapper script from the workflow
- `statusline.js` now gets copied directly to `~/.claude/statusline.js`
- `settings.json` updated to: `"command": "node ~/.claude/statusline.js"` (no hardcoded paths)
- CLAUDE.md updated with new Installation/Deployment section
- Saved install workflow to global memory so future sessions on any PC know the process

## Decisions
- **Project folder = source of truth** for development. `~/.claude/` = installed copy. User explicitly requested this workflow.
- **No wrapper script needed** since `node ~/.claude/statusline.js` works directly (the `~` path avoids spaces-in-path issues that originally motivated the wrapper)

## Status
- Working on this PC with new portable config
- User still wants to validate on the other PC

## Next session should
- If on a different PC, copy `statusline.js` to `~/.claude/` and set up `settings.json`
- Check if multi-tab project name fix (from March 17) is still working well
- Consider whether `usage-cache.json` path needs adjustment (currently uses `__dirname`, which will be `~/.claude/` after install -- mixing cache with config dir)
