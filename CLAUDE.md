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
   - OAuth token via `getOAuthToken()`: tries `~/.claude/.credentials.json` first (Windows/Linux), then macOS Keychain `security find-generic-password -s "Claude Code-credentials" -w`. Mac CC stores creds in keychain, not on disk.
   - Shows `~` prefix when data is stale (>10 min old)
   - Shows reset day/time (e.g., `R:Thu 8AM`)
3. **Session Usage** - 5-hour rolling usage from same API (`5hr: 14% R:3h12m (7:30PM)`)
   - Uses `five_hour.utilization` and `five_hour.resets_at` from the usage API
   - Shows remaining time + local clock time of reset
   - Same stale indicator and color thresholds as weekly
4. **Fable Weekly** - Model-scoped weekly usage (`Fable: 9%`)
   - From the usage API's `limits` array: entry with `kind: "weekly_scoped"` and a `scope.model`; label comes from `scope.model.display_name`
   - Hides when the cache has no `limits` array (older API format)
   - No reset label (same weekly reset already shown in the Weekly segment)
   - Same stale indicator as weekly; colored pace-relative (see Pace)
5. **Pace** - Even-burn benchmark for the weekly window (`Pace: 26% D2`)
   - `computePace()`: window start = `seven_day.resets_at` minus 7 days; pace = `round(hoursElapsed * 100 / 168)` (advances hourly, clamped 0..168); `D<n>` = day of window 1-7
   - Clock-based, so it keeps advancing on a stale cache; only `resets_at` comes from cache. Hides when `resets_at` is missing.
   - Color: DIM always (it is the benchmark, not a status). Weekly and Fable are colored against it: GREEN at/under pace, YELLOW up to pace+10, RED beyond; they fall back to the old 50/75 thresholds when pace is unavailable.
6. **Model + Effort** - Current model and reasoning effort (`Fable 5:high`)
   - Model parsed from stdin `model.id`: any family, one- or two-part version (`claude-fable-5` -> `Fable 5`, `claude-opus-4-8` -> `Opus 4.8`); 8-digit date suffixes ignored. Falls back to `model.display_name` if the id doesn't parse.
   - Effort: tail-scans the last 256KB of the transcript (`transcript_path` from stdin) for the marker `/model` writes: a `<local-command-stdout>Set model to ... with <level> effort` line (level wrapped in ANSI bold, stored as literal backslash-u001b escapes in the JSONL). Last match wins; a leading quote in the pattern filters out quoted copies of the marker in ordinary messages. Falls back to `~/.claude/settings.json` `effortLevel` (which `/model` also updates, "saved as your default"). The old `Set effort level to <level>` marker from the retired `/effort` skill never appears in real transcripts and is no longer scanned.

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
  "extra_usage": { "is_enabled": false, "utilization": 0, "used_credits": 0, "monthly_limit": 0 },
  "limits": [
    { "kind": "session", "group": "session", "percent": 8, "resets_at": "ISO-8601", "scope": null },
    { "kind": "weekly_all", "group": "weekly", "percent": 6, "resets_at": "ISO-8601", "scope": null },
    { "kind": "weekly_scoped", "group": "weekly", "percent": 8, "resets_at": "ISO-8601",
      "scope": { "model": { "id": null, "display_name": "Fable" }, "surface": null } }
  ]
}
```

The `limits` array is the newer shape (2026-07); the old per-model top-level fields (`seven_day_opus` etc.) are now null. `resets_at` may be a second before the real boundary (09:59:59.64 for 10:00) - round to the minute for display.

This endpoint is tightly rate-limited. Fetch sparingly (every 5 min). On 429, use stale cache.

## Color Constants

| Variable | Code | Use |
|----------|------|-----|
| GREEN | `\x1b[32m` | Good / low values |
| YELLOW | `\x1b[33m` | Warning / medium |
| RED | `\x1b[31m` | Critical / high |
| DIM | `\x1b[2m` | Separators, inactive, benchmark segments (Pace, Model+Effort) |
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

## Session Start Checklist

On every session start, automatically read these files (if they exist):
1. `docs/wiki/_index.md` -- compiled project knowledge
2. `docs/wiki/_questions.md` -- surface unresolved questions to user
3. `docs/resume-point.md` (or `CURRENT-STATUS.md` or `workspace/current-session.md`) -- resume where last session left off
4. `docs/operations/action-log.md` -- pending items
5. `docs/operations/active-threads.md` -- ongoing decisions

## File Locations

- Source (development): `statusline.js` (this project folder)
- Installed copy: `~/.claude/statusline.js`
- Config: `~/.claude/settings.json` (statusLine key)
- Cache: `usage-cache.json` (API only, in project dir on installed copy's dir)
- Competitive audit: `COMPETITIVE-AUDIT.md` (11 projects, feature inventory, priority tiers)
