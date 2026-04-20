---
title: "Settings Integration"
date_created: 2026-04-20
date_modified: 2026-04-20
summary: "Reading ~/.claude/settings.json for live config (effort level)"
type: article
---

# Settings Integration

## What we read
`~/.claude/settings.json` → `effortLevel` (values seen: `"low"`, `"medium"`, `"high"`, `"xhigh"`, `"max"`).

Also present but not consumed yet: `alwaysThinkingEnabled`, `permissions`, `hooks`, `enabledPlugins`.

## Fallback only — not primary source for effort
`settings.json.effortLevel` is read ONLY as a fallback when the transcript has no `Set effort level to <level>` marker. The primary source is the transcript (see [[segments]] §4). This matters because `/effort <level>` is session-scoped — Claude Code does NOT write it back to `settings.json` — so `settings.json.effortLevel` represents the *launch default*, not the live value.

Before the transcript-tail approach was added (April 2026), the statusline read `settings.json` as the primary source and got stuck on the launch value. User bug report: "the model and model effort is not changing when the effort is updated after launching a session".

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
Anything that changes per-session and per-terminal (current model, context %, current effort) comes from **stdin or the transcript**, not settings. Settings is for global, persistent config — and crucially, it does NOT reflect session-scoped overrides like `/effort`.

See also: [[segments]] for the consuming segment, [[architecture]] for the stdin-vs-settings split.
