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

1. **Directory** - Active project folder name (`Whisper v1`, `Jolly-CLI`, etc.)
   - Priority: worktree branch > project_dir > current_dir > cwd (first non-home wins) > launcher detection
   - Launcher detection uses "closest to session start" heuristic (not most recent)
   - Per-session cache files (`.launcher-{session_id}`) prevent cross-tab contamination
   - Old session cache files auto-cleaned after 24h
   - Color: WHITE
2. **Context** - Context window usage from stdin (`Context: 42%`)
3. **Weekly Usage** - 7-day rolling usage from Anthropic OAuth API (`Weekly: 47% R:Thu`)
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
- `workspace.current_dir` / `workspace.project_dir` / `workspace.added_dirs`
- `session_id`, `version`, `transcript_path`, `cwd`
- `cost.total_cost_usd` / `cost.total_duration_ms` / `cost.total_api_duration_ms`
- `cost.total_lines_added` / `cost.total_lines_removed`
- `worktree.name` / `worktree.branch` / `worktree.path` (when in worktree)
- `vim.mode` (when vim mode enabled)
- `agent.name` (when using --agent flag)
- `exceeds_200k_tokens` (boolean)

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
| WHITE | `\x1b[37m` | Directory segment |
| DIM | `\x1b[2m` | Separators, inactive |
| RESET | `\x1b[0m` | Always close colors |

## Rules

- Zero npm dependencies. Always.
- Single file (`statusline.js`). No build step.
- Must respond in <100ms (stdin timeout is 100ms).
- No shared stdin cache between sessions (removed `cache.json`).
- Launcher detection cached per session in `.launcher-{session_id}` files (auto-cleaned after 24h).
- Usage API data cached to `usage-cache.json` (fetched every 5 min, global/shared is fine).
- Bash wrapper lives at `~/.claude/run-statusline.sh` (avoids spaces in path).

## File Locations

- Script: `E:\Claude Code\TOOLS\Claude-Statusline\statusline.js`
- Wrapper: `C:\Users\jsrat\.claude\run-statusline.sh`
- Config: `C:\Users\jsrat\.claude\settings.json` (statusLine key)
- Cache: `usage-cache.json` (API only)
- Competitive audit: `COMPETITIVE-AUDIT.md` (11 projects, feature inventory, priority tiers)
