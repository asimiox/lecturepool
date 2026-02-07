
import React, { useState, useEffect } from 'react';
import { User, Screen } from '../types';
import { updateUserProfile } from '../services/storageService';
import { User as UserIcon, Lock, CheckCircle, Save, AlertCircle } from 'lucide-react';

interface ProfileScreenProps {
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
  onNavigate: (screen: Screen) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ currentUser, onUserUpdate, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      name: currentUser.name,
      password: currentUser.password,
      confirmPassword: currentUser.password
    });
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (formData.password.length < 4) {
      setMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUserProfile(currentUser.id, {
        name: formData.name,
        password: formData.password
      });

      if (result.success && result.user) {
        setMsg({ type: 'success', text: 'Profile updated successfully!' });
        onUserUpdate(result.user);
      } else {
        setMsg({ type: 'error', text: result.message });
      }
    } catch (error) {
       setMsg({ type: 'error', text: 'Update failed.' });
    } finally {
       setIsSubmitting(false);
    }
  };

  const inputClass = "w-full pl-10 px-4 py-3 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent focus:border-maroon-500 focus:ring-0 text-navy-900 dark:text-navy-100 placeholder-navy-300 outline-none transition-all text-sm font-medium";
  const labelClass = "block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-navy-900 dark:text-navy-50">Profile Settings</h2>
        <p className="text-navy-500 dark:text-navy-400 mt-2 font-medium">Manage your account information</p>
      </div>

      <div className="bg-[#e6e9ef] dark:bg-[#1e212b] p-8 rounded-3xl shadow-neu-flat dark:shadow-neu-flat-dark">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Roll No (Read Only) */}
          <div>
            <label className={labelClass}>Roll Number (Username)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-navy-400" />
                </div>
                <input
                    type="text"
                    value={currentUser.rollNo}
                    disabled
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
                <p className="mt-1 text-[10px] text-navy-400 ml-1">Roll number cannot be changed.</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Full Name</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-navy-400" />
                </div>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>
          </div>

          <div className="border-t border-navy-200 dark:border-navy-800 my-4"></div>

          {/* Password */}
          <div>
            <label className={labelClass}>New Password</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-navy-400" />
                </div>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClass}>Confirm Password</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-navy-400" />
                </div>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center border flex items-center justify-center gap-2 ${
              msg.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-100 dark:border-green-800' 
                : 'bg-maroon-50 dark:bg-maroon-900/20 text-maroon-600 dark:text-maroon-300 border-maroon-100 dark:border-maroon-800'
            }`}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

          <div className="flex gap-4 pt-4">
             <button
                type="button"
                onClick={() => onNavigate(Screen.HOME)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-navy-600 dark:text-navy-300 bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark hover:shadow-neu-pressed dark:hover:shadow-neu-pressed-dark transition-all"
             >
               Cancel
             </button>
             <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-3 rounded-xl text-sm font-bold text-white bg-navy-600 shadow-neu-flat dark:shadow-none hover:bg-navy-700 active:shadow-neu-pressed transition-all flex items-center justify-center gap-2 disabled:opacity-70"
             >
               <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};
