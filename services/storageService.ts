import { Lecture, LectureStatus, User, UserStatus, DEFAULT_SUBJECTS } from '../types';
// @ts-ignore
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  setDoc, 
  where, 
  getDocs, 
  deleteDoc, 
  getDoc,
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';

// --- CONFIGURATION ---
// This configuration connects to your Global Database (Firestore)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCyPDjDAIEcO8RxuOtay-zOxGiFpCnTu5c",
  authDomain: "lecture-70bcf.firebaseapp.com",
  projectId: "lecture-70bcf",
  storageBucket: "lecture-70bcf.firebasestorage.app",
  messagingSenderId: "379831175780",
  appId: "1:379831175780:web:70fb9e884e625e9c10ed71"
};

// --- CLOUDINARY CONFIGURATION (GLOBAL IMAGE HOSTING) ---
const CLOUDINARY_CLOUD_NAME: string = "djvb10ozq"; 
const CLOUDINARY_UPLOAD_PRESET: string = "lecturepool_unsigned"; 

// Initialize Firebase
let db: any;
let isOfflineMode = false;

try {
  const app = initializeApp(FIREBASE_CONFIG);
  
  // Initialize Firestore with persistence settings for robustness
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

  console.log("🔥 Connected to Global Database with Persistence");
} catch (error: any) {
  if (error.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      // Fallback to standard init
      const app = initializeApp(FIREBASE_CONFIG);
      db = getFirestore(app);
      console.warn("Persistence failed (Multiple tabs open), falling back to standard.");
  } else if (error.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      const app = initializeApp(FIREBASE_CONFIG);
      db = getFirestore(app);
      console.warn("Persistence not supported, falling back to standard.");
  } else {
    console.error("CRITICAL ERROR: Could not connect to Global Database", error);
    isOfflineMode = true;
  }
}

// --- HELPER: Network Check ---
const isOnline = () => navigator.onLine;

