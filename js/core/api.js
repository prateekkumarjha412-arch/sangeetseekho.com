/* Talks to the Google Apps Script backend.

   Design rules (from the brief):
   - Never wait forever: every request has a timeout (AbortController).
   - Every request carries its own unique ID, and the server ignores repeats,
     so retrying is always safe (no duplicate rows).
   - Lead data is first written to an "outbox" in the browser, THEN sent.
     If the network fails or the tab is closed, the outbox is re-sent:
       • on 'pagehide' via navigator.sendBeacon (survives tab close / WhatsApp redirect)
       • on the next page load, and when the browser comes back online.
   - Uses Content-Type text/plain so the browser does not need a CORS
     pre-flight (Apps Script cannot answer pre-flights). */
import { BACKEND_CONFIG } from '../config.js';
import { local } from './storage.js';
import { log, warn, error } from './logger.js';
import { isPlaceholder, sleep } from './utils.js';

const OUTBOX_KEY = 'ss_outbox_v1';
const OUTBOX_MAX_AGE = 7 * 24 * 3600 * 1000;

export class ApiError extends Error {
  constructor(kind, message, detail) { super(message); this.kind = kind; this.detail = detail; }
}

export const backendReady = () => !isPlaceholder(BACKEND_CONFIG.GOOGLE_SCRIPT_URL);

/** One HTTP attempt. */
async function attempt(action, payload, timeoutMs) {
  if (!backendReady()) throw new ApiError('not_configured', 'Google Script URL not set in config.js');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(BACKEND_CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
      signal: ctrl.signal,
      cache: 'no-store',
    });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'timeout' : 'network', e.name === 'AbortError' ? 'Request timed out' : 'Network error');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new ApiError('server', `HTTP ${res.status}`);
  let data;
  try { data = await res.json(); } catch (_) { throw new ApiError('invalid', 'Server sent an unexpected response'); }
  if (!data || typeof data !== 'object') throw new ApiError('invalid', 'Empty response');
  if (data.ok === false) throw new ApiError('server', data.error || 'Server error', data);
  return data;
}

/**
 * Call the backend with timeout + retries (only for network/timeout problems).
 * @returns {Promise<object>} parsed JSON
 */
export async function call(action, payload = {}, { timeoutMs = BACKEND_CONFIG.REQUEST_TIMEOUT_MS, retries = 1 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    const t0 = performance.now();
    try {
      const data = await attempt(action, payload, timeoutMs);
      log('api.ok', { action, ms: Math.round(performance.now() - t0), attempt: i + 1 });
      return data;
    } catch (e) {
      last = e;
      warn('api.fail', { action, kind: e.kind, msg: e.message, attempt: i + 1 });
      if (e.kind === 'not_configured' || e.kind === 'server') break; // retrying won't help
      if (i < retries) await sleep(800 * (i + 1));
    }
  }
  throw last;
}

/* ---------------- Outbox (guaranteed delivery for leads) ---------------- */
function readOutbox() {
  const box = local.get(OUTBOX_KEY, []);
  const now = Date.now();
  return Array.isArray(box) ? box.filter((x) => now - x.queuedAt < OUTBOX_MAX_AGE) : [];
}
function writeOutbox(box) { local.set(OUTBOX_KEY, box); }
function removeFromOutbox(id) { writeOutbox(readOutbox().filter((x) => x.id !== id)); }

/**
 * Save something that must never be lost (leads).
 * Resolves with {saved:true} or {saved:false, queued:true}. Never throws, never hangs
 * longer than timeoutMs * (retries+1).
 */
export async function sendReliable(action, payload, id, opts = {}) {
  const box = readOutbox();
  if (!box.some((x) => x.id === id)) { box.push({ id, action, payload, queuedAt: Date.now() }); writeOutbox(box); }
  try {
    const data = await call(action, payload, { retries: 1, ...opts });
    removeFromOutbox(id);
    return { saved: true, data };
  } catch (e) {
    if (e.kind === 'server' && e.detail && e.detail.code === 'INVALID') removeFromOutbox(id); // bad data: don't retry forever
    error('lead.queued_for_retry', { action, id, kind: e.kind });
    return { saved: false, queued: true, error: e };
  }
}

let flushing = false;
export async function flushOutbox() {
  if (flushing || !backendReady() || !navigator.onLine) return;
  flushing = true;
  try {
    for (const item of readOutbox()) {
      try { await call(item.action, item.payload, { retries: 0, timeoutMs: 12000 }); removeFromOutbox(item.id); log('outbox.flushed', { id: item.id }); }
      catch (e) { if (e.kind === 'server') removeFromOutbox(item.id); else break; }
    }
  } finally { flushing = false; }
}

/** Last-chance delivery when the page is being left (e.g. redirect to WhatsApp). */
function beaconOutbox() {
  if (!backendReady() || !navigator.sendBeacon) return;
  for (const item of readOutbox()) {
    try {
      const blob = new Blob([JSON.stringify({ action: item.action, ...item.payload })], { type: 'text/plain;charset=utf-8' });
      navigator.sendBeacon(BACKEND_CONFIG.GOOGLE_SCRIPT_URL, blob);
      // Not removed: if the beacon also failed, the next visit re-sends. Server de-duplicates by ID.
    } catch (_) {}
  }
}

export function initOutbox() {
  window.addEventListener('pagehide', beaconOutbox);
  window.addEventListener('online', flushOutbox);
  setTimeout(flushOutbox, 2500); // after page is idle
}

/** Fire-and-forget (status pings like "checkout closed"). Never throws. */
export function ping(action, payload) {
  call(action, payload, { retries: 0, timeoutMs: 10000 }).catch(() => {});
}
