import React, { useState, useEffect } from 'react';
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
  const { userVideos, updateStatus, removeVideo } = useLearning();
  const [filter, setFilter] = useState<'all' | 'to-learn' | 'in-progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'title'>('recommended');
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : true);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      
      // Auto-close chat on mobile when resizing to mobile
      if (window.innerWidth < 1024 && showChat) {
        setShowChat(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showChat]);

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

  const filteredVideos = (filter === 'all' 
    ? userVideos 
    : userVideos.filter(video => video.status === filter))
    .slice();

  // Sort videos for a professional, helpful default order
  const sortedVideos = filteredVideos.sort((a, b) => {
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

  const statusCounts = {
    'to-learn': userVideos.filter(v => v.status === 'to-learn').length,
    'in-progress': userVideos.filter(v => v.status === 'in-progress').length,
    'completed': userVideos.filter(v => v.status === 'completed').length,
  };

  // On mobile, show either chat or content
  const showMobileChat = isMobile && showChat;
  const showMobileContent = !isMobile || (isMobile && !showChat);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-xs text-gray-500">Total Saved</div>
          <div className="text-2xl font-semibold">{userVideos.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">To Learn</div>
          <div className="text-2xl font-semibold">{statusCounts['to-learn']}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">In Progress</div>
          <div className="text-2xl font-semibold">{statusCounts['in-progress']}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Completed</div>
          <div className="text-2xl font-semibold">{statusCounts['completed']}</div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Learning</h1>
          <p className="text-gray-600">Track and manage your learning journey</p>
        </div>
        <Button 
          onClick={() => setShowChat(!showChat)}
          variant={showChat ? "outline" : "primary"}
          className="flex items-center gap-2"
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

      {/* Mobile View */}
      {/* Controls: Filters + Sort */}
      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({userVideos.length})
          </Button>
          <Button
            variant={filter === 'to-learn' ? 'primary' : 'outline'}
            onClick={() => setFilter('to-learn')}
            size="sm"
            className="flex items-center gap-1"
          >
            <BookOpen size={16} />
            To Learn ({statusCounts['to-learn']})
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'primary' : 'outline'}
            onClick={() => setFilter('in-progress')}
            size="sm"
            className="flex items-center gap-1"
          >
            <Clock size={16} />
            In Progress ({statusCounts['in-progress']})
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
            className="flex items-center gap-1"
          >
            <CheckCircle size={16} />
            Completed ({statusCounts['completed']})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recommended' | 'title')}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
            aria-label="Sort my learning"
          >
            <option value="recommended">Recommended</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {isMobile && (
        <>
          {showMobileChat ? (
            <div className="w-full mb-6">
              <LearningChatInterface title="AI Learning Chat" />
            </div>
          ) : (
            <div className="w-full">
              {user && (
                <>
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
                </>
              )}

              {/* Status Filters */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setFilter('all')}
                  className="flex items-center gap-1"
                >
                  All ({userVideos.length})
                </Button>
                <Button
                  variant={filter === 'to-learn' ? 'primary' : 'outline'}
                  onClick={() => setFilter('to-learn')}
                  className="flex items-center gap-1"
                >
                  <BookOpen size={16} />
                  To Learn ({statusCounts['to-learn']})
                </Button>
                <Button
                  variant={filter === 'in-progress' ? 'primary' : 'outline'}
                  onClick={() => setFilter('in-progress')}
                  className="flex items-center gap-1"
                >
                  <Clock size={16} />
                  In Progress ({statusCounts['in-progress']})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'primary' : 'outline'}
                  onClick={() => setFilter('completed')}
                  className="flex items-center gap-1"
                >
                  <CheckCircle size={16} />
                  Completed ({statusCounts['completed']})
                </Button>
              </div>

              {sortedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No videos found</h3>
                  <p className="text-gray-600 mb-6">
                    {filter === 'all'
                      ? "You haven't saved any videos to your learning list yet."
                      : `You don't have any ${filter.replace('-', ' ')} videos.`}
                  </p>
                  <Link to="/explore">
                    <Button>Explore Videos</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
          )}
        </>
      )}

      {/* Desktop View */}
      {!isMobile && (
        <div className="flex flex-row gap-8">
          {/* Learning Content Section */}
          <div className={`w-full ${showChat ? 'lg:w-1/2' : ''}`}>
            {user && (
              <>
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
              </>
            )}

            {/* Status Filters */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilter('all')}
                className="flex items-center gap-1"
              >
                All ({userVideos.length})
              </Button>
              <Button
                variant={filter === 'to-learn' ? 'primary' : 'outline'}
                onClick={() => setFilter('to-learn')}
                className="flex items-center gap-1"
              >
                <BookOpen size={16} />
                To Learn ({statusCounts['to-learn']})
              </Button>
              <Button
                variant={filter === 'in-progress' ? 'primary' : 'outline'}
                onClick={() => setFilter('in-progress')}
                className="flex items-center gap-1"
              >
                <Clock size={16} />
                In Progress ({statusCounts['in-progress']})
              </Button>
              <Button
                variant={filter === 'completed' ? 'primary' : 'outline'}
                onClick={() => setFilter('completed')}
                className="flex items-center gap-1"
              >
                <CheckCircle size={16} />
                Completed ({statusCounts['completed']})
              </Button>
            </div>

            {sortedVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2">No videos found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all'
                    ? "You haven't saved any videos to your learning list yet."
                    : `You don't have any ${filter.replace('-', ' ')} videos.`}
                </p>
                <Link to="/explore">
                  <Button>Explore Videos</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
          {showChat && (
            <div className="w-1/2">
              <LearningChatInterface title="AI Learning Chat" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLearningPage;