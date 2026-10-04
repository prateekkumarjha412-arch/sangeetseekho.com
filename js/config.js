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
  UPI_ID: 'YOUR_UPI_ID@bank',            // e.g. 'sangeetseekho@okicici'
  UPI_PAYEE_NAME: 'Sangeet Seekho',
  // Put your QR image in /assets/img/payment/ and write its file name here:
  UPI_QR_IMAGE: '/assets/img/payment/upi-qr-placeholder.svg',

  INSTAGRAM_URL: '',   // e.g. 'https://instagram.com/yourpage'  (leave '' to hide)
  YOUTUBE_URL: '',     // e.g. 'https://youtube.com/@yourchannel' (leave '' to hide)
};

/* ---------- 3. GOOGLE APPS SCRIPT (your backend) ---------- */
export const BACKEND_CONFIG = {
  // Paste the Web App URL you get after "Deploy → New deployment" in Apps Script.
  // It looks like: https://script.google.com/macros/s/AKfy..../exec
  GOOGLE_SCRIPT_URL: 'PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE',
  REQUEST_TIMEOUT_MS: 15000,   // give up on one request after 15 seconds
};

/* ---------- 4. PAYMENTS (Razorpay) ---------- */
export const PAYMENT_CONFIG = {
  // Only the KEY ID goes here (starts with rzp_test_ or rzp_live_).
  // The KEY SECRET goes in Apps Script Script Properties — never here.
  RAZORPAY_KEY_ID: 'rzp_test_XXXXXXXXXXXXXX',
  CURRENCY: 'INR',
  CHECKOUT_TITLE: 'Sangeet Seekho',
  THEME_COLOR: '#B5651D',
  // If the server is slow to create an order, open Razorpay anyway (payment is
  // still verified on the server afterwards). Keep this true.
  ALLOW_ORDERLESS_FALLBACK: true,
  // Extra seconds we wait for the server's order after the 7-second countdown.
  ORDER_GRACE_MS: 4000,
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
    cover: '/assets/img/ebooks/fingerstyle-cover',   // without .webp/.jpg
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
    cover: '/assets/img/ebooks/chord-modulation-cover',
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
  // 1-hour offer timer on eBook pages.
  OFFER_MINUTES: 60,
  // After the timer ends, a visitor sees "offer price still active" (no fake
  // reset). A fresh 1-hour window starts only after this many hours.
  OFFER_COOLDOWN_HOURS: 24,
  // Countdown on FINAL buttons only (Submit / Pay / Get the eBook).
  FINAL_CTA_SECONDS: 7,
};

/* ---------- 8. FILES ---------- */
export const ASSET_CONFIG = {
  // Upload your PDF to /assets/docs/ and write the path, e.g. '/assets/docs/curriculum.pdf'
  // Leave '' and the button will offer the curriculum on WhatsApp instead.
  CURRICULUM_PDF: '',
};
