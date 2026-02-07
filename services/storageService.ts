
import { Lecture, LectureStatus, User, UserStatus, DEFAULT_SUBJECTS } from '../types';

const STORAGE_KEY_LECTURES = 'lecturelog_data_v2';
const STORAGE_KEY_USERS = 'lecturelog_users_v2'; 
const STORAGE_KEY_SUBJECTS = 'lecturelog_subjects_v1';

// Seed Admin
const SEED_ADMIN: User = {
  id: 'admin-01',
  name: 'Faculty Admin',
  rollNo: 'admin', // Username for admin
  password: 'admin123',
  role: 'admin',
  status: 'active'
};

// --- Subject Services ---

export const getSubjects = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SUBJECTS);
  if (!stored) {
    // Initialize with Defaults
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    return [...DEFAULT_SUBJECTS]; // Return copy to prevent mutation
  }
  return JSON.parse(stored);
};

export const addSubject = (subject: string): { success: boolean, message: string } => {
  const subjects = getSubjects();
  if (subjects.map(s => s.toLowerCase()).includes(subject.toLowerCase())) {
      return { success: false, message: 'Subject already exists' };
  }
  subjects.push(subject);
  subjects.sort();
  localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
  return { success: true, message: 'Subject added' };
};

export const updateSubject = (oldName: string, newName: string): { success: boolean, message: string } => {
  const subjects = getSubjects();
  const index = subjects.indexOf(oldName);
  
  if (index === -1) {
    return { success: false, message: 'Subject not found' };
  }
  
  // Check if new name exists (exclude current)
  if (subjects.some((s, i) => i !== index && s.toLowerCase() === newName.toLowerCase())) {
      return { success: false, message: 'Subject name already exists' };
  }

  subjects[index] = newName;
  subjects.sort();
  localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));

  // Update existing lectures with the new subject name
  const lectures = getLectures();
  let changed = false;
  const updatedLectures = lectures.map(l => {
      if (l.subject === oldName) {
          changed = true;
          return { ...l, subject: newName };
      }
      return l;
  });
  if (changed) {
      localStorage.setItem(STORAGE_KEY_LECTURES, JSON.stringify(updatedLectures));
  }

  return { success: true, message: 'Subject updated' };
};

export const deleteSubject = (subject: string): void => {
  const subjects = getSubjects();
  const newSubjects = subjects.filter(s => s !== subject);
  localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(newSubjects));
};

export const resetSubjects = (): void => {
  localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
};

// --- User Services ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  if (!stored) {
    // Initialize with Admin
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([SEED_ADMIN]));
    return [SEED_ADMIN];
  }
  return JSON.parse(stored);
};

export const registerUser = (user: User): { success: boolean; message: string } => {
  const users = getUsers();
  if (users.some(u => u.rollNo === user.rollNo)) {
    return { success: false, message: 'Roll Number/Username already exists' };
  }
  
  // Force status to pending for new students
  const newUser = { ...user, status: 'pending' as UserStatus };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  return { success: true, message: 'Registration successful' };
};

export const loginUser = (rollNo: string, password: string): { success: boolean; user?: User; message: string } => {
  const users = getUsers();
  const user = users.find(u => u.rollNo === rollNo && u.password === password);
  
  if (user) {
    if (user.role === 'student' && user.status === 'pending') {
      return { success: false, message: 'Account awaiting admin approval.' };
    }
    if (user.status === 'rejected') {
      return { success: false, message: 'Account access has been denied.' };
    }
    return { success: true, user, message: 'Login successful' };
  }
  return { success: false, message: 'Invalid credentials' };
};

export const updateUserStatus = (userId: string, status: UserStatus): void => {
  const users = getUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, status };
    }
    return u;
  });
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
};

export const updateUserProfile = (userId: string, updates: { name?: string; password?: string }): { success: boolean; user?: User; message: string } => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    return { success: false, message: 'User not found' };
  }

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  // Also need to update user name in existing lectures if name changed
  if (updates.name) {
      const lectures = getLectures();
      const updatedLectures = lectures.map(l => {
          if (l.studentId === userId) {
              return { ...l, studentName: updates.name! };
          }
          return l;
      });
      localStorage.setItem(STORAGE_KEY_LECTURES, JSON.stringify(updatedLectures));
  }

  return { success: true, user: updatedUser, message: 'Profile updated successfully' };
};

// --- Lecture Services ---

export const getLectures = (): Lecture[] => {
  const stored = localStorage.getItem(STORAGE_KEY_LECTURES);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse lectures", e);
    return [];
  }
};

export const addLecture = (lecture: Lecture): void => {
  const lectures = getLectures();
  const newLectures = [lecture, ...lectures];
  localStorage.setItem(STORAGE_KEY_LECTURES, JSON.stringify(newLectures));
};

export const updateLectureStatus = (id: string, status: LectureStatus, remark?: string): void => {
  const lectures = getLectures();
  const updated = lectures.map(l => {
    if (l.id === id) {
      return { ...l, status, adminRemark: remark || l.adminRemark };
    }
    return l;
  });
  localStorage.setItem(STORAGE_KEY_LECTURES, JSON.stringify(updated));
};

export const deleteLecture = (id: string): void => {
  const lectures = getLectures();
  const updated = lectures.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY_LECTURES, JSON.stringify(updated));
};
