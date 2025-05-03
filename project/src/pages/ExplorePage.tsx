import React, { useState, useEffect } from 'react';
import SearchBar from '../components/search/SearchBar';
import VideoCard from '../components/video/VideoCard';
import { searchVideos } from '../services/youtubeService';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { Search as SearchIcon, BookOpen, GraduationCap, Sparkles, TrendingUp, Compass, ChevronRight, BookMarked, Award } from 'lucide-react';

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

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, addVideo } = useLearning();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [trendingResults, setTrendingResults] = useState<Video[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // Fetch trending videos on initial load
  useEffect(() => {
    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      try {
        const results = await searchVideos('top educational courses 2024');
        setTrendingResults(results.slice(0, 3));
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

  const handleTopicClick = (topic: string) => {
    handleSearch(topic);
  };

  const isVideoSaved = (videoId: string) => {
    return userVideos.some((v) => v.id === videoId);
  };

  // Safe wrapper for saving videos
  const handleSaveVideo = async (video: Video) => {
    setSaveError(null);
    try {
      if (!user) {
        console.log('User not logged in, redirecting to login page');
        return;
      }
      
      await addVideo(video);
      console.log(`Video ${video.id} saved successfully`);
    } catch (error) {
      console.error('Error saving video:', error);
      setSaveError('Failed to save video. Please try again.');
    }
  };

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
              Discover Your Learning Path
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Explore comprehensive educational courses curated to help you master new skills and advance your career.
            </p>
            
            <div className="transition-all duration-300 hover:scale-[1.02]">
              <SearchBar 
                onSearch={handleSearch} 
                isLoading={isSearching} 
                placeholder="Search for high-quality, full courses..."
                className="shadow-xl"
              />
            </div>
            
            <p className="text-sm text-blue-200 mt-3">
              <GraduationCap className="inline-block mr-1" size={14} />
              We prioritize detailed, comprehensive educational content
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
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
                <div className="grid md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {trendingResults.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onSave={user ? handleSaveVideo : undefined}
                      isSaved={isVideoSaved(video.id)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Popular Topics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <BookOpen className="mr-2 text-blue-600" />
                Popular Course Topics
              </h2>
              <div className="flex flex-wrap gap-3">
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
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
          ) : searchResults.length > 0 ? (
            <div className="mt-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <GraduationCap className="mr-2 text-blue-600" />
                Courses for "{searchQuery}"
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onSave={user ? handleSaveVideo : undefined}
                    isSaved={isVideoSaved(video.id)}
                  />
                ))}
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