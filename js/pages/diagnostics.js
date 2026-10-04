/* /diagnostics/ — a plain-language setup checklist for the owner. */
import { boot } from '../main.js';
import { BACKEND_CONFIG, PAYMENT_CONFIG, TRACKING_CONFIG, CONTACT_CONFIG, PRODUCT_CONFIG, ASSET_CONFIG } from '../config.js';
import { call, backendReady } from '../core/api.js';
import { loadRazorpay } from '../features/checkout.js';
import { pixelEnabled } from '../analytics/pixel.js';
import { isPlaceholder, uid, escapeHtml as e } from '../core/utils.js';

boot();
const host = document.querySelector('[data-diag]');
const rows = [];
const row = (ok, title, detail) => { rows.push({ ok, title, detail }); paint(); };
function paint() {
  host.innerHTML = rows.map((r) => `<div class="diag-row"><span class="${r.ok === true ? 'diag-ok' : r.ok === 'warn' ? 'diag-warn' : 'diag-bad'}">${r.ok === true ? '✓' : r.ok === 'warn' ? '!' : '✗'}</span><div><b>${e(r.title)}</b><br>${e(r.detail)}</div></div>`).join('');
}

(async () => {
  row(backendReady(), 'Google Apps Script URL (config.js)', backendReady() ? BACKEND_CONFIG.GOOGLE_SCRIPT_URL : 'Not set. Paste your Web App URL into GOOGLE_SCRIPT_URL.');
  row(!isPlaceholder(PAYMENT_CONFIG.RAZORPAY_KEY_ID) ? true : 'warn', 'Razorpay Key ID (config.js)', isPlaceholder(PAYMENT_CONFIG.RAZORPAY_KEY_ID) ? 'Not set here (OK if the server has it — see below).' : `${PAYMENT_CONFIG.RAZORPAY_KEY_ID.startsWith('rzp_live_') ? 'LIVE' : 'TEST'} key: ${PAYMENT_CONFIG.RAZORPAY_KEY_ID}`);
  row(pixelEnabled ? true : 'warn', 'Meta Pixel ID (config.js)', pixelEnabled ? TRACKING_CONFIG.META_PIXEL_ID : 'Not set — tracking is OFF.');
  row(!isPlaceholder(CONTACT_CONFIG.UPI_ID) ? true : 'warn', 'UPI ID (payment help panel)', isPlaceholder(CONTACT_CONFIG.UPI_ID) ? 'Not set yet.' : CONTACT_CONFIG.UPI_ID);
  row(!CONTACT_CONFIG.UPI_QR_IMAGE.includes('placeholder') ? true : 'warn', 'UPI QR image', CONTACT_CONFIG.UPI_QR_IMAGE.includes('placeholder') ? 'Still the placeholder image.' : CONTACT_CONFIG.UPI_QR_IMAGE);
  row(ASSET_CONFIG.CURRICULUM_PDF ? true : 'warn', 'Curriculum PDF', ASSET_CONFIG.CURRICULUM_PDF || 'Not set — the button offers the curriculum on WhatsApp instead.');

  const rzp = await loadRazorpay(8000);
  row(rzp, 'Razorpay checkout script loads', rzp ? 'OK' : 'Could not load checkout.razorpay.com (internet or blocker).');

  if (!backendReady()) return;
  try {
    const h = await call('health', {}, { timeoutMs: 20000, retries: 1 });
    row(true, 'Server reachable', `Version ${h.version}. Sheet: ${h.sheetName || 'OK'}`);
    const c = h.configured || {};
    row(c.razorpayKeyId && c.razorpaySecret, 'Razorpay keys on the server (Script Properties)', c.razorpayKeyId && c.razorpaySecret ? `${h.mode === 'live' ? 'LIVE' : 'TEST'} mode, key ${h.keyId}` : 'RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET missing in Script Properties.');
    if (c.razorpayKeyId && !isPlaceholder(PAYMENT_CONFIG.RAZORPAY_KEY_ID) && h.keyId !== PAYMENT_CONFIG.RAZORPAY_KEY_ID) row(false, 'Razorpay key mismatch', `Website has ${PAYMENT_CONFIG.RAZORPAY_KEY_ID} but server has ${h.keyId}. Make them the same.`);
    row(c.capiToken ? true : 'warn', 'Meta Conversions API token (server)', c.capiToken ? 'Set — server-side Purchase tracking ON.' : 'Not set — only browser Pixel tracking.');
    row(c.reconcileTrigger ? true : 'warn', 'Automatic payment checker (every 10 min)', c.reconcileTrigger ? 'Installed.' : 'Not installed — run setup() once in Apps Script.');
    for (const [k, p] of Object.entries(PRODUCT_CONFIG)) {
      const s = h.products && h.products[k];
      const ok = s && s.price === p.price;
      row(!!ok, `Price check: ${p.name}`, ok ? `${p.price} on both website and server` : `Website ₹${p.price} vs server ₹${s ? s.price : '—'}. Customers are charged the SERVER price — update one of them.`);
    }
  } catch (err) {
    row(false, 'Server reachable', `Failed (${err.kind}): ${err.message}. Check the URL and that the deployment is "Anyone" access.`);
  }
})();

document.querySelector('[data-test-lead]').addEventListener('click', async (ev) => {
  const st = document.querySelector('[data-test-status]');
  ev.target.disabled = true; st.hidden = false; st.className = 'form-status form-status--info'; st.textContent = 'Sending…';
  try {
    const id = uid('test');
    const r = await call('lead.save', { requestId: id, type: 'test', data: { name: 'TEST — Diagnostics', phone: '+910000000000', email: 'test@example.com', message: 'Diagnostics test row' }, source: 'diagnostics', page: '/diagnostics/' });
    st.className = 'form-status form-status--success'; st.textContent = `✓ Saved. Look for ID ${id} in the "All Leads" tab. (${r.duplicate ? 'duplicate ignored' : 'new row'})`;
  } catch (err) {
    st.className = 'form-status form-status--error'; st.textContent = `✗ Failed: ${err.message}`;
  } finally { ev.target.disabled = false; }
});
