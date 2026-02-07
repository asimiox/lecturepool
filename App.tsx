import React, { useState, useEffect } from 'react';
import { Screen, User } from './types';
import { Layout } from './components/Layout';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { StudentDashboardScreen } from './screens/StudentDashboardScreen';
import { ApprovedLecturesScreen } from './screens/ApprovedLecturesScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.HOME);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen(Screen.AUTH);
  };

  const renderScreen = () => {
    if (!currentUser) {
      return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentScreen) {
      case Screen.AUTH:
         // Should not happen if user is set, but redirect just in case
         return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
      case Screen.HOME:
        // Admin goes to AdminDashboard, Student goes to StudentHome
        if (currentUser.role === 'admin') return <AdminDashboardScreen />;
        return <HomeScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
      case Screen.UPLOAD:
        return <UploadScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
      case Screen.MY_UPLOADS:
        return <StudentDashboardScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
      case Screen.LIBRARY:
        return <ApprovedLecturesScreen />;
      case Screen.PROFILE:
        return <ProfileScreen currentUser={currentUser} onUserUpdate={handleUserUpdate} onNavigate={setCurrentScreen} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} currentUser={currentUser} />;
    }
  };

  return (
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
  );
};

export default App;