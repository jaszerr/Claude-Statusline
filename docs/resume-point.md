# Resume Point

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


## 2026-10-05 Monday 14:53:42 +05:30 - Session close: usage-footer truncation fix (Brain Mode session)

### What happened
- The user saw the desktop usage line end in "..." earlier today. Diagnosis (opus-helper-high): no bug. 2-digit context, a `~` on both usage parts, and engine mode labels pushed the line past the about-30-character slot.
- The user chose: keep the `~` but show it once (before `5h`, or before `w` when the 5h part is missing). Mode labels show only when the line stays at 28 or fewer. countdown() has a NaN guard. Rejected: gray color in place of `~` (the user wants the mark), and dropping the `m` from the countdown.
- Installed on this PC (`node install.js`), zip rebuilt, code committed by a helper after /verify and /simplify. Detail: `docs/decisions.md` entry 2026-10-05 Monday 14:49:24 +05:30.

### Next action
- Open a new desktop session and check the line. Open sessions keep the old format.
- Office PC: `git pull`, then `node install.js` (HANDOFF section 2).
- Open question: `~/.claude/usage-cache.json` (written by statusline.js) showed different numbers (5h 0%, wk 15%) than the desktop footer. Check if the CLI status line reads another account's token.
- Small follow-up (not done): computePace in register.tsx has the same weakness as the old countdown. An unparsable resetsAt would show `w41/NaN`. Real API data cannot cause it.

### Known gotchas
- Auto mode: the classifier once gave no verdict on a helper Edit to register.tsx, and that counts as a block. A retry after auto mode was off worked. Never write the file another way to get around a block.
- The mod keeps usage data in per-session memory only; nothing is on disk. After an app restart, all sessions poll on the same 5-minute timer, so one rate limit can make every line stale at once.
- The full max line (c100, ~5h 100% 4h59m, w100/100) is 32 characters and can still cut.


## 2026-10-05 Monday 14:49:24 +05:30 - usage-footer length fix (opus-helper-high, state only)

### What changed
- `mods/usage-footer/hooks/register.tsx`: stale data shows one `~` before `5h` (before `w` when 5h is missing). Mode labels show only when the line stays at 28 or fewer. countdown() guards an unparsable `resets_at`.
- `docs/HANDOFF.md`: updated the `~` row, the section 4 length note, and the troubleshooting `~5h` row.
- This PC: installed (`node install.js`) and the zip rebuilt (`python make-package.py`). Uncommitted. The new format loads only in new sessions.
- Detail: `docs/decisions.md` entry 2026-10-05 Monday 14:49:24 +05:30.
