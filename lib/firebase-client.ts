import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  type FirestoreSettings,
  type Firestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Check if Firebase is already initialized
const isAlreadyInitialized = getApps().length > 0;

// Firestore settings optimized for web apps
const firestoreSettings: FirestoreSettings = {
  experimentalAutoDetectLongPolling: true, // Automatically detect best connection method
  ignoreUndefinedProperties: true, // Ignore undefined fields in documents
};

// Initialize Firestore with settings (only if not already initialized)
let db: Firestore;
if (!isAlreadyInitialized) {
  // New initialization
  db = initializeFirestore(app, firestoreSettings);
  
  // Connect to emulator in development (only during initial setup)
  if (process.env.NODE_ENV === 'development') {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (err) {
      console.warn('Firestore emulator connection failed:', err);
    }
  }
} else {
  // Already initialized, just get the instance
  db = getFirestore(app);
}

// Enable offline persistence (safely try)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence disabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firestore persistence not supported by browser');
    } else {
      // Other persistence errors (such as already enabled)
      console.warn('Firestore persistence initialization issue:', err.message);
    }
  });
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.warn('Analytics initialization failed:', err);
  }
}

// Network state management
export const networkControls = {
  async enableNetwork() {
    try {
      await enableNetwork(db);
    } catch (err) {
      console.error('Error enabling Firestore network:', err);
    }
  },
  async disableNetwork() {
    try {
      await disableNetwork(db);
    } catch (err) {
      console.error('Error disabling Firestore network:', err);
    }
  }
};

export { app, db, auth, analytics };

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = () => getApps().length > 0;

// Helper to check if we're in the browser
export const isBrowser = () => typeof window !== 'undefined';

// Export the Firebase app as the default export
export default app; 