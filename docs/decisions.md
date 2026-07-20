# Decisions Log

## 2026-07-20 Monday 11:52:26 +05:30 - Weekly Pace benchmark segment (Claude-Statusline session, Brain Mode)

**Pace is a separate segment, not inline per value.** User picked `Pace: 26% D2` as its own segment (between Fable and Model+Effort) over `Weekly: 47%/43%` inline, since Weekly and Fable share the same 7-day window - one benchmark serves both. Rejected: duplicating the pace after each value.

**Pace advances hourly, not in daily steps.** Original spec was day-granular (day x 100/7); user corrected mid-build to hourly: `pace = round(hoursElapsed * 100 / 168)`, clamped 0..168. The `D<n>` label stays day-granular (floor(hours/24)+1, clamped 1..7). Spec change was delivered to the running helper via SendMessage without restarting the task.

**Weekly and Fable are colored against pace, not fixed thresholds.** GREEN at/under pace, YELLOW up to pace+10, RED beyond. The old 50/75 coloring survives only as the fallback when `resets_at` is missing (shared `computePace()` returns null). Segment text unchanged - only color logic moved.

**Pace stays DIM - cyan tried and reverted same session.** User saw the dim Pace as "greyed out, no colors", we shipped bright cyan (`\x1b[96m`), then user understood the model (the benchmark itself never changes color; Weekly/Fable change against it) and asked for the revert. Post-revert file hash equals the pre-cyan hash exactly (`974f6a45...`). Lesson: a dim benchmark next to colored metrics reads as broken to users at first - explain the benchmark-vs-status distinction up front when adding one.

**Gotchas (learnings layer, folded here):**
- Floor semantics: minutes before the weekly boundary pace shows 99%, not 100%; the 168 clamp only fires at/past the boundary. Intentional, matches spec math.
- Pace is clock-based: it keeps advancing when the usage cache is stale (only `resets_at` comes from cache), so the `~` stale marker on Pace means the reset anchor is old, not the pace math.
- Deployed to this machine (`node install.js`) and pushed as `9c85747`; other machines update via the handoff prompt saved at `C:\Users\jsrat\Desktop\update-statusline-pace-prompt.md` (git pull + node install.js + verify).

## 2026-07-19 Sunday 20:57:49 +05:30 - Fable weekly segment + model/effort overhaul (Claude-Statusline session)

**Fable weekly segment reads the new `limits` array, not the old per-model fields.** The usage API (2026-07 shape) added `limits[]`; the model-scoped weekly entry is `kind: "weekly_scoped"` with `scope.model.display_name: "Fable"`. The old `seven_day_opus` / `seven_day_sonnet` top-level fields are all null now. Label comes from the API so it adapts if the scoped model changes. Segment hides when `limits` is absent (old cache format).

**No reset label on the Fable segment** (user decision): it shares the weekly reset already shown in the Weekly segment, so `Fable: 9%` only. The rounding helper (resets_at comes back as 09:59:59.64 for a 10:00 boundary; round to nearest minute) was written, then removed with the label; documented in [[usage-api]] since any future reset display needs it.

**Model regex widened instead of display_name-first.** `claude-fable-5` failed the old `(opus|sonnet|haiku)-(\d+)-(\d+)` regex and only rendered via `display_name` luck. New: `/claude-([a-z]+)-(\d+)(?:-(\d{1,2})(?!\d))?/i` - any family, optional minor, `(?!\d)` keeps 8-digit date suffixes out of the minor slot. `display_name` stays as fallback. Rejected alternative: preferring `display_name` outright (would tie output format to Claude Code's naming whims).

**Effort transcript scan retargeted to the real marker.** Audit (Claude + Codex independently) proved the old `Set effort level to <level>` marker never appears in any transcript on this machine - the /effort skill is retired; effort changes go through /model, which writes `<local-command-stdout>Set model to ... with <level> effort` AND saves `effortLevel` to settings.json. New regex requires the JSONL-structural leading quote before `<local-command-stdout>` so quoted copies of the marker in chat/tool output can't poison the scan (this session's own transcript contains such copies and correctly doesn't match). Tail widened 64KB -> 256KB (runtime still ~45ms). Accepted limitation: a mid-session effort change older than 256KB of transcript falls back to settings - usually still correct because /model writes settings too; only wrong if another session changed the default afterward.

**Codex delegation incident:** first run silently executed a stale 2-day-old instructions file because the Write tool resolves `/tmp` to `<cwd-drive>:/tmp` (E:/tmp) while Git Bash's `/tmp` is a different MSYS directory. Fix: always pass absolute Windows paths for `@file` dispatch. Filed to CC-Wiki `tools/claude-codex.md` and `~/.claude/lessons/codex.md`.
