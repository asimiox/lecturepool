
import { Lecture, LectureStatus, User, UserStatus, DEFAULT_SUBJECTS } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, setDoc, where, getDocs, deleteDoc, getDoc } from 'firebase/firestore';

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
// We wrap this in a check to ensure we don't crash, but for global sync, this MUST succeed.
let db: any;
try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
  console.log("🔥 Connected to Global Database");
} catch (error) {
  console.error("CRITICAL ERROR: Could not connect to Global Database", error);
  alert("Could not connect to the global server. Please check your internet connection.");
}

// --- HELPER: Cloudinary Upload ---
const uploadToCloudinary = async (base64Data: string): Promise<string> => {
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
      // If global list doesn't exist, create it
      setDoc(docSnapshot.ref, { list: DEFAULT_SUBJECTS });
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
    const docSnap = await getDoc(docRef);
    const currentSubjects = docSnap.exists() ? docSnap.data()?.list : DEFAULT_SUBJECTS;

    if (currentSubjects.map((s:string) => s.toLowerCase()).includes(subject.toLowerCase())) {
        return { success: false, message: 'Subject already exists' };
    }
    
    const newSubjects = [...currentSubjects, subject].sort();
    await setDoc(docRef, { list: newSubjects });
    return { success: true, message: 'Subject added globally' };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to add subject' };
  }
};

export const updateSubject = async (oldName: string, newName: string): Promise<{ success: boolean, message: string }> => {
  if (!db) return { success: false, message: "Database disconnected" };

  try {
    const docRef = doc(db, "config", "subjects");
    const docSnap = await getDoc(docRef);
    const currentSubjects = docSnap.exists() ? docSnap.data()?.list : DEFAULT_SUBJECTS;

    const index = currentSubjects.indexOf(oldName);
    if (index === -1) return { success: false, message: 'Subject not found' };
    
    currentSubjects[index] = newName;
    currentSubjects.sort();

    await setDoc(docRef, { list: currentSubjects });
    return { success: true, message: 'Subject updated globally' };
  } catch (e) {
    return { success: false, message: 'Update failed' };
  }
};

export const deleteSubject = async (subject: string): Promise<void> => {
  if (!db) return;
  const docRef = doc(db, "config", "subjects");
  const docSnap = await getDoc(docRef);
  const currentSubjects = docSnap.exists() ? docSnap.data()?.list : DEFAULT_SUBJECTS;
  const newSubjects = currentSubjects.filter((s: string) => s !== subject);
  await setDoc(docRef, { list: newSubjects });
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

export const registerUser = async (user: User): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: "No internet connection" };

  try {
    // Check if user exists globally
    const q = query(collection(db, "users"), where("rollNo", "==", user.rollNo));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { success: false, message: 'This Roll Number is already registered.' };

    const newUser = { ...user, status: 'active' as UserStatus };
    await setDoc(doc(db, "users", user.id), newUser);
    return { success: true, message: 'Registration successful' };
  } catch (error: any) {
    console.error("Register Error:", error);
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Database permissions denied. Please contact admin.' };
    }
    return { success: false, message: 'Registration failed. Check internet.' };
  }
};

export const loginUser = async (rollNo: string, password: string): Promise<{ success: boolean; user?: User; message: string }> => {
  if (!db) return { success: false, message: "No internet connection" };

  try {
    const q = query(collection(db, "users"), where("rollNo", "==", rollNo), where("password", "==", password));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return { success: false, message: 'Invalid credentials or user does not exist.' };
    
    const user = snapshot.docs[0].data() as User;
    if (user.status === 'rejected') return { success: false, message: 'Account access denied by admin.' };
    
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
  if (!db) return { success: false, message: "No internet connection" };
  
  try {
      await updateDoc(doc(db, "users", userId), updates);
      // Fetch fresh data
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
