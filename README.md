# Claude Code DeepSeek Monitor

Real-time DeepSeek API usage monitor for Claude Code — displays token costs, session totals, and account balance in the status bar. **All prices in USD, English interface.**

Forked from [love72-seven/Claude-Code-DeepSeek-Monitor](https://github.com/love72-seven/Claude-Code-DeepSeek-Monitor) with the following changes:

- **USD pricing** — all costs shown in `$`, dynamically detected from DeepSeek balance API
- **English UI** — all interface text translated from Chinese
- **Accurate DeepSeek V4 pricing** — V4 Pro, V4 Flash, V3, and R2 recognized in cost estimator
- **Trimmed status bar** — shows only model, context bar, project, DeepSeek cost/balance (no redundant tool counts or agent summaries that Claude Code now shows natively)
- **API key** — reads from `ANTHROPIC_AUTH_TOKEN` environment variable or `settings.json`

## Status Bar

```
[deepseek-v4-pro[1m]] ██░░░ 20% (196k/1M) | wsl | +$0.0002 $0.092  Balance $3.14
```

| Segment | Meaning |
|---|---|
| `[deepseek-v4-pro[1m]]` | Model + context window size |
| `██░░░ 20% (196k/1M)` | Context bar + tokens used / max |
| `wsl` | Project name |
| `+$0.0002` | Last API call cost (delta) |
| `$0.092` | Session total DeepSeek cost |
| `Balance $3.14` | Account balance from DeepSeek API |

## Commands

| Command | Description |
|---|---|
| `/usage` | Full color dashboard with token breakdown |
| `/usage --short` | Single-line compact view |
| `/usage --refresh` | Force refresh balance from API |

## Install

```bash
npm install -g claude-code-deepseek-monitor
```

Or install directly from this fork:

```bash
git clone https://github.com/JTPerez01/Claude-Code-DeepSeek-Monitor.git
cd Claude-Code-DeepSeek-Monitor
node install.js
```

Restart Claude Code after installation.

## Pricing

Built-in DeepSeek V4 Pro pricing (USD, configurable via environment variables):

| Token Type | Price per 1M |
|---|---|
| Input (cache miss) | $0.435 |
| Input (cache hit) | $0.003625 |
| Output | $0.87 |

```bash
export DEEPSEEK_INPUT_PRICE=0.435
export DEEPSEEK_OUTPUT_PRICE=0.87
export DEEPSEEK_CACHE_HIT_PRICE=0.003625
```

## Uninstall

```bash
npm uninstall -g claude-code-deepseek-monitor
```

## License

MIT
