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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    <div className="min-h-screen bg-white">
      {/* Clean Hero section */}
      <div className="relative bg-white py-20 overflow-hidden -mt-20 pt-20">
        {/* Subtle Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30" />
          <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gray-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gray-400/10 rounded-full blur-xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Clean Badge */}
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
              <Compass size={16} />
              EXPLORE COURSES
            </div>
            
            <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6 animate-slide-up" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Find Your Perfect
              <span className="block">Learning Course</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Discover highly-rated courses loved by students worldwide. Search by topic and find the perfect course for your learning journey.
            </p>
            
            <div className="max-w-2xl mx-auto mb-8 animate-slide-up">
              <SearchBar 
                onSearch={handleSearch} 
                isLoading={isSearching} 
                placeholder="Search for top-rated courses..."
                className="shadow-lg"
              />
            </div>
            
            {/* Clean Trust Indicators */}
            <div className="flex justify-center items-center gap-8 text-sm text-gray-500 animate-fade-in">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                <span>Courses are ranked by student ratings</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
          <div className="container mx-auto px-4 py-10">
        {/* Controls Row */}
        <div className="mb-6 hidden md:flex md:flex-row md:items-center md:justify-between gap-3">
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

        {/* Mobile sticky Filters button */}
        <div className="md:hidden">
          <div className="sticky top-0 z-10 -mt-4 mb-4 bg-gradient-to-b from-gray-50 to-transparent pt-2 pb-2">
            <div className="flex justify-end">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="btn btn-outline px-4 py-2"
                aria-label="Open filters"
              >
                Filters
              </button>
            </div>
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

        {/* Mobile Filters Bottom Sheet */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMobileFilters(false)}
              aria-label="Close filters"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4">
              <div className="h-1 w-12 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Duration</div>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value as any)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white"
                  aria-label="Filter by duration"
                >
                  <option value="all">All durations</option>
                  <option value="short">Short (&lt; 20 min)</option>
                  <option value="medium">Medium (20–120 min)</option>
                  <option value="long">Long (&gt; 120 min)</option>
                </select>
              </div>
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">Category</div>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white"
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {featuredCategories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <div className="text-sm font-medium mb-1">Sort by</div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white"
                  aria-label="Sort results"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Newest</option>
                  <option value="views">Most viewed</option>
                  <option value="duration">Longest</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline flex-1"
                  onClick={() => {
                    setDurationFilter('all');
                    setSelectedCategory(null);
                    setSortBy('relevance');
                  }}
                >
                  Reset
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

      {!searchQuery && (
        <>
            {/* Sleek Featured Categories */}
            <div className="mb-16">
              <h2 className="text-3xl font-light text-gray-900 mb-8 flex items-center justify-center" style={{ fontFamily: 'Dancing Script, cursive' }}>
                <Compass className="mr-3 text-gray-600" />
                Featured Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featuredCategories.map((category) => (
                  <div 
                    key={category.name}
                    onClick={() => handleTopicClick(category.query)}
                    className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 cursor-pointer transition-all duration-500 hover:shadow-lg hover:border-gray-200 hover:scale-105"
                  >
                    <div className="bg-black text-white p-4 rounded-full mb-4">
                      {category.icon}
                    </div>
                    <h3 className="font-medium text-gray-800">{category.name}</h3>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sleek Trending Courses */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-light text-gray-900 flex items-center" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  <TrendingUp className="mr-3 text-gray-600" />
                  Trending Courses
                </h2>
                <button 
                  onClick={() => handleTopicClick('top educational courses 2024')}
                  className="text-gray-600 hover:text-black flex items-center text-sm font-medium transition-colors"
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
            
            {/* Sleek Popular Topics */}
            <div className="mb-16">
              <h2 className="text-3xl font-light text-gray-900 mb-8 flex items-center justify-center" style={{ fontFamily: 'Dancing Script, cursive' }}>
                <BookOpen className="mr-3 text-gray-600" />
                Popular Course Topics
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className="px-6 py-3 bg-white rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 text-sm font-medium shadow-sm hover:scale-105"
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
                <GraduationCap className="mr-2 text-gray-700" />
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
            <SearchIcon size={32} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No courses found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No educational courses found for "{searchQuery}". Try a different search term or browse our popular topics.
          </p>
              <div className="mt-6">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
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