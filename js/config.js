/* =====================================================================
   SANGEET SEEKHO — WEBSITE SETTINGS (the ONE file for website settings)
   =====================================================================
   Everything you will normally need to change on the website is here.

   ✏️  Only change the text between the quotes '...'.
   🔒  NEVER put secret keys in this file (Razorpay SECRET, Meta access
       token). This file is public. Secrets go in Google Apps Script →
       Project Settings → Script Properties (see SETUP_GUIDE.md).

   eBook Drive links are ALSO not here on purpose: anything in this file
   can be read by anyone, so the links are kept in Google Apps Script and
   only shown to customers after a verified payment.
   ===================================================================== */

/* ---------- 1. SITE ---------- */
export const SITE_CONFIG = {
  NAME: 'Sangeet Seekho',
  DOMAIN: 'https://sangeetseekho.com',
  FOUNDER: 'Abhishek Nayak',
  // Turn on extra logging in the browser console. You can also add ?debug=1 to any URL.
  DEBUG: false,
};

/* ---------- 2. CONTACT ---------- */
export const CONTACT_CONFIG = {
  // WhatsApp number: country code + number, digits only (no +, no spaces)
  WHATSAPP_NUMBER: '919754751793',
  PHONE_DISPLAY: '+91 97547 51793',
  EMAIL: 'sangeetseekho9@gmail.com',
  SUPPORT_HOURS: '10 AM – 9 PM IST, all days',

  // Payment-help panel (the "Payment issue?" floating button)
  UPI_ID: '9754751793@ybl',
  UPI_PAYEE_NAME: 'Abhishek Nayak',
  // Put your QR image in /assets/img/payment/ and write its file name here:
  UPI_QR_IMAGE: '/assets/img/payment/upi-qr.png',

  INSTAGRAM_URL: '',   // e.g. 'https://instagram.com/yourpage'  (leave '' to hide)
  YOUTUBE_URL: '',     // e.g. 'https://youtube.com/@yourchannel' (leave '' to hide)
};

/* ---------- 3. GOOGLE APPS SCRIPT (your backend) ---------- */
export const BACKEND_CONFIG = {
  // Paste the WEB APP URL you get after "Deploy → New deployment" in Apps Script.
  // It looks like: https://script.google.com/macros/s/AKfy..../exec
  // ⚠️ NOT the editor link (script.google.com/home/projects/.../edit) — that one won't work.
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxdndFV7hCGRPIkV6uRD27gjaVuFe9lmVCHYpsJRKBFYiUP575HLEKEx0kor2s1K--3/exec',
  REQUEST_TIMEOUT_MS: 15000,   // give up on one request after 15 seconds
};

/* ---------- 4. PAYMENTS (Razorpay) ---------- */
export const PAYMENT_CONFIG = {
  // Only the KEY ID goes here (starts with rzp_test_ or rzp_live_).
  // The KEY SECRET goes in Apps Script Script Properties — never here.
  RAZORPAY_KEY_ID: 'rzp_live_TkG7baf6ZklyDq',
  CURRENCY: 'INR',
  CHECKOUT_TITLE: 'Sangeet Seekho',
  THEME_COLOR: '#B5651D',
  // If the server is slow to create an order, open Razorpay anyway (payment is
  // still verified on the server afterwards). Keep this true.
  ALLOW_ORDERLESS_FALLBACK: true,
  // Longest we wait for the server's order after the customer clicks Pay before opening
  // Razorpay anyway (usually it's ready in 1–3 s and Razorpay opens immediately).
  ORDER_GRACE_MS: 6000,
};

/* ---------- 5. TRACKING (Meta Pixel) ---------- */
export const TRACKING_CONFIG = {
  // Your Pixel ID is a number like 123456789012345. Leave as is to keep tracking OFF.
  META_PIXEL_ID: 'YOUR_META_PIXEL_ID',
};

/* ---------- 6. PRODUCTS (prices shown on the website) ----------
   ⚠️ If you change a price here, change the SAME price in
   apps-script/Config.gs too. The server's price is the one actually charged
   (so nobody can change the price in their browser). The diagnostics page
   (/diagnostics/) tells you if the two don't match. */
export const PRODUCT_CONFIG = {
  fingerstyle: {
    key: 'fingerstyle',
    id: 'SS-EBOOK-FINGERSTYLE',
    name: 'Fingerstyle Guitar eBook',
    shortName: 'Fingerstyle eBook',
    price: 1499,
    mrp: 3700,               // "show-up" / original price (shown crossed out)
    page: '/fingerstyle-guitar-ebook/',
    cover: '/assets/img/ebooks/fingerstyle-flat',   // flat front cover, without .webp/.jpg
    includes: ['fingerstyle'],
  },
  chord: {
    key: 'chord',
    id: 'SS-EBOOK-CHORD-MODULATION',
    name: 'Chord Modulation Theory',
    shortName: 'Chord Modulation eBook',
    price: 999,
    mrp: 2100,
    page: '/chord-modulation-theory/',
    cover: '/assets/img/ebooks/chord-modulation-flat',
    includes: ['chord'],
  },
  combo: {
    key: 'combo',
    id: 'SS-EBOOK-COMBO',
    name: 'Fingerstyle + Chord Modulation Combo',
    shortName: 'Both eBooks (Combo)',
    price: 2299,
    mrp: 5800,
    page: '/fingerstyle-guitar-ebook/#combo',
    cover: '/assets/img/ebooks/combo-covers',
    includes: ['fingerstyle', 'chord'],
    bestValue: true,
  },
};

/* ---------- 7. TIMERS ---------- */
export const TIMER_CONFIG = {
  // Offer timer on eBook pages: counts down from 1 hour. When it reaches 00:00:00 it
  // automatically starts a new 1-hour cycle. Reloading the page does NOT reset it.
  OFFER_MINUTES: 60,
  // Countdown on the online-class enrollment button only (contact + eBook checkout open instantly).
  FINAL_CTA_SECONDS: 7,
};

/* ---------- 8. FILES ---------- */
export const ASSET_CONFIG = {
  // Upload your PDF to /assets/docs/ and write the path, e.g. '/assets/docs/curriculum.pdf'
  // Leave '' and the button will offer the curriculum on WhatsApp instead.
  CURRICULUM_PDF: '/assets/docs/sangeetseekho-curriculum.pdf',
};
