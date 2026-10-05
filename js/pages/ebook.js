/* eBook landing pages. The page says which product it is: <body data-product="fingerstyle">. */
import { boot } from '../main.js';
import { PRODUCT_CONFIG, SITE_CONFIG } from '../config.js';
import { renderFAQ, renderReviews } from '../components/sections.js';
import { initBooks, renderPreview, renderOtherBook } from '../components/books.js';
import { initOfferTimers } from '../components/offer-timer.js';
import { initBuyButtons, getPurchases } from '../features/checkout.js';
import { track, productParams } from '../analytics/pixel.js';
import { uid } from '../core/utils.js';

boot();

const key = document.body.dataset.product;
const product = PRODUCT_CONFIG[key];

initBooks();
renderPreview(document.querySelector('[data-preview]'));
renderOtherBook(document.querySelector('[data-other-book]'));
initBooks();
renderFAQ(document.querySelector('[data-faq]'));
renderReviews(document.querySelector('[data-reviews]'));
initOfferTimers();
initBuyButtons();

if (product) {
  track('ViewContent', productParams(product), uid('vc'));
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    image: `${SITE_CONFIG.DOMAIN}${product.cover}.jpg`, brand: { '@type': 'Brand', name: SITE_CONFIG.NAME },
    author: SITE_CONFIG.FOUNDER, sku: product.id,
    offers: { '@type': 'Offer', price: product.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: `${SITE_CONFIG.DOMAIN}${product.page}` },
  });
  document.head.appendChild(ld);
}

/* Persistent "Get the eBook" bar (mobile: full-width bottom bar · desktop: compact floating pill).
   Shown once the hero's buy button has scrolled away; hidden while the final buy section is on screen,
   so it never covers the main price/CTA. */
const bar = document.querySelector('.buybar');
const heroCta = document.querySelector('[data-hero-cta]');
const finalCta = document.querySelector('#pricing');
if (bar && heroCta && 'IntersectionObserver' in window) {
  let heroVisible = true, finalVisible = false;
  const update = () => {
    const show = !heroVisible && !finalVisible;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    bar.querySelectorAll('a,button').forEach((x) => { x.tabIndex = show ? 0 : -1; });
    document.body.classList.toggle('has-buybar', show);
  };
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }).observe(heroCta);
  if (finalCta) new IntersectionObserver(([en]) => { finalVisible = en.isIntersecting; update(); }, { threshold: 0.2 }).observe(finalCta);
  update();
}

// Returning buyer: link back to their access page (helps if the browser was closed after paying).
const recent = getPurchases().filter((p) => Date.now() - p.ts < 30 * 24 * 3600 * 1000).pop();
const note = document.querySelector('[data-returning]');
if (recent && note) {
  note.innerHTML = `Bought already? <a href="/thank-you/?payment_id=${encodeURIComponent(recent.paymentId)}">Open your eBook access page →</a>`;
  note.hidden = false;
}
