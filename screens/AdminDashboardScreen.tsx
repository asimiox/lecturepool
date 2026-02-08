
import React, { useState, useEffect } from 'react';
import { Lecture, User, Announcement } from '../types';
import { 
    subscribeToLectures, 
    updateLectureStatus, 
    subscribeToUsers, 
    updateUserStatus, 
    subscribeToSubjects, 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    resetSubjects,
    deleteUser,
    adminAddUser,
    adminUpdateUser,
    deleteLecture,
    addAnnouncement,
    subscribeToAnnouncements,
    deleteAnnouncement,
    updateAnnouncement
} from '../services/storageService';
import { LectureCard } from '../components/LectureCard';
import { BarChart2, CheckCircle, Clock, Users, Layers, Search, UserPlus, XCircle, Check, Book, Plus, Edit2, Trash2, Save, X, RotateCcw, Loader, User as UserIcon, Lock, Bell, Megaphone, Send, Eye, CheckCheck } from 'lucide-react';

type AdminTab = 'queue' | 'all_lectures' | 'students' | 'subjects' | 'announcements';

interface AdminDashboardProps {
  showNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pendingLectures, setPendingLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  
  // Announcement States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingStatsFor, setViewingStatsFor] = useState<Announcement | null>(null);

  // Student Management State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentForm, setStudentForm] = useState({ name: '', rollNo: '', password: '' });
  const [studentFormMsg, setStudentFormMsg] = useState('');
  const [isProcessingStudent, setIsProcessingStudent] = useState(false);

  // Subject Management States
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [subjectMsg, setSubjectMsg] = useState('');
  const [isProcessingSubject, setIsProcessingSubject] = useState(false);
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [lectureSearch, setLectureSearch] = useState('');

  useEffect(() => {
    // Real-time Subscriptions
    const unsubLectures = subscribeToLectures((allData) => {
        setLectures(allData);
        setPendingLectures(allData.filter(l => l.status === 'pending').sort((a, b) => a.timestamp - a.timestamp));
    });

    const unsubUsers = subscribeToUsers((allUsers) => {
        const allStudents = allUsers.filter(u => u.role === 'student');
        setStudents(allStudents.filter(u => u.status !== 'pending' && u.status !== 'rejected'));
        setPendingUsers(allStudents.filter(u => u.status === 'pending'));
    });

    const unsubSubjects = subscribeToSubjects((list) => {
        setSubjects(list);
    });

    const unsubAnnouncements = subscribeToAnnouncements((list) => {
        setAnnouncements(list);
    });

    return () => {
        unsubLectures();
        unsubUsers();
        unsubSubjects();
        unsubAnnouncements();
    };
  }, []);

  const handleApprove = async (id: string) => {
    await updateLectureStatus(id, 'approved');
    showNotification?.("Lecture Approved", 'success');
  };

  const handleReject = async (id: string, reason: string) => {
    await updateLectureStatus(id, 'rejected', reason);
    showNotification?.("Lecture Rejected", 'error');
  };
  
  const handleUserApprove = async (id: string) => {
    await updateUserStatus(id, 'active');
    showNotification?.("User Approved", 'success');
  };
  
  const handleUserReject = async (id: string) => {
    await updateUserStatus(id, 'rejected');
    showNotification?.("User Rejected", 'error');
  };
  
  const handleDeleteLecture = async (id: string) => {
      await deleteLecture(id);
      showNotification?.("Lecture Deleted", 'success');
  };

