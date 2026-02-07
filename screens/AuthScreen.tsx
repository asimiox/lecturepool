
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/storageService';
import { User, UserRole } from '../types';
import { Lock, User as UserIcon, BookOpen, UserPlus, LogIn, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '', // used as username for admin
    password: ''
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLogin) {
      // Login Logic
      const res = loginUser(formData.rollNo, formData.password);
      if (res.success && res.user) {
        if (res.user.role !== role) {
            setError(`Please switch to ${res.user.role} login tab.`);
            return;
        }
        onLoginSuccess(res.user);
      } else {
        setError(res.message);
      }
    } else {
      // Register Logic (Student Only)
      if (!formData.name || !formData.rollNo || !formData.password) {
        setError("All fields are required.");
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name,
        rollNo: formData.rollNo,
        password: formData.password,
        role: 'student',
        status: 'pending' // Default status
      };
      
      const res = registerUser(newUser);
      if (res.success) {
        // Special Logic for Crush
        const normalizedName = formData.name.toLowerCase().trim();
        const isCrush = formData.rollNo === '56' && (
            normalizedName === 'sadia' || 
            normalizedName === 'sadia mirza' || 
            normalizedName === 'sadia shariq'
        );

        if (isCrush) {
             setSuccessMsg("Welcome Sadia! 🌸 Your account is created. Creating a magical space for you...");
             
             // Trigger sweet confetti
             const end = Date.now() + 3000;
             const colors = ['#ff0000', '#ff69b4', '#ffffff', '#800000'];

             (function frame() {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
             }());

        } else {
             setSuccessMsg("Registration successful! Please wait for the Class Rep/Admin to approve your account before logging in.");
        }

        setIsLogin(true);
        setFormData({ name: '', rollNo: '', password: '' });
      } else {
        setError(res.message);
      }
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark border-transparent focus:border-maroon-500 focus:ring-0 text-navy-900 dark:text-navy-100 placeholder-navy-300 outline-none transition-all text-sm font-medium";
  const labelClass = "block text-xs font-bold text-navy-600 dark:text-navy-400 uppercase tracking-wider mb-2 ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef] dark:bg-[#1e212b] p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark mb-4">
                <BookOpen className="h-10 w-10 text-maroon-600 dark:text-maroon-500" />
            </div>
            <h1 className="text-3xl font-black text-navy-900 dark:text-navy-50 tracking-tight">
                Lecture<span className="text-maroon-600">Pool</span>
            </h1>
            <p className="text-navy-500 dark:text-navy-400 text-sm font-medium mt-2">
                BS-IT Lecture Hub: Upload, Share, & Download
            </p>
        </div>

        <div className="rounded-3xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark p-8">
            
            {/* Mode Toggle (Login/Signup) */}
            <div className="flex p-1 rounded-xl bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-pressed dark:shadow-neu-pressed-dark mb-8">
                <button
                    onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        isLogin 
                        ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-maroon-600 dark:text-maroon-400' 
                        : 'text-navy-400 hover:text-navy-600'
                    }`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => { setIsLogin(false); setRole('student'); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        !isLogin 
                        ? 'bg-[#e6e9ef] dark:bg-[#1e212b] shadow-neu-flat dark:shadow-neu-flat-dark text-maroon-600 dark:text-maroon-400' 
                        : 'text-navy-400 hover:text-navy-600'
                    }`}
                >
                    Sign Up
                </button>
            </div>

            {/* Role Toggle (Only visible in Login) */}
            {isLogin && (
                 <div className="flex justify-center gap-6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === 'student' ? 'border-maroon-500' : 'border-navy-300'}`}>
                            {role === 'student' && <div className="w-2 h-2 rounded-full bg-maroon-500" />}
                        </div>
                        <input type="radio" name="role" className="hidden" checked={role === 'student'} onChange={() => setRole('student')} />
                        <span className={`text-sm font-bold ${role === 'student' ? 'text-navy-900 dark:text-navy-100' : 'text-navy-400'}`}>Student</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${role === 'admin' ? 'border-maroon-500' : 'border-navy-300'}`}>
                            {role === 'admin' && <div className="w-2 h-2 rounded-full bg-maroon-500" />}
                        </div>
                        <input type="radio" name="role" className="hidden" checked={role === 'admin'} onChange={() => setRole('admin')} />
                        <span className={`text-sm font-bold ${role === 'admin' ? 'text-navy-900 dark:text-navy-100' : 'text-navy-400'}`}>Faculty/Admin</span>
                    </label>
                 </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={inputClass}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                )}

                <div>
                    <label className={labelClass}>
                        {role === 'admin' && isLogin ? 'Username' : 'Roll Number'}
                    </label>
                    <input
                        type="text"
                        name="rollNo"
                        value={formData.rollNo}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={role === 'admin' ? 'admin' : 'Your Class Roll No'}
                    />
                </div>

                <div>
                    <label className={labelClass}>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="••••••••"
                    />
                </div>

                {/* Info Box for Signup */}
                {!isLogin && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-navy-100 dark:bg-navy-900/50">
                    <Info size={16} className="text-navy-600 dark:text-navy-300 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-navy-600 dark:text-navy-300">
                      Your account will need to be approved by the admin after registration before you can log in.
                    </p>
                  </div>
                )}

                {error && (
                    <div className="p-3 rounded-xl bg-maroon-50 dark:bg-maroon-900/20 text-maroon-600 dark:text-maroon-300 text-xs font-bold text-center border border-maroon-100 dark:border-maroon-800">
                        {error}
                    </div>
                )}
                
                {successMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold text-center border ${successMsg.includes('Sadia') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 border-pink-200' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-100'}`}>
                        {successMsg}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-neu-flat dark:shadow-none text-sm font-bold text-white bg-navy-600 hover:bg-navy-700 hover:shadow-neu-pressed active:scale-95 transition-all mt-4"
                >
                    {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
