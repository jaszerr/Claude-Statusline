import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const engine = { plugin: 'engine', tier: 'core' } as const

// The engine's own behaviour beneath the plugin: a command prints nothing,
// a description comes back as given, the store is a Map.
function bottom(on: On, surfaces: readonly ('terminal' | 'desktop')[] = ['desktop']) {
  on('session.surfaces', () => ({ value: surfaces }))
  const store = new Map<string, unknown>()
  on('store.get', ($, e) => ({ value: store.get(e.key) }))
  on('store.set', ($, e) => {
    store.set(e.key, JSON.parse(JSON.stringify(e.value)))
    return { value: undefined }
  })
  on('command.run', () => ({ text: '' }))
  on('command.describe', ($, e) => ({ description: e.description, isHidden: e.isHidden }))
}

const run = ($: Engine, command: string, args = '') =>
  $.command.run({
    command,
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

const hidden = async ($: Engine, command: string) =>
  (await $.command.describe({ command, description: 'x', isHidden: false, immediate: false, provider: engine }))
    .isHidden

const small = { options: { keep: 1, warmup: 3, alwaysShow: '' } }

describe('command-usage', () => {
  test('hides nothing during the warm-up', small, async ($, on) => {
    bottom(on)
    await run($, 'model')
    await run($, 'model')
    expect(await hidden($, 'effort')).toBe(false)
  })

  test('after the warm-up, keeps the top commands and hides the rest', small, async ($, on) => {
    bottom(on)
    await run($, 'model')
    await run($, 'model')
    await run($, 'effort')
    expect(await hidden($, 'model')).toBe(false)
    expect(await hidden($, 'effort')).toBe(true)
    expect(await hidden($, 'sandbox')).toBe(true)
    expect(await hidden($, 'cmd-usage')).toBe(false)
  })

  test('never hides an always-show command', { options: { keep: 1, warmup: 1, alwaysShow: '/plan, fast' } }, async ($, on) => {
    bottom(on)
    await run($, 'model')
    expect(await hidden($, 'plan')).toBe(false)
    expect(await hidden($, 'fast')).toBe(false)
    expect(await hidden($, 'theme')).toBe(true)
  })

  test('/cmd-usage all turns hiding off and on', small, async ($, on) => {
    bottom(on)
    for (const c of ['model', 'model', 'effort']) await run($, c)
    expect(await hidden($, 'effort')).toBe(true)
    await run($, 'cmd-usage', 'all')
    expect(await hidden($, 'effort')).toBe(false)
    await run($, 'cmd-usage', 'all')
    expect(await hidden($, 'effort')).toBe(true)
  })

  test('the CLI counts but hides nothing', small, async ($, on) => {
    bottom(on, ['terminal'])
    for (const c of ['model', 'model', 'effort']) await run($, c)
    expect(await hidden($, 'effort')).toBe(false)
    expect(await hidden($, 'sandbox')).toBe(false)
    const { text } = await run($, 'cmd-usage')
    expect(text).toContain('Counting only')
    expect(text).toContain('/model  2')
  })

  test('/cmd-usage lists counts and reset clears them', small, async ($, on) => {
    bottom(on)
    for (const c of ['model', 'model', 'effort']) await run($, c)
    const { text } = await run($, 'cmd-usage')
    expect(text).toContain('/model  2')
    expect(text).toContain('(hidden) /effort  1')
    await run($, 'cmd-usage', 'reset')
    expect(await hidden($, 'effort')).toBe(false)
  })
})
