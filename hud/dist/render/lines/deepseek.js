import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { dim, label, green, yellow, red } from '../colors.js';
import { t } from '../../i18n/index.js';
const DS_INPUT_PRICE = 3;
const DS_CACHE_PRICE = 0.025;
const DS_OUTPUT_PRICE = 6;
const TMP = os.tmpdir();
const BALANCE_CACHE = path.join(TMP, 'deepseek-balance-cache.txt');
const COST_CACHE = path.join(TMP, 'deepseek-last-cost.txt');
function readBalance() {
    try {
        const raw = fs.readFileSync(BALANCE_CACHE, 'utf-8').trim();
        if (!raw || raw === '?')
            return null;
        const num = parseFloat(raw);
        if (isNaN(num))
            return null;
        return { value: num, str: num.toFixed(2) };
    }
    catch {
        return null;
    }
}
function readLastCumCost() {
    try {
        const raw = fs.readFileSync(COST_CACHE, 'utf-8').trim();
        const num = parseFloat(raw);
        return isNaN(num) ? null : num;
    }
    catch {
        return null;
    }
}
function writeCumCost(v) {
    try {
        fs.writeFileSync(COST_CACHE, v.toFixed(6));
    }
    catch { }
}
function formatCost(n) {
    if (n < 0.0001)
        return '¥0';
    if (n < 0.01)
        return `¥${n.toFixed(4)}`;
    if (n < 1)
        return `¥${n.toFixed(3)}`;
    return `¥${n.toFixed(2)}`;
}
export function renderDeepSeekLine(ctx) {
    if (ctx.config?.display?.showDeepSeek !== true)
        return null;
    const modelId = ctx.stdin.model?.id?.toLowerCase() || '';
    if (!modelId.includes('deepseek'))
        return null;
    const parts = [];
    const st = ctx.transcript.sessionTokens;
    let cumCost = 0;
    if (st) {
        const maxCache = Math.min(st.cacheReadTokens, st.inputTokens);
        const uncached = st.inputTokens - maxCache;
        cumCost =
            (uncached / 1_000_000) * DS_INPUT_PRICE +
                (maxCache / 1_000_000) * DS_CACHE_PRICE +
                (st.outputTokens / 1_000_000) * DS_OUTPUT_PRICE;
    }
    const lastCum = readLastCumCost();
    const delta = lastCum !== null && cumCost > lastCum ? cumCost - lastCum : null;
    if (cumCost > 0)
        writeCumCost(cumCost);
    if (cumCost > 0) {
        const costStr = delta !== null && delta > 0.0001
            ? `${yellow(`+${formatCost(delta)}`)} ${dim(formatCost(cumCost))}`
            : yellow(formatCost(cumCost));
        parts.push(`${label(t('label.cost'))} ${costStr}`);
    }
    const bal = readBalance();
    if (bal) {
        let icon, colorFn;
        if (bal.value < 1) {
            icon = '🔴';
            colorFn = red;
        }
        else if (bal.value < 5) {
            icon = '🟡';
            colorFn = yellow;
        }
        else {
            icon = '';
            colorFn = green;
        }
        const iconStr = icon ? `${icon} ` : '';
        parts.push(`${label(t('label.balance'))} ${iconStr}${colorFn(`¥${bal.str}`)}`);
    }
    if (parts.length === 0)
        return null;
    return parts.join('  ');
}
//# sourceMappingURL=deepseek.js.map