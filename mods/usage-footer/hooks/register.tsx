import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Usage, Window } from '../types'

// Same logic and colors as E:\CLAUDE CODE\TOOLS\Claude-Statusline\statusline.js:
// ctx and 5h use fixed 50/75 thresholds; wk and Fable are colored against the
// even-burn pace (green at/under, yellow up to pace+10, red beyond); pace is dim.

const usage = atom({ plugin: 'usage-footer', key: 'usage' } as const, null)
const ctx = atom({ plugin: 'usage-footer', key: 'ctx' } as const, null)
const tick = atom({ plugin: 'usage-footer', key: 'tick' } as const, 0)

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const FETCH_EVERY = 5 * 60 * 1000 // endpoint is tightly rate-limited
const STALE_AFTER = 10 * 60 * 1000
const HOUR = 3600000
const NBSP = String.fromCharCode(160) // HTML collapses repeated plain spaces
const SEP = `${NBSP}|${NBSP}`

const GREEN = 'green'
const YELLOW = 'yellow'
const RED = 'red'

const fixedColor = (pct: number) => (pct < 50 ? GREEN : pct < 75 ? YELLOW : RED)
const paceColor = (pct: number, pace: number | null) =>
  pace == null ? fixedColor(pct) : pct <= pace ? GREEN : pct <= pace + 10 ? YELLOW : RED

// resets_at can be a second before the real boundary: round to the minute.
const resetMs = (iso: string) => Math.round(new Date(iso).getTime() / 60000) * 60000

function computePace(week: Window | null, now: number) {
  if (!week?.resetsAt) return null
  const start = resetMs(week.resetsAt) - 168 * HOUR
  const hours = Math.min(168, Math.max(0, Math.floor((now - start) / HOUR)))
  return {
    pace: Math.round((hours * 100) / 168),
    day: Math.min(7, Math.max(1, Math.floor(hours / 24) + 1)),
  }
}

function countdown(iso: string, now: number) {
  const mins = Math.floor((resetMs(iso) - now) / 60000)
  if (mins <= 0) return null
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}m`
}

const toWindow = (w: any): Window | null =>
  w && typeof w.utilization === 'number'
    ? { pct: w.utilization, resetsAt: w.resets_at ?? null }
    : null

let lastFetch = 0

async function fetchUsage($: any) {
  const now = await $.clock.now()
  if (now - lastFetch < FETCH_EVERY - 5000) return
  lastFetch = now
  try {
    const auth = await $.session.authorize()
    if (!auth) return
    const res = await $.http.fetch(USAGE_URL, {
      auth: auth.handle,
      headers: { Accept: 'application/json', 'anthropic-beta': 'oauth-2025-04-20' },
    })
    if (!res.ok) return // 429 etc: keep the stale data
    const body = JSON.parse(res.text)
    const scoped = Array.isArray(body.limits)
      ? body.limits.find((l: any) => l.kind === 'weekly_scoped' && l.scope?.model)
      : null
    const next: Usage = {
      fiveHour: toWindow(body.five_hour),
      week: toWindow(body.seven_day),
      fable:
        scoped && typeof scoped.percent === 'number'
          ? { pct: scoped.percent, label: scoped.scope.model.display_name || 'Model' }
          : null,
      fetchedAt: now,
    }
    await update($, usage, () => next)
  } catch {
    // network or JSON error: keep the stale data
  }
}

// Draws the compact usage line for the footer slot beside the model name.
// That slot caps at about 30 characters, so labels are one letter:
// c8 | 5h 18% 3h28m | w41/55  (w = week used / pace).
async function drawLine($: any, e: any) {
  const { Box, Text } = $.ui.resolve(e)
  await read($, tick) // redraw every minute so countdown and pace move
  const u = await read($, usage)
  const c = await read($, ctx)
  const now = await $.clock.now()
  const stale = u && now - u.fetchedAt > STALE_AFTER ? '~' : ''
  const p = computePace(u?.week ?? null, now)

  const parts: { text: string; color?: string }[] = []
  // No context reading until the session's first reply: show a dim placeholder.
  parts.push(c != null ? { text: `c${Math.round(c)}`, color: fixedColor(Math.round(c)) } : { text: 'c--' })
  if (u?.fiveHour) {
    const pct = Math.round(u.fiveHour.pct)
    const left = u.fiveHour.resetsAt ? countdown(u.fiveHour.resetsAt, now) : null
    parts.push({ text: `5h ${stale}${pct}%${left ? ` ${left}` : ''}`, color: fixedColor(pct) })
  }
  if (u?.week) {
    const pct = Math.round(u.week.pct)
    parts.push({ text: `w${stale}${pct}${p ? `/${p.pace}` : ''}`, color: paceColor(pct, p?.pace ?? null) })
  }
  const modes = e.props.modes
  if (modes.length > 0) parts.push({ text: modes.join(' & ') })

  // Separators are sibling Texts (a dim Text nested in a colored one takes
  // the parent's color on desktop), padded with no-break spaces (HTML
  // collapses plain spaces at the edges).
  const row: any[] = []
  parts.forEach((part, i) => {
    if (i > 0) row.push(<Text key={`s${i}`} dimColor>{SEP}</Text>)
    row.push(
      part.color ? (
        <Text key={`p${i}`} color={part.color}>{part.text}</Text>
      ) : (
        <Text key={`p${i}`} dimColor>{part.text}</Text>
      ),
    )
  })

  return <Box flexDirection="row">{row}</Box>
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const out = await next(e)
    void fetchUsage($)
    const u = await $.session.usage().catch(() => null)
    if (u?.context.percent != null) await update($, ctx, () => u.context.percent ?? null)
    $.clock.every(60 * 1000, () => {
      void update($, tick, n => n + 1)
      void fetchUsage($)
    })
    return out
  })

  on('session.measure', async ($, e, next) => {
    if (e.context.percent != null) await update($, ctx, () => e.context.percent ?? null)
    // The engine's own windows fill in until the first API fetch lands.
    if ((await read($, usage)) == null && e.rateLimits.length > 0) {
      const pick = (kind: string): Window | null => {
        const r = e.rateLimits.find(l => l.kind === kind)
        return r ? { pct: r.percentUsed, resetsAt: r.resetsAt ?? null } : null
      }
      const fallback: Usage = {
        fiveHour: pick('five_hour'),
        week: pick('seven_day'),
        fable: null,
        fetchedAt: await $.clock.now(),
      }
      await update($, usage, () => fallback)
    }
    void fetchUsage($)
    return next(e)
  })

  // The footer slot beside the model name, desktop only (the terminal has
  // the statusLine command). Tried and dropped: the AbovePrompt band (the
  // desktop app draws a gray card around it) and the PromptHint line (the
  // desktop app does not draw it).
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    return drawLine($, e)
  })
}
