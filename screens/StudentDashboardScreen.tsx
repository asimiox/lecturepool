
import React, { useState, useEffect } from 'react';
import { Screen, Lecture, User } from '../types';
import { subscribeToLectures, subscribeToSubjects } from '../services/storageService';
import { LectureCard } from '../components/LectureCard';
import { CheckCircle, Clock, XCircle, Search, Filter, Calendar, AlertTriangle } from 'lucide-react';

interface StudentDashboardScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ onNavigate, currentUser }) => {
  const [myLectures, setMyLectures] = useState<Lecture[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // Real-time listeners
    const unsubLectures = subscribeToLectures((allData) => {
        const userLectures = allData.filter(l => 
            l.studentId === currentUser.id || l.rollNo === currentUser.rollNo
        ).sort((a, b) => b.timestamp - a.timestamp);
        setMyLectures(userLectures);
    });

    const unsubSubjects = subscribeToSubjects((list) => {
        setSubjects(list);
    });

    return () => {
        unsubLectures();
        unsubSubjects();
    };
  }, [currentUser]);

  // Filtering Logic
  const filteredLectures = myLectures.filter(l => {
      const matchesSearch = l.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = subjectFilter === 'All' || l.subject === subjectFilter;
      const matchesDate = !dateFilter || l.date === dateFilter;
      return matchesSearch && matchesSubject && matchesDate;
  });

  const stats = {
      total: myLectures.length,
      approved: myLectures.filter(l => l.status === 'approved').length,
      pending: myLectures.filter(l => l.status === 'pending').length,
      rejected: myLectures.filter(l => l.status === 'rejected').length
  };
  
  // Daily Update Logic
  const today = new Date().toISOString().split('T')[0];
  const updatesToday = myLectures.filter(l => l.date === today && l.status !== 'pending');
  const approvedToday = updatesToday.filter(l => l.status === 'approved').length;
  const rejectedToday = updatesToday.filter(l => l.status === 'rejected').length;

  const inputClass = "w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent text-sm font-medium text-navy-800 dark:text-navy-100 placeholder-navy-400 outline-none transition-all";
  const selectClass = "w-full md:w-auto pl-10 pr-8 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark border-transparent text-sm font-bold text-navy-800 dark:text-navy-100 outline-none cursor-pointer appearance-none transition-all";

  return (
    <div className="space-y-8">
      
      {/* ALERTS SECTION - Shows if there are updates today */}
      {(approvedToday > 0 || rejectedToday > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {approvedToday > 0 && (
                   <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 flex items-center gap-3">
                       <div className="p-2 rounded-full bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200">
                           <CheckCircle size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-navy-900 dark:text-navy-50">Updates Available</h4>
                           <p className="text-xs text-navy-600 dark:text-navy-300">
                               <span className="font-bold">{approvedToday}</span> of your lectures were approved today.
                           </p>
                       </div>
                   </div>
               )}
               {rejectedToday > 0 && (
                   <div className="p-4 rounded-2xl bg-maroon-50 dark:bg-maroon-900/10 border border-maroon-200 dark:border-maroon-800 flex items-center gap-3">
                       <div className="p-2 rounded-full bg-maroon-100 dark:bg-maroon-800 text-maroon-600 dark:text-maroon-200">
                           <AlertTriangle size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-maroon-900 dark:text-maroon-50">Action Required</h4>
                           <p className="text-xs text-maroon-700 dark:text-maroon-300">
                               <span className="font-bold">{rejectedToday}</span> lectures were rejected today. Check remarks.
                           </p>
                       </div>
                   </div>
               )}
          </div>
      )}

      {/* Top Section: Stats & Action */}
      <div className="bg-[#e6e9ef] dark:bg-[#1e212b] p-8 rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark">
        <div className="md:flex md:items-end md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-navy-900 dark:text-navy-50 mb-2">My Uploads</h2>
            <p className="text-navy-500 dark:text-navy-400 text-sm font-medium">
              You have submitted <span className="font-bold text-navy-900 dark:text-navy-100">{stats.total}</span> lectures so far.
            </p>
            
            {/* Stats Summary */}
            <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100/50 border border-green-200 text-green-800 text-xs font-bold">
                    <CheckCircle size={14} /> {stats.approved} Approved
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100/50 border border-gray-200 text-gray-700 text-xs font-bold">
                    <Clock size={14} /> {stats.pending} Pending
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100/50 border border-red-200 text-red-800 text-xs font-bold">
                    <XCircle size={14} /> {stats.rejected} Rejected
                </div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
             <button
               onClick={() => onNavigate(Screen.UPLOAD)}
               className="w-full md:w-auto px-6 py-3 rounded-xl bg-navy-600 text-white text-sm font-bold shadow-neu-flat dark:shadow-none hover:bg-navy-700 hover:-translate-y-0.5 transition-all"
             >
               + New Upload
             </button>
          </div>
        </div>
      </div>

      {/* Filter Bar (Only show if there are lectures) */}
      {myLectures.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center pb-2">
            <h3 className="text-xl font-bold text-navy-900 dark:text-navy-50 hidden xl:block">Your Submissions</h3>
            
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                 {/* Search */}
                <div className="relative group flex-1 md:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-navy-500" />
                    </div>
                    <input 
                    type="text" 
                    placeholder="Search topic..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClass} pl-10 w-full md:w-64`}
                    />
                </div>

                {/* Subject Filter */}
                <div className="relative group flex-1 md:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter size={16} className="text-navy-500" />
                    </div>
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className={selectClass}
                    >
                        <option value="All">All Subjects</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                 {/* Date Filter */}
                <div className="relative group flex-1 md:flex-none">
                     <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-navy-500" />
                     </div>
                     <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className={`${inputClass} pl-10`}
                        placeholder="Select Date"
                     />
                </div>
                
                {(searchQuery || subjectFilter !== 'All' || dateFilter) && (
                     <button 
                        onClick={() => {setSearchQuery(''); setSubjectFilter('All'); setDateFilter('')}}
                        className="text-xs font-bold text-maroon-600 hover:text-maroon-800 self-center px-2"
                     >
                        Clear
                     </button>
                )}
            </div>
          </div>
      )}

      {/* Grid Content */}
      <div>
        {myLectures.length === 0 ? (
          <div className="text-center py-20 bg-[#e6e9ef] dark:bg-[#1e212b] rounded-3xl shadow-neu-pressed dark:shadow-neu-pressed-dark">
            <p className="text-navy-500 dark:text-navy-400 font-medium mb-4">You haven't uploaded any notes yet.</p>
            <button 
              onClick={() => onNavigate(Screen.UPLOAD)}
              className="text-maroon-600 dark:text-maroon-400 font-bold text-sm hover:underline uppercase tracking-wide"
            >
              Start Contributing
            </button>
          </div>
        ) : filteredLectures.length === 0 ? (
           <div className="text-center py-20 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b]">
              <p className="text-navy-500 dark:text-navy-400 font-medium">No uploads match your filters.</p>
              <button 
                onClick={() => {setSearchQuery(''); setSubjectFilter('All'); setDateFilter('')}}
                className="mt-2 text-maroon-600 dark:text-maroon-400 text-xs font-bold hover:underline"
              >
                Reset Filters
              </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLectures.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
