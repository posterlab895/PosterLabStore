/* ── Firebase Configuration ──
   Poster Lab Store Firebase & Firestore configuration
   Features auto-detect long-polling, undefined safety,
   multi-tab offline persistence, and robust initialization.
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
let _persistenceAttempted = false;

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

    if (typeof firebase.firestore === 'function') {
      firebaseDb = firebase.firestore(firebaseApp);

      // Configure Firestore settings for network resilience and undefined safety
      try {
        firebaseDb.settings({
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
          merge: true
        });
      } catch (_) {
        // Settings can only be applied once before any other Firestore operations
      }

      // Enable multi-tab offline persistence
      if (typeof firebaseDb.enablePersistence === 'function' && !_persistenceAttempted) {
        _persistenceAttempted = true;
        firebaseDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          console.warn('[Firebase] Persistence note:', err.code || err.message);
        });
      }

      firebaseReady = true;
      console.log('[Firebase] Initialized successfully. Ready:', firebaseReady);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { db: firebaseDb, auth: firebaseAuth } }));
      }
    }
    return firebaseDb;
  } catch (e) {
    console.warn('[Firebase] Init notice (will fallback to local):', e.message || e);
    return null;
  }
}

function getFirebaseAuth() {
  if (!firebaseAuth) initFirebase();
  return firebaseAuth;
}

function getFirebaseDb() {
  if (!firebaseDb) initFirebase();
  return firebaseDb;
}

function isFirebaseReady() {
  if (!firebaseReady || !firebaseDb) initFirebase();
  return firebaseReady && Boolean(firebaseDb);
}

function ensureFirebaseReady(timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (isFirebaseReady()) return resolve(firebaseDb);
    initFirebase();
    if (isFirebaseReady()) return resolve(firebaseDb);

    const start = Date.now();
    const interval = setInterval(() => {
      initFirebase();
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

// Health check / connection test
async function testFirebaseConnection() {
  const start = Date.now();
  try {
    const db = await ensureFirebaseReady(5000);
    if (!db) return { ok: false, latency: 0, error: 'Firebase SDK not initialized' };
    await db.collection('products').limit(1).get();
    return { ok: true, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, latency: Date.now() - start, error: err.message || String(err) };
  }
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
  window.testFirebaseConnection = testFirebaseConnection;
}
