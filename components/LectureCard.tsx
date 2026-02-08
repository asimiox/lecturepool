
import React, { useState } from 'react';
import { Lecture, Attachment } from '../types';
import { StatusBadge } from './StatusBadge';
import { toggleLikeLecture } from '../services/storageService';
import { Calendar, User, XCircle, Download, Maximize2, FileText, Image as ImageIcon, Trash2, Heart, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LectureCardProps {
  lecture: Lecture;
  isAdminView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onDelete?: (id: string) => void; 
  showAdminActions?: boolean;
  currentUserId?: string; 
  currentUserName?: string; 
}

export const LectureCard: React.FC<LectureCardProps> = ({ 
  lecture, 
  isAdminView = false, 
  onApprove, 
  onReject,
  onDelete,
  showAdminActions = false,
  currentUserId,
  currentUserName
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // SAFEGUARDS: Ensure arrays exist before filtering
  const safeAttachments = Array.isArray(lecture.attachments) ? lecture.attachments : [];
  
  const images = safeAttachments.filter(a => a.type === 'image');
  const files = safeAttachments.filter(a => a.type === 'file');
  
  // Backward compatibility for old `imageURL`
  let displayImages = [...images];
  if (displayImages.length === 0 && lecture.imageURL) {
      displayImages.push({
          id: 'legacy-image',
          url: lecture.imageURL,
          name: 'Cover Image',
          type: 'image',
          mimeType: 'image/jpeg'
      });
  }

  const coverImage = displayImages.length > 0 ? displayImages[0].url : null;
  const moreImagesCount = displayImages.length > 1 ? displayImages.length - 1 : 0;

  // SAFEGUARDS: Ensure likes exist
  const likes = Array.isArray(lecture.likes) ? lecture.likes : [];
  const likedBy = Array.isArray(lecture.likedBy) ? lecture.likedBy : [];
  const isLiked = currentUserId ? likes.includes(currentUserId) : false;
  const likeCount = likes.length;

  const isQueen = lecture.rollNo === '56';

  const handleLike = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUserId || !currentUserName) return;

      if (!isLiked) {
           const rect = (e.target as HTMLElement).getBoundingClientRect();
           try {
             confetti({
                 particleCount: 15,
                 spread: 30,
                 origin: {
                     x: (rect.left + rect.width / 2) / window.innerWidth,
                     y: (rect.top + rect.height / 2) / window.innerHeight
                 },
                 colors: ['#e11d48', '#ffffff'],
                 disableForReducedMotion: true
             });
           } catch (err) {
             // Ignore confetti errors
           }
      }
      
      await toggleLikeLecture(lecture.id, { id: currentUserId, name: currentUserName });
  };

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

  const getDownloadUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
  };

  const getSocialProof = () => {
      if (likeCount === 0) return "Be the first to like this!";
      const otherCount = likeCount - 1;
      
      if (isLiked) {
          if (likeCount === 1) return "Liked by You";
          return `Liked by You and ${otherCount} others`;
      }
      
      const firstName = likedBy.length > 0 ? likedBy[0].name.split(' ')[0] : 'Someone';
      if (likeCount === 1) return `Liked by ${firstName}`;
      return `Liked by ${firstName} and ${otherCount} others`;
  };

  return (
    <div className={`group h-full flex flex-col rounded-2xl p-4 transition-all duration-300 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:transform hover:-translate-y-1 relative ${isQueen ? 'border border-yellow-400/30 dark:border-yellow-600/30' : ''}`}>
      
      {isAdminView && onDelete && !showAdminActions && (
          <button 
             onClick={(e) => { e.stopPropagation(); handleDelete(); }}
             className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-maroon-100 text-maroon-600 hover:bg-maroon-600 hover:text-white transition-colors shadow-sm"
             title="Delete Lecture"
          >
             <Trash2 size={16} />
          </button>
      )}

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

            {lecture.status === 'approved' && !isAdminView && (
                <div className="absolute top-3 right-3">
                    <button
                        onClick={handleLike}
                        className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-95 shadow-sm ${isLiked ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-600 hover:text-rose-500'}`}
                        title={getSocialProof()}
                    >
                        <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                    </button>
                </div>
            )}

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
          <div className="h-48 rounded-xl flex flex-col items-center justify-center bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark text-navy-400 relative">
               <FileText size={48} className="mb-2 opacity-50" />
               <span className="text-xs font-bold uppercase tracking-wider">Documents Only</span>
               <div className="mt-4"> <StatusBadge status={lecture.status} /> </div>
               
               {lecture.status === 'approved' && !isAdminView && (
                <div className="absolute top-3 right-3">
                    <button
                        onClick={handleLike}
                        className={`p-2 rounded-full transition-all active:scale-95 shadow-sm ${isLiked ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-navy-100 text-gray-400 hover:text-rose-500'}`}
                        title={getSocialProof()}
                    >
                        <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                    </button>
                </div>
            )}
          </div>
      )}

      <div className="pt-5 pb-2 px-2 flex-1 flex flex-col">
        <div className="mb-3">
             <div className="flex justify-between items-start">
                 <span className="text-[10px] font-black uppercase tracking-widest text-maroon-600 dark:text-maroon-400 mb-1 block">
                  {lecture.subject}
                </span>
                {likeCount > 0 && (
                    <span className="text-[10px] font-bold text-navy-400 flex items-center gap-1" title={likedBy.map(u => u.name).join(', ')}>
                         <Heart size={10} className="fill-rose-400 text-rose-400" /> {likeCount}
                    </span>
                )}
            </div>
            <h3 className="text-xl font-bold text-navy-900 dark:text-navy-50 leading-tight">
              {lecture.topic}
            </h3>
        </div>

        {lecture.description && (
          <p className="text-sm text-navy-600 dark:text-navy-300 line-clamp-2 mb-4 font-medium">
            {lecture.description}
          </p>
        )}
        
        {files.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
                {files.map((file) => (
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
            <div className={`p-1.5 rounded-full shadow-neu-flat dark:shadow-neu-flat-dark ${isQueen ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-[#e6e9ef] dark:bg-[#1e212b]'}`}>
               {isQueen ? <Crown size={14} className="text-yellow-600 dark:text-yellow-400" /> : <User size={14} className="text-navy-500 dark:text-navy-400" />}
            </div>
            <div className="flex flex-col">
                <span className={`text-xs font-bold flex items-center gap-1 ${isQueen ? 'text-yellow-700 dark:text-yellow-400' : 'text-navy-800 dark:text-navy-100'}`}>
                    {lecture.studentName}
                    {isQueen && <span className="text-[8px] bg-yellow-400 text-yellow-900 px-1 rounded-sm uppercase tracking-widest">Elite</span>}
                </span>
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

        {lecture.status === 'rejected' && lecture.adminRemark && (
          <div className="mt-4 p-3 rounded-xl text-xs text-maroon-800 dark:text-maroon-200 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-l-4 border-maroon-600">
            <span className="font-bold block mb-1 uppercase tracking-wider">Admin Remark</span>
            {lecture.adminRemark}
          </div>
        )}

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

      {isImageExpanded && displayImages.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-navy-900/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={displayImages[activeImageIndex].url} 
                alt={lecture.topic} 
                className="max-h-[80vh] max-w-full rounded-xl shadow-2xl border-2 border-navy-800"
              />
              
              {displayImages.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto p-2 w-full justify-center">
                      {displayImages.map((img, idx) => (
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
                      href={getDownloadUrl(displayImages[activeImageIndex].url)}
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
