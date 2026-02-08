
import React, { useState, useEffect } from 'react';
import { Screen, User } from '../types';
import { BookOpen, LogOut, Moon, Sun, User as UserIcon, Settings, Wifi, WifiOff, Menu, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribeToAnnouncements } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  currentUser: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const QUOTES = [
  "The capacity to learn is a gift; the ability to learn is a skill.",
  "Education is the passport to the future.",
  "Stay curious. Stay hungry. Keep learning.",
  "The more that you read, the more things you will know.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "Education is not preparation for life; education is life itself.",
  "Grow through what you go through.",
  "An investment in knowledge pays the best interest.",
  "Believe you can and you're halfway there.",
  "Your attitude determines your direction.",
  "Progress, not perfection.",
  "Dream big and dare to fail.",
  "Knowledge is power.",
  "Creativity is intelligence having fun.",
  "Simplicity is the ultimate sophistication.",
  "Everything you can imagine is real.",
  "Do what you can, with what you have, where you are.",
  "It always seems impossible until it's done.",
  "Happiness depends upon ourselves.",
  "Be the change that you wish to see in the world.",
  "In the middle of difficulty lies opportunity.",
  "Turn your wounds into wisdom.",
  "Small steps in the right direction can turn out to be the biggest step of your life.",
  "The best way to predict your future is to create it."
];

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentScreen, 
  onNavigate, 
  currentUser,
  onLogout,
  isDarkMode,
  toggleTheme
}) => {
  // Easter Egg State
  const [logoClicks, setLogoClicks] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for announcements to show badge
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const unsub = subscribeToAnnouncements((list) => {
       // Simple logic: Count announcements from today for this user
       const today = new Date().toISOString().split('T')[0];
       const relevant = list.filter(a => 
           (a.audience === 'all' || a.audience === currentUser.id) &&
           a.date === today
       );
       setUnreadAnnouncements(relevant.length);
    });

    return () => unsub();
  }, [currentUser]);

  // If no user (and not on Auth screen logic handled in App), show minimal layout
  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === 'admin';
  const hourlyQuote = QUOTES[new Date().getHours() % QUOTES.length];

  const handleLogoClick = () => {
    onNavigate(Screen.HOME);
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);

    if (newCount === 5) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000080', '#800000', '#ffffff'] 
      });
      setLogoClicks(0); 
    }
  };

  const navButtonClass = (screen: Screen) => `
    px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 relative whitespace-nowrap
    ${currentScreen === screen
      ? (isDarkMode ? 'text-maroon-400 shadow-neu-pressed-dark' : 'text-maroon-700 shadow-neu-pressed')
      : (isDarkMode ? 'text-navy-300 hover:text-navy-100 hover:shadow-neu-flat-dark' : 'text-navy-600 hover:text-navy-900 hover:shadow-neu-flat')}
  `;
  
  const mobileNavButtonClass = (screen: Screen) => `
    w-full text-left px-5 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 relative
    ${currentScreen === screen
      ? (isDarkMode ? 'bg-navy-800 text-maroon-400' : 'bg-navy-100 text-maroon-700')
      : (isDarkMode ? 'text-navy-300' : 'text-navy-600')}
  `;

  const handleMobileNav = (screen: Screen) => {
      onNavigate(screen);
      setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'text-navy-50' : 'text-navy-900'}`}>
      {/* Navbar */}
      <header className={`sticky top-0 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-[#1e212b] shadow-neu-flat-dark' : 'bg-[#e6e9ef] shadow-neu-flat'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Left Side: Logo & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button 
                  className="md:hidden p-2 text-navy-600 dark:text-navy-300"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <div className="flex items-center cursor-pointer group select-none" onClick={handleLogoClick}>
                <div className={`p-2.5 rounded-xl mr-3 transition-all duration-300 ${
                    isDarkMode 
                    ? 'bg-navy-900 shadow-neu-flat-dark group-hover:shadow-neu-pressed-dark text-maroon-400' 
                    : 'bg-navy-50 shadow-neu-flat group-hover:shadow-neu-pressed text-navy-900'
                }`}>
                    <BookOpen className="h-6 w-6" />
                </div>
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-navy-100' : 'text-navy-900'}`}>
                    Lecture<span className="text-maroon-600">Pool</span>
                    </h1>
                    <p className={`text-[10px] font-bold tracking-widest uppercase hidden sm:block ${isDarkMode ? 'text-navy-400' : 'text-navy-500'}`}>
                    {isAdmin ? 'Faculty Panel' : 'Student Portal'}
                    </p>
                </div>
                </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 md:space-x-6">
              
              <button 
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#1e212b] shadow-neu-flat-dark hover:shadow-neu-pressed-dark text-yellow-400' 
                    : 'bg-[#e6e9ef] shadow-neu-flat hover:shadow-neu-pressed text-navy-600'
                }`}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <nav className="flex space-x-4">
                {isAdmin ? (
                  <>
                    <button onClick={() => onNavigate(Screen.HOME)} className={navButtonClass(Screen.HOME)}>
                      Dashboard
                    </button>
                    <button onClick={() => onNavigate(Screen.LIBRARY)} className={navButtonClass(Screen.LIBRARY)}>
                      All Uploads
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onNavigate(Screen.HOME)} className={navButtonClass(Screen.HOME)}>
                      Today's Lectures
                    </button>
                    <button onClick={() => onNavigate(Screen.MY_UPLOADS)} className={navButtonClass(Screen.MY_UPLOADS)}>
                      My Uploads
                    </button>
                    <button onClick={() => onNavigate(Screen.LIBRARY)} className={navButtonClass(Screen.LIBRARY)}>
                      Archive
                    </button>
                    <button onClick={() => onNavigate(Screen.ANNOUNCEMENTS)} className={navButtonClass(Screen.ANNOUNCEMENTS)}>
                      Announcements
                      {unreadAnnouncements > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white animate-pulse">
                              {unreadAnnouncements}
                          </span>
                      )}
                    </button>
                  </>
                )}
              </nav>

              <div className="flex gap-2">
                <button 
                    onClick={() => onNavigate(Screen.PROFILE)}
                    className={`p-2.5 rounded-full font-medium flex items-center gap-1 transition-all duration-300 ${
                        currentScreen === Screen.PROFILE
                        ? (isDarkMode ? 'bg-[#1e212b] shadow-neu-pressed-dark text-maroon-400' : 'bg-[#e6e9ef] shadow-neu-pressed text-maroon-600')
                        : (isDarkMode ? 'bg-[#1e212b] shadow-neu-flat-dark hover:shadow-neu-pressed-dark text-navy-400 hover:text-maroon-400' : 'bg-[#e6e9ef] shadow-neu-flat hover:shadow-neu-pressed text-navy-600 hover:text-maroon-800')
                    }`}
                    title="Profile Settings"
                >
                    <Settings size={16} />
                </button>

                <button 
                    onClick={onLogout}
                    className={`p-2.5 rounded-full text-maroon-600 font-medium flex items-center gap-1 transition-all duration-300 ${
                        isDarkMode
                        ? 'bg-[#1e212b] shadow-neu-flat-dark hover:shadow-neu-pressed-dark hover:text-maroon-400'
                        : 'bg-[#e6e9ef] shadow-neu-flat hover:shadow-neu-pressed hover:text-maroon-800'
                    }`}
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Right Actions */}
            <div className="flex md:hidden items-center gap-3">
                 <button 
                    onClick={toggleTheme}
                    className={`p-2.5 rounded-full transition-all duration-300 ${
                    isDarkMode 
                        ? 'bg-[#1e212b] shadow-neu-flat-dark text-yellow-400' 
                        : 'bg-[#e6e9ef] shadow-neu-flat text-navy-600'
                    }`}
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                 <button 
                    onClick={onLogout}
                    className="p-2.5 rounded-full bg-maroon-50 text-maroon-600 dark:bg-maroon-900/30 dark:text-maroon-400"
                >
                    <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
            <div className="md:hidden border-t border-navy-100 dark:border-navy-800 bg-[#e6e9ef] dark:bg-[#1e212b] animate-slide-down shadow-xl absolute w-full z-40">
                <div className="px-4 py-6 space-y-3">
                    {isAdmin ? (
                        <>
                            <button onClick={() => handleMobileNav(Screen.HOME)} className={mobileNavButtonClass(Screen.HOME)}>
                                Dashboard
                            </button>
                            <button onClick={() => handleMobileNav(Screen.LIBRARY)} className={mobileNavButtonClass(Screen.LIBRARY)}>
                                All Uploads
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleMobileNav(Screen.HOME)} className={mobileNavButtonClass(Screen.HOME)}>
                                Today's Lectures
                            </button>
                            <button onClick={() => handleMobileNav(Screen.MY_UPLOADS)} className={mobileNavButtonClass(Screen.MY_UPLOADS)}>
                                My Uploads
                            </button>
                            <button onClick={() => handleMobileNav(Screen.LIBRARY)} className={mobileNavButtonClass(Screen.LIBRARY)}>
                                Archive
                            </button>
                            <button onClick={() => handleMobileNav(Screen.ANNOUNCEMENTS)} className={mobileNavButtonClass(Screen.ANNOUNCEMENTS)}>
                                <div className="flex justify-between items-center">
                                    <span>Announcements</span>
                                    {unreadAnnouncements > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                            {unreadAnnouncements} New
                                        </span>
                                    )}
                                </div>
                            </button>
                        </>
                    )}
                    <div className="pt-4 border-t border-navy-200 dark:border-navy-700">
                         <button onClick={() => handleMobileNav(Screen.PROFILE)} className="flex items-center gap-2 w-full px-5 py-3 text-sm font-bold text-navy-600 dark:text-navy-300">
                             <Settings size={18} /> Profile Settings
                         </button>
                    </div>
                </div>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 text-navy-500 dark:text-navy-400">
           <div className="flex items-center gap-2">
              <UserIcon size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Logged in as: <span className="text-navy-800 dark:text-navy-200">{currentUser.name}</span> ({currentUser.role})
              </span>
           </div>
           
           <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-maroon-600 dark:text-maroon-400'}`}>
              {isOnline ? (
                <>
                  <Wifi size={14} />
                  <span>Cloud Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  <span>Offline Mode (Sync Pending)</span>
                </>
              )}
           </div>
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className={`mt-auto py-3 transition-colors duration-300 ${isDarkMode ? 'bg-[#1e212b] border-t border-navy-800' : 'bg-[#e6e9ef] border-t border-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-center text-[10px] gap-2">
              <div className="font-bold tracking-tight text-navy-600 dark:text-navy-400">
                 Lecture<span className="text-maroon-600">Pool</span>
              </div>
              
              <div className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-navy-900 via-maroon-600 to-navy-900 dark:from-navy-200 dark:via-maroon-400 dark:to-navy-200 animate-gradient-x bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300 cursor-default">
                Made with ❤ By Asim Nawaz
              </div>

              <div className="italic opacity-70 hidden md:block text-navy-500 dark:text-navy-400 text-right max-w-xs">
                 "{hourlyQuote}"
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};
