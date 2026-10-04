/* 7-SECOND FINAL-CTA COUNTDOWN (used only on final conversion buttons).
   Not to be confused with the 1-hour offer timer (offer-timer.js).

   UX: the user clicks the final button → the form is validated → the button
   turns into a progress bar "Opening … in 7, 6, 5 …" while we already save the
   lead and prepare the payment in the background (so the 7 seconds are not
   wasted). At 0 the final action runs. A "Cancel" link is always available. */
import { TIMER_CONFIG } from '../config.js';

export function runFinalCountdown(button, { seconds = TIMER_CONFIG.FINAL_CTA_SECONDS, text = (n) => `Continuing in ${n}s`, onDone, onCancel, statusEl } = {}) {
  const original = button.innerHTML;
  let remaining = seconds;
  let cancelled = false;
  let timer = null;

  button.classList.add('is-counting');
  button.setAttribute('aria-disabled', 'true');
  button.disabled = true;
  button.style.setProperty('--cd-duration', `${seconds}s`);

  const live = statusEl || button.parentElement.querySelector('.cta-live') || (() => {
    const p = document.createElement('p'); p.className = 'cta-live visually-hidden'; p.setAttribute('aria-live', 'polite');
    button.after(p); return p;
  })();

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cta-cancel';
  cancelBtn.textContent = 'Cancel';
  button.after(cancelBtn);

  const paint = () => {
    button.innerHTML = `<span class="cd-bar" aria-hidden="true"></span><span class="cd-text">${text(remaining)}</span><span class="cd-num" aria-hidden="true">${remaining}</span>`;
    if (remaining === seconds || remaining <= 3) live.textContent = text(remaining);
  };

  function restore() {
    clearInterval(timer);
    button.innerHTML = original;
    button.classList.remove('is-counting');
    button.removeAttribute('aria-disabled');
    button.disabled = false;
    cancelBtn.remove();
  }

  cancelBtn.addEventListener('click', () => {
    if (cancelled) return;
    cancelled = true;
    restore();
    live.textContent = 'Cancelled.';
    onCancel && onCancel();
  });

  paint();
  // Restart CSS animation for the progress bar
  requestAnimationFrame(() => button.classList.add('cd-run'));
  timer = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) { paint(); return; }
    clearInterval(timer);
    cancelBtn.remove();
    button.classList.remove('cd-run');
    if (!cancelled) onDone && onDone();
  }, 1000);

  return { cancel: () => cancelBtn.click(), restore, get cancelled() { return cancelled; } };
}
