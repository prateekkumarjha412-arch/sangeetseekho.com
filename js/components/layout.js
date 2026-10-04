/* Header, footer and the two floating buttons. Rendered once on every page so a
   menu link only has to be edited here. */
import { SITE_CONFIG, CONTACT_CONFIG } from '../config.js';
import { icons, openDialog, closeDialog, wireDialog, toast } from './ui.js';
import { waLink, pageMessage, paymentProblemMessage } from '../features/whatsapp.js';
import { copyText, escapeHtml, isPlaceholder } from '../core/utils.js';
import { log } from '../core/logger.js';

export const NAV = [
  { href: '/', label: 'Online Classes', match: (p) => p === '/' || p === '/index.html' },
  { href: '/fingerstyle-guitar-ebook/', label: 'Fingerstyle eBook', match: (p) => p.startsWith('/fingerstyle-guitar-ebook') },
  { href: '/chord-modulation-theory/', label: 'Chord Modulation', match: (p) => p.startsWith('/chord-modulation-theory') },
  { href: '/contact/', label: 'Contact', match: (p) => p.startsWith('/contact') },
];

export const LOGO_MARK = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true" width="34" height="34">
  <rect width="40" height="40" rx="11" fill="currentColor"/>
  <circle cx="20" cy="21" r="9.5" fill="none" stroke="var(--logo-ink,#FAF6EF)" stroke-width="2.4"/>
  <path d="M16.5 6v30M20 6v30M23.5 6v30" stroke="var(--logo-ink,#FAF6EF)" stroke-width="1.4" opacity=".9"/>
