/* Meta Pixel — one place for all tracking.

   Duplicate protection (the brief's biggest tracking concern):
   1. The Pixel script is initialised once per page (window.__ssPixel guard), so
      PageView fires exactly once per page load.
   2. Every Lead / InitiateCheckout / Purchase has a unique eventID:
        Lead             → lead_<leadId>
        InitiateCheckout → ic_<checkoutId>
        Purchase         → purchase_<razorpayPaymentId>
      We remember fired IDs in the browser and never send the same one twice
      (Purchase IDs are remembered in localStorage = survive refresh & revisit).
   3. The server (Apps Script) sends the same Purchase with the same eventID via
      the Conversions API, so Meta merges browser + server into ONE purchase.
   4. Purchase is only called by the thank-you page AFTER the server confirms the
      payment. Never on click, never on checkout open, never on page load alone.
   If the Pixel ID is still the placeholder, or an ad-blocker blocks Meta,
   nothing breaks — calls are silently skipped. */
import { TRACKING_CONFIG } from '../config.js';
import { local, session } from '../core/storage.js';
import { log, warn } from '../core/logger.js';

const PIXEL_ID = String(TRACKING_CONFIG.META_PIXEL_ID || '').trim();
export const pixelEnabled = /^\d{10,20}$/.test(PIXEL_ID);

export function initPixel() {
  if (window.__ssPixel) return;            // guard: never initialise twice
  window.__ssPixel = true;
  if (!pixelEnabled) { log('pixel.disabled', { reason: 'META_PIXEL_ID not set' }); return; }
  /* Standard Meta base code (unchanged except it's wrapped in our guard). */
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;t.onerror=function(){warn('pixel.blocked')};s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  log('pixel.PageView', { id: PIXEL_ID });
}

const SESSION_KEY = 'ss_px_session';
const PERSIST_KEY = 'ss_px_persist';

function alreadyFired(eventId, persist) {
  const list = (persist ? local : session).get(persist ? PERSIST_KEY : SESSION_KEY, []);
  return Array.isArray(list) && list.includes(eventId);
}
function remember(eventId, persist) {
  const store = persist ? local : session;
  const key = persist ? PERSIST_KEY : SESSION_KEY;
  const list = store.get(key, []);
  list.push(eventId);
  store.set(key, list.slice(-200));
}

/**
 * Track a standard event exactly once per eventID.
 * @param {string} name   Meta standard event name
 * @param {object} params content_ids, content_name, value, currency ...
 * @param {string} eventId unique ID used for de-duplication (required for Lead/IC/Purchase)
 * @param {{persist?:boolean}} opts persist=true keeps the "already fired" mark across visits
 */
export function track(name, params = {}, eventId = '', { persist = false } = {}) {
  const key = eventId || `${name}_${location.pathname}`;
  if (alreadyFired(key, persist)) { warn('pixel.duplicate_blocked', { name, eventId: key }); return false; }
  remember(key, persist);
  if (!pixelEnabled || typeof window.fbq !== 'function') { log('pixel.skipped', { name, eventId: key, params }); return false; }
  window.fbq('track', name, params, eventId ? { eventID: eventId } : undefined);
  log(`pixel.${name}`, { eventId: key, params });
  return true;
}

/** Product → Meta params. */
export function productParams(p) {
  return {
    content_ids: [p.id],
    content_name: p.name,
    content_type: 'product',
    contents: [{ id: p.id, quantity: 1, item_price: p.price }],
    value: p.price,
    currency: 'INR',
  };
}
