export type Window = { pct: number; resetsAt: string | null }

export type Usage = {
  fiveHour: Window | null
  week: Window | null
  fable: { pct: number; label: string } | null
  fetchedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'usage-footer': {
      usage: Usage | null
      ctx: number | null
      tick: number
    }
  }
}
