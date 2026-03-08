# Claude-Statusline

Minimal, extensible status line for Claude Code. Zero dependencies, single Node.js file.

## Architecture

`statusline.js` uses a **segment array** pattern. Each segment is a function:

```js
function mySegment(data) {
  // data = parsed JSON from Claude Code stdin
  // Return { text: "Label: value", color: "\x1b[32m" } to display
  // Return null to hide this segment
}
```

Segments are joined with a dim ` | ` separator.

## Adding a New Segment

1. Write a segment function in `statusline.js`
2. Push it to the `SEGMENTS` array
3. Done. It appears automatically in the status bar.

## Available stdin Data Fields

Claude Code pipes JSON via stdin every ~150ms. Known fields:

- `context_window.used_percentage` - Context window usage (0-100)
- `data.context_window.used_percentage` - Same, sometimes nested under `data`

## Color Constants

| Variable | Code | Use |
|----------|------|-----|
| GREEN | `\x1b[32m` | Good / low values |
| YELLOW | `\x1b[33m` | Warning / medium |
| RED | `\x1b[31m` | Critical / high |
| DIM | `\x1b[2m` | Separators, inactive |
| RESET | `\x1b[0m` | Always close colors |

## Rules

- Zero npm dependencies. Always.
- Single file (`statusline.js`). No build step.
- Must respond in <100ms (stdin timeout is 100ms).
- Cache last known value to `cache.json` for empty-stdin fallback.
- Bash wrapper lives at `~/.claude/run-statusline.sh` (avoids spaces in path).

## File Locations

- Script: `E:\Claude Code\TOOLS\Claude-Statusline\statusline.js`
- Wrapper: `C:\Users\jsrat\.claude\run-statusline.sh`
- Config: `C:\Users\jsrat\.claude\settings.json` (statusLine key)
