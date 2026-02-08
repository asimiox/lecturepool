
import React, { useState, useEffect, useRef } from 'react';
import { Screen, User } from './types';
import { Layout } from './components/Layout';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { StudentDashboardScreen } from './screens/StudentDashboardScreen';
import { ApprovedLecturesScreen } from './screens/ApprovedLecturesScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AnnouncementsScreen } from './screens/AnnouncementsScreen';
import { subscribeToUserProfile, subscribeToAnnouncements } from './services/storageService';
import { NotificationToast, NotificationType } from './components/NotificationToast';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Global Notification State
  const [notify, setNotify] = useState<{ msg: string; type: NotificationType; show: boolean }>({
    msg: '',
    type: 'info',
    show: false
  });

  // Track known announcements to detect new ones
  const knownAnnouncementIds = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const showNotification = (msg: string, type: NotificationType = 'success') => {
    setNotify({ msg, type, show: true });
  };

  const hideNotification = () => {
    setNotify(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    // Theme initialization
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1e212b';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#e6e9ef';
    }
  }, [isDarkMode]);

  // Real-time Session Security Check
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserProfile(currentUser.id, (updatedUser) => {
      if (!updatedUser) {
        alert("Your account has been removed.");
        handleLogout();
      } else if (updatedUser.status === 'rejected') {
        alert("Session Expired: Your account access has been revoked by the administrator.");
        handleLogout();
      } else if (updatedUser.status === 'pending' && currentUser.status === 'active') {
         alert("Your account is under review.");
         handleLogout();
      } else {
         if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
             setCurrentUser(updatedUser);
         }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // New Announcement Notification Logic
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const unsub = subscribeToAnnouncements((list) => {
       if (isFirstLoadRef.current) {
          // First load: just populate the set, don't notify
          list.forEach(a => knownAnnouncementIds.current.add(a.id));
          isFirstLoadRef.current = false;
          return;
       }

       // Check for any NEW items
       list.forEach(ann => {
          if (!knownAnnouncementIds.current.has(ann.id)) {
              // It's new! Check if it is for this user
              if (ann.audience === 'all' || ann.audience === currentUser.id) {
                  showNotification("📢 New Announcement: " + ann.message.substring(0, 30) + "...", 'info');
              }
              knownAnnouncementIds.current.add(ann.id);
          }
       });
    });

    return () => unsub();
  }, [currentUser]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.HOME);
    isFirstLoadRef.current = true; // Reset for new session
    knownAnnouncementIds.current.clear();
    showNotification(`Welcome back, ${user.name}!`, 'success');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    showNotification("Profile updated successfully", 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen(Screen.AUTH);
    showNotification("Logged out successfully", 'info');
  };

  const renderScreen = () => {
    if (!currentUser) {
      return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // Cloning elements to inject showNotification prop if they accept it
    // Using explicit props for type safety
    switch (currentScreen) {
      case Screen.AUTH:
         return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
      case Screen.HOME:
        if (currentUser.role === 'admin') return <AdminDashboardScreen showNotification={showNotification} />;
        return <HomeScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
      case Screen.UPLOAD:
        return <UploadScreen onNavigate={setCurrentScreen} currentUser={currentUser} />; // UploadScreen could be updated to use showNotification if needed
      case Screen.MY_UPLOADS:
        return <StudentDashboardScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
      case Screen.LIBRARY:
        return <ApprovedLecturesScreen currentUser={currentUser} />;
      case Screen.PROFILE:
        return <ProfileScreen currentUser={currentUser} onUserUpdate={handleUserUpdate} onNavigate={setCurrentScreen} />;
      case Screen.ANNOUNCEMENTS:
        return <AnnouncementsScreen currentUser={currentUser} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
    }
  };

  return (
    <>
      <NotificationToast 
        message={notify.msg} 
        type={notify.type} 
        isVisible={notify.show} 
        onClose={hideNotification} 
      />
      <Layout 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        {renderScreen()}
      </Layout>
    </>
  );
};

export default App;
