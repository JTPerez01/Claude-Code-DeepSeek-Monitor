#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CACHE_DIR = path.join(HOME, '.claude', 'deepseek-cache'); fs.mkdirSync(CACHE_DIR, { recursive: true });
const CLAUDE_DIR = path.join(HOME, '.claude');
const PLUGIN_DIR = path.join(CLAUDE_DIR, 'plugins', 'claude-hud');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills', 'usage');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const PKG = __dirname;
const NODE = process.execPath;

const C = { r:'\x1b[0m', b:'\x1b[1m', g:'\x1b[32m', c:'\x1b[36m', y:'\x1b[33m', d:'\x1b[2m' };
function log(l,m) { console.log(`  ${C.c}${l}${C.r} ${m}`); }
function ok(m) { console.log(`${C.g}✅${C.r} ${m}`); }

console.log(`\n${C.b}${C.c}╔════════════════════════════════════╗`);
console.log(`║  Claude Code DeepSeek Monitor     ║`);
console.log(`╚════════════════════════════════════╝${C.r}\n`);

try {
  const hudDest = path.join(CLAUDE_DIR, 'plugins', 'cache', 'deepseek-monitor', '1.0.0');
  const scriptDir = path.join(CLAUDE_DIR, 'plugins', 'custom', 'deepseek-monitor', 'scripts');
  const balanceCache = path.join(CACHE_DIR, 'balance.txt');

  log('📦', 'install HUD...');
  fs.mkdirSync(hudDest, { recursive: true });
  fs.cpSync(path.join(PKG, 'hud'), hudDest, { recursive: true });
  ok(`HUD → ${hudDest}`);

  log('📜', 'install scripts...');
  fs.mkdirSync(scriptDir, { recursive: true });
  fs.copyFileSync(path.join(PKG, 'scripts', 'query.js'), path.join(scriptDir, 'query.js'));
  fs.copyFileSync(path.join(PKG, 'scripts', 'balance-daemon.js'), path.join(scriptDir, 'balance-daemon.js'));
  ok(`scripts → ${scriptDir}`);

  log('🔧', 'install /usage...');
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  fs.cpSync(path.join(PKG, 'skills', 'usage'), SKILLS_DIR, { recursive: true });
  ok(`/usage → ${SKILLS_DIR}`);

  log('⚙️', 'configure HUD...');
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });
  fs.writeFileSync(path.join(PLUGIN_DIR, 'config.json'), JSON.stringify({
    language:'zh', lineLayout:'compact',
    elementOrder:['project','context','deepseek','tools','agents','todos'],
    display:{showModel:true,showProject:true,showContextBar:true,showDeepSeek:true,showCost:false,showUsage:false,showTools:true,showAgents:true,showTodos:true,showDuration:true,showSessionName:false,contextValue:'both'},
  },null,2));

  log('🚀', 'configure statusLine...');
  const runScript = path.join(PLUGIN_DIR, 'run.mjs');
  fs.writeFileSync(runScript, [
    "import { execSync } from 'child_process';",
    "import { pathToFileURL } from 'url';",
    "let cols = 120;",
    "try {",
    "  const cmd = process.platform === 'win32' ? 'mode con 2>nul' : 'tput cols 2>/dev/null';",
    "  const out = execSync(cmd, { encoding: 'utf8', timeout: 1000 });",
    "  const m = out.match(/(\\d+)/);",
    "  if (m) cols = parseInt(m[1], 10) - 4;",
    "} catch(e) {}",
    "process.env.COLUMNS = String(Math.max(1, cols));",
    `const hud = await import(pathToFileURL(${JSON.stringify(path.join(hudDest, 'dist', 'index.js'))}).href);`,
    "hud.main();",
    "",
  ].join('\n'));
  const statusCmd = `"${NODE}" "${runScript}"`;

  let settings = {};
  if (fs.existsSync(SETTINGS)) settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf-8'));
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  if (fs.existsSync(SETTINGS)) fs.copyFileSync(SETTINGS, `${SETTINGS}.bak.${ts}`);
  settings.statusLine = { type: 'command', command: statusCmd };
  if (!settings.env) settings.env = {};
  // Remove old hooks if present
  if (settings.hooks) { delete settings.hooks.SessionStart; delete settings.hooks.SessionEnd; }
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2));
  ok(`statusLine → ${statusCmd.slice(0,60)}...`);

  log('💰', 'fetching balance...');
  try {
    const apiKey = (() => {
      for (const p of [SETTINGS, path.join(CLAUDE_DIR, '.claude.json')]) {
        try { const d = JSON.parse(fs.readFileSync(p,'utf-8')); const t = d?.env?.ANTHROPIC_AUTH_TOKEN; if (t) return t; } catch {}
      }
      return null;
    })();
    if (apiKey) {
      const bal = execSync(
        `"${NODE}" -e "const{execSync}=require('child_process');const b=execSync('curl -s --max-time 5 https://api.deepseek.com/user/balance -H \\"Authorization: Bearer ${apiKey}\\"',{encoding:'utf8'});const j=JSON.parse(b);const bi=j?.balance_infos?.[0];if(bi)console.log([bi.total_balance,bi.topped_up_balance,bi.granted_balance,j.is_available].join(' '))"`,
        { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] }
      ).trim();
      if (bal) { fs.writeFileSync(balanceCache, bal); ok(`balance: ¥${bal.split(' ')[0]}`); }
    }
  } catch {}

  log('🔄', 'starting daemon...');
  try {
    // 杀掉旧 daemon
    try { execSync(`pkill -f balance-daemon.js 2>/dev/null || true`, { stdio: 'ignore' }); } catch {}
    try {
      const oldPid = fs.readFileSync(path.join(CACHE_DIR, 'daemon.pid'), 'utf-8').trim();
      try { process.kill(parseInt(oldPid)); } catch {}
    } catch {}
    fs.rmSync(path.join(CACHE_DIR, 'daemon.log'), { force: true });

    const daemonPath = path.join(scriptDir, 'balance-daemon.js');
    const subprocess = require('child_process').spawn(NODE, [daemonPath], {
      detached: true, stdio: 'ignore',
      windowsHide: true,
    });
    subprocess.unref();
    ok('daemon started');
  } catch { ok('daemon start skipped'); }

  console.log(`\n${C.b}${C.g}  ✨ Done! Restart Claude Code.${C.r}\n`);
  console.log(`  ${C.y}/usage${C.r}          full dashboard`);
  console.log(`  ${C.y}/usage --short${C.r}   one-line\n`);

} catch(e) { console.error('❌', e.message); process.exit(1); }
