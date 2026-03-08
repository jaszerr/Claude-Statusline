# Competitive Feature Audit

Audited 2026-03-08 across 11 Claude Code statusline projects.

## Reference Links

| Project | URL |
|---------|-----|
| Claude Pulse | https://github.com/NoobyGains/claude-pulse |
| CCStatusline | https://github.com/sirmalloc/ccstatusline |
| Claude Monitor Statusline | https://github.com/gabriel-dehan/claude_monitor_statusline |
| Claude Powerline | https://github.com/Owloops/claude-powerline |
| claude-code-statusline (rz) | https://github.com/rz1989s/claude-code-statusline |
| claude-statusline-powerline | https://github.com/spences10/claude-statusline-powerline |
| cc-statusline | https://github.com/chongdashu/cc-statusline |
| oh-my-claude | https://github.com/ssenart/oh-my-claude |
| claude-code-statusline (levz0r) | https://github.com/levz0r/claude-code-statusline |
| CCometixLine | https://github.com/Haleclipse/CCometixLine |
| Mohamed3on gist | https://gist.github.com/Mohamed3on/70780575570a07985916e5f50e290382 |

---

## Feature Inventory

Legend: **HAVE** = we already have it | **NEW** = potential addition

### Display: Usage & Cost

| Feature | Status | Seen In |
|---------|--------|---------|
| Context window % | **HAVE** | All projects |
| Weekly (7-day) usage % | **HAVE** | Pulse, CCStatusline, oh-my-claude |
| Reset countdown timer | **HAVE** (day+time) | Most projects |
| Stale data indicator (~) | **HAVE** | Pulse |
| 5-hour block usage % | NEW | Powerline, CCStatusline, oh-my-claude |
| Session cost (USD) | NEW | Powerline, cc-statusline, spences10, levz0r, Mohamed3on gist |
| Token count (input/output) | NEW | Most projects |
| Hourly burn rate ($/hr or tokens/min) | NEW | cc-statusline, rz1989s, Powerline |
| Daily/monthly cost aggregation | NEW | Powerline, rz1989s |
| Daily budget with warning threshold | NEW | Powerline |
| Token speed (tokens/sec) | NEW | CCStatusline |
| Cache hit ratio display | NEW | rz1989s |
| Plan type indicator (Pro/Max5/Max20) | NEW | claude_monitor_statusline |
| Message count | NEW | claude_monitor_statusline |

### Display: Session & Model

| Feature | Status | Seen In |
|---------|--------|---------|
| Model name/ID | NEW | Most projects |
| Model tier icon (Opus/Sonnet/Haiku) | NEW | levz0r, Mohamed3on gist |
| Session duration timer | NEW | Mohamed3on gist, cc-statusline |
| Claude Code version | NEW | cc-statusline, Powerline |
| Session name (/rename) | NEW | CCStatusline |
| Output style indicator | NEW | CCometixLine |

### Display: Git Integration

| Feature | Status | Seen In |
|---------|--------|---------|
| Branch name | NEW | Most projects |
| Dirty/clean status indicator | NEW | Most projects |
| Staged/unstaged/untracked counts | NEW | Powerline, spences10, levz0r |
| Commits ahead/behind upstream | NEW | claude_monitor_statusline, Powerline, spences10 |
| Worktree detection | NEW | CCStatusline |
| Lines added/removed in session | NEW | Powerline, Mohamed3on gist |
| Time since last commit | NEW | Powerline |

### Display: Environment

| Feature | Status | Seen In |
|---------|--------|---------|
| Current directory (with ~ abbrev) | NEW | Most projects |
| Fish-style path abbreviation | NEW | CCStatusline, Powerline |
| Node.js version (when package.json exists) | NEW | Mohamed3on gist |
| System memory usage | NEW | CCStatusline |
| MCP server health status | NEW | rz1989s |
| Tmux session info | NEW | Powerline |
| Custom env variable display | NEW | Powerline |

### Visual: Themes & Styling

| Feature | Status | Seen In |
|---------|--------|---------|
| Color-coded thresholds (green/yellow/red) | **HAVE** | All projects |
| Powerline arrow separators | NEW | Most projects |
| Multiple built-in themes (dark, nord, gruvbox, etc.) | NEW | Powerline (6), spences10 (12), CCometixLine (6) |
| Custom theme support (JSON/TOML) | NEW | Powerline, CCometixLine |
| Progress bar visualization | NEW | cc-statusline, Mohamed3on gist, Pulse |
| 256-color / truecolor support | NEW | CCStatusline, Powerline |
| Capsule/rounded separators | NEW | Powerline |
| ASCII-only fallback mode | NEW | Powerline |
| Multi-line layout (2-9 lines) | NEW | CCStatusline, rz1989s, Powerline |
| NO_COLOR env var support | NEW | cc-statusline, Powerline |
| Nerd Font icons | NEW | CCometixLine, spences10, Powerline |
| Display modes (colors/minimal/background) | NEW | claude_monitor_statusline |
| Rainbow/animation effects | NEW | Pulse |

### Config & UX

| Feature | Status | Seen In |
|---------|--------|---------|
| Interactive TUI for config | NEW | CCStatusline, CCometixLine |
| Live preview during config | NEW | CCStatusline, CCometixLine |
| Config file (JSON/TOML) | NEW | Most projects |
| Per-project config override | NEW | Powerline, spences10 |
| CLI flags for overrides | NEW | Powerline, CCometixLine |
| Segment reordering | NEW | Most projects |
| Per-segment enable/disable | NEW | Most projects |
| JSON schema with IntelliSense | NEW | spences10 |
| Automatic backup before updates | NEW | cc-statusline |

### Unique/Niche Features

| Feature | Status | Seen In |
|---------|--------|---------|
| Islamic prayer times + Hijri calendar | NEW | rz1989s |
| SQLite-backed usage tracking (31x faster) | NEW | spences10 |
| Disable "Context low" warning (patcher) | NEW | CCometixLine |
| Clickable OSC8 links in terminal | NEW | CCStatusline |
| Skills widget (last/count/list) | NEW | CCStatusline |
| Custom text/emoji widget | NEW | CCStatusline |
| Proxy support (HTTPS_PROXY) | NEW | CCStatusline |
| Oh-my-posh integration | NEW | oh-my-claude |
| ccusage npm integration | NEW | cc-statusline, oh-my-claude |

---

## Priority Tiers (Suggested)

### Tier 1: High value, low effort
- **5-hour block usage %** (already in API response, just not displayed)
- **Session cost** (available in stdin data)
- **Model name** (available in stdin data)
- **Token count** (available in stdin data)

### Tier 2: Medium value, medium effort
- **Git branch** (shell command, fast)
- **Session duration** (available in stdin data)
- **Progress bar visualization** (formatting only)
- **NO_COLOR support** (env var check)

### Tier 3: Nice to have, more effort
- **Burn rate / tokens per second** (needs state tracking)
- **Config file support** (JSON config loader)
- **Multiple themes** (color palette definitions)
- **Multi-line layout** (output formatting)
- **Daily budget with thresholds** (needs persistent storage)

### Tier 4: Niche
- Directory display, Nerd Font icons, powerline separators, TUI config, SQLite tracking, prayer times
