import type { Register } from 'claude-code'

// Counts each slash command the person runs ($.store, kept across sessions)
// and, in the desktop app only, hides every command outside the top `keep`
// from the / menu. The CLI just counts. A hidden command still runs when
// typed in full.

const SELF = 'cmd-usage'
type Counts = Record<string, number>

function asCounts(value: unknown): Counts {
  return value && typeof value === 'object' ? { ...(value as Counts) } : {}
}

export const register: Register = (on, options) => {
  const keep = Math.max(1, Number(options.keep ?? 15))
  const warmup = Math.max(0, Number(options.warmup ?? 25))
  const always = new Set(
    String(options.alwaysShow ?? '')
      .split(',')
      .map(s => s.trim().replace(/^\//, ''))
      .filter(Boolean),
  )

  // The names the menu shows, or null when it shows everything.
  const visible = (counts: Counts, showAll: boolean): Set<string> | null => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    if (showAll || total < warmup) return null
    const top = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, keep)
      .map(([name]) => name)
    return new Set([...top, ...always, SELF])
  }

  const sameSet = (a: Set<string> | null, b: Set<string> | null) =>
    a === b || (!!a && !!b && a.size === b.size && [...a].every(x => b.has(x)))

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: SELF,
      description: 'Command use counts. Args: all (show/hide the full menu), reset',
    })
    return next(e)
  })

  // The desktop app can attach after the first listing: list again.
  on('session.attach', { surface: 'desktop' }, async ($, e, next) => {
    const out = await next(e)
    $.ui.invalidate('command.describe')
    return out
  })

  on('command.describe', async ($, e, next) => {
    const out = await next(e)
    if (!(await $.session.surfaces()).includes('desktop')) return out
    const shown = visible(asCounts(await $.store.get('counts')), (await $.store.get('showAll')) === true)
    return shown && !shown.has(e.command) ? { ...out, isHidden: true } : out
  }).catch(($, e, next) => next(e))

  on('command.run', { command: SELF }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'reset') {
      await $.store.set('counts', {})
      $.ui.invalidate('command.describe')
      return { text: 'Counts cleared. The / menu shows every command until the warm-up ends.' }
    }
    if (arg === 'all') {
      const showAll = (await $.store.get('showAll')) !== true
      await $.store.set('showAll', showAll)
      $.ui.invalidate('command.describe')
      return { text: showAll ? 'The / menu now shows every command.' : 'The / menu now hides rarely used commands.' }
    }
    const counts = asCounts(await $.store.get('counts'))
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const showAll = (await $.store.get('showAll')) === true
    const isDesktop = (await $.session.surfaces()).includes('desktop')
    const shown = isDesktop ? visible(counts, showAll) : null
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => `${shown && !shown.has(name) ? '  (hidden) ' : '  '}/${name}  ${n}`)
    const state = !isDesktop
      ? 'Counting only: the / menu hides commands in the desktop app, not here.'
      : showAll
        ? 'Hiding is off (/cmd-usage all turns it on).'
        : total < warmup
          ? `Warm-up: ${total} of ${warmup} runs. Nothing is hidden yet.`
          : `The menu shows your top ${keep} commands; the rest are hidden.`
    return { text: [state, `Total runs: ${total}`, ...rows].join('\n') }
  })

  on('command.run', async ($, e, next) => {
    if (e.command !== SELF && e.origin.kind !== 'plugin') {
      try {
        const showAll = (await $.store.get('showAll')) === true
        const counts = asCounts(await $.store.get('counts'))
        const before = visible(counts, showAll)
        counts[e.command] = (counts[e.command] ?? 0) + 1
        await $.store.set('counts', counts)
        if (!sameSet(before, visible(counts, showAll))) $.ui.invalidate('command.describe')
      } catch {
        // Counting never blocks the command.
      }
    }
    return next(e)
  }).catch(($, e, next) => next(e))
}
