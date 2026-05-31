#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.claude', 'deepseek-cache');
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
const CACHE = path.join(CACHE_DIR, 'balance.txt');
const PIDFILE = path.join(CACHE_DIR, 'daemon.pid');
const LOGFILE = path.join(CACHE_DIR, 'daemon.log');
const SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

function log(msg) {
  const ts = new Date().toISOString();
  try { fs.appendFileSync(LOGFILE, `[${ts}] ${msg}\n`); } catch {}
}

// 防止重复运行
try {
  if (fs.existsSync(PIDFILE)) {
    const oldPid = parseInt(fs.readFileSync(PIDFILE, 'utf-8').trim());
    try { process.kill(oldPid, 0); log(`killing old daemon pid=${oldPid}`); process.kill(oldPid); } catch {}
  }
} catch {}
fs.writeFileSync(PIDFILE, String(process.pid));

function getApiKey() {
  try { const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf-8')); return s?.env?.ANTHROPIC_AUTH_TOKEN || ''; }
  catch { log('ERROR: cannot read settings.json'); return ''; }
}

function fetchBalance(key) {
  return new Promise((resolve) => {
    const req = https.get('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${key}` },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { log(`API returned ${res.statusCode}: ${data.slice(0,200)}`); return resolve(null); }
        try {
          const j = JSON.parse(data);
          const b = (j.balance_infos || [{}])[0];
          // 写入: total topped granted available timestamp
          const line = [b.total_balance || '0', b.topped_up_balance || '0', b.granted_balance || '0', j.is_available ? 'true' : 'false', Date.now()].join(' ');
          resolve(line);
        } catch (e) { log(`parse error: ${e.message}`); resolve(null); }
      });
    });
    req.on('error', e => { log(`network error: ${e.message}`); resolve(null); });
    req.setTimeout(10000, () => { req.destroy(); log('timeout'); resolve(null); });
  });
}

async function main() {
  const key = getApiKey();
  if (!key) { log('FATAL: no API key'); process.exit(1); }
  log(`daemon started, writing to ${CACHE}`);

  let successCount = 0;
  let failCount = 0;

  while (true) {
    const result = await fetchBalance(key);
    if (result) {
      fs.writeFileSync(CACHE, result);
      successCount++;
      failCount = 0;
    } else {
      failCount++;
    }

    // 连续失败 10 次才记录日志，避免刷屏
    if (failCount === 10) log(`10 consecutive failures`);
    if (successCount > 0 && successCount % 20 === 0) log(`OK: ${successCount} updates`);

    await new Promise(r => setTimeout(r, 30000));
  }
}
main();
