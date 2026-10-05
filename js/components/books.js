/* Floating eBook visuals, free-preview gallery and cross-promotion cards.

   Floating book markup is generated from placeholders:
     <div data-book="fingerstyle" data-size="lg" data-sticker="fingerstyle" data-eager></div>
   - data-book:    'fingerstyle' | 'chord'  (cover comes from js/content/ebooks.js)
   - data-size:    'lg' | 'md' | 'sm'
   - data-sticker: product key whose "% OFF" is shown (leave out for no sticker)  */
import { EBOOKS } from '../content/ebooks.js';
import { PRODUCT_CONFIG } from '../config.js';
import { escapeHtml as e, inr } from '../core/utils.js';
import { openDialog, wireDialog, icons } from './ui.js';

const offText = (key) => { const p = PRODUCT_CONFIG[key]; return p ? Math.round((1 - p.price / p.mrp) * 100) : 0; };

export function bookMarkup(key, { size = 'md', sticker = '', eager = false } = {}) {
  const b = EBOOKS[key];
  if (!b) return '';
  const off = sticker ? offText(sticker) : 0;
  return `<div class="book book--${size}">
    <div class="book-3d">
      <div class="book-back" aria-hidden="true"></div>
      <div class="book-pages" aria-hidden="true"></div>
      <picture class="book-cover"><source srcset="${b.cover}${size === 'lg' ? '' : '-360'}.webp" type="image/webp"><img src="${b.cover}${size === 'lg' ? '' : '-360'}.jpg" alt="${e(b.title)} eBook cover" width="720" height="1018" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>
    </div>
    <div class="book-shadow" aria-hidden="true"></div>
    ${off ? `<div class="book-sticker" aria-label="${off}% off"><b>${off}%</b><span>OFF</span></div>` : ''}
  </div>`;
}

export function initBooks(root = document) {
  root.querySelectorAll('[data-book]').forEach((el) => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    el.innerHTML = bookMarkup(el.dataset.book, { size: el.dataset.size || 'md', sticker: el.dataset.sticker || '', eager: el.hasAttribute('data-eager') });
  });
}

/* ---------------- Free preview gallery + lightbox ---------------- */
let lightbox;
function openLightbox(key, index) {
  const b = EBOOKS[key];
  if (!lightbox) {
    lightbox = document.createElement('dialog');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-label', 'Preview page');
    lightbox.innerHTML = `
      <button type="button" class="icon-btn lb-close" data-close aria-label="Close">${icons.close}</button>
      <button type="button" class="lb-nav lb-prev" aria-label="Previous page">‹</button>
      <figure class="lb-figure"><img alt=""><figcaption></figcaption></figure>
      <button type="button" class="lb-nav lb-next" aria-label="Next page">›</button>`;
    document.body.appendChild(lightbox);
    wireDialog(lightbox);
    lightbox.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight') step(1); if (ev.key === 'ArrowLeft') step(-1); });
    lightbox.querySelector('.lb-prev').addEventListener('click', () => step(-1));
    lightbox.querySelector('.lb-next').addEventListener('click', () => step(1));
  }
  function show() {
    const p = b.previews[lightbox._i];
    const img = lightbox.querySelector('img');
    img.src = `${p.img}.webp`; img.alt = `Preview: page ${p.page} — ${p.label}`;
    img.onerror = () => { img.onerror = null; img.src = `${p.img}.jpg`; };
    lightbox.querySelector('figcaption').textContent = `Page ${p.page} of ${b.totalPages} · ${p.label}`;
  }
  function step(d) { lightbox._i = (lightbox._i + d + b.previews.length) % b.previews.length; show(); }
  lightbox._i = index;
  show();
  openDialog(lightbox);
}

export function renderPreview(el) {
  if (!el) return;
  const key = el.dataset.preview;
  const b = EBOOKS[key];
  if (!b || !b.previews.length) { el.hidden = true; return; }
  el.innerHTML = `<div class="preview-rail">${b.previews.map((p, i) => `
    <button type="button" class="preview-page" data-i="${i}" aria-label="Open preview of page ${p.page}: ${e(p.label)}">
      <picture><source srcset="${p.img}.webp" type="image/webp"><img src="${p.img}.jpg" alt="" width="900" height="1272" loading="lazy" decoding="async"></picture>
      <span class="preview-label">p.${p.page} · ${e(p.label)}</span>
    </button>`).join('')}</div>
    <p class="preview-note">${b.previews.length} of ${b.totalPages} pages · tap a page to zoom</p>`;
  el.addEventListener('click', (ev) => { const btn = ev.target.closest('.preview-page'); if (btn) openLightbox(key, Number(btn.dataset.i)); });
}

/* ---------------- Cross-promotion cards ---------------- */
/** Compact "You may also like" card (eBook pages): data-other-book="chord" */
export function renderOtherBook(el) {
  if (!el) return;
  const key = el.dataset.otherBook;
  const b = EBOOKS[key]; const p = PRODUCT_CONFIG[key];
  el.innerHTML = `<a class="other-book" href="${b.page}">
    <div class="other-book-visual">${bookMarkup(key, { size: 'sm', sticker: key })}</div>
    <div class="other-book-copy">
      <p class="eyebrow">You may also like</p>
      <h3>${e(b.title)}</h3>
      <p>${e(b.tagline)}</p>
      <p class="other-book-price"><b>${inr(p.price)}</b> <s>${inr(p.mrp)}</s></p>
      <span class="btn btn--dark btn--sm">View eBook <span class="btn-arrow">→</span></span>
    </div>
  </a>`;
}

/** Two eBook cards for the Online Classes page (no ₹ prices on that page). */
export function renderBookShelf(el) {
  if (!el) return;
  el.innerHTML = ['fingerstyle', 'chord'].map((key) => {
    const b = EBOOKS[key];
    return `<a class="shelf-card" href="${b.page}">
      <div class="shelf-visual">${bookMarkup(key, { size: 'sm', sticker: key })}</div>
      <div class="shelf-copy"><h3>${e(b.title)}</h3><p>${e(b.tagline)}</p><span class="link-arrow">See the eBook →</span></div>
    </a>`;
  }).join('');
}
