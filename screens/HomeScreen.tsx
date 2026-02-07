
import React, { useEffect, useState } from 'react';
import { Screen, User, Lecture } from '../types';
import { getLectures } from '../services/storageService';
import { UploadCloud, Library, Clock, Calendar } from 'lucide-react';
import { LectureCard } from '../components/LectureCard';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, currentUser }) => {
  const [todaysLectures, setTodaysLectures] = useState<Lecture[]>([]);
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    // Get lectures for today
    const all = getLectures();
    const today = new Date().toISOString().split('T')[0];
    const todayLecs = all.filter(l => l.date === today && l.status === 'approved');
    setTodaysLectures(todayLecs);

    // Set Greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

  }, []);

  // Admin Dashboard Redirect usually handled in App.tsx, but if admin lands here, we show admin summary
  if (currentUser.role === 'admin') {
     return (
       <div className="text-center py-20">
         <h2 className="text-2xl font-bold text-navy-900 dark:text-navy-100">Welcome Faculty</h2>
         <p className="text-navy-500 mb-6">Please proceed to the dashboard.</p>
         <button onClick={() => onNavigate(Screen.HOME)} className="text-maroon-600 font-bold underline">Go to Dashboard</button>
       </div>
     )
  }

  return (
    <div className="space-y-12 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black text-navy-900 dark:text-navy-50">
             {greeting}, <span className="text-maroon-600">{currentUser.name.split(' ')[0]}</span>
           </h2>
           <p className="text-navy-500 dark:text-navy-300 font-medium mt-2">
             Here is what's happening in class today.
           </p>
        </div>
        <div className="px-5 py-2 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark flex items-center gap-2 text-sm font-bold text-navy-600 dark:text-navy-300">
           <Calendar size={16} className="text-maroon-500" />
           {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          onClick={() => onNavigate(Screen.UPLOAD)}
          className="group relative p-6 rounded-3xl text-left flex items-center gap-6 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all"
        >
          <div className="p-4 rounded-2xl bg-navy-600 text-white shadow-neu-flat dark:shadow-none">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
             <h3 className="text-xl font-bold text-navy-900 dark:text-navy-50">Upload Notes</h3>
             <p className="text-navy-500 dark:text-navy-400 text-xs font-medium">Share today's lecture</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate(Screen.MY_UPLOADS)}
          className="group relative p-6 rounded-3xl text-left flex items-center gap-6 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all"
        >
          <div className="p-4 rounded-2xl bg-maroon-600 text-white shadow-neu-flat dark:shadow-none">
            <Clock className="h-6 w-6" />
          </div>
          <div>
             <h3 className="text-xl font-bold text-navy-900 dark:text-navy-50">Check Status</h3>
             <p className="text-navy-500 dark:text-navy-400 text-xs font-medium">Track your submissions</p>
          </div>
        </button>
      </div>

      {/* Today's Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-navy-800 dark:text-navy-100 flex items-center gap-2">
                <span className="w-2 h-8 bg-maroon-500 rounded-full"></span>
                Today's Approved Lectures
            </h3>
            <button onClick={() => onNavigate(Screen.LIBRARY)} className="text-xs font-bold text-navy-500 hover:text-navy-800 uppercase tracking-wider">
                View All History &rarr;
            </button>
        </div>

        {todaysLectures.length === 0 ? (
            <div className="py-16 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark text-center">
                <p className="text-navy-400 font-medium">No approved lectures yet for today.</p>
                <p className="text-xs text-navy-300 mt-1">Be the first to upload!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {todaysLectures.map(lecture => (
                    <LectureCard key={lecture.id} lecture={lecture} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
