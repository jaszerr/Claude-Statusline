---
title: "Architecture"
date_created: 2026-04-20
date_modified: 2026-04-20
summary: "Segment-array pattern, stdin contract, and performance budget"
type: article
---

# Architecture

## Segment array pattern
`statusline.js` holds a `SEGMENTS` array of functions. Each function takes the parsed stdin `data` and returns `{ text, color }` or `null` (to hide).

```js
const SEGMENTS = [contextSegment, weeklyUsageSegment, sessionUsageSegment, modelEffortSegment];
```

To add a segment: write a function, push it to the array. No other wiring needed. Segments render left-to-right, joined by a dim ` | ` separator.

## stdin contract
Claude Code pipes a JSON blob to stdin on every assistant message. Read with a 100ms timeout — if stdin delivers nothing (e.g. cold launch), we fall back to `Context: --%`.

Fields we currently consume:
- `context_window.used_percentage` — context segment
- `model.id` / `model.display_name` — model segment
- (plus cached API data from `usage-cache.json`)

Full known-fields list lives in `CLAUDE.md`.

## Performance budget
- **Hard limit**: 100ms from launch to stdout write (stdin timeout enforces this).
- **Zero npm deps**: only Node built-ins (`fs`, `path`, `https`).
- **No blocking I/O in hot path**: usage-API fetch is fire-and-forget; statusline reads the cache file.
- **Settings reads**: `~/.claude/settings.json` is read synchronously on each render. Trivial cost (<1ms), and avoids a cache invalidation bug where mid-session setting changes wouldn't show up.

## File layout
- `statusline.js` — source of truth, all logic in one file
- `install.js` — copies `statusline.js` to `~/.claude/` and wires `settings.json`
- `usage-cache.json` — written next to the installed copy; stores API response + `_fetchedAt`

See also: [[segments]], [[usage-api]], [[settings-integration]]
