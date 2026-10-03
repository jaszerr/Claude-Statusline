# Resume Point

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

## 2026-09-26 Saturday 11:43:49 +05:30 - Effort now read from stdin effort.level; setup files for other PCs (Brain Mode session)

## What happened
- Symptom: the Model+Effort label was right in one session and wrong in another. The effort suffix was wrong; the model name was fine.
- Audit (opus-helper-high, read-only), root causes: (1) the `/model` marker leaves the 256KB transcript tail within 1-2 turns, so sessions fell back to `settings.json`; (2) that value is shared by all sessions and never holds `max`, so only the session that saved last was right; (3) this machine (home PC) ran the old build `6d3642...` without the `[1m]` fix. Claude Code 2.1.119+ already sends `effort.level` on stdin.
- Fix (opus-helper): `modelEffortSegment` reads stdin `effort.level` first; `thinking` without `effort` shows the model name only; the legacy transcript + settings chain runs only before 2.1.119. Installed here; source == installed sha256 `c8f34fea...cbcbe`. 5 fixtures pass; about 41 ms per run.
- Committed + pushed: `9bed89d` (fix) and `0a8bb96` (decisions). Blob of `statusline.js`: `28b03403f1c08c2292ef322c5a26825450bac703`.
- Two paste-in setup prompts saved on the Desktop and sent on Telegram: `statusline-update-existing-pc.md` (computers with the repo) and `statusline-fresh-setup-new-pc.md` (the computer with nothing). Tested on this machine in bash, pwsh 7, and PowerShell 5.1. Not tested on a Mac.
- Detail: `docs/decisions.md` entries 2026-09-26 09:51:19 (audit), 10:06:48 (fix), 10:42:14 (push + setup files). Wiki: [[segments]], [[settings-integration]], [[deployment]].

## Next action
- User runs the Telegram setup files: File A on each computer that has the repo, File B on the computer with nothing. Review the closing report each one returns: blob `28b03403...`, `HASH MATCH`, `FIXTURE OK`.
- Live check still open: a session set to `max` must show `:max` in the bar (for example the Ajoni session).
- The untracked `.claude/agent-memory/` folder (helper notebooks) stays out of git on purpose. Decide later: ignore or commit.

## Backlog (unchanged)
- Cost segment (`cost.total_cost_usd`) - on the list since April
- `vim.mode` display when enabled
- Weekly reset shows `3PM` for a real 3:30 PM reset (hour-only format; quirk documented in wiki/usage-api)

## Known gotchas (see docs/decisions.md + wiki for detail)
- The E: drive is portable (T7). The repo travels; the installed copy does not. Run `node install.js` on each machine after a fix.
- Cross-machine code check: `git rev-parse HEAD:statusline.js` (blob id), not a file sha256 (Windows CRLF checkout changes it).
- Updates need no Claude Code restart (fresh `node` process per render). A first install (new `statusLine` setting) needs one.
- Do not rely on transcript scans for per-session state: the `/model` marker falls out of the 256KB tail fast. Use stdin fields.
- Pace shows 99% minutes before the weekly boundary (floor); 100% only at/past it. Intentional.
- Pace is clock-based: `~` on Pace means the reset anchor is old, not the math.
- API `resets_at` returns 09:59:59.64 for a 10:00 boundary - round to the minute for any reset display.

## Previous session

## 2026-09-23 Wednesday 12:16:23 +05:30 - Effort lookup fixed for [1m] model ids

## What happened
- Confirmed this machine was on the latest build (HEAD `f7d7c1d`, installed == source).
- User saw `Opus 5.5:medium`; saved Opus effort is `high`. Cause: stdin id `claude-opus-5-5[1m]` missed the settings key `claude-opus-5-5`, so the stale global `effortLevel` won.
- Fixed in `statusline.js` (`modelEffortSegment` strips a trailing `[...]` tag before the `modelSettings` lookup). Installed via `node install.js`; sha256 `63b5363e...9385` on both copies. Committed + pushed as `bc5de1a`. Docs: CLAUDE.md item 6, `docs/decisions.md`, `docs/wiki/segments.md`, `docs/wiki/settings-integration.md`.

## Next action
- **Other machines:** `git pull` (to include `bc5de1a`) then `node install.js`, then check the effort suffix in a 1M-context Opus session matches `/model`.
- Accepted limit: an effort set by launch flag (not `/model`) is invisible to the bar.

## Previous session
