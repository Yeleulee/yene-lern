import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Search } from 'lucide-react';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import Button from '../components/ui/Button';

import SavedLearningPlans from '../components/ui/SavedLearningPlans';

const MyLearningPage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, updateStatus, removeVideo, loading, error } = useLearning();
  const [filter, setFilter] = useState<'all' | 'to-learn' | 'in-progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'title'>('recommended');

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
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                  My Learning
                </h1>
                <p className="text-lg text-gray-500">
                  Track your progress and achieve your goals.
                </p>
              </div>

              {/* Stats Summary */}
              <div className="flex gap-4 md:gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{userVideos.length}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">{statusCounts['in-progress']}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{statusCounts['completed']}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Done</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Sidebar: Filters & Assistant */}
            <div className="lg:col-span-3 space-y-8">



              {/* Filters */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Filters</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between group ${filter === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span>All Courses</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>{userVideos.length}</span>
                  </button>

                  <button
                    onClick={() => setFilter('to-learn')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between group ${filter === 'to-learn' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><BookOpen size={16} /> To Learn</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${filter === 'to-learn' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>{statusCounts['to-learn']}</span>
                  </button>

                  <button
                    onClick={() => setFilter('in-progress')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between group ${filter === 'in-progress' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><Clock size={16} /> In Progress</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${filter === 'in-progress' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>{statusCounts['in-progress']}</span>
                  </button>

                  <button
                    onClick={() => setFilter('completed')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between group ${filter === 'completed' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><CheckCircle size={16} /> Completed</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${filter === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>{statusCounts['completed']}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content: Videos */}
            <div className="lg:col-span-9">
              {/* Saved Plans */}
              <SavedLearningPlans />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {filter === 'all' ? 'All Courses' : filter === 'to-learn' ? 'To Learn' : filter === 'in-progress' ? 'In Progress' : 'Completed'}
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recommended' | 'title')}
                    className="text-sm border-none bg-gray-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 cursor-pointer font-medium text-gray-700"
                    aria-label="Sort my learning"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="title">Title (Aâ€“Z)</option>
                  </select>
                </div>
              </div>

              {sortedVideos.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">No courses found</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {filter === 'all'
                      ? "You haven't saved any videos yet. Start exploring to build your learning path!"
                      : `No ${filter.replace('-', ' ')} courses found.`}
                  </p>
                  <Link to="/explore">
                    <Button className="btn-lg shadow-lg shadow-blue-500/20">
                      <Search size={18} className="mr-2" />
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedVideos.map((video) => (
                    <div key={video.id} className="h-full">
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLearningPage;
