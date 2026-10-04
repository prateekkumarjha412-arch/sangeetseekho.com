import { boot } from '../main.js';
import { initContactForm } from '../features/lead-forms.js';
import { renderFAQ } from '../components/sections.js';

boot();
initContactForm(document.querySelector('#contact-form'));
renderFAQ(document.querySelector('[data-faq]'));
