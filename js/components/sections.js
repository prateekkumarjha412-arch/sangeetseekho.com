/* Renders the editable content files (curriculum, FAQ, teachers, reviews) into the page. */
import { CURRICULUM } from '../content/curriculum.js';
import { FAQS } from '../content/faqs.js';
import { FOUNDER, TEACHERS } from '../content/teachers.js';
import { TEXT_REVIEWS, IMAGE_REVIEWS, VIDEO_REVIEWS } from '../content/testimonials.js';
import { escapeHtml as e, picture } from '../core/utils.js';
import { icons } from './ui.js';
import { videoMarkup, initVideos } from './video.js';

const stars = (n = 5) => `<span class="stars" aria-label="${n} out of 5 stars">${icons.star.repeat(n)}</span>`;

export function renderCurriculum(el) {
  if (!el) return;
  el.innerHTML = CURRICULUM.map((lvl, i) => `
    <details class="curr-level" ${i === 0 ? 'open' : ''}>
      <summary>
        <span class="curr-badge">${e(lvl.level)}</span>
        <span class="curr-title"><strong>${e(lvl.title)}</strong><small>${e(lvl.duration)}</small></span>
        <span class="curr-chevron" aria-hidden="true"></span>
      </summary>
      <div class="curr-body">
        <p class="curr-outcome"><b>You’ll be able to:</b> ${e(lvl.outcome)}</p>
        <div class="curr-modules">
          ${lvl.modules.map((m) => `<div class="curr-module"><h4>${e(m.title)}</h4><ul>${m.topics.map((t) => `<li>${e(t)}</li>`).join('')}</ul></div>`).join('')}
        </div>
      </div>
    </details>`).join('');
}

export function renderFAQ(el) {
  if (!el) return;
  const groups = (el.dataset.faq || '').split(',').map((s) => s.trim()).filter(Boolean);
  const titles = { classes: 'Online classes', fingerstyle: 'Fingerstyle eBook', chord: 'Chord Modulation Theory', payments: 'Payments', access: 'Access & delivery', refunds: 'Refunds', support: 'Support' };
  const items = [];
  el.innerHTML = groups.map((g) => {
    const list = FAQS[g] || [];
    items.push(...list);
    return `<div class="faq-group"><h3 class="faq-group-title">${e(titles[g] || g)}</h3>${list.map((f) => `
      <details class="faq-item"><summary>${e(f.q)}<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-a"><p>${e(f.a)}</p></div></details>`).join('')}</div>`;
  }).join('');
  // FAQ structured data for Google
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  document.head.appendChild(ld);
}

const initials = (name) => name.replace(/\b(Sir|Mam)\b/g, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function renderFounder(el) {
  if (!el) return;
  const f = FOUNDER;
  const stats = [
    f.experience && { k: f.experience, v: 'teaching experience' },
    f.studentsTaught && { k: f.studentsTaught, v: 'students taught' },
    { k: '1-on-1', v: 'live video classes' },
    { k: '2', v: 'published guitar eBooks' },
  ].filter(Boolean);
  el.innerHTML = `
    <div class="founder-media">
      ${picture(f.photo, `${f.name} playing electric guitar`, { width: 900, height: 1200 })}
      <div class="founder-badge">${stars()}<span>${e(f.ratingText)}</span></div>
    </div>
    <div class="founder-copy">
      <p class="eyebrow">${e(f.role)}</p>
      <h2 class="h2" id="teacher-title">Meet ${e(f.name)}</h2>
      <p class="lead">${e(f.intro)}</p>
      <dl class="stat-row">${stats.map((s) => `<div><dt>${e(s.k)}</dt><dd>${e(s.v)}</dd></div>`).join('')}</dl>
      <ul class="check-list">${f.achievements.map((a) => `<li>${icons.check}<span>${e(a)}</span></li>`).join('')}
        <li>${icons.check}<span>Students from ${e(f.studentsFrom)}</span></li></ul>
      <div class="chip-row">${f.specialities.map((s) => `<span class="chip">${e(s)}</span>`).join('')}</div>
    </div>`;
}

export function renderTeachers(el) {
  if (!el) return;
  el.innerHTML = TEACHERS.map((t) => `
    <article class="teacher-card">
      <div class="teacher-avatar">${t.photo ? picture(t.photo, t.name, { width: 160, height: 160 }) : `<span aria-hidden="true">${e(initials(t.name))}</span>`}</div>
      <div>
        <h3 class="teacher-name">${e(t.name)}</h3>
        <p class="teacher-role">${e(t.role)}</p>
        <p class="teacher-bio">${e(t.bio)}</p>
        <div class="chip-row chip-row--sm">${(t.highlights || []).map((h) => `<span class="chip">${e(h)}</span>`).join('')}</div>
      </div>
    </article>`).join('');
}

const forProduct = (list, product) => list.filter((r) => !product || r.product === 'any' || r.product === product);

/** data-reviews="fingerstyle" (or chord / class) and data-review-kinds="text,video,image" */
export function renderReviews(el) {
  if (!el) return;
  const product = el.dataset.reviews || '';
  const kinds = (el.dataset.reviewKinds || 'text,video,image').split(',');
  let html = '';
  if (kinds.includes('text')) {
    html += `<div class="quote-grid">${forProduct(TEXT_REVIEWS, product).map((r) => `
      <figure class="quote">
        ${stars()}
        <blockquote><p>“${e(r.quote)}”</p></blockquote>
        <figcaption><span class="quote-avatar" aria-hidden="true">${e(initials(r.name))}</span><span><b>${e(r.name)}</b><small>${e(r.place)}</small></span></figcaption>
      </figure>`).join('')}</div>`;
  }
  if (kinds.includes('video')) {
    const vids = forProduct(VIDEO_REVIEWS, product);
    if (vids.length) html += `<h3 class="sub-title">Video reviews</h3><div class="rail rail--videos">${vids.map((v) => `<figure class="rail-item">${videoMarkup(v, { title: v.caption })}<figcaption>${e(v.name)}${v.place ? ` · ${e(v.place)}` : ''}</figcaption></figure>`).join('')}</div>`;
  }
  if (kinds.includes('image')) {
    const imgs = forProduct(IMAGE_REVIEWS, product);
    const grid = `<div class="masonry">${imgs.map((r) => `<figure class="shot">${picture(r.image, r.alt, { width: r.w, height: r.h })}</figure>`).join('')}</div>`;
    // When text quotes are shown too, keep the screenshots one tap away (proof without repetition).
    if (imgs.length) html += kinds.includes('text')
      ? `<details class="shots-toggle"><summary>See the original WhatsApp messages (${imgs.length})</summary>${grid}</details>`
      : `<h3 class="sub-title">Straight from WhatsApp</h3>${grid}`;
  }
  el.innerHTML = html;
  initVideos(el);
}
