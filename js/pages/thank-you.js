/* Thank-you / access page.
   - Shows the download links ONLY after the server confirms the payment with Razorpay.
   - Refreshing or re-opening this URL is safe: the server answers from the sheet,
     no second email is sent, and the Purchase event is not fired again
     (same eventID + browser memory + Meta de-duplication).
   - If confirmation is slow, it keeps checking for ~90 s and then shows a calm
     "being confirmed" message with the payment ID and WhatsApp support. */
import { boot } from '../main.js';
import { call, backendReady } from '../core/api.js';
import { session } from '../core/storage.js';
import { escapeHtml as e, copyText, inr, sleep } from '../core/utils.js';
import { track } from '../analytics/pixel.js';
import { PRODUCT_CONFIG } from '../config.js';
import { waLink, accessHelpMessage } from '../features/whatsapp.js';
import { icons, toast } from '../components/ui.js';
import { log, warn } from '../core/logger.js';

boot();

const host = document.querySelector('[data-access]');
const params = new URLSearchParams(location.search);
const paymentId = (params.get('payment_id') || '').trim();
const checkoutId = (params.get('ck') || '').trim();

function render(kind, html) { host.dataset.state = kind; host.innerHTML = html; host.focus({ preventScroll: true }); }

const supportBox = (r = {}) => `
  <aside class="support-box" aria-labelledby="support-title">
    <h2 id="support-title" class="h5">Didn’t receive your eBook?</h2>
    <p>Check Spam/Promotions first. Still missing? Message us — we’ll sort it out quickly.</p>
    <a class="btn btn--whatsapp" target="_blank" rel="noopener" href="${waLink(accessHelpMessage({ product: r.productName, paymentId }))}">${icons.whatsapp}<span>Contact support on WhatsApp</span></a>
  </aside>`;

const pidRow = () => paymentId ? `<p class="pid">Payment ID: <code>${e(paymentId)}</code> <button type="button" class="copy-btn" data-copy="${e(paymentId)}">${icons.copy}<span>Copy</span></button></p>` : '';

function showSuccess(r) {
  const items = r.items || [];
  render('success', `
    <div class="ty-badge" aria-hidden="true">${icons.check}</div>
    <h1 class="h2" tabindex="-1">Thank You! Your Purchase Was Successful.</h1>
    <p class="lead">You bought <strong>${e(r.productName)}</strong>${r.amount ? ` for ${inr(r.amount)}` : ''}.</p>
    <div class="ty-downloads">
      ${items.map((it) => `<a class="btn btn--primary btn--lg btn--block" href="${e(it.url)}" target="_blank" rel="noopener">${e(it.title)} — Open / Download</a>`).join('')}
    </div>
    <p class="muted">${r.emailMasked ? `We’ve also emailed the link${items.length > 1 ? 's' : ''} to <b>${e(r.emailMasked)}</b>.` : 'We’ve also emailed your access link.'} Save this page or the email — access is lifetime.</p>
    ${pidRow()}
    ${supportBox(r)}`);

  // Meta Purchase — only here, only after server confirmation, only once per payment.
  const p = PRODUCT_CONFIG[r.productKey];
  track('Purchase', {
    content_ids: r.contentIds || (p ? [p.id] : []), content_name: r.productName, content_type: 'product',
    value: r.amount || (p && p.price) || 0, currency: 'INR', num_items: 1,
  }, r.purchaseEventId || `purchase_${paymentId}`, { persist: true });
}

function showPending() {
  render('pending', `
    <div class="ty-badge ty-badge--wait" aria-hidden="true"><span class="spinner spinner--lg"></span></div>
    <h1 class="h2" tabindex="-1">Your payment is being confirmed</h1>
    <p class="lead">Razorpay has your payment and our system is confirming it. This normally takes under a minute — sometimes up to 15 minutes when banks are slow.</p>
    <p>You don’t need to pay again. As soon as it’s confirmed, the eBook link is emailed to you automatically. You can also refresh this page later.</p>
    <button type="button" class="btn btn--ghost" data-recheck>Check again</button>
    ${pidRow()}
    ${supportBox()}`);
}

function showProblem(title, text) {
  render('problem', `
    <h1 class="h2" tabindex="-1">${e(title)}</h1>
    <p class="lead">${e(text)}</p>
    ${pidRow()}
    ${supportBox()}
    <p><a href="/fingerstyle-guitar-ebook/">Back to the eBooks</a></p>`);
}

async function check({ attempts = 18, gap = 5000 } = {}) {
  render('checking', `<div class="ty-badge ty-badge--wait" aria-hidden="true"><span class="spinner spinner--lg"></span></div><h1 class="h3" tabindex="-1">Confirming your payment…</h1><p class="muted">Please wait a few seconds.</p>`);
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await call('payment.status', { paymentId, checkoutId }, { timeoutMs: 20000, retries: 0 });
      log('thankyou.status', { status: r.status, attempt: i + 1 });
      if (r.verified) { session.set(`ss_verify_${paymentId}`, r); return showSuccess(r); }
      if (r.status === 'AMOUNT_MISMATCH' || r.status === 'INVALID') return showProblem('We couldn’t confirm this payment automatically', 'Please message us on WhatsApp with your Payment ID — we’ll check it manually and help you right away.');
      if (r.status === 'FAILED') return showProblem('This payment did not complete', 'Razorpay reports this payment as failed. If money was deducted, it is usually refunded by your bank automatically within 5–7 working days. You can try buying again, or message us.');
      if (r.status === 'NOT_FOUND' && i >= 3) return showProblem('We couldn’t find this payment', 'If you paid, please message us on WhatsApp with your payment screenshot.');
    } catch (err) {
      warn('thankyou.status_error', { kind: err.kind });
      if (err.kind === 'not_configured') return showProblem('Setup not finished', 'The payment server is not connected yet. Please contact us on WhatsApp for access.');
    }
    if (i === 2) showPending();
    await sleep(gap);
  }
  showPending();
}

host.addEventListener('click', async (ev) => {
  const c = ev.target.closest('[data-copy]');
  if (c) { const ok = await copyText(c.dataset.copy); toast(ok ? 'Payment ID copied' : 'Could not copy', { type: ok ? 'success' : 'error' }); }
  if (ev.target.closest('[data-recheck]')) check({ attempts: 6, gap: 4000 });
});

if (!/^pay_[A-Za-z0-9]{6,30}$/.test(paymentId)) {
  showProblem('No purchase found on this link', 'This page shows your eBook after a payment. If you bought an eBook and landed here, please use the link in your email, or message us on WhatsApp.');
} else {
  const cached = session.get(`ss_verify_${paymentId}`);
  if (cached && cached.verified) showSuccess(cached);
  else if (!backendReady()) showProblem('Setup not finished', 'The payment server is not connected yet. Please contact us on WhatsApp with your Payment ID for access.');
  else check();
}
