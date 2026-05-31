# Claude Code DeepSeek Monitor

DeepSeek API 用量实时监控 — 在 Claude Code 底部状态栏显示 token 消耗、费用和账户余额。

## 安装

```bash
npm install -g claude-code-deepseek-monitor
```

## 效果

安装后重启 Claude Code，底部实时显示：

```
[DeepSeek V4 Pro] ██░░░ 45% (50K/1M) | 费用 +¥0.01 ¥0.50  余额 ¥14.00
```

## 使用

| 命令 | 说明 |
|------|------|
| `/usage` | 完整彩色仪表盘 |
| `/usage --short` | 一行精简版 |
| `/usage --refresh` | 强制刷新余额 |
| `deepseek-monitor --short` | 终端直接查询 |

## 功能

- 📊 **实时底部状态栏** — Token 用量、上下文百分比、余额
- 💰 **DeepSeek 余额** — 自动查询 API 余额，30 秒刷新
- 🎨 **中文界面** — 费用、余额、上下文全中文
- 🚨 **余额预警** — 低于 ¥5 🟡 低于 ¥1 🔴
- 🔄 **上轮费用追踪** — 显示每次对话增量

## 定价

内置 DeepSeek V4 Pro 2.5 折价格（可配置环境变量覆盖）：

- 输入（缓存未命中）: ¥3/M tokens
- 输入（缓存命中）: ¥0.025/M tokens
- 输出: ¥6/M tokens

```bash
export DEEPSEEK_INPUT_PRICE=3
export DEEPSEEK_OUTPUT_PRICE=6
export DEEPSEEK_CACHE_HIT_PRICE=0.025
```

## 卸载

```bash
npm uninstall -g claude-code-deepseek-monitor
```

## License

MIT
