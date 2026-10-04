/* Responsive, lightweight video player.
   - Nothing is downloaded until the visitor taps play (only the small poster image loads).
   - Works with portrait (9:16) and landscape (16:9) videos; once the real file's
     size is known, the box adopts its exact aspect ratio, so nothing is stretched or cropped.
   - Only one video plays at a time.

   Markup: <div class="video" data-video data-src="/assets/video/x.mp4"
                 data-poster="/assets/img/posters/x" data-orientation="portrait"
                 data-title="Live class with Arya"></div> */
import { icons } from './ui.js';
import { escapeHtml } from '../core/utils.js';
import { log } from '../core/logger.js';

export function videoMarkup(v, { title } = {}) {
  const t = title || v.caption || 'Video';
  return `<div class="video video--${v.orientation || 'landscape'}" data-video data-src="${escapeHtml(v.src)}" data-poster="${escapeHtml(v.poster || '')}" data-title="${escapeHtml(t)}"></div>`;
}

function mount(el) {
  if (el.dataset.ready) return;
  el.dataset.ready = '1';
  const orientation = el.dataset.orientation || (el.classList.contains('video--portrait') ? 'portrait' : 'landscape');
  el.classList.add(`video--${orientation}`);
  const poster = el.dataset.poster;
  const title = el.dataset.title || 'video';
  el.innerHTML = `
    ${poster ? `<picture><source srcset="${poster}.webp" type="image/webp"><img class="video-poster" src="${poster}.jpg" alt="" loading="lazy" decoding="async"></picture>` : '<div class="video-poster video-poster--empty"></div>'}
    <button type="button" class="video-play" aria-label="Play: ${escapeHtml(title)}">${icons.play}</button>`;
  el.querySelector('.video-play').addEventListener('click', () => play(el), { once: true });
}

function play(el) {
  const v = document.createElement('video');
  v.src = el.dataset.src;
  v.controls = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'auto';
  if (el.dataset.poster) v.poster = el.dataset.poster + '.jpg';
  v.setAttribute('aria-label', el.dataset.title || 'video');
  v.addEventListener('loadedmetadata', () => {
    if (v.videoWidth && v.videoHeight) el.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`;
  });
  v.addEventListener('play', () => {
    document.querySelectorAll('[data-video] video').forEach((o) => { if (o !== v && !o.paused) o.pause(); });
    log('video.play', { src: el.dataset.src });
  });
  v.addEventListener('error', () => {
    el.classList.add('video--error');
    el.insertAdjacentHTML('beforeend', '<p class="video-error">This video could not load. Please check your connection and try again.</p>');
  });
  el.innerHTML = '';
  el.appendChild(v);
  el.classList.add('is-playing');
  const p = v.play();
  if (p && p.catch) p.catch(() => {}); // autoplay may be refused; controls are visible anyway
}

export function initVideos(root = document) {
  root.querySelectorAll('[data-video]').forEach(mount);
}
