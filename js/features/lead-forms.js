/* Online-class enrollment form + Contact form.

   Order of events on the final Submit (both forms):
   1. Validate. Nothing is sent if anything is wrong.
   2. Lock the form (state machine — not just a disabled button).
   3. Save the lead IMMEDIATELY (outbox → Google Sheet). We do NOT wait for WhatsApp/email.
   4. Track Meta "Lead" once, with eventID lead_<id>.
   5. 7-second countdown on the button (the save runs during these seconds).
   6. Open WhatsApp / email with the details pre-filled.
   Double-click / double-submit: the same form content always gets the same lead ID
   (stored per tab), and the server ignores an ID it has already saved. */
import { attachLiveValidation, validateForm, formData, normalizePhone } from '../core/validate.js';
import { sendReliable } from '../core/api.js';
import { uid, hash, getLeadSource, describeSource, sleep } from '../core/utils.js';
import { session } from '../core/storage.js';
import { log } from '../core/logger.js';
import { track } from '../analytics/pixel.js';
import { runFinalCountdown } from '../components/cta-countdown.js';
import { enrollmentMessage, contactMessage, waLink, goToWhatsApp } from './whatsapp.js';
import { CONTACT_CONFIG } from '../config.js';

function stableLeadId(prefix, data) {
  const key = `ss_leadid_${prefix}_${hash(JSON.stringify(data))}`;
  let id = session.get(key);
  if (!id) { id = uid(prefix); session.set(key, id); }
  return id;
}

function setStatus(el, kind, html) {
  if (!el) return;
  el.className = `form-status form-status--${kind}`;
  el.innerHTML = html;
  el.hidden = false;
}

/* ---------------- Online class enrollment ---------------- */
export function initEnrollForm(form) {
  if (!form) return;
  attachLiveValidation(form);
  const btn = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const same = form.querySelector('#enr-same');
  const wa = form.querySelector('#enr-whatsapp');
  const waField = wa && wa.closest('.field');
  const syncWa = () => { if (!same || !waField) return; waField.hidden = same.checked; wa.dataset.validate = same.checked ? '' : 'phone'; };
  same && same.addEventListener('change', syncWa); syncWa();

  let state = 'idle';
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (state !== 'idle') { log('form.duplicate_submit_blocked', { form: 'enroll' }); return; }
    if (!validateForm(form)) { log('form.invalid', { form: 'enroll' }); return; }
    state = 'counting';

    const raw = formData(form);
    const d = {
      name: raw.name, phone: '+' + normalizePhone(raw.phone),
      whatsapp: '+' + normalizePhone(same && same.checked ? raw.phone : raw.whatsapp),
      email: raw.email || '', age: raw.age, level: raw.level, goal: raw.goal,
      timing: raw.timing, teacher: raw.teacher || 'No preference', message: raw.message || '',
    };
    const id = stableLeadId('cls', d);
    const src = getLeadSource();
    const payload = { requestId: id, type: 'online_class', hp: raw.ss_extra || '', data: d, source: describeSource(src), utm: src, page: location.pathname };

    setStatus(status, 'info', '<span class="spinner" aria-hidden="true"></span> Saving your details…');
    const saving = sendReliable('lead.save', payload, id).then((r) => {
      if (r.saved) setStatus(status, 'success', '✓ Saved. Abhishek will reply on WhatsApp.');
      else setStatus(status, 'warn', 'Saved on this device — we’ll keep trying to send it. You can continue on WhatsApp.');
      return r;
    });
    track('Lead', { content_name: 'Online 1-on-1 Guitar Classes', content_category: 'online_class', currency: 'INR', value: 0 }, `lead_${id}`, { persist: true });

    const message = enrollmentMessage({ ...d, ref: id.slice(-6).toUpperCase() });
    runFinalCountdown(btn, {
      text: (n) => `Opening WhatsApp in ${n}s`,
      onCancel: () => { state = 'idle'; },
      onDone: async () => {
        state = 'redirecting';
        await Promise.race([saving, sleep(2500)]);   // brief grace for the save; never blocks longer
        showEnrollDone(form, message);
        log('enroll.redirect_whatsapp', { id });
        goToWhatsApp(message);
      },
    });
  });
}

