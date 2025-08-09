import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/search/SearchBar';
import VideoCard from '../components/video/VideoCard';
import { searchVideos } from '../services/youtubeService';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { Search as SearchIcon, BookOpen, GraduationCap, Sparkles, TrendingUp, Compass, ChevronRight, BookMarked, Award, Heart, Star, Users } from 'lucide-react';

const popularTopics = [
  'JavaScript complete course',
  'Python programming course',
  'Machine Learning course',
  'Web Development masterclass',
  'React complete tutorial',
  'Data Structures & Algorithms',
  'SQL for beginners full course',
  'Physics comprehensive course',
];

const featuredCategories = [
  { icon: <Sparkles size={20} />, name: 'Programming', query: 'Programming complete course' },
  { icon: <BookMarked size={20} />, name: 'Data Science', query: 'Data Science comprehensive tutorial' },
  { icon: <Award size={20} />, name: 'Web Development', query: 'Web Development masterclass' },
  { icon: <TrendingUp size={20} />, name: 'AI & Machine Learning', query: 'Machine Learning course' },
];

// Mock data for course popularity - in a real app, this would come from your backend
const courseLikes = {
  defaultLikes: { count: Math.floor(Math.random() * 500) + 100, isLiked: false },
  getForVideo: (videoId: string) => {
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
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views' | 'duration'>('relevance');
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
      
      // Initialize likes for search results
      const likesMap: Record<string, { count: number; isLiked: boolean }> = {};
      results.forEach(video => {
        likesMap[video.id] = courseLikes.getForVideo(video.id);
      });
      setVideoLikes(prev => ({ ...prev, ...likesMap }));
      
      // Scroll down to results if on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const convertISODurationToSeconds = (isoDuration: string) => {
    const hours = isoDuration.match(/(\d+)H/);
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    let totalSeconds = 0;
    if (hours) totalSeconds += parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1]);
    return totalSeconds;
  };

  const filteredAndSortedResults = useMemo(() => {
    let list = [...searchResults];

    // Category filter (basic: title/desc contains category name)
    if (selectedCategory) {
      const q = selectedCategory.toLowerCase();
      list = list.filter(v => (v.title + ' ' + v.description).toLowerCase().includes(q));
    }

    // Duration filter
    if (durationFilter !== 'all') {
      list = list.filter(v => {
        if (!('duration' in v) || !(v as any).duration) return true; // keep if unknown
        const secs = convertISODurationToSeconds((v as any).duration);
        if (durationFilter === 'short') return secs < 20 * 60;
        if (durationFilter === 'medium') return secs >= 20 * 60 && secs <= 120 * 60;
        if (durationFilter === 'long') return secs > 120 * 60;
        return true;
      });
    }

    // Sorting
    if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortBy === 'views') {
      list.sort((a: any, b: any) => (parseInt(b.viewCount || '0') || 0) - (parseInt(a.viewCount || '0') || 0));
    } else if (sortBy === 'duration') {
      list.sort((a: any, b: any) => convertISODurationToSeconds(b.duration || 'PT0S') - convertISODurationToSeconds(a.duration || 'PT0S'));
    }
    return list;
  }, [searchResults, selectedCategory, durationFilter, sortBy]);

  const handleTopicClick = (topic: string) => {
    handleSearch(topic);
  };

  const isVideoSaved = (videoId: string) => {
    return userVideos.some((v) => v.id === videoId);
  };

  // Toggle like for a video
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

  // Safe wrapper for saving videos
  const handleSaveVideo = async (video: Video) => {
    setSaveError(null);
    try {
      if (!user) {
        // Redirect to login and come back to this page after successful auth
        // Store pending save request so we can complete it after login
        try {
          sessionStorage.setItem('pending_save_video', JSON.stringify(video));
        } catch {}
        navigate('/login', { state: { from: location } });
        return;
      }
      
      await addVideo(video);
      console.log(`Video ${video.id} saved successfully`);
    } catch (error) {
      console.error('Error saving video:', error);
      setSaveError('Failed to save video. Please try again.');
    }
  };

  // If we came back from login with a pending save, complete it automatically
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem('pending_save_video');
      if (pending) {
        const pendingVideo: Video = JSON.parse(pending);
        // Avoid duplicates if it was already saved
        if (!userVideos.some(v => v.id === pendingVideo.id)) {
          addVideo(pendingVideo).finally(() => {
            sessionStorage.removeItem('pending_save_video');
          });
        } else {
          sessionStorage.removeItem('pending_save_video');
        }
      }
    } catch {}
  }, [user, userVideos, addVideo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-48 w-48 rounded-full bg-white blur-3xl"></div>
          <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-blue-300 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Find Your Perfect Learning Course
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover highly-rated courses loved by students worldwide. Search by topic and find the perfect course for your learning journey.
            </p>
            
            <div className="transition-all duration-300 hover:scale-[1.02]">
        <SearchBar 
          onSearch={handleSearch} 
          isLoading={isSearching} 
                placeholder="Search for top-rated courses..."
                className="shadow-xl"
        />
            </div>
            
            <p className="text-sm text-blue-200 mt-3">
          <GraduationCap className="inline-block mr-1" size={14} />
              Courses are ranked by student ratings and educational quality
        </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {/* Controls Row */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Filter by:</span>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              aria-label="Filter by duration"
            >
              <option value="all">All durations</option>
              <option value="short">Short (&lt; 20 min)</option>
              <option value="medium">Medium (20–120 min)</option>
              <option value="long">Long (&gt; 120 min)</option>
            </select>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {featuredCategories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white"
              aria-label="Sort results"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Newest</option>
              <option value="views">Most viewed</option>
              <option value="duration">Longest</option>
            </select>
          </div>
        </div>
        {saveError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 animate-fade-in">
            <div className="flex items-center">
              <div className="py-1">
                <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{saveError}</p>
              </div>
            </div>
          </div>
        )}

      {!searchQuery && (
        <>
            {/* Featured Categories */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <Compass className="mr-2 text-blue-600" />
                Featured Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredCategories.map((category) => (
                  <div 
                    key={category.name}
                    onClick={() => handleTopicClick(category.query)}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-3">
                      {category.icon}
                    </div>
                    <h3 className="font-medium text-gray-800">{category.name}</h3>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Trending Courses */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <TrendingUp className="mr-2 text-blue-600" />
                  Trending Courses
                </h2>
                <button 
                  onClick={() => handleTopicClick('top educational courses 2024')}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                >
                  View all <ChevronRight size={16} />
                </button>
              </div>
              
              {isTrendingLoading ? (
                <div className="flex justify-center">
                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="card animate-pulse w-full">
                        <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
                        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {trendingResults.map((video) => (
                      <div key={video.id} className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-sm">
                        <VideoCard
                          video={video}
                          onSave={user ? handleSaveVideo : undefined}
                          isSaved={isVideoSaved(video.id)}
                        />
                        <div className="p-3 pt-0 flex justify-between items-center border-t border-gray-100">
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleToggleLike(video.id)}
                              className={`flex items-center text-sm mr-3 ${videoLikes[video.id]?.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                            >
                              <Heart size={14} className={`mr-1 ${videoLikes[video.id]?.isLiked ? 'fill-current' : ''}`} />
                              {videoLikes[video.id]?.count || 0}
                            </button>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star size={14} className="mr-1 text-yellow-500" />
                              {(4 + Math.random()).toFixed(1)}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users size={14} className="mr-1" />
                            {Math.floor(Math.random() * 10000) + 1000} students
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Popular Topics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <BookOpen className="mr-2 text-blue-600" />
              Popular Course Topics
            </h2>
              <div className="flex flex-wrap gap-3 justify-center">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                    className="px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

        {/* Search Results */}
        <div id="search-results">
        {isSearching ? (
            <div className="mt-8">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
              <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card animate-pulse w-full">
              <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex justify-end">
                <div className="h-8 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
          ))}
                </div>
              </div>
        </div>
      ) : filteredAndSortedResults.length > 0 ? (
            <div className="mt-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <GraduationCap className="mr-2 text-blue-600" />
                Results for "{searchQuery}"
          </h2>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {filteredAndSortedResults.map((video) => (
                    <div key={video.id} className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-sm">
              <VideoCard
                video={video}
                onSave={user ? handleSaveVideo : undefined}
                isSaved={isVideoSaved(video.id)}
              />
                      <div className="p-3 pt-0 flex justify-between items-center border-t border-gray-100">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleToggleLike(video.id)}
                            className={`flex items-center text-sm mr-3 ${videoLikes[video.id]?.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                          >
                            <Heart size={14} className={`mr-1 ${videoLikes[video.id]?.isLiked ? 'fill-current' : ''}`} />
                            {videoLikes[video.id]?.count || 0}
                          </button>
                          <div className="flex items-center text-sm text-gray-500">
                            <Star size={14} className="mr-1 text-yellow-500" />
                            {(4 + Math.random()).toFixed(1)}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users size={14} className="mr-1" />
                          {Math.floor(Math.random() * 10000) + 1000} students
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          </div>
        </div>
      ) : searchQuery ? (
            <div className="text-center py-16 rounded-xl bg-white shadow-sm border border-gray-100 mt-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No courses found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No educational courses found for "{searchQuery}". Try a different search term or browse our popular topics.
          </p>
              <div className="mt-6">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  Browse popular topics
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;