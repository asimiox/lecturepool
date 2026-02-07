
export type LectureStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'student' | 'admin';
export type UserStatus = 'pending' | 'active' | 'rejected';

export interface User {
  id: string;
  name: string;
  rollNo: string; // Used as username for students
  password: string;
  role: UserRole;
  status: UserStatus;
}

export interface Lecture {
  id: string;
  studentId: string; // Link to user
  studentName: string;
  rollNo: string;
  subject: string;
  topic: string;
  description?: string;
  imageURL: string;
  date: string; // ISO Date String YYYY-MM-DD
  timestamp: number; // For sorting
  status: LectureStatus;
  adminRemark?: string;
}

export enum Screen {
  AUTH = 'AUTH',
  HOME = 'HOME', // Dashboards
  UPLOAD = 'UPLOAD',
  LIBRARY = 'LIBRARY', // All approved lectures
  MY_UPLOADS = 'MY_UPLOADS', // Student specific
  PROFILE = 'PROFILE', // Edit Profile
}

export const DEFAULT_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Computer Science',
  'English Literature',
  'Biology',
  'History'
];
