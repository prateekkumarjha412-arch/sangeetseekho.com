/* ✏️ TEACHERS — edit text freely.
   - Any field set to null is simply hidden on the website.
   - photo: path WITHOUT .webp/.jpg (put both files in /assets/img/teachers/). null = initials avatar.
   ⚠️ Facts marked CONFIRM must be checked by you before going live. */

export const FOUNDER = {
  name: 'Abhishek Nayak',
  callName: 'Abhishek Sir',
  role: 'Founder & Head Guitar Teacher',
  photo: '/assets/img/teachers/abhishek-nayak',
  intro: 'Abhishek teaches fingerstyle and song-based guitar one-on-one over video call. He writes every lesson by hand — chord shapes, tabs and Sargam side by side — so students can practise from the notes long after class ends. His two eBooks grew out of the same notes he uses with his own students.',
  experience: null,          // CONFIRM e.g. '8+ years teaching guitar'
  studentsTaught: null,      // CONFIRM e.g. '500+ students'
  studentsFrom: 'India, Malaysia, Poland, the UK and Canada',
  specialities: ['Fingerstyle guitar', 'Bollywood & film-song arrangements', 'Chord theory & modulation', 'Sargam-based notation'],
  achievements: [
    'Author of the Fingerstyle Guitar eBook and Chord Modulation Theory eBook',
    'Teaches students across India and abroad live, one-on-one',
    'Students play full fingerstyle song arrangements on a single guitar',
  ],
  ratingText: '5-star feedback from students',
};

export const TEACHERS = [
  {
    name: 'Rahul Sir',
    role: 'Fingerstyle Guitar Teacher',
    photo: null,
    bio: 'Focuses on clean fingerstyle technique — thumb independence, right-hand patterns and playing melody and bass together on one guitar.',
    highlights: ['Fingerstyle technique', 'Song arrangements'],   // CONFIRM / edit
  },
  {
    name: 'Sambit Sir',
    role: 'Guitar Teacher — Chords & Rhythm',
    photo: null,
    bio: 'Builds strong basics: chord changes, strumming, rhythm and timing, so beginners start playing real songs early.',
    highlights: ['Beginners', 'Strumming & rhythm'],              // CONFIRM / edit
  },
  {
    name: 'Girija Mam',
    role: 'Senior Guitar Teacher',
    photo: null,
    bio: 'Brings decades of teaching experience with classical and flamenco-influenced fingerstyle, and a calm, step-by-step approach that suits learners of every age.',
    highlights: ['Classical & flamenco technique', 'All ages'],   // CONFIRM / edit
  },
];
