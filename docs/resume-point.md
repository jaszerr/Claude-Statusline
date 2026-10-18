# Resume Point

## 2026-10-18 Sunday 20:22:00 +0530 - Session close: usage-footer mod installed in the Mac desktop app (ad-hoc session)

### What happened
- Ask: use the mods on this Mac and update the Claude desktop app.
- `git pull`: up to date. The local branch is 1 commit ahead (1668ba6, not pushed).
- `node install.js`: statusline.js and usage-footer copied; `statusLine` and `CLAUDE_CODE_PLUGIN_DIRS` were already set.
- `claude plugin validate ~/.claude/mods/usage-footer`: passed. The 1 warning is only "No author information" in plugin.json (harmless, left as is).
- Installed copies match the repo (statusline.js diff 0 lines, mod folder the same).
- The desktop app runs its own bundled Claude Code 2.1.299 (`~/Library/Application Support/Claude/claude-code/2.1.299/...`). The CLI is 2.1.302. Both are 2.1.287 or later.
- This desktop session started with `CLAUDE_CODE_PLUGIN_DIRS=/Users/jsr/.claude/mods/usage-footer` and `CLAUDE_CODE_ENTRYPOINT=claude-desktop`. No log or screenshot proves the mod drew the line yet.
- Zip rebuilt: `dist/claude-usage-line.zip` (18346 bytes).
- Docs: `docs/HANDOFF.md` section 2 steps 3-4 (author warning, desktop version check), wiki [[deployment]].

### Next action
- Mac: get a screenshot of the footer near the model name. It proves usage-footer draws in the Mac desktop app (2.1.299). Note if the line sits beside or under the model name.
- Push: Mac git creds got 403 on earlier pushes. Push 1668ba6 and this close from a machine with write access, or fix the Mac creds.
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2).
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- `claude --version` shows the CLI version, not the desktop app's. In a desktop session, `ps -o command= -p $PPID` shows the bundled path with its version.
- 9 files show as modified on the Mac only because of CRLF line endings. Before you edit one, check `git diff --ignore-cr-at-eol` is empty, then run `git checkout -- <file>`, so the commit does not carry a line-ending flip.


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
