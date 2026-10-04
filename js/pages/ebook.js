/* eBook landing pages. The page says which product it is: <body data-product="fingerstyle">. */
import { boot } from '../main.js';
import { PRODUCT_CONFIG, SITE_CONFIG } from '../config.js';
import { renderFAQ, renderReviews, renderFounder } from '../components/sections.js';
import { initOfferTimers } from '../components/offer-timer.js';
import { initBuyButtons, getPurchases } from '../features/checkout.js';
import { track, productParams } from '../analytics/pixel.js';
import { uid } from '../core/utils.js';

boot();

const key = document.body.dataset.product;
const product = PRODUCT_CONFIG[key];

renderFAQ(document.querySelector('[data-faq]'));
renderReviews(document.querySelector('[data-reviews]'));
renderFounder(document.querySelector('[data-founder]'));
initOfferTimers();
initBuyButtons();

if (product) {
  track('ViewContent', productParams(product), uid('vc'));

  // Product structured data (Google rich results)
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

// Sticky mobile buy bar: appears after the hero's buy button scrolls away, hides at the pricing section.
const bar = document.querySelector('.buybar');
const heroCta = document.querySelector('[data-hero-cta]');
const pricing = document.querySelector('#pricing');
if (bar && heroCta && 'IntersectionObserver' in window) {
  let heroVisible = true, pricingVisible = false;
  const update = () => { const show = !heroVisible && !pricingVisible; bar.classList.toggle('is-visible', show); document.body.classList.toggle('has-buybar', show); };
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }).observe(heroCta);
  if (pricing) new IntersectionObserver(([en]) => { pricingVisible = en.isIntersecting; update(); }, { threshold: 0.15 }).observe(pricing);
}

// Returning buyer: show a link back to their access page (helps if the browser was closed after paying).
const recent = getPurchases().filter((p) => Date.now() - p.ts < 30 * 24 * 3600 * 1000).pop();
const note = document.querySelector('[data-returning]');
if (recent && note) {
  note.innerHTML = `Bought already? <a href="/thank-you/?payment_id=${encodeURIComponent(recent.paymentId)}">Open your eBook access page →</a>`;
  note.hidden = false;
}
