
import { Lecture, LectureStatus, User, UserStatus, DEFAULT_SUBJECTS, Attachment, Announcement, Liker } from '../types';
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
      const app = initializeApp(FIREBASE_CONFIG);
      db = getFirestore(app);
      console.warn("Persistence failed (Multiple tabs open), falling back to standard.");
  } else if (error.code === 'unimplemented') {
      const app = initializeApp(FIREBASE_CONFIG);
      db = getFirestore(app);
      console.warn("Persistence not supported, falling back to standard.");
  } else {
    console.error("CRITICAL ERROR: Could not connect to Global Database", error);
  }
}

// --- HELPER: Network Check ---
const isOnline = () => navigator.onLine;

// --- HELPER: Cloudinary Upload ---
const uploadToCloudinary = async (base64Data: string, fileName: string, mimeType: string): Promise<string> => {
  if (!isOnline()) {
    throw new Error("Internet connection required for upload.");
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Missing Cloudinary Configuration.");
  }

  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'lecture_pool');
  
  let resourceType = 'raw';
  if (mimeType.startsWith('image/')) {
      resourceType = 'image';
  }

  if (fileName) {
      const safeName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const uniqueName = `${safeName.substring(0, safeName.lastIndexOf('.'))}_${Date.now()}`;
      
      if (resourceType === 'raw') {
         const ext = fileName.split('.').pop();
         formData.append('public_id', `${uniqueName}.${ext}`);
      } else {
         formData.append('public_id', uniqueName);
      }
  }

  try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
          method: 'POST',
          body: formData
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Global Upload Failed: ${errData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.secure_url;
  } catch (error: any) {
      throw new Error("File upload failed. Please check your internet connection.");
  }
};

// --- SUBJECT SERVICES ---

export const subscribeToSubjects = (callback: (subjects: string[]) => void): () => void => {
  if (!db) return () => {};
  
  const unsub = onSnapshot(doc(db, "config", "subjects"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback(docSnapshot.data().list || DEFAULT_SUBJECTS);
    } else {
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
    await updateDoc(docRef, {
      list: arrayUnion(subject)
    });
    return { success: true, message: 'Subject added globally' };
  } catch (e: any) {
    try {
        const docRef = doc(db, "config", "subjects");
        await setDoc(docRef, { list: [subject] }, { merge: true });
        return { success: true, message: 'Subject added globally' };
    } catch (innerErr) {
        return { success: false, message: 'Failed to add subject. Check connection.' };
    }
  }
};

export const updateSubject = async (oldName: string, newName: string): Promise<{ success: boolean, message: string }> => {
  if (!db) return { success: false, message: "Database disconnected" };

  try {
    const docRef = doc(db, "config", "subjects");
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
    return { success: false, message: 'Update failed' };
  }
};

export const deleteSubject = async (subject: string): Promise<void> => {
  if (!db) return;
  try {
    const docRef = doc(db, "config", "subjects");
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

// --- USER SERVICES ---

export const subscribeToUsers = (callback: (users: User[]) => void): () => void => {
  if (!db) return () => {};
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach(d => users.push(d.data() as User));
    callback(users);
  });
};

export const subscribeToUserProfile = (userId: string, callback: (user: User | null) => void): () => void => {
  if (!db) return () => {};
  return onSnapshot(doc(db, "users", userId), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as User);
    } else {
      callback(null);
    }
  });
};

export const registerUser = async (user: User): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: "No database connection" };
  if (!isOnline()) return { success: false, message: "Internet required for registration." };

  try {
    const cleanRollNo = user.rollNo.trim();
    const cleanUser = { 
        ...user, 
        rollNo: cleanRollNo,
        name: user.name.trim() 
    };

    const q = query(collection(db, "users"), where("rollNo", "==", cleanRollNo));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: "Roll Number already registered." };
    }

    await setDoc(doc(db, "users", user.id), cleanUser);
    return { success: true, message: "Registration successful" };
  } catch (error: any) {
    return { success: false, message: "Registration failed. Try again." };
  }
};

export const loginUser = async (rollNo: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  if (!db) return { success: false, message: "No database connection" };
  if (!isOnline()) return { success: false, message: "Internet connection required to login." };

  try {
    const q = query(collection(db, "users"), where("rollNo", "==", rollNo));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "User not found." };
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data() as User;

    if (user.password !== password) {
      return { success: false, message: "Incorrect password." };
    }
    
    if (user.status === 'pending') {
        return { success: false, message: "Account pending approval from Faculty." };
    }

    if (user.status === 'rejected') {
        return { success: false, message: "Account access has been revoked." };
    }

    return { success: true, message: "Login successful", user };
  } catch (error: any) {
    return { success: false, message: "Login failed. Check connection." };
  }
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, "users", userId), { status });
};

export const deleteUser = async (userId: string): Promise<void> => {
    if(!db) return;
    await deleteDoc(doc(db, "users", userId));
};

export const updateUserProfile = async (userId: string, data: { name: string, password?: string }): Promise<{success: boolean, message: string, user?: User}> => {
    if (!db) return { success: false, message: "No database connection" };
    try {
        const updateData: any = { name: data.name };
        if (data.password) updateData.password = data.password;
        
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, updateData);
        
        const updatedSnap = await getDoc(userRef);
        return { success: true, message: "Profile Updated", user: updatedSnap.data() as User };
    } catch (e) {
        return { success: false, message: "Failed to update profile" };
    }
};

