---
title: "Settings Integration"
date_created: 2026-04-20
date_modified: 2026-04-20
summary: "Reading ~/.claude/settings.json for live config (effort level)"
type: article
---

# Settings Integration

## What we read
`~/.claude/settings.json` → `effortLevel` (values seen: `"xhigh"`, likely also `"high"`, `"medium"`, `"low"`).

Also present but not consumed yet: `alwaysThinkingEnabled`, `permissions`, `hooks`, `enabledPlugins`.

## Why fresh-read every render
Claude Code re-runs `statusline.js` on every assistant message, so reading `settings.json` synchronously inside `modelEffortSegment` picks up mid-session changes (e.g. user toggles effort via a slash command) without any cache-invalidation logic.

Cost: one small file read (~1KB) per render. Trivially under the 100ms budget.

## Graceful fallback
```js
try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  effort = settings.effortLevel;
} catch {
  // settings not readable, skip effort
}
```

If the file is missing, malformed, or `effortLevel` is absent, the segment shows just the model name (`Opus 4.7`) with no suffix. No crash, no log.

## Path resolution
```js
path.join(process.env.HOME || process.env.USERPROFILE, ".claude", "settings.json")
```

Windows has no `HOME` by default — `USERPROFILE` fills in. Same fallback chain used elsewhere in `statusline.js` for `.credentials.json`.

## What NOT to put here
Anything that changes per-session and per-terminal (current model, context %) comes from **stdin**, not settings. Settings is for global, persistent config. Effort fits because it's a global user preference, not a session-local state.

See also: [[segments]] for the consuming segment, [[architecture]] for the stdin-vs-settings split.
