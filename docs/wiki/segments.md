---
title: "Segments"
date_created: 2026-04-20
date_modified: 2026-04-20
summary: "Every segment in the status line: inputs, output format, color rules"
type: article
---

# Segments

Rendered left-to-right, joined by `DIM | RESET`.

## 1. Context (`contextSegment`)
- **Source**: stdin `context_window.used_percentage`
- **Output**: `Context: 42%`
- **Colors**: <50% green, <75% yellow, else red
- Hidden if stdin didn't deliver a value

## 2. Weekly Usage (`weeklyUsageSegment`)
- **Source**: `usage-cache.json` → `seven_day.utilization` + `seven_day.resets_at`
- **Output**: `Weekly: 47% R:Thu 8AM` (prefix `~` if cache >10 min old)
- **Colors**: <50% green, <75% yellow, else red
- Reset formatted as local weekday + hour (no minute precision — 7-day granularity makes minutes noise)

## 3. Session Usage (`sessionUsageSegment`)
- **Source**: `usage-cache.json` → `five_hour.utilization` + `five_hour.resets_at`
- **Output**: `5hr: 14% R:3h12m (7:30PM)` (prefix `~` if stale)
- **Reset label**: remaining duration (`3h12m` or `45m`) + local clock time in parens. Added April 2026 because the user wanted a wall-clock answer to "what time does my quota reset" without having to add hours in their head.
- **Colors**: <50% green, <75% yellow, else red

## 4. Model + Effort (`modelEffortSegment`)
- **Source**: stdin `model.id` (regex-parsed) + `~/.claude/settings.json` → `effortLevel`
- **Output**: `Opus 4.7:xhigh` (just `Opus 4.7` if `effortLevel` unset)
- **Color**: DIM — this is identification, not a metric; shouldn't compete with usage numbers
- **Model parsing**: regex `/claude-(opus|sonnet|haiku)-(\d+)-(\d+)/i` → `Opus 4.7`. Falls back to `model.display_name` if id doesn't match.
- **Why settings.json each render**: Claude Code re-runs statusline on every assistant message. Reading `settings.json` fresh means `/model` switches and effort-level changes reflect immediately without a restart or cache-bust.

## Join behavior
Any segment returning `null` is skipped silently. If *all* segments return null, statusline falls back to `Context: --%` in DIM.

See also: [[usage-api]] for the cache file shape, [[settings-integration]] for the effort-reading pattern.
