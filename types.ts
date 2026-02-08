
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

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'file';
  mimeType: string;
}

export interface Lecture {
  id: string;
  studentId: string; // Link to user
  studentName: string;
  rollNo: string;
  subject: string;
  topic: string;
  description?: string;
  imageURL?: string; // Deprecated, kept for backward compatibility
  attachments: Attachment[]; // New multi-file support
  date: string; // ISO Date String YYYY-MM-DD
  timestamp: number; // For sorting
  status: LectureStatus;
  adminRemark?: string;
}

export interface Announcement {
  id: string;
  message: string;
  audience: 'all' | string; // 'all' or specific studentId
  audienceName?: string; // For display purposes on admin side
  createdBy: string;
  timestamp: number;
  date: string;
}

export enum Screen {
  AUTH = 'AUTH',
  HOME = 'HOME', // Dashboards
  UPLOAD = 'UPLOAD',
  LIBRARY = 'LIBRARY', // All approved lectures
  MY_UPLOADS = 'MY_UPLOADS', // Student specific
  PROFILE = 'PROFILE', // Edit Profile
  ANNOUNCEMENTS = 'ANNOUNCEMENTS', // New Screen
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
