
import React, { useState, useEffect } from 'react';
import { Lecture } from '../types';
import { getLectures, getSubjects } from '../services/storageService';
import { LectureCard } from '../components/LectureCard';
import { Filter, Calendar, Search } from 'lucide-react';

export const ApprovedLecturesScreen: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load subjects
    setSubjects(getSubjects());
    
    // Only get APPROVED lectures
    const allData = getLectures();
    const approved = allData
      .filter(l => l.status === 'approved')
      .sort((a, b) => b.timestamp - a.timestamp);
    setLectures(approved);
  }, []);

  const filteredLectures = lectures.filter(l => {
    const matchesSubject = subjectFilter === 'All' || l.subject === subjectFilter;
    const matchesSearch = l.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || l.date === dateFilter;
    return matchesSubject && matchesSearch && matchesDate;
  });

  const selectClass = "w-full md:w-auto pl-10 pr-10 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark border-transparent focus:shadow-neu-pressed dark:focus:shadow-neu-pressed-dark text-sm font-bold text-navy-800 dark:text-navy-100 outline-none cursor-pointer appearance-none transition-all";
  const inputClass = "w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent text-sm font-medium text-navy-800 dark:text-navy-100 placeholder-navy-400 outline-none transition-all";

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-navy-900 dark:text-navy-50">All Class Lectures</h2>
          <p className="text-navy-500 dark:text-navy-400 text-sm font-medium mt-1">
            Browse notes uploaded by students from all classes.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Subject Filter */}
          <div className="relative group">
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
          <div className="relative group">
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

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-navy-500" />
             </div>
            <input 
              type="text" 
              placeholder="Search topic or student..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-10 w-full md:w-64`}
            />
          </div>
        </div>
      </div>

      {lectures.length === 0 ? (
        <div className="text-center py-24 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
          <p className="text-navy-400 font-medium">No verified notes in the archive yet.</p>
        </div>
      ) : filteredLectures.length === 0 ? (
         <div className="text-center py-20">
          <p className="text-navy-500 font-medium">No results match your criteria.</p>
          <button 
            onClick={() => {setSubjectFilter('All'); setSearchQuery(''); setDateFilter('')}}
            className="mt-3 text-maroon-600 font-bold text-sm hover:underline"
          >
            Clear Filters
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
  );
};
