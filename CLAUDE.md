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
2. **Weekly Usage** - 7-day rolling usage from Anthropic OAuth API (`Weekly: 47% R:Thu 8AM`)
   - Fetched every 5 minutes via `https://api.anthropic.com/api/oauth/usage`
   - Requires `anthropic-beta: oauth-2025-04-20` header
   - Uses OAuth token from `~/.claude/.credentials.json`
   - Shows `~` prefix when data is stale (>10 min old)
   - Shows reset day/time (e.g., `R:Thu 8AM`)
3. **Session Usage** - 5-hour rolling usage from same API (`5hr: 14% R:3h12m`)
   - Uses `five_hour.utilization` and `five_hour.resets_at` from the usage API
   - Shows remaining time until reset (e.g., `R:3h12m` or `R:45m`)
   - Same stale indicator and color thresholds as weekly

## Deep Context

| File | Purpose | Load When |
|------|---------|-----------|
| `docs/resume-point.md` | Session state, next actions | Session start |
| `COMPETITIVE-AUDIT.md` | 11 projects, feature inventory, priority tiers | Planning new features |

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
| DIM | `\x1b[2m` | Separators, inactive |
| RESET | `\x1b[0m` | Always close colors |

## Rules

- Zero npm dependencies. Always.
- Single file (`statusline.js`). No build step.
- Must respond in <100ms (stdin timeout is 100ms).
- No shared stdin cache between sessions (removed `cache.json`).
- Usage API data cached to `usage-cache.json` (fetched every 5 min, global/shared is fine).

## Installation / Deployment

This project folder is the **source of truth**. To install or update on any PC:

```
node install.js
```

This copies `statusline.js` to `~/.claude/` and sets up `settings.json` automatically.
Cross-platform (Windows + Mac). Restart Claude Code after running.

Manual alternative:
1. Copy `statusline.js` to `~/.claude/statusline.js`
2. Ensure `settings.json` has: `"statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }`

## File Locations

- Source (development): `statusline.js` (this project folder)
- Installed copy: `~/.claude/statusline.js`
- Config: `~/.claude/settings.json` (statusLine key)
- Cache: `usage-cache.json` (API only, in project dir on installed copy's dir)
- Competitive audit: `COMPETITIVE-AUDIT.md` (11 projects, feature inventory, priority tiers)
