/* Form validation. Rules are attached in HTML with data-validate="name|email|phone|required|age|text".
   Messages are written for normal people, shown under the field, and announced to screen readers. */

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'\-]{1,59}$/u;
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
const DANGEROUS_RE = /[<>]|javascript:|=\s*(?:IMPORT|HYPERLINK)/i;

/** Normalise a phone to digits with country code. 10-digit Indian numbers get 91 added. */
export function normalizePhone(raw) {
  let s = String(raw || '').trim();
  const plus = s.startsWith('+');
  let d = s.replace(/\D/g, '');
  if (!plus && d.length === 11 && d.startsWith('0')) d = d.slice(1);      // 09754751793
  if (!plus && d.length === 10) d = '91' + d;                              // 9754751793
  if (plus || d.length > 10) return d;
  return d;
}

export const rules = {
  required: (v) => (String(v).trim() ? '' : 'This field is required.'),
  name: (v) => {
    v = String(v).trim();
    if (!v) return 'Please enter your name.';
    if (v.length < 2) return 'Name looks too short.';
    if (!NAME_RE.test(v)) return 'Please use letters only (no numbers or symbols).';
    return '';
  },
  email: (v) => {
    v = String(v).trim();
    if (!v) return 'Please enter your email address.';
    if (!EMAIL_RE.test(v) || v.length > 100) return 'This email doesn’t look right. Example: name@gmail.com';
    if (/@(gmial|gmal|gamil|gnail)\.com$/i.test(v)) return 'Did you mean @gmail.com?';
    return '';
  },
  emailOptional: (v) => (String(v).trim() ? rules.email(v) : ''),
  phone: (v) => {
    if (!String(v).trim()) return 'Please enter your phone number.';
    const d = normalizePhone(v);
    if (d.length < 11 || d.length > 15) return 'Enter a valid number, e.g. 98765 43210 (add +country code if outside India).';
    if (d.startsWith('91') && d.length === 12 && !/^[6-9]/.test(d.slice(2))) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
    return '';
  },
  phoneOptional: (v) => (String(v).trim() ? rules.phone(v) : ''),
  age: (v) => {
    if (!String(v).trim()) return 'Please enter age.';
    const n = Number(v);
    if (!Number.isInteger(n) || n < 5 || n > 90) return 'Please enter an age between 5 and 90.';
    return '';
  },
  text: (v) => (DANGEROUS_RE.test(String(v)) ? 'Please remove < > symbols from this text.' : ''),
  choice: (v) => (String(v).trim() ? '' : 'Please choose one option.'),
};

function fieldError(field, msg) {
  const wrap = field.closest('.field') || field.parentElement;
  let el = wrap.querySelector('.field-error');
  if (!el) {
    el = document.createElement('p');
    el.className = 'field-error';
    el.id = (field.id || field.name) + '-error';
    el.setAttribute('aria-live', 'polite');
    wrap.appendChild(el);
  }
  el.textContent = msg;
  wrap.classList.toggle('has-error', !!msg);
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (msg) field.setAttribute('aria-describedby', el.id); else field.removeAttribute('aria-describedby');
}

function valueOf(form, field) {
  if (field.type === 'radio') { const c = form.querySelector(`input[name="${field.name}"]:checked`); return c ? c.value : ''; }
  return field.value;
}

export function validateField(form, field) {
  const names = (field.dataset.validate || '').split(/\s+/).filter(Boolean);
  const v = valueOf(form, field);
  let msg = '';
  for (const n of names) { msg = rules[n] ? rules[n](v) : ''; if (msg) break; }
  if (!msg && v && field.type !== 'radio' && !names.includes('text') && field.tagName === 'TEXTAREA') msg = rules.text(v);
  fieldError(field.type === 'radio' ? form.querySelector(`input[name="${field.name}"]`) : field, msg);
  return !msg;
}

/** Validates all [data-validate] fields; focuses the first wrong one. Returns true if OK. */
export function validateForm(form) {
  let firstBad = null;
  const seenRadio = new Set();
  for (const f of form.querySelectorAll('[data-validate]')) {
    if (f.type === 'radio') { if (seenRadio.has(f.name)) continue; seenRadio.add(f.name); }
    if (!validateField(form, f) && !firstBad) firstBad = f;
  }
  if (firstBad) { firstBad.focus({ preventScroll: false }); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  return !firstBad;
}

/** Live validation: show errors when leaving a field, clear them while typing.
    Important: when the user presses the submit button, we skip the "leaving the field"
    check — otherwise an error appearing/disappearing would move the button under the
    finger and the tap would miss it. The submit handler validates everything anyway. */
export function attachLiveValidation(form) {
  form.setAttribute('novalidate', '');
  let pressingSubmit = false;
  form.addEventListener('pointerdown', (e) => { if (e.target.closest('[type="submit"]')) pressingSubmit = true; }, true);
  const release = () => setTimeout(() => { pressingSubmit = false; }, 0);
  form.addEventListener('pointerup', release, true);
  form.addEventListener('pointercancel', release, true);
  form.addEventListener('focusout', (e) => {
    const f = e.target;
    if (pressingSubmit || !f.dataset || !f.dataset.validate || !f.value) return;
    f.dataset.touched = '1';
    validateField(form, f);
  });
  form.addEventListener('input', (e) => {
    const f = e.target;
    if (!f.dataset || !f.dataset.validate) return;
    const wrap = f.closest('.field');
    if (f.dataset.touched || (wrap && wrap.classList.contains('has-error'))) validateField(form, f);
  });
  form.addEventListener('change', (e) => { const f = e.target; if ((f.type === 'radio' || f.tagName === 'SELECT') && f.dataset.validate) validateField(form, f); });
}

export function formData(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
  return out;
}
