/* 1-HOUR OFFER TIMER (eBook pages). Not the 7-second CTA countdown.

   Persistence strategy (honest, not a fake "always 59 minutes"):
   - The first time a visitor sees an eBook page, a 60-minute window starts and is
     saved in their browser. Reloading or switching pages continues the SAME timer.
   - When it reaches 00:00:00 we do NOT silently restart it. The label changes to
     "Offer price still active today" (prices are not changed by the timer).
   - A new 60-minute window can start only after OFFER_COOLDOWN_HOURS (default 24h).
   All numbers are in config.js → TIMER_CONFIG.

   Markup: <div data-offer-timer><span data-t="h">01</span>:<span data-t="m">00</span>:<span data-t="s">00</span></div>
   Optional: data-offer-label element inside shows the text label. */
import { TIMER_CONFIG } from '../config.js';
import { local } from '../core/storage.js';

const KEY = 'ss_offer_window_v1';
const pad = (n) => String(n).padStart(2, '0');

export function getOfferWindow(now = Date.now()) {
  const dur = TIMER_CONFIG.OFFER_MINUTES * 60 * 1000;
  const cool = TIMER_CONFIG.OFFER_COOLDOWN_HOURS * 3600 * 1000;
  let w = local.get(KEY);
  const valid = w && typeof w.start === 'number' && w.start <= now + 60000 && w.dur === dur;
  if (!valid || now - w.start > dur + cool) {
    w = { start: now, dur };
    local.set(KEY, w);
  }
  return { start: w.start, end: w.start + dur, remaining: Math.max(0, w.start + dur - now) };
}

export function initOfferTimers(root = document) {
  const els = Array.from(root.querySelectorAll('[data-offer-timer]'));
  if (!els.length) return;
  function tick() {
    const { remaining } = getOfferWindow();
    const s = Math.floor(remaining / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    for (const el of els) {
      const set = (k, v) => { const n = el.querySelector(`[data-t="${k}"]`); if (n && n.textContent !== v) n.textContent = v; };
      set('h', pad(h)); set('m', pad(m)); set('s', pad(sec));
      el.classList.toggle('is-expired', remaining === 0);
      el.classList.toggle('is-urgent', remaining > 0 && remaining < 10 * 60 * 1000);
      const label = el.querySelector('[data-offer-label]');
      if (label) label.textContent = remaining === 0 ? 'Offer price still active today' : (label.dataset.default || label.textContent);
    }
    if (remaining === 0) clearInterval(iv);
  }
  els.forEach((el) => { const l = el.querySelector('[data-offer-label]'); if (l) l.dataset.default = l.textContent; });
  const iv = setInterval(tick, 1000);
  tick();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
