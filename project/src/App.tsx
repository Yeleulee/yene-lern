import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import VideoPage from './pages/VideoPage';
import MyLearningPage from './pages/MyLearningPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import CoursePage from './pages/CoursePage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LearningProvider } from './context/LearningContext';
import { ChatProvider } from './context/ChatContext';
import { LearningStatsProvider } from './context/LearningStatsContext';
import ChatWidget from './components/ui/ChatWidget';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LearningProvider>
          <ChatProvider>
            <LearningStatsProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/video/:videoId" element={<VideoPage />} />
                    <Route path="/course/:courseId" element={<CoursePage />} />
                    <Route 
                      path="/my-learning" 
                      element={
                        <ProtectedRoute>
                          <MyLearningPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>

                {/* Global Chat Widget */}
                <ChatWidget />
              </div>
            </LearningStatsProvider>
          </ChatProvider>
        </LearningProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;