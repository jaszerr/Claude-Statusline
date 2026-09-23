# Decisions Log

## 2026-09-23 Wednesday 12:16:23 +05:30 - Effort lookup fixed for [1m] model ids (Claude-Statusline session)

**Symptom:** live bar showed `Opus 5.5:medium` while `settings.json` held `modelSettings["claude-opus-5-5"].effortLevel = "high"`.

**Cause:** Claude Code passes stdin `model.id` with the context-window tag, e.g. `claude-opus-5-5[1m]`. `/model` saves per-model effort under the bare id (`claude-opus-5-5`). The lookup `modelSettings[modelId]` missed and fell through to the stale global `effortLevel` (`medium`). No `/model` marker was in this session's transcript, so the settings fallback was the only source.

**Fix:** `modelEffortSegment` strips a trailing `[...]` tag before the lookup: `settingsKey = modelId?.replace(/\[[^\]]*\]$/, "")`. Display-name parsing was already unaffected (its regex ignores the suffix). Only one real approach existed, so no options round. Verified: `claude-opus-5-5[1m]` -> high, `claude-opus-5-5` -> high, `claude-fable-5-1` -> low, `claude-sonnet-5` -> medium (no key, global fallback). Installed via `node install.js`, source == installed at sha256 `63b5363e3f8f3029e447303c52c40a6af6c4ad53f96b2c463e326b25575d9385`. Committed and pushed as `bc5de1a`.

**Lesson:** test renders must use the real stdin id. The first check of this session fed `claude-opus-5-5` (no tag) and wrongly looked correct. See [[settings-integration]], [[segments]].

## 2026-09-15 Tuesday 17:37:41 +05:30 - Effort detection fixed and deployed (Claude-Statusline)

**Both proposed fixes applied, installed, and committed.** `statusline.js` now renders `Fable 5.1:low` on this machine; the installed copy matches source at sha256 `6d364276a91310087bee1914a2b9941bccd265eaa648a5fe6b3634bb83abdcd7`.

**Fix 1 - settings fallback prefers the per-model key.** `modelEffortSegment` now reads `settings.modelSettings?.[modelId]?.effortLevel || settings.effortLevel`. `modelId` was already in scope in the same function, so no new plumbing. This is the change that repaired the live symptom: `/model` stores the effort you picked under `modelSettings[<model id>]`, while the top-level `effortLevel` is a separate global default that goes stale as soon as a different model's effort is changed.

**Fix 2 - the marker regex accepts both delimiter forms.** Level is now matched as `(?:\`|\\u001b\[1m)([a-zA-Z]+)(?:\`|\\u001b\[22m)`, and the prefix budget went 160 -> 200 chars to cover the longer backtick wording. The leading-quote guard and the 256KB tail are unchanged.

**Correction to the audit entry below: the ANSI marker form was NOT last seen 2026-09-04.** That claim came from grepping without distinguishing genuine JSONL entries from double-escaped quoted copies of the marker inside ordinary chat text. A proper scan (quote-prefixed, single-backslash ``) finds 13 transcripts with genuine ANSI markers, the newest 2026-08-31, and the backtick form starting 2026-09-02. So the wording changed once, cleanly, around 2026-09-01. Both forms still exist in history, which is why the fix accepts both rather than swapping one for the other. Lesson: when grepping JSONL for a marker, always anchor on the structural leading quote, or quoted copies in prose will masquerade as real entries.

**Tested with four fixtures** (real transcript lines, not synthetic): backtick `low` marker -> `low`; no marker with the model present in `modelSettings` -> `low`; genuine ANSI `medium` marker while `modelSettings` says `low` -> `medium` (proves the transcript still outranks settings and that the ANSI branch works); model absent from `modelSettings` and no marker -> global `medium`.

**No performance cost.** The 256KB tail scan went 0.57 ms -> 0.50 ms per run (20-run average, real 471KB transcript); settings read plus per-model lookup is 0.07 ms. Wall clock is about 103 ms, essentially all of it node process startup (bare `node -e "0"` is about 70 ms on this machine), and the pre-patch build measured the same or slower. The sub-100ms budget refers to the script's own work, which is well inside it.

