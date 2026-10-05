# Resume Point

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

## 2026-10-03 Saturday 18:14:15 +05:30 - Home PC install of status line + usage-footer mod (ad-hoc session)

### What happened
- Earlier session today (not closed): project scope widened to Claude Code mods. Built `mods/usage-footer` (desktop app usage line in the `SessionMode` slot), mod install in `install.js` (`env.CLAUDE_CODE_PLUGIN_DIRS`), `make-package.py` with `install.cmd` / `install.command` / `package/`, and `docs/HANDOFF.md`. CLAUDE.md updated.
- This session: the user said "install". Ran HANDOFF section 2 on the home PC: `git pull` (up to date), `node install.js` (status line copied, mod copied to `~/.claude/mods/usage-footer`, plugin dir added), `claude plugin validate` passed (only warning: no author), `claude --version` 2.1.288.
- The user confirmed the install is done on the home PC.
- This close committed all the mod work (it was uncommitted until now). `.claude/agent-memory/` stays out of git on purpose.
- Detail: `docs/decisions.md` entry 2026-10-03 Saturday 18:14:15 +05:30; wiki [[deployment]] section "Mods (desktop app)".

### Next action
- Office PC: plug in the T7 drive, open this project, say "install" (HANDOFF section 2), open a new session, check the footer.
- Not yet seen: a screenshot of the footer in a new desktop session on the home PC.
- After any change to a mod or installer: `python make-package.py` to rebuild the zip.
- Still open from 2026-09-26: live `:max` check in the bar. The Telegram setup files for other PCs predate mods; use HANDOFF section 2 or the zip instead.

### Backlog (unchanged)
- Cost segment (`cost.total_cost_usd`)
- `vim.mode` display when enabled
- Weekly reset shows `3PM` for a real 3:30 PM reset

### Known gotchas
- Mods load only in a new session.
- Desktop slots (2.1.288): `SessionMode` caps at about 30 characters; `AbovePrompt` gets a gray card; `PromptHint` is not drawn.
- The E: drive is portable; the installed copies are not. Run `node install.js` on each machine.
- Earlier status line gotchas: see the 2026-09-26 entry below and the wiki.
