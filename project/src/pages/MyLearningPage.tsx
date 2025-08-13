import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Search, MessageCircle, X } from 'lucide-react';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import Button from '../components/ui/Button';
import LearningAssistant from '../components/ui/LearningAssistant';
import SavedLearningPlans from '../components/ui/SavedLearningPlans';
import LearningChatInterface from '../components/ui/LearningChatInterface';

const MyLearningPage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, updateStatus, removeVideo, loading, error } = useLearning();
  const [filter, setFilter] = useState<'all' | 'to-learn' | 'in-progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'title'>('recommended');
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive design
  useEffect(() => {
    // Initialize mobile state
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Check on mount
    checkIsMobile();
    
    const handleResize = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < 1024;
      setIsMobile(nowMobile);
      
      // Auto-close chat when switching to mobile
      if (!wasMobile && nowMobile && showChat) {
        setShowChat(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, showChat]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">My Learning</h1>
        <p className="text-gray-600 mb-8">Please sign in to view and manage your learning progress.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredVideos = useMemo(() => {
    return filter === 'all' 
      ? [...userVideos] 
      : userVideos.filter(video => video.status === filter);
  }, [userVideos, filter]);

  // Sort videos for a professional, helpful default order
  const sortedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // recommended: in-progress first, then to-learn, then completed
      const order: Record<string, number> = { 'in-progress': 0, 'to-learn': 1, 'completed': 2 };
      const aRank = order[a.status] ?? 3;
      const bRank = order[b.status] ?? 3;
      if (aRank !== bRank) return aRank - bRank;
      return a.title.localeCompare(b.title);
    });
  }, [filteredVideos, sortBy]);

  const statusCounts = useMemo(() => ({
    'to-learn': userVideos.filter(v => v.status === 'to-learn').length,
    'in-progress': userVideos.filter(v => v.status === 'in-progress').length,
    'completed': userVideos.filter(v => v.status === 'completed').length,
  }), [userVideos]);

  // On mobile, show either chat or content
  const showMobileChat = isMobile && showChat;

  // Loading state
  if (loading && userVideos.length === 0) {
    return (
      <div className="min-h-screen bg-white -mt-20 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your learning progress...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white -mt-20 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Learning Data</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mt-20 pt-20">
      {/* Clean Header */}
      <div className="bg-white py-16 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <BookOpen size={16} />
              MY LEARNING DASHBOARD
        </div>
            <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6 animate-fade-in" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Your Learning Journey
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Track your progress and continue your educational journey with AI assistance.
            </p>
        <Button 
          onClick={() => setShowChat(!showChat)}
              className={`${showChat ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-medium`}
        >
          {showChat ? (
            <>
              <X size={18} />
              {isMobile ? "Back to Learning" : "Close Chat"}
            </>
          ) : (
            <>
              <MessageCircle size={18} />
              {isMobile ? "AI Chat" : "Open AI Chat"}
            </>
          )}
        </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Sleek Stats Cards */}
        <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <div className="bg-gray-50 rounded-3xl p-8 text-center hover:bg-white hover:shadow-lg transition-all duration-500 border border-transparent hover:border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-3">Total Saved</div>
            <div className="text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>{userVideos.length}</div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 text-center hover:bg-white hover:shadow-lg transition-all duration-500 border border-transparent hover:border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-3">To Learn</div>
            <div className="text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>{statusCounts['to-learn']}</div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 text-center hover:bg-white hover:shadow-lg transition-all duration-500 border border-transparent hover:border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-3">In Progress</div>
            <div className="text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>{statusCounts['in-progress']}</div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-8 text-center hover:bg-white hover:shadow-lg transition-all duration-500 border border-transparent hover:border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-3">Completed</div>
            <div className="text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Dancing Script, cursive' }}>{statusCounts['completed']}</div>
          </div>
        </div>

        {/* Controls: Filters + Sort */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilter('all')}
              className="btn-sm"
                >
                  All ({userVideos.length})
                </Button>
                <Button
                  variant={filter === 'to-learn' ? 'primary' : 'outline'}
                  onClick={() => setFilter('to-learn')}
              className="btn-sm flex items-center gap-1"
                >
                  <BookOpen size={16} />
                  To Learn ({statusCounts['to-learn']})
                </Button>
                <Button
                  variant={filter === 'in-progress' ? 'primary' : 'outline'}
                  onClick={() => setFilter('in-progress')}
              className="btn-sm flex items-center gap-1"
                >
                  <Clock size={16} />
                  In Progress ({statusCounts['in-progress']})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'primary' : 'outline'}
                  onClick={() => setFilter('completed')}
              className="btn-sm flex items-center gap-1"
                >
                  <CheckCircle size={16} />
                  Completed ({statusCounts['completed']})
                </Button>
              </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recommended' | 'title')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              aria-label="Sort my learning"
            >
              <option value="recommended">Recommended</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
                  </div>

        {/* Content Layout */}
        {isMobile && showMobileChat ? (
          <div className="w-full animate-fade-in">
            <LearningChatInterface title="AI Learning Chat" />
                </div>
              ) : (
          <div className={`flex flex-col ${!isMobile && showChat ? 'lg:flex-row gap-8' : ''}`}>
          {/* Learning Content Section */}
            <div className={`w-full ${!isMobile && showChat ? 'lg:w-1/2' : ''}`}>
            {user && (
                <div className="mb-8 animate-slide-up">
                <LearningAssistant 
                  currentCategory={filter !== 'all' ? filter : undefined}
                  userLevel={
                    statusCounts.completed > 10 
                      ? 'advanced' 
                      : statusCounts.completed > 3 
                        ? 'intermediate' 
                        : 'beginner'
                  }
                />
                
                {/* Display saved learning plans if any exist */}
                <SavedLearningPlans />
                </div>
              )}

              {sortedVideos.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Search size={40} className="text-gray-700" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">No videos found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  {filter === 'all'
                      ? "You haven't saved any videos to your learning list yet. Start exploring and save courses that interest you!"
                      : `You don't have any ${filter.replace('-', ' ')} videos. Try exploring new content or changing your filter.`}
                </p>
                <Link to="/explore">
                    <Button className="btn-lg">
                      <Search size={20} className="mr-2" />
                      Explore Videos
                    </Button>
                </Link>
              </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in">
                  {sortedVideos.map((video) => (
                  <div key={video.id} className="flex flex-col h-full">
                  <VideoCard
                    video={video}
                    onUpdateStatus={updateStatus}
                    onRemove={removeVideo}
                  />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Interface Section */}
            {!isMobile && showChat && (
              <div className="w-1/2 animate-slide-up">
              <LearningChatInterface title="AI Learning Chat" />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default MyLearningPage;