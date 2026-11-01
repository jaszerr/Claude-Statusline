# Resume Point

## 2026-11-01 Sunday 19:24:26 +05:30 - Session close: usage-footer line fixed for the 2.1.316 desktop cut (ad-hoc session, Brain Mode)

### What happened
- Problem: in the Windows desktop app (Claude Code 2.1.316) the usage-footer line beside the model name was sometimes cut with "..." (`c12 | 5h 19% 2h46m | w48/...`).
- Cause: the app cuts the `SessionMode` slot at a pixel cap (about 24 characters). The old line was 23-28 characters, so it fit only when the numbers were short. The mod has no truncation code and cannot read the slot width.
- Options: A compact line (chosen), B short line plus hover reveal (not proven in this slot), C `truncate-middle` (still cuts). Detail: `docs/decisions.md`.
- Ruler probe in the installed copy only: the app showed `c99 ~5h99% 4:59 w99/99 1...`, so the 22-character worst case fits.
- Shipped in `mods/usage-footer/hooks/register.tsx`: one no-break space between parts, countdown HhMM, `MAX_LINE = 22`. Example: `c13 5h2% 4h53 w49/73`.
- A screenshot proved the H:MM form (`c13 5h2% 4:53 w49/73`) shows in full. Then the countdown changed to `4h53`, because `4:53` read like a clock time.
- Installed on this PC (`node install.js`), validated, `dist/claude-usage-line.zip` rebuilt. Docs: HANDOFF.md sections 3, 4, 6; CLAUDE.md Mod 1 line; decisions.md entry; LESSONS.md line.

### Next action
- This PC: open a new desktop session and screenshot the footer. Confirm the `4h53` form shows in full with no "..." (not seen yet; "h" is a little wider than ":").
- Office PC and Mac: `git pull`, then `node install.js` (HANDOFF section 2).
- Mac: get a screenshot of the footer near the model name (carry-over; proves usage-footer draws in the Mac app).
- Still open: CLI cache vs desktop footer numbers (another account's token?); computePace NaN guard in register.tsx.

### Known gotchas
- The desktop footer layout changes between app versions: 2.1.288 beside the model (about 30 characters), 2.1.300 on its own row, 2.1.316 beside the model (about 24 characters). After an app update that shows "...", rerun the ruler probe (HANDOFF section 4).
- Values of 100% (`5h100%`, `w100/100`) make the line longer than 22 characters, so it can still cut at the hard limits.
- `diff -rq` against the installed mod lists `tsconfig.json` and `.claude-plugin/types`. The engine makes them; they are not code.

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

