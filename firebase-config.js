/* ── Firebase Configuration ──
   Replace the values below with YOUR Firebase project config.
   Steps: https://console.firebase.google.com → Project Settings → Add app → Web
   Enable: Authentication → Sign-in method → Email/Password
   Enable: Firestore Database → Create database (start in test mode)
*/
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9p-n0GgsspZgfIs1KxZuGjJDC0erjNJ4",
  authDomain: "poster-labstore.firebaseapp.com",
  projectId: "poster-labstore",
  storageBucket: "poster-labstore.firebasestorage.app",
  messagingSenderId: "195015526495",
  appId: "1:195015526495:web:a30b672feb24f9166e73ea"
};

let firebaseApp, firebaseAuth, firebaseDb;
let firebaseReady = false;

function initFirebase() {
  if (firebaseReady) return;
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] SDK not loaded yet, will retry');
    setTimeout(initFirebase, 500);
    return;
  }
  try {
    if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
      console.warn('[Firebase] Using placeholder config — set real values in firebase-config.js');
    }
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG, 'posterlab');
    firebaseAuth = firebaseApp.auth();
    firebaseDb = firebaseApp.firestore();
    firebaseDb.settings({ merge: true });
    firebaseReady = true;
    console.log('[Firebase] Initialized');
  } catch (e) {
    console.error('[Firebase] Init error:', e);
  }
}

function getFirebaseAuth() { return firebaseAuth; }
function getFirebaseDb() { return firebaseDb; }
function isFirebaseReady() { return firebaseReady; }
