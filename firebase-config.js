/* ── Firebase Configuration ──
   Poster Lab Store Firebase & Firestore configuration
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
  if (firebaseReady && firebaseDb) return;
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] SDK not loaded yet, will retry');
    setTimeout(initFirebase, 400);
    return;
  }
  try {
    if (firebase.apps && firebase.apps.length > 0) {
      firebaseApp = firebase.apps.find(a => a.name === 'posterlab') || firebase.apps[0];
    } else {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG, 'posterlab');
    }
    firebaseAuth = firebaseApp.auth ? firebaseApp.auth() : (firebase.auth ? firebase.auth() : null);
    firebaseDb = firebaseApp.firestore ? firebaseApp.firestore() : (firebase.firestore ? firebase.firestore() : null);
    if (firebaseDb && typeof firebaseDb.settings === 'function') {
      try { firebaseDb.settings({ merge: true }); } catch (ignore) {}
    }
    firebaseReady = Boolean(firebaseDb);
    console.log('[Firebase] Initialized successfully. Ready:', firebaseReady);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { db: firebaseDb, auth: firebaseAuth } }));
    }
  } catch (e) {
    console.error('[Firebase] Init error:', e);
  }
}

function getFirebaseAuth() { return firebaseAuth; }
function getFirebaseDb() { return firebaseDb; }
function isFirebaseReady() { return firebaseReady && Boolean(firebaseDb); }

function ensureFirebaseReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (isFirebaseReady()) return resolve(firebaseDb);
    initFirebase();
    const start = Date.now();
    const interval = setInterval(() => {
      if (isFirebaseReady()) {
        clearInterval(interval);
        return resolve(firebaseDb);
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(firebaseDb || null);
      }
    }, 100);
  });
}

// Expose globally
if (typeof window !== 'undefined') {
  window.initFirebase = initFirebase;
  window.getFirebaseAuth = getFirebaseAuth;
  window.getFirebaseDb = getFirebaseDb;
  window.isFirebaseReady = isFirebaseReady;
  window.ensureFirebaseReady = ensureFirebaseReady;
}
