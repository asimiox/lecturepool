
import React, { useState, useEffect } from 'react';
import { User, Announcement } from '../types';
import { subscribeToAnnouncements, markAnnouncementAsRead } from '../services/storageService';
import { Megaphone, Calendar, Clock, CheckCheck } from 'lucide-react';

interface AnnouncementsScreenProps {
  currentUser: User;
}

export const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const unsub = subscribeToAnnouncements((list) => {
        // Filter: Show only if audience is 'all' OR matches current user ID
        const relevant = list.filter(a => a.audience === 'all' || a.audience === currentUser.id);
        setAnnouncements(relevant);

        // Mark unread ones as read
        relevant.forEach(ann => {
             const readBy = ann.readBy || []; // Handle legacy data without readBy
             if (!readBy.includes(currentUser.id)) {
                 markAnnouncementAsRead(ann.id, currentUser.id);
             }
        });
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <div className="space-y-8">
       <div className="mb-6">
          <h2 className="text-3xl font-black text-navy-900 dark:text-navy-50">Announcements</h2>
          <p className="text-navy-500 dark:text-navy-400 text-sm font-medium mt-1">
            Updates and notices from your faculty.
          </p>
       </div>

       {announcements.length === 0 ? (
           <div className="text-center py-24 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark">
              <Megaphone className="mx-auto h-16 w-16 text-navy-300 mb-4" />
              <p className="text-navy-400 font-medium">No announcements at the moment.</p>
           </div>
       ) : (
           <div className="grid gap-6">
               {announcements.map((ann) => {
                   const isToday = ann.date === new Date().toISOString().split('T')[0];
                   const isRead = (ann.readBy || []).includes(currentUser.id);
                   return (
                       <div key={ann.id} className={`p-6 rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark border-l-8 ${isToday ? 'border-maroon-500' : 'border-navy-500'} relative overflow-hidden group`}>
                           <div className="flex justify-between items-start mb-3 relative z-10">
                               <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isToday ? 'bg-maroon-100 text-maroon-800' : 'bg-navy-100 text-navy-800'}`}>
                                        {isToday ? 'New' : 'Notice'}
                                    </span>
                                    <span className="text-[10px] font-bold text-navy-400 flex items-center gap-1">
                                        <Calendar size={12} /> {ann.date}
                                    </span>
                               </div>
                               <div className="flex flex-col items-end">
                                   <span className="text-[10px] text-navy-300 font-mono">ID: {ann.id.slice(0,6)}</span>
                                   {isRead && (
                                       <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1">
                                           <CheckCheck size={12} /> Seen
                                       </span>
                                   )}
                               </div>
                           </div>
                           
                           <p className="text-lg font-medium text-navy-900 dark:text-navy-50 whitespace-pre-wrap relative z-10">
                               {ann.message}
                           </p>
                           
                           <div className="mt-4 pt-4 border-t border-navy-200 dark:border-navy-700/50 flex items-center gap-2 relative z-10">
                               <div className="h-6 w-6 rounded-full bg-navy-300 flex items-center justify-center text-white text-xs font-bold">
                                   {ann.createdBy.charAt(0)}
                               </div>
                               <span className="text-xs font-bold text-navy-500 dark:text-navy-400">Posted by {ann.createdBy}</span>
                           </div>

                           {/* Decorative Icon Background */}
                           <Megaphone className="absolute -bottom-4 -right-4 h-32 w-32 text-navy-200/50 dark:text-navy-800/30 transform -rotate-12 pointer-events-none" />
                       </div>
                   );
               })}
           </div>
       )}
    </div>
  );
};
