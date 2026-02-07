
import React, { useState, useEffect } from 'react';
import { Lecture, User } from '../types';
import { getLectures, updateLectureStatus, getUsers, updateUserStatus, getSubjects, addSubject, updateSubject, deleteSubject, resetSubjects } from '../services/storageService';
import { LectureCard } from '../components/LectureCard';
import { RefreshCw, BarChart2, CheckCircle, Clock, Users, Layers, Search, UserPlus, XCircle, Check, Book, Plus, Edit2, Trash2, Save, X, RotateCcw } from 'lucide-react';

type AdminTab = 'queue' | 'all_lectures' | 'students' | 'subjects';

export const AdminDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pendingLectures, setPendingLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  
  // Subject Management States
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [subjectMsg, setSubjectMsg] = useState('');
  
  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [lectureSearch, setLectureSearch] = useState('');

  const loadData = () => {
    const allData = getLectures();
    const allUsers = getUsers();
    const allSubjects = getSubjects();
    
    setLectures(allData);
    setSubjects(allSubjects);
    
    // Split users
    const allStudents = allUsers.filter(u => u.role === 'student');
    const activeStudents = allStudents.filter(u => u.status !== 'pending' && u.status !== 'rejected');
    const pendingAccs = allStudents.filter(u => u.status === 'pending');
    
    setStudents(activeStudents);
    setPendingUsers(pendingAccs);

    const pending = allData
      .filter(l => l.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp); // Oldest first for review
    setPendingLectures(pending);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = (id: string) => {
    updateLectureStatus(id, 'approved');
    loadData(); // Refresh list
  };

  const handleReject = (id: string, reason: string) => {
    updateLectureStatus(id, 'rejected', reason);
    loadData(); // Refresh list
  };
  
  const handleUserApprove = (id: string) => {
    updateUserStatus(id, 'active');
    loadData();
  };
  
  const handleUserReject = (id: string) => {
    updateUserStatus(id, 'rejected');
    loadData();
  };

  // --- Subject Handlers ---
  const handleAddSubject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubject.trim()) return;
      
      const res = addSubject(newSubject.trim());
      if (res.success) {
          setNewSubject('');
          loadData();
          setSubjectMsg('');
      } else {
          setSubjectMsg(res.message);
      }
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

  const saveEditSubject = () => {
      if (!editSubjectName.trim() || !editingSubject) return;
      
      const res = updateSubject(editingSubject, editSubjectName.trim());
      if (res.success) {
          setEditingSubject(null);
          loadData();
      } else {
          setSubjectMsg(res.message);
      }
  };

  const handleDeleteSubject = (subject: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Removed window.confirm as it can be problematic on some mobile contexts
      // and we want immediate feedback for the user.
      deleteSubject(subject);
      loadData();
  };

  const handleResetSubjects = () => {
      if (window.confirm("This will reset the subject list to the system defaults. Custom subjects will be removed. Continue?")) {
          resetSubjects();
          loadData();
      }
  };

  // Stats calculation
  const totalUploads = lectures.length;
  const approvedCount = lectures.filter(l => l.status === 'approved').length;
  const approvalRate = totalUploads > 0 ? Math.round((approvedCount / totalUploads) * 100) : 0;

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

  const StatCard = ({ icon: Icon, label, value, colorClass, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all ring-2 ring-transparent hover:ring-navy-200 dark:hover:ring-navy-700' : ''}`}
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
      
      {/* Analytics Section - With Direct Link to Subjects */}
      <div>
        <h3 className="text-lg font-bold text-navy-900 dark:text-navy-50 mb-6 flex items-center gap-2">
            <BarChart2 size={20} /> Dashboard Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={CheckCircle} label="Total Uploads" value={totalUploads} colorClass="bg-navy-600" onClick={() => setActiveTab('all_lectures')} />
            <StatCard icon={Clock} label="Pending Review" value={pendingLectures.length} colorClass="bg-maroon-600" onClick={() => setActiveTab('queue')} />
            {/* New Stat Card for Subjects acts as a big button */}
            <StatCard icon={Book} label="Active Subjects" value={subjects.length} colorClass="bg-indigo-600" onClick={() => setActiveTab('subjects')} />
            <StatCard icon={Users} label="Total Students" value={students.length} colorClass="bg-purple-600" onClick={() => setActiveTab('students')} />
        </div>
      </div>

      <div className="border-t border-navy-200 dark:border-navy-800 my-8"></div>

      {/* Control Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Tabs - Wrapped for better mobile/desktop visibility */}
        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark self-start w-full xl:w-auto">
             <button
               onClick={() => setActiveTab('queue')}
               className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-grow xl:flex-grow-0 justify-center ${
                 activeTab === 'queue'
                  ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-maroon-600 dark:text-maroon-400' 
                  : 'text-navy-400 hover:text-navy-600'
               }`}
             >
               <Clock size={14} /> Queue
               {pendingLectures.length > 0 && (
                 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-maroon-500 text-white text-[10px]">{pendingLectures.length}</span>
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
               {pendingUsers.length > 0 && (
                 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-navy-500 text-white text-[10px]">{pendingUsers.length}</span>
               )}
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
        </div>

        <button 
          onClick={loadData}
          className="p-3 rounded-full bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark text-navy-600 dark:text-navy-300 transition-all self-end xl:self-auto hidden xl:block"
        >
          <RefreshCw size={18} />
        </button>
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
                    // Admin can see actions for pending even in this view, effectively
                    showAdminActions={lecture.status === 'pending'}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'students' && (
          <>
            {/* New User Requests Section */}
            {pendingUsers.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-xl font-black text-maroon-600 dark:text-maroon-400 mb-6 flex items-center gap-2">
                       <UserPlus size={20} /> New Account Requests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="p-4 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark flex flex-col gap-3">
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
                                    <button 
                                        onClick={() => handleUserApprove(user.id)}
                                        className="flex-1 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Check size={14} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleUserReject(user.id)}
                                        className="flex-1 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-b border-navy-200 dark:border-navy-800 my-8"></div>
                </div>
            )}

            {/* Active Students List */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-navy-900 dark:text-navy-50">Registered Students</h2>
                <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-navy-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search name or roll no..." 
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className={searchInputClass}
                    />
                </div>
            </div>

            {students.length === 0 ? (
                <div className="text-center py-24 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
                  <p className="text-navy-400">No active students found.</p>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-navy-400">No students found matching your search.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark">
                    <table className="min-w-full bg-[#e6e9ef] dark:bg-[#1e212b]">
                        <thead className="bg-navy-100 dark:bg-navy-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-navy-600 dark:text-navy-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-200 dark:divide-navy-800">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-navy-900 dark:text-navy-100 font-mono">
                                        {student.rollNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-700 dark:text-navy-200">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </>
        )}

        {activeTab === 'subjects' && (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* List Subjects */}
                    <div>
                         <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-navy-900 dark:text-navy-50">Manage Subjects</h2>
                            <button 
                                onClick={handleResetSubjects}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-navy-200 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-300 dark:hover:bg-navy-700 transition-colors"
                            >
                                <RotateCcw size={12} /> Reset to Default
                            </button>
                         </div>
                         
                         <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                             {subjects.map((subject) => {
                                 const count = lectures.filter(l => l.subject === subject).length;
                                 return (
                                     <div key={subject} className="flex items-center justify-between p-4 rounded-2xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all group">
                                         {editingSubject === subject ? (
                                             <div className="flex items-center gap-2 w-full">
                                                 <input 
                                                    type="text" 
                                                    value={editSubjectName}
                                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                                    className="flex-1 bg-white dark:bg-navy-800 px-3 py-1.5 rounded-lg text-sm border border-navy-300 dark:border-navy-600 outline-none"
                                                    autoFocus
                                                 />
                                                 <button onClick={saveEditSubject} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"><Save size={16} /></button>
                                                 <button onClick={cancelEditSubject} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><X size={16} /></button>
                                             </div>
                                         ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-navy-400"></div>
                                                    <div>
                                                        <span className="font-bold text-navy-800 dark:text-navy-100 mr-2">{subject}</span>
                                                        <span className="text-[10px] text-navy-400 dark:text-navy-500 font-medium">({count} lectures)</span>
                                                    </div>
                                                </div>
                                                {/* Action Buttons - Added z-10 and relative to ensure they catch clicks above the parent hover state */}
                                                <div className="flex gap-2 relative z-10">
                                                    <button onClick={() => startEditSubject(subject)} className="p-2 text-navy-500 hover:text-navy-800 dark:hover:text-navy-200 transition-colors cursor-pointer" title="Rename"><Edit2 size={16} className="pointer-events-none" /></button>
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => handleDeleteSubject(subject, e)} 
                                                        className="p-2 text-maroon-500 hover:text-maroon-700 transition-colors cursor-pointer" 
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} className="pointer-events-none" />
                                                    </button>
                                                </div>
                                            </>
                                         )}
                                     </div>
                                 );
                             })}
                         </div>
                    </div>

                    {/* Add New Subject */}
                    <div className="h-fit p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark sticky top-24">
                         <h3 className="text-lg font-bold text-navy-900 dark:text-navy-50 mb-4 flex items-center gap-2">
                             <Plus size={20} className="text-maroon-600" /> Add New Subject
                         </h3>
                         <p className="text-xs text-navy-500 dark:text-navy-400 mb-6 leading-relaxed">
                            Subjects added here will immediately appear in the dropdown menu for students when they upload new lectures.
                         </p>
                         <form onSubmit={handleAddSubject}>
                             <label className="block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1">Subject Name</label>
                             <input 
                                type="text" 
                                value={newSubject}
                                onChange={(e) => { setNewSubject(e.target.value); setSubjectMsg(''); }}
                                className={inputClass}
                                placeholder="e.g. Data Structures"
                             />
                             {subjectMsg && (
                                 <p className={`text-xs mt-2 font-bold ${subjectMsg.includes('success') ? 'text-green-600' : 'text-maroon-600'}`}>{subjectMsg}</p>
                             )}
                             <button 
                                type="submit"
                                disabled={!newSubject.trim()}
                                className="w-full mt-6 py-3 rounded-xl bg-navy-600 text-white font-bold text-sm shadow-neu-flat dark:shadow-none hover:bg-navy-700 transition-all disabled:opacity-50"
                             >
                                 Add Subject
                             </button>
                         </form>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