function showEnrollDone(form, message) {
  const panel = form.parentElement.querySelector('.form-done');
  if (!panel) return;
  panel.querySelector('[data-wa-fallback]').href = waLink(message);
  panel.hidden = false;
  form.hidden = true;
  panel.setAttribute('tabindex', '-1');
  panel.focus();
}

/* ---------------- Contact ---------------- */
export function initContactForm(form) {
  if (!form) return;
  attachLiveValidation(form);
  const btn = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const emailInput = form.querySelector('#ct-email');
  const updateEmailRule = () => {
    const m = form.querySelector('input[name="method"]:checked');
    emailInput.dataset.validate = m && m.value === 'email' ? 'email' : 'emailOptional';
    btn.querySelector('.btn-label').textContent = m && m.value === 'email' ? 'Send message by Email' : 'Send message on WhatsApp';
  };
  form.addEventListener('change', (e) => { if (e.target.name === 'method') updateEmailRule(); });
  updateEmailRule();

  let state = 'idle';
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (state !== 'idle') { log('form.duplicate_submit_blocked', { form: 'contact' }); return; }
    if (!validateForm(form)) return;
    state = 'counting';
    const raw = formData(form);
    const d = { name: raw.name, phone: '+' + normalizePhone(raw.phone), email: raw.email || '', message: raw.message, method: raw.method };
    const id = stableLeadId('ct', d);
    const src = getLeadSource();
    const payload = { requestId: id, type: 'contact', hp: raw.ss_extra || '', data: d, source: describeSource(src), utm: src, page: location.pathname };

    setStatus(status, 'info', '<span class="spinner" aria-hidden="true"></span> Saving your message…');
    const saving = sendReliable('lead.save', payload, id).then((r) => {
      setStatus(status, r.saved ? 'success' : 'warn', r.saved ? '✓ Message saved. We’ll get back to you.' : 'Saved on this device — we’ll keep trying to send it.');
      return r;
    });
    track('Lead', { content_name: 'Contact request', content_category: 'contact', currency: 'INR', value: 0 }, `lead_${id}`, { persist: true });

    const ref = id.slice(-6).toUpperCase();
    const text = contactMessage({ ...d, ref });
    const mailto = `mailto:${CONTACT_CONFIG.EMAIL}?subject=${encodeURIComponent(`Website enquiry from ${d.name} (Ref ${ref})`)}&body=${encodeURIComponent(text)}`;
    const wa = waLink(text);

    // Show the "saved" panel with a manual fallback link…
    const done = form.parentElement.querySelector('.form-done');
    if (done) {
      const fb = done.querySelector('[data-fallback]');
      fb.href = d.method === 'email' ? mailto : wa;
      if (d.method !== 'email') { fb.target = '_blank'; fb.rel = 'noopener'; }
      fb.textContent = d.method === 'email' ? 'Email didn’t open? Tap here' : 'WhatsApp didn’t open? Tap here';
      done.querySelector('[data-name]').textContent = d.name.split(' ')[0];
      done.hidden = false; form.hidden = true;
    }
    state = 'done';
    log('contact.open', { method: d.method, id });
    // …and open WhatsApp / email IMMEDIATELY (no timer). This page stays open, so the
    // save to Google Sheets finishes in the background (outbox + retry still protect it).
    if (d.method === 'email') {
      window.location.href = mailto;
    } else {
      const w = window.open(wa, '_blank');
      if (w) { try { w.opener = null; } catch (_) {} } else { goToWhatsApp(text); } // popup blocked → same tab
    }
  });
}