// --- HELPER: Cloudinary Upload ---
const uploadToCloudinary = async (base64Data: string): Promise<string> => {
  if (!isOnline()) {
    throw new Error("Internet connection required for image upload.");
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Missing Cloudinary Configuration.");
  }

  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'lecture_pool');

  try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
      });

      if (!response.ok) {
          const errData = await response.json();
          console.error("Cloudinary Error:", errData);
          throw new Error(`Global Upload Failed: ${errData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.secure_url; // Returns the permanent HTTP URL
  } catch (error: any) {
      throw new Error("Image upload failed. Please check your internet connection.");
  }
};

// --- SUBJECT SERVICES ---

export const subscribeToSubjects = (callback: (subjects: string[]) => void): () => void => {
  if (!db) return () => {};
  
  // Connect to the global 'config' collection
  const unsub = onSnapshot(doc(db, "config", "subjects"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback(docSnapshot.data().list || DEFAULT_SUBJECTS);
    } else {
      // If global list doesn't exist, create it (only if online to avoid sync issues)
      if (isOnline()) {
         setDoc(docSnapshot.ref, { list: DEFAULT_SUBJECTS }).catch(e => console.error("Auto-create subjects failed", e));
      }
      callback(DEFAULT_SUBJECTS);
    }
  }, (error) => {
    console.error("Error syncing subjects:", error);
  });
  return unsub;
};

export const addSubject = async (subject: string): Promise<{ success: boolean, message: string }> => {
  if (!db) return { success: false, message: "Database disconnected" };

  try {
    const docRef = doc(db, "config", "subjects");
    // Use arrayUnion to atomically add the subject. 
    // This ensures no overwrites if multiple admins add subjects simultaneously.
    await updateDoc(docRef, {
      list: arrayUnion(subject)
    });
    return { success: true, message: 'Subject added globally' };
  } catch (e: any) {
    // If document doesn't exist yet, updateDoc fails. We try setDoc.
    try {
        const docRef = doc(db, "config", "subjects");
        await setDoc(docRef, { list: [subject] }, { merge: true });
        return { success: true, message: 'Subject added globally' };
    } catch (innerErr) {
        console.error(e);
        return { success: false, message: 'Failed to add subject. Check connection.' };
    }
  }
};

export const updateSubject = async (oldName: string, newName: string): Promise<{ success: boolean, message: string }> => {
  if (!db) return { success: false, message: "Database disconnected" };

  try {
    const docRef = doc(db, "config", "subjects");
    
    // Use a transaction to safely rename.
    // This ensures we read the LATEST version of the list before modifying it.
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        throw "Document does not exist!";
      }

      const currentList = sfDoc.data().list || [];
      const newList = currentList.map((s: string) => s === oldName ? newName : s).sort();
      
      transaction.update(docRef, { list: newList });
    });

    return { success: true, message: 'Subject updated globally' };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Update failed' };
  }
};

export const deleteSubject = async (subject: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, "config", "subjects");
    // Use arrayRemove to atomically remove the subject.
    // This guarantees it is removed regardless of what other data is in the list.
    await updateDoc(docRef, {
      list: arrayRemove(subject)
    });
  } catch (e) {
    console.error("Delete subject failed", e);
  }
};

export const resetSubjects = async (): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, "config", "subjects"), { list: DEFAULT_SUBJECTS });
};

// --- USER SERVICES (GLOBAL AUTH) ---

export const subscribeToUsers = (callback: (users: User[]) => void): () => void => {
  if (!db) return () => {};
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach(doc => users.push(doc.data() as User));
    callback(users);
  });
};

// Listen to specific user profile (Active Session Management)
export const subscribeToUserProfile = (userId: string, callback: (user: User | null) => void): () => void => {
  if (!db) return () => {};
  return onSnapshot(doc(db, "users", userId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as User);
    } else {
      callback(null); // User deleted
    }
  });
};

export const registerUser = async (user: User): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: "No database connection" };
  if (!isOnline()) return { success: false, message: "Internet required for registration." };

  try {
    // Sanitize input to prevent whitespace issues
    const cleanRollNo = user.rollNo.trim();
    const cleanUser = { 
        ...user, 
        rollNo: cleanRollNo,
        name: user.name.trim(),
        password: user.password.trim(),
        status: user.status 
    };

    // Check if user exists globally using cleanRollNo
    const q = query(collection(db, "users"), where("rollNo", "==", cleanRollNo));
    // Force fetch from server to avoid cache conflicts during registration
    const snapshot = await getDocs(q); 
    
    if (!snapshot.empty) return { success: false, message: 'This Roll Number is already registered.' };

    await setDoc(doc(db, "users", cleanUser.id), cleanUser);
    return { success: true, message: 'Registration successful' };
  } catch (error: any) {
    console.error("Register Error:", error);
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Database permissions denied. Please contact admin.' };
    }
    return { success: false, message: 'Registration failed. Server might be unreachable.' };
  }
};

export const loginUser = async (rollNo: string, password: string): Promise<{ success: boolean; user?: User; message: string }> => {
  if (!db) return { success: false, message: "No database connection" };

  try {
    const cleanRollNo = rollNo.trim();
    const cleanPass = password.trim();

    // 1. Find user by Roll No first
    const q = query(collection(db, "users"), where("rollNo", "==", cleanRollNo));
    const snapshot = await getDocs(q);
    
    // Check if we got data from cache and it's empty, might be out of sync
    const fromCache = snapshot.metadata.fromCache;
    
    if (snapshot.empty) {
        if (fromCache && !isOnline()) {
             return { success: false, message: 'User not found locally. Connect to internet to sync.' };
        }
        return { success: false, message: 'User not found. Please register first.' };
    }
    
    // 2. Check password in memory
    const userDoc = snapshot.docs.find(doc => doc.data().password === cleanPass);

    if (!userDoc) {
        return { success: false, message: 'Incorrect password.' };
    }

    const user = userDoc.data() as User;
    if (user.status === 'rejected') return { success: false, message: 'Account access denied by admin.' };
    if (user.status === 'pending') return { success: false, message: 'Account pending approval by admin.' };
    
    return { success: true, user, message: 'Login successful' };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: 'Login failed. Please check internet connection.' };
  }
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, "users", userId), { status });
};

export const updateUserProfile = async (userId: string, updates: { name?: string; password?: string }): Promise<{ success: boolean; user?: User; message: string }> => {
  if (!db) return { success: false, message: "No database connection" };
  
  try {
      const cleanUpdates: any = {};
      if (updates.name) cleanUpdates.name = updates.name.trim();
      if (updates.password) cleanUpdates.password = updates.password.trim();

      await updateDoc(doc(db, "users", userId), cleanUpdates);
      const updatedUser = (await getDoc(doc(db, "users", userId))).data() as User;
      return { success: true, user: updatedUser, message: 'Profile updated globally' };
  } catch (e) {
      return { success: false, message: 'Update failed' };
  }
};

// --- LECTURE SERVICES (GLOBAL SYNC) ---

export const subscribeToLectures = (callback: (lectures: Lecture[]) => void): () => void => {
  if (!db) return () => {};
  
  const q = query(collection(db, "lectures"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const lectures: Lecture[] = [];
    snapshot.forEach(doc => lectures.push(doc.data() as Lecture));
    callback(lectures);
  });
};

export const addLecture = async (lecture: Lecture): Promise<void> => {
  if (!db) throw new Error("No database connection");

  // 1. Upload Image to Cloudinary (Global Storage)
  if (lecture.imageURL && lecture.imageURL.startsWith('data:')) {
      try {
          const secureUrl = await uploadToCloudinary(lecture.imageURL);
          lecture.imageURL = secureUrl; 
      } catch (error: any) {
          console.error("Cloudinary Upload Failed:", error);
          throw new Error(`Image upload failed: ${error.message}`);
      }
  }

  // 2. Save Metadata to Firestore (Global Database)
  try {
      await setDoc(doc(db, "lectures", lecture.id), lecture);
  } catch (error: any) {
      if (error.code === 'permission-denied') {
          throw new Error("You do not have permission to upload. Check Database Rules.");
      }
      throw error;
  }
};

export const updateLectureStatus = async (id: string, status: LectureStatus, remark?: string): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, "lectures", id), { status, adminRemark: remark || "" });
};

export const deleteLecture = async (id: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, "lectures", id));
};

// Export connection status helper
export const checkConnection = isOnline;