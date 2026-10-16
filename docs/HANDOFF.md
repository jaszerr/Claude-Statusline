## 2026-10-03 Saturday 14:35:42 +05:30 - Handoff: Claude Code mods + usage line (source: ad-hoc session)

# Handoff: Claude-Statusline is the home for Claude Code mods

## 1. Project scope (read this first)

This project (`E:\CLAUDE CODE\TOOLS\Claude-Statusline`) is the single home for all Claude Code customization. Do not make a new project for a new mod. It has two parts:

| Part | Folder | Runs in | What it does |
|---|---|---|---|
| Status line | `statusline.js` | Claude Code **CLI** (terminal) | Full usage line under the prompt, via the `statusLine` setting |
| Mods | `mods/<name>/` | Claude Code **desktop app** on Windows and macOS (Code tab), also the CLI | Plugins with function hooks that draw UI or change behavior |

The status line is one part. Mods are the growing part: bands, panes, toasts, guards on tool calls, slash commands, tools. Main target for mods: the **Claude Code Windows desktop app**. macOS is supported too: `install.js` and the mods are cross-platform.

Background on mods: https://claude.dev/blog/getting-started-with-claude-code-mods/ (needs Claude Code 2.1.287 or later; this PC ran 2.1.288 on 2026-10-03).

## 2. Install trigger (Claude: do this without asking)

When the user opens this project and says "install the latest one with what we already have", "install", "set it up on this PC", or "process the handoff", run these steps in order:

1. `git pull` in this project folder.
2. `node install.js`. It:
   - copies `statusline.js` to `~/.claude/statusline.js` and sets `statusLine` in `~/.claude/settings.json`
   - copies every `mods/<name>/` that has `.claude-plugin/plugin.json` to `~/.claude/mods/<name>/`
   - adds each `~/.claude/mods/<name>` to `env.CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json` (only if missing; other settings are kept)
3. For each mod: `claude plugin validate ~/.claude/mods/<name>`. It must say "Validation passed".
4. Check `claude --version` is 2.1.287 or later. If older, tell the user to update Claude Code.
5. Tell the user: open a **new session** in the desktop app to load the mods. A first install of the status line needs a CLI restart.
6. Ask the user for a screenshot of the prompt footer to confirm.

The installer is safe to run again. It overwrites only the installed copies and adds missing settings.

## 2b. Install package for another computer (Windows or macOS) <!-- added: 2026-10-03 Saturday 14:41:08 +05:30 -->

`python make-package.py` builds `dist/claude-usage-line.zip` (git-ignored). Rebuild it after every change to `statusline.js`, `install.js`, the installers, `package/`, or a mod.

| File in the zip | Use |
|---|---|
| `install.cmd` | Windows: double-click after Extract All (SmartScreen: More info > Run anyway) |
| `install.command` | macOS: right-click > Open the first time (Gatekeeper); or `bash install.command` in Terminal. The zip keeps its execute bit. |
| `PROMPT.txt` | Paste into Claude Code (desktop app, folder opened as project) to let Claude install it |
| `README.txt` | Steps for both systems, what changes, how to remove |

Both installers find Node.js, run `node install.js`, validate the mod, and print the next step. Sources: `install.cmd`, `install.command`, `package/README.txt`, `package/PROMPT.txt`. Send the zip by Telegram: `pwsh -NoProfile -File ~/.claude/tools/tg-send.ps1 -File dist/claude-usage-line.zip "caption"`.

macOS notes: `install.command` adds `/opt/homebrew/bin`, `/usr/local/bin`, and nvm to PATH, because a Finder double-click may not load the shell profile. `CLAUDE_CODE_PLUGIN_DIRS` uses the platform separator (`:` on macOS, `;` on Windows); `install.js` uses `path.delimiter`. Tested on 2026-10-03 only with bash on Windows against an empty home folder; not yet on a real Mac.

## 3. Mod 1: usage-footer (desktop app usage line)

Shows usage beside the model name in the Claude Code desktop app (Windows; macOS uses the same `desktop` surface):

```
+ mic v  Auto              c8 | 5h 18% 3h28m | w41/55     Opus 5.5  High  o
```

| Part | Meaning | Color rule |
|---|---|---|
| `c8` | context window 8% used | green under 50, yellow 50-74, red 75+ |
| `5h 18% 3h28m` | 5-hour session 18% used, resets in 3h 28m | green under 50, yellow 50-74, red 75+ |
| `w41/55` | week 41% used / pace 55% | green at/under pace, yellow up to pace +10, red beyond |
| `\|` | separator | gray |
| `~` before `5h` (or before `w` when 5h is missing) | usage data older than 10 minutes | |
| `c--` | no context reading yet (before the first reply) | gray |

Pace (same as `statusline.js`): week start = weekly reset minus 168 hours; pace = hours passed / 168, as a whole percent.

Files:
- `mods/usage-footer/.claude-plugin/plugin.json`: manifest
- `mods/usage-footer/hooks/hooks.json`: points to the module
- `mods/usage-footer/hooks/register.tsx`: the code
- `mods/usage-footer/types/index.d.ts`: the `$.state` contract

