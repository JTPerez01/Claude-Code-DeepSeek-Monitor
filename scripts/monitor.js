#!/usr/bin/env node
// deepseek-monitor CLI
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const script = path.join(os.homedir(), '.claude', 'plugins', 'custom', 'deepseek-monitor', 'scripts', 'query.js');
const args = process.argv.slice(2).map(a => `"${a}"`).join(' ');
try { execSync(`node "${script}" ${args}`, { stdio: 'inherit' }); }
catch { console.log('Run: node ' + script); }
