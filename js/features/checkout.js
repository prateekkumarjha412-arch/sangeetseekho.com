/* eBook checkout with Razorpay.

   ┌ Buy button ─► checkout sheet (name, email, phone, product) ─► final "Pay" button
   │   on "Pay":  (all three start at the same moment, none waits for another)
   │     a) lead saved to Google Sheet (outbox, retried, never blocks)
   │     b) Meta InitiateCheckout (once per checkout ID)
   │     c) server creates the Razorpay order + Razorpay script preloads
   │   Razorpay opens as soon as the order + script are ready (usually 1–3 s). A loading
   │   indicator appears ONLY if that takes longer than ~0.4 s. If the server is slow
   │   (> ORDER_GRACE_MS) Razorpay still opens (order-less mode);
   │   the server verifies the payment by amount + product afterwards.
   ├ success  ─► "Confirming payment…" ─► server verifies signature + amount with
   │             Razorpay API ─► /thank-you/?payment_id=… (shows access only if verified)
   ├ closed   ─► "Checkout closed" panel: Try again (same order — no duplicate) / Help
   └ failed   ─► "Payment failed" panel with the bank's reason: Try again / UPI / WhatsApp

   Safety:
   - One checkout ID per (product + customer); retries reuse the same server order.
   - State machine prevents double clicks, double Razorpay windows and double verifies.
   - Prices are only for display: the SERVER decides the amount for each product. */
import { PRODUCT_CONFIG, PAYMENT_CONFIG } from '../config.js';
import { call, sendReliable, ping, backendReady } from '../core/api.js';
import { attachLiveValidation, validateForm, formData, normalizePhone } from '../core/validate.js';
import { uid, inr, sleep, getCookie, getLeadSource, describeSource, escapeHtml as e, isPlaceholder } from '../core/utils.js';
import { local, session } from '../core/storage.js';
import { log, warn, error } from '../core/logger.js';
import { track, productParams } from '../analytics/pixel.js';
import { openDialog, closeDialog, wireDialog, icons } from '../components/ui.js';
import { waLink, paymentProblemMessage } from './whatsapp.js';

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const ATTEMPT_KEY = 'ss_checkout_attempt_v1';
const PURCHASES_KEY = 'ss_purchases_v1';
const ATTEMPT_MAX_AGE = 25 * 60 * 1000;

/* ---------------- Razorpay script loader (preload, timeout, retry) ---------------- */
let rzpPromise = null;
export function loadRazorpay(timeoutMs = 10000) {
  if (window.Razorpay) return Promise.resolve(true);
  if (rzpPromise) return rzpPromise;
  rzpPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = RZP_SRC; s.async = true;
    const t = setTimeout(() => { warn('rzp.script_timeout'); done(false); }, timeoutMs);
    function done(ok) { clearTimeout(t); if (!ok) { rzpPromise = null; s.remove(); } resolve(ok); }
    s.onload = () => done(!!window.Razorpay);
    s.onerror = () => { warn('rzp.script_error'); done(false); };
    document.head.appendChild(s);
  });
  return rzpPromise;
}

/* ---------------- Attempt (idempotency) ---------------- */
function getAttempt(productKey, customer) {
  const a = session.get(ATTEMPT_KEY);
  const same = a && !a.paid && a.productKey === productKey && a.email === customer.email && a.phone === customer.phone && Date.now() - a.createdAt < ATTEMPT_MAX_AGE;
  if (same) { log('checkout.reuse_attempt', { checkoutId: a.checkoutId }); return a; }
  const fresh = { checkoutId: uid('ck'), productKey, ...customer, createdAt: Date.now(), orderId: null, amount: null };
  session.set(ATTEMPT_KEY, fresh);
  return fresh;
}
const saveAttempt = (a) => session.set(ATTEMPT_KEY, a);

export function rememberPurchase(rec) {
  const list = local.get(PURCHASES_KEY, []);
  if (!list.some((x) => x.paymentId === rec.paymentId)) list.push(rec);
  local.set(PURCHASES_KEY, list.slice(-10));
}
export const getPurchases = () => local.get(PURCHASES_KEY, []);

