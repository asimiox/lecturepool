
import React, { useState, useRef, useEffect } from 'react';
import { Screen, LectureStatus, User } from '../types';
import { addLecture, subscribeToSubjects } from '../services/storageService';
import { Upload, AlertCircle, FileText, Image as ImageIcon, X, Paperclip } from 'lucide-react';

interface UploadScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
}

interface FilePreview {
  file: File;
  previewUrl: string | null;
  type: 'image' | 'file';
}

const MAX_TOTAL_SIZE_MB = 10;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

export const UploadScreen: React.FC<UploadScreenProps> = ({ onNavigate, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSubjects((list) => {
        setSubjects(list);
        if (list.length > 0 && !formData.subject) {
            setFormData(prev => ({ ...prev, subject: list[0] }));
        }
    });
    return () => unsub();
  }, [formData.subject]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      processFiles(newFiles);
    }
  };

  const processFiles = (files: File[]) => {
    setError('');
    
    // Calculate current total size
    const currentSize = selectedFiles.reduce((acc, f) => acc + f.file.size, 0);
    const newSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentSize + newSize > MAX_TOTAL_SIZE_BYTES) {
        setError(`Total file size exceeds ${MAX_TOTAL_SIZE_MB}MB limit. Please remove some files.`);
        return;
    }

    const newPreviews: FilePreview[] = files.map(file => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        type: file.type.startsWith('image/') ? 'image' : 'file'
    }));

    setSelectedFiles(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
        const newFiles = [...prev];
        const removed = newFiles.splice(index, 1)[0];
        if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        return newFiles;
    });
    setError('');
  };

  // Convert file to base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError("Please upload at least one file (Image, PDF, or Document).");
      return;
    }
    if (!formData.topic) {
        setError("Please enter a topic.");
        return;
    }
    if (!formData.subject) {
        setError("Please select a subject.");
        return;
    }

    setIsSubmitting(true);

    try {
      // Prepare files for service (convert to base64)
      const rawFiles = await Promise.all(selectedFiles.map(async (fp) => ({
          data: await fileToBase64(fp.file),
          name: fp.file.name,
          type: fp.file.type
      })));

      await addLecture({
        studentId: currentUser.id,
        studentName: currentUser.name,
        rollNo: currentUser.rollNo,
        subject: formData.subject,
        topic: formData.topic,
        description: formData.description,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        status: 'pending' as LectureStatus,
        rawFiles: rawFiles
      });

      setIsSubmitting(false);
      onNavigate(Screen.MY_UPLOADS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload. Please try again.");
      setIsSubmitting(false);
    }
  };

  const currentTotalSizeMB = (selectedFiles.reduce((acc, f) => acc + f.file.size, 0) / (1024 * 1024)).toFixed(2);

  const inputClass = "w-full rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent focus:border-navy-500 focus:ring-0 text-navy-900 dark:text-navy-100 placeholder-navy-300 p-4 text-sm font-medium transition-all duration-200 outline-none";
  const labelClass = "block text-xs font-bold text-navy-700 dark:text-navy-300 uppercase tracking-wider mb-2 ml-1";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-navy-900 dark:text-navy-50">Upload Lecture</h2>
        <p className="text-navy-500 dark:text-navy-400 mt-2 font-medium">Posting as <span className="text-navy-900 dark:text-navy-100 font-bold">{currentUser.name}</span> ({currentUser.rollNo})</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-[#e6e9ef] dark:bg-[#1e212b] p-8 md:p-10 rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark">
        
        {/* Lecture Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>Subject</label>
            <div className="relative">
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="text"
              disabled
              value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              className={`${inputClass} opacity-60 cursor-not-allowed text-navy-500`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Lecture Topic</label>
          <input
            type="text"
            name="topic"
            required
            value={formData.topic}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="Title of the lecture"
          />
        </div>

         <div>
          <label className={labelClass}>Short Description (Optional)</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className={inputClass}
            placeholder="Brief summary..."
          />
        </div>

        {/* File Upload Section */}
        <div>
          <label className={labelClass}>Attachments (Max {MAX_TOTAL_SIZE_MB}MB Total)</label>
          <div 
            className={`mt-2 flex flex-col items-center justify-center px-6 py-8 rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed ${
               isSubmitting ? 'border-gray-300 opacity-50' : 'border-navy-200 dark:border-navy-700 hover:border-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800/50'
            }`}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
          >
             <div className="p-3 rounded-full bg-navy-100 dark:bg-navy-800 mb-3">
                 <Paperclip className="h-6 w-6 text-navy-600 dark:text-navy-300" />
             </div>
             <span className="text-sm font-bold text-navy-700 dark:text-navy-200">
                Click to add files
             </span>
             <p className="text-xs text-navy-400 mt-1">Images, PDF, Word, PPT</p>
             <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                multiple
                className="sr-only" 
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                   <div className="flex justify-between items-center px-1">
                       <span className="text-xs font-bold text-navy-500 uppercase">Selected Files</span>
                       <span className={`text-xs font-bold ${Number(currentTotalSizeMB) > MAX_TOTAL_SIZE_MB ? 'text-maroon-600' : 'text-green-600'}`}>
                           {currentTotalSizeMB} MB / {MAX_TOTAL_SIZE_MB} MB
                       </span>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                       {selectedFiles.map((item, index) => (
                           <div key={index} className="relative p-2 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-white dark:bg-navy-800 flex items-center justify-center overflow-hidden">
                                    {item.type === 'image' && item.previewUrl ? (
                                        <img src={item.previewUrl} className="h-full w-full object-cover" alt="preview" />
                                    ) : (
                                        <FileText size={20} className="text-navy-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-navy-800 dark:text-navy-100 truncate">{item.file.name}</p>
                                    <p className="text-[10px] text-navy-400">{(item.file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="p-1 rounded-full text-maroon-500 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                >
                                    <X size={14} />
                                </button>
                           </div>
                       ))}
                   </div>
              </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-maroon-50 p-4 border border-maroon-100 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-maroon-600" />
            <p className="text-sm font-medium text-maroon-800">{error}</p>
          </div>
        )}

        <div className="pt-6 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => onNavigate(Screen.HOME)}
            className="px-6 py-3 rounded-xl text-sm font-bold text-navy-600 dark:text-navy-300 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl text-sm font-bold text-white bg-navy-600 shadow-neu-flat dark:shadow-none hover:bg-navy-700 active:shadow-neu-pressed transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isSubmitting ? 'Uploading...' : <><Upload size={18} /> Submit Lecture</>}
          </button>
        </div>
      </form>
    </div>
  );
};
