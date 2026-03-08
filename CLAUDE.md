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

## Current Segments

1. **Context** - Context window usage from stdin (`Context: 42%`)
2. **Weekly Usage** - 7-day rolling usage from Anthropic OAuth API (`Weekly: 47% R:Thu`)
   - Fetched every 5 minutes via `https://api.anthropic.com/api/oauth/usage`
   - Requires `anthropic-beta: oauth-2025-04-20` header
   - Uses OAuth token from `~/.claude/.credentials.json`
   - Shows `~` prefix when data is stale (>10 min old)
   - Shows reset day/hours (e.g., `R:Thu` or `R:5h`)

## Adding a New Segment

1. Write a segment function in `statusline.js`
2. Push it to the `SEGMENTS` array
3. Done. It appears automatically in the status bar.

## Available stdin Data Fields

Claude Code pipes JSON via stdin on each assistant message. Known fields:

- `context_window.used_percentage` - Context window usage (0-100)
- `context_window.total_input_tokens` / `total_output_tokens` / `context_window_size`
- `cost.total_cost_usd` - Session cost
- `model.id` / `model.display_name` - Current model
- `workspace.current_dir` / `workspace.project_dir`
- `session_id`, `version`, `transcript_path`
- `worktree.name` / `worktree.branch` (when in worktree)

## OAuth Usage API Response

Endpoint: `GET https://api.anthropic.com/api/oauth/usage`
Header: `anthropic-beta: oauth-2025-04-20`

```json
{
  "five_hour": { "utilization": 22, "resets_at": "ISO-8601" },
  "seven_day": { "utilization": 47, "resets_at": "ISO-8601" },
  "seven_day_opus": { "utilization": null },
  "seven_day_sonnet": { "utilization": null },
  "extra_usage": { "is_enabled": false, "utilization": 0, "used_credits": 0, "monthly_limit": 0 }
}
```

This endpoint is tightly rate-limited. Fetch sparingly (every 5 min). On 429, use stale cache.

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
- Usage API data cached to `usage-cache.json` (fetched every 5 min).
- Bash wrapper lives at `~/.claude/run-statusline.sh` (avoids spaces in path).

## File Locations

- Script: `E:\Claude Code\TOOLS\Claude-Statusline\statusline.js`
- Wrapper: `C:\Users\jsrat\.claude\run-statusline.sh`
- Config: `C:\Users\jsrat\.claude\settings.json` (statusLine key)
- Caches: `cache.json` (stdin), `usage-cache.json` (API)