/* ---------------- Checkout sheet ---------------- */
let dlg, form, state = 'closed', current = null, orderPromise = null, rzp = null, lastFailure = null;

function setState(s) { state = s; dlg && (dlg.dataset.state = s); log('checkout.state', { state: s, checkoutId: current && current.checkoutId }); }

function productOption(p, checked) {
  const off = Math.round((1 - p.price / p.mrp) * 100);
  return `<label class="opt ${p.bestValue ? 'opt--best' : ''}">
    <input type="radio" name="product" value="${p.key}" ${checked ? 'checked' : ''} data-validate="choice">
    <span class="opt-body">
      <span class="opt-name">${e(p.name)}${p.bestValue ? '<span class="tag">Best value</span>' : ''}</span>
      <span class="opt-price"><b>${inr(p.price)}</b> <s>${inr(p.mrp)}</s> <em>${off}% off</em></span>
    </span>
  </label>`;
}

function buildDialog() {
  dlg = document.createElement('dialog');
  dlg.className = 'sheet checkout';
  dlg.id = 'checkout';
  dlg.setAttribute('aria-labelledby', 'checkout-title');
  dlg.dataset.backdropClose = 'false';
  dlg.innerHTML = `
    <div class="sheet-head">
      <div><p class="eyebrow">${icons.lock} Secure checkout</p><h2 id="checkout-title" class="h4">Get instant access</h2></div>
      <button type="button" class="icon-btn" data-close aria-label="Close">${icons.close}</button>
    </div>
    <div class="sheet-body">
      <div class="ck-panel" data-panel="form">
        <div class="ck-already" hidden></div>
        <form class="ck-form" novalidate>
          <fieldset class="opts"><legend class="visually-hidden">Choose your eBook</legend><div class="opts-list"></div></fieldset>
          <div class="field"><label for="ck-name">Full name</label><input id="ck-name" name="name" autocomplete="name" data-validate="name" maxlength="60" required></div>
          <div class="field"><label for="ck-email">Email <small>(your eBook is sent here)</small></label><input id="ck-email" name="email" type="email" inputmode="email" autocomplete="email" data-validate="email" maxlength="100" required></div>
          <div class="field"><label for="ck-phone">WhatsApp number</label><input id="ck-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="98765 43210" data-validate="phone" maxlength="18" required></div>
          <div class="hp-field" aria-hidden="true"><label>Leave this empty<input name="ss_extra" tabindex="-1" autocomplete="off"></label></div>
          <button type="submit" class="btn btn--primary btn--block btn--lg ck-pay"><span class="btn-label">Pay securely</span></button>
          <p class="ck-fine">${icons.lock} Payment by Razorpay · UPI, cards, net banking · Instant email delivery</p>
          <p class="form-status" hidden aria-live="polite"></p>
        </form>
      </div>

      <div class="ck-panel ck-center" data-panel="opening" hidden>
        <span class="spinner spinner--lg" aria-hidden="true"></span>
        <h3 class="h4">Opening secure checkout… <span class="ck-elapsed" aria-hidden="true"></span></h3>
        <p class="muted">Connecting to Razorpay. Please don’t close this page.</p>
      </div>

      <div class="ck-panel ck-center" data-panel="verifying" hidden>
        <span class="spinner spinner--lg" aria-hidden="true"></span>
        <h3 class="h4">Payment received — confirming…</h3>
        <p class="muted">Please don’t close this page. It takes a few seconds.</p>
      </div>

      <div class="ck-panel ck-center" data-panel="cancelled" hidden>
        <h3 class="h4">Checkout closed</h3>
        <p class="muted">No payment was completed. If money was deducted, don’t pay again — use "Payment help" below.</p>
        <div class="ck-actions">
          <button type="button" class="btn btn--primary btn--block" data-retry>Try again</button>
          <button type="button" class="btn btn--ghost btn--block" data-open-payment-help>Payment help</button>
        </div>
      </div>

      <div class="ck-panel ck-center" data-panel="failed" hidden>
        <div class="ck-fail-ico" aria-hidden="true">!</div>
        <h3 class="h4">Payment could not be completed.</h3>
        <p class="ck-reason muted"></p>
        <p class="muted small">If money was deducted, don’t pay again — contact us.</p>
        <div class="ck-actions">
          <button type="button" class="btn btn--primary btn--block" data-retry>Try again</button>
          <button type="button" class="btn btn--ghost btn--block" data-open-payment-help>Payment support (UPI / QR)</button>
          <a class="btn btn--whatsapp btn--block" data-wa-fail target="_blank" rel="noopener">${icons.whatsapp}<span>WhatsApp support</span></a>
        </div>
      </div>

      <div class="ck-panel ck-center" data-panel="error" hidden>
        <h3 class="h4">We couldn’t open the payment window</h3>
        <p class="ck-error muted"></p>
        <div class="ck-actions">
          <button type="button" class="btn btn--primary btn--block" data-retry>Try again</button>
          <a class="btn btn--whatsapp btn--block" data-wa-help target="_blank" rel="noopener">${icons.whatsapp}<span>Get help on WhatsApp</span></a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(dlg);
  form = dlg.querySelector('.ck-form');
  attachLiveValidation(form);
  wireDialog(dlg, { onClose: () => { if (['form', 'cancelled', 'failed', 'error'].includes(state)) setState('closed'); } });
  dlg.addEventListener('cancel', (ev) => { if (['starting', 'opening', 'verifying'].includes(state)) ev.preventDefault(); });
  dlg.querySelector('[data-close]').addEventListener('click', (ev) => {
    if (['starting', 'opening', 'verifying'].includes(state)) { ev.stopPropagation(); }
  }, true);
  form.addEventListener('change', (ev) => { if (ev.target.name === 'product') updatePayLabel(); });
  form.addEventListener('submit', onPay);
  dlg.addEventListener('click', (ev) => { if (ev.target.closest('[data-retry]')) retry(); });
}

function showPanel(name) {
  dlg.querySelectorAll('.ck-panel').forEach((p) => { p.hidden = p.dataset.panel !== name; });
  const closeBtn = dlg.querySelector('[data-close]');
  closeBtn.hidden = ['opening', 'verifying'].includes(name);
}

function selectedProduct() {
  const r = form.querySelector('input[name="product"]:checked');
  return PRODUCT_CONFIG[r ? r.value : 'fingerstyle'];
}

function updatePayLabel() {
  const p = selectedProduct();
  form.querySelector('.ck-pay .btn-label').textContent = `Pay ${inr(p.price)} securely`;
  const prev = getPurchases().filter((x) => x.productKey === p.key && Date.now() - x.ts < 30 * 24 * 3600 * 1000);
  const box = dlg.querySelector('.ck-already');
  if (prev.length) {
    const last = prev[prev.length - 1];
    box.innerHTML = `<p><b>You already bought this on this device.</b> <a href="/thank-you/?payment_id=${encodeURIComponent(last.paymentId)}">Open your access page →</a><br><small>No need to pay again. Want another copy anyway? Continue below.</small></p>`;
    box.hidden = false;
  } else box.hidden = true;
}

/** Public: open the checkout for a product key ('fingerstyle' | 'chord' | 'combo'). */
export function openCheckout(productKey) {
  if (!dlg) buildDialog();
  if (['starting', 'opening', 'in_razorpay', 'verifying'].includes(state)) { log('checkout.open_ignored', { state }); return; }
  const main = PRODUCT_CONFIG[productKey] || PRODUCT_CONFIG.fingerstyle;
  const keys = productKey === 'combo' ? ['combo'] : [main.key, 'combo'];
  const others = Object.keys(PRODUCT_CONFIG).filter((k) => !keys.includes(k));
  dlg.querySelector('.opts-list').innerHTML = [...keys, ...others].map((k) => productOption(PRODUCT_CONFIG[k], k === main.key)).join('');
  // Restore what the customer typed earlier in this tab
  const prev = session.get(ATTEMPT_KEY);
  if (prev) { ['name', 'email', 'phone'].forEach((f) => { const i = form.elements[f]; if (i && !i.value && prev[f + 'Raw']) i.value = prev[f + 'Raw']; }); }
  const st = form.querySelector('.form-status'); st.hidden = true;
  resetPayButton();
  updatePayLabel();
  showPanel('form');
  setState('form');
  openDialog(dlg);
  loadRazorpay(); // warm up the Razorpay script
  warmServer();   // wake up Google Apps Script so the order is created faster
  setTimeout(() => { const n = form.elements.name; if (n && !n.value && window.matchMedia('(min-width: 720px)').matches) n.focus(); }, 60);
}

function onPay(ev) {
  ev.preventDefault();
  if (state !== 'form') { log('checkout.duplicate_click_blocked', { state }); return; }
  if (!validateForm(form)) return;
  const raw = formData(form);
  const product = selectedProduct();
  const customer = { name: raw.name, email: raw.email.toLowerCase(), phone: '+' + normalizePhone(raw.phone), nameRaw: raw.name, emailRaw: raw.email, phoneRaw: raw.phone };
  current = getAttempt(product.key, customer);
  current.productKey = product.key;
  saveAttempt(current);
  setState('starting');

  // Safety: never take a LIVE payment if the server that verifies it and delivers the eBook isn't connected.
  if (!backendReady()) return fail('error', 'Online payment is being set up. Please message us on WhatsApp to buy — we’ll help you right away.');

  const src = getLeadSource();
  // (a) Lead → Google Sheet immediately. Independent of payment. Never awaited by checkout.
  sendReliable('lead.save', {
    requestId: current.checkoutId, type: 'ebook_checkout', hp: raw.ss_extra || '',
    data: { name: customer.name, email: customer.email, phone: customer.phone, productKey: product.key, productName: product.name, amount: product.price },
    source: describeSource(src), utm: src, page: location.pathname,
  }, `lead_${current.checkoutId}`);

  // (b) Order + script in parallel, then open Razorpay right away (no fixed wait).
  loadRazorpay();
  orderPromise = createOrder(current, product, customer, src);
  const btn = form.querySelector('.ck-pay');
  btn.disabled = true;
  btn.querySelector('.btn-label').innerHTML = '<span class="spinner" aria-hidden="true"></span> Opening…';
  form.querySelector('.form-status').hidden = true;
  openRazorpay();
}

function resetPayButton() {
  if (!form) return;
  const btn = form.querySelector('.ck-pay');
  btn.disabled = false;
  updatePayLabel();
}

let warmed = false;
function warmServer() {
  if (warmed || !backendReady()) return;
  warmed = true;
  call('health', {}, { retries: 0, timeoutMs: 15000 }).catch(() => {});
}

function createOrder(att, product, customer, src) {
  if (att.orderId && att.amount) return Promise.resolve({ orderId: att.orderId, amount: att.amount, keyId: att.keyId });
  return call('order.create', {
    checkoutId: att.checkoutId, productKey: product.key,
    customer: { name: customer.name, email: customer.email, phone: customer.phone },
    fbp: getCookie('_fbp'), fbc: getCookie('_fbc'), source: describeSource(src), pageUrl: location.href, userAgent: navigator.userAgent,
  }, { timeoutMs: 12000, retries: 1 }).then((r) => {
    if (!r.orderId || !r.amount) throw new Error('Bad order response');
    if (r.amount !== product.price * 100) warn('price.mismatch', { website: product.price, server: r.amount / 100, product: product.key });
    att.orderId = r.orderId; att.amount = r.amount; att.keyId = r.keyId; saveAttempt(att);
    log('checkout.order_created', { orderId: r.orderId, amount: r.amount });
    return r;
  }).catch((err) => {
    warn('checkout.order_failed', { kind: err.kind, msg: err.message });
    // Server answered "keys not configured" → don't take a payment we can't verify.
    if (err.detail && err.detail.code === 'NOT_CONFIGURED') return { notConfigured: true };
    return null;
  });
}

async function openRazorpay() {
  if (!['starting', 'cancelled', 'failed', 'error'].includes(state)) return;
  setState('opening');
  const product = PRODUCT_CONFIG[current.productKey];
  if (!backendReady()) return fail('error', 'Online payment is being set up. Please message us on WhatsApp to buy — we’ll help you right away.');

  // Loading indicator ONLY if opening takes noticeable time (never a fixed wait).
  const t0 = Date.now();
  const elapsedEl = dlg.querySelector('.ck-elapsed');
  let ticker = null;
  const showLoader = setTimeout(() => {
    showPanel('opening');
    const paint = () => { elapsedEl.textContent = `${Math.max(1, Math.round((Date.now() - t0) / 1000))}s`; };
    paint(); ticker = setInterval(paint, 500);
  }, 400);
  const stopLoader = () => { clearTimeout(showLoader); clearInterval(ticker); elapsedEl.textContent = ''; };

  const [scriptOk, rawOrder] = await Promise.all([
    loadRazorpay(10000),
    Promise.race([orderPromise || Promise.resolve(null), sleep(PAYMENT_CONFIG.ORDER_GRACE_MS).then(() => null)]),
  ]);
  stopLoader();
  log('checkout.ready', { ms: Date.now() - t0, order: !!(rawOrder && rawOrder.orderId) });
  if (!scriptOk) return fail('error', 'Razorpay could not load. Please check your internet connection and try again.');
  if (rawOrder && rawOrder.notConfigured) return fail('error', 'Online payment is being set up. Please message us on WhatsApp to buy — we’ll help you right away.');
  const order = rawOrder && rawOrder.orderId ? rawOrder : null;

  const keyId = (order && order.keyId) || PAYMENT_CONFIG.RAZORPAY_KEY_ID;
  if (isPlaceholder(keyId)) return fail('error', 'Payments are not switched on yet. Please message us on WhatsApp to buy.');
  if (!order && !PAYMENT_CONFIG.ALLOW_ORDERLESS_FALLBACK) return fail('error', 'Our payment server is not responding. Please try again in a minute.');
  if (!order) warn('checkout.orderless_fallback', { checkoutId: current.checkoutId });

  const opts = {
    key: keyId,
    amount: order ? order.amount : product.price * 100,
    currency: PAYMENT_CONFIG.CURRENCY,
    name: PAYMENT_CONFIG.CHECKOUT_TITLE,
    description: product.name,
    image: `${location.origin}/assets/img/brand/favicon-light-192.png`,
    prefill: { name: current.name, email: current.email, contact: current.phone },
    notes: { site: 'sangeetseekho', checkout_id: current.checkoutId, product_key: product.key, product_id: product.id, customer_name: current.name.slice(0, 60) },
    theme: { color: PAYMENT_CONFIG.THEME_COLOR },
    retry: { enabled: true, max_count: 4 },
    timeout: 900,
    remember_customer: false,
    modal: {
      confirm_close: true,
      escape: false,
      ondismiss: () => {
        if (state !== 'in_razorpay') return;
        const failed = !!lastFailure;
        ping('payment.event', { checkoutId: current.checkoutId, orderId: current.orderId, event: failed ? 'failed' : 'dismissed', error: lastFailure });
        log(failed ? 'checkout.failed_closed' : 'checkout.dismissed');
        setState(failed ? 'failed' : 'cancelled');
        if (failed) dlg.querySelector('.ck-reason').textContent = friendlyReason(lastFailure);
        if (failed) dlg.querySelector('[data-wa-fail]').href = waLink(paymentProblemMessage(`Product: ${PRODUCT_CONFIG[current.productKey].name}${lastFailure && lastFailure.paymentId ? `\nPayment ID: ${lastFailure.paymentId}` : ''}`));
        showPanel(failed ? 'failed' : 'cancelled');
        openDialog(dlg);
      },
    },
    handler: (resp) => onPaid(resp),
  };
  if (order) opts.order_id = order.orderId;

  try {
    lastFailure = null;
    rzp = new window.Razorpay(opts);
    rzp.on('payment.failed', (r) => {
      const er = r && r.error ? r.error : {};
      lastFailure = { code: er.code, description: er.description, reason: er.reason, source: er.source, step: er.step, paymentId: er.metadata && er.metadata.payment_id };
      warn('checkout.payment_failed', lastFailure);
      ping('payment.event', { checkoutId: current.checkoutId, orderId: current.orderId, event: 'failed', error: lastFailure });
    });
    closeDialog(dlg);           // Razorpay must sit on top; our dialog lives in the top layer
    setState('in_razorpay');
    rzp.open();
    // Meta InitiateCheckout — only when the payment window really opened, once per checkout ID
    track('InitiateCheckout', { ...productParams(product), num_items: 1 }, `ic_${current.checkoutId}`);
    log('checkout.razorpay_opened', { orderId: opts.order_id || null, amount: opts.amount });
  } catch (err) {
    error('checkout.razorpay_open_error', { msg: err.message });
    fail('error', 'The payment window could not open. Please try again.');
  }
}

function friendlyReason(f) {
  if (!f) return '';
  const d = f.description || '';
  if (/cancel/i.test(d)) return 'The payment was cancelled.';
  if (/insufficient/i.test(d)) return 'Your bank reported insufficient balance.';
  return d ? `Reason from your bank/Razorpay: ${d}` : 'The bank did not approve this payment.';
}

function fail(panel, msg) {
  setState(panel);
  if (panel === 'error') {
    dlg.querySelector('.ck-error').textContent = msg;
    dlg.querySelector('[data-wa-help]').href = waLink(`Hi, I'm trying to buy the ${PRODUCT_CONFIG[current.productKey].name} but the payment window won't open.`);
  }
  showPanel(panel);
  openDialog(dlg);
}

function retry() {
  if (!['cancelled', 'failed', 'error'].includes(state)) return;
  log('checkout.retry', { checkoutId: current.checkoutId });
  if (!current.orderId) orderPromise = createOrder(current, PRODUCT_CONFIG[current.productKey], current, getLeadSource());
  else orderPromise = Promise.resolve({ orderId: current.orderId, amount: current.amount, keyId: current.keyId });
  openRazorpay();
}

async function onPaid(resp) {
  if (state === 'verifying') return;            // Razorpay can call handler only once, but be safe
  setState('verifying');
  dlg.dataset.locked = 'true';
  showPanel('verifying');
  openDialog(dlg);
  const paymentId = resp.razorpay_payment_id;
  current.paid = true; current.paymentId = paymentId; saveAttempt(current);
  rememberPurchase({ paymentId, productKey: current.productKey, checkoutId: current.checkoutId, ts: Date.now() });
  log('checkout.razorpay_success', { paymentId, orderId: resp.razorpay_order_id });

  let result = null;
  try {
    result = await call('payment.verify', {
      checkoutId: current.checkoutId, paymentId,
      orderId: resp.razorpay_order_id || current.orderId || '', signature: resp.razorpay_signature || '',
    }, { timeoutMs: 25000, retries: 2 });
  } catch (err) {
    warn('checkout.verify_unreachable', { kind: err.kind });  // thank-you page keeps checking
  }
  if (result) session.set(`ss_verify_${paymentId}`, result);
  const q = new URLSearchParams({ payment_id: paymentId, ck: current.checkoutId });
  window.location.assign(`/thank-you/?${q.toString()}`);
}

/** Wire every [data-buy="productKey"] button on the page. */
export function initBuyButtons(root = document) {
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-buy]');
    if (!b) return;
    ev.preventDefault();
    openCheckout(b.dataset.buy);
  });
  // Warm up the Razorpay script once the page is idle (does not block anything)
  const warm = () => loadRazorpay();
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);
}