**The 256KB tail was deliberately left alone.** Widening it to catch markers written early in multi-MB sessions was rejected again: the per-model settings fallback now covers that case correctly, so the tail limit no longer causes a wrong value, only a slower path to the right one.

**Docs corrected in three places, not two.** CLAUDE.md item 6 and `docs/wiki/segments.md` were in scope. `docs/wiki/settings-integration.md` also had to change: it carried a verbatim copy of the exact line that was fixed, plus a stale "What we read" claim naming only the global key. Leaving it would have handed the next session a code snippet contradicting the code.

## 2026-09-15 Tuesday 17:25:30 +05:30 - Effort detection broken: audit findings, no fix applied (Claude-Statusline, read-only audit)

**Symptom reproduced:** the status line shows `Fable 5.1:medium` while `/model` set Fable 5.1 to `low` effort. Source and installed copy are byte-identical (sha256 `974f6a452af066ba3dc407b06f12beb20f2d0cc03ecc6095bb29a26c7dd28edf`), so the installed copy is current and is not the cause.

**Defect 1 (latent): the transcript regex still expects ANSI bold.** `statusline.js:271` requires `with [1m<level>[22m effort`. The Claude Code build in use now writes the level in backticks instead: ``<local-command-stdout>Set model to `Fable 5.1` and saved as your default for new sessions with `low` effort</local-command-stdout>``. Verified byte-for-byte against `~/.claude/projects/E--CLAUDE-CODE-WORK-WPO-CLI/0c42eb22-b2d2-40db-a78b-9fa1b6e1bbd6.jsonl`. Both wordings exist in the transcript history on this machine (ANSI form last seen 2026-09-04, backtick form seen from 2026-09-02 onward), so a fix must accept BOTH forms, not swap one for the other.

**Defect 2 (the active cause): the settings fallback reads the wrong key.** `statusline.js:311` reads top-level `settings.effortLevel`, which is `"medium"`. `/model` now also stores per-model effort under `settings.modelSettings["claude-fable-5-1"].effortLevel`, which is `"low"`. The per-model key is the authoritative one for the running model; the top-level key is a stale global default. This is what produces `medium` in the live session, because that session's transcript contains no `/model` marker at all (effort was set in an earlier session).

**Defect 3 (latent): the 256KB tail can miss the marker.** In the WPO transcript the marker sits at byte offset 4198 of a 2.34MB file, about 2.33MB outside the tail window. Any long session where `/model` ran early loses the transcript signal and depends entirely on the settings fallback, which makes Defect 2 the load-bearing path in practice.

**Decision: fix the settings fallback first, the regex second.** A per-model lookup (`settings.modelSettings?.[modelId]?.effortLevel ?? settings.effortLevel`) repairs the live symptom on its own and is immune to Defect 3. Widening the regex to accept a backtick or the ANSI escape on each side of the level restores same-session mid-session changes. Rejected: scanning the whole transcript instead of a tail, because it breaks the sub-100ms budget on multi-MB files.

**Nothing was changed.** This was a read-only audit: no edits to `statusline.js`, `settings.json`, or any transcript. The two fixes above are proposed, not applied.

## 2026-07-20 Monday 11:52:26 +05:30 - Weekly Pace benchmark segment (Claude-Statusline session, Brain Mode)

**Pace is a separate segment, not inline per value.** User picked `Pace: 26% D2` as its own segment (between Fable and Model+Effort) over `Weekly: 47%/43%` inline, since Weekly and Fable share the same 7-day window - one benchmark serves both. Rejected: duplicating the pace after each value.

**Pace advances hourly, not in daily steps.** Original spec was day-granular (day x 100/7); user corrected mid-build to hourly: `pace = round(hoursElapsed * 100 / 168)`, clamped 0..168. The `D<n>` label stays day-granular (floor(hours/24)+1, clamped 1..7). Spec change was delivered to the running helper via SendMessage without restarting the task.

