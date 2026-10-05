/* ✏️ eBOOK DISPLAY CONTENT — covers, short pitch lines and free-preview pages.
   Prices are NOT here (they're in js/config.js → PRODUCT_CONFIG).
   To change preview pages: put images in /assets/img/ebooks/previews/ (both .webp and .jpg)
   and list them below (path without extension + the page number shown in the caption). */

export const EBOOKS = {
  fingerstyle: {
    key: 'fingerstyle',
    title: 'Fingerstyle Guitar eBook',
    tagline: 'Melody + bass on one guitar. Handwritten, with Sargam.',
    cover: '/assets/img/ebooks/fingerstyle-flat',
    page: '/fingerstyle-guitar-ebook/',
    totalPages: 48,
    previews: [
      { img: '/assets/img/ebooks/previews/fingerstyle-p02', page: 2, label: 'Lesson 1 — C major scale' },
      { img: '/assets/img/ebooks/previews/fingerstyle-p07', page: 7, label: 'Lesson 3 — Jingle Bells' },
      { img: '/assets/img/ebooks/previews/fingerstyle-p15', page: 15, label: 'Song — Hai Apna Dil' },
      { img: '/assets/img/ebooks/previews/fingerstyle-p21', page: 21, label: 'Song — Pyar Deewana Hota Hai' },
      { img: '/assets/img/ebooks/previews/fingerstyle-p36', page: 36, label: 'Strumming patterns' },
    ],
  },
  chord: {
    key: 'chord',
    title: 'Chord Modulation Theory',
    tagline: 'How songs change key — explained through raags and film songs.',
    cover: '/assets/img/ebooks/chord-modulation-flat',
    page: '/chord-modulation-theory/',
    totalPages: 30,
    previews: [
      { img: '/assets/img/ebooks/previews/chord-p02', page: 2, label: 'What is chord modulation' },
      { img: '/assets/img/ebooks/previews/chord-p04', page: 4, label: 'Song examples' },
      { img: '/assets/img/ebooks/previews/chord-p05', page: 5, label: 'Condition 2 — Raag Khamaj' },
      { img: '/assets/img/ebooks/previews/chord-p15', page: 15, label: 'Diatonic chord formula' },
      { img: '/assets/img/ebooks/previews/chord-p17', page: 17, label: 'Minor scale conditions' },
    ],
  },
};
