import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import VideoPage from './pages/VideoPage';
import MyLearningPage from './pages/MyLearningPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import CoursePage from './pages/CoursePage';
import AIChatPage from './pages/AIChatPage';
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

// Page transition wrapper to prevent white flashes
const PageTransitionWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // Apply page transition effect whenever location changes
  useEffect(() => {
    // Add "no-fouc" class to prevent Flash of Unstyled Content
    document.documentElement.classList.add('no-fouc');

    // Small timeout to ensure the transition effect is visible
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('no-fouc');
      document.documentElement.classList.add('fouc-ready');

      // Scroll to top on page change
      window.scrollTo(0, 0);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('fouc-ready');
    };
  }, [location.pathname]);

  return <div className="page-transition-wrapper">{children}</div>;
};

// ChatWidget container that respects current route
const ChatWidgetContainer = () => {
  const location = useLocation();

  // Don't show the chat widget on pages that have their own chat interface
  if (location.pathname === '/my-learning' || location.pathname === '/ai-chat') {
    return null;
  }

  return <ChatWidget />;
};

// Footer container - hide on full-screen pages
const FooterContainer = () => {
  const location = useLocation();
  if (location.pathname === '/ai-chat') return null;
  return <Footer />;
};

// Route wrapper for Home page - redirects to My Learning if logged in
const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
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
                <main className="flex-grow main-content">
                  <PageTransitionWrapper>
                    <Routes>
                      <Route path="/" element={<HomeRoute />} />
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
                      <Route
                        path="/explore"
                        element={
                          <ProtectedRoute>
                            <ExplorePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/video/:videoId" element={<VideoPage />} />
                      <Route path="/course/:courseId" element={<CoursePage />} />
                      <Route
                        path="/ai-chat"
                        element={
                          <ProtectedRoute>
                            <AIChatPage />
                          </ProtectedRoute>
                        }
                      />
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
                  </PageTransitionWrapper>
                </main>

                {/* Footer */}
                <FooterContainer />

                {/* Global Chat Widget */}
                <ChatWidgetContainer />
              </div>
            </LearningStatsProvider>
          </ChatProvider>
        </LearningProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;