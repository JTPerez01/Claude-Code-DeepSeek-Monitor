#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const HOME = os.homedir();
const CACHE_DIR = path.join(HOME, '.claude', 'deepseek-cache');

console.log('\n🧹 卸载 DeepSeek Monitor...\n');
try {
  const settings = path.join(HOME, '.claude', 'settings.json');
  if (fs.existsSync(settings)) {
    const s = JSON.parse(fs.readFileSync(settings, 'utf-8'));
    delete s.statusLine;
    if (s.hooks) { delete s.hooks.SessionStart; delete s.hooks.SessionEnd; }
    fs.writeFileSync(settings, JSON.stringify(s, null, 2));
    console.log('  ✅ statusLine + hooks 已清理');
  }
  try { const { execSync } = require('child_process'); execSync('pkill -f balance-daemon.js 2>/dev/null || taskkill /f /im node.exe 2>nul', { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(CACHE_DIR, { recursive: true, force: true }); console.log('  ✅ 缓存已清理'); } catch {}
  console.log('\n  ✨ 卸载完成\n');
} catch(e) { console.error('  ❌', e.message); }