</svg>`;

function headerCta(path) {
  if (path.startsWith('/fingerstyle-guitar-ebook') || path.startsWith('/chord-modulation-theory')) return { href: '#pricing', label: 'Get the eBook' };
  if (path === '/' || path === '/index.html') return { href: '#enroll', label: 'Book a class' };
  return { href: '/#enroll', label: 'Book a class' };
}

export function renderHeader() {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;
  const path = location.pathname;
  const cta = headerCta(path);
  host.innerHTML = `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="header-inner container">
    <a class="logo" href="/" aria-label="${SITE_CONFIG.NAME} — home">${LOGO_MARK}<span>Sangeet<b>Seekho</b></span></a>
    <nav class="nav" aria-label="Main">
      <ul id="nav-list" class="nav-list">
        ${NAV.map((n) => `<li><a href="${n.href}" ${n.match(path) ? 'aria-current="page"' : ''}>${n.label}</a></li>`).join('')}
      </ul>
    </nav>
    <a class="btn btn--primary btn--sm header-cta" href="${cta.href}">${cta.label}</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-list" aria-label="Open menu">${icons.menu}</button>
  </div>`;
  const toggle = host.querySelector('.nav-toggle');
  const list = host.querySelector('.nav-list');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    host.classList.toggle('nav-open', !open);
  });
  list.addEventListener('click', (e) => { if (e.target.closest('a')) { host.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && host.classList.contains('nav-open')) toggle.click(); });
  const onScroll = () => host.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

export function renderFooter() {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;
  const year = new Date().getFullYear();
  const social = [
    CONTACT_CONFIG.INSTAGRAM_URL && `<a href="${CONTACT_CONFIG.INSTAGRAM_URL}" rel="noopener" target="_blank">Instagram</a>`,
    CONTACT_CONFIG.YOUTUBE_URL && `<a href="${CONTACT_CONFIG.YOUTUBE_URL}" rel="noopener" target="_blank">YouTube</a>`,
  ].filter(Boolean).join('');
  host.innerHTML = `
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="logo logo--light" href="/">${LOGO_MARK}<span>Sangeet<b>Seekho</b></span></a>
      <p>Live 1-on-1 guitar classes and handwritten guitar eBooks by ${SITE_CONFIG.FOUNDER} and team.</p>
      <p class="footer-teachers">Teachers: <strong>Abhishek Sir</strong> · <strong>Rahul Sir</strong> · <strong>Sambit Sir</strong> · <strong>Girija Mam</strong></p>
    </div>
    <div>
      <h2 class="footer-h">Learn</h2>
      <ul class="footer-links">
        <li><a href="/">Online 1-on-1 Guitar Classes</a></li>
        <li><a href="/fingerstyle-guitar-ebook/">Fingerstyle Guitar eBook</a></li>
        <li><a href="/chord-modulation-theory/">Chord Modulation Theory</a></li>
        <li><a href="/fingerstyle-guitar-ebook/#combo">eBook Combo</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Help</h2>
      <ul class="footer-links">
        <li><a href="/contact/">Contact us</a></li>
        <li><button type="button" class="linklike" data-open-payment-help>Payment problem?</button></li>
        <li><a href="/refund-policy/">Refund Policy</a></li>
        <li><a href="/terms/">Terms &amp; Conditions</a></li>
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/delivery-policy/">Delivery Policy</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-h">Talk to us</h2>
      <ul class="footer-links">
        <li><a href="${waLink(pageMessage())}" target="_blank" rel="noopener">WhatsApp ${CONTACT_CONFIG.PHONE_DISPLAY}</a></li>
        <li><a href="mailto:${CONTACT_CONFIG.EMAIL}">${CONTACT_CONFIG.EMAIL}</a></li>
        <li class="muted">${CONTACT_CONFIG.SUPPORT_HOURS}</li>
        ${social ? `<li class="footer-social">${social}</li>` : ''}
      </ul>
    </div>
  </div>
  <div class="container footer-base">
    <p>© ${year} ${SITE_CONFIG.NAME}. All rights reserved.</p>
    <p class="muted">${icons.lock} Payments secured by Razorpay</p>
  </div>`;
}

/* ---------------- Floating buttons + payment help ---------------- */
function paymentHelpDialog() {
  const c = CONTACT_CONFIG;
  const upiReady = !isPlaceholder(c.UPI_ID);
  const upiLink = `upi://pay?pa=${encodeURIComponent(c.UPI_ID)}&pn=${encodeURIComponent(c.UPI_PAYEE_NAME)}&cu=INR`;
  const dlg = document.createElement('dialog');
  dlg.className = 'sheet payhelp';
  dlg.id = 'payment-help';
  dlg.setAttribute('aria-labelledby', 'payhelp-title');
  dlg.innerHTML = `
    <div class="sheet-head">
      <div>
        <p class="eyebrow">Payment support</p>
        <h2 id="payhelp-title" class="h4">Payment failed or access not received?</h2>
      </div>
      <button type="button" class="icon-btn" data-close aria-label="Close">${icons.close}</button>
    </div>
    <div class="sheet-body">
      <p class="payhelp-note">If money was deducted, it is safe — send us the screenshot and we'll give you access manually. You can also pay directly by UPI below.</p>
      <div class="payhelp-grid">
        <figure class="payhelp-qr">
          <img src="${escapeHtml(c.UPI_QR_IMAGE)}" alt="UPI QR code for ${escapeHtml(c.UPI_PAYEE_NAME)}" width="200" height="200" loading="lazy">
          <figcaption>Scan with any UPI app</figcaption>
        </figure>
        <div class="payhelp-rows">
          <div class="copy-row">
            <span class="copy-label">UPI ID</span>
            <span class="copy-value" data-copy-value>${escapeHtml(upiReady ? c.UPI_ID : 'UPI ID coming soon')}</span>
            <button type="button" class="copy-btn" data-copy="${escapeHtml(c.UPI_ID)}" ${upiReady ? '' : 'disabled'} aria-label="Copy UPI ID">${icons.copy}<span>Copy</span></button>
          </div>
          <div class="copy-row">
            <span class="copy-label">Phone</span>
            <span class="copy-value">${escapeHtml(c.PHONE_DISPLAY)}</span>
            <button type="button" class="copy-btn" data-copy="+${escapeHtml(c.WHATSAPP_NUMBER)}" aria-label="Copy phone number">${icons.copy}<span>Copy</span></button>
          </div>
          ${upiReady ? `<a class="btn btn--ghost btn--block upi-app-btn" href="${upiLink}">Open UPI app</a>` : ''}
        </div>
      </div>
      <a class="btn btn--whatsapp btn--block btn--lg" href="${waLink(paymentProblemMessage())}" target="_blank" rel="noopener">${icons.whatsapp}<span>Send Payment Screenshot on WhatsApp</span></a>
      <p class="payhelp-foot">We reply within working hours (${escapeHtml(c.SUPPORT_HOURS)}). Please include the amount, time of payment and the email you used.</p>
    </div>`;
  document.body.appendChild(dlg);
  wireDialog(dlg);
  dlg.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b || b.disabled) return;
    const ok = await copyText(b.dataset.copy);
    b.classList.toggle('is-copied', ok);
    b.querySelector('span').textContent = ok ? 'Copied' : 'Copy failed';
    toast(ok ? 'Copied to clipboard' : 'Could not copy — please select and copy manually', { type: ok ? 'success' : 'error' });
    setTimeout(() => { b.classList.remove('is-copied'); b.querySelector('span').textContent = 'Copy'; }, 2200);
  });
  return dlg;
}

export function renderFloating() {
  const wrap = document.createElement('div');
  wrap.className = 'floaters';
  wrap.innerHTML = `
    <button type="button" class="floater floater--pay" data-open-payment-help aria-haspopup="dialog" aria-controls="payment-help">
      ${icons.card}<span class="floater-label">Payment issue?</span>
    </button>
    <a class="floater floater--wa" href="${waLink(pageMessage())}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${icons.whatsapp}</a>`;
  document.body.appendChild(wrap);
  let dlg = null;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-payment-help]')) return;
    e.preventDefault();
    dlg = dlg || paymentHelpDialog();
    openDialog(dlg);
    log('ui.payment_help_opened');
  });
  wrap.querySelector('.floater--wa').addEventListener('click', () => log('ui.whatsapp_float_click'));
  return { close: () => dlg && closeDialog(dlg) };
}
