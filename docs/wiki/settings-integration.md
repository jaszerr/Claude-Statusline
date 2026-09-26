---
title: "Settings Integration"
date_created: 2026-04-20
date_modified: 2026-04-20
updated_at: "2026-09-26 Saturday 10:06:48 +05:30 (settings is now a legacy-only effort source; stdin effort.level is primary)"
summary: "Reading ~/.claude/settings.json for effort (legacy fallback for Claude Code older than 2.1.119)"
type: article
---

# Settings Integration

## What we read
`~/.claude/settings.json` -> `modelSettings[<model.id>].effortLevel` first, then the global `effortLevel` as a backstop (values seen: `"low"`, `"medium"`, `"high"`, `"xhigh"`, `"max"`). `/model` writes the per-model key for the model you set; the global key is a separate default that goes stale as soon as a different model's effort is changed. Reading only the global key was the 2026-09-15 bug where a model set to `low` displayed as `medium`.

**Key normalization:** stdin `model.id` can carry a context-window tag (`claude-opus-5-5[1m]`); settings keys never do (`claude-opus-5-5`). Strip `/\[[^\]]*\]$/` before the lookup, or the per-model key misses and the stale global wins. That was the 2026-09-23 bug (`Opus 5.5:medium` for a model saved as `high`). Always test with the real tagged id.

Also present but not consumed yet: `alwaysThinkingEnabled`, `permissions`, `hooks`, `enabledPlugins`.

## Legacy fallback only - not a source for effort on current builds
Since 2026-09-26 the segment reads effort from stdin `effort.level` (Claude Code 2.1.119+), which is the live per-session value. When stdin has `thinking` but no `effort`, the model has no effort setting and the segment shows the model name only. `settings.json` is read ONLY when stdin has neither field (Claude Code older than 2.1.119), and then only after the transcript scan finds no `/model` marker (see [[segments]] section 6).

Why settings cannot be the live source: `modelSettings[<model>].effortLevel` holds whatever the most recent `/model` from ANY session saved, so sessions leak into each other. `max` is session-only and is never written. The 200K and 1M variants of one model share one key.

**Outdated note (kept for history):** this page used to say `/effort` is session-scoped and never written to `settings.json`. That note predates the current `/effort` command, which exists again in Claude Code 2.1.283; its save behavior was not re-checked. Do not rely on the old claim; stdin `effort.level` reflects `/effort` and `/model` changes live, so the segment no longer depends on what is or is not saved.

Before the transcript-tail approach was added (April 2026), the statusline read `settings.json` as the primary source and got stuck on the launch value. User bug report: "the model and model effort is not changing when the effort is updated after launching a session".

## Graceful fallback
```js
try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  const settingsKey = modelId?.replace(/\[[^\]]*\]$/, "");
  effort =
    settings.modelSettings?.[settingsKey]?.effortLevel || settings.effortLevel;
} catch {
  // settings not readable, skip effort
}
```

If the file is missing, malformed, or `effortLevel` is absent, the segment shows just the model name (`Opus 4.7`) with no suffix (legacy path only). No crash, no log.

## Path resolution
```js
path.join(process.env.HOME || process.env.USERPROFILE, ".claude", "settings.json")
```

Windows has no `HOME` by default — `USERPROFILE` fills in. Same fallback chain used elsewhere in `statusline.js` for `.credentials.json`.

## What NOT to put here
Anything that changes per-session and per-terminal (current model, context %, current effort) comes from **stdin** (`effort.level` on 2.1.119+), not settings. Settings is for global, persistent config shared by all sessions, so it cannot show one session's own effort.

See also: [[segments]] for the consuming segment, [[architecture]] for the stdin-vs-settings split.