  // --- Announcement Handlers ---
  const handlePostAnnouncement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!announcementMsg.trim()) return;

      setIsPosting(true);
      let targetName = 'All Students';
      if (targetAudience !== 'all') {
          const student = students.find(s => s.id === targetAudience);
          targetName = student ? `${student.name} (${student.rollNo})` : 'Unknown Student';
      }

      const res = await addAnnouncement(announcementMsg, targetAudience, targetName, 'Admin');
      
      if (res.success) {
          setAnnouncementMsg('');
          setTargetAudience('all');
          showNotification?.("Announcement Posted", 'success');
      } else {
          showNotification?.("Failed to post announcement", 'error');
      }
      setIsPosting(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(window.confirm("Delete this announcement?")) {
          await deleteAnnouncement(id);
          showNotification?.("Announcement Deleted", 'success');
      }
  };

  const handleUpdateAnnouncement = async (id: string) => {
      if (editingAnnouncement && editingAnnouncement.message.trim()) {
          await updateAnnouncement(id, editingAnnouncement.message);
          setEditingAnnouncement(null);
          showNotification?.("Announcement Updated", 'success');
      }
  };

  // --- Student Management Handlers ---
  const handleOpenAddStudent = () => {
      setEditingStudent(null);
      setStudentForm({ name: '', rollNo: '', password: '' });
      setStudentFormMsg('');
      setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: User) => {
      setEditingStudent(student);
      setStudentForm({ name: student.name, rollNo: student.rollNo, password: '' }); 
      setStudentFormMsg('');
      setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
      if(window.confirm(`Are you sure you want to permanently delete student "${studentName}"? This action cannot be undone.`)) {
          await deleteUser(studentId);
          showNotification?.("Student Deleted", 'success');
      }
  };

  const handleStudentFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessingStudent(true);
      setStudentFormMsg('');

      if (!studentForm.name || !studentForm.rollNo) {
          setStudentFormMsg('Name and Roll No are required.');
          setIsProcessingStudent(false);
          return;
      }

      if (!editingStudent && !studentForm.password) {
          setStudentFormMsg('Password is required for new students.');
          setIsProcessingStudent(false);
          return;
      }

      let res;
      if (editingStudent) {
          res = await adminUpdateUser(editingStudent.id, {
              name: studentForm.name,
              rollNo: studentForm.rollNo,
              password: studentForm.password || undefined
          });
      } else {
          res = await adminAddUser({
              name: studentForm.name,
              rollNo: studentForm.rollNo,
              password: studentForm.password
          });
      }

      if (res.success) {
          setIsStudentModalOpen(false);
          showNotification?.(editingStudent ? "Student Updated" : "Student Added", 'success');
      } else {
          setStudentFormMsg(res.message);
      }
      setIsProcessingStudent(false);
  };

  // --- Subject Handlers ---
  const handleAddSubject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubject.trim()) return;
      setIsProcessingSubject(true);
      
      const res = await addSubject(newSubject.trim());
      if (res.success) {
          setNewSubject('');
          setSubjectMsg('');
          showNotification?.("Subject Added", 'success');
      } else {
          setSubjectMsg(res.message);
      }
      setIsProcessingSubject(false);
  };

  const startEditSubject = (subject: string) => {
      setEditingSubject(subject);
      setEditSubjectName(subject);
      setSubjectMsg('');
  };

  const cancelEditSubject = () => {
      setEditingSubject(null);
      setEditSubjectName('');
      setSubjectMsg('');
  };

  const saveEditSubject = async () => {
      if (!editSubjectName.trim() || !editingSubject) return;
      setIsProcessingSubject(true);
      
      const res = await updateSubject(editingSubject, editSubjectName.trim());
      if (res.success) {
          setEditingSubject(null);
          showNotification?.("Subject Updated", 'success');
      } else {
          setSubjectMsg(res.message);
      }
      setIsProcessingSubject(false);
  };

  const handleDeleteSubject = async (subject: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete "${subject}" globally?`)) {
          setIsProcessingSubject(true);
          await deleteSubject(subject);
          setIsProcessingSubject(false);
          showNotification?.("Subject Deleted", 'success');
      }
  };

  const handleResetSubjects = async () => {
      if (window.confirm("This will reset the subject list to the system defaults. Custom subjects will be removed. Continue?")) {
          setIsProcessingSubject(true);
          await resetSubjects();
          setIsProcessingSubject(false);
          showNotification?.("Subjects Reset", 'success');
      }
  };

  // Stats calculation
  const totalUploads = lectures.length;

  // Filtered Lists
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredAllLectures = lectures.filter(l => 
    l.topic.toLowerCase().includes(lectureSearch.toLowerCase()) ||
    l.studentName.toLowerCase().includes(lectureSearch.toLowerCase()) ||
    l.rollNo.toLowerCase().includes(lectureSearch.toLowerCase())
  );

  const StatCard = ({ icon: Icon, label, value, colorClass, onClick, pulse }: any) => (
    <div 
        onClick={onClick}
        className={`p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all ring-2 ring-transparent hover:ring-navy-200 dark:hover:ring-navy-700' : ''} ${pulse ? 'animate-pulse' : ''}`}
    >
        <div className={`p-4 rounded-2xl ${colorClass} text-white shadow-neu-flat dark:shadow-none`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="text-2xl font-black text-navy-900 dark:text-navy-50">{value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">{label}</div>
        </div>
    </div>
  );

  const searchInputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent text-sm font-medium text-navy-800 dark:text-navy-100 placeholder-navy-400 outline-none transition-all";
  const inputClass = "w-full px-4 py-2 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent focus:border-maroon-500 focus:ring-0 text-navy-900 dark:text-navy-100 placeholder-navy-300 outline-none transition-all text-sm font-medium";

  return (
    <div className="space-y-10">
      
      {/* NOTIFICATION BANNER FOR ADMIN */}
      {pendingLectures.length > 0 && (
          <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 flex items-center justify-between shadow-sm animate-pulse-slow">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-yellow-100 dark:bg-yellow-800 rounded-full text-yellow-700 dark:text-yellow-200">
                   <Bell size={20} className="animate-bounce" />
                </div>
                <div>
                   <h4 className="font-bold text-navy-900 dark:text-navy-50">Action Required</h4>
                   <p className="text-sm text-navy-600 dark:text-navy-300 font-medium">
                     You have <span className="text-maroon-600 dark:text-maroon-400 font-bold">{pendingLectures.length}</span> new lecture{pendingLectures.length > 1 ? 's' : ''} waiting for approval.
                   </p>
                </div>
             </div>
             {activeTab !== 'queue' && (
                 <button 
                   onClick={() => setActiveTab('queue')}
                   className="px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-bold shadow-lg hover:scale-105 transition-transform"
                 >
                   Review Now
                 </button>
             )}
          </div>
      )}

      {/* Analytics Section */}
      <div>
        <h3 className="text-lg font-bold text-navy-900 dark:text-navy-50 mb-6 flex items-center gap-2">
            <BarChart2 size={20} /> Dashboard Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={CheckCircle} label="Total Uploads" value={totalUploads} colorClass="bg-navy-600" onClick={() => setActiveTab('all_lectures')} />
            <StatCard 
                icon={Clock} 
                label="Pending Review" 
                value={pendingLectures.length} 
                colorClass="bg-maroon-600" 
                onClick={() => setActiveTab('queue')}
                pulse={pendingLectures.length > 0} 
            />
            <StatCard icon={Book} label="Active Subjects" value={subjects.length} colorClass="bg-indigo-600" onClick={() => setActiveTab('subjects')} />
            <StatCard icon={Users} label="Total Students" value={students.length} colorClass="bg-purple-600" onClick={() => setActiveTab('students')} />
        </div>
      </div>

      <div className="border-t border-navy-200 dark:border-navy-800 my-8"></div>

      {/* Control Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark self-start w-full xl:w-auto">
             <button
               onClick={() => setActiveTab('queue')}
               className={`relative flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'queue'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-maroon-600 dark:text-maroon-400' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Clock size={14} /> Queue
               {pendingLectures.length > 0 && (
                 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-maroon-500 text-white text-[10px] animate-pulse">
                     {pendingLectures.length}
                 </span>
               )}
               {pendingLectures.length > 0 && activeTab !== 'queue' && (
                   <span className="absolute top-0 right-0 -mt-1 -mr-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
               )}
             </button>
             <button
               onClick={() => setActiveTab('all_lectures')}
               className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'all_lectures'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-navy-900 dark:text-navy-100' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Layers size={14} /> All Uploads
             </button>
             <button
               onClick={() => setActiveTab('students')}
               className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'students'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-navy-900 dark:text-navy-100' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Users size={14} /> Students
             </button>
             <button
               onClick={() => setActiveTab('subjects')}
               className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'subjects'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-navy-900 dark:text-navy-100' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Book size={14} /> Subjects
             </button>
             <button
               onClick={() => setActiveTab('announcements')}
               className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'announcements'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-navy-900 dark:text-navy-100' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Megaphone size={14} /> Announcements
             </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'queue' && (
           <>
              <h2 className="text-xl font-black text-navy-900 dark:text-navy-50 mb-6">Pending Lecture Approval</h2>
              {pendingLectures.length === 0 ? (
                <div className="text-center py-24 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
                  <div className="mx-auto h-16 w-16 text-navy-300 bg-transparent rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-navy-800 dark:text-navy-100">All Caught Up!</h3>
                  <p className="text-navy-500 dark:text-navy-400 text-sm mt-2">No pending lectures to review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pendingLectures.map(lecture => (
                    <LectureCard 
                      key={lecture.id} 
                      lecture={lecture} 
                      isAdminView={true}
                      showAdminActions={true}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
           </>
        )}

        {/* ... (Existing code for other tabs omitted for brevity, keeping only changed sections or context) ... */}
        {activeTab === 'all_lectures' && (
          <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-navy-900 dark:text-navy-50">Complete Archive</h2>
                <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-navy-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Filter lectures..." 
                        value={lectureSearch}
                        onChange={(e) => setLectureSearch(e.target.value)}
                        className={searchInputClass}
                    />
                </div>
            </div>
            
            {lectures.length === 0 ? (
                 <div className="text-center py-24 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
                    <p className="text-navy-400">No lectures found in the system.</p>
                 </div>
            ) : filteredAllLectures.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-navy-400">No lectures match your search.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAllLectures.map(lecture => (
                  <LectureCard 
                    key={lecture.id} 
                    lecture={lecture} 
                    isAdminView={true}
                    onDelete={handleDeleteLecture} 
                    showAdminActions={lecture.status === 'pending'}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* ... (Student and Subject tabs code logic remains same, skipping for brevity in output) ... */}
        {activeTab === 'students' && (
           // Reuse existing student tab code
           <>
            {pendingUsers.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-xl font-black text-maroon-600 dark:text-maroon-400 mb-6 flex items-center gap-2">
                       <UserPlus size={20} /> Pending Reviews
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="p-4 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark flex flex-col gap-3">
                                {/* User Card Content */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy-900 dark:text-navy-50">{user.name}</h4>
                                        <p className="text-xs text-navy-500 font-mono">{user.rollNo}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button onClick={() => handleUserApprove(user.id)} className="flex-1 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 flex items-center justify-center gap-1"><Check size={14} /> Approve</button>
                                    <button onClick={() => handleUserReject(user.id)} className="flex-1 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 flex items-center justify-center gap-1"><XCircle size={14} /> Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-b border-navy-200 dark:border-navy-800 my-8"></div>
                </div>
            )}
            
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-navy-900 dark:text-navy-50">Registered Students</h2>
                <div className="flex items-center gap-4">
                    <div className="relative w-64 hidden md:block">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-navy-400" />
                        </div>
                        <input type="text" placeholder="Search..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className={searchInputClass} />
                    </div>
                    <button onClick={handleOpenAddStudent} className="px-4 py-2.5 rounded-xl bg-navy-600 text-white font-bold text-sm shadow-neu-flat dark:shadow-none hover:bg-navy-700 flex items-center gap-2"><Plus size={16} /> <span className="hidden sm:inline">Add Student</span></button>
                </div>
            </div>
            {/* Student Table implementation */}
            <div className="overflow-hidden rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark">
                    <table className="min-w-full bg-[#e6e9ef] dark:bg-[#1e212b]">
                        <thead className="bg-navy-100 dark:bg-navy-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-200 dark:divide-navy-800">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-navy-900 dark:text-navy-100 font-mono">{student.rollNo}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-navy-700 dark:text-navy-200">{student.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Active</span></td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenEditStudent(student)} className="p-1.5 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-1.5 text-maroon-500 hover:text-maroon-700 hover:bg-maroon-100 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
           </>
        )}

        {activeTab === 'subjects' && (
           // Reuse existing subject tab code
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-navy-900 dark:text-navy-50">Manage Subjects</h2>
                        <button onClick={handleResetSubjects} disabled={isProcessingSubject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-navy-200 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-300 dark:hover:bg-navy-700 transition-colors disabled:opacity-50"><RotateCcw size={12} /> Reset</button>
                     </div>
                     <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                         {subjects.map((subject) => (
                             <div key={subject} className="flex items-center justify-between p-4 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed transition-all group">
                                 {editingSubject === subject ? (
                                     <div className="flex items-center gap-2 w-full">
                                         <input type="text" value={editSubjectName} onChange={(e) => setEditSubjectName(e.target.value)} className="flex-1 bg-white dark:bg-navy-800 px-3 py-1.5 rounded-lg text-sm border border-navy-300 dark:border-navy-600 outline-none" autoFocus />
                                         <button onClick={saveEditSubject} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg"><Save size={16} /></button>
                                         <button onClick={cancelEditSubject} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"><X size={16} /></button>
                                     </div>
                                 ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-navy-400"></div>
                                            <span className="font-bold text-navy-800 dark:text-navy-100">{subject}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEditSubject(subject)} className="p-2 text-navy-500 hover:text-navy-800"><Edit2 size={16} /></button>
                                            <button onClick={(e) => handleDeleteSubject(subject, e)} className="p-2 text-maroon-500 hover:text-maroon-700"><Trash2 size={16} /></button>
                                        </div>
                                    </>
                                 )}
                             </div>
                         ))}
                     </div>
                </div>
                {/* Add Subject Form */}
                <div className="h-fit p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark sticky top-24">
                     <h3 className="text-lg font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2"><Plus size={20} className="text-maroon-600" /> Add New Subject</h3>
                     <form onSubmit={handleAddSubject}>
                         <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Subject Name</label>
                         <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className={inputClass} placeholder="e.g. Data Structures" />
                         <button type="submit" disabled={!newSubject.trim() || isProcessingSubject} className="w-full mt-6 py-3 rounded-xl bg-navy-600 text-white font-bold text-sm shadow-neu-flat dark:shadow-none hover:bg-navy-700 flex items-center justify-center gap-2">{isProcessingSubject ? 'Processing...' : 'Add Subject'}</button>
                     </form>
                </div>
            </div>
        )}

        {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* List Announcements */}
                <div>
                    <h2 className="text-xl font-black text-navy-900 dark:text-navy-50 mb-6">Active Announcements</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {announcements.length === 0 ? (
                             <div className="text-center py-12 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
                                <p className="text-navy-400">No active announcements.</p>
                             </div>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann.id} className="p-4 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark relative group hover:shadow-neu-pressed transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 bg-navy-100 dark:bg-navy-800 px-2 py-0.5 rounded-full">
                                            To: {ann.audienceName || 'All'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                             <button 
                                                onClick={() => setViewingStatsFor(ann)}
                                                className="flex items-center gap-1 text-[10px] font-bold bg-navy-200 dark:bg-navy-700 text-navy-800 dark:text-navy-100 px-2 py-0.5 rounded-full hover:bg-navy-300 transition-colors"
                                             >
                                                 <Eye size={12} />
                                                 {ann.readBy ? ann.readBy.length : 0} Read
                                             </button>
                                             <span className="text-[10px] text-navy-400 font-mono">{ann.date}</span>
                                        </div>
                                    </div>
                                    
                                    {editingAnnouncement?.id === ann.id ? (
                                        <div className="mt-2">
                                            <textarea 
                                                className="w-full p-2 text-sm rounded-lg bg-white dark:bg-navy-900 border border-navy-300 dark:border-navy-600"
                                                value={editingAnnouncement.message}
                                                onChange={(e) => setEditingAnnouncement({...editingAnnouncement, message: e.target.value})}
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleUpdateAnnouncement(ann.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded">Save</button>
                                                <button onClick={() => setEditingAnnouncement(null)} className="px-3 py-1 bg-gray-500 text-white text-xs rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium text-navy-800 dark:text-navy-100 mt-1 whitespace-pre-wrap">
                                            {ann.message}
                                        </p>
                                    )}

                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#e6e9ef] dark:bg-[#1e212b] p-1 rounded-lg">
                                         <button 
                                            onClick={() => setEditingAnnouncement(ann)}
                                            className="p-1.5 bg-navy-200 dark:bg-navy-700 rounded-md text-navy-700 dark:text-navy-200 hover:text-navy-900"
                                         >
                                            <Edit2 size={14} />
                                         </button>
                                         <button 
                                            onClick={() => handleDeleteAnnouncement(ann.id)}
                                            className="p-1.5 bg-maroon-100 dark:bg-maroon-900/40 rounded-md text-maroon-600 hover:text-maroon-800"
                                         >
                                            <Trash2 size={14} />
                                         </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Create Announcement */}
                <div className="h-fit p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark sticky top-24">
                     <h3 className="text-lg font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                         <Megaphone size={20} className="text-maroon-600" /> Post Announcement
                     </h3>
                     <form onSubmit={handlePostAnnouncement} className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Target Audience</label>
                             <select 
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className={inputClass}
                             >
                                 <option value="all">All Students</option>
                                 {students.map(s => (
                                     <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>
                                 ))}
                             </select>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Message</label>
                             <textarea 
                                value={announcementMsg}
                                onChange={(e) => setAnnouncementMsg(e.target.value)}
                                rows={5}
                                className={inputClass}
                                placeholder="Type your announcement here..."
                             />
                         </div>

                         <button 
                            type="submit"
                            disabled={isPosting || !announcementMsg.trim()}
                            className="w-full py-3 rounded-xl bg-navy-600 text-white font-bold text-sm shadow-neu-flat dark:shadow-none hover:bg-navy-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                         >
                             {isPosting ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                             Post Announcement
                         </button>
                     </form>
                </div>
            </div>
        )}
      </div>

      {/* Stats Modal */}
      {viewingStatsFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm" onClick={() => setViewingStatsFor(null)}>
              <div className="bg-[#e6e9ef] dark:bg-[#1e212b] rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark w-full max-w-2xl p-6 relative max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-black text-navy-900 dark:text-navy-50">Read Status</h3>
                      <button onClick={() => setViewingStatsFor(null)} className="p-1 rounded-full hover:bg-navy-200 dark:hover:bg-navy-700"><X size={20} /></button>
                  </div>
                  
                  <div className="text-sm text-navy-600 dark:text-navy-300 mb-4 p-3 bg-navy-100 dark:bg-navy-800 rounded-xl">
                      "{viewingStatsFor.message}"
                  </div>

                  <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                      {/* Read List */}
                      <div className="flex flex-col h-full overflow-hidden">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                              <CheckCheck size={14} /> Read by ({(viewingStatsFor.readBy || []).length})
                          </h4>
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-white/50 dark:bg-black/20 rounded-xl p-2">
                              {students.filter(s => (viewingStatsFor.readBy || []).includes(s.id)).length === 0 ? (
                                  <p className="text-xs text-navy-400 italic">No one has read this yet.</p>
                              ) : (
                                  students.filter(s => (viewingStatsFor.readBy || []).includes(s.id)).map(s => (
                                      <div key={s.id} className="text-sm py-1 border-b border-navy-100 dark:border-navy-700 last:border-0 text-navy-800 dark:text-navy-100">
                                          {s.name} <span className="text-[10px] text-navy-400">({s.rollNo})</span>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>

                      {/* Not Read List */}
                      <div className="flex flex-col h-full overflow-hidden">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-maroon-700 dark:text-maroon-400 mb-2 flex items-center gap-2">
                              <Clock size={14} /> Not Read by
                          </h4>
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-white/50 dark:bg-black/20 rounded-xl p-2">
                               {(() => {
                                   const targetStudents = viewingStatsFor.audience === 'all' 
                                      ? students 
                                      : students.filter(s => s.id === viewingStatsFor.audience);
                                   
                                   const unread = targetStudents.filter(s => !(viewingStatsFor.readBy || []).includes(s.id));
                                   
                                   if (unread.length === 0) return <p className="text-xs text-green-600 italic">Everyone has read this!</p>;

                                   return unread.map(s => (
                                      <div key={s.id} className="text-sm py-1 border-b border-navy-100 dark:border-navy-700 last:border-0 text-navy-800 dark:text-navy-100">
                                          {s.name} <span className="text-[10px] text-navy-400">({s.rollNo})</span>
                                      </div>
                                  ));
                               })()}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Student Modal (Existing) */}
      {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
              <div className="bg-[#e6e9ef] dark:bg-[#1e212b] rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark w-full max-w-md p-6 relative">
                  <button onClick={() => setIsStudentModalOpen(false)} className="absolute top-4 right-4 text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 transition-colors"><X size={20} /></button>
                  <h3 className="text-xl font-black text-navy-900 dark:text-navy-50 mb-6">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                  <form onSubmit={handleStudentFormSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                          <input type="text" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className={inputClass} placeholder="e.g. John Doe" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Roll Number</label>
                          <input type="text" value={studentForm.rollNo} onChange={(e) => setStudentForm({...studentForm, rollNo: e.target.value})} className={inputClass} placeholder="e.g. 12345" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">{editingStudent ? 'New Password (Optional)' : 'Password'}</label>
                          <input type="text" value={studentForm.password} onChange={(e) => setStudentForm({...studentForm, password: e.target.value})} className={inputClass} placeholder={editingStudent ? "Leave blank to keep current" : "••••••••"} />
                      </div>
                      {studentFormMsg && <div className="p-3 rounded-xl bg-maroon-50 dark:bg-maroon-900/20 text-maroon-600 dark:text-maroon-300 text-xs font-bold text-center border border-maroon-100 dark:border-maroon-800">{studentFormMsg}</div>}
                      <button type="submit" disabled={isProcessingStudent} className="w-full mt-2 py-3 rounded-xl bg-navy-600 text-white font-bold text-sm shadow-neu-flat dark:shadow-none hover:bg-navy-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">{isProcessingStudent ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} {editingStudent ? 'Save Changes' : 'Create Student'}</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
