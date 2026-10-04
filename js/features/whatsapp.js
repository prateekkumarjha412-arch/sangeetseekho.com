/* All WhatsApp links + pre-filled messages live here, so the wording is easy to edit. */
import { CONTACT_CONFIG } from '../config.js';

export function waLink(message, number = CONTACT_CONFIG.WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Default message for the floating WhatsApp button, based on the current page. */
export function pageMessage(path = location.pathname) {
  if (path.startsWith('/fingerstyle-guitar-ebook')) return 'Hi Sangeet Seekho, I have a question about the Fingerstyle Guitar eBook.';
  if (path.startsWith('/chord-modulation-theory')) return 'Hi Sangeet Seekho, I have a question about the Chord Modulation Theory eBook.';
  if (path.startsWith('/thank-you')) return 'Hi Sangeet Seekho, I just bought an eBook and need help with access.';
  if (path.startsWith('/contact')) return 'Hi Sangeet Seekho, I have a question.';
  return 'Hi Sangeet Seekho, I want to know more about the Online 1-on-1 Guitar Classes.';
}

export function enrollmentMessage(d) {
  return [
    'Hi Sangeet Seekho, I want to enquire about the Online 1-on-1 Guitar Classes.',
    '',
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    d.whatsapp && d.whatsapp !== d.phone ? `WhatsApp: ${d.whatsapp}` : null,
    d.email ? `Email: ${d.email}` : null,
    `Age: ${d.age}`,
    `Level: ${d.level}`,
    `Goal: ${d.goal}`,
    `Preferred Timing: ${d.timing}`,
    d.message ? `Message: ${d.message}` : null,
    '',
    `(Ref: ${d.ref})`,
  ].filter((x) => x !== null).join('\n');
}

export function contactMessage(d) {
  return [
    'Hi Sangeet Seekho,',
    '',
    d.message,
    '',
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    d.email ? `Email: ${d.email}` : null,
    `(Ref: ${d.ref})`,
  ].filter((x) => x !== null).join('\n');
}

export function paymentProblemMessage(extra = '') {
  return `Hi, I made a payment but my order/access has not been completed. I am attaching my payment screenshot.${extra ? '\n\n' + extra : ''}`;
}

export function accessHelpMessage({ product, paymentId, email } = {}) {
  return [
    'Hi, I didn’t receive my eBook.',
    product ? `Product: ${product}` : null,
    paymentId ? `Payment ID: ${paymentId}` : null,
    email ? `Email used: ${email}` : null,
  ].filter(Boolean).join('\n');
}

/** Navigate to WhatsApp in the same tab (works after a timer; window.open would be popup-blocked). */
export function goToWhatsApp(message) {
  window.location.href = waLink(message);
}
