# Resume Point (May 16, 2026)

## What happened
Cleared both items on the April feature backlog in one session:
1. **Cost segment** — reads `cost.total_cost_usd` from stdin, formats as `$0.154` / `$1.23` with green/yellow/red at $1/$5 thresholds.
2. **Vim mode indicator** — reads `vim.mode` from stdin, renders `NORMAL`/`INSERT`/`VISUAL`/`REPLACE` etc. with mode-appropriate color (NORMAL dim, INSERT green, VISUAL/COMMAND yellow, REPLACE red).

Both render only when the underlying stdin field is present, so they cost nothing visually when not in use.

## Where the code lives
- `statusline.js` — new functions `costSegment` and `vimModeSegment`; appended to the `SEGMENTS` array after `modelEffortSegment` so the new segments sit at the right end of the status line.
- `CLAUDE.md` — "Current Segments" section now lists 6 segments (cost = 5, vim = 6).
- `docs/wiki/segments.md` — new sections 5 + 6 with full source/output/color spec.
- `docs/wiki/_index.md` — date_modified bumped.
- `COMPETITIVE-AUDIT.md` — Session cost + 5-hour block flipped to HAVE; Vim mode + Reasoning effort added as HAVE rows under Session & Model; Tier 1 backlog struck through where shipped.

## Verified
- `'{"cost":{"total_cost_usd":0.1543},"vim":{"mode":"insert"},...}' | node statusline.js` → all 4 base segments + `$0.154` (green) + `INSERT` (green).
- Cost $7.42 → red.
- Cost 0 → `$0.000` green (not hidden — null means absent, 0 means "session just started").
- Missing `cost` / missing `vim` → segment hidden cleanly.

## Choices worth remembering (not deep enough for a separate decisions doc)
- **No `Cost:` prefix** on the cost segment — `$` is iconic enough, and the status bar is real estate. Other segments use prefixes because their unit (%) is ambiguous; `$X.XX` isn't.
- **3 decimals under $1, 2 decimals at $1+** — small sessions need precision (`$0.005`), large sessions don't (`$12.45`). One-line ternary, no `Intl.NumberFormat`.
- **NORMAL is DIM, not green** — vim's resting state shouldn't pull the eye. Color escalates with mode "danger" (INSERT green = typing, REPLACE red = overwriting).

## Next session should
- **Token count** — still on Tier 1. `context_window.total_input_tokens` + `total_output_tokens` are in stdin. Open question: show as `T:12.3k` combined, or separate `In:8k Out:4k`? Default to combined for compactness.
- **Burn rate** — Tier 3. Needs cross-session state. Possibly extend `usage-cache.json` with a rolling buffer of `(timestamp, cost)` samples; not zero-effort like the other backlog items.
- **State of this worktree**: changes are committed on `claude/clever-hodgkin-a87f8e` and pushed. The worktree itself is still live; the user can merge to `master` when ready or just keep iterating on the branch.

## Files touched this session
- `statusline.js` (+~30 lines: 2 new segment functions + extended SEGMENTS array)
- `CLAUDE.md` (Current Segments section)
- `docs/wiki/segments.md` (sections 5+6 added, date bumped)
- `docs/wiki/_index.md` (date bumped)
- `COMPETITIVE-AUDIT.md` (status flips + tier strike-throughs)
- `docs/resume-point.md` (this file — rewritten)
