
import React, { useState } from 'react';
import { Lecture } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, User, XCircle, Download, Maximize2 } from 'lucide-react';

interface LectureCardProps {
  lecture: Lecture;
  isAdminView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  showAdminActions?: boolean;
}

export const LectureCard: React.FC<LectureCardProps> = ({ 
  lecture, 
  isAdminView = false, 
  onApprove, 
  onReject,
  showAdminActions = false
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleReject = () => {
    if (onReject && rejectReason.trim()) {
      onReject(lecture.id, rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      // Fetch the image as a blob to force download behavior even for cross-origin URLs
      const response = await fetch(lecture.imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      // Sanitize filename
      const safeSubject = lecture.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safeTopic = lecture.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeSubject}_${safeTopic}_${lecture.rollNo}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed, falling back to open", error);
      // Fallback: Just open it in a new tab if fetch fails (CORS etc)
      window.open(lecture.imageURL, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageExpanded(true);
  };

  return (
    <div className="group h-full flex flex-col rounded-2xl p-4 transition-all duration-300 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:transform hover:-translate-y-1">
      
      {/* Image Section - Skeuomorphic Inset */}
      <div 
        className="relative h-48 rounded-xl overflow-hidden cursor-pointer shadow-neu-pressed dark:shadow-neu-pressed-dark p-1 bg-transparent"
        onClick={() => setIsImageExpanded(true)}
      >
        <img 
          src={lecture.imageURL} 
          alt={lecture.topic} 
          className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex gap-2">
           <StatusBadge status={lecture.status} />
        </div>
        
        {/* View Button (Always visible on mobile, or bottom left) */}
        <button
           onClick={handleView}
           className="absolute bottom-3 left-3 p-2 rounded-lg bg-navy-900/80 text-white backdrop-blur-sm hover:bg-navy-700 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
           title="View Fullscreen"
        >
           <Maximize2 size={14} /> View
        </button>

        {/* Download Button (Only for approved or admin view) */}
        {(lecture.status === 'approved' || isAdminView) && (
          <div className="absolute bottom-3 right-3">
             <button
               onClick={handleDownload}
               disabled={isDownloading}
               className={`p-2 rounded-lg bg-navy-900/80 text-white backdrop-blur-sm hover:bg-maroon-600 transition-colors shadow-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
               title="Download Image"
             >
               <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
             </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-5 pb-2 px-2 flex-1 flex flex-col">
        <div className="mb-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-maroon-600 dark:text-maroon-400 mb-1 block">
              {lecture.subject}
            </span>
            <h3 className="text-xl font-bold text-navy-900 dark:text-navy-50 leading-tight">
              {lecture.topic}
            </h3>
        </div>

        {lecture.description && (
          <p className="text-sm text-navy-600 dark:text-navy-300 line-clamp-2 mb-4 font-medium">
            {lecture.description}
          </p>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-transparent">
            <div className="p-1.5 rounded-full shadow-neu-flat dark:shadow-neu-flat-dark bg-[#e6e9ef] dark:bg-[#1e212b]">
               <User size={14} className="text-navy-500 dark:text-navy-400" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-navy-800 dark:text-navy-100">{lecture.studentName}</span>
                <span className="text-[10px] text-navy-400 dark:text-navy-500 font-mono">{lecture.rollNo}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="p-1.5 rounded-full shadow-neu-flat dark:shadow-neu-flat-dark bg-[#e6e9ef] dark:bg-[#1e212b]">
                <Calendar size={14} className="text-navy-500 dark:text-navy-400" />
            </div>
            <span className="text-xs font-medium text-navy-600 dark:text-navy-300">{lecture.date}</span>
          </div>
        </div>

        {/* Rejection Reason */}
        {lecture.status === 'rejected' && lecture.adminRemark && (
          <div className="mt-4 p-3 rounded-xl text-xs text-maroon-800 dark:text-maroon-200 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-l-4 border-maroon-600">
            <span className="font-bold block mb-1 uppercase tracking-wider">Admin Remark</span>
            {lecture.adminRemark}
          </div>
        )}

        {/* Admin Actions */}
        {showAdminActions && lecture.status === 'pending' && (
          <div className="mt-5 pt-4 border-t border-navy-100 dark:border-navy-800 flex gap-3">
             {!isRejecting ? (
               <>
                <button
                  onClick={() => onApprove && onApprove(lecture.id)}
                  className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200 text-green-700 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark active:translate-y-0.5"
                >
                  Approve
                </button>
                <button
                  onClick={() => setIsRejecting(true)}
                  className="flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all duration-200 text-maroon-700 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark active:translate-y-0.5"
                >
                  Reject
                </button>
               </>
             ) : (
               <div className="w-full space-y-3">
                 <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason..."
                    className="w-full text-sm rounded-lg px-3 py-2 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark text-navy-800 dark:text-navy-100 focus:outline-none focus:ring-1 focus:ring-maroon-500 placeholder-navy-300"
                    autoFocus
                 />
                 <div className="flex gap-3">
                   <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-maroon-50 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed active:scale-95 disabled:opacity-50"
                    style={{color: '#800000'}}
                   >
                     Confirm
                   </button>
                   <button
                    onClick={() => setIsRejecting(false)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold text-navy-500 hover:text-navy-700"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {isImageExpanded && (
        <div 
          className="fixed inset-0 z-[100] bg-navy-900/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsImageExpanded(false)}
        >
          <img 
            src={lecture.imageURL} 
            alt={lecture.topic} 
            className="max-w-full max-h-screen rounded-2xl shadow-2xl border-4 border-navy-800"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-6 right-6 text-white hover:text-maroon-400 transition-colors">
            <XCircle size={40} />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
             <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-6 py-2 rounded-xl bg-maroon-600 text-white font-bold shadow-lg hover:bg-maroon-500 transition-colors flex items-center gap-2"
             >
                <Download size={18} className={isDownloading ? 'animate-bounce' : ''} /> 
                {isDownloading ? 'Downloading...' : 'Download'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
