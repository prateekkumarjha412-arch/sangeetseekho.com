/* ✏️ STUDENT REVIEWS — three kinds are supported:
   type 'text'  : { quote, name, place, product }
   type 'image' : { image (path without extension), name, place, alt, product, w, h }
   type 'video' : { src, poster, name, place, caption, orientation: 'portrait' | 'landscape', product }
   product: 'fingerstyle' | 'chord' | 'class' | 'any'  → decides which pages show it.
   To add one: copy a block, paste it below, change the text/paths. */

export const TEXT_REVIEWS = [
  { name: 'Parmveer', place: 'Canada', product: 'any', quote: 'It is very well structured and presents guitar theory in a way that can have a meaningful impact on the way you understand and play the guitar. Especially helpful for intermediate players who want to take their playing to the next level.' },
  { name: 'Devroop Kar', place: 'Bhubaneswar', product: 'chord', quote: 'Very well written, neat and insightful on chord modulation, explained in a simple and practical way. The song examples help us relate and apply the theory.' },
  { name: 'Ansh Sharma', place: 'Student', product: 'any', quote: 'The content is very well-presented and engaging. It is really inspiring to see your hard work and dedication reflected in the book.' },
  { name: 'Yash', place: 'Student', product: 'any', quote: 'It makes our learning pace faster and smoother with simple, practical examples. We are blessed to have you as our teacher.' },
  { name: 'Nitesh Norris', place: 'UK', product: 'any', quote: 'This book makes our life easy and is very resourceful for learners. It will help in the future.' },
];

export const IMAGE_REVIEWS = [
  { image: '/assets/img/reviews/parmveer-canada', name: 'Parmveer', place: 'Canada', w: 720, h: 1127, product: 'any', alt: 'WhatsApp message from Parmveer in Canada praising the eBook' },
  { image: '/assets/img/reviews/devroop-kar', name: 'Devroop Kar', place: 'Bhubaneswar', w: 720, h: 548, product: 'any', alt: 'WhatsApp message from Devroop Kar about the Chord Modulation eBook' },
  { image: '/assets/img/reviews/ansh-sharma', name: 'Ansh Sharma', place: 'Student', w: 720, h: 780, product: 'any', alt: 'WhatsApp message from student Ansh Sharma about the book' },
  { image: '/assets/img/reviews/yash', name: 'Yash', place: 'Student', w: 720, h: 352, product: 'any', alt: 'WhatsApp message from student Yash' },
  { image: '/assets/img/reviews/nitesh-norris', name: 'Nitesh Norris', place: 'UK', w: 720, h: 312, product: 'any', alt: 'WhatsApp message from Nitesh Norris in the UK' },
];

export const VIDEO_REVIEWS = [
  { src: '/assets/video/review-video-01.mp4', poster: '/assets/img/posters/review-video-01', name: 'Student review', place: '', caption: 'Video review of the eBook', orientation: 'portrait', product: 'any' },
  { src: '/assets/video/review-video-02.mp4', poster: '/assets/img/posters/review-video-02', name: 'Student review', place: '', caption: 'Video review of the eBook', orientation: 'portrait', product: 'any' },
  { src: '/assets/video/review-video-03.mp4', poster: '/assets/img/posters/review-video-03', name: 'Student review', place: '', caption: 'Video review of the eBook', orientation: 'portrait', product: 'any' },
];

/* Real class recordings (used on the Online Classes page). */
export const LIVE_CLASS_VIDEOS = [
  { src: '/assets/video/live-class-01.mp4', poster: '/assets/img/posters/live-class-01', name: 'Arya', place: 'Malaysia', caption: 'Fingerstyle, live 1-on-1', orientation: 'portrait' },
  { src: '/assets/video/live-class-02.mp4', poster: '/assets/img/posters/live-class-02', name: 'Tanvi', place: 'Cochin', caption: 'Song practice in class', orientation: 'portrait' },
  { src: '/assets/video/live-class-03.mp4', poster: '/assets/img/posters/live-class-03', name: 'Divyam', place: 'Pune', caption: 'Fingerstyle, live 1-on-1', orientation: 'portrait' },
  { src: '/assets/video/live-class-04.mp4', poster: '/assets/img/posters/live-class-04', name: 'Parth', place: 'Poland', caption: 'Song mashup, live 1-on-1', orientation: 'portrait' },
];

export const TEACHER_VIDEO = {
  src: '/assets/video/teacher-performance.mp4',
  poster: '/assets/img/posters/teacher-performance',
  caption: 'Abhishek Nayak — fingerstyle performance',
  orientation: 'landscape',
};
