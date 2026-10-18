# Resume Point

## 2026-10-18 Sunday 21:28:31 +0530 - Session close 2: Mac GitHub push fixed, 4 repos pushed (ad-hoc session)

### What happened
- The push from the Mac failed with 403 three times. Cause: gh held a fine-grained PAT (`github_pat_11BGMRTDA0...`) that could read but not write repo contents.
- A first web login in the Terminal panel stalled: `gh auth login --web` waits for Enter before it polls. A login try in another CLI session only reported "already logged in" and changed nothing.
- Fix: `gh auth login --hostname github.com --git-protocol https --web < /dev/null` in a Terminal panel tab. Jaspal typed the code at https://github.com/login/device. New token `gho_`, scopes gist, read:org, repo.
- Pushed: Claude-Statusline (1668ba6, 5a17d6c), Machines-CLI (3 commits, to a1bae1d), WPO-CLI (1, 7a9f173), Jaspal-Ruby-Admin-CLI (7, 2a48a3c). All 4 repos are private and match their remotes.
- Auto-memory: `mac-github-push-auth` (this project). Lessons log line added.

### Next action
- Mac: get a screenshot of the footer near the model name. It proves usage-footer draws in the Mac desktop app (2.1.299). Note if the line sits beside or under the model name.
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2).
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- On a 403 push from the Mac, check the `Token:` line of `gh auth status` first: `github_pat_` = fine-grained (may lack write), `gho_` = OAuth login.
- "Logged in" in `gh auth status` does not prove push access.
- 8 files show as modified on the Mac only because of CRLF line endings. Before you edit one, check `git diff --ignore-cr-at-eol` is empty, then run `git checkout -- <file>`.


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