export const adminAddUser = async (data: {name: string, rollNo: string, password: string}): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: "No database connection" };
    try {
        const id = crypto.randomUUID();
        // Check duplicate
        const q = query(collection(db, "users"), where("rollNo", "==", data.rollNo));
        const snap = await getDocs(q);
        if (!snap.empty) return { success: false, message: "Roll No already exists" };

        const newUser: User = {
            id,
            name: data.name,
            rollNo: data.rollNo,
            password: data.password,
            role: 'student',
            status: 'active'
        };
        await setDoc(doc(db, "users", id), newUser);
        return { success: true, message: "User added" };
    } catch (e) {
        return { success: false, message: "Failed to add user" };
    }
};

export const adminUpdateUser = async (id: string, data: {name: string, rollNo: string, password?: string}): Promise<{success: boolean, message: string}> => {
    if (!db) return { success: false, message: "No database connection" };
    try {
        const updateData: any = { name: data.name, rollNo: data.rollNo };
        if (data.password) updateData.password = data.password;
        await updateDoc(doc(db, "users", id), updateData);
        return { success: true, message: "User updated" };
    } catch (e) {
        return { success: false, message: "Failed to update user" };
    }
};

// --- LECTURE SERVICES ---

export const subscribeToLectures = (callback: (lectures: Lecture[]) => void): () => void => {
  if (!db) return () => {};
  const q = query(collection(db, "lectures")); // removed orderBy to fix index issues, sort client side
  return onSnapshot(q, (snapshot) => {
    const lectures: Lecture[] = [];
    snapshot.forEach(d => lectures.push(d.data() as Lecture));
    callback(lectures);
  });
};

export const addLecture = async (lectureData: any): Promise<void> => {
  if (!db) throw new Error("No database connection");
  if (!isOnline()) throw new Error("Internet required for upload.");

  const id = crypto.randomUUID();
  
  // Upload files to Cloudinary first
  let attachments: Attachment[] = [];
  
  if (lectureData.rawFiles && lectureData.rawFiles.length > 0) {
      // Parallel uploads for speed
      attachments = await Promise.all(lectureData.rawFiles.map(async (file: any) => {
          const url = await uploadToCloudinary(file.data, file.name, file.type);
          return {
              id: crypto.randomUUID(),
              url,
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              mimeType: file.type
          };
      }));
  }

  const { rawFiles, ...lectureFields } = lectureData;

  const newLecture: Lecture = {
    id,
    ...lectureFields,
    attachments,
    likes: [], // Initialize likes
    likedBy: [] // Initialize likers list
  };

  await setDoc(doc(db, "lectures", id), newLecture);
};

export const updateLectureStatus = async (id: string, status: LectureStatus, remark?: string): Promise<void> => {
  if (!db) return;
  const data: any = { status };
  if (remark) data.adminRemark = remark;
  await updateDoc(doc(db, "lectures", id), data);
};

export const deleteLecture = async (id: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, "lectures", id));
};

export const toggleLikeLecture = async (lectureId: string, user: { id: string, name: string }): Promise<void> => {
    if (!db) return;
    const lectureRef = doc(db, "lectures", lectureId);

    try {
        await runTransaction(db, async (transaction) => {
            const lectureDoc = await transaction.get(lectureRef);
            if (!lectureDoc.exists()) throw "Lecture does not exist!";

            const lectureData = lectureDoc.data() as Lecture;
            const likes = lectureData.likes || [];
            const likedBy = lectureData.likedBy || [];

            if (likes.includes(user.id)) {
                // Unlike
                const newLikes = likes.filter(id => id !== user.id);
                const newLikedBy = likedBy.filter(liker => liker.id !== user.id);
                transaction.update(lectureRef, { likes: newLikes, likedBy: newLikedBy });
            } else {
                // Like
                const newLikes = [...likes, user.id];
                const newLikedBy = [...likedBy, { id: user.id, name: user.name }];
                transaction.update(lectureRef, { likes: newLikes, likedBy: newLikedBy });
            }
        });
    } catch (e) {
        console.error("Like toggle failed", e);
    }
};


// --- ANNOUNCEMENT SERVICES ---

export const subscribeToAnnouncements = (callback: (list: Announcement[]) => void): () => void => {
    if (!db) return () => {};
    const q = query(collection(db, "announcements"));
    return onSnapshot(q, (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach(d => list.push(d.data() as Announcement));
        // Client side sort by timestamp desc
        list.sort((a, b) => b.timestamp - a.timestamp);
        callback(list);
    });
};

export const addAnnouncement = async (message: string, audience: string, audienceName: string, createdBy: string): Promise<{success: boolean}> => {
    if (!db) return { success: false };
    try {
        const id = crypto.randomUUID();
        const ann: Announcement = {
            id,
            message,
            audience,
            audienceName,
            createdBy,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            readBy: []
        };
        await setDoc(doc(db, "announcements", id), ann);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    if (!db) return;
    await deleteDoc(doc(db, "announcements", id));
};

export const updateAnnouncement = async (id: string, message: string): Promise<void> => {
    if(!db) return;
    await updateDoc(doc(db, "announcements", id), { message });
};

export const markAnnouncementAsRead = async (announcementId: string, studentId: string): Promise<void> => {
    if (!db) return;
    try {
        const ref = doc(db, "announcements", announcementId);
        await updateDoc(ref, {
            readBy: arrayUnion(studentId)
        });
    } catch (e) {
        // ignore errors
    }
};
