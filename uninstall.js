#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const HOME = os.homedir();
const TMP = os.tmpdir();

console.log('\n🧹 卸载 DeepSeek Monitor...\n');

try {
  // statusLine
  const settings = path.join(HOME, '.claude', 'settings.json');
  if (fs.existsSync(settings)) {
    const s = JSON.parse(fs.readFileSync(settings, 'utf-8'));
    delete s.statusLine;
    if (s.hooks) { delete s.hooks.SessionStart; delete s.hooks.SessionEnd; }
    fs.writeFileSync(settings, JSON.stringify(s, null, 2));
    console.log('  ✅ statusLine + hooks 已清理');
  }
  // 停止 daemon
  try { const { execSync } = require('child_process'); execSync(process.platform === 'win32' ? 'taskkill /f /fi "WINDOWTITLE eq balance-daemon*" 2>nul' : 'pkill -f balance-daemon.js 2>/dev/null', { stdio: 'ignore' }); } catch {}
  // 清理缓存
  ['deepseek-balance-cache.txt', 'deepseek-last-cost.txt'].forEach(f => { try { fs.unlinkSync(path.join(TMP, f)); } catch {} });
  console.log('  ✅ daemon 已停止，缓存已清理');
  console.log('\n  ✨ 卸载完成\n');
} catch(e) { console.error('  ❌', e.message); }
