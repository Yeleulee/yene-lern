import React, { useState } from 'react';
import SearchBar from '../components/search/SearchBar';
import VideoCard from '../components/video/VideoCard';
import { searchVideos } from '../services/youtubeService';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { Search as SearchIcon, BookOpen, GraduationCap } from 'lucide-react';

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

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, addVideo } = useLearning();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const results = await searchVideos(query);
      setSearchResults(results);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
        <p className="text-gray-600">Discover comprehensive educational courses to enhance your learning</p>
      </div>

      {saveError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {saveError}
        </div>
      )}

      <div className="mb-8">
        <SearchBar 
          onSearch={handleSearch} 
          isLoading={isSearching} 
          placeholder="Search for high-quality, full courses..."
        />
        <p className="text-sm text-gray-500 mt-2">
          <GraduationCap className="inline-block mr-1" size={14} />
          We only show longer, high-quality educational courses
        </p>
      </div>

      {!searchQuery && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4 flex items-center">
              <BookOpen className="mr-2" size={20} />
              Popular Course Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isSearching ? (
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
      ) : searchResults.length > 0 ? (
        <div>
          <h2 className="text-xl font-medium mb-4 flex items-center">
            <GraduationCap className="mr-2" size={20} />
            Course Results for "{searchQuery}"
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
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No courses found</h3>
          <p className="text-gray-600">
            No educational courses found for "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ExplorePage;