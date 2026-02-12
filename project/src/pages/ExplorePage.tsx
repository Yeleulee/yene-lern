import React, { useState, useEffect } from 'react';
import exploreIllustration from '../assets/exploresection.png';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import VideoCard from '../components/video/VideoCard';
import { searchVideos } from '../services/youtubeService';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { GraduationCap, Sparkles, TrendingUp, Heart, Star, Users, Calendar, Award, CheckCircle, AlertCircle } from 'lucide-react';

const popularTopics = [
  'JavaScript', 'Python', 'Machine Learning', 'Web Development',
  'React', 'Data Science', 'SQL', 'Physics', 'Design', 'Business'
];

const featuredTags = [
  { icon: <Calendar size={14} />, label: '2025 Calendar' },
  { icon: <Award size={14} />, label: 'Free Certificates' },
  { icon: <CheckCircle size={14} />, label: '40% Off Premium' },
  { icon: <Sparkles size={14} />, label: 'AI-Powered' },
  { icon: <Users size={14} />, label: 'Personal Development' },
  { icon: <TrendingUp size={14} />, label: 'Business' },
  { icon: <GraduationCap size={14} />, label: 'Computer Science' },
];

// Mock data for course popularity
const courseLikes = {
  defaultLikes: { count: Math.floor(Math.random() * 500) + 100, isLiked: false },
  getForVideo: (_videoId: string) => {
    const randomLikes = Math.floor(Math.random() * 500) + 100;
    const randomIsLiked = Math.random() > 0.7;
    return { count: randomLikes, isLiked: randomIsLiked };
  }
};

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, addVideo } = useLearning();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [trendingResults, setTrendingResults] = useState<Video[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [videoLikes, setVideoLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});

  // Fetch trending videos on initial load
  useEffect(() => {
    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      try {
        const results = await searchVideos('top educational courses 2024');
        setTrendingResults(results.slice(0, 3));

        // Initialize likes for trending videos
        const likesMap: Record<string, { count: number; isLiked: boolean }> = {};
        results.slice(0, 3).forEach(video => {
          likesMap[video.id] = courseLikes.getForVideo(video.id);
        });
        setVideoLikes(prev => ({ ...prev, ...likesMap }));
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setIsTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const results = await searchVideos(query);
      setSearchResults(results);

      const likesMap: Record<string, { count: number; isLiked: boolean }> = {};
      results.forEach(video => {
        likesMap[video.id] = courseLikes.getForVideo(video.id);
      });
      setVideoLikes(prev => ({ ...prev, ...likesMap }));

      // Scroll to results
      setTimeout(() => {
        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const isVideoSaved = (videoId: string) => userVideos.some((v) => v.id === videoId);

  const handleToggleLike = (videoId: string) => {
    if (!user) return;
    setVideoLikes(prev => {
      const videoLike = prev[videoId] || courseLikes.defaultLikes;
      return {
        ...prev,
        [videoId]: {
          count: videoLike.isLiked ? videoLike.count - 1 : videoLike.count + 1,
          isLiked: !videoLike.isLiked
        }
      };
    });
  };

  const handleSaveVideo = async (video: Video) => {
    setSaveError(null);
    try {
      if (!user) {
        try {
          sessionStorage.setItem('pending_save_video', JSON.stringify(video));
        } catch { }
        navigate('/login', { state: { from: location } });
        return;
      }
      await addVideo(video);
    } catch (error) {
      console.error('Error saving video:', error);
      setSaveError('Failed to save video. Please try again.');
    }
  };

  // Handle pending saves
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem('pending_save_video');
      if (pending) {
        const pendingVideo: Video = JSON.parse(pending);
        if (!userVideos.some(v => v.id === pendingVideo.id)) {
          addVideo(pendingVideo).finally(() => {
            sessionStorage.removeItem('pending_save_video');
          });
        }
      }
    } catch { }
  }, [user, userVideos, addVideo]);

  return (
    <div className="min-h-screen bg-white">
      {/* Course Central Style Hero */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">

          {/* Left: Illustration (Placeholder for user's image) */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-fade-in text-center">

            <div className="relative w-full max-w-[720px] aspect-square lg:-mr-12">
              {/* Abstract background blobs for style */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

              {/* Image Container */}
              <div className="relative z-10 w-full h-full bg-white rounded-3xl flex items-center justify-center overflow-hidden">
                <img
                  src={exploreIllustration}
                  alt="Students Learning"
                  className="object-contain w-full h-full transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Right: Search & Content (Course Central Style) */}
          <div className="w-full lg:w-1/2 text-center lg:text-left animate-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Find your next course.
            </h1>

            <div className="max-w-xl mx-auto lg:mx-0 mb-4 relative z-20">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                placeholder="Search 250,000 courses..."
                className="shadow-xl border-gray-200 py-3"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 mb-8 text-sm text-gray-600">
              <span>Or browse by subject or university</span>
              <a href="#topics" className="font-semibold text-blue-600 hover:underline flex items-center">
                Learn more <CheckCircle size={14} className="ml-1" />
              </a>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Featured</h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {featuredTags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(tag.label)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all active:scale-95"
                  >
                    {tag.icon}
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="container mx-auto px-4 py-12" id="search-results">
        {saveError && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
            <AlertCircle size={20} />
            <span className="font-medium">{saveError}</span>
          </div>
        )}
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Results for "{searchQuery}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.map((video) => (
                <div key={video.id} className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <VideoCard
                    video={video}
                    onSave={user ? handleSaveVideo : undefined}
                    isSaved={isVideoSaved(video.id)}
                  />
                  <div className="p-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleToggleLike(video.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <Heart size={16} className={videoLikes[video.id]?.isLiked ? "fill-red-500 text-red-500" : ""} />
                        {videoLikes[video.id]?.count}
                      </button>
                      <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400 fill-yellow-400" /> 4.8</span>
                    </div>
                    <span className="flex items-center gap-1"><Users size={16} /> 1.2k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Section (Only show if no search) */}
        {!searchQuery && (
          <>
            <div className="mb-20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Trending Courses</h2>
                <button className="text-blue-600 font-medium hover:underline">View all</button>
              </div>

              {isTrendingLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {trendingResults.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                      <VideoCard
                        video={video}
                        onSave={user ? handleSaveVideo : undefined}
                        isSaved={isVideoSaved(video.id)}
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{video.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{video.channelTitle}</p>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase">Course</span>
                          <div className="flex items-center text-sm text-gray-500 gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" /> 4.9
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Topics Pills */}
            <div id="topics" className="mb-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Popular Topics</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {popularTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleSearch(topic)}
                    className="px-6 py-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-700 font-medium transition-all hover:shadow-md active:scale-95"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
