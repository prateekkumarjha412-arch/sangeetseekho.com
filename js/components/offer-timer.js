/* 1-HOUR OFFER TIMER (eBook pages).

   - Counts down from 01:00:00.
   - When it reaches 00:00:00 it automatically starts again from 01:00:00 (repeating cycle).
   - The cycle start is saved in the visitor's browser, so reloading or switching between
     the two eBook pages continues the SAME countdown instead of jumping back to 01:00:00.
   - Duration is in config.js → TIMER_CONFIG.OFFER_MINUTES.

   Markup: <span data-offer-timer><span data-offer-label>Ends in</span>
             <span data-t="h">01</span>:<span data-t="m">00</span>:<span data-t="s">00</span></span> */
import { TIMER_CONFIG } from '../config.js';
import { local } from '../core/storage.js';

const KEY = 'ss_offer_cycle_v2';
const pad = (n) => String(n).padStart(2, '0');

/** Milliseconds left in the current cycle (never 0 for more than an instant). */
export function getOfferRemaining(now = Date.now()) {
  const dur = Math.max(1, TIMER_CONFIG.OFFER_MINUTES) * 60 * 1000;
  let start = local.get(KEY);
  if (typeof start !== 'number' || start > now + 60000) {   // first visit, or clock went backwards
    start = now;
    local.set(KEY, start);
  }
  const intoCycle = (now - start) % dur;
  return dur - intoCycle;
}

export function initOfferTimers(root = document) {
  const els = Array.from(root.querySelectorAll('[data-offer-timer]'));
  if (!els.length) return;
  function tick() {
    const s = Math.floor(getOfferRemaining() / 1000) % (TIMER_CONFIG.OFFER_MINUTES * 60 + 1);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    for (const el of els) {
      const set = (k, v) => { const n = el.querySelector(`[data-t="${k}"]`); if (n && n.textContent !== v) n.textContent = v; };
      set('h', pad(h)); set('m', pad(m)); set('s', pad(sec));
      el.classList.toggle('is-urgent', s < 10 * 60);
    }
  }
  tick();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
