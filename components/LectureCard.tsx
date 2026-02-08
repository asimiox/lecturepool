
import React, { useState } from 'react';
import { Lecture, Attachment } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, User, XCircle, Download, Maximize2, FileText, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';

interface LectureCardProps {
  lecture: Lecture;
  isAdminView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onDelete?: (id: string) => void; // New prop for deleting approved lectures
  showAdminActions?: boolean;
}

export const LectureCard: React.FC<LectureCardProps> = ({ 
  lecture, 
  isAdminView = false, 
  onApprove, 
  onReject,
  onDelete,
  showAdminActions = false
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Extract images and files separately
  const images = lecture.attachments.filter(a => a.type === 'image');
  const files = lecture.attachments.filter(a => a.type === 'file');
  const coverImage = images.length > 0 ? images[0].url : null;
  const moreImagesCount = images.length > 1 ? images.length - 1 : 0;

  const handleReject = () => {
    if (onReject && rejectReason.trim()) {
      onReject(lecture.id, rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("Are you sure you want to delete this lecture permanently?")) {
        onDelete(lecture.id);
    }
  };

  // HELPER: Transform Cloudinary URL to force download
  // This adds 'fl_attachment' to the transformation part of the URL.
  // This tells the browser to treat it as a download (Content-Disposition: attachment).
  const getDownloadUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  return (
    <div className="group h-full flex flex-col rounded-2xl p-4 transition-all duration-300 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:transform hover:-translate-y-1 relative">
      
      {/* Admin Delete Button (Top Right absolute) - Visible for approved lectures if onDelete provided */}
      {isAdminView && onDelete && !showAdminActions && (
          <button 
             onClick={(e) => { e.stopPropagation(); handleDelete(); }}
             className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-maroon-100 text-maroon-600 hover:bg-maroon-600 hover:text-white transition-colors shadow-sm"
             title="Delete Lecture"
          >
             <Trash2 size={16} />
          </button>
      )}

      {/* Image Section - Skeuomorphic Inset */}
      {coverImage ? (
          <div 
            className="relative h-48 rounded-xl overflow-hidden cursor-pointer shadow-neu-pressed dark:shadow-neu-pressed-dark p-1 bg-transparent"
            onClick={() => { setActiveImageIndex(0); setIsImageExpanded(true); }}
          >
            <img 
              src={coverImage} 
              alt={lecture.topic} 
              className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
            
            <div className="absolute top-3 left-3 flex gap-2">
               <StatusBadge status={lecture.status} />
            </div>

            {moreImagesCount > 0 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                    +{moreImagesCount} Photos
                </div>
            )}
            
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-navy-900/60 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                 <Maximize2 size={10} /> View
            </div>
          </div>
      ) : (
          /* Placeholder for No Image (Only Docs) */
          <div className="h-48 rounded-xl flex flex-col items-center justify-center bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark text-navy-400">
               <FileText size={48} className="mb-2 opacity-50" />
               <span className="text-xs font-bold uppercase tracking-wider">Documents Only</span>
               <div className="mt-4"> <StatusBadge status={lecture.status} /> </div>
          </div>
      )}

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
        
        {/* Document Attachments List */}
        {files.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
                {files.map((file) => (
                    // Using <a> tag with target="_blank" and modified URL is best for Android downloads
                    // Added 'download' attribute as a fallback signal for the browser
                    <a
                        key={file.id}
                        href={getDownloadUrl(file.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.name}
                        className="flex items-center justify-between px-3 py-3 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors group/file active:scale-95 transform"
                        title={`Download ${file.name}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={16} className="flex-shrink-0 text-navy-500" />
                            <span className="truncate">{file.name}</span>
                        </div>
                        <Download size={16} className="text-navy-400 group-hover/file:text-navy-800 dark:group-hover/file:text-navy-100" />
                    </a>
                ))}
            </div>
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

        {/* Admin Actions (Pending Queue) */}
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

      {/* Image Gallery Modal */}
      {isImageExpanded && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-navy-900/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={images[activeImageIndex].url} 
                alt={lecture.topic} 
                className="max-h-[80vh] max-w-full rounded-xl shadow-2xl border-2 border-navy-800"
              />
              
              {/* Navigation for multiple images */}
              {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto p-2 w-full justify-center">
                      {images.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-maroon-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          >
                              <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                          </button>
                      ))}
                  </div>
              )}
              
              <div className="mt-6 flex gap-4">
                  <a 
                      href={getDownloadUrl(images[activeImageIndex].url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-6 py-2 rounded-xl bg-maroon-600 text-white font-bold shadow-lg hover:bg-maroon-500 transition-colors flex items-center gap-2"
                  >
                      <Download size={18} /> Download Image
                  </a>
              </div>

              <button 
                className="absolute -top-10 right-0 text-white hover:text-maroon-400 transition-colors"
                onClick={() => setIsImageExpanded(false)}
              >
                <XCircle size={32} />
              </button>
          </div>
        </div>
      )}
    </div>
  );
};
