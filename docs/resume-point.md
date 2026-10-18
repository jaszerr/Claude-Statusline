# Resume Point

## 2026-10-18 Sunday 15:37:38 +0530 - Session close: latest status line installed on the Mac CLI (ad-hoc session)

### What happened
- Ask: install the latest status line in the Mac Claude Code CLI.
- Repo already matched `origin/master` (c8fdba7). Ran `node install.js`: `~/.claude/statusline.js` updated, `statusLine` setting already correct.
- Installer also copied `usage-footer` to `~/.claude/mods/` and added it to `CLAUDE_CODE_PLUGIN_DIRS`. `claude plugin validate`: passed with 1 warning (not read). Claude Code 2.1.302.
- Test render with sample stdin showed all 6 segments (Context, Weekly, 5hr, Fable, Pace, Model+Effort).

### Next action
- Mac: open a new session to load `usage-footer`; check the 1 validate warning.
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2).
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- On the Mac, `git status` shows 9 modified files plus `.claude/`. The 9 files differ only by CRLF line endings (`git diff --ignore-cr-at-eol` is empty). Do not commit them as changes.
- Compare the installed copy with `git show HEAD:statusline.js | diff - <(tr -d '\r' < ~/.claude/statusline.js)`; the blob id differs because the working copy is CRLF.

## 2026-10-16 Friday 23:41:39 +05:30 - Session close: desktop `/` menu by use is not possible (command-usage mod built and removed)

### What happened
- Ask: the Windows desktop `/` menu should show the most used commands first.
- Built `mods/command-usage` (count runs, hide all but the top 15 in the desktop app, seed from CLI history). Fixed the desktop check (`CLAUDE_CODE_ENTRYPOINT`).
- A debug log plus screenshots proved the app ignores `isHidden`. A mod cannot reorder the menu either. Mod removed from repo, `~/.claude/mods`, `CLAUDE_CODE_PLUGIN_DIRS` and the store; install.js seed step reverted. Zip rebuilt.
- Notes: CLAUDE.md (one-line rule), `docs/HANDOFF.md` section 3b, `docs/decisions.md`, wiki [[deployment]], `LESSONS.md` (1 lesson). Commits up to f7799fe, pushed.

### Next action
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2). This also drops command-usage there if it was installed.
- Optional: send `/feedback` in the desktop app asking to sort the `/` menu by use.
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- Desktop `/` menu: the engine asks `command.describe` for every command at the first message, but the app ignores the answer. Before the first message no mod runs at all.
- Never count a prewritten answer button as test proof; ask for a screenshot or read a log.
- Auto mode gave no verdict on the Edit tool for several edits; Bash edits passed their own check. A mod in dev-mods loads only after the user answers the hot-reload question.



## 2026-10-15 Thursday 11:56:34 +05:30 - Session close: desktop 2.1.300 moved the usage line (Windows)

### What happened
- After the app update (Claude Code 2.1.300), the usage-footer line sits on its own row under the model name.
- Tested with a hot-reload probe mod and screenshots: no mod spot on the model row; absolute position ignored; short line still below; AbovePrompt is a gray card; PromptHint not drawn.
- The user chose to leave it there. The lift test code was reverted; installed copy matches the repo. Probe mod deleted. Zip rebuilt.
- Docs: `docs/HANDOFF.md` section 4 (2.1.300 table), `docs/decisions.md` (this date), wiki [[deployment]].

### Next action
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2). No code change this session.
- After each desktop app update, check if the slot moved back beside the model name.
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- usage-footer is loaded through `CLAUDE_CODE_PLUGIN_DIRS`, so an edit needs a new session; hot reload covers only the session's dev-mods folder.
- Mac desktop layout on 2.1.300 not tested.
