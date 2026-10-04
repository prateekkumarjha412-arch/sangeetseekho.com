/* Online 1-on-1 Classes page (homepage). No prices anywhere on this page. */
import { boot } from '../main.js';
import { renderCurriculum, renderFAQ, renderFounder, renderTeachers, renderReviews } from '../components/sections.js';
import { initVideos, videoMarkup } from '../components/video.js';
import { LIVE_CLASS_VIDEOS, TEACHER_VIDEO } from '../content/testimonials.js';
import { initEnrollForm } from '../features/lead-forms.js';
import { track } from '../analytics/pixel.js';
import { ASSET_CONFIG } from '../config.js';
import { waLink } from '../features/whatsapp.js';
import { escapeHtml as e, uid } from '../core/utils.js';

boot();

const live = document.querySelector('[data-live-videos]');
if (live) {
  live.innerHTML = LIVE_CLASS_VIDEOS.map((v) => `
    <figure class="rail-item">${videoMarkup(v, { title: `Live class with ${v.name} from ${v.place}` })}
      <figcaption><b>${e(v.name)}</b> · ${e(v.place)}<small>${e(v.caption)}</small></figcaption></figure>`).join('');
}
const tv = document.querySelector('[data-teacher-video]');
if (tv) tv.innerHTML = videoMarkup(TEACHER_VIDEO, { title: TEACHER_VIDEO.caption });

renderFounder(document.querySelector('[data-founder]'));
renderTeachers(document.querySelector('[data-teachers]'));
renderCurriculum(document.querySelector('[data-curriculum]'));
renderFAQ(document.querySelector('[data-faq]'));
renderReviews(document.querySelector('[data-reviews]'));
initVideos();
initEnrollForm(document.querySelector('#enroll-form'));

// Curriculum PDF: use the file if configured, otherwise offer it on WhatsApp.
document.querySelectorAll('[data-curriculum-pdf]').forEach((a) => {
  if (ASSET_CONFIG.CURRICULUM_PDF) {
    a.href = ASSET_CONFIG.CURRICULUM_PDF;
    a.setAttribute('download', '');
  } else {
    a.href = waLink('Hi, please send me the full curriculum PDF for the Online 1-on-1 Guitar Classes.');
    a.target = '_blank'; a.rel = 'noopener';
    a.querySelector('.btn-label').textContent = 'Get full curriculum on WhatsApp';
  }
});

track('ViewContent', { content_name: 'Online 1-on-1 Guitar Classes', content_category: 'online_class', content_type: 'product', content_ids: ['SS-ONLINE-CLASS'] }, uid('vc'));
