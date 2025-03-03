import { initializeApp, getApps, type FirebaseOptions, type FirebaseApp } from "firebase/app";
// biome-ignore lint/style/useImportType: <explanation>
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  Timestamp,
  type Firestore, 
  type FirestoreError 
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (but only if it hasn't been initialized already)
// This is important for Next.js which can run this file multiple times
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

// Only initialize once in client side
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firestore
  db = getFirestore(app);

  // Enable offline persistence when possible
  // This must be called before any other Firestore calls
  // We wrap in try/catch because this can fail in certain browsers
  try {
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log('Firestore persistence enabled');
      })
      .catch((err: FirestoreError) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence could not be enabled. Multiple tabs open?');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence is not available in this browser');
        } else {
          console.error('Error enabling Firestore persistence:', err);
        }
      });
  } catch (err: unknown) {
    console.warn('Error enabling Firestore persistence:', err);
  }

  // Initialize Auth
  auth = getAuth(app);
  
  // Initialize Storage
  storage = getStorage(app);
}

// Export services
export { db, auth, storage };

// Helper function to check if we're in the browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Type for Firestore document with data
interface FirestoreDocument {
  id: string;
  exists: boolean;
  data: () => FirestoreData;
}

// Type for Firestore document data with possible timestamp fields
interface FirestoreData {
  [key: string]: unknown;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastUpdatedAt?: Timestamp;
  lastTransactionAt?: Timestamp;
}

// Helper for converting Firestore data (timestamps, etc)
export function convertFirestoreData<T>(doc: FirestoreDocument | null | undefined): T | null {
  if (!doc || !doc.exists) {
    return null;
  }
  
  const data = doc.data();
  const result: Record<string, unknown> = {
    id: doc.id,
    ...data
  };
  
  // Convert Firestore Timestamps to Date objects if they exist
  if (data.createdAt && 'toDate' in data.createdAt) {
    result.createdAt = data.createdAt.toDate();
  }
  
  if (data.updatedAt && 'toDate' in data.updatedAt) {
    result.updatedAt = data.updatedAt.toDate();
  }
  
  if (data.lastUpdatedAt && 'toDate' in data.lastUpdatedAt) {
    result.lastUpdatedAt = data.lastUpdatedAt.toDate();
  }
  
  if (data.lastTransactionAt && 'toDate' in data.lastTransactionAt) {
    result.lastTransactionAt = data.lastTransactionAt.toDate();
  }
  
  return result as T;
}

// Export the Firebase app as the default export
export default app; 