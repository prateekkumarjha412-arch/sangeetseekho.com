/* ✏️ TEACHER + GURUS — edit text freely.
   - Abhishek Nayak teaches the online classes.
   - GURUS are the respected teachers Abhishek learned from. They are NOT part of a
     Sangeet Seekho team and do not teach the online classes.
   - Any field set to null is hidden on the website. */

export const TEACHER = {
  name: 'Abhishek Nayak',
  role: 'Your guitar teacher',
  photo: '/assets/img/teachers/abhishek-nayak',   // without .webp/.jpg
  intro: 'I teach fingerstyle and song-based guitar one-on-one — and I write every lesson by hand, so you can keep practising long after class.',
  experience: null,          // CONFIRM e.g. '8+ yrs'  (shown as a stat when filled in)
  studentsTaught: null,      // CONFIRM e.g. '500+'
  points: [
    'Author of 2 handwritten guitar eBooks',
    'Students in India, Malaysia, Poland, UK & Canada',
    'Fingerstyle, film songs, chords & theory',
  ],
};

export const GURUS = [
  { name: 'Rahul Deo Sir' },
  { name: 'Girija Marathe Mam' },
  { name: 'Sambit Chatterjee Sir' },
];
