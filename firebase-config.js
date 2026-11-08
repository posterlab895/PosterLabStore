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

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseReady = false;

function initFirebase() {
  if (firebaseReady && firebaseDb) return firebaseDb;
  if (typeof firebase === 'undefined') {
    return null;
  }
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.apps[0];
    }
    firebaseAuth = typeof firebase.auth === 'function' ? firebase.auth(firebaseApp) : null;
    firebaseDb = typeof firebase.firestore === 'function' ? firebase.firestore(firebaseApp) : null;
    firebaseReady = Boolean(firebaseDb);
    console.log('[Firebase] Initialized successfully. Ready:', firebaseReady);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { db: firebaseDb, auth: firebaseAuth } }));
    }
    return firebaseDb;
  } catch (e) {
    console.warn('[Firebase] Init notice (will fallback to local):', e.message || e);
    return null;
  }
}

function getFirebaseAuth() { return firebaseAuth; }
function getFirebaseDb() { return firebaseDb; }
function isFirebaseReady() { return firebaseReady && Boolean(firebaseDb); }

function ensureFirebaseReady(timeoutMs = 5000) {
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

// Auto-init on script load
try { initFirebase(); } catch (_) {}

// Expose globally
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.initFirebase = initFirebase;
  window.getFirebaseAuth = getFirebaseAuth;
  window.getFirebaseDb = getFirebaseDb;
  window.isFirebaseReady = isFirebaseReady;
  window.ensureFirebaseReady = ensureFirebaseReady;
}