How it works:
- Draws by owning the `SessionMode` render component (the footer slot beside the model name), on the `desktop` surface only. The CLI keeps `statusline.js`.
- Data: the OAuth usage API (`https://api.anthropic.com/api/oauth/usage`) through `$.http.fetch` with the session's own login (`$.session.authorize()`), every 5 minutes. Context % from the `session.measure` event. Redraws every minute.

## 4. Desktop app limits found (2026-10-03, Claude Code 2.1.288)

| Spot | Result |
|---|---|
| `SessionMode` (beside the model name) | Works. Caps at about 30 characters, then cuts with "...". Plain spaces at the edges collapse (use no-break spaces). A dim Text nested in a colored Text takes the parent color (use sibling Texts). |
| `AbovePrompt` (band above the input) | Works at full width, but the app draws a gray card around it. A mod cannot remove the card. |
| `PromptHint` (line under the prompt) | Not drawn by the desktop app at all. |

Keep the usage line at 28 characters or fewer. The Fable weekly segment was dropped to fit. Stale data adds one `~`. Mode labels show only when the line stays at 28 or fewer.

### Update: Claude Code 2.1.300 (2026-10-15 Thursday 11:50:38 +05:30)

The desktop app update moved the `SessionMode` slot. Tested with a probe mod and screenshots:

| Spot | Result on 2.1.300 |
|---|---|
| `SessionMode` | Drawn on its own row UNDER the model name, right-aligned. No longer beside it. The full line showed without "...". |
| `SessionMode` with `position="absolute"` and negative `top` | Ignored on desktop. The line stays on its own row. A mod cannot lift it next to the model name. |
| `SessionMode` with a 3-character line (`c10`) | Still on its own row under the model name. Width is not the cause. |
| `AbovePrompt` | Same as 2.1.288: gray card above the input. |
| `PromptHint` | Same as 2.1.288: not drawn. |

No mod slot sits beside the model name on 2.1.300. The line stays in `SessionMode`. Test note: a second mod's `SessionMode` hook never runs, because usage-footer draws the slot without calling `next(e)`.

## 3b. Mod 2: command-usage (short / menu, desktop app only) <!-- added: 2026-10-16 Friday 22:57:46 +05:30 -->

- Goal: the `/` menu in the Windows desktop app shows the commands Jaspal uses most. The CLI menu has no problem, so the CLI is left alone. A mod CANNOT reorder the menu (the app sets the order; `command.describe` only changes the description or hides a command; `prompt.autocomplete` rows draw below the app's rows). So the mod hides the rarely used commands instead.
- How: a `command.run` hook counts each run in `$.store` (`counts`, kept across sessions; CLI and desktop runs both count; plugin-made runs do not). A `command.describe` hook sets `isHidden` on every command outside the top `keep`, but only in the desktop app. Desktop test (updated: 2026-10-16 Friday 23:24:45 +05:30): the app builds the `/` list ONCE, at the first message, before `session.start` and before the `desktop` surface attaches, and it does not list again after `$.ui.invalidate`. So the mod detects the app by `$.env.get('CLAUDE_CODE_ENTRYPOINT') === 'claude-desktop'` (surfaces only as a fallback), and the first `command.describe` imports the seed itself. Before the first message, a new session shows the app's fixed list: the engine is not running yet, so no mod can change it.
- A hidden command still runs when typed in full, but it does not show when you filter the menu either.
- Options (`userConfig`): `keep` (15), `warmup` (25 total runs before anything is hidden), `alwaysShow` (comma list).
- `/cmd-usage` lists the counts. `/cmd-usage all` turns hiding off or on. `/cmd-usage reset` clears the counts. `/cmd-usage import` merges the seed again.
- Seed (updated: 2026-10-16 Friday 23:06:50 +05:30): `install.js` runs `scripts/seed.js` (any mod may ship one) after the copy. It counts slash commands in `~/.claude/history.jsonl` (CLI history, last 90 days) into `~/.claude/mods/command-usage/seed-counts.json`. The mod merges it once at its first session start (`seededAt` in `$.store`; larger number wins), so the short menu works from day one. The mod cannot read history.jsonl itself: it is over the 4 MiB `$.fs.read` limit. The seed file is per PC and git-ignored.
- Tested on desktop 2.1.299 with a probe mod: the desktop menu respects `isHidden`, and `command.run` fires for `/model` and `/effort`. Tests: `claude plugin test mods/command-usage` (8 pass).
- The visible commands keep the app's own order among themselves.

## 5. Add a new mod

1. Make `mods/<new-name>/` with `.claude-plugin/plugin.json`, `hooks/hooks.json`, and `hooks/register.tsx` (load the `plugin-authoring` skill first; it has the API types for the running build).
2. Run `claude plugin validate mods/<new-name>`.
3. Run `node install.js`. No installer change is needed.
4. Open a new session.

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| Line does not show | Open a new session. Check `env.CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`. Run the validator. |
| Line ends with "..." | The text is too long for the slot. Shorten a segment. |
| Line shows `~5h` | The usage API was not reached for 10+ minutes (rate limit or offline). It recovers by itself. |
| Settings broke after install | `install.js` only adds `statusLine` and `env.CLAUDE_CODE_PLUGIN_DIRS`; compare with a backup. |

## 7. Remove a mod

1. Delete `~/.claude/mods/<name>/`.
2. Remove `~/.claude/mods/<name>` from `env.CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`.
3. Delete `mods/<name>/` from this project, or `node install.js` puts it back.
