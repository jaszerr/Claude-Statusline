---
title: "OAuth Usage API"
date_created: 2026-04-20
date_modified: 2026-04-20
summary: "Anthropic usage endpoint, cache strategy, rate-limit handling"
type: article
---

# OAuth Usage API

## Endpoint
```
GET https://api.anthropic.com/api/oauth/usage
Authorization: Bearer <oauth token>
anthropic-beta: oauth-2025-04-20
```

Token is read from `~/.claude/.credentials.json` → `claudeAiOauth.accessToken`.

## Response shape
```json
{
  "five_hour":       { "utilization": 22, "resets_at": "ISO-8601" },
  "seven_day":       { "utilization": 47, "resets_at": "ISO-8601" },
  "seven_day_opus":  { "utilization": null },
  "seven_day_sonnet":{ "utilization": null },
  "extra_usage":     { "is_enabled": false, "utilization": 0, "used_credits": 0, "monthly_limit": 0 }
}
```

## Cache strategy (`usage-cache.json`)
- File lives next to the installed `statusline.js` (so `~/.claude/usage-cache.json`).
- Shape is the raw API body plus an injected `_fetchedAt` timestamp.
- **Fetch trigger**: `shouldFetchUsage()` returns true when cache is missing OR older than `USAGE_FETCH_INTERVAL` (5 min).
- **Fetch is fire-and-forget**: `fetchUsage()` kicks off the HTTPS request and returns immediately. The statusline uses whatever is on disk. Next render picks up the new value.
- **Stale indicator**: segments prepend `~` to the percentage if `_fetchedAt` is >10 min old (e.g. offline, or API returning 429 for a while).

## Rate limit
The endpoint is tightly rate-limited. On 429 (or any non-200), we intentionally do nothing — the stale cache stays on disk and the `~` indicator appears after 10 min. Do not retry aggressively.

## Why one cache for all sessions
This cache is global/shared across every Claude Code session on the machine — that's fine because the usage data is per-account, not per-session. One fetch every 5 min serves all concurrent terminals.

See also: [[architecture]] for the fire-and-forget pattern, [[segments]] for how values render.
