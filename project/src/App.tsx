import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import VideoPage from './pages/VideoPage';
import MyLearningPage from './pages/MyLearningPage';
import ExplorePage from './pages/ExplorePage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LearningProvider } from './context/LearningContext';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LearningProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
                <Route path="/video/:videoId" element={<VideoPage />} />
                <Route path="/my-learning" element={<PrivateRoute element={<MyLearningPage />} />} />
                <Route path="/explore" element={<PrivateRoute element={<ExplorePage />} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Routes>
            </main>
          </div>
        </LearningProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;