/* Debug logger.
   - Silent in production unless SITE_CONFIG.DEBUG is true or the URL has ?debug=1
     (?debug=1 is remembered for the browser tab; ?debug=0 turns it off).
   - Keeps the last 100 events in memory: type  ssDebug()  in the browser console
     to see lead submissions, checkout steps, payment results, tracking events,
     Google Sheet failures and duplicates that were blocked. */
import { SITE_CONFIG } from '../config.js';

const buffer = [];
let enabled = SITE_CONFIG.DEBUG;
try {
  const p = new URLSearchParams(location.search).get('debug');
  if (p === '1') sessionStorage.setItem('ss_debug', '1');
  if (p === '0') sessionStorage.removeItem('ss_debug');
  enabled = enabled || sessionStorage.getItem('ss_debug') === '1';
} catch (_) {}

export const isDebug = () => enabled;

export function log(event, data = {}, level = 'info') {
  const entry = { t: new Date().toISOString(), level, event, data };
  buffer.push(entry);
  if (buffer.length > 100) buffer.shift();
  if (enabled || level === 'error') {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    // In production only errors reach the console, and only as one short line.
    if (enabled) fn(`[SS] ${event}`, data); else fn(`[SS] ${event}`);
  }
  window.dispatchEvent(new CustomEvent('ss:log', { detail: entry }));
}

export const warn = (e, d) => log(e, d, 'warn');
export const error = (e, d) => log(e, d, 'error');

window.ssDebug = () => { console.table(buffer.map((b) => ({ time: b.t.slice(11, 19), level: b.level, event: b.event, data: JSON.stringify(b.data).slice(0, 140) }))); return buffer; };

// Global safety net: never show stack traces to users, but record them.
window.addEventListener('error', (e) => log('js.error', { msg: e.message, src: e.filename, line: e.lineno }, 'error'));
window.addEventListener('unhandledrejection', (e) => log('js.unhandled_rejection', { reason: String(e.reason && e.reason.message || e.reason) }, 'error'));
