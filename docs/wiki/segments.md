---
title: "Segments"
date_created: 2026-04-20
date_modified: "2026-07-19 Sunday 20:57:49 +05:30 (Fable weekly segment; model/effort detection overhaul)"
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
- **Source**: `usage-cache.json` -> `seven_day.utilization` + `seven_day.resets_at`
- **Output**: `Weekly: 47% R:Thu 8AM` (prefix `~` if cache >10 min old)
- **Colors**: <50% green, <75% yellow, else red
- Reset formatted as local weekday + hour (no minute precision - 7-day granularity makes minutes noise). Note: real reset can be on the half hour (e.g. 3:30 PM shows as `3PM`); see the resets_at quirk in [[usage-api]].

## 3. Session Usage (`sessionUsageSegment`)
- **Source**: `usage-cache.json` -> `five_hour.utilization` + `five_hour.resets_at`
- **Output**: `5hr: 14% R:3h12m (7:30PM)` (prefix `~` if stale)
- **Reset label**: remaining duration (`3h12m` or `45m`) + local clock time in parens. Added April 2026 because the user wanted a wall-clock answer to "what time does my quota reset" without having to add hours in their head.
- **Colors**: <50% green, <75% yellow, else red

## 4. Fable Weekly (`fableWeeklySegment`) - added 2026-07-19
- **Source**: `usage-cache.json` -> `limits[]` entry with `kind: "weekly_scoped"` and a `scope.model`; label from `scope.model.display_name` (currently "Fable")
- **Output**: `Fable: 9%` (prefix `~` if stale)
- **Colors**: <50% green, <75% yellow, else red
- **No reset label** (user decision): shares the weekly reset already shown in segment 2
- Hides when the cache has no `limits` array (older API format)

## 5. Model + Effort (`modelEffortSegment`)
- **Source**: stdin `model.id` (regex-parsed) + effort detection (transcript -> settings fallback)
- **Output**: `Fable 5:high` (just the model name if no effort resolved)
- **Color**: DIM - this is identification, not a metric; shouldn't compete with usage numbers
- **Model parsing**: `/claude-([a-z]+)-(\d+)(?:-(\d{1,2})(?!\d))?/i` - any family, one- or two-part version (`claude-fable-5` -> `Fable 5`, `claude-opus-4-8` -> `Opus 4.8`); `(?!\d)` keeps 8-digit date suffixes (`claude-haiku-4-5-20251001`) out of the minor slot. Falls back to `model.display_name` if the id doesn't parse.
- **Effort detection** (`readEffortFromTranscript`), overhauled 2026-07-19:
  1. Tail-scan the last 256KB of `transcript_path` for the marker `/model` writes: `"<local-command-stdout>Set model to ... with <level> effort` (level wrapped in ANSI bold, stored as literal backslash-u001b escapes in the JSONL). Latest match wins. The required leading quote filters out quoted copies of the marker inside ordinary messages (they get extra escaping or a different prefix).
  2. Fallback: `~/.claude/settings.json` -> `effortLevel`. /model writes this too ("saved as your default"), so the fallback is usually correct; it is only stale if a different session changed the default afterward.
  3. If neither yields a value, show just the model name.
- **Retired**: the old `Set effort level to <level>` marker (from the /effort skill) never appears in any real transcript - audited 2026-07-19 across all transcripts on the machine (Claude + Codex independently). Do not resurrect it.

## Join behavior
Any segment returning `null` is skipped silently. If *all* segments return null, statusline falls back to `Context: --%` in DIM.

See also: [[usage-api]] for the cache file shape, [[settings-integration]] for the effort-reading pattern.
