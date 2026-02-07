
import React, { useState, useRef, useEffect } from 'react';
import { Screen, Lecture, LectureStatus, User } from '../types';
import { addLecture, subscribeToSubjects } from '../services/storageService';
import { Camera, Upload, AlertCircle } from 'lucide-react';

interface UploadScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: User;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onNavigate, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    description: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSubjects((list) => {
        setSubjects(list);
        
        // Auto-select first subject if none selected
        if (list.length > 0 && !formData.subject) {
            setFormData(prev => ({ ...prev, subject: list[0] }));
        }
        
        // CRITICAL: If the currently selected subject was just deleted by Admin (Globally),
        // switch to the first available one to prevent uploading with a dead subject.
        if (formData.subject && !list.includes(formData.subject) && list.length > 0) {
             setFormData(prev => ({ ...prev, subject: list[0] }));
        }
    });
    return () => unsub();
  }, [formData.subject]); // Dependency ensures we check against current selection

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 10MB Limit for Cloudinary Free Tier
      if (file.size > 10 * 1024 * 1024) { 
        setError("File size too large. Please upload an image under 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setError("Please upload an image of the lecture notes.");
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
      const newLecture: Lecture = {
        id: crypto.randomUUID(),
        studentId: currentUser.id,
        studentName: currentUser.name,
        rollNo: currentUser.rollNo,
        ...formData,
        imageURL: imagePreview,
        date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
        timestamp: Date.now(),
        status: 'pending' as LectureStatus,
        adminRemark: ''
      };

      await addLecture(newLecture);
      setIsSubmitting(false);
      onNavigate(Screen.MY_UPLOADS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload. Please try again.");
      setIsSubmitting(false);
    }
  };

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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-navy-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
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
            placeholder="Brief summary of key points..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className={labelClass}>Lecture Notes Photo</label>
          <div 
            className={`mt-2 flex justify-center px-6 pt-10 pb-10 rounded-2xl cursor-pointer transition-all duration-300 ${
              imagePreview 
                ? 'shadow-neu-flat dark:shadow-neu-flat-dark' 
                : 'shadow-neu-pressed dark:shadow-neu-pressed-dark hover:shadow-neu-flat dark:hover:shadow-neu-flat-dark'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-2 text-center">
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="mx-auto h-64 object-contain rounded-lg shadow-sm" />
                  <p className="mt-4 text-xs text-maroon-600 font-bold uppercase tracking-wider">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4">
                  <div className="p-4 rounded-full bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark mb-4">
                    <Camera className="h-10 w-10 text-navy-400" />
                  </div>
                  <span className="text-sm font-bold text-navy-600 dark:text-navy-300">
                    Tap to upload notes
                  </span>
                  <p className="text-xs text-navy-400 mt-2">Max 10MB (Free Cloudinary Tier)</p>
                </div>
              )}
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
          </div>
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