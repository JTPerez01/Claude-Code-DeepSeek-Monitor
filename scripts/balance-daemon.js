#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE = path.join(os.tmpdir(), 'deepseek-balance-cache.txt');
const SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

function getApiKey() {
  try { const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf-8')); return s?.env?.ANTHROPIC_AUTH_TOKEN || ''; }
  catch { return ''; }
}

function fetchBalance(key) {
  return new Promise((resolve) => {
    const req = https.get('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const b = (j.balance_infos || [{}])[0];
          const line = [b.total_balance || '0', b.topped_up_balance || '0', b.granted_balance || '0', j.is_available ? 'true' : 'false'].join(' ');
          resolve(line);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  const key = getApiKey();
  if (!key) { process.exit(0); }
  while (true) {
    const result = await fetchBalance(key);
    if (result) fs.writeFileSync(CACHE, result);
    await new Promise(r => setTimeout(r, 30000));
  }
}
main();