**Weekly and Fable are colored against pace, not fixed thresholds.** GREEN at/under pace, YELLOW up to pace+10, RED beyond. The old 50/75 coloring survives only as the fallback when `resets_at` is missing (shared `computePace()` returns null). Segment text unchanged - only color logic moved.

**Pace stays DIM - cyan tried and reverted same session.** User saw the dim Pace as "greyed out, no colors", we shipped bright cyan (`\x1b[96m`), then user understood the model (the benchmark itself never changes color; Weekly/Fable change against it) and asked for the revert. Post-revert file hash equals the pre-cyan hash exactly (`974f6a45...`). Lesson: a dim benchmark next to colored metrics reads as broken to users at first - explain the benchmark-vs-status distinction up front when adding one.

**Gotchas (learnings layer, folded here):**
- Floor semantics: minutes before the weekly boundary pace shows 99%, not 100%; the 168 clamp only fires at/past the boundary. Intentional, matches spec math.
- Pace is clock-based: it keeps advancing when the usage cache is stale (only `resets_at` comes from cache), so the `~` stale marker on Pace means the reset anchor is old, not the pace math.
- Deployed to this machine (`node install.js`) and pushed as `9c85747`; other machines update via the handoff prompt saved at `C:\Users\jsrat\Desktop\update-statusline-pace-prompt.md` (git pull + node install.js + verify).

## 2026-07-19 Sunday 20:57:49 +05:30 - Fable weekly segment + model/effort overhaul (Claude-Statusline session)

**Fable weekly segment reads the new `limits` array, not the old per-model fields.** The usage API (2026-07 shape) added `limits[]`; the model-scoped weekly entry is `kind: "weekly_scoped"` with `scope.model.display_name: "Fable"`. The old `seven_day_opus` / `seven_day_sonnet` top-level fields are all null now. Label comes from the API so it adapts if the scoped model changes. Segment hides when `limits` is absent (old cache format).

**No reset label on the Fable segment** (user decision): it shares the weekly reset already shown in the Weekly segment, so `Fable: 9%` only. The rounding helper (resets_at comes back as 09:59:59.64 for a 10:00 boundary; round to nearest minute) was written, then removed with the label; documented in [[usage-api]] since any future reset display needs it.

**Model regex widened instead of display_name-first.** `claude-fable-5` failed the old `(opus|sonnet|haiku)-(\d+)-(\d+)` regex and only rendered via `display_name` luck. New: `/claude-([a-z]+)-(\d+)(?:-(\d{1,2})(?!\d))?/i` - any family, optional minor, `(?!\d)` keeps 8-digit date suffixes out of the minor slot. `display_name` stays as fallback. Rejected alternative: preferring `display_name` outright (would tie output format to Claude Code's naming whims).

**Effort transcript scan retargeted to the real marker.** Audit (Claude + Codex independently) proved the old `Set effort level to <level>` marker never appears in any transcript on this machine - the /effort skill is retired; effort changes go through /model, which writes `<local-command-stdout>Set model to ... with <level> effort` AND saves `effortLevel` to settings.json. New regex requires the JSONL-structural leading quote before `<local-command-stdout>` so quoted copies of the marker in chat/tool output can't poison the scan (this session's own transcript contains such copies and correctly doesn't match). Tail widened 64KB -> 256KB (runtime still ~45ms). Accepted limitation: a mid-session effort change older than 256KB of transcript falls back to settings - usually still correct because /model writes settings too; only wrong if another session changed the default afterward.

**Codex delegation incident:** first run silently executed a stale 2-day-old instructions file because the Write tool resolves `/tmp` to `<cwd-drive>:/tmp` (E:/tmp) while Git Bash's `/tmp` is a different MSYS directory. Fix: always pass absolute Windows paths for `@file` dispatch. Filed to CC-Wiki `tools/claude-codex.md` and `~/.claude/lessons/codex.md`.
