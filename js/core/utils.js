/* Small shared helpers. No business logic here. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Random unique id, e.g. "ck_lq2x9a_4f8e2c1b9d0a". Safe for sheet IDs and Meta event IDs. */
export function uid(prefix = 'id') {
  const rand = (globalThis.crypto && crypto.getRandomValues)
    ? Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('')
    : Math.random().toString(16).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

/** Stable short hash of a string (used to detect identical repeat submissions). */
export function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** <picture> markup for an image saved as name.webp + name.jpg */
export function picture(base, alt, { width, height, eager = false, sizes, cls = '' } = {}) {
  const loading = eager ? 'eager' : 'lazy';
  const fp = eager ? ' fetchpriority="high"' : '';
  const dims = width && height ? ` width="${width}" height="${height}"` : '';
  return `<picture class="${cls}"><source srcset="${base}.webp" type="image/webp"${sizes ? ` sizes="${sizes}"` : ''}>` +
    `<img src="${base}.jpg" alt="${escapeHtml(alt)}" loading="${loading}" decoding="async"${dims}${fp}></picture>`;
}

/** Read first-touch marketing source (utm_*, fbclid, referrer). Stored for the session. */
export function getLeadSource() {
  const KEY = 'ss_source';
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) { /* storage blocked */ }
  const p = new URLSearchParams(location.search);
  const src = {
    utm_source: p.get('utm_source') || '',
    utm_medium: p.get('utm_medium') || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_content: p.get('utm_content') || '',
    fbclid: p.get('fbclid') || '',
    referrer: document.referrer ? new URL(document.referrer).hostname : '',
    landing: location.pathname,
  };
  try { sessionStorage.setItem(KEY, JSON.stringify(src)); } catch (_) {}
  return src;
}

export function describeSource(src = getLeadSource()) {
  if (src.utm_source) return [src.utm_source, src.utm_medium, src.utm_campaign].filter(Boolean).join(' / ');
  if (src.fbclid) return 'facebook / paid';
  if (src.referrer && !src.referrer.includes('sangeetseekho')) return src.referrer;
  return 'direct';
}

export function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

/** Copy text with a fallback for older mobile browsers. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }
}

export const isPlaceholder = (v) => !v || /YOUR_|PASTE_|XXXX/.test(String(v));
