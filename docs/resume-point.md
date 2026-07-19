# Resume Point

## 2026-07-19 Sunday 20:57:49 +05:30 - Fable weekly segment + model/effort overhaul

## What happened
1. **New segment**: Fable weekly usage (`Fable: 9%`), between 5hr and Model+Effort. Reads the usage API's new `limits[]` array (`kind: "weekly_scoped"`, model scope); label from `scope.model.display_name`. No reset label (user decision - same reset as Weekly). Hides gracefully on old-format caches.
2. **Model+Effort audit** (user request, run by Claude + Codex independently): segment showed the right thing but only via fallback paths. Both fixes then applied on user's "apply":
   - Model regex widened: any family, one- or two-part version, date suffixes ignored (`claude-fable-5` -> `Fable 5` directly; before, only display_name luck).
   - Effort scan retargeted from the never-fired `Set effort level to <level>` marker (retired /effort skill) to the real `/model` marker (`"<local-command-stdout>Set model to ... with <level> effort`), leading-quote guard against quoted-copy poisoning, tail 64KB -> 256KB.
3. Deployed via `node install.js`; source and `~/.claude/statusline.js` byte-identical. Runtime ~45ms avg.

## Current state
- Working line: `Context: 42% | Weekly: 7% R:Sat 3PM | 5hr: 13% R:3h13m (5:09PM) | Fable: 9% | Fable 5:high`
- All verified with real cache + fixture transcripts (fixture with xhigh marker beats settings-high; poison test on this session's own transcript passes).
- CLAUDE.md, wiki (segments, usage-api, _index), docs/decisions.md all updated this session.
- Committed + pushed at end of session (see git log).

## Next session should
- Consider cost segment (`cost.total_cost_usd`) - still on the list from April
- Consider showing `vim.mode` when enabled
- Weekly segment shows `3PM` for a real 3:30 PM reset (hour-only format + API's :59.9 quirk documented in wiki/usage-api) - fix if user notices
- If effort display ever looks stale: check whether /model's marker text changed (regex in `readEffortFromTranscript`), or whether the change scrolled past the 256KB tail

## Known gotchas (see docs/decisions.md + wiki for detail)
- API `resets_at` returns 09:59:59.64 for a 10:00 boundary - round to minute for display
- Codex `@file` dispatch: Write tool `/tmp` = `<cwd-drive>:/tmp`, Git Bash `/tmp` differs - use absolute Windows paths (stale-file incident 2026-07-19, filed to CC-Wiki tools/claude-codex)
