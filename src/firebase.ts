import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  DocumentReference,
  DocumentData,
  Query,
  QuerySnapshot,
  getDocFromServer
} from "firebase/firestore";

// The Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyD9M2ak7qNnWVIPma56fgNqyGOcfxoj7vc",
  authDomain: "tutorfind-47171.firebaseapp.com",
  projectId: "tutorfind-47171",
  storageBucket: "tutorfind-47171.firebasestorage.app",
  messagingSenderId: "525736442683",
  appId: "1:525736442683:web:3ce2067d430d3ca53ed51e",
  measurementId: "G-Q6SMPLCW6Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);

// Operational types for Firestore security mapping
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global error handler complying with Phase 3 guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup (comply with CRITICAL CONSTRAINT)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test-connection', 'status'));
    console.log("Firebase connection initialized.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      // Ignore initial test status doc lookup permissions errors since it doesn't block app flow
      console.log("Initial test check completed.", error);
    }
  }
}

// --- SECURE FIRESTORE WRAPPER FUNCTIONS ---

export async function dbGetDoc<T = DocumentData>(docRef: DocumentReference<T>): Promise<any> {
  try {
    const snap = await getDoc(docRef);
    return snap;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docRef.path);
  }
}

export async function dbGetDocs<T = DocumentData>(q: Query<T>): Promise<QuerySnapshot<T>> {
  try {
    const snap = await getDocs(q);
    return snap;
  } catch (error) {
    // Attempting to cast or safely extract the collection path name for logging
    const path = (q as any)._query?.path?.segments?.join('/') || 'query';
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function dbSetDoc<T = DocumentData>(docRef: DocumentReference<T>, data: any, options?: any): Promise<void> {
  try {
    await setDoc(docRef, data, options);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docRef.path);
  }
}

export async function dbUpdateDoc<T = DocumentData>(docRef: DocumentReference<T>, data: any): Promise<void> {
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docRef.path);
  }
}

export async function dbAddDoc(colRef: any, data: any): Promise<any> {
  try {
    return await addDoc(colRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colRef.path || 'collection');
  }
}

export async function dbDeleteDoc<T = DocumentData>(docRef: DocumentReference<T>): Promise<void> {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docRef.path);
  }
}

export function dbOnSnapshot<T = DocumentData>(
  queryOrDoc: Query<T> | DocumentReference<T>,
  onNext: (snapshot: any) => void,
  onError?: (err: any) => void
) {
  const path = (queryOrDoc as any).path || (queryOrDoc as any)._query?.path?.segments?.join('/') || 'realtime';
  return onSnapshot(
    queryOrDoc as any,
    onNext,
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
